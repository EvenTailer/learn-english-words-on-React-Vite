import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { answerChanged, planCleared } from '../features/learn/learnSlice';
import {
  checkAnswer,
  chooseAnswer,
  nextCard,
  revealAnswer,
  skipCard,
  startLearn,
} from '../features/learn/learnThunks';
import { ANSWER_MODES } from '../features/learn/plan';
import {
  selectCurrentCard,
  selectIsRevealed,
  selectLearnMode,
} from '../features/learn/selectors';
import { toastShown } from '../features/ui/toastSlice';
import { selectCards } from '../features/words/selectors';
import { isAnswerMatch } from '../shared/lib/answerNormalizer';
import { speak } from '../shared/lib/speech';
import { VOICE_ERRORS } from '../shared/lib/voice';
import useVoiceInput from '../shared/hooks/useVoiceInput';
import Button from '../shared/ui/Button';
import Card from '../shared/ui/Card';
import EmptyState from '../shared/ui/EmptyState';
import Icon from '../shared/ui/Icon';
import ProgressBar from '../shared/ui/ProgressBar';
import LearnCard from '../widgets/LearnCard/LearnCard';
import LearnSetup from '../widgets/LearnSetup/LearnSetup';
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
  const plan = useAppSelector((state) => state.learn.plan);
  const answerMode = useAppSelector((state) => state.learn.answerMode);
  const choices = useAppSelector((state) => state.learn.choices);
  const verdict = useAppSelector((state) => state.learn.verdict);
  const state = useAppSelector((s) => s.learn);

  const inputRef = useRef(null);
  const [lastResult, setLastResult] = useState(null);

  // Ответ голосом: русский перевод или английское слово — по направлению
  const voice = useVoiceInput({
    lang: mode === 'eng' ? 'ru-RU' : 'en-US',
    onResult: (text) => dispatch(answerChanged(text)),
    onError: (code) =>
      dispatch(
        toastShown({
          message: VOICE_ERRORS[code] ?? 'Не удалось распознать речь',
          type: 'error',
        })
      ),
  });

  // Подсветка результата гаснет через 800 мс
  useEffect(() => {
    if (!lastResult) return undefined;
    const timer = setTimeout(() => setLastResult(null), RESULT_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [lastResult]);
  // Уходя со страницы, закрываем план: в следующий раз «Учить» снова спросит,
  // что именно учить, а не продолжит прошлую сессию с того же места.
  // Ответы уже записаны в прогресс — ничто не теряется.
  useEffect(
    () => () => {
      dispatch(planCleared());
    },
    [dispatch]
  );

  // Фокус на поле ответа при смене карточки
  useEffect(() => {
    if (currentCard) inputRef.current?.focus();
  }, [currentCard]);

  // В аудио-режиме слово звучит само
  useEffect(() => {
    if (answerMode !== ANSWER_MODES.AUDIO || !currentCard) return;
    speak(currentCard.englishWord);
  }, [answerMode, currentCard]);

  const handleCheck = useCallback(() => {
    if (!currentCard) return;
    const correct = mode === 'eng' ? currentCard.russianWord : currentCard.englishWord;

    // Пустой ответ — thunk сам покажет подсказку, результат не подсвечиваем
    if (answer.trim() === '') {
      dispatch(checkAnswer());
      return;
    }

    // Помечаем результат вместе с карточкой: подсветка не переносится
    // на следующую карточку, если карточка сменилась
    setLastResult({
      cardId: currentCard.id,
      type: isAnswerMatch(answer, correct) ? 'correct' : 'wrong',
    });
    dispatch(checkAnswer());
  }, [answer, currentCard, dispatch, mode]);

  const handlePrimary = useCallback(() => {
    // Показали вердикт или открыли ответ — идём к следующей карточке
    if (revealed || verdict) {
      dispatch(nextCard());
      return;
    }
    handleCheck();
  }, [dispatch, handleCheck, revealed, verdict]);

  // Клавиатура: Enter — проверить, Esc — выйти на главную
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

  // План выбран заранее (например, «Учить по набору») — начинаем сразу
  useEffect(() => {
    if (!plan || finished) return;
    if (state.currentCardId) return;
    dispatch(startLearn(plan));
  }, [dispatch, plan, finished, state.currentCardId]);

  const total = session?.total ?? 0;
  const answered = session?.answered ?? 0;
  const noWords = cards.length === 0;
  const allMastered = finished && total === 0;

  if (noWords) {
    return (
      <div className={styles.page}>
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
      </div>
    );
  }

  // Плана нет — показываем экран выбора: что именно учим
  if (!plan) {
    return (
      <div className={styles.page}>
        <LearnSetup />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {total > 0 ? (
        <div className={styles.progressRow}>
          <ProgressBar
            value={answered}
            max={total}
            label="Прогресс сессии"
            showValue
            tone="accent"
          />
        </div>
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
          onRestart={() => dispatch(startLearn(plan))}
          onChangePlan={() => dispatch(planCleared())}
          onHome={() => navigate('/')}
        />
      ) : currentCard ? (
        <LearnCard
          card={currentCard}
          mode={mode}
          answerMode={answerMode}
          choices={choices}
          revealed={revealed}
          verdict={verdict}
          answer={answer}
          lastResult={lastResult}
          inputRef={inputRef}
          voice={voice}
          onAnswerChange={(value) => dispatch(answerChanged(value))}
          onChoose={(value) => dispatch(chooseAnswer(value))}
          onSpeak={() => speak(currentCard.englishWord)}
          onPrimary={handlePrimary}
          onReveal={() => dispatch(revealAnswer())}
          onSkip={() => dispatch(skipCard())}
          onChangePlan={() => dispatch(planCleared())}
          onExit={() => navigate('/')}
        />
      ) : null}
    </div>
  );
}
