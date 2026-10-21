import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchDictionary,
  fetchImage,
  fetchTranslation,
  stripStress,
} from './dictionaryApi';

const mockFetch = (payload, ok = true, status = 200) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok,
      status,
      json: async () => payload,
    }))
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('stripStress', () => {
  it('убирает знаки ударения', () => {
    expect(stripStress('го́род')).toBe('город');
  });

  it('переживает пустое значение', () => {
    expect(stripStress(undefined)).toBe('');
  });
});

describe('fetchDictionary', () => {
  it('достаёт перевод, транскрипцию и определение', async () => {
    mockFetch({
      word: 'city',
      entries: [
        {
          partOfSpeech: 'noun',
          pronunciations: [{ type: 'ipa', text: '/ˈsɪti/' }],
          senses: [
            {
              definition: 'A large settlement',
              examples: ['Tokyo is a big city'],
              translations: [
                { language: { code: 'ru' }, word: 'го́род' },
                { language: { code: 'ru' }, word: 'град' },
                { language: { code: 'de' }, word: 'Stadt' },
              ],
            },
          ],
        },
      ],
    });

    const result = await fetchDictionary('city');

    expect(result.phonetic).toBe('/ˈsɪti/');
    expect(result.definition).toBe('A large settlement');
    expect(result.example).toBe('Tokyo is a big city');
    expect(result.translations).toEqual(['город', 'град']);
  });

  it('возвращает null, если слова нет в словаре', async () => {
    mockFetch({ word: 'zzz', entries: [] });
    expect(await fetchDictionary('zzz')).toBeNull();
  });

  it('падает с понятной ошибкой при недоступности', async () => {
    mockFetch({}, false, 503);
    await expect(fetchDictionary('city')).rejects.toThrow('HTTP 503');
  });
});

describe('fetchTranslation', () => {
  it('склеивает части перевода', async () => {
    mockFetch([[['город', 'city', null, null, 10]]]);
    expect(await fetchTranslation('city')).toBe('город');
  });
});

describe('fetchImage', () => {
  it('берёт первую картинку из результатов', async () => {
    mockFetch({
      query: {
        pages: {
          1: {
            title: 'File:A.jpg',
            imageinfo: [{ thumburl: 'https://img/a.jpg' }],
          },
          2: { title: 'File:B.jpg' },
        },
      },
    });

    const result = await fetchImage('lion');

    expect(result.url).toBe('https://img/a.jpg');
    expect(result.source).toBe('Wikimedia Commons');
  });

  it('возвращает null, если картинок нет', async () => {
    mockFetch({ query: { pages: {} } });
    expect(await fetchImage('zzz')).toBeNull();
  });
});
