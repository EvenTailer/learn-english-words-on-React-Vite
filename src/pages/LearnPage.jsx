import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { selectCards, selectCurrentCard } from '../features/words/selectors';
import { answerChanged } from '../features/learn/learnSlice';
import { checkAnswer, startLearn } from '../features/learn/learnThunks';
import styles from './LearnPage.module.css';

export default function LearnPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cards = useAppSelector(selectCards);
  const currentCard = useAppSelector(selectCurrentCard);
  const mode = useAppSelector((state) => state.learn.mode);
  const answer = useAppSelector((state) => state.learn.answer);
  const finished = useAppSelector((state) => state.learn.finished);
  const inputRef = useRef(null);

  useEffect(() => {
    dispatch(startLearn());
  }, [dispatch]);

  useEffect(() => {
    if (finished) navigate('/', { replace: true });
  }, [finished, navigate]);

  useEffect(() => {
    if (currentCard) inputRef.current?.focus();
  }, [currentCard]);

  if (cards.length === 0) {
    return (
      <div className={styles.learnScreen}>
        <div className={styles.learnCard}>
          <p>Словарь пуст. Добавьте слова.</p>
          <button
            className={styles.learnCheckBtn}
            onClick={() => navigate('/add')}
          >
            Добавить слова
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  const showEnglish = mode === 'eng';
  const question = showEnglish
    ? currentCard.englishWord
    : currentCard.russianWord;

  return (
    <div className={styles.learnScreen}>
      <div className={styles.learnCard}>
        <button className={styles.learnBackBtn} onClick={() => navigate('/')}>
          ← На главную
        </button>

        <div className={styles.learnContent}>
          <div className={styles.learnImageWrapper}>
            {currentCard.linkImg ? (
              <img
                src={currentCard.linkImg}
                alt={currentCard.englishWord}
                className={styles.learnImage}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className={styles.learnImagePlaceholder}>
                <span>🖼️</span>
                <p>Нет изображения</p>
              </div>
            )}
          </div>

          <div className={styles.learnQuestion}>
            <span className={styles.learnBadge}>
              {showEnglish ? '🇬🇧 ENGLISH' : '🇷🇺 RUSSIAN'}
            </span>
            <h2 className={styles.learnWord}>{question}</h2>
          </div>

          <div className={styles.learnInputArea}>
            <input
              ref={inputRef}
              type="text"
              className={styles.learnInput}
              placeholder="Введите перевод..."
              value={answer}
              onChange={(e) => dispatch(answerChanged(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && dispatch(checkAnswer())}
              autoComplete="off"
            />
            <button
              className={styles.learnCheckBtn}
              onClick={() => dispatch(checkAnswer())}
            >
              ✅ Проверить
            </button>
          </div>

          <div className={styles.learnHint}>
            <span>💡 Нажми Enter или кнопку «Проверить»</span>
          </div>
        </div>
      </div>
    </div>
  );
}
