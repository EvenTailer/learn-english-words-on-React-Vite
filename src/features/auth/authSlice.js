import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getStoredUser,
  getToken,
  loginRequest,
  logoutRequest,
  registerRequest,
  setStoredUser,
  setToken,
} from '../../shared/lib/api';

const initialState = {
  user: getStoredUser(),
  token: getToken(),
  status: 'idle', // idle | loading | ready | error
  error: '',
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
  async (_, { getState }) => {
    const { token } = getState().auth;
    try {
      if (token) await logoutRequest(token);
    } catch {
      // сервер недоступен — выходим локально, токен всё равно сотрём
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
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'idle';
        state.user = null;
        state.token = null;
        setToken(null);
        setStoredUser(null);
      });
  },
});

export const { authErrorCleared } = authSlice.actions;

export default authSlice.reducer;
