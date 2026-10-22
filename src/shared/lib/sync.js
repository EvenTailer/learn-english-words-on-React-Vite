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

export const EMPTY_PAYLOAD = {
  cards: [],
  progress: {},
  stats: {},
  lists: [],
  settings: {},
};

/**
 * Что делать при входе.
 * take-server — забрать сервер (чужой локальный кеш сюда не входит).
 * push-local — на сервере пусто, отдаём браузер.
 * conflict — обе стороны с данными, человек выбирает сам.
 */
export const payloadSignature = (payload) =>
  JSON.stringify({
    cards: payload?.cards ?? [],
    progress: payload?.progress ?? {},
    stats: payload?.stats ?? {},
    lists: payload?.lists ?? [],
    settings: payload?.settings ?? {},
  });

export const reconcileSync = ({
  serverPayload,
  localPayload,
  localOwnerId,
  userId,
}) => {
  const foreign =
    localOwnerId != null &&
    String(localOwnerId) !== '' &&
    String(localOwnerId) !== String(userId ?? '');

  if (foreign) return 'take-server';
  if (isEmptyPayload(serverPayload)) return 'push-local';
  if (isEmptyPayload(localPayload)) return 'take-server';
  if (payloadSignature(serverPayload) === payloadSignature(localPayload)) {
    return 'take-server';
  }
  return 'conflict';
};

// Отправка разрешена только в живой сессии и без открытого конфликта
export const shouldPushSync = ({ token, conflict, payloadJson, lastPushed }) => {
  if (!token || conflict) return false;
  return payloadJson !== lastPushed;
};

// Метка версии на сервере. PUT со старой меткой сервер отклоняет.
let serverUpdatedAt = null;

export const setServerUpdatedAt = (value) => {
  serverUpdatedAt = value || null;
};

export const getServerUpdatedAt = () => serverUpdatedAt;

export const attachUpdatedAt = (payload) => ({
  ...payload,
  updatedAt: serverUpdatedAt,
});

// Данные с сервера, которые ждут решения пользователя (конфликт).
// Держим вне Redux: это может быть полтора мегабайта.
let pendingServerPayload = null;

export const setPendingServerPayload = (payload) => {
  pendingServerPayload = payload;
};

export const getPendingServerPayload = () => pendingServerPayload;

export const clearPendingServerPayload = () => {
  pendingServerPayload = null;
};
