import { describe, expect, it } from 'vitest';
import {
  ANSWER_MODES,
  DEFAULT_PLAN,
  LEARN_SOURCES,
  buildChoices,
  buildPlanQueue,
  pickMode,
  selectPool,
} from './plan';

const CARDS = [
  { id: 'a', englishWord: 'apple', russianWord: 'яблоко' },
  { id: 'b', englishWord: 'book', russianWord: 'книга' },
  { id: 'c', englishWord: 'cat', russianWord: 'кот' },
];

const progressMap = {
  apple: { status: 'learning', wrong: 2, correct: 1, dueAt: Date.now() + 86_400_000 },
  book: { status: 'mastered', wrong: 0, correct: 5, dueAt: Date.now() + 86_400_000 },
  cat: { status: 'new', wrong: 0, correct: 0, dueAt: null },
};

describe('selectPool', () => {
  it('в режиме «все слова» убирает выученные, но не просроченные', () => {
    const pool = selectPool(CARDS, { progressMap, plan: DEFAULT_PLAN });
    expect(pool.map((card) => card.id)).toEqual(['a', 'c']);
  });

  it('в режиме «к повторению» берёт только просроченные', () => {
    const pool = selectPool(CARDS, {
      progressMap: { ...progressMap, apple: { ...progressMap.apple, dueAt: 1 } },
      plan: { ...DEFAULT_PLAN, source: LEARN_SOURCES.DUE },
    });
    expect(pool.map((card) => card.id)).toEqual(['a', 'c']);
  });

  it('в режиме «ошибки» берёт слова с ошибками', () => {
    const pool = selectPool(CARDS, {
      progressMap,
      plan: { ...DEFAULT_PLAN, source: LEARN_SOURCES.ERRORS },
    });
    expect(pool.map((card) => card.id)).toEqual(['a']);
  });

  it('в режиме «новые» берёт не начатые слова', () => {
    const pool = selectPool(CARDS, {
      progressMap,
      plan: { ...DEFAULT_PLAN, source: LEARN_SOURCES.NEW },
    });
    expect(pool.map((card) => card.id)).toEqual(['c']);
  });

  it('в режиме «свой список» берёт слова из списка', () => {
    const pool = selectPool(CARDS, {
      progressMap,
      plan: { ...DEFAULT_PLAN, source: LEARN_SOURCES.LIST },
      listWords: [{ englishWord: 'book' }, { englishWord: 'cat' }],
    });
    expect(pool.map((card) => card.id)).toEqual(['b', 'c']);
  });

  it('в режиме «набор» берёт слова этого набора', () => {
    const cards = [{ ...CARDS[0], sets: ['top250'] }, CARDS[1]];
    const pool = selectPool(cards, {
      plan: { ...DEFAULT_PLAN, source: LEARN_SOURCES.SET, setKey: 'top250' },
    });
    expect(pool.map((card) => card.id)).toEqual(['a']);
  });
});

describe('buildPlanQueue', () => {
  it('режет очередь по размеру', () => {
    const queue = buildPlanQueue(CARDS, {
      plan: { ...DEFAULT_PLAN, size: 2 },
    });
    expect(queue).toHaveLength(2);
  });

  it('размер «all» забирает весь пул', () => {
    const queue = buildPlanQueue(CARDS, {
      plan: { ...DEFAULT_PLAN, size: 'all' },
    });
    expect(queue).toHaveLength(3);
  });
});

describe('buildChoices', () => {
  it('включает правильный ответ и не повторяет его', () => {
    const choices = buildChoices(CARDS[0], CARDS, 4);
    expect(choices).toContain('яблоко');
    expect(new Set(choices).size).toBe(choices.length);
  });
});

describe('pickMode', () => {
  it('в режиме выбора спрашивает по-английски', () => {
    expect(pickMode('ru-en', ANSWER_MODES.CHOICE)).toBe('eng');
  });

  it('в аудио-режиме ответ — английское слово', () => {
    expect(pickMode('en-ru', ANSWER_MODES.AUDIO)).toBe('rus');
  });
});
