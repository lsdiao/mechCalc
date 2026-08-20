/* =========================================================
 * MechCalc 核心框架
 * - 工具注册表（每工具一个自包含对象，便于后续扩展新工具）
 * - Hash 路由：#/ 首页  #/cat/<分类>  #/tool/<工具id>
 * - 声明式表单渲染 + 实时计算引擎
 * ========================================================= */
window.App = (function () {
  'use strict';

  var TOOLS = [];
  var CATEGORIES = [
    { id: 'connect', name: '连接与校核', desc: '螺栓、键、花键连接强度校核与弹簧设计' },
    { id: 'linear', name: '直线运动', desc: '直线轴承、直线导轨、滚珠丝杆、拖链' },
    { id: 'trans', name: '机械传动', desc: '带传动、链传动、齿轮传动设计计算' },
    { id: 'fluid', name: '液压与气压', desc: '液压油缸、气缸、液压泵、耗气量计算' },
    { id: 'select', name: '选型计算', desc: '电机（减速机）、缓冲器等选型计算' },
    { id: 'common', name: '工程常用', desc: '公差配合、硬度换算、材料重量、转动惯量' }
  ];

  /* 二级子菜单分组：分类 → 分组标题 → 工具id列表（按展示顺序）。
   * 参照 mechtool.cn 菜单分布（如 工程常用 → 公差与配合查询 → 公差查询/配合查询）。 */
  var SUBMENUS = {
    connect: [
      { t: '螺栓连接', tools: ['bolt-loose', 'bolt-reamed', 'bolt-transverse', 'bolt-check', 'bolt-dynamic'] },
      { t: '键与花键连接', tools: ['key-check', 'key-half', 'key-wedge', 'key-tangent', 'key-spline-rect', 'key-spline-inv'] },
      { t: '弹簧设计', tools: ['spring-design'] }
    ],
    linear: [
      { t: '轴承与丝杆', tools: ['linear-bearing', 'ball-screw'] },
      { t: '拖链', tools: ['cable-chain'] }
    ],
    trans: [
      { t: '带传动', tools: ['v-belt', 'timing-belt-design', 'flat-belt-design', 'multi-ribbed-belt'] },
      { t: '链传动', tools: ['chain-drive-design'] },
      { t: '齿轮传动', tools: ['involute-gear', 'worm-drive-design'] },
      { t: '凸轮机构', tools: ['cam-indexer-design'] }
    ],
    fluid: [
      { t: '液压', tools: ['hydraulic-cylinder'] },
      { t: '气压', tools: ['pneumatic-cylinder'] }
    ],
    select: [
      { t: '电机与减速机', tools: ['motor-select'] }
    ],
    common: [
      { t: '公差与配合查询', tools: ['tolerance-query', 'tolerance-fit-query'] },
      { t: '形状与位置公差', tools: ['shape-tolerance', 'position-tolerance'] },
      { t: '硬度与材料', tools: ['hardness-convert', 'steel-weight'] },
      { t: '转动惯量', tools: ['moment-inertia'] }
    ]
  };

  /* ---------- 注册 ---------- */
  function registerTool(tool) {
    if (!tool || !tool.id || !tool.compute) return;
    TOOLS.push(tool);
  }
  function getTool(id) {
    for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].id === id) return TOOLS[i];
    return null;
  }
  function toolsOf(cat) {
    return TOOLS.filter(function (t) { return t.category === cat; });
  }

  /* ---------- 工具函数 ---------- */
  function fmt(v, d) {
    if (v === null || v === undefined || v === '' || isNaN(v)) return '--';
    if (!isFinite(v)) return '∞';
    if (d === undefined) {
      var a = Math.abs(v);
      if (a >= 100000) d = 0; else if (a >= 100) d = 1; else if (a >= 1) d = 2; else if (a >= 0.01) d = 4; else d = 6;
    }
    var s = Number(v).toFixed(d);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 键盘（公差带/优先配合） ---------- */
  function keypadHTML(f) {
    var cols = f.cols || 18;
    var head;
    if (f.groups) {
      head = '<th class="kb-th-grade">' + esc(f.rowLabel || '') + '</th>' +
        f.groups.map(function (g) { return '<th class="kb-th-group" colspan="' + g.span + '">' + esc(g.t) + '</th>'; }).join('');
    } else {
      head = '<th class="kb-th-grade">' + esc(f.rowLabel || '') + '</th><th colspan="' + cols + '">' + esc(f.colLabel || '') + '</th>';
    }
    var body = f.rows.map(function (r) {
      var html = '<tr>';
      if (r.label) html += '<td class="kb-td-grade"' + (r.span > 1 ? ' rowspan="' + r.span + '"' : '') + '>' + esc(r.label) + '</td>';
      var byCol = {};
      r.cells.forEach(function (c) { byCol[c.c] = c; });
      for (var col = 1; col <= cols; col++) {
        var c = byCol[col];
        html += c
          ? '<td><button type="button" class="kb-btn kb-' + (c.cls === 'B' ? 'blue' : 'yellow') + '" data-set="' + esc(JSON.stringify(c.set)) + '">' + esc(c.t) + '</button></td>'
          : '<td class="kb-empty"></td>';
      }
      return html + '</tr>';
    }).join('');
    var legend = (f.legend || []).map(function (l) {
      return '<span class="kb-leg"><i class="kb-leg-dot ' + esc(l.cls) + '"></i>' + esc(l.t) + '</span>';
    }).join('');
    return '<div class="kb-panel" data-targets="' + esc(JSON.stringify(f.targets || {})) + '">' +
      '<div class="kb-head"><span>' + esc(f.title || '') + '</span><i class="kb-arrow"></i></div>' +
      '<div class="kb-body"><div class="kb-scroll"><table class="kb-table"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>' +
      (legend ? '<div class="kb-legend">' + legend + '</div>' : '') + '</div></div>';
  }

  /* ---------- 表单渲染 ---------- */
  function fieldHTML(f) {
    if (f.type === 'keypad') {
      return '<div class="field field-keypad" data-key="' + esc(f.key) + '">' + keypadHTML(f) + '</div>';
    }
    var html = '<div class="field" data-key="' + esc(f.key) + '">';
    html += '<label>' + f.label + (f.unit ? ' <span class="unit-note">(' + esc(f.unit) + ')</span>' : '') + '</label>';
    if (f.type === 'select') {
      html += '<select data-key="' + esc(f.key) + '">';
      (f.options || []).forEach(function (o) {
        var sel = (f.default !== undefined && String(o.v) === String(f.default)) ? ' selected' : '';
        html += '<option value="' + esc(o.v) + '"' + sel + '>' + esc(o.t) + '</option>';
      });
      html += '</select>';
    } else if (f.type === 'segment') {
      html += '<div class="seg-group"' + (f.cols ? ' data-cols="' + esc(f.cols) + '"' : '') + '>';
      (f.options || []).forEach(function (o, i) {
        html += '<label class="' + (i === 0 ? 'on' : '') + '"><input type="radio" name="seg_' + esc(f.key) +
          '" value="' + esc(o.v) + '" data-key="' + esc(f.key) + '"' + (i === 0 ? ' checked' : '') + '>' + esc(o.t) + '</label>';
      });
      html += '</div>';
    } else {
      var type = f.type === 'text' ? 'text' : 'number';
      html += '<input type="' + type + '" data-key="' + esc(f.key) + '" value="' + esc(f.default !== undefined ? f.default : '') + '"' +
        (f.step ? ' step="' + esc(f.step) + '"' : '') + ' placeholder="' + esc(f.placeholder || '') + '">';
    }
    if (f.hint) html += '<div class="hint">' + f.hint + '</div>';
    html += '</div>';
    return html;
  }

  function collectValues(container) {
    var vals = {};
    var seenSeg = {};
    container.querySelectorAll('select[data-key],input[data-key],textarea[data-key]').forEach(function (el) {
      var k = el.getAttribute('data-key');
      if (el.type === 'radio') {
        if (el.checked) vals[k] = el.value;
      } else {
        vals[k] = el.value;
      }
    });
    return vals;
  }

  /* 按字段 visible 规则联动显隐（visible(vals) 返回 false 时隐藏该字段及空分组） */
  function applyVisibility(tool, container) {
    var vals = collectValues(container);
    var groupVisible = {};
    tool.inputs.forEach(function (f) {
      var g = f.group || '参数输入';
      var on = !f.visible || !!f.visible(vals);
      groupVisible[g] = groupVisible[g] || on;
      var el = container.querySelector('.field[data-key="' + f.key + '"]');
      if (el) el.style.display = on ? '' : 'none';
    });
    container.querySelectorAll('.form-section').forEach(function (sec) {
      var t = sec.querySelector('.form-section-title');
      if (t) sec.style.display = groupVisible[t.textContent] === false ? 'none' : '';
    });
  }

  function bindSegments(container) {
    container.querySelectorAll('.seg-group').forEach(function (g) {
      g.querySelectorAll('label').forEach(function (lab) {
        lab.addEventListener('click', function () {
          g.querySelectorAll('label').forEach(function (l2) { l2.classList.remove('on'); });
          lab.classList.add('on');
        });
      });
    });
  }

  /* ---------- 结果渲染 ---------- */
  function renderResult(tool, result) {
    var box = document.getElementById('resultBox');
    if (!result) { box.innerHTML = ''; return; }
    if (result.error) {
      box.innerHTML = '<div class="verdict bad"><span class="v-mark">!</span><div>' + esc(result.error) + '</div></div>';
      return;
    }
    var html = '';
    (result.sections || []).forEach(function (sec) {
      html += '<div class="result-section"><div class="result-section-title">' + sec.title + '</div><div class="result-grid">';
      (sec.rows || []).forEach(function (r) {
        var val = r.html || (typeof r.value === 'string' ? esc(r.value) : esc(fmt(r.value, r.d)));
        html += '<div class="result-item' + (r.hl ? ' hl' : '') + '"><span class="r-label">' + r.label +
          '</span><span><span class="r-value">' + val + '</span><span class="r-unit">' + esc(r.unit || '') + '</span></span></div>';
      });
      html += '</div></div>';
    });
    if (result.verdict) {
      var cls = result.verdict.level || 'ok';
      html += '<div class="verdict ' + cls + '"><span class="v-mark">' + (cls === 'ok' ? '✓' : cls === 'bad' ? '✕' : '!') +
        '</span><div>' + result.verdict.text + (result.verdict.note ? '<div class="v-note">' + result.verdict.note + '</div>' : '') + '</div></div>';
    }
    if (result.notes) {
      html += '<div class="note-block"><b>说明：</b><ul>' + result.notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul></div>';
    }
    box.innerHTML = html;
  }

  /* ---------- 工具页 ---------- */
  function renderToolPage(tool) {
    var main = document.getElementById('main');
    var cat = null;
    CATEGORIES.forEach(function (c) { if (c.id === tool.category) cat = c; });

    var sections = {};
    (tool.inputs || []).forEach(function (f) {
      var g = f.group || '参数输入';
      (sections[g] = sections[g] || []).push(f);
    });
    var formHTML = '';
    Object.keys(sections).forEach(function (g) {
      formHTML += '<div class="form-section"><div class="form-section-title">' + esc(g) + '</div><div class="form-grid">' +
        sections[g].map(fieldHTML).join('') + '</div></div>';
    });

    main.innerHTML =
      '<div class="crumb"><a href="#/">首页</a> / <a href="#/cat/' + tool.category + '">' + esc(cat ? cat.name : '') + '</a> / ' + esc(tool.name) + '</div>' +
      '<div class="tool-page">' +
      '  <div class="tool-head"><h1>' + esc(tool.name) + '</h1><p>' + (tool.brief || '') + '</p></div>' +
      '  <div class="tool-body">' +
      '    <div class="panel"><div class="panel-title">工具说明</div><div class="panel-content">' + (tool.doc || '') + '</div></div>' +
      formHTML +
      '    <div class="result-bar"><span style="font-size:13px;color:var(--ink-soft)">修改任一参数将自动重新计算</span><button class="btn-calc" id="btnCalc">计 算</button></div>' +
      '    <div id="resultBox"></div>' +
      '    ' + (tool.formulas ? '<div class="panel"><div class="panel-title">计算公式与依据</div><div class="panel-content"><ul class="formula-list">' +
            tool.formulas.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div></div>' : '') +
      '    ' + (tool.reference ? '<div class="panel"><div class="panel-title">参考资料</div><div class="panel-content">' + tool.reference + '</div></div>' : '') +
      '  </div>' +
      '</div>';

    var runCalc = function () {
      applyVisibility(tool, main);
      renderResult(tool, tool.compute(collectValues(main)));
    };
    main.addEventListener('input', runCalc);
    main.addEventListener('change', runCalc);
    bindSegments(main);
    /* 键盘按钮点击 → 导入公差带；键盘标题点击 → 折叠/展开 */
    main.addEventListener('click', function (e) {
      var t = e.target;
      var btn = t.closest && t.closest('.kb-btn');
      if (btn) {
        var panel = btn.closest('.kb-panel');
        var targets = {}, set = {};
        try { targets = JSON.parse(panel.getAttribute('data-targets') || '{}'); } catch (err) { /* noop */ }
        try { set = JSON.parse(btn.getAttribute('data-set') || '{}'); } catch (err) { /* noop */ }
        Object.keys(set).forEach(function (k) {
          var fk = targets[k];
          if (!fk) return;
          var el = main.querySelector('select[data-key="' + fk + '"],input[data-key="' + fk + '"]');
          if (el) el.value = set[k];
        });
        panel.querySelectorAll('.kb-btn.on').forEach(function (b) { b.classList.remove('on'); });
        btn.classList.add('on');
        runCalc();
        return;
      }
      var kh = t.closest && t.closest('.kb-head');
      if (kh) kh.parentNode.classList.toggle('fold');
    });
    document.getElementById('btnCalc').addEventListener('click', function () {
      runCalc();
      var box = document.getElementById('resultBox');
      if (!box) return;
      box.classList.remove('flash');
      void box.offsetWidth; /* 重启动画 */
      box.classList.add('flash');
    });
    runCalc();
  }

  /* ---------- 首页 / 分类页 ---------- */
  function toolCard(t) {
    return '<a class="tool-card" href="#/tool/' + t.id + '"><h3>' + esc(t.name) + '</h3><p>' + esc(t.brief || '') + '</p></a>';
  }
  /* 分类下的子菜单分组 HTML：每组一个标题 + 工具卡片网格 */
  function subGridHTML(catId) {
    return subGroups(catId).map(function (g) {
      return '<div class="sub-section">' +
        '<div class="sub-header"><h3>' + esc(g.t) + '</h3><div class="cat-line"></div></div>' +
        '<div class="tool-grid">' + g.tools.map(toolCard).join('') + '</div></div>';
    }).join('');
  }
  function renderHome() {
    var main = document.getElementById('main');
    var total = TOOLS.length;
    var html = '<div class="home-hero"><h1>常用机械设计在线计算工具</h1>' +
      '<p>覆盖连接校核、直线运动、机械传动、液压气动与工程常用查询，共 ' + total + ' 个计算工具。所有计算在浏览器本地完成，参数即改即算。</p>' +
      '<div class="hero-tags"><span>实时计算</span><span>标准依据</span><span>无需安装</span><span>可离线使用</span></div></div>';
    CATEGORIES.forEach(function (c) {
      var list = toolsOf(c.id);
      if (!list.length) return;
      html += '<div class="cat-section"><div class="cat-header"><h2>' + esc(c.name) + '</h2><span>' + esc(c.desc) + '</span><div class="cat-line"></div></div>' +
        subGridHTML(c.id) + '</div>';
    });
    main.innerHTML = html;
  }
  function renderCategory(catId) {
    var main = document.getElementById('main');
    var cat = null;
    CATEGORIES.forEach(function (c) { if (c.id === catId) cat = c; });
    if (!cat) { renderHome(); return; }
    main.innerHTML =
      '<div class="crumb"><a href="#/">首页</a> / ' + esc(cat.name) + '</div>' +
      '<div class="cat-section"><div class="cat-header"><h2>' + esc(cat.name) + '</h2><span>' + esc(cat.desc) + '</span><div class="cat-line"></div></div>' +
      subGridHTML(catId) + '</div>';
  }

  /* 返回某分类下的子菜单分组（每组含 tool 对象数组；未归组工具放入"其他"） */
  function subGroups(catId) {
    var def = SUBMENUS[catId] || [];
    var list = toolsOf(catId);
    var grouped = [];
    var used = {};
    def.forEach(function (g) {
      var ts = [];
      g.tools.forEach(function (id) {
        var t = getTool(id);
        if (t && list.indexOf(t) >= 0) { ts.push(t); used[id] = 1; }
      });
      if (ts.length) grouped.push({ t: g.t, tools: ts });
    });
    var rest = list.filter(function (t) { return !used[t.id]; });
    if (rest.length) grouped.push({ t: '其他', tools: rest });
    return grouped;
  }

  /* ---------- 侧栏 ---------- */
  function renderSidebar(activeToolId) {
    var sb = document.getElementById('sidebar');
    var html = '';
    CATEGORIES.forEach(function (c) {
      var list = toolsOf(c.id);
      if (!list.length) return;
      html += '<div class="side-cat"><div class="side-title">' + esc(c.name) + '</div>';
      subGroups(c.id).forEach(function (g) {
        html += '<div class="side-subtitle">' + esc(g.t) + '</div>';
        g.tools.forEach(function (t) {
          html += '<a class="side-tool' + (t.id === activeToolId ? ' active' : '') + '" href="#/tool/' + t.id + '">' + esc(t.name) + '</a>';
        });
      });
      html += '</div>';
    });
    sb.innerHTML = html;
  }

  /* ---------- 搜索 ---------- */
  function initSearch() {
    var input = document.getElementById('globalSearch');
    var drops = document.getElementById('searchDrops');
    function run() {
      var q = input.value.trim().toLowerCase();
      if (!q) { drops.classList.remove('show'); drops.innerHTML = ''; return; }
      var hits = TOOLS.filter(function (t) {
        return (t.name + '|' + (t.brief || '') + '|' + (t.keywords || '') + '|' + t.id).toLowerCase().indexOf(q) >= 0;
      });
      drops.innerHTML = hits.length
        ? hits.map(function (t) { return '<a href="#/tool/' + t.id + '">' + esc(t.name) + ' <span style="color:#98a7b3;font-size:12px">— ' + esc(t.brief || '') + '</span></a>'; }).join('')
        : '<a style="color:#98a7b3">未找到相关工具</a>';
      drops.classList.add('show');
    }
    input.addEventListener('input', run);
    input.addEventListener('focus', run);
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.search-box')) drops.classList.remove('show');
    });
  }

  /* ---------- 路由 ---------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    var sb = document.getElementById('sidebar');
    if (parts[0] === 'tool' && getTool(parts[1])) {
      sb.style.display = '';
      renderSidebar(parts[1]);
      renderToolPage(getTool(parts[1]));
    } else if (parts[0] === 'cat') {
      sb.style.display = '';
      renderSidebar(null);
      renderCategory(parts[1]);
    } else {
      sb.style.display = '';
      renderSidebar(null);
      renderHome();
    }
    window.scrollTo(0, 0);
  }

  function boot() {
    window.addEventListener('hashchange', route);
    initSearch();
    route();
  }

  return {
    boot: boot,
    registerTool: registerTool,
    getTool: getTool,
    categories: CATEGORIES,
    fmt: fmt,
    esc: esc
  };
})();
