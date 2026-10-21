import { useEffect, useRef, useState } from 'react';
import { THEMES } from '../../features/settings/settingsSlice';
import { useTheme } from '../../shared/hooks/useTheme';
import Icon from '../../shared/ui/Icon';
import styles from './ThemeSwitcher.module.css';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.switcher} ref={containerRef}>
      <button
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
        <div className={styles.menu} role="menu" aria-label="Темы оформления">
          {THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === item.id}
              className={`${styles.item} ${
                theme === item.id ? styles.itemActive : ''
              }`}
              onClick={() => {
                setTheme(item.id);
                setOpen(false);
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
