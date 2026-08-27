/* =========================================================
 * 轴承型号查询表（首页区块）
 * 数据源：api/bearings.php（SQLite 抓取自 c.zcwz.com/param）
 * 支持按 类型 / 型号关键字 / 内径范围 筛选 + 分页
 * ========================================================= */
(function () {
  'use strict';
  var API = 'api/bearings.php';
  var state = { page: 1, limit: 15, cat: '', q: '', bore_min: '', bore_max: '' };

  var KEYMAP = {
    cat_name: '类型', name: '新型号', old_name: '旧型号', bore: '内径',
    u_bore: '外径', width: '宽度', cr: 'Cr(kN)', cor: 'Cor(kN)',
    grease_speed: '脂润滑转速', oil_speed: '油润滑转速', weight: '重量(kg)'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function qs() {
    var p = new URLSearchParams();
    p.set('page', state.page);
    p.set('limit', state.limit);
    if (state.cat) p.set('cat', state.cat);
    if (state.q) p.set('q', state.q);
    if (state.bore_min !== '') p.set('bore_min', state.bore_min);
    if (state.bore_max !== '') p.set('bore_max', state.bore_max);
    return p.toString();
  }

  function fadeIn() { return ''; }

  function load(retried) {
    var box = document.getElementById('bearingBox');
    if (!box) return;
    box.classList.add('loading');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', API + '?' + qs(), true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      box.classList.remove('loading');
      if (xhr.status === 200) {
        try { render(JSON.parse(xhr.responseText)); } catch (e) { box.innerHTML = '<div class="bk-err">数据加载失败</div>'; }
      } else {
        /* 单线程本地开发服务器偶发连接失败时自动重试一次 */
        if (!retried) { setTimeout(function () { load(true); }, 400); }
        else { box.innerHTML = '<div class="bk-err">轴承数据接口不可用（需 PHP 环境）</div>'; }
      }
    };
    xhr.send();
  }

  function render(d) {
    var box = document.getElementById('bearingBox');
    if (!box) return;
    var cats = (d.cats || []).map(function (c) {
      return '<option value="' + esc(c.cat_name) + '"' + (state.cat === c.cat_name ? ' selected' : '') + '>' + esc(c.cat_name) + '（' + c.cnt + '）</option>';
    }).join('');
    var rows = (d.rows || []).map(function (r) {
      return '<tr>' + ['cat_name', 'name', 'old_name', 'bore', 'u_bore', 'width', 'cr', 'cor', 'grease_speed', 'oil_speed', 'weight']
        .map(function (k) { return '<td>' + esc(r[k] || '-') + '</td>'; }).join('') + '</tr>';
    }).join('');
    var totalPages = Math.max(1, Math.ceil((d.total || 0) / state.limit));
    var tbody = rows || '<tr><td colspan="11" class="bk-empty">没有匹配的轴承型号</td></tr>';

    box.innerHTML =
      '<div class="bk-filter">' +
        '<select id="bkCat">' +
          '<option value="">全部类型</option>' + cats +
        '</select>' +
        '<input id="bkQ" type="text" placeholder="型号/旧型号搜索…" value="' + esc(state.q) + '">' +
        '<input id="bkBmin" type="number" step="1" min="0" placeholder="内径 ≥" value="' + esc(state.bore_min) + '">' +
        '<input id="bkBmax" type="number" step="1" min="0" placeholder="内径 ≤" value="' + esc(state.bore_max) + '">' +
        '<button id="bkSearch">查询</button>' +
        '<button id="bkReset">重置</button>' +
        '<span class="bk-count">共 <b>' + (d.total || 0) + '</b> 条</span>' +
      '</div>' +
      '<div class="bk-table-wrap"><table class="bk-table"><thead><tr>' +
        Object.keys(KEYMAP).map(function (k) { return '<th>' + KEYMAP[k] + '</th>'; }).join('') +
      '</tr></thead><tbody id="bkTbody">' + tbody + '</tbody></table></div>' +
      '<div class="bk-pager">' +
        '<button id="bkPrev" ' + (state.page <= 1 ? 'disabled' : '') + '>上一页</button>' +
        '<span class="bk-page">' + state.page + ' / ' + totalPages + ' 页</span>' +
        '<button id="bkNext" ' + (state.page >= totalPages ? 'disabled' : '') + '>下一页</button>' +
      '</div>';

    /* 绑定事件 */
    var catEl = box.querySelector('#bkCat');
    catEl.addEventListener('change', function () { state.cat = catEl.value; state.page = 1; load(); });
    box.querySelector('#bkSearch').addEventListener('click', function () { applyQ(); });
    box.querySelector('#bkQ').addEventListener('keydown', function (e) { if (e.key === 'Enter') applyQ(); });
    box.querySelector('#bkReset').addEventListener('click', function () {
      state.q = ''; state.bore_min = ''; state.bore_max = ''; state.page = 1;
      load();
    });
    box.querySelector('#bkPrev').addEventListener('click', function () { if (state.page > 1) { state.page--; load(); } });
    box.querySelector('#bkNext').addEventListener('click', function () { if (state.page < totalPages) { state.page++; load(); } });

    function applyQ() {
      state.q = box.querySelector('#bkQ').value.trim();
      state.bore_min = box.querySelector('#bkBmin').value.trim();
      state.bore_max = box.querySelector('#bkBmax').value.trim();
      state.page = 1;
      load();
    }
  }

  /* 由主框架在首页渲染后调用 */
  window.BearingsTable = {
    mount: function (container) {
      container.innerHTML =
        '<div class="bk-head"><h2>轴承型号查询</h2><span class="bk-desc">国产(GB)版 — 数据抓取自 c.zcwz.com，支持类型 / 型号 / 内径范围筛选</span><div class="cat-line"></div></div>' +
        '<div id="bearingBox" class="bk-box"></div>';
      load();
    }
  };
})();