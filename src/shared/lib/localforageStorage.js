import localforage from 'localforage';

// Ключ хранения совпадает с тем, что использовала стая версия приложения
// (redux-persist настроен с keyPrefix: '' и key: 'cards'),
// поэтому словарь переживает миграцию без потери карточек.
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
