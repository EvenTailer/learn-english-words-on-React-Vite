import { describe, expect, it } from 'vitest';
import reducer, {
  listCreated,
  listDeleted,
  listRenamed,
  wordRemovedFromList,
  wordsAddedToList,
} from './listsSlice';

const wordOf = (list, englishWord) =>
  list.words.find((word) => word.englishWord === englishWord);

describe('listsSlice', () => {
  it('создаёт пустой список', () => {
    const state = reducer(undefined, listCreated('Еда'));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].name).toBe('Еда');
    expect(state.items[0].words).toHaveLength(0);
  });

  it('добавляет слова в список', () => {
    let state = reducer(undefined, listCreated('Еда'));
    const { id } = state.items[0];
    state = reducer(
      state,
      wordsAddedToList({
        listId: id,
        words: [{ englishWord: 'apple', russianWord: 'яблоко' }],
      })
    );
    expect(state.items[0].words).toHaveLength(1);
    expect(wordOf(state.items[0], 'apple').russianWord).toBe('яблоко');
  });

  it('не добавляет одно слово дважды', () => {
    let state = reducer(undefined, listCreated('Еда'));
    const { id } = state.items[0];
    const words = [{ englishWord: 'apple', russianWord: 'яблоко' }];
    state = reducer(state, wordsAddedToList({ listId: id, words }));
    state = reducer(state, wordsAddedToList({ listId: id, words }));
    expect(state.items[0].words).toHaveLength(1);
  });

  it('убирает слово из списка', () => {
    let state = reducer(undefined, listCreated('Еда'));
    const { id } = state.items[0];
    state = reducer(
      state,
      wordsAddedToList({
        listId: id,
        words: [{ englishWord: 'apple', russianWord: 'яблоко' }],
      })
    );
    state = reducer(
      state,
      wordRemovedFromList({ listId: id, englishWord: 'Apple' })
    );
    expect(state.items[0].words).toHaveLength(0);
  });

  it('переименовывает и удаляет список', () => {
    let state = reducer(undefined, listCreated('Еда'));
    const { id } = state.items[0];
    state = reducer(state, listRenamed({ id, name: '  Кухня  ' }));
    expect(state.items[0].name).toBe('Кухня');
    state = reducer(state, listDeleted(id));
    expect(state.items).toHaveLength(0);
  });
});
