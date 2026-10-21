import styles from './ProgressRing.module.css';

/**
 * Кольцо прогресса на SVG. value — процент 0…100,
 * label — ReactNode в центре, caption — подпись под кольцом.
 */
export default function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  tone = 'accent',
  label,
  caption,
  className,
}) {
  const percent = Math.min(Math.max(Number(value) || 0, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const center = size / 2;

  const classes = [styles.wrapper, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className={styles.ring} style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={styles.svg}
          aria-hidden="true"
          focusable="false"
        >
          <circle
            className={styles.track}
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            className={[styles.fill, styles[tone]].filter(Boolean).join(' ')}
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </svg>

        {label ? <div className={styles.center}>{label}</div> : null}
      </div>

      {caption ? <p className={styles.caption}>{caption}</p> : null}
    </div>
  );
}
