<?php
declare(strict_types=1);

/**
 * Тест API: регистрация → вход → синхронизация → вход с другого устройства.
 * Запуск: docker run --rm -d -p 8080:8080 -v "$PWD:/srv" php:8.3-cli php -S 0.0.0.0:8080 -t /srv
 */

$base = 'http://127.0.0.1:8080';

function request(string $method, string $path, ?array $body = null, ?string $token = null): array
{
    $ch = curl_init($GLOBALS['base'] . $path);
    $headers = [];
    if ($token !== null) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
    ]);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => json_decode((string) $raw, true), 'raw' => $raw];
}

function check(string $name, bool $ok, string $detail = ''): void
{
    echo ($ok ? "OK   " : "FAIL ") . $name . ($detail ? " — $detail" : '') . PHP_EOL;
    if (!$ok) {
        $GLOBALS['failed'] = true;
    }
}

$failed = false;
$email = 'test' . time() . '@example.com';

// 1. Регистрация
$r = request('POST', '/api/register.php', ['email' => $email, 'password' => 'super-secret-1']);
check('регистрация', $r['code'] === 201 && !empty($r['body']['token']), 'код ' . $r['code'] . ' ' . substr((string) $r['raw'], 0, 120));
$token = $r['body']['token'] ?? '';

// 2. Повторная регистрация того же email
$r2 = request('POST', '/api/register.php', ['email' => $email, 'password' => 'super-secret-1']);
check('повторная регистрация отклонена', $r2['code'] === 409, 'код ' . $r2['code']);

// 3. Короткий пароль
$r3 = request('POST', '/api/register.php', ['email' => 'x' . time() . '@example.com', 'password' => 'short']);
check('короткий пароль отклонён', $r3['code'] === 400, 'код ' . $r3['code']);

// 4. Запрос без токена
$r4 = request('GET', '/api/sync.php');
check('без токена — 401', $r4['code'] === 401, 'код ' . $r4['code']);

// 5. Сохранение данных
$payload = [
    'cards' => [['id' => 'a', 'englishWord' => 'lion', 'russianWord' => 'лев', 'linkImg' => '', 'count' => 0]],
    'progress' => ['lion' => ['status' => 'learning', 'streak' => 1]],
    'stats' => ['totalCorrect' => 5],
    'lists' => [['id' => 'l1', 'name' => 'Еда', 'words' => []]],
    'settings' => ['theme' => 'dark'],
];
$r5 = request('PUT', '/api/sync.php', $payload, $token);
check('сохранение данных', $r5['code'] === 200 && ($r5['body']['ok'] ?? false) === true, 'код ' . $r5['code']);
$updatedAt = $r5['body']['updatedAt'] ?? null;
check('сервер вернул метку версии', is_string($updatedAt) && $updatedAt !== '');

// 6. Чтение данных
$r6 = request('GET', '/api/sync.php', null, $token);
check('чтение данных', $r6['code'] === 200 && count($r6['body']['payload']['cards'] ?? []) === 1, 'код ' . $r6['code']);

// 7. Лишние поля не сохраняются
$r7 = request('PUT', '/api/sync.php', $payload + ['hacker' => 'x', 'updatedAt' => $updatedAt], $token);
$r7b = request('GET', '/api/sync.php', null, $token);
check('лишние поля отброшены', $r7['code'] === 200 && !isset($r7b['body']['payload']['hacker']), 'код ' . $r7['code']);

// 7b. Старая метка не затирает свежие данные
$stale = request('PUT', '/api/sync.php', [
    'updatedAt' => '2000-01-01T00:00:00+00:00',
    'cards' => [],
    'progress' => [],
    'stats' => [],
    'lists' => [],
    'settings' => [],
], $token);
$afterStale = request('GET', '/api/sync.php', null, $token);
check(
    'устаревшая копия отклонена',
    $stale['code'] === 409 && count($afterStale['body']['payload']['cards'] ?? []) === 1,
    'код ' . $stale['code']
);

// 8. Кто я
$r8 = request('GET', '/api/me.php', null, $token);
check('me отдаёт пользователя', $r8['code'] === 200 && ($r8['body']['user']['email'] ?? '') === $email && $r8['body']['hasData'] === true);

// 9. Неверный пароль
$r9 = request('POST', '/api/login.php', ['email' => $email, 'password' => 'wrong-password']);
check('неверный пароль отклонён', $r9['code'] === 401, 'код ' . $r9['code']);

// 10. Вход
$r10 = request('POST', '/api/login.php', ['email' => $email, 'password' => 'super-secret-1']);
check('вход', $r10['code'] === 200 && !empty($r10['body']['token']));
$token2 = $r10['body']['token'] ?? '';

// 11. Данные доступны со второго устройства (другой токен)
$r11 = request('GET', '/api/sync.php', null, $token2);
check('данные видны с другого устройства', $r11['code'] === 200 && count($r11['body']['payload']['cards'] ?? []) === 1);

// 12. Выход убивает токен
$r12 = request('POST', '/api/logout.php', null, $token2);
$r13 = request('GET', '/api/sync.php', null, $token2);
check('после выхода токен не работает', $r12['code'] === 200 && $r13['code'] === 401, 'код ' . $r13['code']);

// 13. Первый токен после выхода второго продолжает работать
$r14 = request('GET', '/api/sync.php', null, $token);
check('другие сессии не тронуты', $r14['code'] === 200);

echo PHP_EOL . ($failed ? "ЕСТЬ ОШИБКИ" : "ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ") . PHP_EOL;
exit($failed ? 1 : 0);
