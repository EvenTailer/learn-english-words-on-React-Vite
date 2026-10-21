import { ANSWER_MODES } from '../../features/learn/plan';
import Badge from '../../shared/ui/Badge';
import Button from '../../shared/ui/Button';
import Card from '../../shared/ui/Card';
import Icon from '../../shared/ui/Icon';
import IconButton from '../../shared/ui/IconButton';
import Input from '../../shared/ui/Input';
import styles from './LearnCard.module.css';

/**
 * Карточка учебного слова. Presentational: вся логика — снаружи.
 *
 * mode === 'eng' — вопрос английский (озвучка и транскрипция показываются),
 * mode === 'rus' — вопрос русский, английское слово и есть ответ
 * (озвучка и транскрипция скрыты, иначе они выдают ответ).
 */
export default function LearnCard({
  card,
  mode,
  answerMode = ANSWER_MODES.TEXT,
  choices = [],
  revealed = false,
  answer = '',
  lastResult = null,
  inputRef,
  voice = null,
  onAnswerChange,
  onChoose,
  onSpeak,
  onPrimary,
  onReveal,
  onSkip,
  onChangePlan,
  onExit,
}) {
  const showEnglish = mode === 'eng';
  const isAudio = answerMode === ANSWER_MODES.AUDIO;
  const isChoice = answerMode === ANSWER_MODES.CHOICE;

  // В аудио-режиме слово не показываем — его нужно услышать
  const question = isAudio ? '' : showEnglish ? card.englishWord : card.russianWord;
  const correctAnswer = showEnglish ? card.russianWord : card.englishWord;

  const resultClass =
    lastResult?.type === 'correct'
      ? styles.correct
      : lastResult?.type === 'wrong'
        ? styles.wrong
        : '';

  const choiceClass = (option) => {
    const classes = [styles.choice];
    if (answer === option) classes.push(styles.choiceSelected);
    if (lastResult?.type === 'correct' && option === correctAnswer) {
      classes.push(styles.choiceCorrect);
    }
    if (lastResult?.type === 'wrong' && answer === option) {
      classes.push(styles.choiceWrong);
    }
    return classes.join(' ');
  };

  return (
    <Card
      variant="elevated"
      padding="lg"
      className={`${styles.shell} ${resultClass}`}
    >
      <div className={styles.top}>
        <div className={styles.topLeft}>
          <IconButton
            icon={<Icon name="arrow-left" size={20} />}
            label="Выйти"
            variant="ghost"
            onClick={onExit}
          />
          <button type="button" className={styles.exitButton} onClick={onExit}>
            Выйти
          </button>
        </div>
        <Badge variant={showEnglish ? 'accent' : 'success'}>
          {isAudio ? 'АУДИО' : showEnglish ? 'ENGLISH' : 'RUSSIAN'}
        </Badge>
        {onChangePlan ? (
          <IconButton
            icon={<Icon name="list" size={20} />}
            label="Сменить набор слов"
            variant="ghost"
            onClick={onChangePlan}
          />
        ) : null}
      </div>

      <div className={styles.media}>
        {card.linkImg ? (
          <img
            className={styles.image}
            src={card.linkImg}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className={styles.placeholder}>
            <Icon name="image" size={40} />
          </span>
        )}
      </div>

      {isAudio ? (
        <div className={styles.audioBlock}>
          <IconButton
            icon={<Icon name="volume" size={32} />}
            label="Прослушать слово"
            variant="accent"
            size="lg"
            onClick={onSpeak}
          />
          <p className={styles.audioHint}>Послушайте слово и напишите его</p>
        </div>
      ) : (
        <div className={styles.wordBlock}>
          <h2 className={styles.word}>{question}</h2>

          {showEnglish && card.phonetic ? (
            <div className={styles.meta}>
              <span className={styles.phonetic}>{card.phonetic}</span>
              <IconButton
                icon={<Icon name="volume" size={18} />}
                label="Произнести"
                variant="ghost"
                size="sm"
                onClick={onSpeak}
              />
            </div>
          ) : null}

          {revealed ? (
            <p className={styles.reveal}>
              Правильный ответ: <strong>{correctAnswer}</strong>
            </p>
          ) : null}
        </div>
      )}

      {isChoice ? (
        <div className={styles.choices} role="group" aria-label="Варианты ответа">
          {choices.map((option) => (
            <button
              key={option}
              type="button"
              className={choiceClass(option)}
              disabled={revealed}
              onClick={() => onChoose?.(option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.form}>
          <div className={styles.inputRow}>
            <Input
              label="Ваш ответ"
              value={answer}
              onChange={onAnswerChange}
              placeholder={
                isAudio ? 'Введите слово на английском...' : 'Введите перевод...'
              }
              disabled={revealed}
              inputRef={inputRef}
              autoComplete="off"
            />
            {voice?.supported ? (
              <IconButton
                icon={
                  <Icon
                    name={voice.listening ? 'mic-off' : 'mic'}
                    size={20}
                  />
                }
                label={voice.listening ? 'Остановить запись' : 'Голосовой ввод'}
                variant={voice.listening ? 'danger' : 'accent'}
                onClick={voice.toggle}
                className={styles.voiceButton}
              />
            ) : null}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={
            revealed ? (
              <Icon name="arrow-right" size={20} />
            ) : (
              <Icon name="check" size={20} />
            )
          }
          iconPosition={revealed ? 'end' : 'start'}
          onClick={onPrimary}
        >
          {revealed ? 'Дальше' : 'Проверить'}
        </Button>

        <div className={styles.secondary}>
          <Button
            variant="ghost"
            icon={<Icon name="eye" size={20} />}
            onClick={onReveal}
            disabled={revealed}
          >
            Показать ответ
          </Button>
          <Button
            variant="ghost"
            icon={<Icon name="skip" size={20} />}
            onClick={onSkip}
          >
            Пропустить
          </Button>
        </div>

        <p className={styles.hint}>
          {isChoice
            ? 'Выберите перевод и нажмите «Проверить»'
            : 'Впишите перевод и нажмите «Проверить»'}
        </p>
      </div>
    </Card>
  );
}
