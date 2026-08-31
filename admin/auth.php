<?php
declare(strict_types=1);

/* ============ 会话与鉴权 ============ */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function is_logged_in(): bool {
    return !empty($_SESSION['admin_user_id']);
}

function require_login(): void {
    if (!is_logged_in()) {
        header('Location: index.php');
        exit;
    }
}

function current_user(PDO $pdo): ?array {
    if (empty($_SESSION['admin_user_id'])) return null;
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['admin_user_id']]);
    return $stmt->fetch() ?: null;
}
