import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  toast: { message: '', type: '' },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toastShown(state, action) {
      state.toast = {
        message: action.payload.message,
        type: action.payload.type ?? 'info',
      };
    },
    toastHidden(state) {
      state.toast = { message: '', type: '' };
    },
  },
});

export const { toastShown, toastHidden } = uiSlice.actions;

export default uiSlice.reducer;
