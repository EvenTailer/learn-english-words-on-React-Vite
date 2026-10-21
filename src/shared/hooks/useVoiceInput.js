import { useCallback, useEffect, useRef, useState } from 'react';
import { createVoiceInput, isVoiceSupported } from '../lib/voice';

/**
 * Хук голосового ввода.
 * supported — можно ли использовать в этом браузере,
 * listening — идёт ли запись, start/stop/toggle — управление.
 */
export default function useVoiceInput({ lang = 'ru-RU', onResult, onError } = {}) {
  const supported = isVoiceSupported();
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  // Колбэки в refs, чтобы start не пересоздавался на каждый рендер
  const resultRef = useRef(onResult);
  const errorRef = useRef(onError);

  useEffect(() => {
    resultRef.current = onResult;
    errorRef.current = onError;
  });

  useEffect(
    () => () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // уже остановлен — ничего делать не нужно
      }
    },
    []
  );

  const start = useCallback(() => {
    if (!supported || listening) return;

    const recognition = createVoiceInput({
      lang,
      onResult: (text) => resultRef.current?.(text),
      onError: (code) => {
        setListening(false);
        errorRef.current?.(code);
      },
      onEnd: () => setListening(false),
    });

    if (!recognition) return;

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      // распознавание уже идёт — просто игнорируем
      setListening(false);
    }
  }, [supported, listening, lang]);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // нечего останавливать
    }
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, start, stop, toggle };
}
