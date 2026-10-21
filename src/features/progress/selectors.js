import { createSelector } from '@reduxjs/toolkit';

export const selectProgressMap = (state) => state.progress.words;

export const selectWordProgress = (state, key) =>
  state.progress.words[String(key ?? '').trim().toLowerCase()];

export const selectMasteredCount = createSelector([selectProgressMap], (words) =>
  Object.values(words).filter((word) => word.status === 'mastered').length
);

export const selectLearningCount = createSelector(
  [selectProgressMap],
  (words) =>
    Object.values(words).filter((word) => word.status === 'learning').length
);

export const selectTrackedCount = createSelector(
  [selectProgressMap],
  (words) => Object.keys(words).length
);
