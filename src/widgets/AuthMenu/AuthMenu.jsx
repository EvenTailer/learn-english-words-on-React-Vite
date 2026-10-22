import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { logoutUser } from '../../features/auth/authSlice';
import { toastShown } from '../../features/ui/toastSlice';
import Button from '../../shared/ui/Button';
import ConfirmDialog from '../../shared/ui/ConfirmDialog';
import Icon from '../../shared/ui/Icon';
import styles from './AuthMenu.module.css';

/**
 * Меню аккаунта в шапке: вошедший видит свой email и может выйти,
 * невошедший — ссылку на вход.
 */
export default function AuthMenu({ syncStatus }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, token, conflict } = useAppSelector((state) => state.auth);
  const [busy, setBusy] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleLogout = () => {
    setBusy(true);
    dispatch(logoutUser({ token, hasConflict: Boolean(conflict) }));
    setIsConfirming(false);
    setBusy(false);
    navigate('/login', { replace: true });
    dispatch(
      toastShown({
        message: 'Вы вышли из аккаунта',
        type: 'info',
      })
    );
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
        onClick={() => setIsConfirming(true)}
        ariaLabel="Выйти из аккаунта"
      >
        Выйти
      </Button>

      <ConfirmDialog
        open={isConfirming}
        title="Выйти из аккаунта?"
        description="Откроется страница входа. Пока вы не войдёте снова, словарь закрыт и на сервер ничего не уйдёт."
        confirmLabel="Выйти"
        onConfirm={handleLogout}
        onCancel={() => setIsConfirming(false)}
      />
    </div>
  );
}
