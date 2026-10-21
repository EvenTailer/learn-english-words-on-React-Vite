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
  revealed = false,
  answer = '',
  lastResult = null,
  inputRef,
  onAnswerChange,
  onSpeak,
  onPrimary,
  onReveal,
  onSkip,
  onExit,
}) {
  const showEnglish = mode === 'eng';
  const question = showEnglish ? card.englishWord : card.russianWord;
  const correctAnswer = showEnglish ? card.russianWord : card.englishWord;

  const resultClass =
    lastResult?.type === 'correct'
      ? styles.correct
      : lastResult?.type === 'wrong'
        ? styles.wrong
        : '';

  return (
    <Card
      variant="elevated"
      padding="lg"
      className={`${styles.shell} ${resultClass}`}
    >
      <div className={styles.top}>
        <IconButton
          icon={<Icon name="arrow-left" size={20} />}
          label="Выйти"
          variant="ghost"
          onClick={onExit}
        />
        <Badge variant={showEnglish ? 'accent' : 'success'}>
          {showEnglish ? 'ENGLISH' : 'RUSSIAN'}
        </Badge>
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

      <div className={styles.form}>
        <Input
          label="Ваш ответ"
          value={answer}
          onChange={onAnswerChange}
          placeholder="Введите перевод..."
          disabled={revealed}
          inputRef={inputRef}
          autoComplete="off"
        />
      </div>

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
            variant="secondary"
            icon={<Icon name="eye" size={20} />}
            onClick={onReveal}
            disabled={revealed}
          >
            Показать ответ
          </Button>
          <Button
            variant="secondary"
            icon={<Icon name="skip" size={20} />}
            onClick={onSkip}
          >
            Пропустить
          </Button>
        </div>

        <p className={styles.hint}>Enter — проверить, Esc — выйти</p>
      </div>
    </Card>
  );
}
