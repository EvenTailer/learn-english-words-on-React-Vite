// Клиент API: регистрация, вход и синхронизация данных с сервером.
// Адрес API — рядом с приложением: /english/api (тот же домен, что и сам сайт).

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;

const TOKEN_KEY = 'lew-token';
const USER_KEY = 'lew-user';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // приватный режим — работаем без запоминания
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // игнорируем
  }
};

// Запрос к API с токеном
export const apiRequest = async (path, { method = 'GET', body, token } = {}) => {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}/${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Сервер недоступен. Проверьте интернет');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Ошибка сервера (${response.status})`);
  }
  return data;
};

// Забытый пароль: сервер отвечает одинаково на «нет пользователя» и «неверный пароль»
export const loginRequest = (email, password) =>
  apiRequest('login.php', { method: 'POST', body: { email, password } });

export const registerRequest = (email, password) =>
  apiRequest('register.php', { method: 'POST', body: { email, password } });

export const logoutRequest = (token) =>
  apiRequest('logout.php', { method: 'POST', token });

export const fetchSession = (token) => apiRequest('me.php', { token });

export const fetchServerData = (token) => apiRequest('sync.php', { token });

export const pushServerData = (token, payload) =>
  apiRequest('sync.php', { method: 'PUT', body: payload, token });
