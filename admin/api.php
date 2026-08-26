<?php
declare(strict_types=1);

/* ============ 后台 AJAX 接口 ============ */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = get_db();
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {

    /* ---------- 登录 ---------- */
    case 'login': {
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        if ($username === '' || $password === '') {
            echo json_encode(['ok' => false, 'msg' => '请输入用户名和密码']);
            break;
        }
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            echo json_encode(['ok' => false, 'msg' => '用户名或密码错误']);
            break;
        }
        $_SESSION['admin_user_id'] = $user['id'];
        echo json_encode(['ok' => true]);
        break;
    }

    /* ---------- 退出 ---------- */
    case 'logout': {
        $_SESSION = [];
        session_destroy();
        echo json_encode(['ok' => true]);
        break;
    }

    /* ---------- 广告列表 ---------- */
    case 'list_ads': {
        if (!is_logged_in()) { echo json_encode(['ok' => false, 'msg' => '未登录']); break; }
        $rows = $pdo->query("SELECT * FROM ads ORDER BY position, sort_order, id")->fetchAll();
        echo json_encode(['ok' => true, 'ads' => $rows]);
        break;
    }

    /* ---------- 新增/编辑广告 ---------- */
    case 'save_ad': {
        if (!is_logged_in()) { echo json_encode(['ok' => false, 'msg' => '未登录']); break; }
        $id          = (int)($_POST['id'] ?? 0);
        $title       = trim($_POST['title'] ?? '');
        $position    = ($_POST['position'] ?? 'left') === 'right' ? 'right' : 'left';
        $type        = ($_POST['type'] ?? 'image') === 'html' ? 'html' : 'image';
        $content     = trim($_POST['content'] ?? '');
        $link_url    = trim($_POST['link_url'] ?? '');
        $sort_order  = (int)($_POST['sort_order'] ?? 0);
        $is_active   = isset($_POST['is_active']) ? 1 : 0;

        if ($title === '' || $content === '') {
            echo json_encode(['ok' => false, 'msg' => '标题和内容不能为空']);
            break;
        }
        if ($id > 0) {
            $stmt = $pdo->prepare("UPDATE ads SET title=?, position=?, type=?, content=?, link_url=?, sort_order=?, is_active=?, updated_at=datetime('now','localtime') WHERE id=?");
            $stmt->execute([$title, $position, $type, $content, $link_url, $sort_order, $is_active, $id]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO ads (title, position, type, content, link_url, sort_order, is_active) VALUES (?,?,?,?,?,?,?)");
            $stmt->execute([$title, $position, $type, $content, $link_url, $sort_order, $is_active]);
            $id = (int)$pdo->lastInsertId();
        }
        echo json_encode(['ok' => true, 'id' => $id]);
        break;
    }

    /* ---------- 删除广告 ---------- */
    case 'delete_ad': {
        if (!is_logged_in()) { echo json_encode(['ok' => false, 'msg' => '未登录']); break; }
        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) { echo json_encode(['ok' => false, 'msg' => '参数错误']); break; }
        $stmt = $pdo->prepare("DELETE FROM ads WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['ok' => true]);
        break;
    }

    /* ---------- 开关广告 ---------- */
    case 'toggle_ad': {
        if (!is_logged_in()) { echo json_encode(['ok' => false, 'msg' => '未登录']); break; }
        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) { echo json_encode(['ok' => false, 'msg' => '参数错误']); break; }
        $pdo->prepare("UPDATE ads SET is_active = 1 - is_active, updated_at=datetime('now','localtime') WHERE id = ?")->execute([$id]);
        echo json_encode(['ok' => true]);
        break;
    }

    /* ---------- 上传广告图片 ---------- */
    case 'upload_image': {
        if (!is_logged_in()) { echo json_encode(['ok' => false, 'msg' => '未登录']); break; }
        $file = $_FILES['image'] ?? null;
        if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['ok' => false, 'msg' => '上传失败']);
            break;
        }
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
        if (!in_array($ext, $allowed, true)) {
            echo json_encode(['ok' => false, 'msg' => '仅支持 png/jpg/gif/webp/svg']);
            break;
        }
        $name = 'ad_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $dest = __DIR__ . '/uploads/' . $name;
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            echo json_encode(['ok' => false, 'msg' => '保存失败']);
            break;
        }
        echo json_encode(['ok' => true, 'path' => 'admin/uploads/' . $name]);
        break;
    }

    /* ---------- 修改密码 ---------- */
    case 'change_password': {
        if (!is_logged_in()) { echo json_encode(['ok' => false, 'msg' => '未登录']); break; }
        $old = $_POST['old_password'] ?? '';
        $new = $_POST['new_password'] ?? '';
        if (strlen($new) < 6) {
            echo json_encode(['ok' => false, 'msg' => '新密码至少6位']);
            break;
        }
        $user = current_user($pdo);
        if (!$user || !password_verify($old, $user['password_hash'])) {
            echo json_encode(['ok' => false, 'msg' => '原密码错误']);
            break;
        }
        $hash = password_hash($new, PASSWORD_DEFAULT);
        $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$hash, $user['id']]);
        echo json_encode(['ok' => true]);
        break;
    }

    default:
        echo json_encode(['ok' => false, 'msg' => '未知操作']);
}
