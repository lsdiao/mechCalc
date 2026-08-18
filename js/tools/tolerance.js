/* =========================================================
 * 公差查询 + 配合查询（1:1 复刻 mechtool.cn 布局与计算方式）
 * 数据：js/tools/toldata.js（GB/T 1800.1/1800.3，≤500mm）
 * 键盘：孔/轴公差带键盘、基孔制/基轴制优先配合键盘
 *       按钮 B=特别优先/优先配合（蓝），Y=优先选择/可用配合（黄）
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;
  var D = window.TOLDATA;

  /* ---------- 尺寸段 ---------- */
  function seg25(d) {
    for (var i = 0; i < D.segs25.length; i++) if (d <= D.segs25[i][1]) return i;
    return D.segs25.length - 1;
  }
  function seg13(d) {
    for (var i = 0; i < D.segs13.length; i++) if (d <= D.segs13[i]) return i;
    return D.segs13.length - 1;
  }
  function seg25Name(i) {
    var s = D.segs25[i];
    return s[0] === 0 ? '≤' + s[1] : '>' + s[0] + '~' + s[1];
  }
  function itOf(grade, d) {
    var row = D.IT[grade];
    if (!row) return null;
    return row[seg13(d)];
  }

  var ERR = {
    range: function (d) { return '基本尺寸应在 >0 ~ 500mm 范围内（当前 ' + d + 'mm）'; },
    grade: function (g, lo, hi) { return '公差等级 IT' + g + ' 超出数据范围（IT' + lo + '~IT' + hi + '）'; }
  };

  /* ---------- 轴上/下偏差（μm） ---------- */
  function shaftDev(code, grade, d) {
    var it = itOf(grade, d);
    if (it === null) return { err: ERR.grade(grade, 1, 18) };
    var i = seg25(d), es = D.shaft.es, ei = D.shaft.ei, v;
    if (code === 'js') return { es: it / 2, ei: -it / 2, it: it };
    if (code === 'j') {                    /* j 仅 IT5~IT8，es=基本偏差 */
      if (grade < 5 || grade > 8) return { err: '轴 j 仅用于 IT5~IT8' };
      v = grade <= 6 ? es.j_it56[i] : grade === 7 ? es.j_it7[i] : es.j_it8[i];
      if (v === null || v === undefined) return { err: '轴 ' + code + grade + ' 在此尺寸段不作规定（见 GB/T 1800.3 注）' };
      return { es: v, ei: v - it, it: it };
    }
    if (code === 'k') {                    /* k：IT4~IT7 与其他等级分列 */
      v = (grade >= 4 && grade <= 7) ? ei.k_it47[i] : ei.k_other[i];
      if (v === null || v === undefined) return { err: '轴 ' + code + grade + ' 在此尺寸段不作规定' };
      return { ei: v, es: v + it, it: it };
    }
    if (es[code] !== undefined) {          /* a~h：上偏差 es=基本偏差 */
      v = es[code][i];
      if (v === null || v === undefined) return { err: '轴 ' + code + grade + ' 在此尺寸段不作规定（见 GB/T 1800.3 注）' };
      return { es: v, ei: v - it, it: it };
    }
    if (ei[code] !== undefined) {          /* m~z：下偏差 ei=基本偏差 */
      v = ei[code][i];
      if (v === null || v === undefined) {
        var tip = { t: '（基本尺寸至 24mm 时建议以 u 代替）', v: '（基本尺寸至 14mm 时建议以 x 代替）', y: '（基本尺寸至 18mm 时建议以 z 代替）' }[code];
        return { err: '轴 ' + code + grade + ' 在此尺寸段不作规定' + (tip || '') };
      }
      return { ei: v, es: v + it, it: it };
    }
    return { err: '暂不支持的轴公差代号：' + code };
  }

  /* ---------- 孔上/下偏差（μm） ---------- */
  function holeDev(code, grade, d) {
    var it = itOf(grade, d);
    if (it === null) return { err: ERR.grade(grade, 1, 18) };
    var i = seg25(d), ei = D.hole.ei, es = D.hole.es, v, delta;
    if (code === 'JS') return { ES: it / 2, EI: -it / 2, it: it };
    if (ei[code] !== undefined) {          /* A~H：下偏差 EI=基本偏差 */
      v = ei[code][i];
      if (v === null || v === undefined) return { err: '孔 ' + code + grade + ' 在此尺寸段不作规定（见 GB/T 1800.3 注）' };
      return { EI: v, ES: v + it, it: it };
    }
    if (code === 'J') {
      v = grade === 6 ? es.J6[i] : grade === 7 ? es.J7[i] : grade === 8 ? es.J8[i] : null;
      if (v === null || v === undefined) return { err: '孔 J 仅用于 IT6~IT8' };
      return { ES: v, EI: v - it, it: it };
    }
    /* K/M/N：≤IT8 用 base+Δ，>IT8 用另一列；P~Z：≤IT7 用 base+Δ，>IT7 直接查表 */
    delta = itOf(grade - 1, d) === null ? null : it - itOf(grade - 1, d);
    if (code === 'K' || code === 'M' || code === 'N') {
      if (grade <= 8) {
        v = es[code + '_le8'][i];
        if (Array.isArray(v)) return { ES: v[0] + delta, EI: v[0] + delta - it, it: it };
        if (v === 0) return { ES: delta, EI: delta - it, it: it };
        return { err: '孔 ' + code + grade + ' 在此尺寸段不作规定' };
      }
      v = es[code + '_gt8'][i];
      if (v === null || v === undefined) return { err: '基本尺寸大于 3mm 时，大于 IT8 的 ' + code + ' 偏差值不作规定' };
      return { ES: v, EI: v - it, it: it };
    }
    if (es[code] !== undefined) {          /* P R S T U V X Y Z */
      v = es[code][i];
      if (v === null || v === undefined) {
        var tip = { T: '（基本尺寸至 24mm 时建议以 U 代替）', V: '（基本尺寸至 14mm 时建议以 X 代替）', Y: '（基本尺寸至 18mm 时建议以 Z 代替）' }[code];
        return { err: '孔 ' + code + grade + ' 在此尺寸段不作规定' + (tip || '') };
      }
      if (grade <= 7) {
        if (delta === null) return { err: '孔 ' + code + ' 用于 IT' + grade + ' 时偏差值不作规定' };
        return { ES: v + delta, EI: v + delta - it, it: it };
      }
      return { ES: v, EI: v - it, it: it };
    }
    return { err: '暂不支持的孔公差代号：' + code };
  }

  function devStr(um) {
    var v = um / 1000;
    var d = (Math.abs(um) % 1 === 0) ? 3 : 4;
    return (v > 0 ? '+' : v < 0 ? '-' : '') + fmt(Math.abs(v), d);
  }

  /* =====================================================
   * 键盘数据（列号、按钮、颜色均 1:1 对应参考站网格）
   * cells: [列号, 按钮文本, 'B'|'Y']
   * ===================================================== */

  /* 孔公差带键盘（A=1 B=2 C=3 D=4 E=5 F=6 G=7 H=8 JS=9 K=10 M=11 N=12 P=13 R=14 S=15 T=16 U=17 X=18，共 19 列） */
  var HOLE_KB = [
    { label: 'IT6', cells: [[7, 'G6', 'Y'], [8, 'H6', 'Y'], [9, 'JS6', 'Y'], [10, 'K6', 'Y'], [11, 'M6', 'Y'], [12, 'N6', 'Y'], [13, 'P6', 'Y'], [14, 'R6', 'Y'], [15, 'S6', 'Y'], [16, 'T6', 'Y']] },
    { label: 'IT7', cells: [[6, 'F7', 'Y'], [7, 'G7', 'B'], [8, 'H7', 'B'], [9, 'JS7', 'B'], [10, 'K7', 'B'], [11, 'M7', 'Y'], [12, 'N7', 'B'], [13, 'P7', 'B'], [14, 'R7', 'B'], [15, 'S7', 'B'], [16, 'T7', 'Y'], [17, 'U7', 'Y'], [18, 'X7', 'Y']] },
    { label: 'IT8', cells: [[5, 'E8', 'Y'], [6, 'F8', 'B'], [8, 'H8', 'B'], [9, 'JS8', 'Y'], [10, 'K8', 'Y'], [11, 'M8', 'Y'], [12, 'N8', 'Y'], [13, 'P8', 'Y'], [14, 'R8', 'Y']] },
    { label: 'IT9', cells: [[4, 'D9', 'Y'], [5, 'E9', 'B'], [6, 'F9', 'Y'], [8, 'H9', 'B']] },
    { label: 'IT10', cells: [[3, 'C10', 'Y'], [4, 'D10', 'B'], [5, 'E10', 'Y'], [8, 'H10', 'Y']] },
    { label: 'IT11', cells: [[1, 'A11', 'B'], [2, 'B11', 'B'], [3, 'C11', 'B'], [4, 'D11', 'Y'], [8, 'H11', 'B']] }
  ];

  /* 轴公差带键盘（a=1 b=2 c=3 d=4 e=5 f=6 g=7 h=8 js=9 k=10 m=11 n=12 p=13 r=14 s=15 t=16 u=17 x=18，共 20 列） */
  var SHAFT_KB = [
    { label: 'IT5', cells: [[7, 'g5', 'Y'], [8, 'h5', 'Y'], [9, 'js5', 'Y'], [10, 'k5', 'Y'], [11, 'm5', 'Y'], [12, 'n5', 'Y'], [13, 'p5', 'Y'], [14, 'r5', 'Y'], [15, 's5', 'Y'], [16, 't5', 'Y']] },
    { label: 'IT6', cells: [[6, 'f6', 'Y'], [7, 'g6', 'B'], [8, 'h6', 'B'], [9, 'js6', 'B'], [10, 'k6', 'B'], [11, 'm6', 'Y'], [12, 'n6', 'B'], [13, 'p6', 'B'], [14, 'r6', 'B'], [15, 's6', 'B'], [16, 't6', 'Y'], [17, 'u6', 'Y'], [18, 'x6', 'Y']] },
    { label: 'IT7', cells: [[5, 'e7', 'Y'], [6, 'f7', 'B'], [8, 'h7', 'B'], [9, 'js7', 'Y'], [10, 'k7', 'Y'], [11, 'm7', 'Y'], [12, 'n7', 'Y'], [13, 'p7', 'Y'], [14, 'r7', 'Y'], [15, 's7', 'Y'], [16, 't7', 'Y'], [17, 'u7', 'Y']] },
    { label: 'IT8', cells: [[4, 'd8', 'Y'], [5, 'e8', 'B'], [6, 'f8', 'Y'], [8, 'h8', 'Y']] },
    { label: 'IT9', cells: [[2, 'b9', 'Y'], [3, 'c9', 'Y'], [4, 'd9', 'B'], [5, 'e9', 'Y'], [8, 'h9', 'B']] },
    { label: 'IT10', cells: [[4, 'd10', 'Y'], [8, 'h10', 'Y']] },
    { label: 'IT11', cells: [[1, 'a11', 'B'], [2, 'b11', 'B'], [3, 'c11', 'B'], [8, 'h11', 'B']] }
  ];

  /* 基孔制优先配合键盘（列 1~7 间隙、8~11 过渡、12~18 过盈；行标签=孔公差带，span 为跨行数） */
  var FIT_HB = [
    { label: 'H6', cells: [[6, 'g5', 'Y'], [7, 'h5', 'Y'], [8, 'js5', 'Y'], [9, 'k5', 'Y'], [10, 'm5', 'Y'], [12, 'n5', 'Y'], [13, 'p5', 'Y']] },
    { label: 'H7', cells: [[5, 'f6', 'Y'], [6, 'g6', 'B'], [7, 'h6', 'B'], [8, 'js6', 'B'], [9, 'k6', 'B'], [10, 'm6', 'Y'], [11, 'n6', 'B'], [13, 'p6', 'B'], [14, 'r6', 'B'], [15, 's6', 'B'], [16, 't6', 'Y'], [17, 'u6', 'Y'], [18, 'x6', 'Y']] },
    { label: 'H8', span: 2, cells: [[4, 'e7', 'Y'], [5, 'f7', 'B'], [7, 'h7', 'B'], [8, 'js7', 'Y'], [9, 'k7', 'Y'], [10, 'm7', 'Y'], [15, 's7', 'Y'], [18, 'u8', 'Y']] },
    { label: '', cells: [[3, 'd8', 'Y'], [4, 'e8', 'B'], [5, 'f8', 'Y'], [7, 'h8', 'Y']] },
    { label: 'H9', cells: [[3, 'd8', 'Y'], [4, 'e8', 'B'], [5, 'f8', 'Y'], [7, 'h8', 'Y']] },
    { label: 'H10', cells: [[1, 'b9', 'Y'], [2, 'c9', 'Y'], [3, 'd9', 'B'], [4, 'e9', 'Y'], [7, 'h9', 'B']] },
    { label: 'H11', cells: [[1, 'b11', 'B'], [2, 'c11', 'B'], [3, 'd10', 'Y'], [7, 'h10', 'Y']] }
  ];

  /* 基轴制优先配合键盘（行标签=轴公差带，h9 跨 3 行） */
  var FIT_HS = [
    { label: 'h5', cells: [[6, 'G6', 'Y'], [7, 'H6', 'Y'], [8, 'JS6', 'Y'], [9, 'K6', 'Y'], [10, 'M6', 'Y'], [12, 'N6', 'Y'], [13, 'P6', 'Y']] },
    { label: 'h6', cells: [[5, 'F7', 'Y'], [6, 'G7', 'B'], [7, 'H7', 'B'], [8, 'JS7', 'B'], [9, 'K7', 'B'], [10, 'M7', 'Y'], [11, 'N7', 'B'], [13, 'P7', 'B'], [14, 'R7', 'B'], [15, 'S7', 'B'], [16, 'T7', 'Y'], [17, 'U7', 'Y'], [18, 'X7', 'Y']] },
    { label: 'h7', cells: [[4, 'E8', 'Y'], [5, 'F8', 'B'], [7, 'H8', 'B']] },
    { label: 'h8', cells: [[3, 'D9', 'Y'], [4, 'E9', 'B'], [5, 'F9', 'Y'], [7, 'H9', 'B']] },
    { label: 'h9', span: 3, cells: [[4, 'E8', 'Y'], [5, 'F8', 'B'], [7, 'H8', 'B']] },
    { label: '', cells: [[3, 'D9', 'Y'], [4, 'E9', 'B'], [5, 'F9', 'Y'], [7, 'H9', 'B']] },
    { label: '', cells: [[1, 'B11', 'B'], [2, 'C10', 'Y'], [3, 'D10', 'B'], [7, 'H10', 'Y']] }
  ];

  var FIT_GROUPS = [{ t: '间隙配合', span: 7 }, { t: '过渡配合', span: 4 }, { t: '过盈配合', span: 7 }];

  /* 由文本解析代号/等级（G6 → {code:'G', grade:6}） */
  function parseBand(t) {
    var m = String(t).match(/^([A-Za-z]+?)(\d+)$/);
    return m ? { code: m[1], grade: +m[2] } : null;
  }
  /* 公差带键盘行：按钮 set = {code, grade} */
  function kbRows(rows) {
    return rows.map(function (r) {
      return { label: r.label, span: r.span, cells: r.cells.map(function (c) {
        var b = parseBand(c[1]);
        return { c: c[0], t: c[1], cls: c[2], set: { code: b.code, grade: b.grade } };
      }) };
    });
  }
  /* 基孔制行：行标签=孔（子行继承跨行标签），按钮=轴 */
  function fitHbRows(rows) {
    var inherit = '';
    return rows.map(function (r) {
      if (r.label) inherit = r.label;
      var hole = parseBand(inherit);
      return { label: r.label, span: r.span, cells: r.cells.map(function (c) {
        var sh = parseBand(c[1]);
        return { c: c[0], t: c[1], cls: c[2], set: { holeCode: hole.code, holeGrade: hole.grade, shaftCode: sh.code, shaftGrade: sh.grade } };
      }) };
    });
  }
  /* 基轴制行：行标签=轴（子行继承跨行标签），按钮=孔 */
  function fitHsRows(rows) {
    var inherit = '';
    return rows.map(function (r) {
      if (r.label) inherit = r.label;
      var sh = parseBand(inherit);
      return { label: r.label, span: r.span, cells: r.cells.map(function (c) {
        var hole = parseBand(c[1]);
        return { c: c[0], t: c[1], cls: c[2], set: { holeCode: hole.code, holeGrade: hole.grade, shaftCode: sh.code, shaftGrade: sh.grade } };
      }) };
    });
  }

  /* ---------- 选项 ---------- */
  var HOLE_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'JS', 'J', 'K', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z'];
  var SHAFT_CODES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'js', 'j', 'k', 'm', 'n', 'p', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z'];
  function gradeOpts() {
    var a = [];
    for (var g = 1; g <= 18; g++) a.push({ v: g, t: 'IT' + g });
    return a;
  }
  function codeOpts(list) {
    return list.map(function (c) { return { v: c, t: c }; });
  }

  /* =====================================================
   * 工具 1：公差查询
   * ===================================================== */
  App.registerTool({
    id: 'tolerance-query',
    name: '公差查询',
    category: 'common',
    keywords: '公差查询 极限偏差 上偏差 下偏差 孔公差 轴公差 公差带 公差代号 公差等级 键盘 GB/T 1800',
    brief: '按 GB/T 1800 查询孔/轴极限偏差，附孔/轴公差带键盘（点击自动导入代号与等级）。',
    doc: '输入<b>基本尺寸</b>，选择<b>查询对象</b>（孔/轴）、<b>公差代号</b>与<b>公差等级</b>，即可得到上、下偏差与极限尺寸。数据严格参照 GB/T 1800。点击下方<b>孔/轴公差带键盘</b>按钮可自动导入对应公差代号和等级（蓝色为特别优先，黄色为优先选择）。',
    inputs: [
      { key: 'D', label: '基本尺寸', group: '公差查询', type: 'number', unit: 'mm', default: 40, step: 'any', hint: '范围 ≤500mm' },
      { key: 'obj', label: '查询对象', group: '公差查询', type: 'segment', options: [{ v: 'hole', t: '孔公差查询' }, { v: 'shaft', t: '轴公差查询' }] },
      { key: 'holeCode', label: '孔公差代号', group: '公差带', type: 'select', options: codeOpts(HOLE_CODES), default: 'H', visible: function (v) { return v.obj !== 'shaft'; } },
      { key: 'holeGrade', label: '孔公差等级', group: '公差带', type: 'select', options: gradeOpts(), default: 7, visible: function (v) { return v.obj !== 'shaft'; } },
      { key: 'shaftCode', label: '轴公差代号', group: '公差带', type: 'select', options: codeOpts(SHAFT_CODES), default: 'k', visible: function (v) { return v.obj === 'shaft'; } },
      { key: 'shaftGrade', label: '轴公差等级', group: '公差带', type: 'select', options: gradeOpts(), default: 6, visible: function (v) { return v.obj === 'shaft'; } },
      { key: 'kbHole', label: '', group: '公差带键盘', type: 'keypad',
        title: '孔公差带键盘', legend: [{ cls: 'blue', t: '特别优先' }, { cls: 'yellow', t: '优先选择' }, { cls: 'gray', t: '备用选择' }],
        rowLabel: '等级', colLabel: '公差代号', cols: 19,
        targets: { code: 'holeCode', grade: 'holeGrade' },
        rows: kbRows(HOLE_KB),
        visible: function (v) { return v.obj !== 'shaft'; } },
      { key: 'kbShaft', label: '', group: '公差带键盘', type: 'keypad',
        title: '轴公差带键盘', legend: [{ cls: 'blue', t: '特别优先' }, { cls: 'yellow', t: '优先选择' }, { cls: 'gray', t: '备用选择' }],
        rowLabel: '等级', colLabel: '公差代号', cols: 20,
        targets: { code: 'shaftCode', grade: 'shaftGrade' },
        rows: kbRows(SHAFT_KB),
        visible: function (v) { return v.obj === 'shaft'; } }
    ],
    compute: function (v) {
      var d = +v.D;
      if (!(d > 0 && d <= 500)) return { error: ERR.range(v.D) };
      var isHole = v.obj !== 'shaft';
      var code = isHole ? (v.holeCode || 'H') : (v.shaftCode || 'k');
      var grade = +(isHole ? v.holeGrade || 7 : v.shaftGrade || 6);
      var dev = isHole ? holeDev(code, grade, d) : shaftDev(code, grade, d);
      if (dev.err) return { error: dev.err };
      var upper = isHole ? dev.ES : dev.es, lower = isHole ? dev.EI : dev.ei;
      var tag = code + grade, seg = seg25(d);
      return {
        sections: [
          { title: '查询结果', rows: [
            { label: 'φ' + fmt(d) + ' ' + tag, html: '<b>' + devStr(upper) + '</b> / <b>' + devStr(lower) + '</b> mm', hl: true },
            { label: '基本偏差段', value: seg25Name(seg), unit: 'mm' },
            { label: '标准公差 IT' + grade, value: dev.it, unit: 'μm' }
          ] },
          { title: '极限尺寸', rows: [
            { label: '最大极限尺寸', value: d + upper / 1000, unit: 'mm', d: 4 },
            { label: '最小极限尺寸', value: d + lower / 1000, unit: 'mm', d: 4 }
          ] }
        ],
        verdict: { level: 'ok', text: 'φ' + fmt(d) + ' ' + tag + '：上偏差 ' + devStr(upper) + ' mm，下偏差 ' + devStr(lower) + ' mm' },
        notes: [
          '数据严格参照 GB/T 1800（基本尺寸至 500mm）。',
          '基本尺寸小于 1mm 时，各级的 A/B（a/b）均不采用；T/V/Y（t/v/y）小尺寸段的代替建议见错误提示。'
        ]
      };
    },
    formulas: [
      '轴 a~h：es=基本偏差，ei=es−IT；k~z：ei=基本偏差，es=ei+IT；js=±IT/2',
      '孔 A~H：EI=基本偏差，ES=EI+IT；JS=±IT/2；J 仅 IT6~IT8',
      '孔 K/M/N：≤IT8 时 ES=基本偏差+Δ（Δ=ITn−IT(n−1)），>IT8 直接查表',
      '孔 P~Z：≤IT7 时 ES=基本偏差+Δ，>IT7 直接查表'
    ],
    reference: 'GB/T 1800.1、GB/T 1800.2《产品几何技术规范(GPS) 线性尺寸公差》；公差带键盘布局参照 mechtool.cn 公差查询。'
  });

  /* =====================================================
   * 工具 2：配合查询
   * ===================================================== */
  var FIT_TYPE_NAME = { clearance: '间隙配合', transition: '过渡配合', interference: '过盈配合' };
  App.registerTool({
    id: 'tolerance-fit-query',
    name: '配合查询',
    category: 'common',
    keywords: '配合查询 公差配合 基孔制 基轴制 间隙配合 过渡配合 过盈配合 优先配合 键盘 极限偏差',
    brief: '按 GB/T 1800 查询孔/轴配合的极限偏差与配合性质，附基孔制/基轴制优先配合键盘。',
    doc: '输入<b>基本尺寸</b>，选择<b>基准制</b>、<b>配合方式</b>与孔/轴的<b>公差代号、公差等级</b>，即可得到孔、轴上、下偏差，最大/最小间隙（过盈）及配合性质，并校验所选<b>配合方式</b>与实际配合性质是否一致。点击<b>基孔制/基轴制优先配合键盘</b>按钮可自动导入整套配合（蓝色为优先配合，黄色为可用配合）。',
    inputs: [
      { key: 'D', label: '基本尺寸', group: '配合查询', type: 'number', unit: 'mm', default: 40, step: 'any', hint: '范围 ≤500mm' },
      { key: 'basis', label: '基准制', group: '配合查询', type: 'segment', options: [{ v: 'hb', t: '基孔制' }, { v: 'hs', t: '基轴制' }] },
      { key: 'fitType', label: '配合方式', group: '配合查询', type: 'segment', options: [{ v: 'clearance', t: '间隙配合' }, { v: 'transition', t: '过渡配合' }, { v: 'interference', t: '过盈配合' }] },
      { key: 'holeCode', label: '孔公差代号', group: '公差带', type: 'select', options: codeOpts(HOLE_CODES), default: 'H' },
      { key: 'holeGrade', label: '孔公差等级', group: '公差带', type: 'select', options: gradeOpts(), default: 7 },
      { key: 'shaftCode', label: '轴公差代号', group: '公差带', type: 'select', options: codeOpts(SHAFT_CODES), default: 'k' },
      { key: 'shaftGrade', label: '轴公差等级', group: '公差带', type: 'select', options: gradeOpts(), default: 6 },
      { key: 'kbHb', label: '', group: '优先配合键盘', type: 'keypad',
        title: '基孔制优先配合键盘', legend: [{ cls: 'blue', t: '优先配合' }, { cls: 'yellow', t: '可用配合' }],
        rowLabel: '孔', groups: FIT_GROUPS, cols: 18,
        targets: { holeCode: 'holeCode', holeGrade: 'holeGrade', shaftCode: 'shaftCode', shaftGrade: 'shaftGrade' },
        rows: fitHbRows(FIT_HB),
        visible: function (v) { return v.basis !== 'hs'; } },
      { key: 'kbHs', label: '', group: '优先配合键盘', type: 'keypad',
        title: '基轴制优先配合键盘', legend: [{ cls: 'blue', t: '优先配合' }, { cls: 'yellow', t: '可用配合' }],
        rowLabel: '轴', groups: FIT_GROUPS, cols: 18,
        targets: { holeCode: 'holeCode', holeGrade: 'holeGrade', shaftCode: 'shaftCode', shaftGrade: 'shaftGrade' },
        rows: fitHsRows(FIT_HS),
        visible: function (v) { return v.basis === 'hs'; } }
    ],
    compute: function (v) {
      var d = +v.D;
      if (!(d > 0 && d <= 500)) return { error: ERR.range(v.D) };
      var hc = v.holeCode || 'H', hg = +(v.holeGrade || 7);
      var sc = v.shaftCode || 'k', sg = +(v.shaftGrade || 6);
      var hole = holeDev(hc, hg, d), shaft = shaftDev(sc, sg, d);
      if (hole.err) return { error: '孔 ' + hc + hg + '：' + hole.err };
      if (shaft.err) return { error: '轴 ' + sc + sg + '：' + shaft.err };
      var Xmax = hole.ES - shaft.ei, Ymax = shaft.es - hole.EI;
      var fitType, detail;
      if (Xmax >= 0 && Ymax <= 0) { fitType = '间隙配合'; detail = 'Xmax=' + fmt(Xmax / 1000, 3) + 'mm，Xmin=' + fmt((hole.EI - shaft.es) / 1000, 3) + 'mm'; }
      else if (Xmax <= 0 && Ymax >= 0) { fitType = '过盈配合'; detail = 'Ymax=' + fmt(Ymax / 1000, 3) + 'mm，Ymin=' + fmt((-Xmax) / 1000, 3) + 'mm'; }
      else { fitType = '过渡配合'; detail = 'Xmax=' + fmt(Xmax / 1000, 3) + 'mm，Ymax=' + fmt(Ymax / 1000, 3) + 'mm'; }
      var expect = FIT_TYPE_NAME[v.fitType] || '';
      var match = expect && expect === fitType;
      return {
        sections: [
          { title: '查询结果', rows: [
            { label: 'φ' + fmt(d) + ' ' + hc + hg + '/' + sc + sg, html: '<b>孔</b> ' + devStr(hole.ES) + '/' + devStr(hole.EI) + '　<b>轴</b> ' + devStr(shaft.es) + '/' + devStr(shaft.ei) + ' mm', hl: true },
            { label: '配合类型', value: fitType, hl: true },
            { label: '配合方式校验', value: expect ? (match ? '该配合为' + fitType + '，与所选配合方式一致' : '该配合为' + fitType + '，与所选' + expect + '不一致') : '--' }
          ] },
          { title: '孔（' + hc + hg + '）', rows: [
            { label: '上偏差 ES', value: devStr(hole.ES), unit: 'mm' },
            { label: '下偏差 EI', value: devStr(hole.EI), unit: 'mm' },
            { label: '最大/最小极限尺寸', value: fmt(d + hole.ES / 1000, 4) + ' / ' + fmt(d + hole.EI / 1000, 4), unit: 'mm' },
            { label: '标准公差 IT' + hg, value: hole.it, unit: 'μm' }
          ] },
          { title: '轴（' + sc + sg + '）', rows: [
            { label: '上偏差 es', value: devStr(shaft.es), unit: 'mm' },
            { label: '下偏差 ei', value: devStr(shaft.ei), unit: 'mm' },
            { label: '最大/最小极限尺寸', value: fmt(d + shaft.es / 1000, 4) + ' / ' + fmt(d + shaft.ei / 1000, 4), unit: 'mm' },
            { label: '标准公差 IT' + sg, value: shaft.it, unit: 'μm' }
          ] },
          { title: '配合性质', rows: [
            { label: '最大间隙 Xmax', value: Xmax / 1000, unit: 'mm', d: 4 },
            { label: '最大过盈 Ymax', value: Ymax / 1000, unit: 'mm', d: 4 },
            { label: '配合公差 Tf', value: (hole.it + shaft.it) / 1000, unit: 'mm', d: 4 }
          ] }
        ],
        verdict: { level: match ? 'ok' : 'warn', text: 'φ' + fmt(d) + ' ' + hc + hg + '/' + sc + sg + ' 为' + fitType + '：' + detail },
        notes: [
          '数据严格参照 GB/T 1800（基本尺寸至 500mm）。',
          '优先配合键盘根据 GB/T 1800.1—2020：基于经济因素，配合应优先选择键盘中所示的公差带代号。'
        ]
      };
    },
    formulas: [
      'Xmax = ES − ei；Ymax = es − EI；Tf = IT孔 + IT轴',
      '间隙配合：孔公差带在轴公差带之上；过盈配合：孔公差带在轴公差带之下；过渡配合：两者交叠',
      '孔、轴偏差计算规则与公差查询工具一致（GB/T 1800.1/1800.3）'
    ],
    reference: 'GB/T 1800.1、GB/T 1800.2《产品几何技术规范(GPS) 线性尺寸公差》；优先配合键盘布局参照 mechtool.cn 配合查询。'
  });
})();
