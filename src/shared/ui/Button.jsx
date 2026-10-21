import styles from './Button.module.css';

/**
 * Кнопка системы. 5 вариантов, 3 размера, состояния loading/disabled.
 * Иконка (icon) рисуется вместо контента, пока loading.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'start',
  type = 'button',
  ariaLabel,
  onClick,
  className,
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const glyph = loading ? <span className={styles.spinner} aria-hidden="true" /> : icon;

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading ? 'true' : undefined}
    >
      {glyph && iconPosition === 'start' ? (
        <span className={styles.icon}>{glyph}</span>
      ) : null}
      <span className={styles.content}>{children}</span>
      {glyph && iconPosition === 'end' ? (
        <span className={styles.icon}>{glyph}</span>
      ) : null}
    </button>
  );
}
