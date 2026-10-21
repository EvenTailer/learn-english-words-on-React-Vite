// Локальная дата в формате YYYY-MM-DD (без UTC — день пользователя)
export const toISODate = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseISODate = (iso) => {
  const [year, month, day] = String(iso).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

export const addDays = (iso, amount) => {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + amount);
  return toISODate(date);
};

// Сколько дней между двумя датами (b - a)
export const diffDays = (a, b) => {
  const first = parseISODate(a);
  const second = parseISODate(b);
  return Math.round((second - first) / 86400000);
};
