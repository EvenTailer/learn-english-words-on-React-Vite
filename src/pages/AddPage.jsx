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
import Chip from '../shared/ui/Chip';
import Icon from '../shared/ui/Icon';
import IconButton from '../shared/ui/IconButton';
import Input from '../shared/ui/Input';
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
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [imageSource, setImageSource] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [englishError, setEnglishError] = useState('');
  const [russianError, setRussianError] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [listId, setListId] = useState('');
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [showImageBlock, setShowImageBlock] = useState(false);
  const [justAdded, setJustAdded] = useState('');

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
    if (lookupError) setLookupError('');
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

    setLookupError('');

    dispatch(lookupWord(word))
      .unwrap()
      .then((result) => {
        if (!result) return;
        setRussianWord((prev) => (prev.trim() ? prev : result.russianWord ?? ''));
        setPhonetic(result.phonetic ?? '');
        setDefinition(result.definition ?? '');
        setExample(result.example ?? '');
        setPartOfSpeech(result.partOfSpeech ?? '');
        setLinkImg((prev) => (prev.trim() ? prev : result.imageUrl ?? ''));
        setImageSource(result.imageSource ?? '');
        if (!result.russianWord) {
          setLookupError('Слово найдено, но перевода нет — впишите его сами');
        }
      })
      .catch((error) => {
        setLookupError(
          String(error?.message ?? error) || 'Не получилось найти слово'
        );
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
    setPartOfSpeech('');
    setImageSource('');
    setFile(null);
    setPreviewUrl('');
    setEnglishError('');
    setRussianError('');
    setLookupError('');
    setListId('');
    setShowImageBlock(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
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
        String(card.englishWord ?? '').trim().toLowerCase() ===
        english.toLowerCase()
    );
    if (exists) {
      dispatch(
        toastShown({ message: 'Слово уже в словаре', type: 'info' })
      );
      setEnglishError('Это слово уже есть в словаре');
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
    setJustAdded(english);

    resetForm();
    englishRef.current?.focus();
  };

  const found = Boolean(phonetic || definition || imageSource);

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <form
          className={styles.formCard}
          onSubmit={handleSubmit}
          noValidate
          aria-label="Добавление слова"
        >
          <header className={styles.headings}>
            <h1 className={styles.title}>Добавить слово</h1>
            <p className={styles.subtitle}>
              Слово попадёт в словарь и в тренировку
            </p>
          </header>

          {justAdded ? (
            <p className={styles.added} role="status">
              <Icon name="check" size={18} />
              «{justAdded}» в словаре. Можно добавить ещё.
            </p>
          ) : null}

          {/* Шаг 1 — найти слово */}
          <Card padding="md" className={styles.step}>
            <h2 className={styles.stepTitle}>
              <span className={styles.stepNumber}>1</span>
              Найдите слово
            </h2>

            <div className={styles.inputRow}>
              <Input
                label="Английское слово"
                value={englishWord}
                onChange={handleEnglishChange}
                placeholder="Например: fantastic"
                error={englishError}
                inputRef={englishRef}
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

            <Button
              variant="primary"
              type="button"
              fullWidth
              onClick={handleLookup}
              loading={lookupStatus === 'loading'}
              disabled={!englishWord.trim()}
              icon={<Icon name="search" size={20} />}
            >
              Найти в словаре
            </Button>

            {lookupError ? (
              <p className={styles.lookupError} role="status">
                {lookupError}
              </p>
            ) : null}

            {/* Что нашлось — сразу видно, что словарь дал */}
            {found ? (
              <div className={styles.found}>
                {linkImg ? (
                  <img
                    className={styles.foundImage}
                    src={linkImg}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
                <div className={styles.foundBody}>
                  <p className={styles.foundMeta}>
                    {[phonetic, partOfSpeech].filter(Boolean).join(' · ')}
                  </p>
                  {definition ? (
                    <p className={styles.foundDefinition}>{definition}</p>
                  ) : null}
                  {imageSource ? (
                    <p className={styles.foundSource}>Источник: {imageSource}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <p className={styles.stepHint}>
              Или впишите перевод вручную — следующий шаг
            </p>
          </Card>

          {/* Шаг 2 — перевод */}
          <Card padding="md" className={styles.step}>
            <h2 className={styles.stepTitle}>
              <span className={styles.stepNumber}>2</span>
              Перевод
            </h2>

            <div className={styles.inputRow}>
              <Input
                label="Перевод"
                value={russianWord}
                onChange={handleRussianChange}
                placeholder="Например: фантастический"
                error={russianError}
                inputRef={russianRef}
                autoComplete="off"
              />
              {russianVoice.supported ? (
                <IconButton
                  icon={
                    <Icon
                      name={russianVoice.listening ? 'mic-off' : 'mic'}
                      size={20}
                    />
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

            {russianWord && !russianError ? (
              <p className={styles.stepHint}>
                {found ? 'Подставлено из словаря — можно изменить' : 'Проверьте перевод'}
              </p>
            ) : null}
          </Card>

          {/* Шаг 3 — набор */}
          <Card padding="md" className={styles.step}>
            <h2 className={styles.stepTitle}>
              <span className={styles.stepNumber}>3</span>
              Набор
              <span className={styles.stepOptional}>необязательно</span>
            </h2>

            <div className={styles.setChips} role="group" aria-label="Набор для слова">
              {lists.map((list) => (
                <Chip
                  key={list.id}
                  label={`${list.name} (${list.words.length})`}
                  active={listId === list.id}
                  onClick={() => setListId(listId === list.id ? '' : list.id)}
                />
              ))}
              <Chip
                label="+ Создать набор"
                onClick={() => setIsCreatingSet(true)}
              />
            </div>

            <p className={styles.stepHint}>
              {lists.length === 0
                ? 'Слово попадёт только в словарь. Набор можно создать здесь же'
                : listId
                  ? 'Слово попадёт в этот набор и в словарь'
                  : 'Слово попадёт только в словарь'}
            </p>
          </Card>

          {/* Картинка — второстепенное, по умолчанию свёрнуто */}
          <div className={styles.imageBlock}>
            <button
              type="button"
              className={styles.imageToggle}
              onClick={() => setShowImageBlock((prev) => !prev)}
              aria-expanded={showImageBlock}
            >
              <Icon
                name={showImageBlock ? 'chevron-down' : 'plus'}
                size={18}
              />
              Своя картинка
              <span className={styles.imageToggleHint}>необязательно</span>
            </button>

            {showImageBlock ? (
              <div className={styles.imageFields}>
                <Input
                  label="Ссылка на картинку"
                  value={linkImg}
                  onChange={setLinkImg}
                  placeholder="https://..."
                  autoComplete="off"
                />
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
                {previewUrl ? (
                  <img
                    className={styles.previewImage}
                    src={previewUrl}
                    alt="Предпросмотр выбранного файла"
                  />
                ) : null}
                {imageSource ? (
                  <p className={styles.stepHint}>
                    Сейчас в карточке картинка из: {imageSource}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={styles.actions}>
            <Button
              variant="primary"
              type="submit"
              size="lg"
              fullWidth
              icon={<Icon name="plus" size={20} />}
            >
              Добавить в словарь
            </Button>
            <Button variant="ghost" type="button" onClick={resetForm}>
              Очистить
            </Button>
          </div>
        </form>

        <aside className={styles.preview} aria-label="Предпросмотр">
          <h2 className={styles.previewTitle}>Так это будет выглядеть</h2>
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
