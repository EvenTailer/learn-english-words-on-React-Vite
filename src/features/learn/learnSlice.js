import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentCardId: null,
  mode: null, // 'eng' — показываем английское слово, 'rus' — русское
  answer: '',
  finished: false,
  toast: { message: '', type: '' },
};

const learnSlice = createSlice({
  name: 'learn',
  initialState,
  reducers: {
    learnStarted(state, action) {
      state.currentCardId = action.payload.id;
      state.mode = action.payload.mode;
      state.answer = '';
      state.finished = false;
    },
    answerChanged(state, action) {
      state.answer = action.payload;
    },
    toastShown(state, action) {
      state.toast = action.payload;
    },
    toastHidden(state) {
      state.toast = { message: '', type: '' };
    },
    learnFinished(state) {
      state.currentCardId = null;
      state.mode = null;
      state.answer = '';
      state.finished = true;
    },
    learnReset(state) {
      state.currentCardId = null;
      state.mode = null;
      state.answer = '';
      state.finished = false;
    },
  },
});

export const {
  learnStarted,
  answerChanged,
  toastShown,
  toastHidden,
  learnFinished,
  learnReset,
} = learnSlice.actions;

export default learnSlice.reducer;
