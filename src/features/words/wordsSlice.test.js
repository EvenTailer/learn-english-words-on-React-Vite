import { describe, expect, it } from 'vitest';
import reducer, {
  cardAdded,
  cardCountIncremented,
  cardDeleted,
  cardRemoved,
} from './wordsSlice';

const card = (id) => ({
  id,
  englishWord: 'word',
  russianWord: 'слово',
  linkImg: '',
  count: 0,
});

describe('wordsSlice', () => {
  it('добавляет карточку в конец списка', () => {
    const state = reducer(undefined, cardAdded(card('x')));
    expect(state.items.at(-1).id).toBe('x');
  });

  it('удаляет карточку по id', () => {
    const start = { items: [card('a'), card('b')] };
    const state = reducer(start, cardDeleted('a'));
    expect(state.items.map((c) => c.id)).toEqual(['b']);
  });

  it('удаляет карточку через cardRemoved', () => {
    const start = { items: [card('a'), card('b')] };
    const state = reducer(start, cardRemoved('b'));
    expect(state.items.map((c) => c.id)).toEqual(['a']);
  });

  it('увеличивает счётчик нужной карточки', () => {
    const start = { items: [card('a'), card('b')] };
    const state = reducer(start, cardCountIncremented('b'));
    expect(state.items[1].count).toBe(1);
    expect(state.items[0].count).toBe(0);
  });

  it('не падает, если карточки нет', () => {
    const start = { items: [card('a')] };
    expect(() => reducer(start, cardCountIncremented('zzz'))).not.toThrow();
  });
});
