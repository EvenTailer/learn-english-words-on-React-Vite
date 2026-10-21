import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import cardsReducer from '../words/wordsSlice';
import progressReducer, { wordAnswered } from '../progress/progressSlice';
import settingsReducer from '../settings/settingsSlice';
import statsReducer from '../stats/statsSlice';
import uiReducer from '../ui/toastSlice';
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

const makeStore = (items = CARDS, settings = { theme: 'dark', dailyGoal: 20, direction: 'mixed' }) =>
  configureStore({
    reducer: {
      cards: cardsReducer,
      learn: learnReducer,
      progress: progressReducer,
      stats: statsReducer,
      ui: uiReducer,
      settings: settingsReducer,
    },
    preloadedState: { cards: { items }, settings },
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

  it('уважает выбранное направление перевода', () => {
    const store = makeStore(CARDS, {
      theme: 'dark',
      dailyGoal: 20,
      direction: 'ru-en',
    });
    store.dispatch(startLearn());
    expect(store.getState().learn.mode).toBe('rus');
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
    expect(store.getState().ui.toast.type).toBe('error');
    expect(store.getState().learn.session.wrong).toBe(1);
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
    expect(store.getState().learn.session.correct).toBe(1);
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
    expect(store.getState().ui.toast.message).toBe('Вы ничего не ответили');
    expect(store.getState().cards.items[0].count).toBe(0);
  });

  it('на пятом правильном ответе помечает слово изученным, но не удаляет его', () => {
    const store = makeStore([
      {
        id: 'a',
        englishWord: 'lion',
        russianWord: 'лев',
        linkImg: '',
        count: 4,
      },
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

    answer(store, correctAnswerFor(store));

    const items = store.getState().cards.items;
    expect(items.map((c) => c.id)).toContain(card.id);

    const progress = store.getState().progress.words[card.englishWord];
    expect(progress.status).toBe('mastered');
    expect(progress.correct).toBe(5);
    expect(store.getState().learn.session.learned).toBe(1);
  });

  it('выученное слово не попадает в новую сессию', () => {
    const store = makeStore(CARDS, {
      theme: 'dark',
      dailyGoal: 20,
      direction: 'en-ru',
    });
    store.dispatch(startLearn());
    const card = currentCardOf(store);

    // помечаем слово изученным
    store.dispatch(
      wordAnswered({
        englishWord: card.englishWord,
        russianWord: card.russianWord,
        correct: true,
        count: 5,
      })
    );

    store.dispatch(startLearn());
    expect(store.getState().learn.queue).not.toContain(card.id);
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
    expect(store.getState().learn.session.skipped).toBe(1);
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
    expect(store.getState().ui.toast.type).toBe('info');
  });
});
