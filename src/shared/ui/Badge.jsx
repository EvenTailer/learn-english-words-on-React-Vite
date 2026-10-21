import styles from './Badge.module.css';

/**
 * Пилюля-лейбл. Варианты: default/accent/success/danger/warning/muted.
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) {
  const classes = [styles.badge, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}
