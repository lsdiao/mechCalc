<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

require_login();

$pdo = get_db();
$user = current_user($pdo);
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>广告管理 - ERINSON</title>
<link rel="icon" type="image/png" href="../assets/logo.png">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;background:#f4f7fa;color:#22313f;font-size:14px;line-height:1.6}
  a{color:#24557f;text-decoration:none}a:hover{color:#d96f0e}
  /* 顶栏 */
  .topbar{background:linear-gradient(135deg,#0d2438,#1a4368);color:#fff;padding:0 24px;height:56px;display:flex;align-items:center;gap:16px;position:sticky;top:0;z-index:50;box-shadow:0 2px 10px rgba(13,36,56,.28)}
  .topbar img{height:28px}
  .topbar .title{font-size:16px;font-weight:700;opacity:.9}
  .topbar .spacer{flex:1}
  .topbar .user{font-size:13px;opacity:.8;margin-right:8px}
  .topbar .btn-logout{color:rgba(255,255,255,.85);font-size:13px;padding:6px 14px;border:1px solid rgba(255,255,255,.25);border-radius:6px;cursor:pointer;background:none}
  .topbar .btn-logout:hover{background:rgba(255,255,255,.12);color:#fff;border-color:#fff}
  /* 布局 */
  .wrap{max-width:1100px;margin:0 auto;padding:24px 20px}
  /* 标签页 */
  .tabs{display:flex;gap:4px;margin-bottom:20px;border-bottom:2px solid #dde5ec}
  .tabs button{background:none;border:none;padding:10px 20px;font-size:14px;font-weight:600;color:#5a6b7b;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s,border-color .15s}
  .tabs button.active{color:#f0821e;border-bottom-color:#f0821e}
  .tab-content{display:none}
  .tab-content.active{display:block}
  /* 工具栏 */
  .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
  .toolbar h2{font-size:18px;color:#123350}
  .btn-add{background:#f0821e;color:#fff;border:none;border-radius:6px;padding:8px 18px;font-size:14px;font-weight:600;cursor:pointer}
  .btn-add:hover{background:#d96f0e}
  /* 表格 */
  .ad-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dde5ec;border-radius:8px;overflow:hidden}
  .ad-table th{background:#f4f7fa;padding:10px 12px;text-align:left;font-size:13px;color:#5a6b7b;font-weight:600;border-bottom:1px solid #dde5ec}
  .ad-table td{padding:10px 12px;border-bottom:1px solid #eef3f7;font-size:13px}
  .ad-table tr:last-child td{border-bottom:none}
  .ad-table tr:hover{background:#f8fbfd}
  .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600}
  .badge.on{background:#e9f8f0;color:#157a45}
  .badge.off{background:#fdecec;color:#b13330}
  .badge.left{background:#e8eef5;color:#1a4368}
  .badge.right{background:#fdf3e7;color:#a35a0a}
  .badge.img{background:#e8eef5;color:#24557f}
  .badge.html{background:#f0e8f5;color:#6b3b8a}
  .act{display:flex;gap:6px}
  .act button{border:1px solid #dde5ec;background:#fff;border-radius:5px;padding:4px 10px;font-size:12px;cursor:pointer;color:#5a6b7b}
  .act button:hover{border-color:#f0821e;color:#f0821e}
  .act button.del:hover{border-color:#d64541;color:#d64541}
  .empty{text-align:center;padding:40px;color:#94a3b0;font-size:14px}
  /* 弹窗 */
  .modal{display:none;position:fixed;inset:0;background:rgba(13,36,56,.45);z-index:100;justify-content:center;align-items:center}
  .modal.show{display:flex}
  .modal-box{background:#fff;border-radius:10px;width:500px;max-width:92vw;max-height:88vh;overflow-y:auto;box-shadow:0 12px 40px rgba(13,36,56,.2)}
  .modal-head{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #dde5ec}
  .modal-head h3{font-size:16px;color:#123350}
  .modal-head .close{background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b0;padding:0 4px}
  .modal-body{padding:20px}
  .form-row{margin-bottom:16px}
  .form-row label{display:block;font-size:13px;color:#5a6b7b;margin-bottom:6px;font-weight:600}
  .form-row input[type=text],.form-row input[type=number],.form-row select,.form-row textarea{width:100%;border:1px solid #dde5ec;border-radius:6px;padding:8px 10px;font-size:14px;outline:none;font-family:inherit}
  .form-row input:focus,.form-row select:focus,.form-row textarea:focus{border-color:#f0821e;box-shadow:0 0 0 3px rgba(240,130,30,.15)}
  .form-row textarea{min-height:80px;resize:vertical;font-family:Consolas,monospace;font-size:13px}
  .form-row select{cursor:pointer}
  .form-row .hint{font-size:12px;color:#94a3b0;margin-top:4px}
  .checkbox-row{display:flex;align-items:center;gap:8px}
  .checkbox-row input{width:16px;height:16px;cursor:pointer}
  .upload-area{display:flex;gap:10px;align-items:center}
  .upload-area img{height:50px;border:1px solid #dde5ec;border-radius:4px}
  .modal-foot{display:flex;justify-content:flex-end;gap:10px;padding:0 20px 20px}
  .btn-save{background:#f0821e;color:#fff;border:none;border-radius:6px;padding:8px 22px;font-size:14px;font-weight:600;cursor:pointer}
  .btn-save:hover{background:#d96f0e}
  .btn-cancel{background:#fff;color:#5a6b7b;border:1px solid #dde5ec;border-radius:6px;padding:8px 18px;font-size:14px;cursor:pointer}
  /* 改密表单 */
  .pw-box{background:#fff;border:1px solid #dde5ec;border-radius:8px;padding:24px;max-width:360px}
  .pw-box .form-row input{width:100%}
  .pw-msg{font-size:13px;margin-top:8px;min-height:18px}
  .pw-msg.ok{color:#157a45}.pw-msg.err{color:#d64541}
  /* 响应式 */
  @media(max-width:640px){
    .ad-table{font-size:12px}.ad-table th,.ad-table td{padding:8px 6px}
    .wrap{padding:16px 12px}.topbar{padding:0 14px}
  }
</style>
</head>
<body>

<div class="topbar">
  <img src="../assets/logo.png" alt="ERINSON">
  <span class="title">广告管理后台</span>
  <div class="spacer"></div>
  <span class="user"><?= htmlspecialchars($user['username'] ?? '') ?></span>
  <button class="btn-logout" onclick="location.href=location.pathname.replace(/[^\/]*$/,'')+'logout.php'">退出</button>
</div>

<div class="wrap">
  <div class="tabs">
    <button class="active" data-tab="ads" onclick="switchTab('ads')">广告管理</button>
    <button data-tab="pw" onclick="switchTab('pw')">修改密码</button>
  </div>

  <!-- 广告管理 -->
  <div id="tab-ads" class="tab-content active">
    <div class="toolbar">
      <h2>广告列表</h2>
      <button class="btn-add" onclick="openModal()">+ 新增广告</button>
    </div>
    <table class="ad-table">
      <thead><tr>
        <th>排序</th><th>标题</th><th>位置</th><th>类型</th><th>状态</th><th>操作</th>
      </tr></thead>
      <tbody id="adList"></tbody>
    </table>
  </div>

  <!-- 修改密码 -->
  <div id="tab-pw" class="tab-content">
    <div class="pw-box">
      <div class="form-row">
        <label>原密码</label>
        <input type="password" id="oldPw">
      </div>
      <div class="form-row">
        <label>新密码（至少6位）</label>
        <input type="password" id="newPw">
      </div>
      <button class="btn-save" onclick="changePassword()">保存</button>
      <div class="pw-msg" id="pwMsg"></div>
    </div>
  </div>
</div>

<!-- 新增/编辑弹窗 -->
<div class="modal" id="modal">
  <div class="modal-box">
    <div class="modal-head">
      <h3 id="modalTitle">新增广告</h3>
      <button class="close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="adId" value="0">
      <div class="form-row">
        <label>广告标题（内部标识）</label>
        <input type="text" id="adTitle" placeholder="如：左侧横幅1">
      </div>
      <div class="form-row">
        <label>位置</label>
        <select id="adPosition">
          <option value="left">左侧</option>
          <option value="right">右侧</option>
        </select>
      </div>
      <div class="form-row">
        <label>类型</label>
        <select id="adType" onchange="toggleAdType()">
          <option value="image">图片广告</option>
          <option value="html">HTML 代码</option>
        </select>
      </div>
      <div class="form-row" id="imageRow">
        <label>广告图片</label>
        <div class="upload-area">
          <img id="adPreview" src="" style="display:none">
          <input type="file" id="adFile" accept="image/*" onchange="uploadImage(this)">
          <span id="adPath" style="font-size:12px;color:#94a3b0"></span>
        </div>
        <div class="hint">上传图片或填写已有路径</div>
        <input type="text" id="adContentImg" placeholder="或手动填写图片路径" style="margin-top:6px" oninput="document.getElementById('adPath').textContent=this.value;document.getElementById('adPreview').src=this.value;document.getElementById('adPreview').style.display=this.value?'inline':'none'">
      </div>
      <div class="form-row" id="htmlRow" style="display:none">
        <label>HTML 代码</label>
        <textarea id="adContentHtml" placeholder="粘贴广告 HTML / 脚本代码"></textarea>
      </div>
      <div class="form-row">
        <label>链接地址（仅图片广告有效）</label>
        <input type="text" id="adLink" placeholder="https://...">
      </div>
      <div class="form-row">
        <label>排序（数字越小越靠前）</label>
        <input type="number" id="adSort" value="0">
      </div>
      <div class="form-row">
        <div class="checkbox-row">
          <input type="checkbox" id="adActive" checked>
          <label for="adActive" style="margin:0;cursor:pointer">启用</label>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeModal()">取消</button>
      <button class="btn-save" onclick="saveAd()">保存</button>
    </div>
  </div>
</div>

<script>
/* API 绝对路径：无论 /admin 还是 /admin/ 都指向 /admin/api.php */
var API_URL = location.pathname.replace(/[^\/]*$/, '') + 'api.php';

/* ============ 标签切换 ============ */
function switchTab(t){
  document.querySelectorAll('.tabs button').forEach(function(b){b.classList.toggle('active',b.dataset.tab===t)});
  document.querySelectorAll('.tab-content').forEach(function(c){c.classList.toggle('active',c.id==='tab-'+t)});
  if(t==='ads') loadAds();
}

/* ============ 广告列表 ============ */
function loadAds(){
  var fd=new FormData();fd.append('action','list_ads');
  fetch(API_URL,{method:'POST',body:fd}).then(function(r){return r.json()}).then(function(d){
    var tb=document.getElementById('adList');
    if(!d.ok||!d.ads.length){tb.innerHTML='<tr><td colspan="6" class="empty">暂无广告，点击「新增广告」添加</td></tr>';return;}
    tb.innerHTML=d.ads.map(function(a){
      return '<tr>'+
        '<td>'+a.sort_order+'</td>'+
        '<td>'+esc(a.title)+'</td>'+
        '<td><span class="badge '+a.position+'">'+(a.position==='left'?'左侧':'右侧')+'</span></td>'+
        '<td><span class="badge '+(a.type==='image'?'img':'html')+'">'+(a.type==='image'?'图片':'HTML')+'</span></td>'+
        '<td><span class="badge '+(a.is_active==1?'on':'off')+'">'+(a.is_active==1?'启用':'停用')+'</span></td>'+
        '<td><div class="act">'+
          '<button onclick="toggleAd('+a.id+')">'+(a.is_active==1?'停用':'启用')+'</button>'+
          '<button onclick="editAd('+JSON.stringify(a).replace(/"/g,'&#34;').replace(/'/g,"&#39;")+')">编辑</button>'+
          '<button class="del" onclick="deleteAd('+a.id+')">删除</button>'+
        '</div></td>'+
      '</tr>';
    }).join('');
  }).catch(function(){document.getElementById('adList').innerHTML='<tr><td colspan="6" class="empty">加载失败</td></tr>';});
}

/* ============ 弹窗 ============ */
function openModal(ad){
  ad=ad||{};
  document.getElementById('modalTitle').textContent=ad.id?'编辑广告':'新增广告';
  document.getElementById('adId').value=ad.id||0;
  document.getElementById('adTitle').value=ad.title||'';
  document.getElementById('adPosition').value=ad.position||'left';
  document.getElementById('adType').value=ad.type||'image';
  document.getElementById('adLink').value=ad.link_url||'';
  document.getElementById('adSort').value=ad.sort_order||0;
  document.getElementById('adActive').checked=ad.is_active==null?true:(ad.is_active==1);
  /* 图片类型 */
  var imgPath=ad.type==='image'?ad.content:'';
  document.getElementById('adContentImg').value=imgPath||'';
  document.getElementById('adPath').textContent=imgPath||'';
  var prev=document.getElementById('adPreview');
  prev.src=imgPath||'';prev.style.display=imgPath?'inline':'none';
  /* HTML 类型 */
  document.getElementById('adContentHtml').value=ad.type==='html'?ad.content:'';
  document.getElementById('adFile').value='';
  toggleAdType();
  document.getElementById('modal').classList.add('show');
}
function closeModal(){document.getElementById('modal').classList.remove('show');}

function toggleAdType(){
  var type=document.getElementById('adType').value;
  document.getElementById('imageRow').style.display=type==='image'?'block':'none';
  document.getElementById('htmlRow').style.display=type==='html'?'block':'none';
}

/* ============ 上传图片 ============ */
function uploadImage(input){
  var file=input.files[0];if(!file)return;
  var fd=new FormData();fd.append('action','upload_image');fd.append('image',file);
  var pathEl=document.getElementById('adPath');
  var prev=document.getElementById('adPreview');
  pathEl.textContent='上传中...';
  fetch(API_URL,{method:'POST',body:fd}).then(function(r){return r.json()}).then(function(d){
    if(d.ok){
      pathEl.textContent=d.path;
      document.getElementById('adContentImg').value=d.path;
      prev.src=d.path;prev.style.display='inline';
    }else{pathEl.textContent='';alert(d.msg||'上传失败');}
  }).catch(function(){pathEl.textContent='';alert('网络错误');});
}

/* ============ 保存广告 ============ */
function saveAd(){
  var type=document.getElementById('adType').value;
  var content=type==='image'?document.getElementById('adContentImg').value:document.getElementById('adContentHtml').value;
  var fd=new FormData();
  fd.append('action','save_ad');
  fd.append('id',document.getElementById('adId').value);
  fd.append('title',document.getElementById('adTitle').value);
  fd.append('position',document.getElementById('adPosition').value);
  fd.append('type',type);
  fd.append('content',content);
  fd.append('link_url',document.getElementById('adLink').value);
  fd.append('sort_order',document.getElementById('adSort').value);
  fd.append('is_active',document.getElementById('adActive').checked?'1':'');
  fetch(API_URL,{method:'POST',body:fd}).then(function(r){return r.json()}).then(function(d){
    if(d.ok){closeModal();loadAds();}
    else{alert(d.msg||'保存失败');}
  }).catch(function(){alert('网络错误');});
}

/* ============ 编辑广告 ============ */
function editAd(a){openModal(a);}

/* ============ 删除广告 ============ */
function deleteAd(id){
  if(!confirm('确定删除此广告？'))return;
  var fd=new FormData();fd.append('action','delete_ad');fd.append('id',id);
  fetch(API_URL,{method:'POST',body:fd}).then(function(r){return r.json()}).then(function(d){
    if(d.ok)loadAds();else alert(d.msg||'删除失败');
  }).catch(function(){alert('网络错误');});
}

/* ============ 开关广告 ============ */
function toggleAd(id){
  var fd=new FormData();fd.append('action','toggle_ad');fd.append('id',id);
  fetch(API_URL,{method:'POST',body:fd}).then(function(r){return r.json()}).then(function(d){
    if(d.ok)loadAds();else alert(d.msg||'操作失败');
  }).catch(function(){alert('网络错误');});
}

/* ============ 修改密码 ============ */
function changePassword(){
  var fd=new FormData();
  fd.append('action','change_password');
  fd.append('old_password',document.getElementById('oldPw').value);
  fd.append('new_password',document.getElementById('newPw').value);
  var msg=document.getElementById('pwMsg');msg.className='pw-msg';msg.textContent='';
  fetch(API_URL,{method:'POST',body:fd}).then(function(r){return r.json()}).then(function(d){
    msg.className='pw-msg '+(d.ok?'ok':'err');
    msg.textContent=d.ok?'密码修改成功':(d.msg||'修改失败');
    if(d.ok){document.getElementById('oldPw').value='';document.getElementById('newPw').value='';}
  }).catch(function(){msg.className='pw-msg err';msg.textContent='网络错误';});
}

/* ============ 工具函数 ============ */
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* 初始化 */
loadAds();
document.getElementById('modal').addEventListener('click',function(e){if(e.target===this)closeModal();});
</script>
</body>
</html>
