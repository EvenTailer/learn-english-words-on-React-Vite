import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { wordsAdded } from '../features/progress/progressSlice';
import { toastShown } from '../features/ui/toastSlice';
import { loadWordLists } from '../features/wordlists/wordlistsSlice';
import { selectCards } from '../features/words/selectors';
import { cardsImported } from '../features/words/wordsSlice';
import { createId } from '../shared/lib/id';
import Card from '../shared/ui/Card';
import Icon from '../shared/ui/Icon';
import Skeleton from '../shared/ui/Skeleton';
import WordListCard from '../widgets/WordListCard/WordListCard';
import styles from './WordListsPage.module.css';

// Список наборов: ключ в wordlists.json + подпись для карточки
const SETS = [
  { key: 'top250', title: 'Топ 250', hint: 'Самые частотные слова' },
  { key: 'top500', title: 'Топ 500', hint: 'Частотные слова' },
  { key: 'top1000', title: 'Топ 1000', hint: 'Расширенный набор' },
  { key: 'top2000', title: 'Топ 2000', hint: 'Большой набор' },
  { key: 'cefrA1', title: 'Уровень A1', hint: 'Beginner · Oxford 3000' },
  { key: 'cefrA2', title: 'Уровень A2', hint: 'Elementary · Oxford 3000' },
  { key: 'cefrB1', title: 'Уровень B1', hint: 'Intermediate · Oxford 3000' },
  { key: 'cefrB2', title: 'Уровень B2', hint: 'Upper-Intermediate · Oxford 3000' },
];

const SKELETON_COUNT = 4;

export default function WordListsPage() {
  const dispatch = useAppDispatch();

  const status = useAppSelector((state) => state.wordlists.status);
  const data = useAppSelector((state) => state.wordlists.data);
  const cards = useAppSelector(selectCards);

  useEffect(() => {
    if (status === 'idle') dispatch(loadWordLists());
  }, [dispatch, status]);

  // Ключи слов, которые уже есть в словаре — по ним считаем «Импортировано»
  const existing = useMemo(
    () =>
      new Set(
        cards.map((card) => String(card.englishWord ?? '').trim().toLowerCase())
      ),
    [cards]
  );

  const handleImport = (set) => {
    const words = data?.sets?.[set.key] ?? [];
    if (words.length === 0) return;

    const newCards = words.map((word) => ({
      id: createId(),
      englishWord: word.en,
      russianWord: word.ru,
      linkImg: '',
      count: 0,
      level: word.level ?? '',
    }));

    dispatch(cardsImported(newCards));
    dispatch(
      wordsAdded(
        newCards.map((card) => ({
          englishWord: card.englishWord,
          russianWord: card.russianWord,
        }))
      )
    );
    dispatch(
      toastShown({
        message: `Набор «${set.title}» добавлен`,
        type: 'success',
      })
    );
  };

  const isImported = (words) =>
    words.length > 0 &&
    words.every((word) =>
      existing.has(String(word?.en ?? '').trim().toLowerCase())
    );

  const isLoading = status === 'idle' || status === 'loading';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headings}>
          <h1 className={styles.title}>Готовые наборы слов</h1>
          <p className={styles.subtitle}>
            Слова с переводами и уровнем сложности
          </p>
          <p className={styles.total}>В словаре сейчас: {cards.length} слов</p>
        </div>
      </header>

      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <Card key={index} padding="md" className={styles.skeletonCard}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rect" height={72} />
              <Skeleton variant="rect" height={48} />
            </Card>
          ))}
        </div>
      ) : null}

      {status === 'error' ? (
        <div className={styles.error}>
          <Icon name="close" size={20} />
          <span>Не удалось загрузить наборы слов</span>
        </div>
      ) : null}

      {!isLoading && status !== 'error' ? (
        <div className={styles.grid}>
          {SETS.map((set) => {
            const words = data?.sets?.[set.key] ?? [];

            return (
              <WordListCard
                key={set.key}
                title={set.title}
                hint={set.hint}
                words={words}
                count={words.length}
                imported={isImported(words)}
                onImport={() => handleImport(set)}
              />
            );
          })}
        </div>
      ) : null}

      <p className={styles.license}>
        Oxford 3000 (public domain) · CEFR-J Vocabulary Profile (Tono
        Laboratory, TUFS) · FrequencyWords (MIT) · переводы Google Translate
      </p>
    </div>
  );
}
