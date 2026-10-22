<?php
declare(strict_types=1);

/**
 * Текущий пользователь и состояние его данных.
 * GET (с заголовком Authorization)
 */

require __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = api_db();
$user = api_require_user($pdo);
$stored = api_user_payload($pdo, (int) $user['id']);

api_ok([
    'user' => [
        'id' => (int) $user['id'],
        'email' => $user['email'],
        'createdAt' => $user['created_at'],
    ],
    'hasData' => $stored['payload'] !== null,
    'updatedAt' => $stored['updatedAt'],
]);
