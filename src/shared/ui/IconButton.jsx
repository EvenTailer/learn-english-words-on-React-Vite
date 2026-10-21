import styles from './IconButton.module.css';

/**
 * Кнопка только с иконкой. label обязателен: он идёт в aria-label и title.
 */
export default function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  className,
}) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
