import { describe, expect, it } from 'vitest';
import { computeStreak } from './streak';

const day = (correct = 1, wrong = 0) => ({ correct, wrong, learned: 0 });

describe('computeStreak', () => {
  it('дни без ответов не считаются активностью', () => {
    const streak = computeStreak({ '2026-01-01': day(0, 0) }, '2026-01-01');
    expect(streak.current).toBe(0);
  });

  it('считает текущую серию при активности сегодня', () => {
    const history = {
      '2026-01-01': day(),
      '2026-01-02': day(),
      '2026-01-03': day(),
    };
    const streak = computeStreak(history, '2026-01-03');
    expect(streak.current).toBe(3);
    expect(streak.longest).toBe(3);
  });

  it('серия жива, если последний день был вчера', () => {
    const history = { '2026-01-01': day(), '2026-01-02': day() };
    const streak = computeStreak(history, '2026-01-03');
    expect(streak.current).toBe(2);
  });

  it('серия обнуляется после пропущенного дня', () => {
    const history = { '2026-01-01': day(), '2026-01-02': day() };
    const streak = computeStreak(history, '2026-01-05');
    expect(streak.current).toBe(0);
    expect(streak.longest).toBe(2);
  });

  it('находит самую длинную серию в истории', () => {
    const history = {
      '2026-01-01': day(),
      '2026-01-02': day(),
      '2026-01-05': day(),
      '2026-01-06': day(),
      '2026-01-07': day(),
    };
    const streak = computeStreak(history, '2026-01-07');
    expect(streak.current).toBe(3);
    expect(streak.longest).toBe(3);
  });

  it('пустая история — нулевая серия', () => {
    expect(computeStreak({}, '2026-01-01').current).toBe(0);
  });
});
