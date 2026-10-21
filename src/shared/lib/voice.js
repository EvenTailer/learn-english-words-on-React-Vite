// Распознавание речи через Web Speech API (Chrome, Edge).
// Работает только в защищённом контексте: https или localhost.
// Браузер отправляет звук в облако Google — офлайн распознавание не работает.

const getRecognitionClass = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
};

// Поддерживается ли голосовой ввод в этом браузере и на этом адресе
export const isVoiceSupported = () => {
  if (!getRecognitionClass()) return false;
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return false;
  }
  return true;
};

/**
 * Создаёт распознаватель речи.
 * onResult(text) — распознанный текст, onError(code) — ошибка,
 * onEnd() — распознавание завершилось.
 */
export const createVoiceInput = ({
  lang = 'ru-RU',
  onResult,
  onError,
  onEnd,
} = {}) => {
  const Recognition = getRecognitionClass();
  if (!Recognition) return null;

  const recognition = new Recognition();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const results = event.results;
    const last = results[results.length - 1];
    const text = last?.[0]?.transcript?.trim();
    if (text) onResult?.(text);
  };

  recognition.onerror = (event) => onError?.(event?.error ?? 'unknown');
  recognition.onend = () => onEnd?.();

  return recognition;
};

// Человеческие тексты ошибок распознавания
export const VOICE_ERRORS = {
  'not-allowed': 'Доступ к микрофону запрещён',
  'no-speech': 'Ничего не услышано',
  'audio-capture': 'Микрофон не найден',
  network: 'Нет сети для распознавания',
  aborted: 'Запись прервана',
};
