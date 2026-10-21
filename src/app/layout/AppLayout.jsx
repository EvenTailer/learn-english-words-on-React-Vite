import { Outlet } from 'react-router-dom';
import Toast from '../../shared/ui/Toast';
import AppHeader from '../../widgets/AppHeader/AppHeader';
import BottomNav from '../../widgets/BottomNav/BottomNav';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  return (
    <div className={styles.layout}>
      <a className="skip-link" href="#main">
        К основному содержимому
      </a>
      <AppHeader />
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
      <Toast />
    </div>
  );
}
