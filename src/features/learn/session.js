// Чистая логика учебной сессии: очередь карточек вместо случайного выбора

// Перемешивание Фишера—Йетса
export const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const buildQueue = (cards) => shuffle(cards.map((card) => card.id));

// Отвеченная карточка уходит в конец очереди — сразу она не повторится
export const advanceQueue = (queue, cardId) => [
  ...queue.filter((id) => id !== cardId),
  cardId,
];

// Первая карточка очереди, которая ещё есть в словаре
export const pickFromQueue = (queue, availableIds) =>
  queue.find((id) => availableIds.includes(id)) ?? null;
