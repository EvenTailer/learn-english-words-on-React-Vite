export const THEME_STORAGE_KEY = 'learn-english-theme';

const isKnown = (value) =>
  ['dark', 'light', 'ocean', 'sunset', 'forest'].includes(value);

// Тема из localStorage, при первом заходе — системная
export const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isKnown(stored)) return stored;
  } catch {
    // приватный режим — читаем системную
  }
  try {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {
    // matchMedia недоступен
  }
  return 'dark';
};

export const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme =
    theme === 'light' ? 'light' : 'dark';
};
