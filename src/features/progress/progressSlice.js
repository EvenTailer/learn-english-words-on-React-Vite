import { createSlice } from '@reduxjs/toolkit';
import { isDue, nextDueAt } from './srs';

// Порог, после которого слово считается изученным (5 верных ответов)
export const MASTERY_THRESHOLD = 5;

export const progressKey = (word) => String(word ?? '').trim().toLowerCase();

const initialState = {
  words: {}, // key -> { key, englishWord, russianWord, status, correct, wrong, lastSeenAt, masteredAt }
};

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    wordAdded(state, action) {
      const { englishWord, russianWord } = action.payload;
      const key = progressKey(englishWord);
      if (!key) return;

      const existing = state.words[key];
      state.words[key] = {
        key,
        englishWord: String(englishWord).trim(),
        russianWord: russianWord ?? existing?.russianWord ?? '',
        status: existing?.status ?? 'new',
        correct: existing?.correct ?? 0,
        wrong: existing?.wrong ?? 0,
        streak: existing?.streak ?? 0,
        dueAt: existing?.dueAt ?? null,
        lastSeenAt: existing?.lastSeenAt ?? null,
        masteredAt: existing?.masteredAt ?? null,
      };
    },

    wordsAdded(state, action) {
      for (const item of action.payload) {
        const key = progressKey(item.englishWord);
        if (!key) continue;
        const existing = state.words[key];
        state.words[key] = {
          key,
          englishWord: String(item.englishWord).trim(),
          russianWord: item.russianWord ?? existing?.russianWord ?? '',
          status: existing?.status ?? 'new',
          correct: existing?.correct ?? 0,
          wrong: existing?.wrong ?? 0,
          streak: existing?.streak ?? 0,
          dueAt: existing?.dueAt ?? null,
          lastSeenAt: existing?.lastSeenAt ?? null,
          masteredAt: existing?.masteredAt ?? null,
        };
      }
    },

    wordAnswered(state, action) {
      const { englishWord, russianWord, correct, count } = action.payload;
      const key = progressKey(englishWord);
      if (!key) return;

      const existing = state.words[key] ?? {
        key,
        englishWord: String(englishWord).trim(),
        russianWord: russianWord ?? '',
        status: 'new',
        correct: 0,
        wrong: 0,
        streak: 0,
        dueAt: null,
        lastSeenAt: null,
        masteredAt: null,
      };

      if (correct) {
        // count — накопительный счётчик верных ответов по этой карточке
        existing.correct = Math.max(existing.correct, count ?? existing.correct + 1);

        // streak — сколько сессий подряд слово отвечали верно.
        // Один ответ за сессию: карточка уходит из тренировки после ответа,
        // поэтому 5 верных = 5 разных сессий с интервалами 1/3/7/21/60 дней.
        const dueNow = isDue(existing, Date.now());
        if (dueNow) {
          existing.streak = Math.min((existing.streak ?? 0) + 1, MASTERY_THRESHOLD);
        }

        if (existing.streak >= MASTERY_THRESHOLD) {
          existing.status = 'mastered';
          existing.masteredAt = Date.now();
        } else {
          existing.status = 'learning';
        }
        // слово «отдыхает» до следующего повторения
        existing.dueAt = nextDueAt(Math.max(existing.streak, 1));
        // верный ответ снимает слово из списка «Только ошибки»
        existing.lastResult = 'correct';
      } else {
        existing.wrong += 1;
        existing.status = 'learning';
        existing.streak = 0;
        // ошибка — повторяем сегодня
        existing.dueAt = Date.now();
        existing.lastResult = 'wrong';
        existing.lastWrongAt = Date.now();
      }

      existing.lastSeenAt = Date.now();
      state.words[key] = existing;
    },

    wordRemoved(state, action) {
      delete state.words[action.payload.key];
    },

    // «Вернуть в работу»: слово снова становится новым
    wordReset(state, action) {
      const key = action.payload?.key ?? action.payload;
      const entry = state.words[key];
      if (!entry) return;
      entry.status = 'new';
      entry.correct = 0;
      entry.wrong = 0;
      entry.streak = 0;
      entry.dueAt = null;
      entry.lastResult = null;
      entry.lastWrongAt = null;
      entry.masteredAt = null;
    },

    progressReset(state) {
      state.words = {};
    },
  },
});

export const {
  wordAdded,
  wordsAdded,
  wordAnswered,
  wordRemoved,
  wordReset,
  progressReset,
} = progressSlice.actions;

export default progressSlice.reducer;
