import { selectCards } from '../words/selectors';
import { cardCountIncremented, cardRemoved } from '../words/wordsSlice';
import { learnFinished, learnStarted, toastShown } from './learnSlice';

const randomMode = () => (Math.random() < 0.5 ? 'eng' : 'rus');

// Случайная карточка, кроме текущей (если есть из чего выбирать)
const pickNextCard = (items, excludeId) => {
  if (items.length === 0) return null;
  const pool =
    items.length > 1 ? items.filter((card) => card.id !== excludeId) : items;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const startLearn = () => (dispatch, getState) => {
  const items = selectCards(getState());
  const card = pickNextCard(items, null);
  if (!card) {
    dispatch(learnFinished());
    return;
  }
  dispatch(learnStarted({ id: card.id, mode: randomMode() }));
};

export const checkAnswer = () => (dispatch, getState) => {
  const state = getState();
  const items = selectCards(state);
  const card = items.find((item) => item.id === state.learn.currentCardId);
  if (!card) return;

  const answer = state.learn.answer.trim().toLowerCase();
  const correct =
    state.learn.mode === 'eng'
      ? card.russianWord.toLowerCase()
      : card.englishWord.toLowerCase();

  if (answer === '') {
    dispatch(toastShown({ message: 'Вы ничего не ответили', type: 'error' }));
    return;
  }

  if (answer === correct) {
    // Пятый правильный ответ — карточка изучена и удаляется
    if (card.count >= 4) {
      dispatch(cardRemoved(card.id));
      const left = items.filter((item) => item.id !== card.id);
      if (left.length === 0) {
        dispatch(learnFinished());
        dispatch(
          toastShown({ message: 'Карточки закончились 🎉', type: 'success' })
        );
        return;
      }
      const next = pickNextCard(left, card.id);
      dispatch(learnStarted({ id: next.id, mode: randomMode() }));
      dispatch(
        toastShown({
          message: 'Правильно! Карточка изучена и удалена',
          type: 'success',
        })
      );
      return;
    }

    dispatch(cardCountIncremented(card.id));
    const next = pickNextCard(items, card.id);
    dispatch(learnStarted({ id: next.id, mode: randomMode() }));
    dispatch(toastShown({ message: 'Правильно!', type: 'success' }));
    return;
  }

  const next = pickNextCard(items, card.id);
  if (next) dispatch(learnStarted({ id: next.id, mode: randomMode() }));
  dispatch(
    toastShown({
      message: `Неправильно! Правильный ответ: ${correct}`,
      type: 'error',
    })
  );
};
