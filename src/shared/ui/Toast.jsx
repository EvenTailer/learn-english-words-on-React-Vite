import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { toastHidden } from '../../features/learn/learnSlice';
import styles from './Toast.module.css';

export default function Toast() {
  const toast = useAppSelector((state) => state.learn.toast);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = setTimeout(() => dispatch(toastHidden()), 2000);
    return () => clearTimeout(timer);
  }, [toast.message, dispatch]);

  if (!toast.message) return null;

  return (
    <div className={`${styles.toast} ${styles[`toast-${toast.type}`]}`}>
      {toast.message}
    </div>
  );
}
