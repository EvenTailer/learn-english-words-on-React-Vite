import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../shared/lib/navigation';
import Icon from '../../shared/ui/Icon';
import styles from './BottomNav.module.css';

// Нижняя навигация — только на мобильных
export default function BottomNav() {
  return (
    <nav className={styles.bottomNav} aria-label="Мобильная навигация">
      {NAV_ITEMS.map((item) =>
        item.primary ? (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.fab} ${isActive ? styles.fabActive : ''}`
            }
            aria-label="Добавить слово"
          >
            <Icon name={item.icon} size={24} />
          </NavLink>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.itemActive : ''}`
            }
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        )
      )}
    </nav>
  );
}
