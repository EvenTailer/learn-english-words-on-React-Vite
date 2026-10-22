import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSelector, useAppStore } from '../../app/store/hooks';
import { fetchServerData, pushServerData } from '../lib/api';
import { applySyncPayload, isEmptyPayload, selectSyncPayload } from '../lib/sync';

const PUSH_DELAY_MS = 3000;

/**
 * Облачная синхронизация.
 * - при входе забираем данные с сервера (сервер — источник правды);
 *   если на сервере пусто — выкладываем локальные данные;
 * - каждое изменение в приложении уходит на сервер через 3 секунды тишины.
 */
export default function useCloudSync() {
  const store = useAppStore();
  const token = useAppSelector((state) => state.auth.token);
  // Состояние синхронизации живёт в сторе, а не в React: так его видно
  // и шапке, и страницам, и не нужно дублировать в useState
  const [status, setStatus] = useState('idle'); // idle | syncing | synced | error

  const lastPushed = useRef(null);
  const timerRef = useRef(null);

  const push = useCallback(async () => {
    if (!token) return;
    const payload = selectSyncPayload(store.getState());
    const json = JSON.stringify(payload);
    if (json === lastPushed.current) return;

    try {
      setStatus('syncing');
      await pushServerData(token, payload);
      lastPushed.current = json;
      setStatus('synced');
    } catch {
      setStatus('error');
    }
  }, [store, token]);

  // Забор данных с сервера
  useEffect(() => {
    if (!token) {
      lastPushed.current = null;
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setStatus('syncing');
      try {
        const data = await fetchServerData(token);
        if (cancelled) return;

        if (isEmptyPayload(data?.payload)) {
          // на сервере пусто — отдаём ему локальные данные
          lastPushed.current = null;
          await push();
          return;
        }

        applySyncPayload(store, data.payload);
        lastPushed.current = JSON.stringify(selectSyncPayload(store.getState()));
        setStatus('synced');
        } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, store, push]);

  // Отправка изменений
  useEffect(() => {
    if (!token) return undefined;

    const unsubscribe = store.subscribe(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        push();
      }, PUSH_DELAY_MS);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      unsubscribe();
    };
  }, [token, store, push]);

  return { status, push };
}
