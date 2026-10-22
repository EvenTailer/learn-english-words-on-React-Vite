<?php
declare(strict_types=1);

/**
 * Синхронизация данных пользователя.
 * GET  — отдать сохранённые данные
 * PUT  — сохранить данные (весь набор разделов)
 */

require __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = api_db();
$user = api_require_user($pdo);
$userId = (int) $user['id'];
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $stored = api_user_payload($pdo, $userId);
    api_ok([
        'payload' => $stored['payload'],
        'updatedAt' => $stored['updatedAt'],
    ]);
}

if ($method === 'PUT' || $method === 'POST') {
    $config = api_config();
    $raw = file_get_contents('php://input') ?: '';
    if (strlen($raw) > (int) $config['max_payload_bytes']) {
        api_fail(413, 'Данные слишком большие');
    }

    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        api_fail(400, 'Некорректный JSON');
    }

    // Разрешены только нужные разделы — лишнее не храним
    $clean = [
        'cards' => is_array($payload['cards'] ?? null) ? $payload['cards'] : [],
        'progress' => is_array($payload['progress'] ?? null) ? $payload['progress'] : [],
        'stats' => is_array($payload['stats'] ?? null) ? $payload['stats'] : [],
        'lists' => is_array($payload['lists'] ?? null) ? $payload['lists'] : [],
        'settings' => is_array($payload['settings'] ?? null) ? $payload['settings'] : [],
    ];

    $updatedAt = api_save_user_payload($pdo, $userId, $clean);
    api_ok(['ok' => true, 'updatedAt' => $updatedAt]);
}

api_fail(405, 'Метод не поддерживается');
