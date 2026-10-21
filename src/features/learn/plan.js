// План тренировки: что учим, в каком формате и сколько слов.
// Чистые функции без Redux — их можно тестировать в Node-окружении.

import { isDue } from '../progress/srs';

// Откуда берём слова для тренировки
export const LEARN_SOURCES = {
  ALL: 'all', // весь словарь
  DUE: 'due', // к повторению по расписанию
  ERRORS: 'errors', // слова, где были ошибки
  NEW: 'new', // ещё не начатые
  LIST: 'list', // свой набор слов
  SET: 'set', // готовый набор
};

export const SOURCE_OPTIONS = [
  { value: LEARN_SOURCES.ALL, label: 'Все слова' },
  { value: LEARN_SOURCES.DUE, label: 'К повторению' },
  { value: LEARN_SOURCES.ERRORS, label: 'Только ошибки' },
  { value: LEARN_SOURCES.NEW, label: 'Только новые' },
  { value: LEARN_SOURCES.LIST, label: 'Мои наборы' },
  { value: LEARN_SOURCES.SET, label: 'Готовые наборы' },
];

// Как отвечаем
export const ANSWER_MODES = {
  TEXT: 'text', // пишем перевод
  CHOICE: 'choice', // выбираем перевод из четырёх
  AUDIO: 'audio', // слышим слово и пишем его
};

export const ANSWER_MODE_OPTIONS = [
  { value: ANSWER_MODES.TEXT, label: 'Ввод текста' },
  { value: ANSWER_MODES.CHOICE, label: 'Выбор ответа' },
  { value: ANSWER_MODES.AUDIO, label: 'Аудио' },
];

// Направление перевода
export const DIRECTION_OPTIONS = [
  { value: 'mixed', label: 'Смешанное' },
  { value: 'en-ru', label: 'EN → RU' },
  { value: 'ru-en', label: 'RU → EN' },
];

// Сколько слов в одной тренировке
export const SESSION_SIZES = [10, 20, 50];

export const DEFAULT_PLAN = {
  source: LEARN_SOURCES.ALL,
  setKey: null,
  listId: null,
  size: 20,
  direction: 'mixed',
  answerMode: ANSWER_MODES.TEXT,
};

const progressKey = (word) => String(word ?? '').trim().toLowerCase();

/**
 * Отбирает слова под план тренировки.
 * progressMap — карта прогресса по слову, now — текущий момент.
 * listWords — слова выбранного своего списка (для source=list).
 */
export const selectPool = (
  cards,
  { progressMap = {}, plan = DEFAULT_PLAN, now = Date.now(), listWords = [] } = {}
) => {
  const list = Array.isArray(cards) ? cards : [];
  const listKeys = new Set(
    (listWords ?? []).map((word) =>
      progressKey(typeof word === 'string' ? word : word?.englishWord)
    )
  );

  return list.filter((card) => {
    const entry = progressMap[progressKey(card?.englishWord)];

    switch (plan.source) {
      case LEARN_SOURCES.DUE:
        return isDue(entry, now);

      case LEARN_SOURCES.ERRORS:
        return Boolean(entry && entry.wrong > 0 && entry.status !== 'mastered');

      case LEARN_SOURCES.NEW:
        return !entry || entry.status === 'new';

      case LEARN_SOURCES.LIST:
        return listKeys.has(progressKey(card?.englishWord));

      case LEARN_SOURCES.SET:
        return (
          Array.isArray(card?.sets) && card.sets.includes(plan.setKey)
        );

      case LEARN_SOURCES.ALL:
      default:
        // Выученные слова возвращаются в тренировку по расписанию
        return !(entry?.status === 'mastered' && !isDue(entry, now));
    }
  });
};

/**
 * Строит очередь карточек по плану: перемешивает и режет по размеру.
 * size = 'all' — взять весь пул.
 */
export const buildPlanQueue = (cards, options = {}) => {
  const { plan = DEFAULT_PLAN } = options;
  const pool = selectPool(cards, options);
  const ids = pool.map((card) => card.id);
  const limit = plan.size === 'all' ? ids.length : Number(plan.size) || 20;
  return shuffle(ids).slice(0, limit);
};

/**
 * Варианты ответа для режима выбора: правильный перевод + три чужих.
 */
export const buildChoices = (card, cards, count = 4) => {
  const answer = card?.russianWord ?? '';
  if (!answer) return [];

  const pool = (Array.isArray(cards) ? cards : []).filter(
    (item) =>
      item.id !== card.id &&
      item.russianWord &&
      item.russianWord !== answer
  );

  const distractors = shuffle(pool)
    .slice(0, Math.max(0, count - 1))
    .map((item) => item.russianWord);

  return shuffle([answer, ...distractors]);
};

// Перемешивание Фишера—Йетса
export const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Направление вопроса: 'eng' — показываем английское слово, 'rus' — русское
export const pickMode = (direction, answerMode = ANSWER_MODES.TEXT) => {
  if (answerMode === ANSWER_MODES.CHOICE) return 'eng';
  if (answerMode === ANSWER_MODES.AUDIO) return 'rus';
  if (direction === 'en-ru') return 'eng';
  if (direction === 'ru-en') return 'rus';
  return Math.random() < 0.5 ? 'eng' : 'rus';
};
