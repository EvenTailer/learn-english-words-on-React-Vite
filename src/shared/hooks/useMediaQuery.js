import { useCallback, useSyncExternalStore } from 'react';

/**
 * Подписка на media-query. Значение читается из внешнего источника
 * (matchMedia), поэтому состояние не дублируется в useState.
 */
export const useMediaQuery = (query) => {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
