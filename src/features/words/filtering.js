// Чистые функции фильтрации и сортировки карточек словаря.
// Без Redux, без DOM — их можно тестировать в Node-окружении.

export const STATUS_ALL = 'all';
export const STATUS_NEW = 'new';
export const STATUS_LEARNING = 'learning';
export const STATUS_MASTERED = 'mastered';

export const SORT_AZ_EN = 'az-en';
export const SORT_AZ_RU = 'az-ru';
export const SORT_PROGRESS = 'progress';
export const SORT_NEW_FIRST = 'new';

const KNOWN_STATUSES = [
  STATUS_ALL,
  STATUS_NEW,
  STATUS_LEARNING,
  STATUS_MASTERED,
];

// Ранг статуса: чем меньше, тем «свежее» слово
const STATUS_RANK = {
  [STATUS_NEW]: 0,
  [STATUS_LEARNING]: 1,
  [STATUS_MASTERED]: 2,
};

const normalize = (value) => String(value ?? '').trim().toLowerCase();

export const progressKey = (word) => normalize(word);

// Статус карточки берём из карты прогресса; без записи слово считается новым
export const cardStatus = (card, progressMap = {}) => {
  const entry = progressMap?.[progressKey(card?.englishWord)];
  return entry?.status ?? STATUS_NEW;
};

const statusRank = (card, progressMap) =>
  STATUS_RANK[cardStatus(card, progressMap)] ?? 0;

// Число верных ответов: прогресс важнее счётчика на самой карточке
const correctCount = (card, progressMap) => {
  const entry = progressMap?.[progressKey(card?.englishWord)];
  const raw = entry?.correct ?? card?.count ?? 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
};

const compareText = (a, b, locale = 'en') =>
  String(a ?? '').localeCompare(String(b ?? ''), locale, {
    sensitivity: 'base',
    numeric: true,
  });

/**
 * Фильтрует карточки по поисковой строке и статусу.
 * query ищет в английском слове и в переводе, регистр не важен.
 */
export const filterCards = (cards, options = {}) => {
  const { query = '', status = STATUS_ALL, progressMap = {} } = options ?? {};
  const list = Array.isArray(cards) ? cards : [];
  const needle = normalize(query);
  const wanted = KNOWN_STATUSES.includes(status) ? status : STATUS_ALL;

  return list.filter((card) => {
    if (wanted !== STATUS_ALL && cardStatus(card, progressMap) !== wanted) {
      return false;
    }
    if (!needle) return true;

    const english = normalize(card?.englishWord);
    const russian = normalize(card?.russianWord);
    return english.includes(needle) || russian.includes(needle);
  });
};

/**
 * Сортирует карточки. Исходный массив не мутируется.
 * az-en / az-ru — по алфавиту, progress — от изученных к новым,
 * new — от новых к изученным.
 */
export const sortCards = (cards, sortBy = SORT_AZ_EN, progressMap = {}) => {
  const list = Array.isArray(cards) ? [...cards] : [];

  switch (sortBy) {
    case SORT_AZ_RU:
      return list.sort(
        (a, b) =>
          compareText(a?.russianWord, b?.russianWord, 'ru') ||
          compareText(a?.englishWord, b?.englishWord)
      );

    case SORT_PROGRESS:
      return list.sort(
        (a, b) =>
          statusRank(b, progressMap) - statusRank(a, progressMap) ||
          correctCount(b, progressMap) - correctCount(a, progressMap) ||
          compareText(a?.englishWord, b?.englishWord)
      );

    case SORT_NEW_FIRST:
      return list.sort(
        (a, b) =>
          statusRank(a, progressMap) - statusRank(b, progressMap) ||
          correctCount(a, progressMap) - correctCount(b, progressMap) ||
          compareText(a?.englishWord, b?.englishWord)
      );

    case SORT_AZ_EN:
    default:
      return list.sort(
        (a, b) =>
          compareText(a?.englishWord, b?.englishWord) ||
          compareText(a?.russianWord, b?.russianWord, 'ru')
      );
  }
};
