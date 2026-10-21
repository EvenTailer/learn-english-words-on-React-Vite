import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentCardId: null,
  mode: null, // 'eng' — показываем английское слово, 'rus' — русское
  answer: '',
  queue: [], // очередь id карточек
  revealed: false, // пользователь нажал «Показать ответ»
  finished: false,
  session: { total: 0, answered: 0, correct: 0, wrong: 0, skipped: 0, learned: 0 },
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
    sessionReset(state, action) {
      state.session = {
        total: action.payload?.total ?? 0,
        answered: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        learned: 0,
      };
    },
    sessionStatAdded(state, action) {
      const { kind, value = 1 } = action.payload;
      if (kind === 'answered') state.session.answered += value;
      else if (kind in state.session) state.session[kind] += value;
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
  sessionReset,
  sessionStatAdded,
  learnFinished,
} = learnSlice.actions;

export default learnSlice.reducer;
