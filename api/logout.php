<?php
declare(strict_types=1);

/**
 * Выход: удаляет текущую сессию.
 * POST (с заголовком Authorization)
 */

require __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    api_fail(405, 'Нужен POST');
}

$pdo = api_db();
$user = api_require_user($pdo);

$header = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
if (preg_match('/Bearer\s+(\S+)/i', $header, $matches)) {
    $pdo->prepare('DELETE FROM sessions WHERE token_hash = :hash')
        ->execute(['hash' => api_token_hash($matches[1])]);
}

api_ok(['ok' => true]);
