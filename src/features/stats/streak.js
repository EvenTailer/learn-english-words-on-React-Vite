import { diffDays } from '../../shared/lib/date';

const hasAnswers = (day) => (day?.correct ?? 0) + (day?.wrong ?? 0) > 0;

// Текущая и самая длинная серия дней с ответами
export const computeStreak = (history, todayISO) => {
  const dates = Object.keys(history)
    .filter((date) => hasAnswers(history[date]))
    .sort();

  let longest = 0;
  let run = 0;
  let previous = null;

  for (const date of dates) {
    if (previous && diffDays(previous, date) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    previous = date;
  }

  let current = 0;
  const last = dates.at(-1);
  if (last) {
    const gap = diffDays(last, todayISO);
    // серия жива, если последний день — сегодня или вчера
    if (gap === 0 || gap === 1) {
      current = 1;
      for (let index = dates.length - 1; index > 0; index -= 1) {
        if (diffDays(dates[index - 1], dates[index]) === 1) {
          current += 1;
        } else {
          break;
        }
      }
    }
  }

  return { current, longest, lastActiveDate: last ?? null };
};
