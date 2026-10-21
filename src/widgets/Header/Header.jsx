import { NavLink } from 'react-router-dom';
import styles from './Header.module.css';

const links = [
  { to: '/', label: '🏠 Главная', end: true },
  { to: '/learn', label: '🧠 Учить' },
  { to: '/add', label: '➕ Добавить' },
  { to: '/storage', label: '📚 Хранилище' },
  { to: '/wordlists', label: '🗂️ Наборы' },
];

export default function Header() {
  return (
    <header className={styles.header}>
      <NavLink to="/" className={styles.brand}>
        📖 Learn English Words
      </NavLink>
      <nav className={styles.nav}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
