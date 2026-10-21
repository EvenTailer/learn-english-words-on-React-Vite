import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { themeSet } from '../../features/settings/settingsSlice';
import { applyTheme, THEME_STORAGE_KEY } from '../lib/theme';

// Применяет тему к <html data-theme> и запоминает выбор
export const useTheme = () => {
  const theme = useAppSelector((state) => state.settings.theme);
  const dispatch = useAppDispatch();

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // приватный режим — тема просто не запомнится
    }
  }, [theme]);

  return {
    theme,
    setTheme: (next) => dispatch(themeSet(next)),
  };
};
