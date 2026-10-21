import { describe, expect, it } from 'vitest';
import { addDays, diffDays, parseISODate, toISODate } from './date';

describe('toISODate', () => {
  it('возвращает дату в формате YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('дополняет месяц и день нулём', () => {
    expect(toISODate(new Date(2026, 8, 9))).toBe('2026-09-09');
  });
});

describe('parseISODate', () => {
  it('читает дату обратно', () => {
    const date = parseISODate('2026-03-15');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(15);
  });
});

describe('addDays', () => {
  it('прибавляет дни', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('отнимает дни', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('diffDays', () => {
  it('считает разницу между днями', () => {
    expect(diffDays('2026-01-01', '2026-01-03')).toBe(2);
  });

  it('возвращает 0 для одного дня', () => {
    expect(diffDays('2026-01-01', '2026-01-01')).toBe(0);
  });

  it('учитывает переход через месяц', () => {
    expect(diffDays('2026-01-30', '2026-02-02')).toBe(3);
  });
});
