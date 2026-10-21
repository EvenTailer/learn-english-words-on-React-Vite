import { createSlice } from '@reduxjs/toolkit';
import { createId } from '../../shared/lib/id';

// Свои списки слов: пользователь собирает тематические наборы вручную.
// Слова списка хранятся словами, а не id карточек: список живёт независимо
// от карточки в словаре и переживает её пересоздание.
const initialState = {
  items: [], // { id, name, words: [{ englishWord, russianWord, phonetic, definition, linkImg }], createdAt }
};

const normalize = (word) => String(word ?? '').trim().toLowerCase();

const cleanWord = (word) => ({
  englishWord: String(word?.englishWord ?? '').trim(),
  russianWord: String(word?.russianWord ?? '').trim(),
  phonetic: String(word?.phonetic ?? '').trim(),
  definition: String(word?.definition ?? '').trim(),
  linkImg: String(word?.linkImg ?? '').trim(),
});

const listsSlice = createSlice({
  name: 'lists',
  initialState,
  reducers: {
    listCreated: {
      reducer(state, action) {
        state.items.unshift(action.payload);
      },
      prepare(payload) {
        const data = typeof payload === 'string' ? { name: payload } : (payload ?? {});
        return {
          payload: {
            id: createId(),
            name: String(data.name ?? '').trim() || 'Новый набор',
            description: String(data.description ?? '').trim(),
            words: [],
            createdAt: Date.now(),
          },
        };
      },
    },

    listRenamed(state, action) {
      const { id, name } = action.payload;
      const list = state.items.find((item) => item.id === id);
      const clean = String(name ?? '').trim();
      if (list && clean) list.name = clean;
    },

    listDeleted(state, action) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },

    wordsAddedToList(state, action) {
      const { listId, words } = action.payload;
      const list = state.items.find((item) => item.id === listId);
      if (!list) return;

      const existing = new Set(list.words.map((word) => normalize(word.englishWord)));
      for (const word of words ?? []) {
        const clean = cleanWord(word);
        const key = normalize(clean.englishWord);
        if (!key || existing.has(key)) continue;
        existing.add(key);
        list.words.push(clean);
      }
    },

    wordRemovedFromList(state, action) {
      const { listId, englishWord } = action.payload;
      const list = state.items.find((item) => item.id === listId);
      if (!list) return;
      const key = normalize(englishWord);
      list.words = list.words.filter((word) => normalize(word.englishWord) !== key);
    },

    listsReset(state) {
      state.items = [];
    },
  },
});

export const {
  listCreated,
  listRenamed,
  listDeleted,
  wordsAddedToList,
  wordRemovedFromList,
  listsReset,
} = listsSlice.actions;

export default listsSlice.reducer;
