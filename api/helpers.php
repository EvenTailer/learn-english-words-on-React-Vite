<?php
declare(strict_types=1);

/**
 * Общие помощники API: конфиг, база, ответы, токены, ограничение попыток.
 */

function api_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $file = __DIR__ . '/config.php';
    if (!is_file($file)) {
        api_fail(500, 'Сервер не настроен: нет файла api/config.php');
    }

    $config = require $file;
    if (!is_array($config)) {
        api_fail(500, 'Некорректный api/config.php');
    }

    return $config;
}

function api_fail(int $code, string $message): void
{
    http_response_code($code);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function api_ok(array $payload, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function api_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = api_config();
    $path = $config['db_path'];
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $pdo = new PDO('sqlite:' . $path, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA foreign_keys = ON');

    api_migrate($pdo);

    return $pdo;
}

function api_migrate(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            last_seen_at TEXT
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS user_data (
            user_id INTEGER PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS sessions (
            token_hash TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )'
    );

    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)');
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS login_attempts (
            ip TEXT NOT NULL,
            failed_at TEXT NOT NULL
        )'
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_attempts_ip ON login_attempts(ip, failed_at)');
}

function api_read_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function api_email(string $email): string
{
    return strtolower(trim($email));
}

function api_client_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
}

function api_token_hash(string $token): string
{
    return hash('sha256', $token);
}

/**
 * Создаёт токен сессии. В базе лежит только хеш — утечка базы не даёт войти.
 */
function api_issue_token(PDO $pdo, int $userId): array
{
    $config = api_config();
    $token = bin2hex(random_bytes(32));
    $now = time();
    $expires = $now + ((int) $config['token_ttl_days'] * 86400);

    $statement = $pdo->prepare(
        'INSERT INTO sessions (token_hash, user_id, created_at, expires_at)
         VALUES (:hash, :user, :created, :expires)'
    );
    $statement->execute([
        'hash' => api_token_hash($token),
        'user' => $userId,
        'created' => date('c', $now),
        'expires' => date('c', $expires),
    ]);

    return [
        'token' => $token,
        'expiresAt' => date('c', $expires),
    ];
}

/**
 * Возвращает пользователя по заголовку Authorization или null.
 */
function api_current_user(PDO $pdo): ?array
{
    $header = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($header === '' && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        foreach ($headers as $name => $value) {
            if (strcasecmp($name, 'Authorization') === 0) {
                $header = (string) $value;
                break;
            }
        }
    }

    if (!preg_match('/Bearer\s+(\S+)/i', $header, $matches)) {
        return null;
    }

    $token = $matches[1];
    $statement = $pdo->prepare(
        'SELECT u.id, u.email, u.created_at, s.expires_at
           FROM sessions s
           JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = :hash'
    );
    $statement->execute(['hash' => api_token_hash($token)]);
    $user = $statement->fetch();

    if (!$user) {
        return null;
    }
    if (strtotime((string) $user['expires_at']) < time()) {
        $pdo->prepare('DELETE FROM sessions WHERE token_hash = :hash')
            ->execute(['hash' => api_token_hash($token)]);
        return null;
    }

    return $user;
}

function api_require_user(PDO $pdo): array
{
    $user = api_current_user($pdo);
    if (!$user) {
        api_fail(401, 'Нужно войти в аккаунт');
    }
    return $user;
}

function api_user_payload(PDO $pdo, int $userId): array
{
    $statement = $pdo->prepare('SELECT payload, updated_at FROM user_data WHERE user_id = :id');
    $statement->execute(['id' => $userId]);
    $row = $statement->fetch();

    if (!$row) {
        return ['payload' => null, 'updatedAt' => null];
    }

    $decoded = json_decode((string) $row['payload'], true);

    return [
        'payload' => is_array($decoded) ? $decoded : null,
        'updatedAt' => $row['updated_at'],
    ];
}

function api_save_user_payload(PDO $pdo, int $userId, array $payload): string
{
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE);
    $now = date('c');

    $statement = $pdo->prepare(
        'INSERT INTO user_data (user_id, payload, updated_at)
         VALUES (:id, :payload, :updated)
         ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at'
    );
    $statement->execute([
        'id' => $userId,
        'payload' => $json,
        'updated' => $now,
    ]);

    return $now;
}

// --- ограничение попыток входа ---

function api_login_blocked(PDO $pdo): bool
{
    $config = api_config();
    $ip = api_client_ip();

    $statement = $pdo->prepare(
        'SELECT COUNT(*) AS total FROM login_attempts
          WHERE ip = :ip AND failed_at > :since'
    );
    $statement->execute([
        'ip' => $ip,
        'since' => date('c', time() - ((int) $config['login_lock_minutes'] * 60)),
    ]);

    return (int) ($statement->fetch()['total'] ?? 0) >= (int) $config['max_login_attempts'];
}

function api_login_failed(PDO $pdo): void
{
    $statement = $pdo->prepare('INSERT INTO login_attempts (ip, failed_at) VALUES (:ip, :at)');
    $statement->execute(['ip' => api_client_ip(), 'at' => date('c')]);
}

function api_login_succeeded(PDO $pdo): void
{
    $pdo->prepare('DELETE FROM login_attempts WHERE ip = :ip')
        ->execute(['ip' => api_client_ip()]);
}
