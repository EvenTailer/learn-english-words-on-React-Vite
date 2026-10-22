// Синхронизация: что уходит на сервер и как серверные данные возвращаются в стор.
// Сервер — источник правды; IndexedDB остаётся кешем для офлайна.

import { cardsReplaced } from '../../features/words/wordsSlice';
import { progressReplaced } from '../../features/progress/progressSlice';
import { listsReplaced } from '../../features/lists/listsSlice';
import { statsReplaced } from '../../features/stats/statsSlice';

// Собираем из стора только то, что должно жить на сервере
export const selectSyncPayload = (state) => ({
  cards: state.cards?.items ?? [],
  progress: state.progress?.words ?? {},
  stats: {
    history: state.stats?.history ?? {},
    streak: state.stats?.streak ?? { current: 0, longest: 0, lastActiveDate: null },
    totalCorrect: state.stats?.totalCorrect ?? 0,
    totalWrong: state.stats?.totalWrong ?? 0,
    totalLearned: state.stats?.totalLearned ?? 0,
  },
  lists: state.lists?.items ?? [],
  settings: state.settings ?? {},
});

// Разворачиваем серверные данные в стор
export const applySyncPayload = (store, payload) => {
  if (!payload) return;
  store.dispatch(cardsReplaced(payload.cards ?? []));
  store.dispatch(progressReplaced(payload.progress ?? {}));
  store.dispatch(listsReplaced(payload.lists ?? []));
  store.dispatch(statsReplaced(payload.stats ?? {}));
};

// Пустой ли бэкап: серверу нечего отдавать
export const isEmptyPayload = (payload) => {
  if (!payload) return true;
  const cards = payload.cards?.length ?? 0;
  const progress = Object.keys(payload.progress ?? {}).length;
  const lists = payload.lists?.length ?? 0;
  return cards === 0 && progress === 0 && lists === 0;
};
