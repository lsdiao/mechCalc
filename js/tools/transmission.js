/* =========================================================
 * 机械传动类工具
 * 1. V带传动设计
 * 2. 渐开线圆柱齿轮几何计算
 * 依据：GB/T 13575.1《普通 V 带传动》、GB/T 1357、GB/T 2362
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  /* ---------- V带数据（GB/T 13575.1 近似） ---------- */
  var VBELT = {
    Y: { dmin: 20, p0v: [[4, 0.06], [6, 0.12], [8, 0.19], [10, 0.24], [12, 0.28], [14, 0.30]], kb: 0.0101, L0: 450, Ls: [200, 224, 250, 280, 315, 355, 400, 450, 500] },
    A: { dmin: 75, p0v: [[4, 0.70], [6, 0.97], [8, 1.18], [10, 1.39], [12, 1.60], [15, 1.84], [18, 1.98], [20, 2.01], [22, 1.97], [25, 1.72], [28, 1.22]], kb: 0.7727, L0: 1700, Ls: [630, 700, 790, 890, 990, 1100, 1250, 1430, 1550, 1640, 1750, 1940, 2050, 2200, 2300, 2480, 2700] },
    B: { dmin: 125, p0v: [[5, 1.02], [8, 1.80], [10, 2.20], [12, 2.55], [15, 2.95], [18, 3.20], [20, 3.23], [22, 3.15], [25, 2.68], [28, 1.90]], kb: 1.9875, L0: 2240, Ls: [930, 1000, 1100, 1210, 1370, 1560, 1760, 1950, 2180, 2300, 2500, 2700] },
    C: { dmin: 200, p0v: [[8, 2.75], [10, 3.60], [12, 4.30], [15, 5.15], [18, 5.80], [20, 6.00], [22, 5.90], [25, 5.20], [28, 3.90]], kb: 3.6232, L0: 3750, Ls: [1560, 1760, 1950, 2180, 2300, 2500, 2700, 2870, 3200, 3600, 4060, 4430, 4820, 5370] },
    D: { dmin: 355, p0v: [[10, 6.00], [12, 7.60], [15, 9.30], [18, 10.7], [20, 11.4], [22, 11.5], [25, 10.5], [28, 8.60]], kb: 6.7314, L0: 6300, Ls: [3120, 3300, 3730, 4080, 4420, 4820, 5370, 6070, 6820, 7600] },
    E: { dmin: 500, p0v: [[10, 9.50], [12, 12.5], [15, 16.0], [18, 18.6], [20, 19.9], [22, 20.2], [25, 18.5], [28, 15.0]], kb: 10.3802, L0: 7100, Ls: [4570, 5020, 5570, 6120, 6820, 7620, 8570, 9570, 10770] }
  };
  /* 包角修正系数 Kα 查表插值 */
  var KA_TAB = [[180, 1.00], [175, 0.99], [170, 0.98], [165, 0.96], [160, 0.95], [155, 0.93], [150, 0.92], [145, 0.90], [140, 0.89], [135, 0.88], [130, 0.86], [125, 0.84], [120, 0.82], [115, 0.80], [110, 0.78], [105, 0.76], [100, 0.74], [95, 0.72], [90, 0.69]];
  function wrapFactor(alpha) {
    if (alpha >= 180) return 1.0;
    if (alpha <= 90) return 0.69;
    for (var i = 0; i < KA_TAB.length - 1; i++) {
      var a = KA_TAB[i], b = KA_TAB[i + 1];
      if (alpha <= a[0] && alpha >= b[0]) return a[1] - (a[0] - alpha) / (a[0] - b[0]) * (a[1] - b[1]);
    }
    return 0.69;
  }
  function interp(table, x) {
    if (x <= table[0][0]) return table[0][1];
    for (var i = 0; i < table.length - 1; i++) {
      var a = table[i], b = table[i + 1];
      if (x >= a[0] && x <= b[0]) return a[1] + (x - a[0]) / (b[0] - a[0]) * (b[1] - a[1]);
    }
    return table[table.length - 1][1];
  }
  function nearLen(Ls, L) {
    var best = Ls[0];
    for (var i = 0; i < Ls.length; i++) if (Math.abs(Ls[i] - L) < Math.abs(best - L)) best = Ls[i];
    return best;
  }

  /* ============ 1. V带传动设计 ============ */
  App.registerTool({
    id: 'v-belt',
    name: 'V带传动设计',
    category: 'trans',
    keywords: 'V带 三角带 带传动 带轮 包角 带长 根数 中心距',
    brief: '普通V带传动几何与承载计算：带轮直径、带速、基准长度、中心距、包角与所需根数。',
    doc: '输入功率、转速与传动比，自动推荐带型并完成几何计算（带速、基准长度、中心距、包角），按 GB/T 13575.1 近似公式估算<b>所需带根数</b>。单根额定功率 P0 为近似插值，精确值请查标准表。',
    inputs: [
      { key: 'P', label: '传递功率 P', group: '传动要求', type: 'number', unit: 'kW', default: 4, step: 'any' },
      { key: 'n1', label: '小带轮转速 n₁', group: '传动要求', type: 'number', unit: 'r/min', default: 1440, step: 'any' },
      { key: 'i', label: '传动比 i', group: '传动要求', type: 'number', default: 2.5, step: 'any', hint: 'i < 7，超过时建议两级传动' },
      { key: 'KA', label: '工况系数 KA', group: '传动要求', type: 'select', options: [
        { v: '1.1', t: '1.0~1.2 载荷平稳（风机、离心泵）' },
        { v: '1.3', t: '1.2~1.4 载荷变动小（机床、带式输送机）' },
        { v: '1.5', t: '1.4~1.6 载荷变动较大（压缩机、往复泵）' },
        { v: '1.8', t: '1.7~1.9 载荷冲击大（破碎机、冲剪机）' }
      ], default: '1.3' },
      { key: 'beltType', label: '带型', group: '带轮参数', type: 'select', options: [
        { v: 'auto', t: '自动推荐（按设计功率与转速）' },
        { v: 'Y', t: 'Y 型（最小 dd1=20mm）' }, { v: 'A', t: 'A 型（最小 dd1=75mm）' },
        { v: 'B', t: 'B 型（最小 dd1=125mm）' }, { v: 'C', t: 'C 型（最小 dd1=200mm）' },
        { v: 'D', t: 'D 型（最小 dd1=355mm）' }, { v: 'E', t: 'E 型（最小 dd1=500mm）' }
      ], default: 'auto' },
      { key: 'dd1', label: '小带轮基准直径 dd1', group: '带轮参数', type: 'number', unit: 'mm', default: 100, step: 'any', hint: '≥带型最小直径，取大可减小带根数' },
      { key: 'aRatio', label: '初定中心距系数', group: '带轮参数', type: 'select', options: [
        { v: '0.7', t: 'a₀=0.7(dd1+dd2) 最紧凑' }, { v: '1.0', t: 'a₀=1.0(dd1+dd2) 常规' }, { v: '1.5', t: 'a₀=1.5(dd1+dd2) 宽松' }
      ], default: '1.0' }
    ],
    compute: function (v) {
      var P = +v.P, n1 = +v.n1, i = +v.i, KA = +v.KA;
      if (!(P > 0) || !(n1 > 0) || !(i > 0)) return { error: '请完整输入功率、转速与传动比' };
      var Pd = KA * P;
      // 自动选带型：按 GB/T 13575.1 选型图近似分界
      var type;
      if (v.beltType === 'auto') {
        if (Pd >= 90 || (Pd > 40 && n1 < 400)) type = 'E';
        else if (Pd > 32 || (Pd > 18 && n1 < 500)) type = 'D';
        else if (Pd > 12 || (Pd > 7 && n1 < 600)) type = 'C';
        else if (Pd > 3.5 || (Pd > 2 && n1 < 800)) type = 'B';
        else if (Pd > 0.8) type = 'A';
        else type = 'Y';
      } else type = v.beltType;
      var bt = VBELT[type];
      var dd1 = Math.max(+v.dd1, bt.dmin);
      var dd2 = i * dd1;
      var vms = Math.PI * dd1 * n1 / 60000;             // 带速 m/s
      if (vms > 30) return { error: '带速 ' + fmt(vms, 1) + ' m/s 超过许用值 25~30 m/s，请减小小带轮直径' };
      var a0 = (+v.aRatio) * (dd1 + dd2);
      var Ld0 = 2 * a0 + Math.PI / 2 * (dd1 + dd2) + Math.pow(dd2 - dd1, 2) / (4 * a0); // 需要的基准长度
      var Ld = nearLen(bt.Ls, Ld0);                     // 标准基准长度
      var a = a0 + (Ld - Ld0) / 2;                      // 实际中心距
      var aMin = a - 0.015 * Ld, aMax = a + 0.03 * Ld;
      var alpha1 = 180 - (dd2 - dd1) / a * 57.3;        // 小轮包角
      var Kalpha = wrapFactor(alpha1);
      var P0 = interp(bt.p0v, vms);                     // 单根基本额定功率（近似）
      var dP0 = bt.kb * 1e-3 * n1 * (1 - 1 / i);        // 额定功率增量（近似式）
      var KL = Math.pow(Ld / bt.L0, 0.15);              // 带长修正（近似）
      var Pca = (P0 + dP0) * Kalpha * KL;               // 单根许用功率
      if (Pca <= 0) return { error: '单根带许用功率计算异常，请检查带型选择' };
      var z = Pd / Pca;
      var zR = Math.ceil(z);
      var F0 = 500 * Pd / (zR * vms) * (2.5 / Kalpha - 1) + 0.1 * vms * vms; // 单根初拉力近似（q≈0.1kg/m）
      var Fp = 1000 * Pd / vms;                         // 有效拉力 N
      var Q = 2 * F0 * zR * Math.sin(alpha1 / 2 * Math.PI / 180); // 压轴力
      return {
        sections: [
          { title: '设计功率与带型', rows: [
            { label: '设计功率 Pd=KA·P', value: Pd, unit: 'kW', hl: true },
            { label: '推荐/选用带型', value: type, hl: true },
            { label: '带型最小 dd1', value: bt.dmin, unit: 'mm', d: 0 }
          ] },
          { title: '几何参数', rows: [
            { label: '小带轮直径 dd1', value: dd1, unit: 'mm', hl: true },
            { label: '大带轮直径 dd2=i·dd1', value: dd2, unit: 'mm', hl: true },
            { label: '带速 v', value: vms, unit: 'm/s', d: 2, hl: true },
            { label: '基准长度（计算值）', value: Ld0, unit: 'mm', d: 1 },
            { label: '选用基准长度 Ld', value: Ld, unit: 'mm', hl: true },
            { label: '实际中心距 a', value: a, unit: 'mm', d: 1 },
            { label: '中心距调整范围', html: fmt(aMin, 0) + ' ~ ' + fmt(aMax, 0) + ' mm' },
            { label: '小轮包角 α₁', value: alpha1, unit: '°', d: 1, hl: true },
            { label: '包角修正系数 Kα', value: Kalpha, d: 3 }
          ] },
          { title: '承载能力', rows: [
            { label: '单根额定功率 P0（近似）', value: P0, unit: 'kW', d: 2 },
            { label: '额定功率增量 ΔP0', value: dP0, unit: 'kW', d: 3 },
            { label: '带长修正系数 KL（近似）', value: KL, d: 3 },
            { label: '单根许用功率', value: Pca, unit: 'kW', d: 2 },
            { label: '计算根数 z', value: z, d: 2 },
            { label: '选用根数', value: zR, unit: '根', hl: true },
            { label: '单根初拉力 F₀（估算）', value: F0, unit: 'N', d: 1 },
            { label: '作用在轴上的力 Q', value: Q, unit: 'N', d: 1 }
          ] }
        ],
        verdict: {
          level: zR > 8 ? 'warn' : 'ok',
          text: zR > 8
            ? '所需根数 ' + zR + ' 超过 8 根，建议加大带轮直径或改用 C 型以上带型/两级传动'
            : '共需 ' + type + ' 型带 ' + zR + ' 根，基准长度 ' + fmt(Ld) + ' mm',
          note: 'V带根数一般不超过 8~10 根，否则载荷分配不均。'
        },
        notes: [
          '单根额定功率 P0 按 GB/T 13575.1 表格插值近似，ΔP0 用 Kb·n₁·(1-1/Ki) 近似，精确值请查标准。',
          '包角 α₁ 不应小于 120°，否则应增大中心距或增设张紧轮。',
          'dd1 允许时取大些：带速在 10~20 m/s 区间传动能力最佳。',
          '初拉力估算取每米带质量 q≈0.1kg/m 的量级近似，精确值按带型查表。'
        ]
      };
    },
    formulas: [
      'Pd = KA·P；Ld0 = 2a₀ + π(dd1+dd2)/2 + (dd2-dd1)²/(4a₀)',
      'a ≈ a₀ + (Ld-Ld0)/2；α₁ = 180°-(dd2-dd1)/a×57.3°',
      'z = Pd / [(P0+ΔP0)·Kα·KL]'
    ],
    reference: 'GB/T 13575.1-2008《普通 V 带传动 第1部分：基准宽度制》；《机械设计》第九版 第八章带传动。'
  });

  /* ============ 2. 渐开线圆柱齿轮几何计算 ============ */
  function inv(x) { return Math.tan(x) - x; } // 渐开线函数，x 为弧度

  App.registerTool({
    id: 'involute-gear',
    name: '渐开线圆柱齿轮几何计算',
    category: 'trans',
    keywords: '齿轮 渐开线 模数 齿数 分度圆 齿顶圆 公法线 变位 螺旋角',
    brief: '标准/变位直齿与斜齿圆柱齿轮的几何尺寸、中心距与公法线长度计算。',
    doc: '按 GB/T 1357 标准模数与 GB/T 2363 渐开线圆柱齿轮基本齿廓，计算直齿/斜齿、标准/变位齿轮的分度圆、齿顶/齿根圆、基圆、中心距（变位后无侧隙啮合角法）及<b>公法线长度</b>测量尺寸。',
    inputs: [
      { key: 'm', label: '法面模数 mn', group: '基本参数', type: 'number', unit: 'mm', default: 2, step: 'any' },
      { key: 'z1', label: '小齿轮齿数 z₁', group: '基本参数', type: 'number', default: 20, step: 'any' },
      { key: 'z2', label: '大齿轮齿数 z₂', group: '基本参数', type: 'number', default: 60, step: 'any' },
      { key: 'alpha', label: '法面压力角 αn', group: '基本参数', type: 'select', options: [
        { v: '20', t: '20°（标准）' }, { v: '15', t: '15°' }, { v: '14.5', t: '14.5°（英制习惯）' }
      ], default: '20' },
      { key: 'beta', label: '螺旋角 β', group: '基本参数', type: 'number', unit: '°', default: 0, step: 'any', hint: '0 为直齿轮；斜齿常取 8°~20°' },
      { key: 'profile', label: '齿制', group: '基本参数', type: 'select', options: [
        { v: '1', t: '正常齿：ha*=1.0，c*=0.25' }, { v: '0.8', t: '短齿：ha*=0.8，c*=0.30' }
      ], default: '1' },
      { key: 'x1', label: '小轮变位系数 x₁', group: '变位系数（可选）', type: 'number', default: 0, step: 'any' },
      { key: 'x2', label: '大轮变位系数 x₂', group: '变位系数（可选）', type: 'number', default: 0, step: 'any' }
    ],
    compute: function (v) {
      var m = +v.m, z1 = Math.round(+v.z1), z2 = Math.round(+v.z2);
      if (!(m > 0)) return { error: '请输入模数' };
      if (!(z1 >= 6) || !(z2 >= 6)) return { error: '齿数过小（最小齿数建议 ≥ 6，标准直齿不根切 z≥17）' };
      var alphaN = (+v.alpha) * Math.PI / 180;
      var beta = (+v.beta) * Math.PI / 180;
      var has = Math.abs(+v.beta) > 0.01;
      var haStar = +v.profile, cStar = +v.profile === 1 ? 0.25 : 0.3;
      var x1 = +v.x1 || 0, x2 = +v.x2 || 0;

      var mt = m / Math.cos(beta);                 // 端面模数
      var alphaT = Math.atan(Math.tan(alphaN) / Math.cos(beta)); // 端面压力角
      var d1 = mt * z1, d2 = mt * z2;              // 分度圆
      var aStd = (d1 + d2) / 2;                    // 标准中心距
      var da1 = d1 + 2 * (haStar + x1) * m;
      var da2 = d2 + 2 * (haStar + x2) * m;
      var df1 = d1 - 2 * (haStar + cStar - x1) * m;
      var df2 = d2 - 2 * (haStar + cStar - x2) * m;
      var h = (2 * haStar + cStar) * m - (x1 + x2) * m * 0; // 全齿高（标准齿制）
      var db1 = d1 * Math.cos(alphaT), db2 = d2 * Math.cos(alphaT);

      // 变位中心距（无侧隙啮合）
      var aAct = aStd, alphaW = alphaT, y = 0;
      if (Math.abs(x1 + x2) > 1e-9) {
        var invW = inv(alphaT) + 2 * (x1 + x2) * Math.tan(alphaN) / (z1 + z2);
        // 求解 inv(α') = invW 的啮合角 α'
        var lo = 0.01, hi = Math.PI / 2 - 0.01;
        for (var it = 0; it < 60; it++) {
          var mid = (lo + hi) / 2;
          if (inv(mid) < invW) lo = mid; else hi = mid;
        }
        alphaW = (lo + hi) / 2;
        aAct = aStd * Math.cos(alphaT) / Math.cos(alphaW);
        y = (aAct - aStd) / m;
      }
      var cActual = (aAct - aStd) - (x1 + x2 - y) * m; // 实际顶隙变化（提示用）

      // 公法线长度（法面）
      var invX = has ? inv(alphaT) : inv(alphaN);
      var k1 = Math.round(z1 / 9 + 0.5), k2 = Math.round(z2 / 9 + 0.5);
      var W1, W2;
      if (has) {
        var zv1 = z1 / Math.pow(Math.cos(beta), 3), zv2 = z2 / Math.pow(Math.cos(beta), 3);
        k1 = Math.round(zv1 / 9 + 0.5); k2 = Math.round(zv2 / 9 + 0.5);
        W1 = m * Math.cos(alphaN) * (Math.PI * (k1 - 0.5) + z1 * invX) + 2 * x1 * m * Math.sin(alphaN);
        W2 = m * Math.cos(alphaN) * (Math.PI * (k2 - 0.5) + z2 * invX) + 2 * x2 * m * Math.sin(alphaN);
      } else {
        W1 = m * Math.cos(alphaN) * (Math.PI * (k1 - 0.5) + z1 * inv(alphaN)) + 2 * x1 * m * Math.sin(alphaN);
        W2 = m * Math.cos(alphaN) * (Math.PI * (k2 - 0.5) + z2 * inv(alphaN)) + 2 * x2 * m * Math.sin(alphaN);
      }
      var u = z2 / z1;
      return {
        sections: [
          { title: '分度圆与中心距', rows: [
            { label: '端面模数 mt', value: mt, unit: 'mm', d: 4 },
            { label: '端面压力角 αt', value: alphaT * 180 / Math.PI, unit: '°', d: 3 },
            { label: '小轮分度圆 d₁', value: d1, unit: 'mm', hl: true },
            { label: '大轮分度圆 d₂', value: d2, unit: 'mm', hl: true },
            { label: '标准中心距 a', value: aStd, unit: 'mm', hl: true },
            { label: '齿数比 u=z₂/z₁', value: u, d: 3 }
          ] },
          { title: '齿顶与齿根', rows: [
            { label: '小轮齿顶圆 da₁', value: da1, unit: 'mm', hl: true },
            { label: '大轮齿顶圆 da₂', value: da2, unit: 'mm', hl: true },
            { label: '小轮齿根圆 df₁', value: df1, unit: 'mm', d: 3 },
            { label: '大轮齿根圆 df₂', value: df2, unit: 'mm', d: 3 },
            { label: '全齿高 h', value: h, unit: 'mm', d: 3 },
            { label: '小轮基圆 db₁', value: db1, unit: 'mm', d: 3 },
            { label: '大轮基圆 db₂', value: db2, unit: 'mm', d: 3 }
          ] },
          { title: '变位与实际中心距', rows: [
            { label: '变位系数和 x₁+x₂', value: x1 + x2, d: 3, unit: '' },
            { label: '啮合角 α′', value: alphaW * 180 / Math.PI, unit: '°', d: 3 },
            { label: '实际中心距 a′', value: aAct, unit: 'mm', hl: true },
            { label: '中心距变动系数 y', value: y, d: 4 }
          ] },
          { title: '公法线长度（测量尺寸）', rows: [
            { label: '小轮跨测齿数 k₁', value: k1, unit: '齿' },
            { label: '小轮公法线 W₁', value: W1, unit: 'mm', d: 4, hl: true },
            { label: '大轮跨测齿数 k₂', value: k2, unit: '齿' },
            { label: '大轮公法线 W₂', value: W2, unit: 'mm', d: 4, hl: true }
          ] }
        ],
        verdict: {
          level: 'ok',
          text: (has ? '斜齿' : '直齿') + '圆柱齿轮几何计算完成：a=' + fmt(aStd, 3) + 'mm' + (Math.abs(x1 + x2) > 1e-9 ? '，变位后 a′=' + fmt(aAct, 3) + 'mm' : '')
        },
        notes: [
          '公法线长度公式（直齿）：Wk = m·cosα·[π(k-0.5)+z·invα]+2x·m·sinα；斜齿按当量齿数 zv=z/cos³β 计算，测量于法面。',
          '变位齿轮中心距按无侧隙啮合方程 inv α′ = inv αt + 2(x₁+x₂)tanαn/(z₁+z₂) 迭代求解。',
          '标准直齿轮不根切最小齿数 zmin=17；z<17 时应采用正变位（x≥(17-z)/17）。',
          '齿顶圆直径按变位后 da=d+2(ha*+x)m 计算，高变位（x1=-x2）时中心距不变。'
        ]
      };
    },
    formulas: [
      'd = mt·z = mn·z/cosβ；da = d + 2(ha*+x)·mn',
      'inv α′ = inv αt + 2(x₁+x₂)·tanαn/(z₁+z₂)；a′ = a·cosαt/cosα′',
      'Wk = mn·cosαn·[π(k-0.5)+zv·invα] + 2x·mn·sinαn，k ≈ zv/9+0.5'
    ],
    reference: 'GB/T 1357《通用机械和重型机械用圆柱齿轮 模数》、GB/T 2821《齿轮几何要素代号》；《机械设计》第九版 第十章。'
  });
})();
