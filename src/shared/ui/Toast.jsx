import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { toastHidden } from '../../features/learn/learnSlice';
import styles from './Toast.module.css';

const DURATION = { error: 4500, info: 3000, success: 2000 };

export default function Toast() {
  const toast = useAppSelector((state) => state.learn.toast);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = setTimeout(
      () => dispatch(toastHidden()),
      DURATION[toast.type] ?? 2000
    );
    return () => clearTimeout(timer);
  }, [toast.message, toast.type, dispatch]);

  if (!toast.message) return null;

  return (
    <div
      className={`${styles.toast} ${styles[`toast-${toast.type}`] ?? ''}`}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  );
}
