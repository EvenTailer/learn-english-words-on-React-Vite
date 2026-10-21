import { useNavigate } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.notFoundScreen}>
      <div className={styles.notFoundCard}>
        <h1 className={styles.code}>404</h1>
        <p className={styles.text}>Такой страницы нет</p>
        <button className={styles.homeBtn} onClick={() => navigate('/')}>
          ← На главную
        </button>
      </div>
    </div>
  );
}
