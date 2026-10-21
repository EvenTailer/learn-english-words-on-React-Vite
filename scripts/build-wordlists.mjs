// Сборка списков слов с переводами на русский.
// Запуск: npm run build:wordlists
//
// Источники:
//   - Oxford 3000 CEFR (public domain, Unlicense) — разбивка по уровням A1-B2
//   - CEFR-J Vocabulary Profile 1.5 (Tono Laboratory, TUFS) — уровень каждого слова
//   - FrequencyWords en_50k (MIT, OpenSubtitles) — частотность, для «Топ N»
//
// Переводы — неофициальный эндпоинт Google, запрос на слово.
// Всё кешируется в scripts/.cache, повторный запуск быстрый.

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = resolve(ROOT, 'scripts/.cache');
const OUT_FILE = resolve(ROOT, 'src/data/wordlists.json');

const SOURCES = {
  oxford:
    'https://raw.githubusercontent.com/Kolia951/The_Oxford_3000_CEFR/main/package.txt',
  frequency:
    'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt',
  cefrj:
    'https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv',
};

// Картинки статей Википедии — бесплатно, без ключа.
// User-Agent с контактом обязателен: без него Wikimedia отдаёт 429.
const IMAGES_ENDPOINT = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT =
  'LearnEnglishWordsApp/1.0 (https://github.com/EvenTailer/learn-english-words-on-React-Vite; vasya.vasiliy.1964@mail.ru)';
const IMAGE_BATCH = 50;
const IMAGE_DELAY_MS = 1100;

const TOP_SIZES = [250, 500, 1000, 2000];
const CONCURRENCY = 8;

// Служебные слова — в «Топ N» попадают только содержательные слова
const STOPWORDS = new Set(
  `the be to of and a in that have i it for not on with he as you do at this but his by from
   they we say her she or an will my one all would there their what so up out if about who get
   which go me when make can like time no just him know take people into year your good some
   could them see other than then now look only come its over think also back after use two how
   our work first well way even new want because any these give day most us is are was were
   been being has had did does said made went gone got getting put used using
   thing things way ways lot lots really quite very much many more most little less
   am is are was were be been being do does did have has had will would shall should can could
   may might must let lets get gets got getting go goes going gone came come coming
   new old young big small large little good bad best better worse worst right wrong
   man men woman women child children people person home house room door floor wall
   day days night morning evening week month year time today tomorrow yesterday
   hello hi hey please thanks thank ok okay yes no yeah nope maybe
   since towards toward upon within without per via plus minus versus vs amid amidst
   amongst besides beyond despite except inside outside beneath above across along around
   through throughout under underneath between among against about above below off onto
   until up upon while whereas whether either neither both each every any all some few
   one two three four five six seven eight nine ten hundred thousand million`
    .split(/\s+/)
    .filter(Boolean)
);

const fetchText = async (url, fileName) => {
  const cached = resolve(CACHE_DIR, fileName);
  try {
    await access(cached);
    return await readFile(cached, 'utf8');
  } catch {
    // нет кеша — качаем
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  const text = await response.text();
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cached, text, 'utf8');
  return text;
};

const readJson = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
};

