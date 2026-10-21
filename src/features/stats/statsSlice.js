import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  history: {}, // 'YYYY-MM-DD' -> { correct, wrong, learned }
  streak: { current: 0, longest: 0, lastActiveDate: null },
  totalCorrect: 0,
  totalWrong: 0,
  totalLearned: 0,
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    statsIncremented(state, action) {
      const { date, correct = 0, wrong = 0, learned = 0 } = action.payload;
      const day = state.history[date] ?? { correct: 0, wrong: 0, learned: 0 };
      day.correct += correct;
      day.wrong += wrong;
      day.learned += learned;
      state.history[date] = day;
      state.totalCorrect += correct;
      state.totalWrong += wrong;
      state.totalLearned += learned;
    },

    streakUpdated(state, action) {
      state.streak = action.payload;
    },

    statsReset(state) {
      state.history = {};
      state.streak = { current: 0, longest: 0, lastActiveDate: null };
      state.totalCorrect = 0;
      state.totalWrong = 0;
      state.totalLearned = 0;
    },
  },
});

export const { statsIncremented, streakUpdated, statsReset } = statsSlice.actions;

export default statsSlice.reducer;
