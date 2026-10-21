import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { lookupWord } from '../features/dictionary/dictionarySlice';
import { selectLists } from '../features/lists/selectors';
import { wordsAddedToList } from '../features/lists/listsSlice';
import { wordAdded } from '../features/progress/progressSlice';
import { toastShown } from '../features/ui/toastSlice';
import { selectCards } from '../features/words/selectors';
import { cardAdded } from '../features/words/wordsSlice';
import { createId } from '../shared/lib/id';
import { VOICE_ERRORS } from '../shared/lib/voice';
import useVoiceInput from '../shared/hooks/useVoiceInput';
import Button from '../shared/ui/Button';
import Card from '../shared/ui/Card';
import Icon from '../shared/ui/Icon';
import IconButton from '../shared/ui/IconButton';
import Input from '../shared/ui/Input';
import Chip from '../shared/ui/Chip';
import SetCreateModal from '../widgets/SetCreateModal/SetCreateModal';
import WordCard from '../widgets/WordCard/WordCard';
import styles from './AddPage.module.css';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 МБ
const MAX_SUGGESTIONS = 5;

export default function AddPage() {
  const dispatch = useAppDispatch();

  const cards = useAppSelector(selectCards);
  const lists = useAppSelector(selectLists);
  const lookupStatus = useAppSelector((state) => state.dictionary.status);

  const [englishWord, setEnglishWord] = useState('');
  const [russianWord, setRussianWord] = useState('');
  const [linkImg, setLinkImg] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [imageSource, setImageSource] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [englishError, setEnglishError] = useState('');
  const [russianError, setRussianError] = useState('');
  const [listId, setListId] = useState('');
  const [isCreatingSet, setIsCreatingSet] = useState(false);

  const englishRef = useRef(null);
  const russianRef = useRef(null);
  const fileInputRef = useRef(null);

  // Голосовой ввод: английское слово и перевод
  const englishVoice = useVoiceInput({
    lang: 'en-US',
    onResult: (text) => setEnglishWord(text),
    onError: (code) =>
      dispatch(
        toastShown({
          message: VOICE_ERRORS[code] ?? 'Не удалось распознать речь',
          type: 'error',
        })
      ),
  });

  const russianVoice = useVoiceInput({
    lang: 'ru-RU',
    onResult: (text) => setRussianWord(text),
    onError: (code) =>
      dispatch(
        toastShown({
          message: VOICE_ERRORS[code] ?? 'Не удалось распознать речь',
          type: 'error',
        })
      ),
  });

  // Освобождаем объектный URL предпросмотра
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  // Живые подсказки из своего словаря: совпадение по префиксу, без сети
  const suggestions = useMemo(() => {
    const query = englishWord.trim().toLowerCase();
    if (!query) return [];

    return cards
      .filter((card) => {
        const word = String(card.englishWord ?? '').trim().toLowerCase();
        return word.startsWith(query) && word !== query;
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [cards, englishWord]);

  const handleEnglishChange = (value) => {
    setEnglishWord(value);
    if (englishError) setEnglishError('');
  };

  const handleRussianChange = (value) => {
    setRussianWord(value);
    if (russianError) setRussianError('');
  };

  const handleSuggestion = (card) => {
    setEnglishWord(card.englishWord);
    setEnglishError('');
    englishRef.current?.focus();
  };

  // Поиск перевода, транскрипции и картинки в открытом словаре
  const handleLookup = () => {
    const word = englishWord.trim();
    if (!word) {
      setEnglishError('Введите английское слово');
      englishRef.current?.focus();
      return;
    }

    dispatch(lookupWord(word))
      .unwrap()
      .then((result) => {
        if (!result) return;
        setRussianWord((prev) => (prev.trim() ? prev : result.russianWord ?? ''));
        setPhonetic(result.phonetic ?? '');
        setDefinition(result.definition ?? '');
        setExample(result.example ?? '');
        setLinkImg((prev) => (prev.trim() ? prev : result.imageUrl ?? ''));
        setImageSource(result.imageSource ?? '');
      })
      .catch((error) => {
        dispatch(
          toastShown({
            message: String(error?.message ?? error),
            type: 'error',
          })
        );
      });
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      dispatch(toastShown({ message: 'Это не изображение', type: 'error' }));
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      dispatch(toastShown({ message: 'Файл больше 2 МБ', type: 'error' }));
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const resetForm = () => {
    setEnglishWord('');
    setRussianWord('');
    setLinkImg('');
    setPhonetic('');
    setDefinition('');
    setExample('');
    setImageSource('');
    setFile(null);
    setPreviewUrl('');
    setEnglishError('');
    setRussianError('');
    setListId('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    const english = englishWord.trim();
    const russian = russianWord.trim();

    const nextEnglishError = english ? '' : 'Введите английское слово';
    const nextRussianError = russian ? '' : 'Введите перевод';
    setEnglishError(nextEnglishError);
    setRussianError(nextRussianError);

    if (nextEnglishError) {
      englishRef.current?.focus();
      return;
    }
    if (nextRussianError) {
      russianRef.current?.focus();
      return;
    }

    // Выбранный файл кладём в карточку как data-URL
    let image = linkImg.trim();
    if (file) {
      try {
        image = await fileToBase64(file);
      } catch {
        image = linkImg.trim();
      }
    }

    // Слово уже есть — не добавляем второй раз
    const exists = cards.some(
      (card) =>
        String(card.englishWord ?? '').trim().toLowerCase() === english.toLowerCase()
    );
    if (exists) {
      dispatch(
        toastShown({ message: 'Слово уже в словаре', type: 'info' })
      );
      return;
    }

    dispatch(
      cardAdded({
        id: createId(),
        englishWord: english,
        russianWord: russian,
        linkImg: image,
        count: 0,
        phonetic,
        definition,
        example,
        imageSource,
      })
    );
    dispatch(wordAdded({ englishWord: english, russianWord: russian }));

    // Кладём слово в выбранный свой набор
    if (listId) {
      dispatch(
        wordsAddedToList({
          listId,
          words: [
            {
              englishWord: english,
              russianWord: russian,
              phonetic,
              definition,
              linkImg: image,
            },
          ],
        })
      );
    }

    dispatch(toastShown({ message: 'Слово добавлено', type: 'success' }));

    resetForm();
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <Card as="section" padding="lg" className={styles.formCard}>
          <header className={styles.headings}>
            <h1 className={styles.title}>Добавить слово</h1>
            <p className={styles.subtitle}>
              Слово попадёт в словарь и в тренажёр
            </p>
          </header>

          <div className={styles.form}>
            <div className={styles.lookupRow}>
              <div className={styles.inputRow}>
                <Input
                  label="Английское слово"
                  value={englishWord}
                  onChange={handleEnglishChange}
                  placeholder="Например: fantastic"
                  error={englishError}
                  inputRef={englishRef}
                  required
                  autoComplete="off"
                />
                {englishVoice.supported ? (
                  <IconButton
                    icon={
                      <Icon
                        name={englishVoice.listening ? 'mic-off' : 'mic'}
                        size={20}
                      />
                    }
                    label={
                      englishVoice.listening
                        ? 'Остановить запись'
                        : 'Продиктовать слово'
                    }
                    variant={englishVoice.listening ? 'danger' : 'accent'}
                    onClick={englishVoice.toggle}
                    className={styles.voiceButton}
                  />
                ) : null}
              </div>
              <Button
                variant="secondary"
                onClick={handleLookup}
                loading={lookupStatus === 'loading'}
                disabled={!englishWord.trim()}
                icon={<Icon name="search" size={20} />}
                className={styles.lookupButton}
              >
                Найти в словаре
              </Button>
            </div>

            {suggestions.length > 0 ? (
              <ul className={styles.suggestions} aria-label="Подсказки из словаря">
                {suggestions.map((card) => (
                  <li key={card.id}>
                    <button
                      type="button"
                      className={styles.suggestion}
                      onClick={() => handleSuggestion(card)}
                    >
                      <Icon name="search" size={16} />
                      <span className={styles.suggestionEn}>
                        {card.englishWord}
                      </span>
                      <span className={styles.suggestionRu}>
                        {card.russianWord}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className={styles.inputRow}>
              <Input
                label="Перевод"
                value={russianWord}
                onChange={handleRussianChange}
                placeholder="Например: фантастический"
                error={russianError}
                inputRef={russianRef}
                required
                autoComplete="off"
              />
              {russianVoice.supported ? (
                <IconButton
                  icon={
                    <Icon name={russianVoice.listening ? 'mic-off' : 'mic'} size={20} />
                  }
                  label={
                    russianVoice.listening
                      ? 'Остановить запись'
                      : 'Продиктовать перевод'
                  }
                  variant={russianVoice.listening ? 'danger' : 'accent'}
                  onClick={russianVoice.toggle}
                  className={styles.voiceButton}
                />
              ) : null}
            </div>

            <div className={styles.setBlock}>
              <span className={styles.setLabel}>Добавить в набор</span>
              <div className={styles.setChips} role="group" aria-label="Набор для слова">
                {lists.map((list) => (
                  <Chip
                    key={list.id}
                    label={`${list.name} (${list.words.length})`}
                    active={listId === list.id}
                    onClick={() =>
                      setListId(listId === list.id ? '' : list.id)
                    }
                  />
                ))}
                <Chip
                  label="+ Создать набор"
                  onClick={() => setIsCreatingSet(true)}
                />
              </div>
              <p className={styles.setHint}>
                {lists.length === 0
                  ? 'Слово попадёт в словарь. Набор можно создать здесь же'
                  : 'Слово попадёт в выбранный набор и в словарь'}
              </p>
            </div>

            <div className={styles.imageBlock}>
              <Input
                label="Ссылка на картинку"
                value={linkImg}
                onChange={setLinkImg}
                placeholder="https://... или загрузите файл"
                autoComplete="off"
              />

              <div className={styles.imageRow}>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Icon name="upload" size={20} />}
                >
                  Выбрать файл
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="visually-hidden"
                  onChange={handleFileChange}
                />
              </div>

              {previewUrl ? (
                <div className={styles.previewBox}>
                  <img
                    className={styles.previewImage}
                    src={previewUrl}
                    alt="Предпросмотр выбранного файла"
                  />
                </div>
              ) : null}

              {imageSource ? (
                <p className={styles.imageSource}>Источник картинки: {imageSource}</p>
              ) : null}
            </div>

            <div className={styles.actions}>
              <Button
                variant="primary"
                onClick={handleSubmit}
                icon={<Icon name="plus" size={20} />}
              >
                Добавить карточку
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                Очистить
              </Button>
            </div>
          </div>
        </Card>

        <aside className={styles.preview} aria-label="Предпросмотр карточки">
          <h2 className={styles.previewTitle}>Предпросмотр</h2>
          <WordCard
            variant="preview"
            status="new"
            card={{
              englishWord: englishWord.trim() || 'sunflower',
              russianWord: russianWord.trim() || 'подсолнух',
              linkImg: previewUrl || linkImg.trim(),
              phonetic,
              definition,
              imageSource,
            }}
          />
        </aside>
      </div>

      <SetCreateModal
        open={isCreatingSet}
        onClose={() => setIsCreatingSet(false)}
        onCreated={(set) => setListId(set.id)}
      />
    </div>
  );
}

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
