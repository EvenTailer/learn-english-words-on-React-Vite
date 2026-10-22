import { useState } from 'react';
import { useAppDispatch, useAppSelector, useAppStore } from '../../app/store/hooks';
import {
  syncConflictResolved,
  syncKeepLocal,
} from '../../features/auth/authSlice';
import { toastShown } from '../../features/ui/toastSlice';
import {
  applySyncPayload,
  clearPendingServerPayload,
  getPendingServerPayload,
  setServerUpdatedAt,
} from '../../shared/lib/sync';
import Button from '../../shared/ui/Button';
import Modal from '../../shared/ui/Modal';
import styles from './SyncConflictModal.module.css';

/**
 * На сервере данные есть и в браузере тоже — спрашиваем, что оставить.
 * Молча затирать слова нельзя: человек бы потерял накопленное.
 */
export default function SyncConflictModal() {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const conflict = useAppSelector((state) => state.auth.conflict);
  const [busy, setBusy] = useState(false);

  if (!conflict) return null;

  const takeFromServer = () => {
    const payload = getPendingServerPayload();
    setServerUpdatedAt(conflict.updatedAt);
    if (payload) applySyncPayload(store, payload);
    clearPendingServerPayload();
    dispatch(syncConflictResolved());
    dispatch(
      toastShown({
        message: 'Загружены данные с сервера',
        type: 'info',
      })
    );
  };

  const keepLocal = () => {
    setServerUpdatedAt(conflict.updatedAt);
    clearPendingServerPayload();
    dispatch(syncKeepLocal());
    dispatch(
      toastShown({
        message: 'Данные из браузера отправлены на сервер',
        type: 'success',
      })
    );
  };

  return (
      <Modal
        open
        title="Какие данные оставить?"
        dismissible={false}
        closeOnBackdrop={false}
        onClose={() => {}}
      footer={
        <div className={styles.actions}>
          <Button variant="secondary" onClick={takeFromServer} disabled={busy}>
            Взять с сервера ({conflict.serverCards})
          </Button>
          <Button variant="primary" onClick={keepLocal} disabled={busy}>
            Оставить из браузера ({conflict.localCards})
          </Button>
        </div>
      }
    >
      <p className={styles.text}>
        На сервере {conflict.serverCards} слов, в этом браузере —{' '}
        {conflict.localCards}. Это разные данные: один набор затрёт другой.
        Выберите, какой оставить.
      </p>
    </Modal>
  );
}
