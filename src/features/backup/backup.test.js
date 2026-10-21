import { describe, expect, it } from 'vitest';
import { BACKUP_VERSION, backupSummary, buildBackup } from './backup';
import cardsReducer, { cardsReplaced } from '../words/wordsSlice';
import progressReducer, { progressReplaced } from '../progress/progressSlice';
import listsReducer, { listsReplaced } from '../lists/listsSlice';
import statsReducer, { statsReplaced } from '../stats/statsSlice';

const STATE = {
  cards: { items: [{ id: 'a', englishWord: 'lion', russianWord: 'лев' }] },
  progress: { words: { lion: { status: 'learning', streak: 2 } } },
  stats: { history: { '2026-01-01': { correct: 3 } }, streak: { current: 1, longest: 4, lastActiveDate: '2026-01-01' }, totalCorrect: 3, totalWrong: 1, totalLearned: 0 },
  lists: { items: [{ id: 'l1', name: 'Еда', words: [] }] },
  settings: { theme: 'dark', dailyGoal: 20 },
};

describe('бэкап', () => {
  it('собирает все разделы данных', () => {
    const data = buildBackup(STATE);
    expect(data.version).toBe(BACKUP_VERSION);
    expect(data.cards).toHaveLength(1);
    expect(data.progress.lion.streak).toBe(2);
    expect(data.lists).toHaveLength(1);
    expect(data.settings.theme).toBe('dark');
  });

  it('восстанавливает словарь, прогресс, наборы и статистику', () => {
    const data = buildBackup(STATE);

    const cards = cardsReducer(undefined, cardsReplaced(data.cards));
    const progress = progressReducer(undefined, progressReplaced(data.progress));
    const lists = listsReducer(undefined, listsReplaced(data.lists));
    const stats = statsReducer(undefined, statsReplaced(data.stats));

    expect(cards.items).toHaveLength(1);
    expect(progress.words.lion.streak).toBe(2);
    expect(lists.items[0].name).toBe('Еда');
    expect(stats.totalCorrect).toBe(3);
    expect(stats.history['2026-01-01'].correct).toBe(3);
  });

  it('считает содержимое файла для подтверждения', () => {
    const summary = backupSummary(buildBackup(STATE));
    expect(summary.cards).toBe(1);
    expect(summary.progress).toBe(1);
    expect(summary.lists).toBe(1);
  });
});
