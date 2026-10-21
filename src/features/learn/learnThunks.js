import { isAnswerMatch } from '../../shared/lib/answerNormalizer';
import { toISODate } from '../../shared/lib/date';
import { MASTERY_THRESHOLD, wordAnswered } from '../progress/progressSlice';
import { statsIncremented, streakUpdated } from '../stats/statsSlice';
import { computeStreak } from '../stats/streak';
import { toastShown } from '../ui/toastSlice';
import { selectCards } from '../words/selectors';
import { cardCountIncremented } from '../words/wordsSlice';
import {
  answerChanged,
  answerRevealed,
  verdictCleared,
  verdictSet,
  learnFinished,
  learnStarted,
  sessionReset,
  sessionStatAdded,
} from './learnSlice';
import {
  ANSWER_MODES,
  DEFAULT_PLAN,
  LEARN_SOURCES,
  buildChoices,
  buildPlanQueue,
  pickMode,
} from './plan';
import { pickFromQueue } from './session';

const correctAnswerOf = (card, mode) =>
  mode === 'eng' ? card.russianWord : card.englishWord;

// Слова выбранного своего списка — для источника «Мои наборы»
const listWordsOf = (state, plan) => {
  if (plan.source !== LEARN_SOURCES.LIST) return [];
  const list = state.lists?.items?.find((item) => item.id === plan.listId);
  return list?.words ?? [];
};

// План по умолчанию + направление из настроек
const resolvePlan = (state, plan) => ({
  ...DEFAULT_PLAN,
  ...(plan ?? {}),
  direction: plan?.direction ?? state.settings.direction,
});

// Запускает карточку: режим вопроса + варианты ответа
const startCard = (dispatch, getState, { id, queue, plan }) => {
  const state = getState();
  const items = selectCards(state);
  const card = items.find((item) => item.id === id);
  const mode = pickMode(plan.direction, plan.answerMode);
  const choices =
    plan.answerMode === ANSWER_MODES.CHOICE
      ? buildChoices(card, items)
      : [];

  dispatch(
    learnStarted({
      id,
      mode,
      queue,
      choices,
      plan,
      answerMode: plan.answerMode,
    })
  );
};

export const startLearn = (plan) => (dispatch, getState) => {
  const state = getState();
  const effectivePlan = resolvePlan(state, plan);
  const items = selectCards(state);

  const queue = buildPlanQueue(items, {
    progressMap: state.progress.words,
    plan: effectivePlan,
    now: Date.now(),
    listWords: listWordsOf(state, effectivePlan),
  });

  if (queue.length === 0) {
    dispatch(
      toastShown({
        message: 'В этом источнике нет слов — выберите другой',
        type: 'info',
      })
    );
    dispatch(learnFinished());
    return;
  }

  dispatch(sessionReset({ total: queue.length }));
  startCard(dispatch, getState, {
    id: queue[0],
    queue,
    plan: effectivePlan,
  });
};

