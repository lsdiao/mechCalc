<?php
declare(strict_types=1);

/* ============ 公开广告接口 — 返回首页两侧启用的广告 ============ */

require_once __DIR__ . '/../admin/db.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = get_db();
$rows = $pdo->query("SELECT id, title, position, type, content, link_url, sort_order
                     FROM ads WHERE is_active = 1
                     ORDER BY position, sort_order, id")->fetchAll();

$result = ['left' => [], 'right' => []];
foreach ($rows as $r) {
    $pos = $r['position'];
    if (isset($result[$pos])) $result[$pos][] = $r;
}

echo json_encode($result, JSON_UNESCAPED_UNICODE);
