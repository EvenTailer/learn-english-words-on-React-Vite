// Готовые наборы слов: набор известен и без загрузки wordlists.json.
// Размеры набора и переводы лежат в src/data/wordlists.json.

export const WORD_SETS = [
  { key: 'top250', title: 'Топ 250', hint: 'Самые частотные слова' },
  { key: 'top500', title: 'Топ 500', hint: 'Частотные слова' },
  { key: 'top1000', title: 'Топ 1000', hint: 'Расширенный набор' },
  { key: 'top2000', title: 'Топ 2000', hint: 'Большой набор' },
  { key: 'cefrA1', title: 'Уровень A1', hint: 'Beginner · Oxford 3000' },
  { key: 'cefrA2', title: 'Уровень A2', hint: 'Elementary · Oxford 3000' },
  { key: 'cefrB1', title: 'Уровень B1', hint: 'Intermediate · Oxford 3000' },
  { key: 'cefrB2', title: 'Уровень B2', hint: 'Upper-Intermediate · Oxford 3000' },
];

export const wordSetByKey = (key) =>
  WORD_SETS.find((set) => set.key === key) ?? null;
