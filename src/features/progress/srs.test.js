import { describe, expect, it } from 'vitest';
import { DAY_MS, INTERVALS_DAYS, intervalForStreak, isDue, nextDueAt } from './srs';

describe('srs', () => {
  it('растёт интервал по числу верных ответов подряд', () => {
    expect(intervalForStreak(1)).toBe(INTERVALS_DAYS[0]);
    expect(intervalForStreak(2)).toBe(INTERVALS_DAYS[1]);
    expect(intervalForStreak(3)).toBe(INTERVALS_DAYS[2]);
  });

  it('не выходит за последний интервал', () => {
    expect(intervalForStreak(99)).toBe(INTERVALS_DAYS.at(-1));
  });

  it('считает дату следующего повторения', () => {
    const now = 1_700_000_000_000;
    expect(nextDueAt(1, now)).toBe(now + INTERVALS_DAYS[0] * DAY_MS);
  });

  it('новое слово считается просроченным', () => {
    expect(isDue(undefined)).toBe(true);
    expect(isDue({ dueAt: null })).toBe(true);
  });

  it('слово не просрочено раньше срока', () => {
    const now = 1_700_000_000_000;
    expect(isDue({ dueAt: now + 1000 }, now)).toBe(false);
    expect(isDue({ dueAt: now - 1 }, now)).toBe(true);
  });
});
