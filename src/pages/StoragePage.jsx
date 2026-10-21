import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { selectProgressMap } from '../features/progress/selectors';
import { wordRemoved } from '../features/progress/progressSlice';
import { toastShown } from '../features/ui/toastSlice';
import { filterCards, sortCards } from '../features/words/filtering';
import { selectCards } from '../features/words/selectors';
import { cardDeleted } from '../features/words/wordsSlice';
import { speak } from '../shared/lib/speech';
import { words } from '../shared/lib/plural';
import Button from '../shared/ui/Button';
import Chip from '../shared/ui/Chip';
import ConfirmDialog from '../shared/ui/ConfirmDialog';
import EmptyState from '../shared/ui/EmptyState';
import Icon from '../shared/ui/Icon';
import SearchField from '../shared/ui/SearchField';
import Select from '../shared/ui/Select';
import AddToListModal from '../widgets/AddToList/AddToListModal';
import SetCreateModal from '../widgets/SetCreateModal/SetCreateModal';
import WordCard from '../widgets/WordCard/WordCard';
import styles from './StoragePage.module.css';

// Сколько карточек показываем за раз — словарь бывает на 2000+ слов
const PAGE_SIZE = 60;

const SORT_OPTIONS = [
  { value: 'az-en', label: 'По алфавиту (EN)' },
  { value: 'az-ru', label: 'По алфавиту (RU)' },
  { value: 'progress', label: 'По прогрессу' },
  { value: 'new', label: 'Сначала новые' },
];

const FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'learning', label: 'В процессе' },
  { value: 'mastered', label: 'Изученные' },
  { value: 'new', label: 'Новые' },
];

export default function StoragePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const cards = useAppSelector(selectCards);
  const progressMap = useAppSelector(selectProgressMap);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('az-en');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [listTargetId, setListTargetId] = useState(null);
  const [isCreatingSet, setIsCreatingSet] = useState(false);

  const filtered = useMemo(
    () => filterCards(cards, { query, status, progressMap }),
    [cards, query, status, progressMap]
  );

  const sorted = useMemo(
    () => sortCards(filtered, sortBy, progressMap),
    [filtered, sortBy, progressMap]
  );

  const visible = useMemo(
    () => sorted.slice(0, visibleCount),
    [sorted, visibleCount]
  );

  const pendingCard = useMemo(
    () => cards.find((card) => card.id === pendingDeleteId) ?? null,
    [cards, pendingDeleteId]
  );

  const listTargetCard = useMemo(
    () => cards.find((card) => card.id === listTargetId) ?? null,
    [cards, listTargetId]
  );

  // Любое изменение выборки возвращает пагинацию на первую страницу
  const handleQueryChange = (value) => {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleResetFilters = () => {
    setQuery('');
    setStatus('all');
    setSortBy('az-en');
    setVisibleCount(PAGE_SIZE);
  };

  const handleConfirmDelete = () => {
    if (!pendingCard) return;

    dispatch(cardDeleted(pendingCard.id));
    dispatch(
      wordRemoved({
        key: String(pendingCard.englishWord ?? '').trim().toLowerCase(),
      })
    );
    dispatch(toastShown({ message: 'Слово удалено', type: 'info' }));
    setPendingDeleteId(null);
  };

  const isEmptyDictionary = cards.length === 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headings}>
          <h1 className={styles.title}>Хранилище</h1>
          <p className={styles.counter}>
            Показано{' '}
            <span className={styles.counterValue}>{visible.length}</span> из{' '}
            {sorted.length}
          </p>
          <p className={styles.total}>
            Всего в словаре: {cards.length} {words(cards.length)}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/add')}
          icon={<Icon name="plus" size={20} />}
          className={styles.headerAction}
        >
          Добавить слово
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchRow}>
          <SearchField
            value={query}
            onChange={handleQueryChange}
            label="Поиск"
            placeholder="Поиск по английскому или русскому слову"
          />
          <Select
            label="Сортировка"
            value={sortBy}
            onChange={handleSortChange}
            options={SORT_OPTIONS}
            className={styles.sort}
          />
        </div>

        <div className={styles.chips} role="group" aria-label="Фильтр по статусу">
          {FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              label={filter.label}
              active={status === filter.value}
              onClick={() => handleStatusChange(filter.value)}
            />
          ))}
        </div>

        <p className={styles.toolbarHint}>
          Кнопка со списком на карточке добавляет слово в свой набор
        </p>
      </div>

      {isEmptyDictionary ? (
        <EmptyState
          title="Словарь пуст"
          description="Добавьте первое слово вручную или возьмите готовый набор."
          icon={<Icon name="cards" size={32} />}
          action={
            <Button
              variant="primary"
              onClick={() => navigate('/add')}
              icon={<Icon name="plus" size={20} />}
            >
              Добавить слово
            </Button>
          }
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="Ничего не найдено"
          description="Ничего не найдено. Измените запрос или сбросьте фильтры."
          icon={<Icon name="search" size={32} />}
          action={
            <Button variant="secondary" onClick={handleResetFilters}>
              Сбросить фильтры
            </Button>
          }
        />
      ) : (
        <>
          <div className={styles.grid}>
            {visible.map((card) => {
              const key = String(card.englishWord ?? '').trim().toLowerCase();
              const progress = progressMap[key];

              return (
                <WordCard
                  key={card.id}
                  card={card}
                  status={progress?.status ?? 'new'}
                  correct={progress?.correct ?? card.count ?? 0}
                  streak={progress?.streak ?? 0}
                  onSpeak={(word) => speak(word)}
                  onDelete={() => setPendingDeleteId(card.id)}
                  onAddToList={(target) => setListTargetId(target.id)}
                />
              );
            })}
          </div>

          <div className={styles.pager}>
            <p className={styles.pagerCount}>
              Показано {visible.length} из {sorted.length}
            </p>
            {visible.length < sorted.length ? (
              <Button
                variant="secondary"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                icon={<Icon name="arrow-right" size={20} />}
              >
                Показать ещё {PAGE_SIZE}
              </Button>
            ) : null}
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingCard)}
        title="Удалить слово?"
        description={`«${pendingCard?.englishWord ?? ''}» будет удалён из словаря`}
        confirmLabel="Удалить"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      <AddToListModal
        card={listTargetCard}
        open={Boolean(listTargetCard)}
        onClose={() => setListTargetId(null)}
        onCreate={() => {
          setListTargetId(null);
          setIsCreatingSet(true);
        }}
      />

      <SetCreateModal
        open={isCreatingSet}
        onClose={() => setIsCreatingSet(false)}
      />
    </div>
  );
}
