// Русские склонения: 1 слово / 2-4 слова / 5+ слов
export const plural = (count, one, few, many) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

// «253 слова», «1 слово», «717 слов»
export const words = (count) => plural(count, 'слово', 'слова', 'слов');

// «3 набора», «1 набор», «5 наборов»
export const sets = (count) => plural(count, 'набор', 'набора', 'наборов');
