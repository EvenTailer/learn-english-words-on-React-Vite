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
import listsReducer from '../../features/lists/listsSlice';
import dictionaryReducer from '../../features/dictionary/dictionarySlice';
import wordlistsReducer from '../../features/wordlists/wordlistsSlice';
import settingsReducer from '../../features/settings/settingsSlice';
import progressReducer from '../../features/progress/progressSlice';
import statsReducer from '../../features/stats/statsSlice';
import uiReducer from '../../features/ui/toastSlice';
import { localforageStorage } from '../../shared/lib/localforageStorage';
import { readStoredTheme } from '../../shared/lib/theme';

// keyPrefix: '' — ключ в localforage будет ровно 'cards',
// как в старой версии приложения (данные не теряются при миграции)
const persistedCardsReducer = persistReducer(
  {
    key: 'cards',
    keyPrefix: '',
    version: 1,
    storage: localforageStorage,
    // пишем не чаще раза в секунду: словарь с картинками — тяжёлый
    throttle: 1000,
    // страховка на случай смены формата карточек в будущем
    migrate: async (state) => state,
  },
  cardsReducer
);

const persistedProgressReducer = persistReducer(
  { key: 'progress', keyPrefix: '', version: 1, storage: localforageStorage },
  progressReducer
);

const persistedStatsReducer = persistReducer(
  { key: 'stats', keyPrefix: '', version: 1, storage: localforageStorage },
  statsReducer
);

const persistedSettingsReducer = persistReducer(
  { key: 'settings', keyPrefix: '', version: 1, storage: localforageStorage },
  settingsReducer
);

const persistedListsReducer = persistReducer(
  { key: 'lists', keyPrefix: '', version: 1, storage: localforageStorage },
  listsReducer
);

const rootReducer = combineReducers({
  cards: persistedCardsReducer,
  progress: persistedProgressReducer,
  stats: persistedStatsReducer,
  lists: persistedListsReducer,
  learn: learnReducer,
  dictionary: dictionaryReducer,
  wordlists: wordlistsReducer,
  settings: persistedSettingsReducer,
  ui: uiReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: {
    // тема живёт в localStorage — она маленькая и не должна ждать IndexedDB
    settings: { theme: readStoredTheme(), dailyGoal: 20 },
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});
