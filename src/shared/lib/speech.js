// Озвучка через Web Speech API — встроено в браузер, без ключей и сети

let voicesPromise = null;

const loadVoices = () => {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise((resolve) => {
    const current = window.speechSynthesis.getVoices();
    if (current.length > 0) {
      resolve(current);
      return;
    }
    // голоса грузятся асинхронно, в Chromium первый вызов отдаёт пустой массив
    const onChange = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onChange);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', onChange);
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 3000);
  });

  return voicesPromise;
};

export const speak = async (text, lang = 'en-US') => {
  if (!('speechSynthesis' in window) || !text) return false;

  // Сразу «разблокируем» синтез — на iOS первый вызов после await не считается жестом
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));

  const voices = await loadVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;

  const normalized = lang.replace('_', '-');
  const voice =
    voices.find((item) => item.lang?.replace('_', '-') === normalized) ??
    voices.find((item) => item.lang?.startsWith(normalized.slice(0, 2)));
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
  return true;
};
