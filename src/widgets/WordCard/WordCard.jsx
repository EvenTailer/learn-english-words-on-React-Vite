import Badge from '../../shared/ui/Badge';
import Icon from '../../shared/ui/Icon';
import IconButton from '../../shared/ui/IconButton';
import styles from './WordCard.module.css';

// Статус слова -> подпись и цвет бейджа
const STATUS_META = {
  mastered: { label: 'выучено', variant: 'success' },
  learning: { label: 'в процессе', variant: 'accent' },
  new: { label: 'новое', variant: 'muted' },
};

/**
 * Карточка слова.
 * variant="grid"   — боевая карточка: картинка, слово, перевод, статус, действия.
 * variant="preview" — предпросмотр на странице добавления: без кнопок.
 */
export default function WordCard({
  card,
  status = 'new',
  correct,
  streak,
  variant = 'grid',
  onSpeak,
  onDelete,
  onAddToList,
}) {
  const meta = STATUS_META[status] ?? STATUS_META.new;
  const isPreview = variant === 'preview';

  const word = card?.englishWord ?? '';
  const translation = card?.russianWord ?? '';
  const image = card?.linkImg ?? '';
  const phonetic = card?.phonetic ?? '';
  const definition = card?.definition ?? '';
  const level = card?.level ?? '';
  // Показываем серию по расписанию: сколько верных ответов из пяти
  const series = Number.isFinite(Number(streak))
    ? Number(streak)
    : Number(correct) || 0;
  const score = Number.isFinite(Number(correct))
    ? Number(correct)
    : Number(card?.count ?? 0) || 0;

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <div className={styles.media}>
          {image ? (
            <img
              className={styles.image}
              src={image}
              alt={word}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className={styles.placeholder} aria-hidden="true">
              <Icon name="image" size={24} />
            </span>
          )}
        </div>

        <div className={styles.head}>
          <h3 className={styles.word}>{word}</h3>
          {phonetic ? <p className={styles.phonetic}>{phonetic}</p> : null}
          <p className={styles.translation}>{translation}</p>
        </div>
      </div>

      {definition ? <p className={styles.definition}>{definition}</p> : null}

      <div className={styles.meta}>
        <Badge variant={meta.variant}>{meta.label}</Badge>
        {level ? <span className={styles.level}>{level}</span> : null}
      </div>

      {isPreview ? null : (
        <footer className={styles.footer}>
          <span className={styles.score} title={`Всего верных ответов: ${score}`}>
            <Icon name="check" size={16} />
            <span className={styles.scoreValue}>{series}</span>
            <span className={styles.scoreLabel}>из 5 по расписанию</span>
          </span>

          <div className={styles.actions}>
            <IconButton
              icon={<Icon name="volume" size={20} />}
              label={`Озвучить слово ${word}`}
              variant="accent"
              onClick={() => onSpeak?.(word)}
            />
            {onAddToList ? (
              <IconButton
                icon={<Icon name="list" size={20} />}
                label={`Добавить ${word} в список`}
                variant="ghost"
                onClick={() => onAddToList(card)}
              />
            ) : null}
            {onDelete ? (
              <IconButton
                icon={<Icon name="trash" size={20} />}
                label={`Удалить слово ${word}`}
                variant="danger"
                onClick={onDelete}
              />
            ) : null}
          </div>
        </footer>
      )}
    </article>
  );
}
