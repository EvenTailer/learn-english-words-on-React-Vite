import styles from './ProgressBar.module.css';

/**
 * Полоса прогресса. value/max — «сколько сделано из скольких»,
 * процент заполнения считается автоматически и клампится в 0…100.
 */
export default function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  tone = 'accent',
  size = 'md',
  className,
}) {
  const safeMax = max > 0 ? max : 100;
  const current = Math.min(Math.max(Number(value) || 0, 0), safeMax);
  const percent = (current / safeMax) * 100;

  const classes = [styles.wrapper, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label || showValue ? (
        <div className={styles.header}>
          {label ? <span className={styles.label}>{label}</span> : null}
          {showValue ? (
            <span className={styles.value}>
              {current} / {safeMax}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className={[styles.track, styles[size]].filter(Boolean).join(' ')}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label}
      >
        <div
          className={[styles.fill, styles[tone]].filter(Boolean).join(' ')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
