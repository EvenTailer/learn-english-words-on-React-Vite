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
      'https://img.freepik.com/premium-photo/close-up-lion-looking-away_1048944-5944959.jpg?semt=ais_hybrid',
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
  },
});

export const { cardAdded, cardDeleted, cardCountIncremented, cardRemoved } =
  wordsSlice.actions;

export default wordsSlice.reducer;
