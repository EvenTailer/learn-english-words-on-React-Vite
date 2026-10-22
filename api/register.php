<?php
declare(strict_types=1);

/**
 * Регистрация: email + пароль → токен сессии.
 * POST { email, password }
 */

require __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    api_fail(405, 'Нужен POST');
}

$pdo = api_db();
$body = api_read_json();

$email = api_email((string) ($body['email'] ?? ''));
$password = (string) ($body['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    api_fail(400, 'Некорректный email');
}
if (mb_strlen($password) < 8) {
    api_fail(400, 'Пароль минимум 8 символов');
}

$statement = $pdo->prepare('SELECT id FROM users WHERE email = :email');
$statement->execute(['email' => $email]);
if ($statement->fetch()) {
    api_fail(409, 'Такой email уже зарегистрирован');
}

$now = date('c');
$insert = $pdo->prepare(
    'INSERT INTO users (email, password_hash, created_at, last_seen_at)
     VALUES (:email, :hash, :created, :seen)'
);
$insert->execute([
    'email' => $email,
    'hash' => password_hash($password, PASSWORD_DEFAULT),
    'created' => $now,
    'seen' => $now,
]);

$userId = (int) $pdo->lastInsertId();
$session = api_issue_token($pdo, $userId);

api_ok([
    'token' => $session['token'],
    'expiresAt' => $session['expiresAt'],
    'user' => [
        'id' => $userId,
        'email' => $email,
        'createdAt' => $now,
    ],
], 201);
