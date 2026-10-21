import { createSlice } from '@reduxjs/toolkit';

export const THEMES = [
  { id: 'dark', label: 'Ночь', swatch: '#070c16' },
  { id: 'light', label: 'Светлая', swatch: '#f1f5f9' },
  { id: 'ocean', label: 'Океан', swatch: '#0369a1' },
  { id: 'sunset', label: 'Закат', swatch: '#c026d3' },
  { id: 'forest', label: 'Лес', swatch: '#047857' },
];

const isKnownTheme = (value) => THEMES.some((theme) => theme.id === value);

const initialState = {
  theme: 'dark',
  dailyGoal: 20,
  direction: 'mixed', // 'mixed' | 'en-ru' | 'ru-en'
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    themeSet(state, action) {
      if (isKnownTheme(action.payload)) state.theme = action.payload;
    },
    dailyGoalSet(state, action) {
      const value = Number(action.payload);
      if (Number.isFinite(value)) {
        state.dailyGoal = Math.min(100, Math.max(5, Math.round(value / 5) * 5));
      }
    },
    directionSet(state, action) {
      if (['mixed', 'en-ru', 'ru-en'].includes(action.payload)) {
        state.direction = action.payload;
      }
    },
  },
});

export const { themeSet, dailyGoalSet, directionSet } = settingsSlice.actions;

export default settingsSlice.reducer;
