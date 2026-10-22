# Серверная часть: аккаунты и хранение данных

Бэкенд на PHP + SQLite. Ноль внешних зависимостей: ни Composer, ни БД-сервера.

## Что где лежит

```
api/                      ← копируется на сервер
  config.example.php      ← образец настроек
  config.php              ← твой файл (в .gitignore!)
  helpers.php             ← общие функции: база, токены, ответы
  register.php            ← POST { email, password }
  login.php               ← POST { email, password }
  logout.php              ← POST (нужен токен)
  me.php                  ← GET  (нужен токен)
  sync.php                ← GET / PUT (нужен токен)
  test-api.php            ← автотесты API (13 проверок)
```

## Настройка на сервере

1. Скопировать `api/` на сервер рядом с `dist/`:

   ```bash
   rsync -av api/ user@server:/var/www/learn-english-words/api/
   ```

2. Создать настройки (путь к базе — **вне веб-корня**, чтобы файл нельзя было скачать):

   ```bash
   cp api/config.example.php api/config.php
   mkdir -p /var/www/learn-english-words-data
   # в config.php поменять db_path на /var/www/learn-english-words-data/app.sqlite
   ```

3. Права: PHP должен писать в каталог с базой.

   ```bash
   chown -R www-data:www-data /var/www/learn-english-words-data
   ```

## nginx (если сайт на nginx + PHP-FPM)

```nginx
location /english/api/ {
    try_files $uri =404;
    fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
    client_max_body_size 8m;
}
```

`client_max_body_size` важен: без него nginx обрежет большие данные (1.5 МБ у тяжёлого пользователя).

Если сайт на Apache — ничего настраивать не нужно, PHP отработает сам. Только `.htaccess` в каталоге с базой, чтобы её не скачали:

```apache
Require all denied
```

## Проверка

```bash
# на сервере
php api/test-api.php        # 13 проверок: регистрация, вход, синхронизация, выход
```

Тест печатает `OK`/`FAIL` по каждому шагу и в конце `ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ`.

## Как это работает у пользователя

- **Без аккаунта** — всё как раньше: данные в IndexedDB этого браузера.
- **После входа** — сервер становится источником правды:
  - при входе данные забираются с сервера (если сервер пуст — отправляем ему локальные);
  - каждое изменение уходит на сервер через 3 секунды тишины;
  - IndexedDB остаётся кешем: без сети приложение работает как раньше.
- Токен — случайные 32 байта, в базе лежит только SHA-256 от него. Утечка базы не даёт войти.
- Пароль хранится как `password_hash` (bcrypt).
- 10 неудачных попыток входа с одного IP — блокировка на 15 минут.

## Сколько места занимает

Замер на реальных данных (3063 слова + год статистики + 10 наборов): **1.5 МБ на тяжёлого пользователя**, 131 КБ на лёгкого. На 3 ГБ хватит примерно на 1000–1500 тяжёлых или десятки тысяч лёгких.

Картинки хранятся **ссылками** на Википедию, а не файлами. Если начать хранить файлы: 3000 × 40 КБ = 117 МБ на пользователя — это и есть главный риск для диска.
