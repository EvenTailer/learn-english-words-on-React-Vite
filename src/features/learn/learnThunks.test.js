import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import cardsReducer from '../words/wordsSlice';
import learnReducer, { answerChanged, learnStarted } from './learnSlice';
import { checkAnswer, revealAnswer, skipCard, startLearn } from './learnThunks';

const CARDS = [
  { id: 'a', englishWord: 'lion', russianWord: 'лев', linkImg: '', count: 0 },
  {
    id: 'b',
    englishWord: 'monkey',
    russianWord: 'обезьяна',
    linkImg: '',
    count: 0,
  },
  {
    id: 'c',
    englishWord: 'crocodile',
    russianWord: 'крокодил',
    linkImg: '',
    count: 0,
  },
];

const makeStore = (items = CARDS) =>
  configureStore({
    reducer: { cards: cardsReducer, learn: learnReducer },
    preloadedState: { cards: { items } },
  });

const currentCardOf = (store) =>
  store.getState().cards.items.find(
    (card) => card.id === store.getState().learn.currentCardId
  );

const correctAnswerFor = (store) => {
  const { mode } = store.getState().learn;
  const card = currentCardOf(store);
  return mode === 'eng' ? card.russianWord : card.englishWord;
};

const answer = (store, value) => {
  store.dispatch(answerChanged(value));
  store.dispatch(checkAnswer());
};

describe('startLearn', () => {
  it('выбирает карточку и строит очередь', () => {
    const store = makeStore();
    store.dispatch(startLearn());
    const { currentCardId, queue } = store.getState().learn;
    expect(CARDS.map((c) => c.id)).toContain(currentCardId);
    expect(queue).toHaveLength(3);
  });

  it('без карточек сразу завершает сессию', () => {
    const store = makeStore([]);
    store.dispatch(startLearn());
    expect(store.getState().learn.finished).toBe(true);
  });
});

describe('checkAnswer', () => {
  it('при неверном ответе остаётся на той же карточке', () => {
    const store = makeStore();
    store.dispatch(startLearn());
    const before = store.getState().learn.currentCardId;

    answer(store, 'точно неверно');

    expect(store.getState().learn.currentCardId).toBe(before);
    expect(store.getState().cards.items[0].count).toBe(0);
    expect(store.getState().learn.toast.type).toBe('error');
  });

  it('при верном ответе увеличивает счётчик и меняет карточку', () => {
    const store = makeStore();
    store.dispatch(startLearn());
    const before = store.getState().learn.currentCardId;
    const card = currentCardOf(store);

    answer(store, correctAnswerFor(store));

    const answered = store
      .getState()
      .cards.items.find((item) => item.id === card.id);
    expect(answered.count).toBe(1);
    expect(store.getState().learn.currentCardId).not.toBe(before);
  });

  it('принимает вариант ответа из карточки', () => {
    const store = makeStore([
      {
        id: 'a',
        englishWord: 'lion',
        russianWord: 'лев/львы',
        linkImg: '',
        count: 0,
      },
    ]);
    store.dispatch(startLearn());
    // фиксируем режим: показываем английское слово, ждём русский перевод
    store.dispatch(learnStarted({ id: 'a', mode: 'eng', queue: ['a'] }));

    answer(store, 'львы');

    expect(store.getState().cards.items[0].count).toBe(1);
  });

  it('не принимает пустой ответ', () => {
    const store = makeStore();
    store.dispatch(startLearn());
    answer(store, '   ');
    expect(store.getState().learn.toast.message).toBe('Вы ничего не ответили');
    expect(store.getState().cards.items[0].count).toBe(0);
  });

  it('на пятом правильном ответе удаляет карточку', () => {
    const store = makeStore([
      { id: 'a', englishWord: 'lion', russianWord: 'лев', linkImg: '', count: 4 },
      {
        id: 'b',
        englishWord: 'monkey',
        russianWord: 'обезьяна',
        linkImg: '',
        count: 4,
      },
    ]);
    store.dispatch(startLearn());
    const card = currentCardOf(store);
    const answerValue = correctAnswerFor(store);

    store.dispatch(answerChanged(answerValue));
    store.dispatch(checkAnswer());

    expect(store.getState().cards.items.map((c) => c.id)).not.toContain(card.id);
  });

  it('завершает сессию, когда карточек не осталось', () => {
    const store = makeStore([
      { id: 'a', englishWord: 'lion', russianWord: 'лев', linkImg: '', count: 4 },
    ]);
    store.dispatch(startLearn());
    answer(store, correctAnswerFor(store));
    expect(store.getState().learn.finished).toBe(true);
  });
});

describe('skipCard', () => {
  it('меняет карточку, не меняя счётчик', () => {
    const store = makeStore();
    store.dispatch(startLearn());
    const before = store.getState().learn.currentCardId;

    store.dispatch(skipCard());

    expect(store.getState().learn.currentCardId).not.toBe(before);
    expect(store.getState().cards.items[0].count).toBe(0);
  });
});

describe('revealAnswer', () => {
  it('показывает правильный ответ и не меняет карточку', () => {
    const store = makeStore();
    store.dispatch(startLearn());
    const before = store.getState().learn.currentCardId;

    store.dispatch(revealAnswer());

    expect(store.getState().learn.revealed).toBe(true);
    expect(store.getState().learn.currentCardId).toBe(before);
    expect(store.getState().learn.toast.type).toBe('info');
  });
});
