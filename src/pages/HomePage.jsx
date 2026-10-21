import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../app/store/hooks';
import { selectCardsCount } from '../features/words/selectors';
import styles from './HomePage.module.css';

export default function HomePage() {
  const navigate = useNavigate();
  const count = useAppSelector(selectCardsCount);

  return (
    <div className={styles.startScreen}>
      <div className={styles.startCard}>
        <h1 className={styles.startTitle}>📖 Learn English Words</h1>
        <p className={styles.startSubtitle}>
          Интерактивный тренажёр английской лексики
        </p>
        <p className={styles.startSubtitle}>
          В словаре: <strong>{count}</strong>{' '}
          {count === 1 ? 'слово' : count < 5 ? 'слова' : 'слов'}
        </p>

        <div className={styles.startButtons}>
          <button
            className={`${styles.startBtn} ${styles.learn}`}
            onClick={() => navigate('/learn')}
          >
            🧠 Учить слова
          </button>
          <button
            className={`${styles.startBtn} ${styles.add}`}
            onClick={() => navigate('/add')}
          >
            ➕ Добавить слова
          </button>
          <button
            className={`${styles.startBtn} ${styles.storage}`}
            onClick={() => navigate('/storage')}
          >
            📚 Хранилище
          </button>
        </div>
      </div>
    </div>
  );
}
