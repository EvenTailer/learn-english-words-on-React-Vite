import { describe, expect, it } from 'vitest';
import reducer, { wordReset, wordAnswered } from './progressSlice';

const key = (word) => word.trim().toLowerCase();

describe('progressSlice — возврат в работу', () => {
  it('вернуть в работу обнуляет серию и статус', () => {
    let state = reducer(
      undefined,
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: true })
    );
    state = reducer(
      state,
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: false })
    );
    expect(state.words[key('lion')].lastResult).toBe('wrong');

    state = reducer(state, wordReset({ key: key('lion') }));

    expect(state.words[key('lion')].status).toBe('new');
    expect(state.words[key('lion')].streak).toBe(0);
    expect(state.words[key('lion')].correct).toBe(0);
    expect(state.words[key('lion')].dueAt).toBeNull();
    expect(state.words[key('lion')].lastResult).toBeNull();
  });

  it('верный ответ снимает слово из списка ошибок', () => {
    let state = reducer(
      undefined,
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: false })
    );
    expect(state.words[key('lion')].lastResult).toBe('wrong');

    state = reducer(
      state,
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: true })
    );
    expect(state.words[key('lion')].lastResult).toBe('correct');
  });

  it('серия не превышает порог освоения', () => {
    let state = reducer(
      undefined,
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: true })
    );
    // повторяем много раз — серия не должна уйти за 5
    for (let i = 0; i < 8; i += 1) {
      state = reducer(
        state,
        wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: true })
      );
    }
    expect(state.words[key('lion')].streak).toBeLessThanOrEqual(5);
  });
});
