import { isAnswerMatch } from '../../shared/lib/answerNormalizer';
import { selectCards } from '../words/selectors';
import { cardCountIncremented, cardRemoved } from '../words/wordsSlice';
import { answerRevealed, learnFinished, learnStarted, toastShown } from './learnSlice';
import { advanceQueue, buildQueue, pickFromQueue } from './session';

const randomMode = () => (Math.random() < 0.5 ? 'eng' : 'rus');

const correctAnswerOf = (card, mode) =>
  mode === 'eng' ? card.russianWord : card.englishWord;

export const startLearn = () => (dispatch, getState) => {
  const items = selectCards(getState());
  if (items.length === 0) {
    dispatch(learnFinished());
    return;
  }
  const queue = buildQueue(items);
  dispatch(learnStarted({ id: queue[0], mode: randomMode(), queue }));
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

  // Ошиблись — остаёмся на той же карточке, чтобы не терять прогресс
  if (!isAnswerMatch(answer, correct)) {
    dispatch(
      toastShown({
        message: `Неправильно! Правильный ответ: ${correct}`,
        type: 'error',
      })
    );
    return;
  }

  // Пятый правильный ответ — карточка изучена и удаляется
  if ((card.count ?? 0) >= 4) {
    dispatch(cardRemoved(card.id));
    const left = items.filter((item) => item.id !== card.id);
    if (left.length === 0) {
      dispatch(learnFinished());
      dispatch(
        toastShown({ message: 'Карточки закончились 🎉', type: 'success' })
      );
      return;
    }
    const nextQueue = queue.filter((id) => id !== card.id);
    const nextId = pickFromQueue(
      nextQueue,
      left.map((item) => item.id)
    );
    dispatch(learnStarted({ id: nextId, mode: randomMode(), queue: nextQueue }));
    dispatch(
      toastShown({
        message: 'Правильно! Карточка изучена и удалена',
        type: 'success',
      })
    );
    return;
  }

  dispatch(cardCountIncremented(card.id));
  const nextQueue = advanceQueue(queue, card.id);
  const nextId = pickFromQueue(
    nextQueue,
    items.map((item) => item.id)
  );
  dispatch(learnStarted({ id: nextId, mode: randomMode(), queue: nextQueue }));
  dispatch(toastShown({ message: 'Правильно!', type: 'success' }));
};

export const skipCard = () => (dispatch, getState) => {
  const state = getState();
  const { currentCardId, queue } = state.learn;
  const items = selectCards(state);
  if (!currentCardId) return;

  const nextQueue = advanceQueue(queue, currentCardId);
  const nextId = pickFromQueue(
    nextQueue,
    items.map((item) => item.id)
  );
  if (!nextId) {
    dispatch(learnFinished());
    return;
  }
  dispatch(learnStarted({ id: nextId, mode: randomMode(), queue: nextQueue }));
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
