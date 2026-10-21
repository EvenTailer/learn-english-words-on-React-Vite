// Бесплатные API без ключей и без бэкенда.
// Все проверены из Беларуси: CORS разрешает запросы из браузера.

const DICTIONARY_ENDPOINT = 'https://freedictionaryapi.com/api/v1/entries/en';
const TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const COMMONS_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';

// «го́род» -> «город»: Wiktionary пишет ударение комбинирующими знаками
export const stripStress = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0301/g, '')
    .trim();

// Словарь: определение, транскрипция, переводы на русский
export const fetchDictionary = async (word, signal) => {
  const url = `${DICTIONARY_ENDPOINT}/${encodeURIComponent(word)}?translations=true`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Словарь недоступен (HTTP ${response.status})`);
  }

  const data = await response.json();
  const entry = data.entries?.[0];
  if (!entry) return null;

  const sense =
    entry.senses?.find((item) => item.translations?.length) ?? entry.senses?.[0];

  const russian = (sense?.translations ?? [])
    .filter((item) => item.language?.code === 'ru')
    .map((item) => stripStress(item.word))
    .filter(Boolean);

  return {
    word: data.word,
    partOfSpeech: entry.partOfSpeech ?? '',
    phonetic: entry.pronunciations?.find((item) => item.text)?.text ?? '',
    definition: sense?.definition ?? '',
    example: sense?.examples?.[0] ?? '',
    translations: [...new Set(russian)],
  };
};

// Перевод EN -> RU
export const fetchTranslation = async (text, from = 'en', to = 'ru', signal) => {
  const url = `${TRANSLATE_ENDPOINT}?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Перевод недоступен (HTTP ${response.status})`);
  }
  const data = await response.json();
  return (data[0] ?? [])
    .map((part) => part[0])
    .filter(Boolean)
    .join('');
};

// Картинка по слову из Wikimedia Commons (нужен origin=* для CORS)
export const fetchImage = async (word, signal) => {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${word} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '5',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '400',
    format: 'json',
    origin: '*',
  });

  const response = await fetch(`${COMMONS_ENDPOINT}?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`Картинки недоступны (HTTP ${response.status})`);
  }

  const data = await response.json();
  const pages = Object.values(data.query?.pages ?? {});
  const page = pages.find((item) => item.imageinfo?.[0]?.thumburl);
  if (!page) return null;

  return {
    url: page.imageinfo[0].thumburl,
    title: page.title ?? '',
    source: 'Wikimedia Commons',
  };
};
