import Button from '../../shared/ui/Button';
import Card from '../../shared/ui/Card';
import Icon from '../../shared/ui/Icon';
import StatCard from '../../shared/ui/StatCard';
import styles from './SessionSummary.module.css';

/**
 * Итоги учебной сессии: счётчики и действия.
 */
export default function SessionSummary({ session, onRestart, onHome, onChangePlan }) {
  const stats = session ?? {};
  const answered = stats.answered ?? 0;
  const total = stats.total ?? 0;
  const wrongWords = stats.wrongWords ?? [];
  const skippedWords = stats.skippedWords ?? [];

  return (
    <Card variant="elevated" padding="lg" className={styles.summary}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Icon name="sparkles" size={24} />
        </span>
        <h2 className={styles.title}>Сессия завершена</h2>
        <p className={styles.subtitle}>
          Отвечено {answered} из {total}
        </p>
      </div>

      <div className={styles.stats}>
        <StatCard
          tone="success"
          icon={<Icon name="check" size={20} />}
          value={stats.correct ?? 0}
          label="Верно"
        />
        <StatCard
          tone="danger"
          icon={<Icon name="close" size={20} />}
          value={stats.wrong ?? 0}
          label="Ошибки"
        />
        <StatCard
          icon={<Icon name="skip" size={20} />}
          value={stats.skipped ?? 0}
          label="Пропущено"
        />
        <StatCard
          tone="accent"
          icon={<Icon name="trophy" size={20} />}
          value={stats.learned ?? 0}
          label="Выучено"
        />
      </div>

      {wrongWords.length > 0 ? (
        <div className={styles.mistakes}>
          <h3 className={styles.mistakesTitle}>Ошибки — повторим позже</h3>
          <ul className={styles.mistakesList}>
            {wrongWords.map((word) => (
              <li key={word.englishWord} className={styles.mistake}>
                <span className={styles.mistakeEn}>{word.englishWord}</span>
                <span className={styles.mistakeRu}>{word.russianWord}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {skippedWords.length > 0 ? (
        <div className={styles.skipped}>
          <h3 className={styles.skippedTitle}>Пропущены</h3>
          <ul className={styles.skippedList}>
            {skippedWords.map((word) => (
              <li key={word.englishWord} className={styles.skippedItem}>
                <span className={styles.skippedEn}>{word.englishWord}</span>
                <span className={styles.skippedRu}>{word.russianWord}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<Icon name="learn" size={20} />}
          onClick={onRestart}
        >
          Ещё раз
        </Button>
        {onChangePlan ? (
          <Button
            variant="secondary"
            fullWidth
            icon={<Icon name="list" size={20} />}
            onClick={onChangePlan}
          >
            Другой набор слов
          </Button>
        ) : null}
        <Button
          variant="secondary"
          fullWidth
          icon={<Icon name="home" size={20} />}
          onClick={onHome}
        >
          На главную
        </Button>
      </div>
    </Card>
  );
}
