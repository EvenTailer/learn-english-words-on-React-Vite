import { describe, expect, it } from 'vitest';
import reducer, {
  wordAdded,
  wordAnswered,
  wordRemoved,
  wordsAdded,
} from './progressSlice';

const key = (word) => word.trim().toLowerCase();

describe('progressSlice', () => {
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
      wordAnswered({ englishWord: 'lion', russianWord: 'лев', correct: true, count: 5 })
    );
    expect(state.words[key('lion')].status).toBe('mastered');
    expect(state.words[key('lion')].masteredAt).not.toBeNull();
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

  it('удаляет запись прогресса', () => {
    let state = reducer(
      undefined,
      wordAdded({ englishWord: 'lion', russianWord: 'лев' })
    );
    state = reducer(state, wordRemoved({ key: key('lion') }));
    expect(state.words[key('lion')]).toBeUndefined();
  });
});
