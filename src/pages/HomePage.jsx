import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { selectProgressMap } from '../features/progress/selectors';
import { selectStreak, selectTodayStats } from '../features/stats/selectors';
import { directionSet } from '../features/settings/settingsSlice';
import { selectCards, selectCardsCount } from '../features/words/selectors';
import Button from '../shared/ui/Button';
import Card from '../shared/ui/Card';
import Icon from '../shared/ui/Icon';
import ProgressRing from '../shared/ui/ProgressRing';
import Select from '../shared/ui/Select';
import StatStrip from '../widgets/StatStrip/StatStrip';
import WordFlow from '../widgets/WordFlow/WordFlow';
import styles from './HomePage.module.css';

// Русские склонения: 1 слово / 2-4 слова / 5+ слов
const pluralWords = (count) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'слово';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'слова';
  return 'слов';
};

const DIRECTION_OPTIONS = [
  { value: 'mixed', label: 'Смешанное' },
  { value: 'en-ru', label: 'Английский → Русский' },
  { value: 'ru-en', label: 'Русский → Английский' },
];

// Сколько слов показываем в потоке
const FLOW_LIMIT = 12;

export default function HomePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const cards = useAppSelector(selectCards);
  const cardsCount = useAppSelector(selectCardsCount);
  const streak = useAppSelector(selectStreak);
  const today = useAppSelector(selectTodayStats);
  const progress = useAppSelector(selectProgressMap);
  const direction = useAppSelector((state) => state.settings.direction);
  const dailyGoal = useAppSelector((state) => state.settings.dailyGoal);

  // Поток слов: первые 12 карточек со статусом из прогресса
  const flowWords = useMemo(
    () =>
      cards.slice(0, FLOW_LIMIT).map((card) => ({
        id: card.id,
        englishWord: card.englishWord,
        status:
          progress[String(card.englishWord ?? '').trim().toLowerCase()]?.status ??
          'new',
      })),
    [cards, progress]
  );

  const todayCorrect = today?.correct ?? 0;
  const goalPercent = Math.min(
    100,
    Math.round((todayCorrect / Math.max(dailyGoal, 1)) * 100)
  );

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Learn English Words</h1>
        <p className={styles.subtitle}>
          В словаре {cardsCount} {pluralWords(cardsCount)}
        </p>
      </header>

      <StatStrip />

      <div className={styles.cta}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<Icon name="learn" size={20} />}
          onClick={() => navigate('/learn')}
        >
          Учить слова
        </Button>
        <p className={styles.ctaHint}>
          Выберете набор, формат ответа и размер — и начнём
        </p>

        <div className={styles.ctaSecondary}>
          <Button
            variant="secondary"
            icon={<Icon name="cards" size={20} />}
            onClick={() => navigate('/storage')}
          >
            Хранилище
          </Button>
          <Button
            variant="secondary"
            icon={<Icon name="layers" size={20} />}
            onClick={() => navigate('/wordlists')}
          >
            Наборы
          </Button>
        </div>
      </div>

      <div className={styles.columns}>
        <Card padding="md" className={styles.goalCard}>
          <h2 className={styles.sectionTitle}>Цель на сегодня</h2>
          <ProgressRing
            value={goalPercent}
            tone="accent"
            size={120}
            label={`${goalPercent}%`}
            caption={`${todayCorrect} из ${dailyGoal} слов сегодня`}
          />
          <Button
            variant="secondary"
            fullWidth
            icon={<Icon name="arrow-right" size={20} />}
            iconPosition="end"
            onClick={() => navigate('/learn')}
          >
            Начать занятие
          </Button>
        </Card>

        <Card padding="md" className={styles.flowCard}>
          <h2 className={styles.sectionTitle}>Поток слов</h2>
          <WordFlow words={flowWords} />
        </Card>
      </div>

      <Card padding="md" className={styles.settingsCard}>
        <h2 className={styles.sectionTitle}>Настройки обучения</h2>
        <Select
          label="Направление перевода"
          value={direction}
          options={DIRECTION_OPTIONS}
          onChange={(value) => dispatch(directionSet(value))}
          hint="«Смешанное» — направление вопроса выбирается случайно"
        />
        {streak?.longest ? (
          <p className={styles.record}>
            Рекорд серии: {streak.longest} {pluralWords(streak.longest)}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
