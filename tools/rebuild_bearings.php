<?php
/* 一次性：清空 bearings 表并按最新种子数据重新灌入（保留 users/ads）。
 * 运行：php tools/rebuild_bearings.php
 */
declare(strict_types=1);
require __DIR__ . '/../admin/db.php';

$seed_file = __DIR__ . '/../data/bearings_seed.json';
if (!is_file($seed_file)) { fwrite(STDERR, "缺 seed 文件\n"); exit(1); }
$seed = json_decode((string)file_get_contents($seed_file), true);
if (!is_array($seed) || !count($seed)) { fwrite(STDERR, "seed 无效\n"); exit(1); }

$pdo = get_db();
$pdo->exec('DELETE FROM bearings');
$ins = $pdo->prepare("INSERT INTO bearings
    (cat_name, name, old_name, bore, u_bore, width, cr, cor, grease_speed, oil_speed, weight)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)");
$pdo->beginTransaction();
foreach ($seed as $r) {
    $ins->execute([
        $r['cat_name'] ?? '', $r['name'] ?? '', $r['old_name'] ?? '', $r['bore'] ?? '',
        $r['u_bore'] ?? '', $r['width'] ?? '', $r['cr'] ?? '', $r['cor'] ?? '',
        $r['grease_speed'] ?? '', $r['oil_speed'] ?? '', $r['weight'] ?? '',
    ]);
}
$pdo->commit();
$cnt = (int)$pdo->query('SELECT COUNT(*) FROM bearings')->fetchColumn();
$cats = (int)$pdo->query('SELECT COUNT(DISTINCT cat_name) FROM bearings')->fetchColumn();
echo "重建完成：{$cnt} 条 / {$cats} 个分类\n";