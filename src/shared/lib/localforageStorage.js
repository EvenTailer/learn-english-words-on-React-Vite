import localforage from 'localforage';

// Ключи хранения совпадают с теми, что использовала старая версия приложения
// ('cards' для словаря), поэтому данные переживают миграцию на redux-persist.
export const localforageStorage = {
  async getItem(key) {
    const raw = await localforage.getItem(key);
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'string') return raw;

    // Миграция: старая версия сохраняла голый массив карточек.
    // redux-persist ожидает объект, где каждое значение — строка с JSON.
    if (Array.isArray(raw)) {
      return JSON.stringify({ items: JSON.stringify(raw) });
    }

    return JSON.stringify(raw);
  },

  async setItem(key, value) {
    await localforage.setItem(key, value);
  },

  async removeItem(key) {
    await localforage.removeItem(key);
  },
};
