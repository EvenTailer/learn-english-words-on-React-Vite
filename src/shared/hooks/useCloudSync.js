import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector, useAppStore } from '../../app/store/hooks';
import { syncConflictDetected } from '../../features/auth/authSlice';
import {
  fetchServerData,
  getDataOwnerId,
  pushServerData,
  setDataOwnerId,
} from '../lib/api';
import {
  EMPTY_PAYLOAD,
  applySyncPayload,
  attachUpdatedAt,
  reconcileSync,
  selectSyncPayload,
  setPendingServerPayload,
  setServerUpdatedAt,
  shouldPushSync,
} from '../lib/sync';

const PUSH_DELAY_MS = 3000;

/**
 * Облачная синхронизация.
 * Пока идёт сверка при входе и пока открыт конфликт — на сервер ничего не уходит.
 * Чужой словарь в этом браузере на сервер другого аккаунта не отправляется.
 */
export default function useCloudSync() {
  const store = useAppStore();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const forceSyncTick = useAppSelector((state) => state.auth.forceSyncTick);
  const [status, setStatus] = useState('idle');

  const lastPushed = useRef(null);
  const timerRef = useRef(null);
  const syncReady = useRef(false);
  const pushing = useRef(false);

  const push = useCallback(async () => {
    const state = store.getState();
    const payload = selectSyncPayload(state);
    const json = JSON.stringify(payload);
    if (
      !syncReady.current ||
      pushing.current ||
      !shouldPushSync({
        token: state.auth.token,
        conflict: state.auth.conflict,
        payloadJson: json,
        lastPushed: lastPushed.current,
      })
    ) {
      return;
    }

    pushing.current = true;
    try {
      setStatus('syncing');
      const data = await pushServerData(state.auth.token, attachUpdatedAt(payload));
      setServerUpdatedAt(data?.updatedAt ?? null);
      lastPushed.current = json;
      if (state.auth.user?.id) setDataOwnerId(state.auth.user.id);
      setStatus('synced');
    } catch (error) {
      if (error?.name === 'AbortError') return;
      if (error?.status === 409) {
        const serverPayload = error.data?.payload ?? null;
        setServerUpdatedAt(error.data?.updatedAt ?? null);
        setPendingServerPayload(serverPayload);
        dispatch(
          syncConflictDetected({
            serverCards: serverPayload?.cards?.length ?? 0,
            localCards: payload.cards?.length ?? 0,
            updatedAt: error.data?.updatedAt ?? null,
          })
        );
        setStatus('synced');
        return;
      }
      setStatus('error');
    } finally {
      pushing.current = false;
    }
  }, [store, dispatch]);

  // Сверка при входе. До её конца отправка закрыта.
  useEffect(() => {
    syncReady.current = false;
    lastPushed.current = null;

    if (!token) return undefined;

    let cancelled = false;

    (async () => {
      setStatus('syncing');
      try {
        const data = await fetchServerData(token);
        if (cancelled) return;

        const serverPayload = data?.payload ?? null;
        setServerUpdatedAt(data?.updatedAt ?? null);
        const localPayload = selectSyncPayload(store.getState());
        const decision = reconcileSync({
          serverPayload,
          localPayload,
          localOwnerId: getDataOwnerId(),
          userId,
        });

        if (decision === 'take-server') {
          applySyncPayload(store, serverPayload ?? EMPTY_PAYLOAD);
          lastPushed.current = JSON.stringify(selectSyncPayload(store.getState()));
          if (userId) setDataOwnerId(userId);
          syncReady.current = true;
          setStatus('synced');
          return;
        }

        if (decision === 'conflict') {
          setPendingServerPayload(serverPayload);
          dispatch(
            syncConflictDetected({
              serverCards: serverPayload?.cards?.length ?? 0,
              localCards: localPayload.cards?.length ?? 0,
              updatedAt: data?.updatedAt ?? null,
            })
          );
          if (userId) setDataOwnerId(userId);
          syncReady.current = true;
          setStatus('synced');
          return;
        }

        if (userId) setDataOwnerId(userId);
        syncReady.current = true;
        await push();
      } catch (error) {
        if (cancelled || error?.name === 'AbortError') return;
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, userId, store, dispatch, push]);

  // «Оставить из браузера» — отправить сразу, не через 3 секунды
  useEffect(() => {
    if (!token || !forceSyncTick) return;
    lastPushed.current = null;
    push();
  }, [forceSyncTick, token, push]);

  // Правки уходят после паузы. Конфликт и выход эту отправку не пропускают.
  useEffect(() => {
    if (!token) return undefined;

    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      if (!state.auth.token || state.auth.conflict || !syncReady.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        push();
      }, PUSH_DELAY_MS);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      unsubscribe();
    };
  }, [token, store, push]);

  return { status, push };
}
