/* =========================================================
 * 形状与位置公差查询（GB/T 1184-1996）
 * 1. 形状公差查询：直线度/平面度/圆度/圆柱度
 * 2. 位置公差查询：平行度/垂直度/倾斜度/同轴度/对称度/圆跳动/全跳动
 * 数据见 gtdata.js，复刻 mechtool.cn 形状与位置公差查询。
 * ========================================================= */
(function () {
  'use strict';
  var G = window.GTDATA;
  var fmt = App.fmt;

  /* 公差值展示：μm → mm，去尾零 */
  function gfmt(um) {
    var v = um / 1000;
    /* 保留足够小数位（μm 可含 0.5、0.25 等），再去尾零 */
    var s = (Math.round(v * 1e6) / 1e6).toString();
    return s;
  }
  function segName(segs, i) {
    return (i === 0 ? '≤' + segs[0] : '＞' + segs[i - 1] + '～' + segs[i]) + ' mm';
  }

  /* 形状公差：各项目名 → 数据表 */
  var SHAPE_ITEMS = [
    { v: 'straightness', t: '直线度', tab: 'LF' },
    { v: 'flatness', t: '平面度', tab: 'LF' },
    { v: 'roundness', t: '圆度', tab: 'RC' },
    { v: 'cylindricity', t: '圆柱度', tab: 'RC' }
  ];
  /* 位置公差：各项目名 → 数据表 */
  var POS_ITEMS = [
    { v: 'parallelism', t: '平行度', tab: 'PV' },
    { v: 'perpendicularity', t: '垂直度', tab: 'PV' },
    { v: 'inclination', t: '倾斜度', tab: 'PV' },
    { v: 'coaxiality', t: '同轴度', tab: 'CS' },
    { v: 'symmetry', t: '对称度', tab: 'CS' },
    { v: 'roundbeating', t: '圆跳动', tab: 'CS' },
    { v: 'fullbeat', t: '全跳动', tab: 'CS' }
  ];
  function tableOf(items, id) {
    for (var i = 0; i < items.length; i++) if (items[i].v === id) return items[i];
    return null;
  }
  /* 查表：主参数 d → (公差值 μm, 尺寸段下标) */
  function lookup(tab, grade, d) {
    var segs = tab.segs, row = tab.v[grade];
    if (!row) return { err: '该公差等级无数据' };
    for (var i = 0; i < segs.length; i++) if (d <= segs[i]) return { v: row[i], seg: i, text: segName(segs, i) };
    return { err: '主参数超出本表范围（最大 ' + segs[segs.length - 1] + ' mm）' };
  }

  /* 形位公差名称 select 选项（网格） */
  function itemOpts(items) { return items.map(function (o) { return o; }); }
  function gradeOpts() {
    var a = [];
    for (var g = 1; g <= 12; g++) a.push({ v: g, t: String(g) });
    return a;
  }

  /* =====================================================
   * 工具 1：形状公差查询
   * ===================================================== */
  App.registerTool({
    id: 'shape-tolerance',
    name: '形状公差查询',
    category: 'common',
    keywords: '形状公差 直线度 平面度 圆度 圆柱度 公差 GB/T 1184 主参数 公差等级',
    brief: '按 GB/T 1184 查询直线度、平面度、圆度、圆柱度公差值（输入主参数与公差等级）。',
    doc: '输入<b>主参数</b>并选择<b>公差等级</b>与<b>形位公差名称</b>，即可得到对应公差值。直线度、平面度主参数 ≤10000mm；圆度、圆柱度 ≤500mm。数据严格参照 GB/T 1184-1996。',
    inputs: [
      { key: 'D', label: '主参数', group: '形状公差查询', type: 'number', unit: 'mm', default: 500, step: 'any', hint: '直线度/平面度 ≤10000，圆度/圆柱度 ≤500' },
      { key: 'grade', label: '公差等级', group: '形状公差查询', type: 'select', options: gradeOpts(), default: 12 },
      { key: 'item', label: '形位公差名称', group: '形状公差查询', type: 'segment', cols: 2, options: itemOpts(SHAPE_ITEMS), default: 'straightness' }
    ],
    compute: function (v) {
      var d = +v.D;
      var grade = +(v.grade || 12);
      var it = tableOf(SHAPE_ITEMS, v.item || 'straightness');
      if (!it) return { error: '未知形位公差名称' };
      var maxD = it.tab === 'RC' ? 500 : 10000;
      if (!(d > 0)) return { error: '主参数必须大于 0' };
      if (d > maxD) return { error: it.t + '的主参数仅限 0~' + maxD + ' mm 之间' };
      var tab = G[it.tab];
      var r = lookup(tab, grade, d);
      if (r.err) return { error: r.err };
      var tag = it.t + (grade + '级');
      return {
        sections: [
          { title: '查询结果', rows: [
            { label: tag, html: '<b>' + gfmt(r.v) + '</b> mm', hl: true },
            { label: '主参数段', value: r.text },
            { label: '公差等级', value: 'IT' + grade + '（' + grade + '级）' }
          ] }
        ],
        verdict: { level: 'ok', text: it.t + '：主参数 φ' + fmt(d) + ' mm，' + grade + ' 级公差值为 ' + gfmt(r.v) + ' mm' },
        notes: [
          '数据严格参照 GB/T 1184-1996《形状和位置公差 未注公差值》注出公差值表。',
          '直线度/平面度适用于 ≤10mm～10000mm 主参数段；圆度/圆柱度适用于 φ≤3～500mm。'
        ]
      };
    },
    formulas: [
      '公差值按主参数所在尺寸段与公差等级直接查表（GB/T 1184 注出公差值）',
      '直线度、平面度：主参数 L；圆度、圆柱度：主参数 d（D）'
    ],
    reference: 'GB/T 1184-1996《形状和位置公差 未注公差值》；布局参照 mechtool.cn 形状公差查询。'
  });

  /* =====================================================
   * 工具 2：位置公差查询
   * ===================================================== */
  App.registerTool({
    id: 'position-tolerance',
    name: '位置公差查询',
    category: 'common',
    keywords: '位置公差 平行度 垂直度 倾斜度 同轴度 对称度 圆跳动 全跳动 公差 GB/T 1184',
    brief: '按 GB/T 1184 查询平行度、垂直度、倾斜度、同轴度、对称度、圆跳动、全跳动公差值。',
    doc: '输入<b>主参数</b>并选择<b>公差等级</b>与<b>形位公差名称</b>，即可得到对应公差值。主参数 ≤10000mm。数据严格参照 GB/T 1184-1996。',
    inputs: [
      { key: 'D', label: '主参数', group: '位置公差查询', type: 'number', unit: 'mm', default: 500, step: 'any', hint: '范围 ≤10000mm' },
      { key: 'grade', label: '公差等级', group: '位置公差查询', type: 'select', options: gradeOpts(), default: 12 },
      { key: 'item', label: '形位公差名称', group: '位置公差查询', type: 'segment', cols: 2, options: itemOpts(POS_ITEMS), default: 'parallelism' }
    ],
    compute: function (v) {
      var d = +v.D;
      var grade = +(v.grade || 12);
      var it = tableOf(POS_ITEMS, v.item || 'parallelism');
      if (!it) return { error: '未知形位公差名称' };
      if (!(d > 0)) return { error: '主参数必须大于 0' };
      if (d > 10000) return { error: '主参数仅限 0~10000 mm 之间' };
      var tab = G[it.tab];
      var r = lookup(tab, grade, d);
      if (r.err) return { error: r.err };
      var tag = it.t + (grade + '级');
      return {
        sections: [
          { title: '查询结果', rows: [
            { label: tag, html: '<b>' + gfmt(r.v) + '</b> mm', hl: true },
            { label: '主参数段', value: r.text },
            { label: '公差等级', value: 'IT' + grade + '（' + grade + '级）' }
          ] }
        ],
        verdict: { level: 'ok', text: it.t + '：主参数 φ' + fmt(d) + ' mm，' + grade + ' 级公差值为 ' + gfmt(r.v) + ' mm' },
        notes: [
          '数据严格参照 GB/T 1184-1996《形状和位置公差 未注公差值》注出公差值表。',
          '平行度/垂直度/倾斜度主参数 L、d（D）；同轴度/对称度/圆跳动/全跳动主参数 d（D）、B、L。'
        ]
      };
    },
    formulas: [
      '公差值按主参数所在尺寸段与公差等级直接查表（GB/T 1184 注出公差值）',
      '主参数 ≤10000mm，覆盖 0.4μm～4000μm'
    ],
    reference: 'GB/T 1184-1996《形状和位置公差 未注公差值》；布局参照 mechtool.cn 位置公差查询。'
  });
})();