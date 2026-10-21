import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
} from 'redux-persist';
import cardsReducer from '../../features/words/wordsSlice';
import learnReducer from '../../features/learn/learnSlice';
import { localforageStorage } from '../../shared/lib/localforageStorage';

const persistedCardsReducer = persistReducer(
  // keyPrefix: '' — ключ в localforage будет ровно 'cards',
  // как в старой версии приложения (данные не теряются при миграции)
  { key: 'cards', keyPrefix: '', version: 1, storage: localforageStorage },
  cardsReducer
);

const rootReducer = combineReducers({
  cards: persistedCardsReducer,
  learn: learnReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});
