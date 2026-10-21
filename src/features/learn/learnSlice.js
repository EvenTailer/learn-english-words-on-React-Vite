import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentCardId: null,
  mode: null, // 'eng' — показываем английское слово, 'rus' — русское
  answer: '',
  queue: [], // очередь id карточек
  revealed: false, // пользователь нажал «Показать ответ»
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
      state.queue = action.payload.queue;
      state.answer = '';
      state.revealed = false;
      state.finished = false;
    },
    answerChanged(state, action) {
      state.answer = action.payload;
    },
    answerRevealed(state) {
      state.revealed = true;
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
      state.queue = [];
      state.revealed = false;
      state.finished = true;
    },
  },
});

export const {
  learnStarted,
  answerChanged,
  answerRevealed,
  toastShown,
  toastHidden,
  learnFinished,
} = learnSlice.actions;

export default learnSlice.reducer;
