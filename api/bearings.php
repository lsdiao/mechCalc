<?php
declare(strict_types=1);

/* ============ 公开轴承型号表接口 — 支持筛选 ============ */

require_once __DIR__ . '/../admin/db.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = get_db();

/* 读取筛选参数（GET） */
$cat        = trim($_GET['cat'] ?? '');        // 轴承类型
$q          = trim($_GET['q'] ?? '');          // 型号关键字（模糊，支持新/旧型号）
$bore_min   = $_GET['bore_min'] ?? '';         // 内径范围
$bore_max   = $_GET['bore_max'] ?? '';
$total_only = isset($_GET['total']) ? 1 : 0;   // 只返回总数
$page       = max(1, (int)($_GET['page'] ?? 1));
$limit      = min(100, max(1, (int)($_GET['limit'] ?? 20)));
$offset     = ($page - 1) * $limit;

$where = [];
$params = [];

if ($cat !== '') {
    $where[] = 'cat_name = ?';
    $params[] = $cat;
}
if ($q !== '') {
    $where[] = '(name LIKE ? OR old_name LIKE ?)';
    $params[] = '%' . $q . '%';
    $params[] = '%' . $q . '%';
}
if ($bore_min !== '' && is_numeric($bore_min)) {
    $where[] = 'CAST(bore AS REAL) >= ?';
    $params[] = (float)$bore_min;
}
if ($bore_max !== '' && is_numeric($bore_max)) {
    $where[] = 'CAST(bore AS REAL) <= ?';
    $params[] = (float)$bore_max;
}

$where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

/* 总数 */
$stmt = $pdo->prepare("SELECT COUNT(*) FROM bearings $where_sql");
$stmt->execute($params);
$total = (int)$stmt->fetchColumn();

if ($total_only) {
    echo json_encode(['total' => $total]);
    exit;
}

/* 分类列表（用于筛选项） */
$cats = $pdo->query("SELECT cat_name, COUNT(*) AS cnt FROM bearings GROUP BY cat_name ORDER BY cnt DESC")
    ->fetchAll(PDO::FETCH_ASSOC);

/* 数据分页 */
$stmt = $pdo->prepare("SELECT * FROM bearings $where_sql ORDER BY CAST(bore AS REAL), name LIMIT $limit OFFSET $offset");
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'cats' => $cats,
    'total' => $total,
    'page' => $page,
    'limit' => $limit,
    'rows' => $rows,
], JSON_UNESCAPED_UNICODE);