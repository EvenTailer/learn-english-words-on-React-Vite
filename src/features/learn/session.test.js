import { describe, expect, it } from 'vitest';
import { advanceQueue, buildQueue, pickFromQueue, shuffle } from './session';

describe('shuffle', () => {
  it('не теряет и не дублирует элементы', () => {
    const items = [1, 2, 3, 4, 5];
    expect([...shuffle(items)].sort()).toEqual(items);
  });

  it('не меняет исходный массив', () => {
    const items = [1, 2, 3];
    shuffle(items);
    expect(items).toEqual([1, 2, 3]);
  });
});

describe('buildQueue', () => {
  it('содержит все карточки без повторов', () => {
    const queue = buildQueue([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect([...queue].sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('advanceQueue', () => {
  it('уводит отвеченную карточку в конец', () => {
    expect(advanceQueue(['a', 'b', 'c'], 'a')).toEqual(['b', 'c', 'a']);
  });

  it('на единственной карточке оставляет её же', () => {
    expect(advanceQueue(['a'], 'a')).toEqual(['a']);
  });
});

describe('pickFromQueue', () => {
  it('пропускает удалённые карточки', () => {
    expect(pickFromQueue(['a', 'b'], ['b'])).toBe('b');
  });

  it('возвращает null, если ничего не осталось', () => {
    expect(pickFromQueue(['a'], [])).toBeNull();
  });
});
