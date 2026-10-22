import { describe, expect, it } from 'vitest';
import { reconcileSync, shouldPushSync } from './sync';

const local = {
  cards: [{ id: 'a', englishWord: 'lion' }],
  progress: { lion: { status: 'learning' } },
  stats: {},
  lists: [],
  settings: { theme: 'dark' },
};

const server = {
  cards: [{ id: 'b', englishWord: 'cat' }],
  progress: {},
  stats: {},
  lists: [],
  settings: { theme: 'dark' },
};

describe('reconcileSync', () => {
  it('отдаёт браузер, если на сервере пусто', () => {
    expect(
      reconcileSync({
        serverPayload: null,
        localPayload: local,
        localOwnerId: '1',
        userId: '1',
      })
    ).toBe('push-local');
  });

  it('берёт сервер, если в браузере пусто', () => {
    expect(
      reconcileSync({
        serverPayload: server,
        localPayload: { cards: [], progress: {}, lists: [] },
        localOwnerId: '1',
        userId: '1',
      })
    ).toBe('take-server');
  });

  it('спрашивает, когда данные разные', () => {
    expect(
      reconcileSync({
        serverPayload: server,
        localPayload: local,
        localOwnerId: '1',
        userId: '1',
      })
    ).toBe('conflict');
  });

  it('не спрашивает, когда копии совпадают', () => {
    expect(
      reconcileSync({
        serverPayload: local,
        localPayload: local,
        localOwnerId: '1',
        userId: '1',
      })
    ).toBe('take-server');
  });

  it('чужой кеш не уходит на сервер другого аккаунта', () => {
    expect(
      reconcileSync({
        serverPayload: null,
        localPayload: local,
        localOwnerId: '1',
        userId: '2',
      })
    ).toBe('take-server');
  });
});

describe('shouldPushSync', () => {
  it('молчит без сессии, при конфликте и если копия уже ушла', () => {
    expect(
      shouldPushSync({
        token: null,
        conflict: null,
        payloadJson: '{}',
        lastPushed: null,
      })
    ).toBe(false);

    expect(
      shouldPushSync({
        token: 't',
        conflict: { serverCards: 1 },
        payloadJson: '{}',
        lastPushed: null,
      })
    ).toBe(false);

    expect(
      shouldPushSync({
        token: 't',
        conflict: null,
        payloadJson: '{}',
        lastPushed: '{}',
      })
    ).toBe(false);

    expect(
      shouldPushSync({
        token: 't',
        conflict: null,
        payloadJson: '{"a":1}',
        lastPushed: null,
      })
    ).toBe(true);
  });
});
