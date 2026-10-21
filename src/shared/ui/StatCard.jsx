import styles from './StatCard.module.css';

/**
 * Плитка статистики. С onClick рендерится как <button>, без него — как <div>.
 */
export default function StatCard({
  label,
  value,
  icon,
  hint,
  tone = 'default',
  onClick,
  className,
}) {
  const classes = [styles.card, styles[tone], className].filter(Boolean).join(' ');

  const content = (
    <>
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
}
