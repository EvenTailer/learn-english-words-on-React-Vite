import { createSlice } from '@reduxjs/toolkit';

const seedCards = [
  {
    id: 'seed-lion',
    englishWord: 'lion',
    linkImg:
      'https://t3.ftcdn.net/jpg/06/29/27/22/360_F_629272263_HR7Fr9eoLFQZk61hvKgr7kKYDDNqZYcC.jpg',
    russianWord: 'лев',
    count: 0,
  },
  {
    id: 'seed-monkey',
    englishWord: 'monkey',
    linkImg:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/Golden_monkey_%28Cercopithecus_kandti%29_eating.jpg/500px-Golden_monkey_%28Cercopithecus_kandti%29_eating.jpg',
    russianWord: 'обезьяна',
    count: 0,
  },
  {
    id: 'seed-crocodile',
    englishWord: 'crocodile',
    linkImg:
      'https://t3.ftcdn.net/jpg/09/66/07/06/360_F_966070642_Lxir7Ax8mHycK7ZZVx29xKq0eJF5QiGf.jpg',
    russianWord: 'крокодил',
    count: 0,
  },
];

const initialState = {
  items: seedCards,
};

const wordsSlice = createSlice({
  name: 'cards',
  initialState,
  reducers: {
    cardAdded(state, action) {
      const key = String(action.payload.englishWord ?? '')
        .trim()
        .toLowerCase();
      if (!key) return;
      // одно слово — одна карточка
      const exists = state.items.some(
        (card) => String(card.englishWord ?? '').trim().toLowerCase() === key
      );
      if (exists) return;
      state.items.push(action.payload);
    },
    cardDeleted(state, action) {
      state.items = state.items.filter((card) => card.id !== action.payload);
    },
    cardCountIncremented(state, action) {
      const card = state.items.find((item) => item.id === action.payload);
      if (card) card.count += 1;
    },
    cardRemoved(state, action) {
      state.items = state.items.filter((card) => card.id !== action.payload);
    },
    // Массовый импорт из готовых наборов слов, дубликаты пропускаем
    cardsImported(state, action) {
      const existing = new Set(
        state.items.map((card) => card.englishWord.toLowerCase())
      );
      for (const card of action.payload) {
        const key = card.englishWord.toLowerCase();
        if (existing.has(key)) continue;
        existing.add(key);
        state.items.push(card);
      }
    },
  },
});

export const {
  cardAdded,
  cardDeleted,
  cardCountIncremented,
  cardRemoved,
  cardsImported,
} = wordsSlice.actions;

export default wordsSlice.reducer;
