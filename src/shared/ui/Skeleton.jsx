import styles from './Skeleton.module.css';

/**
 * Заглушка загрузки. count > 1 — рисует группу строк.
 * Размеры можно задать через width/height (число = px, строка = любое CSS-значение).
 */
export default function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className,
}) {
  const total = Math.max(1, count);

  const style = {};
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  const skeletonClasses = [styles.skeleton, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  const items = Array.from({ length: total }, (_, index) => (
    <span
      key={index}
      className={skeletonClasses}
      style={style}
      aria-hidden="true"
    />
  ));

  if (total > 1) {
    return <span className={styles.group}>{items}</span>;
  }

  return items[0];
}
