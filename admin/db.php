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

    /* 轴承型号表（抓取自 c.zcwz.com/param，作为首页查询数据源） */
    $pdo->exec("CREATE TABLE IF NOT EXISTS bearings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cat_name TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL DEFAULT '',
        old_name TEXT NOT NULL DEFAULT '',
        bore TEXT NOT NULL DEFAULT '',
        u_bore TEXT NOT NULL DEFAULT '',
        width TEXT NOT NULL DEFAULT '',
        cr TEXT NOT NULL DEFAULT '',
        cor TEXT NOT NULL DEFAULT '',
        grease_speed TEXT NOT NULL DEFAULT '',
        oil_speed TEXT NOT NULL DEFAULT '',
        weight TEXT NOT NULL DEFAULT ''
    )");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bearings_name ON bearings(name)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bearings_cat ON bearings(cat_name)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bearings_bore ON bearings(bore)");

    /* 首次运行：若轴承表为空，从内置种子数据导入（657 条） */
    $bear_cnt = (int)$pdo->query("SELECT COUNT(*) FROM bearings")->fetchColumn();
    if ($bear_cnt === 0) {
        $seed_file = __DIR__ . '/../data/bearings_seed.json';
        if (is_file($seed_file)) {
            $seed = json_decode((string)file_get_contents($seed_file), true);
            if (is_array($seed) && count($seed)) {
                $ins = $pdo->prepare("INSERT INTO bearings
                    (cat_name, name, old_name, bore, u_bore, width, cr, cor, grease_speed, oil_speed, weight)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?)");
                foreach ($seed as $r) {
                    $ins->execute([
                        $r['cat_name'] ?? '', $r['name'] ?? '', $r['old_name'] ?? '', $r['bore'] ?? '',
                        $r['u_bore'] ?? '', $r['width'] ?? '', $r['cr'] ?? '', $r['cor'] ?? '',
                        $r['grease_speed'] ?? '', $r['oil_speed'] ?? '', $r['weight'] ?? '',
                    ]);
                }
            }
        }
    }

    /* 首次运行创建默认管理员 */
    $count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($count == 0) {
        $hash = password_hash('E-51888333', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
        $stmt->execute(['admin', $hash]);
    }
}
