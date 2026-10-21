import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchDictionary, fetchImage, fetchTranslation } from './dictionaryApi';

export const lookupWord = createAsyncThunk(
  'dictionary/lookup',
  async (rawWord, { signal, rejectWithValue }) => {
    const word = String(rawWord ?? '').trim().toLowerCase();
    if (!word) return rejectWithValue('Введите английское слово');

    try {
      const [dictionary, image] = await Promise.all([
        fetchDictionary(word, signal).catch(() => null),
        fetchImage(word, signal).catch(() => null),
      ]);

      let translations = dictionary?.translations ?? [];
      if (translations.length === 0) {
        const translated = await fetchTranslation(word, 'en', 'ru', signal).catch(
          () => ''
        );
        translations = translated ? [translated] : [];
      }

      if (!dictionary && translations.length === 0) {
        return rejectWithValue('Слово не найдено');
      }

      return {
        englishWord: word,
        russianWord: translations[0] ?? '',
        variants: translations.slice(1),
        phonetic: dictionary?.phonetic ?? '',
        definition: dictionary?.definition ?? '',
        example: dictionary?.example ?? '',
        partOfSpeech: dictionary?.partOfSpeech ?? '',
        imageUrl: image?.url ?? '',
        imageSource: image?.source ?? '',
      };
    } catch (error) {
      return rejectWithValue(error.message ?? 'Не удалось получить слово');
    }
  }
);

const initialState = {
  status: 'idle', // idle | loading | ready | error
  data: null,
  error: '',
};

const dictionarySlice = createSlice({
  name: 'dictionary',
  initialState,
  reducers: {
    lookupReset(state) {
      state.status = 'idle';
      state.data = null;
      state.error = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(lookupWord.pending, (state) => {
        state.status = 'loading';
        state.error = '';
      })
      .addCase(lookupWord.fulfilled, (state, action) => {
        state.status = 'ready';
        state.data = action.payload;
      })
      .addCase(lookupWord.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? 'Ошибка поиска';
      });
  },
});

export const { lookupReset } = dictionarySlice.actions;

export default dictionarySlice.reducer;
