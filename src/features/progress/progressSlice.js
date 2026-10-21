import { createSlice } from '@reduxjs/toolkit';

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
        lastSeenAt: null,
        masteredAt: null,
      };

      if (correct) {
        // count — накопительный счётчик верных ответов по этой карточке
        existing.correct = Math.max(existing.correct, count ?? existing.correct + 1);
        if (existing.correct >= MASTERY_THRESHOLD) {
          existing.status = 'mastered';
          existing.masteredAt = Date.now();
        } else {
          existing.status = 'learning';
        }
      } else {
        existing.wrong += 1;
        existing.status = 'learning';
      }

      existing.lastSeenAt = Date.now();
      state.words[key] = existing;
    },

    wordRemoved(state, action) {
      delete state.words[action.payload.key];
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
  progressReset,
} = progressSlice.actions;

export default progressSlice.reducer;
