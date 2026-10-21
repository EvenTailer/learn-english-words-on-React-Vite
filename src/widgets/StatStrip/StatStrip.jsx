import { useAppSelector } from '../../app/store/hooks';
import { selectMasteredCount } from '../../features/progress/selectors';
import { selectStreak } from '../../features/stats/selectors';
import { selectCardsCount } from '../../features/words/selectors';
import Icon from '../../shared/ui/Icon';
import StatCard from '../../shared/ui/StatCard';
import styles from './StatStrip.module.css';

/**
 * Полоса ключевых метрик: изучено, всего слов, серия дней.
 * Данные берутся из стора, виджет ничего не принимает.
 */
export default function StatStrip() {
  const mastered = useAppSelector(selectMasteredCount);
  const cardsCount = useAppSelector(selectCardsCount);
  const streak = useAppSelector(selectStreak);

  return (
    <div className={styles.strip}>
      <StatCard
        className={styles.item}
        tone="success"
        icon={<Icon name="trophy" size={20} />}
        value={mastered}
        label="Изучено"
      />
      <StatCard
        className={styles.item}
        icon={<Icon name="cards" size={20} />}
        value={cardsCount}
        label="Всего слов"
      />
      <StatCard
        className={styles.item}
        tone="warning"
        icon={<Icon name="flame" size={20} />}
        value={streak?.current ?? 0}
        label="Серия"
        hint="дней подряд"
      />
    </div>
  );
}
