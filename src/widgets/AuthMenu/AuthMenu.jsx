import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { logoutUser } from '../../features/auth/authSlice';
import Button from '../../shared/ui/Button';
import Icon from '../../shared/ui/Icon';
import styles from './AuthMenu.module.css';

/**
 * Меню аккаунта в шапке: вошедший видит свой email и может выйти,
 * невошедший — ссылку на вход.
 */
export default function AuthMenu({ syncStatus }) {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    await dispatch(logoutUser());
    setBusy(false);
  };

  if (!token || !user) {
    return (
      <Link to="/login" className={styles.loginLink}>
        <Icon name="learn" size={18} />
        <span>Войти</span>
      </Link>
    );
  }

  return (
    <div className={styles.wrap}>
      <span
        className={styles.status}
        title={
          syncStatus === 'syncing'
            ? 'Синхронизация с сервером'
            : syncStatus === 'error'
              ? 'Сервер недоступен — данные пока только в этом браузере'
              : 'Данные сохранены на сервере'
        }
        aria-label={
          syncStatus === 'error'
            ? 'Сервер недоступен'
            : 'Данные сохранены на сервере'
        }
      >
        <Icon
          name={syncStatus === 'error' ? 'close' : 'check'}
          size={14}
        />
      </span>
      <span className={styles.email} title={user.email}>
        {user.email}
      </span>
      <Button
        variant="ghost"
        size="sm"
        loading={busy}
        onClick={handleLogout}
        ariaLabel="Выйти из аккаунта"
      >
        Выйти
      </Button>
    </div>
  );
}
