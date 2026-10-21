import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import styles from './Modal.module.css';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Модальное окно. Фокус уходит внутрь, ловится ловушкой Tab,
 * по Escape закрывается, по закрытию фокус возвращается инициатору.
 */
export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    openerRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    if (dialog) {
      const focusable = dialog.querySelectorAll(FOCUSABLE);
      const target = focusable.length > 0 ? focusable[0] : dialog;
      target.focus();
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      const opener = openerRef.current;
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropMouseDown = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) onClose();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const items = Array.from(dialog.querySelectorAll(FOCUSABLE));
    if (items.length === 0) {
      event.preventDefault();
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const dialogClasses = [styles.dialog, styles[size]].filter(Boolean).join(' ');

  return createPortal(
    <div className={styles.backdrop} onMouseDown={handleBackdropMouseDown}>
      <div
        ref={dialogRef}
        className={dialogClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Закрыть"
            title="Закрыть"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className={styles.body}>{children}</div>

        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>,
    document.body
  );
}
