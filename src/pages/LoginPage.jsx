import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import {
  authErrorCleared,
  loginUser,
  registerUser,
} from '../features/auth/authSlice';
import Button from '../shared/ui/Button';
import Card from '../shared/ui/Card';
import Chip from '../shared/ui/Chip';
import Icon from '../shared/ui/Icon';
import Input from '../shared/ui/Input';
import styles from './LoginPage.module.css';

const MODES = [
  { value: 'login', label: 'Войти' },
  { value: 'register', label: 'Регистрация' },
];

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, status, error } = useAppSelector((state) => state.auth);

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Вошедшему пользователю форма не нужна
  useEffect(() => {
    if (!user) return;
    const from = location.state?.from?.pathname;
    const next = from && from !== '/login' ? from : '/';
    navigate(next, { replace: true });
  }, [user, navigate, location.state]);

  useEffect(() => () => dispatch(authErrorCleared()), [dispatch]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = { email: email.trim(), password };
    if (mode === 'login') dispatch(loginUser(credentials));
    else dispatch(registerUser(credentials));
  };

  const isLoading = status === 'loading';

  return (
    <div className={styles.page}>
      <Card padding="lg" className={styles.card}>
        <h1 className={styles.title}>
          <Icon name="learn" size={24} />
          {mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
        </h1>
        <p className={styles.subtitle}>
          Словарь, прогресс и наборы хранятся на сервере — они доступны с
          любого устройства, где вы войдёте.
        </p>

        <div className={styles.modes} role="group" aria-label="Вход или регистрация">
          {MODES.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              active={mode === item.value}
              onClick={() => {
                setMode(item.value);
                dispatch(authErrorCleared());
              }}
            />
          ))}
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={mode === 'register' ? 'Минимум 8 символов' : '••••••••'}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            required
          />

          {error ? (
            <p className={styles.error} role="alert">
              <Icon name="close" size={18} />
              {error}
            </p>
          ) : null}

          <Button
            variant="primary"
            size="lg"
            type="submit"
            fullWidth
            loading={isLoading}
          >
            {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Button>
        </form>

        <p className={styles.footnote}>
          Словарь открывается после входа. Если слова уже были в этом браузере,
          а на сервере пусто, они сохранятся в аккаунт.
        </p>
      </Card>
    </div>
  );
}
