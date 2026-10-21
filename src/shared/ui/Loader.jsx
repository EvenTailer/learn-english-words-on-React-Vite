import styles from './Loader.module.css';

export default function Loader() {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true" />
      <span className={styles.label}>Загрузка…</span>
    </div>
  );
}
