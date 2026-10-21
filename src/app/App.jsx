import { Outlet } from 'react-router-dom';
import Header from '../widgets/Header/Header';
import Toast from '../shared/ui/Toast';
import styles from './App.module.css';

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}
