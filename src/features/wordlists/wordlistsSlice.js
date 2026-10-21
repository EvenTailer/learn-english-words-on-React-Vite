import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Наборы слов собираются скриптом scripts/build-wordlists.mjs,
// JSON грузится отдельным чанком — только когда пользователь открыл страницу
export const loadWordLists = createAsyncThunk('wordlists/load', async () => {
  const module = await import('../../data/wordlists.json');
  return module.default;
});

const initialState = {
  status: 'idle',
  data: null,
  error: '',
};

const wordlistsSlice = createSlice({
  name: 'wordlists',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadWordLists.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadWordLists.fulfilled, (state, action) => {
        state.status = 'ready';
        state.data = action.payload;
      })
      .addCase(loadWordLists.rejected, (state) => {
        state.status = 'error';
        state.error = 'Не удалось загрузить наборы слов';
      });
  },
});

export default wordlistsSlice.reducer;
