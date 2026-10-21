import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { loadWordLists } from '../features/wordlists/wordlistsSlice';
import { cardsImported } from '../features/words/wordsSlice';
import { selectCardsCount } from '../features/words/selectors';
import { toastShown } from '../features/learn/learnSlice';
import { createId } from '../shared/lib/id';
import styles from './WordListsPage.module.css';

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

export default function WordListsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector((state) => state.wordlists.status);
  const data = useAppSelector((state) => state.wordlists.data);
  const total = useAppSelector(selectCardsCount);

  useEffect(() => {
    if (status === 'idle') dispatch(loadWordLists());
  }, [dispatch, status]);

  const importSet = (key, title) => {
    const words = data?.sets?.[key] ?? [];
    if (words.length === 0) return;

    dispatch(
      cardsImported(
        words.map((word) => ({
          id: createId(),
          englishWord: word.en,
          russianWord: word.ru,
          linkImg: '',
          count: 0,
          level: word.level ?? '',
        }))
      )
    );
    dispatch(
      toastShown({
        message: `Набор «${title}» добавлен в словарь`,
        type: 'success',
      })
    );
  };

  return (
    <div className={styles.wordlistsScreen}>
      <div className={styles.wordlistsContainer}>
        <div className={styles.wordlistsHeader}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            ← На главную
          </button>
          <h2 className={styles.title}>📚 Готовые наборы слов</h2>
          <p className={styles.subtitle}>
            Слова с переводами и уровнем сложности. В словаре сейчас:{' '}
            <strong>{total}</strong>
          </p>
        </div>

        {status === 'loading' && <p className={styles.subtitle}>Загружаем наборы…</p>}
        {status === 'error' && (
          <p className={styles.subtitle}>Не удалось загрузить наборы слов</p>
        )}

        <div className={styles.grid}>
          {SETS.map((set) => {
            const words = data?.sets?.[set.key] ?? [];
            return (
              <article key={set.key} className={styles.setCard}>
                <h3 className={styles.setTitle}>{set.title}</h3>
                <p className={styles.setHint}>{set.hint}</p>
                <p className={styles.setCount}>{words.length} слов</p>
                <p className={styles.setPreview}>
                  {words
                    .slice(0, 6)
                    .map((word) => word.en)
                    .join(', ')}
                  {words.length > 6 ? '…' : ''}
                </p>
                <button
                  className={styles.importBtn}
                  onClick={() => importSet(set.key, set.title)}
                  disabled={words.length === 0}
                >
                  ➕ В словарь
                </button>
              </article>
            );
          })}
        </div>

        <p className={styles.license}>
          Oxford 3000 (public domain) · CEFR-J Vocabulary Profile (Tono
          Laboratory, TUFS) · FrequencyWords (MIT) · переводы Google Translate
        </p>
      </div>
    </div>
  );
}
