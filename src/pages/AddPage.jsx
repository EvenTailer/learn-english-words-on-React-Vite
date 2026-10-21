import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { cardAdded } from '../features/words/wordsSlice';
import { toastShown } from '../features/learn/learnSlice';
import { lookupWord } from '../features/dictionary/dictionarySlice';
import { createId } from '../shared/lib/id';
import { speak } from '../shared/lib/speech';
import styles from './AddPage.module.css';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 МБ

export default function AddPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [englishWord, setEnglishWord] = useState('');
  const [russianWord, setRussianWord] = useState('');
  const [linkImg, setLinkImg] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [definition, setDefinition] = useState('');
  const [imageSource, setImageSource] = useState('');
  const fileInputRef = useRef(null);

  const lookupStatus = useAppSelector((state) => state.dictionary.status);

  // Результат поиска подставляем в форму
  const handleLookup = async () => {
    try {
      const result = await dispatch(lookupWord(englishWord)).unwrap();
      if (!result) return;
      setRussianWord((prev) => prev || result.russianWord);
      setLinkImg((prev) => prev || result.imageUrl);
      setPhonetic(result.phonetic);
      setDefinition(result.definition);
      setImageSource(result.imageSource);
    } catch (error) {
      dispatch(
        toastShown({ message: String(error), type: 'error' })
      );
    }
  };

  // Освобождаем временный URL превью
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      dispatch(toastShown({ message: 'Это не изображение', type: 'error' }));
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      dispatch(
        toastShown({ message: 'Файл больше 2 МБ — возьмите картинку поменьше', type: 'error' })
      );
      e.target.value = '';
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAddCard = async () => {
    const en = englishWord.trim().toLowerCase();
    const ru = russianWord.trim();

    if (!en) {
      dispatch(
        toastShown({ message: 'Вы не ввели английское слово', type: 'error' })
      );
      return;
    }
    if (!ru) {
      dispatch(
        toastShown({ message: 'Вы не ввели русское слово', type: 'error' })
      );
      return;
    }

    let image = linkImg.trim();
    const file = fileInputRef.current?.files?.[0];
    if (file) image = await fileToBase64(file);

    dispatch(
      cardAdded({
        id: createId(),
        englishWord: en,
        linkImg: image,
        russianWord: ru,
        count: 0,
        phonetic,
        definition,
        imageSource,
      })
    );

    setEnglishWord('');
    setRussianWord('');
    setLinkImg('');
    setPreviewUrl('');
    setPhonetic('');
    setDefinition('');
    setImageSource('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={styles.addScreen}>
      <div className={styles.addCard}>
        <h2 className={styles.addTitle}>✨ Добавить новую карточку</h2>
        <p className={styles.addSubtitle}>
          Заполните поля ниже, чтобы пополнить словарь
        </p>

        <div className={styles.addForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="add-english">
              🇬🇧 Английское слово
            </label>
            <input
              id="add-english"
              type="text"
              className={styles.inputField}
              placeholder="например: fantastic"
              value={englishWord}
              onChange={(e) => setEnglishWord(e.target.value)}
            />
            <div className={styles.lookupRow}>
              <button
                type="button"
                className={styles.lookupBtn}
                onClick={handleLookup}
                disabled={lookupStatus === 'loading' || !englishWord.trim()}
              >
                {lookupStatus === 'loading' ? '⏳ Ищем…' : '🔍 Найти в словаре'}
              </button>
              <button
                type="button"
                className="speak-btn"
                title="Произнести"
                onClick={() => speak(englishWord.trim())}
                disabled={!englishWord.trim()}
              >
                🔊
              </button>
            </div>
            {phonetic && <p className={styles.lookupInfo}>{phonetic}</p>}
            {definition && (
              <p className={styles.lookupInfo}>
                <em>{definition}</em>
              </p>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="add-russian">
              🇷🇺 Перевод
            </label>
            <input
              id="add-russian"
              type="text"
              className={styles.inputField}
              placeholder="например: фантастический"
              value={russianWord}
              onChange={(e) => setRussianWord(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="add-image">
              🖼️ Ссылка на картинку
            </label>
            <input
              id="add-image"
              type="text"
              className={styles.inputField}
              placeholder="https://... или загрузите файл ниже"
              value={linkImg}
              onChange={(e) => setLinkImg(e.target.value)}
            />
            {imageSource && (
              <p className={styles.lookupInfo}>Источник картинки: {imageSource}</p>
            )}
          </div>

          <div className={styles.fileArea}>
            <button
              type="button"
              className={styles.fileBtn}
              onClick={() => fileInputRef.current.click()}
            >
              📁 Выбрать картинку с компьютера
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {previewUrl && (
              <div className={styles.imagePreview}>
                <img src={previewUrl} alt="preview" />
              </div>
            )}
          </div>

          <div className={styles.addActions}>
            <button className={styles.btnSubmit} onClick={handleAddCard}>
              ➕ Добавить карточку
            </button>
            <button className={styles.btnBack} onClick={() => navigate('/')}>
              ← Назад
            </button>
          </div>
        </div>
      </div>
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
