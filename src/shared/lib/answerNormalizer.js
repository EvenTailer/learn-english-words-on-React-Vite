import { levenshtein } from './levenshtein';

const QUOTES = /[«»"'`]/g;
const DASHES = /[–—]/g;
const SPACES = /\s+/g;

const TYPO_TOLERANCE = 1;
const TYPO_MIN_LENGTH = 4;

// Приводит ответ к сравнимому виду: регистр, кавычки, тире, пробелы, ё
export const normalizeAnswer = (value) =>
  String(value ?? '')
    .replace(QUOTES, '')
    .replace(DASHES, '-')
    .replace(SPACES, ' ')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е');

// Варианты ответа: "лев/львы" -> ['лев', 'львы']
export const splitVariants = (value) =>
  normalizeAnswer(value)
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

const isLatin = (word) => /^[a-z-]+$/.test(word);

// Обесцениваем английские окончания: "lions" -> "lion", "boxes" -> "box".
// Русские формы через singular не сводим — для них варианты пишутся в карточке.
export const singularize = (word) => {
  if (!isLatin(word) || word.length < 4) return word;
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (/(ch|sh|x|z|s)es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('ss')) return word;
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
};

export const isAnswerMatch = (userAnswer, correctAnswer) => {
  const user = normalizeAnswer(userAnswer);
  if (!user) return false;

  const accepted = new Set();
  for (const variant of splitVariants(correctAnswer)) {
    accepted.add(variant);
    accepted.add(singularize(variant));
  }

  if (accepted.has(user) || accepted.has(singularize(user))) return true;

  // Одна опечатка в длинных словах: "elephent" -> "elephant"
  if (user.length >= TYPO_MIN_LENGTH) {
    for (const variant of accepted) {
      if (
        variant.length >= TYPO_MIN_LENGTH &&
        levenshtein(user, variant) <= TYPO_TOLERANCE
      ) {
        return true;
      }
    }
  }

  return false;
};
