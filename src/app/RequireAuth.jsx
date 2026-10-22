import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from './store/hooks';

/**
 * Словарь без сессии не открывается.
 * Иначе после «Выйти» человек остаётся на той же странице
 * и локальные правки потом затирают сервер.
 */
export default function RequireAuth() {
  const token = useAppSelector((state) => state.auth.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
