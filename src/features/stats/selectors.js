import { toISODate } from '../../shared/lib/date';

const EMPTY_DAY = { correct: 0, wrong: 0, learned: 0 };

export const selectStats = (state) => state.stats;

export const selectStreak = (state) => state.stats.streak;

export const selectHistory = (state) => state.stats.history;

export const selectTodayStats = (state) =>
  state.stats.history[toISODate()] ?? EMPTY_DAY;

export const selectTotalCorrect = (state) => state.stats.totalCorrect;

export const selectTotalWrong = (state) => state.stats.totalWrong;

export const selectTotalLearned = (state) => state.stats.totalLearned;
