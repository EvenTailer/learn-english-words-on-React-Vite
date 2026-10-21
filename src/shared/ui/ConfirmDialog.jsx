import Button from './Button';
import Modal from './Modal';
import styles from './ConfirmDialog.module.css';

/**
 * Диалог подтверждения поверх Modal.
 * destructive = true → кнопка подтверждения в варианте danger.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description ? <p className={styles.description}>{description}</p> : null}
    </Modal>
  );
}
