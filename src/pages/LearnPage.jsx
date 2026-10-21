import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { answerChanged } from '../features/learn/learnSlice';
import {
  checkAnswer,
  revealAnswer,
  skipCard,
  startLearn,
} from '../features/learn/learnThunks';
import {
  selectCurrentCard,
  selectIsRevealed,
  selectLearnMode,
} from '../features/learn/selectors';
import { selectCards } from '../features/words/selectors';
import { isAnswerMatch } from '../shared/lib/answerNormalizer';
import { speak } from '../shared/lib/speech';
import Button from '../shared/ui/Button';
import Card from '../shared/ui/Card';
import EmptyState from '../shared/ui/EmptyState';
import Icon from '../shared/ui/Icon';
import ProgressBar from '../shared/ui/ProgressBar';
import LearnCard from '../widgets/LearnCard/LearnCard';
import SessionSummary from '../widgets/SessionSummary/SessionSummary';
import styles from './LearnPage.module.css';

// Сколько живёт подсветка результата ответа
const RESULT_HIGHLIGHT_MS = 800;

export default function LearnPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const cards = useAppSelector(selectCards);
  const currentCard = useAppSelector(selectCurrentCard);
  const mode = useAppSelector(selectLearnMode);
  const answer = useAppSelector((state) => state.learn.answer);
  const revealed = useAppSelector(selectIsRevealed);
  const finished = useAppSelector((state) => state.learn.finished);
  const session = useAppSelector((state) => state.learn.session);

  const inputRef = useRef(null);
  const [lastResult, setLastResult] = useState(null);

  // Новая сессия при входе на экран
  useEffect(() => {
    dispatch(startLearn());
  }, [dispatch]);

  // Подсветка результата гаснет через 800 мс
  useEffect(() => {
    if (!lastResult) return undefined;
    const timer = setTimeout(() => setLastResult(null), RESULT_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [lastResult]);

  // Фокус на поле ответа при смене карточки
  useEffect(() => {
    if (currentCard) inputRef.current?.focus();
  }, [currentCard]);

  const handleCheck = useCallback(() => {
    if (!currentCard) return;
    const correct = mode === 'eng' ? currentCard.russianWord : currentCard.englishWord;

    // Пустой ответ — thunk сам покажет подсказку, результат не подсвечиваем
    if (answer.trim() === '') {
      dispatch(checkAnswer());
      return;
    }

    setLastResult({
      type: isAnswerMatch(answer, correct) ? 'correct' : 'wrong',
    });
    dispatch(checkAnswer());
  }, [answer, currentCard, dispatch, mode]);

  const handlePrimary = useCallback(() => {
    if (revealed) dispatch(skipCard());
    else handleCheck();
  }, [dispatch, handleCheck, revealed]);

  // Клавиатура: Enter — проверить, Esc — выход на главную
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        navigate('/');
        return;
      }
      if (event.key !== 'Enter') return;

      // На кнопке Enter уже срабатывает click — не дублируем действие
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        ['BUTTON', 'A', 'SELECT'].includes(target.tagName)
      ) {
        return;
      }

      event.preventDefault();
      handlePrimary();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePrimary, navigate]);

  const total = session?.total ?? 0;
  const answered = session?.answered ?? 0;
  const noWords = cards.length === 0;
  const allMastered = finished && total === 0;

  return (
    <div className={styles.page}>
      {noWords ? (
        <Card padding="lg" className={styles.emptyCard}>
          <EmptyState
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
                  Наборы слов
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          {total > 0 ? (
            <ProgressBar
              value={answered}
              max={total}
              label="Прогресс сессии"
              showValue
              tone="accent"
            />
          ) : null}

          {allMastered ? (
            <Card padding="lg" className={styles.emptyCard}>
              <EmptyState
                title="Все слова выучены"
                description="Словарь пройден полностью. Добавьте новые слова или вернитесь на главную."
                icon={<Icon name="trophy" size={32} />}
                action={
                  <div className={styles.emptyActions}>
                    <Button
                      variant="primary"
                      icon={<Icon name="home" size={20} />}
                      onClick={() => navigate('/')}
                    >
                      На главную
                    </Button>
                    <Button
                      variant="secondary"
                      icon={<Icon name="plus" size={20} />}
                      onClick={() => navigate('/add')}
                    >
                      Добавить слово
                    </Button>
                  </div>
                }
              />
            </Card>
          ) : finished ? (
            <SessionSummary
              session={session}
              onRestart={() => dispatch(startLearn())}
              onHome={() => navigate('/')}
            />
          ) : currentCard ? (
            <LearnCard
              card={currentCard}
              mode={mode}
              revealed={revealed}
              answer={answer}
              lastResult={lastResult}
              inputRef={inputRef}
              onAnswerChange={(value) => dispatch(answerChanged(value))}
              onSpeak={() => speak(currentCard.englishWord)}
              onPrimary={handlePrimary}
              onReveal={() => dispatch(revealAnswer())}
              onSkip={() => dispatch(skipCard())}
              onExit={() => navigate('/')}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