export const checkAnswer = () => (dispatch, getState) => {
  const state = getState();
  const { currentCardId, mode, answer } = state.learn;
  const items = selectCards(state);
  const card = items.find((item) => item.id === currentCardId);
  if (!card) return;

  if (String(answer).trim() === '') {
    dispatch(toastShown({ message: 'Вы ничего не ответили', type: 'error' }));
    return;
  }

  const correct = correctAnswerOf(card, mode);
  dispatch(sessionStatAdded({ kind: 'answered' }));

  // Ошиблись — карточка остаётся на экране, чтобы показать вердикт
  if (!isAnswerMatch(answer, correct)) {
    dispatch(
      wordAnswered({
        englishWord: card.englishWord,
        russianWord: card.russianWord,
        correct: false,
      })
    );
    dispatch(statsIncremented({ date: toISODate(), wrong: 1 }));
    updateStreak(dispatch, getState);
    dispatch(sessionStatAdded({ kind: 'wrong' }));
    dispatch(
      verdictSet({
        correct: false,
        answer: correct,
        mastered: false,
      })
    );
    return;
  }

  dispatch(
    wordAnswered({
      englishWord: card.englishWord,
      russianWord: card.russianWord,
      correct: true,
      count: (card.count ?? 0) + 1,
    })
  );

  const mastered = isMasteredWord(getState(), card);
  dispatch(
    statsIncremented({
      date: toISODate(),
      correct: 1,
      learned: mastered ? 1 : 0,
    })
  );
  updateStreak(dispatch, getState);
  dispatch(sessionStatAdded({ kind: 'correct' }));

  if (mastered) {
    dispatch(cardCountIncremented(card.id));
    dispatch(sessionStatAdded({ kind: 'learned' }));
  } else {
    dispatch(cardCountIncremented(card.id));
  }

  // Вердикт на карточке: пользователь видит результат до перехода дальше
  dispatch(
    verdictSet({
      correct: true,
      answer: correct,
      mastered,
    })
  );
};

// Переход к следующей карточке после показанного вердикта
export const nextCard = () => (dispatch, getState) => {
  const state = getState();
  const { currentCardId, queue } = state.learn;
  if (!currentCardId) return;

  dispatch(verdictCleared());
  moveToNextCard(dispatch, getState, currentCardId, queue);
};

// Слово освоено, когда верно ответили 5 раз подряд в разных сессиях
const isMasteredWord = (state, card) => {
  const key = String(card.englishWord ?? '').trim().toLowerCase();
  const entry = state.progress.words[key];
  return (entry?.streak ?? 0) >= MASTERY_THRESHOLD;
};

// Переход к следующей карточке: отвеченная удаляется из очереди
const moveToNextCard = (dispatch, getState, cardId, queue) => {
  const nextQueue = queue.filter((id) => id !== cardId);
  const available = new Set(
    selectCards(getState())
      .filter((item) => {
        const entry = getState().progress.words[
          String(item.englishWord ?? '').trim().toLowerCase()
        ];
        return entry?.status !== 'mastered';
      })
      .map((item) => item.id)
  );
  const nextId = pickFromQueue(nextQueue, available);

  if (!nextId) {
    dispatch(learnFinished());
    return;
  }

  startCard(dispatch, getState, {
    id: nextId,
    queue: nextQueue,
    plan: getState().learn.plan ?? DEFAULT_PLAN,
  });
  finishIfDone(dispatch, getState);
};

export const skipCard = () => (dispatch, getState) => {
  const state = getState();
  const { currentCardId, queue } = state.learn;
  if (!currentCardId) return;

  dispatch(sessionStatAdded({ kind: 'answered' }));
  dispatch(sessionStatAdded({ kind: 'skipped' }));

  // Пропущенная карточка покидает сессию, вердикт прошлого ответа сбрасываем
  dispatch(verdictCleared());
  moveToNextCard(dispatch, getState, currentCardId, queue);
};

export const revealAnswer = () => (dispatch, getState) => {
  const state = getState();
  const { currentCardId } = state.learn;
  const card = selectCards(state).find((item) => item.id === currentCardId);
  if (!card) return;
  // Ответ показывается прямо на карточке — тост не нужен
  dispatch(verdictCleared());
  dispatch(answerRevealed());
};

// Выбран вариант ответа — подставляем его в поле, проверку запускает пользователь
export const chooseAnswer = (value) => (dispatch) => {
  dispatch(answerChanged(value));
};

// Сессия закончилась, если ответов столько же, сколько карточек в очереди
const finishIfDone = (dispatch, getState) => {
  const { session } = getState().learn;
  if (session.total > 0 && session.answered >= session.total) {
    dispatch(learnFinished());
  }
};

// Серия дней пересчитывается после каждого ответа
const updateStreak = (dispatch, getState) => {
  const { history } = getState().stats;
  dispatch(streakUpdated(computeStreak(history, toISODate())));
};
