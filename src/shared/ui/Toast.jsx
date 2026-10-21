import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { toastHidden } from '../../features/ui/toastSlice';
import styles from './Toast.module.css';

const DURATION = { error: 4500, info: 3000, success: 2000, warning: 4000 };

export default function Toast() {
  const toast = useAppSelector((state) => state.ui.toast);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = setTimeout(
      () => dispatch(toastHidden()),
      DURATION[toast.type] ?? 2500
    );
    return () => clearTimeout(timer);
  }, [toast.message, toast.type, dispatch]);

  // Контейнер живёт всегда — иначе скринридер не объявляет
  // содержимое live-region, который только что появился
  const isError = toast.type === 'error';

  return (
    <div
      className={styles.toastWrap}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {toast.message && (
        <div
          className={`${styles.toast} ${styles[`toast-${toast.type}`] ?? ''}`}
        >
          <span className={styles.message}>{toast.message}</span>
          <button
            type="button"
            className={styles.close}
            onClick={() => dispatch(toastHidden())}
            aria-label="Закрыть уведомление"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}
    </div>
  );
}
