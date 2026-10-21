import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../app/store/hooks';
import { cardAdded } from '../features/words/wordsSlice';
import { toastShown } from '../features/learn/learnSlice';
import { createId } from '../shared/lib/id';
import styles from './AddPage.module.css';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export default function AddPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [englishWord, setEnglishWord] = useState('');
  const [russianWord, setRussianWord] = useState('');
  const [linkImg, setLinkImg] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAddCard = async () => {
    const en = englishWord.trim();
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
      })
    );

    setEnglishWord('');
    setRussianWord('');
    setLinkImg('');
    setPreviewUrl('');
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
            <label className={styles.inputLabel}>🇬🇧 Английское слово</label>
            <input
              type="text"
              className={styles.inputField}
              placeholder="например: fantastic"
              value={englishWord}
              onChange={(e) => setEnglishWord(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>🇷🇺 Перевод</label>
            <input
              type="text"
              className={styles.inputField}
              placeholder="например: фантастический"
              value={russianWord}
              onChange={(e) => setRussianWord(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>🖼️ Ссылка на картинку</label>
            <input
              type="text"
              className={styles.inputField}
              placeholder="https://... или загрузите файл ниже"
              value={linkImg}
              onChange={(e) => setLinkImg(e.target.value)}
            />
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
