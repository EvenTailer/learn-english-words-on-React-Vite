import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  abortSyncRequests,
  getStoredUser,
  getToken,
  loginRequest,
  logoutRequest,
  pushServerData,
  registerRequest,
  setStoredUser,
  setToken,
} from '../../shared/lib/api';
import { attachUpdatedAt, selectSyncPayload } from '../../shared/lib/sync';

const initialState = {
  user: getStoredUser(),
  token: getToken(),
  status: 'idle', // idle | loading | ready | error
  error: '',
  // Конфликт: на сервере данные есть и в браузере тоже — нужно спросить
  conflict: null,
  // Растёт, когда человек выбрал «оставить из браузера» — хук шлёт сразу
  forceSyncTick: 0,
};

const saveSession = (state, { user, token }) => {
  state.user = user;
  state.token = token;
  setToken(token);
  setStoredUser(user);
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await loginRequest(email, password);
      return { user: data.user, token: data.token };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await registerRequest(email, password);
      return { user: data.user, token: data.token };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async ({ token, hasConflict } = {}, { getState }) => {
    // Токен передаём аргументом: pending уже стёр его из стора,
    // иначе серверная сессия осталась бы живой.
    const sessionToken = token || getState().auth.token;
    abortSyncRequests();

    if (sessionToken && !hasConflict) {
      try {
        await pushServerData(
          sessionToken,
          attachUpdatedAt(selectSyncPayload(getState()))
        );
      } catch {
        // Устаревшую или недоступную копию при выходе не навязываем серверу
      }
    }

    try {
      if (sessionToken) await logoutRequest(sessionToken);
    } catch {
      // сервер недоступен — локально уже вышли
    }
    return true;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authErrorCleared(state) {
      state.error = '';
    },
    // Найдены разные данные в браузере и на сервере
      syncConflictDetected(state, action) {
        state.conflict = action.payload;
      },
      syncConflictResolved(state) {
        state.conflict = null;
      },
      // Человек оставил браузер: конфликт закрыт, хук отправляет сразу
      syncKeepLocal(state) {
        state.conflict = null;
        state.forceSyncTick += 1;
      },
    },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = '';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'ready';
        saveSession(state, action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? 'Не удалось войти';
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = '';
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'ready';
        saveSession(state, action.payload);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? 'Не удалось зарегистрироваться';
      })
      .addCase(logoutUser.pending, (state) => {
        // Сессия гаснет сразу, не дожидаясь ответа сервера.
        // Иначе страница остаётся «вошедшей», а синхронизация ещё пишет в базу.
        state.status = 'idle';
        state.user = null;
        state.token = null;
        state.error = '';
        state.conflict = null;
        setToken(null);
        setStoredUser(null);
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'idle';
        state.user = null;
        state.token = null;
        state.conflict = null;
        setToken(null);
        setStoredUser(null);
      })
      .addCase(logoutUser.rejected, (state) => {
        state.status = 'idle';
        state.user = null;
        state.token = null;
        state.conflict = null;
        setToken(null);
        setStoredUser(null);
      });
  },
});

export const {
  authErrorCleared,
  syncConflictDetected,
  syncConflictResolved,
  syncKeepLocal,
} = authSlice.actions;

export default authSlice.reducer;
