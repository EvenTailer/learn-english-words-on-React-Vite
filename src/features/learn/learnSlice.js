import { createSlice } from '@reduxjs/toolkit';
import { ANSWER_MODES } from './plan';

const initialState = {
  currentCardId: null,
  mode: null, // 'eng' — показываем английское слово, 'rus' — русское
  answer: '',
  queue: [], // очередь id карточек
  revealed: false, // пользователь нажал «Показать ответ»
  finished: false,
  plan: null, // план тренировки: источник слов, формат, размер
  answerMode: ANSWER_MODES.TEXT,
  choices: [], // варианты ответа для режима «выбор»
  verdict: null, // результат последнего ответа: { correct, answer, mastered }
  session: {
    total: 0,
    answered: 0,
    correct: 0,
    wrong: 0,
    skipped: 0,
    learned: 0,
    wrongWords: [], // слова, где ошиблись: { englishWord, russianWord }
  },
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
      // новая карточка — вердикт от предыдущей не должен висеть на ней
      state.verdict = null;
      state.plan = action.payload.plan ?? state.plan;
      state.answerMode = action.payload.answerMode ?? state.answerMode;
      state.choices = action.payload.choices ?? [];
    },
    answerChanged(state, action) {
      state.answer = action.payload;
    },
    answerRevealed(state) {
      state.revealed = true;
    },
    // Вердикт по последнему ответу: показываем на карточке, потом «Далее»
    verdictSet(state, action) {
      state.verdict = action.payload;
    },
    verdictCleared(state) {
      state.verdict = null;
    },
    choicesSet(state, action) {
      state.choices = action.payload ?? [];
    },
    // Вернуться к выбору: что учить
    planCleared(state) {
      state.plan = null;
      state.currentCardId = null;
      state.mode = null;
      state.answer = '';
      state.queue = [];
      state.revealed = false;
      state.finished = false;
      state.choices = [];
      state.verdict = null;
    },
    sessionReset(state, action) {
      state.session = {
        total: action.payload?.total ?? 0,
        answered: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        learned: 0,
        wrongWords: [],
      };
    },
    sessionStatAdded(state, action) {
      const { kind, value = 1 } = action.payload;
      if (kind === 'answered') state.session.answered += value;
      else if (kind in state.session) state.session[kind] += value;
    },
    // Слово, в котором ошиблись — показываем в итогах
    sessionWrongWordAdded(state, action) {
      const word = action.payload;
      if (!word?.englishWord) return;
      const exists = state.session.wrongWords.some(
        (item) => item.englishWord === word.englishWord
      );
      if (!exists) state.session.wrongWords.push(word);
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
  verdictSet,
  verdictCleared,
  choicesSet,
  planCleared,
  sessionReset,
  sessionStatAdded,
  sessionWrongWordAdded,
  learnFinished,
} = learnSlice.actions;

export default learnSlice.reducer;
