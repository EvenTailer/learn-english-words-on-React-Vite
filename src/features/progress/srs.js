// Интервальное повторение: после верного ответа слово «отдыхает» на N дней.
// Чистые функции без Redux и DOM — их можно тестировать в Node-окружении.

// Сколько дней не показывать слово после каждого верного ответа подряд
export const INTERVALS_DAYS = [1, 3, 7, 21, 60];

export const DAY_MS = 24 * 60 * 60 * 1000;

// Интервал по числу верных ответов подряд (1 -> 1 день, 2 -> 3 дня, ...)
export const intervalForStreak = (streak) => {
  const index = Math.min(Math.max(Number(streak) || 1, 1), INTERVALS_DAYS.length);
  return INTERVALS_DAYS[index - 1];
};

// Когда слово снова попадёт в тренировку
export const nextDueAt = (streak, now = Date.now()) =>
  now + intervalForStreak(streak) * DAY_MS;

// Слово просрочено, если срок повторения прошёл.
// Слово без записи прогресса (новое) считаем просроченным — его надо учить.
export const isDue = (entry, now = Date.now()) => {
  if (!entry) return true;
  if (entry.dueAt === null || entry.dueAt === undefined) return true;
  return entry.dueAt <= now;
};

// Число дней до следующего повторения (для подсказки в интерфейсе)
export const daysUntilDue = (entry, now = Date.now()) => {
  if (!entry?.dueAt) return 0;
  return Math.max(0, Math.ceil((entry.dueAt - now) / DAY_MS));
};

// Когда будет следующий повтор — по-русски, для интерфейса
export const formatDue = (entry, now = Date.now()) => {
  if (!entry?.dueAt) return 'ещё не учили';
  const days = daysUntilDue(entry, now);
  if (days <= 0) return 'пора повторить';
  if (days === 1) return 'повтор завтра';
  return `повтор через ${days} ${days < 5 ? 'дня' : 'дней'}`;
};
