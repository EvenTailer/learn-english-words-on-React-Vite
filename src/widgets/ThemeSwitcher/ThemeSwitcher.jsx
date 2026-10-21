import { useEffect, useRef, useState } from 'react';
import { THEMES } from '../../features/settings/settingsSlice';
import { useTheme } from '../../shared/hooks/useTheme';
import Icon from '../../shared/ui/Icon';
import styles from './ThemeSwitcher.module.css';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);

  // Закрываем по клику вне и по Escape, фокус возвращаем на кнопку
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // При открытии фокус — на выбранную тему
  useEffect(() => {
    if (!open) return;
    const active = THEMES.findIndex((item) => item.id === theme);
    const target = active >= 0 ? active : 0;
    itemRefs.current[target]?.focus();
  }, [open, theme]);

  // Стрелки переключают темы — как в обычном меню
  const handleMenuKeyDown = (event) => {
    const last = THEMES.length - 1;
    let next = null;

    if (event.key === 'ArrowDown') next = event.target.dataset.index < last ? Number(event.target.dataset.index) + 1 : 0;
    if (event.key === 'ArrowUp') next = event.target.dataset.index > 0 ? Number(event.target.dataset.index) - 1 : last;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = last;

    if (next === null) return;
    event.preventDefault();
    itemRefs.current[next]?.focus();
  };

  return (
    <div className={styles.switcher} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Тема оформления"
        title="Тема оформления"
      >
        <Icon name="sun" size={18} />
      </button>

      {open && (
        <div
          className={styles.menu}
          role="menu"
          aria-label="Темы оформления"
          onKeyDown={handleMenuKeyDown}
        >
          {THEMES.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="menuitemradio"
              data-index={index}
              aria-checked={theme === item.id}
              tabIndex={theme === item.id ? 0 : -1}
              className={`${styles.item} ${
                theme === item.id ? styles.itemActive : ''
              }`}
              onClick={() => {
                setTheme(item.id);
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              <span
                className={styles.swatch}
                style={{ background: item.swatch }}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
