/* =========================================================
 * 轴承型号查询表（独立工具页）
 * 数据源：api/bearings.php（SQLite 抓取自 c.zcwz.com/param）
 * 入口：首页卡片 -> #/tool/bearing-query；支持 类型/型号/内径 筛选 + 分页
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

  var xhrSeq = 0; /* 序号：仅当最新一次请求时才允许渲染，避免旧请求回写覆盖新数据 */
  function load(retries) {
    var box = document.getElementById('bearingBox');
    if (!box) return;
    /* 中止上一次尚未完成的请求，避免叠加（单线程开发服务器下可显著降低偶发失败） */
    if (state._xhr) { try { state._xhr.abort(); } catch (e) { /* noop */ } }
    if (retries === undefined) retries = 0;
    box.classList.add('loading');
    var xhr = new XMLHttpRequest();
    state._xhr = xhr;
    var my = ++xhrSeq;
    xhr.open('GET', API + '?' + qs(), true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (state._xhr === xhr) state._xhr = null;
      box.classList.remove('loading');
      if (xhr.status === 200) {
        if (my !== xhrSeq) return; /* 已有更新的请求，丢弃本次结果 */
        try { render(JSON.parse(xhr.responseText)); } catch (e) { box.innerHTML = '<div class="bk-err">数据加载失败</div>'; }
      } else {
        /* 单线程本地开发服务器偶发连接失败：最多重试 3 次，间隔递增 */
        if (retries < 3) { setTimeout(function () { load(retries + 1); }, 300 * (retries + 1)); }
        else { box.innerHTML = '<div class="bk-err">轴承数据接口不可用（需 PHP 环境，或请求过于频繁）</div>'; }
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

  /* 注册为独立计算工具：#/tool/bearing-query */
  window.App.registerTool({
    id: 'bearing-query',
    name: '轴承型号查询',
    category: 'common',
    keywords: '轴承 型号 查询 国产 GB 深沟球 圆锥滚子 推力球 内径 外径 参数',
    brief: '轴承型号与参数查询表（国产GB版），支持按类型、型号、内径范围筛选（数据源 c.zcwz.com）。',
    doc: '国产(GB)版轴承型号查询表。数据抓取自 c.zcwz.com/param，覆盖 44 类、数百种轴承型号，提供类型 / 型号（含新旧型号）/ 内径范围筛选与分页。',
    render: function (main, cat, setTitle) {
      if (typeof setTitle === 'function') setTitle('bearing-query');
      main.innerHTML =
        '<div class="crumb"><a href="#/">首页</a> / <a href="#/cat/common">工程常用</a> / 轴承型号查询</div>' +
        '<div class="tool-page">' +
        '  <div class="tool-head"><h1>轴承型号查询</h1></div>' +
        '  <div class="tool-body">' +
        '    <div class="panel"><div class="panel-title">数据说明</div><div class="panel-content">覆盖 44 类轴承、数百种型号的参数（内径、外径、宽度、额定动/静载荷、脂/油润滑转速、重量）。每次重新部署时若数据库为空会自动导入内置种子数据。正式选型请以相关国家标准与厂商样本为准。</div></div>' +
        '    <div id="bearingBox" class="bk-box"></div>' +
        '  </div>' +
        '</div>';
      load();
    }
  });
})();