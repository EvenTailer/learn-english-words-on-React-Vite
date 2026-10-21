import { Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/store/hooks';
import Toast from '../../shared/ui/Toast';
import AppHeader from '../../widgets/AppHeader/AppHeader';
import BottomNav from '../../widgets/BottomNav/BottomNav';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const location = useLocation();

  // Во время тренировки — режим фокуса: навигация мешает, выход есть в карточке
  const plan = useAppSelector((state) => state.learn.plan);
  const inSession = location.pathname.endsWith('/learn') && Boolean(plan);

  return (
    <div className={`${styles.layout} ${inSession ? styles.focus : ''}`}>
      <a className="skip-link" href="#main">
        К основному содержимому
      </a>
      {inSession ? null : <AppHeader />}
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
      {inSession ? null : <BottomNav />}
      <Toast />
    </div>
  );
}
