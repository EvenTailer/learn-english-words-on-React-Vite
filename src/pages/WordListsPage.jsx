import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { wordsAdded } from '../features/progress/progressSlice';
import { toastShown } from '../features/ui/toastSlice';
import { loadWordLists } from '../features/wordlists/wordlistsSlice';
import { WORD_SETS } from '../features/wordlists/sets';
import { selectCards } from '../features/words/selectors';
import { cardsImported } from '../features/words/wordsSlice';
import { createId } from '../shared/lib/id';
import { words } from '../shared/lib/plural';
import { learnPlanSet } from '../features/learn/learnSlice';
import Button from '../shared/ui/Button';
import Card from '../shared/ui/Card';
import Chip from '../shared/ui/Chip';
import Icon from '../shared/ui/Icon';
import Skeleton from '../shared/ui/Skeleton';
import MyLists from '../widgets/MyLists/MyLists';
import SetCreateModal from '../widgets/SetCreateModal/SetCreateModal';
import WordListCard from '../widgets/WordListCard/WordListCard';
import styles from './WordListsPage.module.css';

const SKELETON_COUNT = 4;

const TABS = [
  { value: 'sets', label: 'Готовые наборы' },
  { value: 'lists', label: 'Мои наборы' },
];

export default function WordListsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const status = useAppSelector((state) => state.wordlists.status);
  const data = useAppSelector((state) => state.wordlists.data);
  const cards = useAppSelector(selectCards);

  const [tab, setTab] = useState('sets');
  const [isCreatingSet, setIsCreatingSet] = useState(false);

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
      // картинка и короткое описание посчитаны при сборке набора
      linkImg: word.img ?? '',
      definition: word.desc ?? '',
      count: 0,
      level: word.level ?? '',
      sets: [set.key],
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
          <h1 className={styles.title}>Наборы слов</h1>
          <p className={styles.subtitle}>
            Готовые подборки и ваши собственные наборы
          </p>
          <p className={styles.total}>
            В словаре сейчас: {cards.length} {words(cards.length)}
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Icon name="plus" size={20} />}
          onClick={() => setIsCreatingSet(true)}
        >
          Создать набор
        </Button>
      </header>

      <div className={styles.tabs} role="group" aria-label="Раздел наборов">
        {TABS.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            active={tab === item.value}
            onClick={() => setTab(item.value)}
          />
        ))}
      </div>

      <p className={styles.tabsHint}>
        {tab === 'lists'
          ? 'Мои наборы — ваши темы. Слова живут в наборе, пока вы их не добавите в словарь.'
          : 'Готовые наборы — подборки слов. Кнопка копирует их в словарь, и они становятся доступны для тренировки.'}
      </p>

      {tab === 'lists' ? (
        <MyLists
          onCreate={() => setIsCreatingSet(true)}
          onLearn={(list) => {
            dispatch(learnPlanSet({ source: 'list', listId: list.id }));
            navigate('/learn');
          }}
        />
      ) : (
        <>
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
              {WORD_SETS.map((set) => {
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
        </>
      )}

      <SetCreateModal
        open={isCreatingSet}
        onClose={() => setIsCreatingSet(false)}
        onCreated={() => setTab('lists')}
      />
    </div>
  );
}
