import styles from './EmptyState.module.css';

/**
 * Пустое состояние: иконка, заголовок, описание и действие.
 */
export default function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}) {
  const classes = [styles.wrapper, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {icon ? (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      ) : null}

      <h3 className={styles.title}>{title}</h3>

      {description ? <p className={styles.description}>{description}</p> : null}

      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
