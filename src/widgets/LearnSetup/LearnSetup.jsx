import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { selectLists } from '../../features/lists/selectors';
import { startLearn } from '../../features/learn/learnThunks';
import {
  ANSWER_MODES,
  ANSWER_MODE_OPTIONS,
  DIRECTION_OPTIONS,
  LEARN_SOURCES,
  SESSION_SIZES,
  SOURCE_OPTIONS,
  selectPool,
} from '../../features/learn/plan';
import { selectProgressMap } from '../../features/progress/selectors';
import { selectCards } from '../../features/words/selectors';
import { WORD_SETS } from '../../features/wordlists/sets';
import Button from '../../shared/ui/Button';
import Card from '../../shared/ui/Card';
import Chip from '../../shared/ui/Chip';
import Icon from '../../shared/ui/Icon';
import Select from '../../shared/ui/Select';
import styles from './LearnSetup.module.css';

const SIZE_OPTIONS = [
  ...SESSION_SIZES.map((size) => ({ value: String(size), label: String(size) })),
  { value: 'all', label: 'Все' },
];

/**
 * Экран «Что учить»: источник слов, направление, формат ответа и размер.
 * Без него тренировка стартует вслепую — непонятно, откуда берутся слова.
 */
export default function LearnSetup() {
  const dispatch = useAppDispatch();

  const cards = useAppSelector(selectCards);
  const progressMap = useAppSelector(selectProgressMap);
  const lists = useAppSelector(selectLists);
  const direction = useAppSelector((state) => state.settings.direction);

  const [source, setSource] = useState(LEARN_SOURCES.ALL);
  const [setKey, setSetKey] = useState(WORD_SETS[0].key);
  const [listId, setListId] = useState('');
  const [size, setSize] = useState('20');
  const [answerMode, setAnswerMode] = useState(ANSWER_MODES.TEXT);
  const [directionChoice, setDirectionChoice] = useState(direction);

  // Наборы приезжают из persist позже — берём первый, если ещё не выбран
  const activeListId = listId || lists[0]?.id || '';

  // Наборы, слова которых уже есть в словаре
  const importedSets = useMemo(() => {
    const keys = new Set();
    for (const card of cards) {
      for (const key of card.sets ?? []) keys.add(key);
    }
    return keys;
  }, [cards]);

  const selectedList = lists.find((list) => list.id === activeListId) ?? null;

  // Сколько слов попадёт в тренировку при текущем выборе
  // Текущее время берётся внутри selectPool — компонент остаётся чистым
  const poolCount = useMemo(() => {
    const plan = {
      source,
      setKey,
      listId: activeListId,
      size: size === 'all' ? 'all' : Number(size),
      direction: directionChoice,
      answerMode,
    };
    return selectPool(cards, {
      progressMap,
      plan,
      listWords: selectedList?.words ?? [],
    }).length;
  }, [
    cards,
    progressMap,
    source,
    setKey,
    activeListId,
    size,
    directionChoice,
    answerMode,
    selectedList,
  ]);

  // Счётчики для каждого источника — видно, где есть слова, а где пусто
  const sourceCounts = useMemo(() => {
    const count = (sourceKey) =>
      selectPool(cards, {
        progressMap,
        plan: {
          source: sourceKey,
          setKey,
          listId: activeListId,
          size: 'all',
          direction: directionChoice,
          answerMode,
        },
        listWords: selectedList?.words ?? [],
      }).length;

    return {
      [LEARN_SOURCES.ALL]: count(LEARN_SOURCES.ALL),
      [LEARN_SOURCES.DUE]: count(LEARN_SOURCES.DUE),
      [LEARN_SOURCES.ERRORS]: count(LEARN_SOURCES.ERRORS),
      [LEARN_SOURCES.NEW]: count(LEARN_SOURCES.NEW),
      [LEARN_SOURCES.LIST]: count(LEARN_SOURCES.LIST),
      [LEARN_SOURCES.SET]: count(LEARN_SOURCES.SET),
    };
  }, [
    cards,
    progressMap,
    setKey,
    activeListId,
    directionChoice,
    answerMode,
    selectedList,
  ]);

  const handleStart = () => {
    dispatch(
      startLearn({
        source,
        setKey,
        listId: activeListId,
        size: size === 'all' ? 'all' : Number(size),
        direction: directionChoice,
        answerMode,
      })
    );
  };

  const listOptions = lists.map((list) => ({
    value: list.id,
    label: `${list.name} (${list.words.length})`,
  }));

  const setOptions = WORD_SETS.map((set) => ({
    value: set.key,
    label: importedSets.has(set.key) ? set.title : `${set.title} — не импортирован`,
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Что учим</h1>
        <p className={styles.subtitle}>
          Выберите источник слов и формат — начнём сразу
        </p>
      </header>

      <Card padding="md" className={styles.block}>
        <h2 className={styles.blockTitle}>Источник</h2>
        <div className={styles.chips} role="group" aria-label="Источник слов">
          {SOURCE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              count={sourceCounts[option.value]}
              active={source === option.value}
              onClick={() => setSource(option.value)}
            />
          ))}
        </div>

        {source === LEARN_SOURCES.LIST ? (
          lists.length > 0 ? (
            <Select
              label="Свой набор"
              value={activeListId}
              options={listOptions}
              onChange={setListId}
              hint="Слова из этого набора попадут в тренировку"
            />
          ) : (
            <p className={styles.hint}>
              Своих наборов пока нет. Соберите набор на странице «Наборы» или
              добавьте слова из «Хранилища».
            </p>
          )
        ) : null}

        {source === LEARN_SOURCES.SET ? (
          <Select
            label="Набор слов"
            value={setKey}
            options={setOptions}
            onChange={setSetKey}
            hint="Учим только слова этого набора"
          />
        ) : null}
      </Card>

      <Card padding="md" className={styles.block}>
        <h2 className={styles.blockTitle}>Направление</h2>
        <div className={styles.chips} role="group" aria-label="Направление перевода">
          {DIRECTION_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={directionChoice === option.value}
              onClick={() => setDirectionChoice(option.value)}
            />
          ))}
        </div>
      </Card>

      <Card padding="md" className={styles.block}>
        <h2 className={styles.blockTitle}>Формат ответа</h2>
        <div className={styles.chips} role="group" aria-label="Формат ответа">
          {ANSWER_MODE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={answerMode === option.value}
              onClick={() => setAnswerMode(option.value)}
            />
          ))}
        </div>
        <p className={styles.hint}>
          {answerMode === ANSWER_MODES.TEXT
            ? 'Пишем перевод слова с клавиатуры'
            : answerMode === ANSWER_MODES.CHOICE
              ? 'Выбираем правильный перевод из четырёх'
              : 'Слушаем слово и пишем его на английском'}
        </p>
      </Card>

      <Card padding="md" className={styles.block}>
        <h2 className={styles.blockTitle}>Сколько слов</h2>
        <div className={styles.chips} role="group" aria-label="Размер тренировки">
          {SIZE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={String(size) === option.value}
              onClick={() => setSize(option.value)}
            />
          ))}
        </div>
      </Card>

      <div className={styles.footer}>
        <p className={styles.count}>
          <Icon name="cards" size={18} />
          {poolCount > 0
            ? `В тренировке ${poolCount} ${plural(poolCount)}`
            : 'В этом источнике нет слов'}
        </p>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<Icon name="learn" size={20} />}
          disabled={poolCount === 0}
          onClick={handleStart}
        >
          Начать тренировку
        </Button>
      </div>
    </div>
  );
}

// Русские склонения: 1 слово / 2-4 слова / 5+ слов
const plural = (count) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'слово';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'слова';
  return 'слов';
};
