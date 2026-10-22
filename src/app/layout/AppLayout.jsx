import { Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/store/hooks';
import useCloudSync from '../../shared/hooks/useCloudSync';
import Toast from '../../shared/ui/Toast';
import AppHeader from '../../widgets/AppHeader/AppHeader';
import BottomNav from '../../widgets/BottomNav/BottomNav';
import SyncConflictModal from '../../widgets/SyncConflictModal/SyncConflictModal';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const location = useLocation();
  const { status: syncStatus } = useCloudSync();

  // Во время тренировки — режим фокуса: навигация мешает, выход есть в карточке
  const plan = useAppSelector((state) => state.learn.plan);
  const inSession = location.pathname.endsWith('/learn') && Boolean(plan);
  const onLogin = location.pathname === '/login';

  return (
    <div className={`${styles.layout} ${inSession ? styles.focus : ''}`}>
      <a className="skip-link" href="#main">
        К основному содержимому
      </a>
      {inSession || onLogin ? null : <AppHeader syncStatus={syncStatus} />}
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
      {inSession || onLogin ? null : <BottomNav />}
      <SyncConflictModal />
      <Toast />
    </div>
  );
}
