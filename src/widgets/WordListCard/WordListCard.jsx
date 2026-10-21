import Button from '../../shared/ui/Button';
import Card from '../../shared/ui/Card';
import Icon from '../../shared/ui/Icon';
import styles from './WordListCard.module.css';

const PREVIEW_LIMIT = 6;

/**
 * Карточка готового набора слов: название, подсказка, размер и импорт.
 * imported=true — набор уже целиком есть в словаре, кнопка неактивна.
 */
export default function WordListCard({
  title,
  hint,
  words = [],
  count,
  imported = false,
  disabled = false,
  onImport,
}) {
  const list = Array.isArray(words) ? words : [];
  const total = Number.isFinite(Number(count)) ? Number(count) : list.length;
  const preview = list
    .slice(0, PREVIEW_LIMIT)
    .map((word) => word?.en)
    .filter(Boolean)
    .join(', ');

  return (
    <Card as="article" padding="md" className={styles.panel}>
      <div className={styles.head}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.count}>{total} слов</span>
      </div>

      {hint ? <p className={styles.hint}>{hint}</p> : null}

      <p className={styles.preview}>
        {preview}
        {list.length > PREVIEW_LIMIT ? '…' : ''}
      </p>

      <div className={styles.actions}>
        {imported ? (
          <Button
            variant="success"
            disabled
            fullWidth
            icon={<Icon name="check" size={20} />}
          >
            Импортировано
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled={disabled || total === 0}
            onClick={onImport}
            fullWidth
            icon={<Icon name="plus" size={20} />}
          >
            Добавить в словарь
          </Button>
        )}
      </div>
    </Card>
  );
}
