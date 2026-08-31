<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

/* 已登录直接跳转 */
if (is_logged_in()) {
    header('Location: dashboard.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>登录 - 广告管理后台</title>
<link rel="icon" type="image/png" href="../assets/logo.png">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:"PingFang SC","Microsoft YaHei",sans-serif; background:#f4f7fa; color:#22313f; display:flex; justify-content:center; align-items:center; min-height:100vh; }
  .login-box { background:#fff; border:1px solid #dde5ec; border-radius:12px; padding:36px 34px; width:340px; box-shadow:0 8px 30px rgba(13,36,56,.10); }
  .login-box h1 { text-align:center; font-size:20px; margin-bottom:6px; color:#123350; }
  .login-box .sub { text-align:center; font-size:13px; color:#94a3b0; margin-bottom:24px; }
  .login-box img { display:block; margin:0 auto 16px; height:32px; }
  .field { margin-bottom:16px; }
  .field label { display:block; font-size:13px; color:#5a6b7b; margin-bottom:6px; font-weight:600; }
  .field input { width:100%; height:40px; border:1px solid #dde5ec; border-radius:8px; padding:0 12px; font-size:14px; outline:none; transition:border-color .15s,box-shadow .15s; }
  .field input:focus { border-color:#f0821e; box-shadow:0 0 0 3px rgba(240,130,30,.15); }
  .btn-login { width:100%; height:42px; background:#f0821e; color:#fff; border:none; border-radius:8px; font-size:15px; font-weight:700; cursor:pointer; transition:background .15s; }
  .btn-login:hover { background:#d96f0e; }
  .msg { color:#d64541; font-size:13px; text-align:center; margin-bottom:12px; min-height:18px; }
</style>
</head>
<body>
<div class="login-box">
  <img src="../assets/logo.png" alt="ERINSON">
  <h1>广告管理后台</h1>
  <p class="sub">ERINSON 机械设计计算工具箱</p>
  <div class="msg" id="msg"></div>
  <form id="loginForm">
    <div class="field">
      <label>用户名</label>
      <input type="text" id="username" autocomplete="off" required>
    </div>
    <div class="field">
      <label>密码</label>
      <input type="password" id="password" required>
    </div>
    <button type="submit" class="btn-login">登 录</button>
  </form>
</div>
<script>
/* API 绝对路径：无论 /admin 还是 /admin/ 都指向 /admin/api.php */
var API_URL = location.pathname.replace(/[^\/]*$/, '') + 'api.php';
document.getElementById('loginForm').addEventListener('submit', function(e){
  e.preventDefault();
  var msgEl = document.getElementById('msg');
  msgEl.textContent = '';
  var fd = new FormData();
  fd.append('action','login');
  fd.append('username', document.getElementById('username').value);
  fd.append('password', document.getElementById('password').value);
  fetch(API_URL, {method:'POST', body:fd})
    .then(function(r){return r.json()})
    .then(function(d){
      if (d.ok) { window.location.href = location.pathname.replace(/[^\/]*$/, '') + 'dashboard.php'; }
      else { msgEl.textContent = d.msg || '登录失败'; }
    })
    .catch(function(){ msgEl.textContent = '网络错误'; });
});
</script>
</body>
</html>
