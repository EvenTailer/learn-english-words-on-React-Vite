import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../../app/store/hooks';
import { selectStreak } from '../../features/stats/selectors';
import { NAV_ITEMS } from '../../shared/lib/navigation';
import Icon from '../../shared/ui/Icon';
import AuthMenu from '../AuthMenu/AuthMenu';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import styles from './AppHeader.module.css';

export default function AppHeader({ syncStatus }) {
  const streak = useAppSelector(selectStreak);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            EN
          </span>
          <span className={styles.brandText}>Learn English Words</span>
        </NavLink>

        <nav className={styles.nav} aria-label="Основная навигация">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <AuthMenu syncStatus={syncStatus} />
          {streak?.current > 0 && (
            <span
              className={styles.streak}
              title={`Серия: ${streak.current} дн.`}
            >
              <Icon name="flame" size={16} />
              {streak.current}
            </span>
          )}
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
