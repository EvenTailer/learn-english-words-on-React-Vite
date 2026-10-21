import { useNavigate } from 'react-router-dom';
import Button from '../../shared/ui/Button';
import EmptyState from '../../shared/ui/EmptyState';
import Icon from '../../shared/ui/Icon';
import styles from './WordFlow.module.css';

/**
 * Поток слов — быстрый доступ к первым карточкам словаря.
 * Цвет кнопки = статус слова в прогрессе (new / learning / mastered).
 */
export default function WordFlow({ words = [] }) {
  const navigate = useNavigate();

  if (words.length === 0) {
    return (
      <EmptyState
        className={styles.empty}
        title="Словарь пуст"
        description="Добавьте слова вручную или выберите готовый набор, чтобы начать тренировку."
        icon={<Icon name="cards" size={32} />}
        action={
          <div className={styles.emptyActions}>
            <Button
              variant="primary"
              icon={<Icon name="plus" size={20} />}
              onClick={() => navigate('/add')}
            >
              Добавить слово
            </Button>
            <Button
              variant="secondary"
              icon={<Icon name="layers" size={20} />}
              onClick={() => navigate('/wordlists')}
            >
              Выбрать набор
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <ul className={styles.list}>
      {words.map((word) => {
        const status = word.status ?? 'new';
        return (
          <li key={word.id} className={styles.cell}>
            <button
              type="button"
              className={`${styles.word} ${styles[status] ?? styles.new}`}
              onClick={() => navigate('/learn')}
            >
              <span className={styles.wordText}>{word.englishWord}</span>
              <span className={styles.dot} aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
