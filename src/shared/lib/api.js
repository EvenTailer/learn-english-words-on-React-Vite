// Клиент API: регистрация, вход и синхронизация данных с сервером.
// Адрес API — рядом с приложением: /english/api (тот же домен, что и сам сайт).

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;

const TOKEN_KEY = 'lew-token';
const USER_KEY = 'lew-user';
const OWNER_KEY = 'lew-owner';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Общий выключатель синхронизации: выход отменяет уже летящий PUT
let syncController = null;

export const abortSyncRequests = () => {
  syncController?.abort();
  syncController = null;
};

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

// Чей словарь лежит в этом браузере. Чужому аккаунту его не отправляем.
export const getDataOwnerId = () => {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
};

export const setDataOwnerId = (id) => {
  try {
    if (id == null || id === '') localStorage.removeItem(OWNER_KEY);
    else localStorage.setItem(OWNER_KEY, String(id));
  } catch {
    // приватный режим
  }
};

// Запрос к API с токеном. sync: true — этот запрос можно отменить при выходе.
export const apiRequest = async (
  path,
  { method = 'GET', body, token, sync = false } = {}
) => {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let signal;
  if (sync) {
    syncController?.abort();
    syncController = new AbortController();
    signal = syncController.signal;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}/${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      const aborted = new ApiError('Запрос отменён', 0, null);
      aborted.name = 'AbortError';
      throw aborted;
    }
    throw new ApiError('Сервер недоступен. Проверьте интернет', 0, null);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data?.error || `Ошибка сервера (${response.status})`,
      response.status,
      data
    );
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

export const fetchServerData = (token) =>
  apiRequest('sync.php', { token, sync: true });

export const pushServerData = (token, payload) =>
  apiRequest('sync.php', { method: 'PUT', body: payload, token, sync: true });