const writeJson = async (file, data) => {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 1), 'utf8');
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const translate = async (word) => {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${encodeURIComponent(word)}`;
  let lastError = null;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        await sleep(1500 * attempt);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const text = (data[0] ?? [])
        .map((part) => part[0])
        .filter(Boolean)
        .join('')
        .trim();
      if (!text) throw new Error('пустой перевод');
      return text.charAt(0).toUpperCase() + text.slice(1);
    } catch (error) {
      lastError = error;
      await sleep(800 * attempt);
    }
  }

  throw lastError ?? new Error('неизвестная ошибка');
};

const pool = async (items, worker, limit = CONCURRENCY) => {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
};

/**
 * Описание статьи по Википедии: «Edible fruit», «1987 studio album by Pet Shop Boys».
 * Если это произведение, а не обычное слово — картинку не берём.
 */
const isWorkOfArt = (description) => {
  const text = String(description ?? '').toLowerCase();
  if (!text) return false;
  if (
    /\b(song|album|single|ep|movie|film|band|novel|book|musical|play|opera|episode|series|video game|soundtrack|anthem)\b/.test(
      text
    )
  ) {
    return true;
  }
  // описание начинается с года — почти всегда название произведения
  return /^\d{4}\b/.test(text);
};

/**
 * Собирает картинки статей Википедии пачками по 50 слов.
 * Кэш в scripts/.cache/images.json — повторный запуск не ходит в сеть.
 * Покрытие: ~30% слов всего, до 80% у предметных существительных.
 */
const fetchImages = async (words) => {
  const cacheFile = resolve(CACHE_DIR, 'images.json');
  const cache = await readJson(cacheFile, {});
  const missing = words.filter((word) => !cache[word]);

  console.log(`Картинок нет в кеше: ${missing.length}`);

  for (let i = 0; i < missing.length; i += IMAGE_BATCH) {
    const chunk = missing.slice(i, i + IMAGE_BATCH);
    const url =
      `${IMAGES_ENDPOINT}?action=query&titles=${encodeURIComponent(chunk.join('|'))}` +
      '&prop=pageimages|description&piprop=thumbnail|original&pilicense=any&pithumbsize=400&format=json&origin=*';

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });

        if (response.status === 429) {
          await response.text();
          await sleep(4000);
          continue;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const normalized = Object.fromEntries(
          (data?.query?.normalized ?? []).map((item) => [item.to, item.from])
        );
        const redirected = Object.fromEntries(
          (data?.query?.redirects ?? []).map((item) => [item.to, item.from])
        );

        for (const page of Object.values(data?.query?.pages ?? {})) {
          const title = page.title ?? '';
          const word =
            redirected[normalized[title] ?? title] ?? normalized[title] ?? title;
          const description = page.description ?? '';
          const source = page.thumbnail?.source ?? page.original?.source ?? '';

          if (!source || isWorkOfArt(description)) {
            cache[word] = { url: '', desc: description };
            continue;
          }

          cache[word] = { url: source.split('?')[0], desc: description };
        }

        break;
      } catch (error) {
        console.warn(`  ! картинки, попытка ${attempt}: ${error.message}`);
        await sleep(3000);
      }
    }

    await writeJson(cacheFile, cache);
    if ((i + IMAGE_BATCH) % 500 === 0) {
      console.log(`  картинки: ${Math.min(i + IMAGE_BATCH, missing.length)}/${missing.length}`);
    }
    await sleep(IMAGE_DELAY_MS);
  }

  await writeJson(cacheFile, cache);
  const found = words.filter((word) => cache[word]?.url).length;
  console.log(`Картинок найдено: ${found} из ${words.length}`);

  return cache;
};

const main = async () => {
  console.log('Скачиваем источники...');
  const [oxfordText, frequencyText, cefrjText] = await Promise.all([
    fetchText(SOURCES.oxford, 'oxford3000.json'),
    fetchText(SOURCES.frequency, 'en_50k.txt'),
    fetchText(SOURCES.cefrj, 'cefrj.csv'),
  ]);

  const oxford = JSON.parse(oxfordText);

  // Уровень слова из CEFR-J (берем самый низкий из POS)
  const levelByWord = new Map();
  for (const line of cefrjText.split('\n').slice(1)) {
    const [headword, , cefr] = line.split(',');
    if (!headword || !cefr) continue;
    const word = headword.trim().toLowerCase();
    if (!word || word.includes(' ')) continue;
    const order = ['A1', 'A2', 'B1', 'B2', 'C1'];
    const current = levelByWord.get(word);
    if (!current || order.indexOf(cefr) < order.indexOf(current)) {
      levelByWord.set(word, cefr);
    }
  }

  // Частотный список -> содержательные слова
  // Словарь-фильтр: слово должно встречаться в Oxford 3000 или CEFR-J,
  // иначе в «Топ» попадают осколки субтитров: don, gonna, oh
  const vocabulary = new Set([
    ...Object.values(oxford).flat().map((word) => word.trim().toLowerCase()),
    ...[...levelByWord.keys()],
  ]);

  const frequency = frequencyText
    .split('\n')
    .map((line) => line.split(' ')[0])
    .filter(Boolean)
    .map((word) => word.toLowerCase())
    .filter(
      (word) =>
        /^[a-z][a-z-]{1,}$/.test(word) &&
        vocabulary.has(word) &&
        !STOPWORDS.has(word) &&
        !word.includes("'")
    );

  const uniqueFrequency = [...new Set(frequency)];
  const cefrSets = {};
  for (const level of ['A1', 'A2', 'B1', 'B2']) {
    cefrSets[level] = (oxford[level] ?? [])
      .map((word) => word.trim().toLowerCase())
      // служебные слова в тренажёре бесполезны: у них перевод в одну букву
      .filter((word) => word && !STOPWORDS.has(word));
  }

  const topSets = {};
  for (const size of TOP_SIZES) {
    topSets[`top${size}`] = uniqueFrequency.slice(0, size);
  }

  const allWords = [
    ...new Set([
      ...Object.values(topSets).flat(),
      ...Object.values(cefrSets).flat(),
    ]),
  ].filter((word) => /^[a-z][a-z-]{1,}$/.test(word));

  console.log(`Слов для перевода: ${allWords.length}`);

  const cacheFile = resolve(CACHE_DIR, 'translations.json');
  const cache = await readJson(cacheFile, {});
  let done = 0;

  const missing = allWords.filter((word) => !cache[word]);
  console.log(`Из них без кеша: ${missing.length}`);

  await pool(missing, async (word) => {
    try {
      cache[word] = await translate(word);
    } catch (error) {
      // неудачу не кешируем — попробуем в следующем запуске
      console.warn(`  ! ${word}: ${error.message}`);
    }
    done += 1;
    if (done % 50 === 0) {
      console.log(`  переведено ${done}/${missing.length}`);
      await writeJson(cacheFile, cache);
    }
  });
  await writeJson(cacheFile, cache);
  console.log('Переводы готовы, ищем картинки...');

  const images = await fetchImages(allWords);

  const buildSet = (words) =>
    words
      .map((word) => ({
        en: word,
        ru: cache[word] ?? '',
        level: levelByWord.get(word) ?? '',
        // картинка из Википедии; произведения (песни, альбомы) отсеяны
        img: images[word]?.url ?? '',
        desc: images[word]?.desc ?? '',
      }))
      .filter((item) => item.ru);



  const sets = {};
  for (const [name, words] of Object.entries(topSets)) {
    sets[name] = buildSet(words);
  }
  for (const [level, words] of Object.entries(cefrSets)) {
    sets[`cefr${level}`] = buildSet(words);
  }

  const result = {
    generatedAt: new Date().toISOString(),
    license: {
      oxford3000: 'Public domain (Unlicense)',
      cefrj: 'Free for commercial use with citation — Tono Laboratory, TUFS',
      frequency: 'MIT — hermitdave/FrequencyWords (OpenSubtitles)',
      translations: 'Google Translate unofficial endpoint',
    },
    sets,
  };

  await writeJson(OUT_FILE, result);
  console.log('Готово:', OUT_FILE);
  for (const [name, items] of Object.entries(sets)) {
    console.log(`  ${name}: ${items.length}`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
