import styles from './Chip.module.css';

/**
 * Переключаемый чип. Без onClick рендерится как span (не интерактивный),
 * с onClick — как button с aria-pressed.
 */
export default function Chip({
  label,
  active = false,
  count,
  icon,
  onClick,
  disabled = false,
  className,
}) {
  const classes = [
    styles.chip,
    active ? styles.active : '',
    disabled ? styles.disabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={styles.label}>{label}</span>
      {count !== undefined && count !== null ? (
        <span className={styles.count}>{count}</span>
      ) : null}
    </>
  );

  if (!onClick) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
    >
      {content}
    </button>
  );
}
