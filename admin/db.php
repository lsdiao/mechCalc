<?php
declare(strict_types=1);

/* ============ SQLite 数据库连接与建表 ============ */

function get_db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        /* 可通过 ERINSON_DATA_DIR 指定持久化数据目录（挂载 Volume/Disk 时使用） */
        $data_dir = getenv('ERINSON_DATA_DIR');
        if ($data_dir && !is_dir($data_dir)) {
            mkdir($data_dir, 0775, true);
        }
        $db_path = $data_dir ? rtrim($data_dir, '/') . '/data.db' : __DIR__ . '/data.db';
        $pdo = new PDO('sqlite:' . $db_path);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        init_schema($pdo);
    }
    return $pdo;
}

function init_schema(PDO $pdo): void {
    /* 用户表 */
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )");

    /* 广告表 */
    $pdo->exec("CREATE TABLE IF NOT EXISTS ads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        position TEXT NOT NULL DEFAULT 'left',
        type TEXT NOT NULL DEFAULT 'image',
        content TEXT NOT NULL DEFAULT '',
        link_url TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now','localtime')),
        updated_at TEXT DEFAULT (datetime('now','localtime'))
    )");

    /* 首次运行创建默认管理员 */
    $count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($count == 0) {
        $hash = password_hash('E-51888333', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
        $stmt->execute(['admin', $hash]);
    }
}
