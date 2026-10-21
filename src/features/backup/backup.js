// Бэкап: выгрузка и загрузка всех данных пользователя в JSON-файл.
// Нужен, потому что данные лежат только в браузере: очистка истории
// сайта удаляет словарь и прогресс безвозвратно.

export const BACKUP_VERSION = 1;

// Собирает всё, что стоит сохранить, в один объект
export const buildBackup = (state) => ({
  version: BACKUP_VERSION,
  app: 'learn-english-words',
  exportedAt: new Date().toISOString(),
  cards: state.cards?.items ?? [],
  progress: state.progress?.words ?? {},
  stats: state.stats ?? {},
  lists: state.lists?.items ?? [],
  settings: state.settings ?? {},
});

// Скачивает бэкап файлом
export const downloadBackup = (state) => {
  const data = buildBackup(state);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `learn-english-words-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return data;
};

// Читает бэкап из файла и проверяет, что он наш
export const readBackupFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Это не файл бэкапа');
        }
        if (!Array.isArray(parsed.cards) && !parsed.progress) {
          throw new Error('В файле нет данных приложения');
        }
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsText(file);
  });

// Сколько слов и сколько прогресса в бэкапе — для подтверждения
export const backupSummary = (data) => ({
  cards: data?.cards?.length ?? 0,
  progress: Object.keys(data?.progress ?? {}).length,
  lists: data?.lists?.length ?? 0,
});
