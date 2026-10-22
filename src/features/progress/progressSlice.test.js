import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, {
  wordAdded,
  wordAnswered,
  wordRemoved,
  wordsAdded,
} from './progressSlice';

const key = (word) => word.trim().toLowerCase();

// Ответ на один и тот же день засчитывается в серию только раз
const advanceDays = (days) =>
  vi.setSystemTime(new Date(Date.now() + days * 24 * 60 * 60 * 1000));

describe('progressSlice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('добавляет новое слово со статусом new', () => {
    const state = reducer(
      undefined,
      wordAdded({ englishWord: 'Lion', russianWord: 'лев' })
    );
    expect(state.words[key('Lion')].status).toBe('new');
    expect(state.words[key('Lion')].correct).toBe(0);
  });

  it('не затирает прогресс повторным добавлением', () => {
    let state = reducer(
      undefined,
      wordAdded({ englishWord: 'lion', russianWord: 'лев' })
    );
    state = reducer(
      state,
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: true, count: 1 })
    );
    state = reducer(
      state,
      wordAdded({ englishWord: 'lion', russianWord: 'лев' })
    );
    expect(state.words[key('lion')].correct).toBe(1);
    expect(state.words[key('lion')].status).toBe('learning');
  });

  it('помечает слово изученным на пятом верном ответе', () => {
    let state = reducer(
      undefined,
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: true })
    );
    for (let i = 0; i < 3; i += 1) {
      advanceDays(30);
      state = reducer(
        state,
        wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: true })
      );
    }
    expect(state.words[key('lion')].status).toBe('learning');
    expect(state.words[key('lion')].streak).toBe(4);

    advanceDays(30);
    state = reducer(
      state,
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: true })
    );
    expect(state.words[key('lion')].status).toBe('mastered');
    expect(state.words[key('lion')].masteredAt).not.toBeNull();
  });

  it('повтор в тот же день не засчитывается в серию', () => {
    let state = reducer(
      undefined,
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: true })
    );
    // второй верный ответ в тот же день — интервал ещё не наступил
    state = reducer(
      state,
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: true })
    );
    expect(state.words[key('lion')].streak).toBe(1);
    expect(state.words[key('lion')].correct).toBe(2);
  });

  it('ошибка обнуляет серию верных ответов', () => {
    let state = reducer(
      undefined,
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: true })
    );
    state = reducer(
      state,
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: false })
    );
    expect(state.words[key('lion')].streak).toBe(0);
    expect(state.words[key('lion')].status).toBe('learning');
  });

  it('ошибка переводит слово в статус learning', () => {
    let state = reducer(
      undefined,
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: false })
    );
    expect(state.words[key('lion')].status).toBe('learning');
    expect(state.words[key('lion')].wrong).toBe(1);
  });

  it('массово добавляет слова', () => {
    const state = reducer(
      undefined,
      wordsAdded([
        { englishWord: 'cat', russianWord: 'кот' },
        { englishWord: 'dog', russianWord: 'собака' },
      ])
    );
    expect(Object.keys(state.words)).toHaveLength(2);
  });

  it('не падает, если словарь прогресса оказался массивом', () => {
    const state = reducer(
      { words: [] },
      wordAnswered({ englishWord: 'great', russianWord: 'отличный', correct: false })
    );
    expect(Array.isArray(state.words)).toBe(false);
    expect(state.words.great.wrong).toBe(1);
    expect(state.words.great.status).toBe('learning');
  });

  it('заменяет битую запись слова и ставит срок повторения', () => {
    const state = reducer(
      { words: { great: [] } },
      wordAnswered({ englishWord: 'great', russianWord: 'отличный', correct: true })
    );
    expect(state.words.great.correct).toBe(1);
    expect(typeof state.words.great.dueAt).toBe('number');
  });

  it('удаляет запись прогресса', () => {
    let state = reducer(
      undefined,
      wordAdded({ englishWord: 'lion', russianWord: 'лев' })
    );
    state = reducer(state, wordRemoved({ key: key('lion') }));
    expect(state.words[key('lion')]).toBeUndefined();
  });
});
