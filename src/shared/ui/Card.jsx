import styles from './Card.module.css';

/**
 * Карточка-контейнер. as — семантический тег (div/article/section/li),
 * variant — внешний вид, padding — внутренние отступы.
 */
export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  as = 'div',
  className,
}) {
  // Имя с заглавной — чтобы ESLint не считал JSX-тег неиспользованной переменной
  const Tag = as;

  const classes = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <Tag className={classes}>{children}</Tag>;
}
