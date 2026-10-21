import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { selectCards } from '../features/words/selectors';
import { answerChanged } from '../features/learn/learnSlice';
import {
  checkAnswer,
  revealAnswer,
  skipCard,
  startLearn,
} from '../features/learn/learnThunks';
import {
  selectCurrentCard,
  selectIsRevealed,
  selectLearnMode,
} from '../features/learn/selectors';
import { speak } from '../shared/lib/speech';
import styles from './LearnPage.module.css';

export default function LearnPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cards = useAppSelector(selectCards);
  const currentCard = useAppSelector(selectCurrentCard);
  const mode = useAppSelector(selectLearnMode);
  const answer = useAppSelector((state) => state.learn.answer);
  const revealed = useAppSelector(selectIsRevealed);
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

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

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
  const correctAnswer = showEnglish
    ? currentCard.russianWord
    : currentCard.englishWord;

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
                alt="Иллюстрация"
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
            <div className={styles.learnWordMeta}>
              {currentCard.phonetic && (
                <span className={styles.learnPhonetic}>{currentCard.phonetic}</span>
              )}
              <button
                className="speak-btn"
                title="Произнести"
                onClick={() => speak(currentCard.englishWord)}
              >
                🔊
              </button>
            </div>
            {revealed && (
              <p className={styles.learnReveal}>
                Правильный ответ: <strong>{correctAnswer}</strong>
              </p>
            )}
          </div>

          <div className={styles.learnInputArea}>
            <label className={styles.visuallyHidden} htmlFor="learn-answer">
              Ваш ответ
            </label>
            <input
              id="learn-answer"
              ref={inputRef}
              type="text"
              className={styles.learnInput}
              placeholder="Введите перевод..."
              value={answer}
              onChange={(e) => dispatch(answerChanged(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && dispatch(checkAnswer())}
              autoComplete="off"
              disabled={revealed}
            />
            {revealed ? (
              <button
                className={styles.learnCheckBtn}
                onClick={() => dispatch(skipCard())}
              >
                Дальше →
              </button>
            ) : (
              <button
                className={styles.learnCheckBtn}
                onClick={() => dispatch(checkAnswer())}
              >
                ✅ Проверить
              </button>
            )}
          </div>

          <div className={styles.learnActions}>
            <button
              className={styles.learnSecondaryBtn}
              onClick={() => dispatch(revealAnswer())}
              disabled={revealed}
            >
              💡 Показать ответ
            </button>
            <button
              className={styles.learnSecondaryBtn}
              onClick={() => dispatch(skipCard())}
            >
              ⏭ Пропустить
            </button>
          </div>

          <div className={styles.learnHint}>
            <span>💡 Нажми Enter или кнопку «Проверить», Esc — выход</span>
          </div>
        </div>
      </div>
    </div>
  );
}
