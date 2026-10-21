import { isAnswerMatch } from '../../shared/lib/answerNormalizer';
import { toISODate } from '../../shared/lib/date';
import { MASTERY_THRESHOLD, wordAnswered } from '../progress/progressSlice';
import { statsIncremented, streakUpdated } from '../stats/statsSlice';
import { computeStreak } from '../stats/streak';
import { toastShown } from '../ui/toastSlice';
import { selectCards } from '../words/selectors';
import { cardCountIncremented } from '../words/wordsSlice';
import {
  answerRevealed,
  learnFinished,
  learnStarted,
  sessionReset,
  sessionStatAdded,
} from './learnSlice';
import { advanceQueue, buildQueue, pickFromQueue } from './session';

const correctAnswerOf = (card, mode) =>
  mode === 'eng' ? card.russianWord : card.englishWord;

// Направление перевода: mixed — случайно, en-ru / ru-en — как выбрал пользователь
const pickMode = (direction) => {
  if (direction === 'en-ru') return 'eng';
  if (direction === 'ru-en') return 'rus';
  return Math.random() < 0.5 ? 'eng' : 'rus';
};

// Выученные слова не попадают в новую сессию
const availableCards = (state) => {
  const progress = state.progress.words;
  return selectCards(state).filter(
    (card) => progress[card.englishWord?.toLowerCase()]?.status !== 'mastered'
  );
};

export const startLearn = () => (dispatch, getState) => {
  const state = getState();
  const items = availableCards(state);
  if (items.length === 0) {
    dispatch(learnFinished());
    return;
  }

  const queue = buildQueue(items);
  dispatch(sessionReset({ total: queue.length }));
  dispatch(
    learnStarted({
      id: queue[0],
      mode: pickMode(state.settings.direction),
      queue,
    })
  );
};

export const checkAnswer = () => (dispatch, getState) => {
  const state = getState();
  const { currentCardId, mode, answer, queue } = state.learn;
  const items = selectCards(state);
  const card = items.find((item) => item.id === currentCardId);
  if (!card) return;

  if (answer.trim() === '') {
    dispatch(toastShown({ message: 'Вы ничего не ответили', type: 'error' }));
    return;
  }

  const correct = correctAnswerOf(card, mode);
  dispatch(sessionStatAdded({ kind: 'answered' }));

  // Ошиблись — остаёмся на той же карточке, чтобы не терять прогресс
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
      toastShown({
        message: `Неправильно! Правильный ответ: ${correct}`,
        type: 'error',
      })
    );
    finishIfDone(dispatch, getState);
    return;
  }

  const isMastered = (card.count ?? 0) >= MASTERY_THRESHOLD - 1;

  dispatch(
    wordAnswered({
      englishWord: card.englishWord,
      russianWord: card.russianWord,
      correct: true,
      count: (card.count ?? 0) + 1,
    })
  );
  dispatch(
    statsIncremented({
      date: toISODate(),
      correct: 1,
      learned: isMastered ? 1 : 0,
    })
  );
  updateStreak(dispatch, getState);
  dispatch(sessionStatAdded({ kind: 'correct' }));

  if (isMastered) {
    dispatch(cardCountIncremented(card.id));
    dispatch(sessionStatAdded({ kind: 'learned' }));
    dispatch(
      toastShown({
        message: 'Правильно! Слово выучено 🎉',
        type: 'success',
      })
    );
  } else {
    dispatch(cardCountIncremented(card.id));
    dispatch(toastShown({ message: 'Правильно!', type: 'success' }));
  }

  // Верный ответ убирает карточку из текущей сессии, ошибка — возвращает в конец
  const nextQueue = isMastered
    ? queue.filter((id) => id !== card.id)
    : advanceQueue(queue, card.id);
  const available = new Set(
    availableCards(getState()).map((item) => item.id)
  );
  const nextId = pickFromQueue(nextQueue, available);

  if (!nextId) {
    dispatch(learnFinished());
    return;
  }

  dispatch(
    learnStarted({
      id: nextId,
      mode: pickMode(getState().settings.direction),
      queue: nextQueue,
    })
  );
  finishIfDone(dispatch, getState);
};

export const skipCard = () => (dispatch, getState) => {
  const state = getState();
  const { currentCardId, queue } = state.learn;
  const items = selectCards(state);
  if (!currentCardId) return;

  dispatch(sessionStatAdded({ kind: 'answered' }));
  dispatch(sessionStatAdded({ kind: 'skipped' }));

  const nextQueue = advanceQueue(queue, currentCardId);
  const available = new Set(items.map((item) => item.id));
  const nextId = pickFromQueue(nextQueue, available);
  if (!nextId) {
    dispatch(learnFinished());
    return;
  }
  dispatch(
    learnStarted({
      id: nextId,
      mode: pickMode(getState().settings.direction),
      queue: nextQueue,
    })
  );
  finishIfDone(dispatch, getState);
};

export const revealAnswer = () => (dispatch, getState) => {
  const state = getState();
  const { currentCardId, mode } = state.learn;
  const card = selectCards(state).find((item) => item.id === currentCardId);
  if (!card) return;
  dispatch(answerRevealed());
  dispatch(
    toastShown({
      message: `Правильный ответ: ${correctAnswerOf(card, mode)}`,
      type: 'info',
    })
  );
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
