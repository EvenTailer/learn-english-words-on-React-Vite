<?php
declare(strict_types=1);

/**
 * Вход: email + пароль → токен сессии.
 * POST { email, password }
 */

require __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    api_fail(405, 'Нужен POST');
}

$pdo = api_db();

if (api_login_blocked($pdo)) {
    api_fail(429, 'Слишком много попыток. Попробуйте позже');
}

$body = api_read_json();
$email = api_email((string) ($body['email'] ?? ''));
$password = (string) ($body['password'] ?? '');

$statement = $pdo->prepare('SELECT id, password_hash, created_at FROM users WHERE email = :email');
$statement->execute(['email' => $email]);
$user = $statement->fetch();

if (!$user || !password_verify($password, (string) $user['password_hash'])) {
    api_login_failed($pdo);
    api_fail(401, 'Неверный email или пароль');
}

api_login_succeeded($pdo);

$pdo->prepare('UPDATE users SET last_seen_at = :seen WHERE id = :id')
    ->execute(['seen' => date('c'), 'id' => (int) $user['id']]);

$session = api_issue_token($pdo, (int) $user['id']);

api_ok([
    'token' => $session['token'],
    'expiresAt' => $session['expiresAt'],
    'user' => [
        'id' => (int) $user['id'],
        'email' => $email,
        'createdAt' => $user['created_at'],
    ],
]);
