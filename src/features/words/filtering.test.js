import { describe, expect, it } from 'vitest';
import {
  STATUS_ALL,
  STATUS_MASTERED,
  STATUS_NEW,
  SORT_AZ_EN,
  SORT_AZ_RU,
  SORT_NEW_FIRST,
  SORT_PROGRESS,
  cardStatus,
  filterCards,
  sortCards,
} from './filtering';

const cards = [
  { id: '1', englishWord: 'Lion', russianWord: 'Лев', linkImg: '', count: 3 },
  { id: '2', englishWord: 'apple', russianWord: 'Яблоко', linkImg: '', count: 0 },
  { id: '3', englishWord: 'zebra', russianWord: 'Зебра', linkImg: '', count: 5 },
];

const progressMap = {
  lion: { key: 'lion', englishWord: 'Lion', status: 'mastered', correct: 6, wrong: 1 },
  zebra: { key: 'zebra', englishWord: 'zebra', status: 'learning', correct: 2, wrong: 0 },
};

const ids = (list) => list.map((card) => card.id);

describe('cardStatus', () => {
  it('считает слово новым, если записи в прогрессе нет', () => {
    expect(cardStatus(cards[1], progressMap)).toBe(STATUS_NEW);
  });

  it('берёт статус из карты прогресса', () => {
    expect(cardStatus(cards[0], progressMap)).toBe(STATUS_MASTERED);
    expect(cardStatus(cards[2], progressMap)).toBe('learning');
  });

  it('не падает без карты прогресса', () => {
    expect(cardStatus(cards[0])).toBe(STATUS_NEW);
  });
});

describe('filterCards', () => {
  it('без запроса и фильтра отдаёт все карточки', () => {
    expect(ids(filterCards(cards, { progressMap }))).toEqual(['1', '2', '3']);
  });

  it('ищет по английскому слову без учёта регистра', () => {
    const found = filterCards(cards, { query: 'LIO', progressMap });
    expect(ids(found)).toEqual(['1']);
  });

  it('ищет по русскому переводу', () => {
    const found = filterCards(cards, { query: 'зебр', progressMap });
    expect(ids(found)).toEqual(['3']);
  });

  it('убирает пробелы вокруг запроса', () => {
    expect(ids(filterCards(cards, { query: '  apple  ', progressMap }))).toEqual(['2']);
  });

  it('фильтрует по статусу «изученные»', () => {
    const found = filterCards(cards, { status: STATUS_MASTERED, progressMap });
    expect(ids(found)).toEqual(['1']);
  });

  it('фильтрует по статусу «новые»', () => {
    const found = filterCards(cards, { status: STATUS_NEW, progressMap });
    expect(ids(found)).toEqual(['2']);
  });

  it('неизвестный статус трактуется как «все»', () => {
    const found = filterCards(cards, { status: 'nonsense', progressMap });
    expect(ids(found)).toEqual(['1', '2', '3']);
  });

  it('пустой массив даёт пустой результат', () => {
    expect(filterCards([], { query: 'lion', progressMap })).toEqual([]);
    expect(filterCards(null, { query: 'lion' })).toEqual([]);
  });

  it('не мутирует исходный массив', () => {
    const source = [...cards];
    filterCards(source, { query: 'lion', progressMap });
    expect(ids(source)).toEqual(['1', '2', '3']);
  });
});

describe('sortCards', () => {
  it('сортирует по английскому алфавиту', () => {
    const sorted = sortCards(cards, SORT_AZ_EN, progressMap);
    expect(ids(sorted)).toEqual(['2', '1', '3']);
  });

  it('сортирует по русскому переводу', () => {
    const sorted = sortCards(cards, SORT_AZ_RU, progressMap);
    expect(ids(sorted)).toEqual(['3', '1', '2']);
  });

  it('по прогрессу: сначала изученные, потом в процессе, потом новые', () => {
    const sorted = sortCards(cards, SORT_PROGRESS, progressMap);
    expect(ids(sorted)).toEqual(['1', '3', '2']);
  });

  it('сначала новые: новые, в процессе, изученные', () => {
    const sorted = sortCards(cards, SORT_NEW_FIRST, progressMap);
    expect(ids(sorted)).toEqual(['2', '3', '1']);
  });

  it('неизвестный ключ сортировки работает как алфавит EN', () => {
    expect(ids(sortCards(cards, 'nonsense', progressMap))).toEqual(['2', '1', '3']);
  });

  it('не мутирует исходный массив', () => {
    const source = [...cards];
    sortCards(source, SORT_AZ_EN, progressMap);
    expect(ids(source)).toEqual(['1', '2', '3']);
  });

  it('пустой массив остаётся пустым', () => {
    expect(sortCards([], SORT_AZ_EN, progressMap)).toEqual([]);
  });
});
