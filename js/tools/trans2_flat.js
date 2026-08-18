/* =========================================================
 * 普通平带传动设计计算（1:1 复刻 mechtool.cn 平带设计工具）
 * 数据依据：《机械设计手册》表13-1-68~13-1-76、GB/T 524-2007
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  /* ---------- 舍入 ---------- */
  function r1(x) { return Math.round(x * 10) / 10; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function r3(x) { return Math.round(x * 1000) / 1000; }

  /* ---------- 标准系列（内嵌） ---------- */
  /* 平带轮标准直径系列（表"平带轮的直径、结构形式和辐板厚度"） */
  var D_STD = [20, 25, 32, 40, 45, 50, 56, 63, 71, 80, 90, 100, 112, 125, 140, 160, 180, 200, 224, 250, 280, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1120, 1250, 1400, 1600, 1800, 2000];
  /* 平带内周长度标准系列（优选系列 + 第二系列） */
  var LI_STD = [500, 530, 560, 600, 630, 670, 710, 750, 800, 850, 900, 950, 1000, 1060, 1120, 1180, 1250, 1320, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2240, 2500, 2800, 3150, 3550, 4000, 4500, 5000];
  /* 胶帆布平带带厚标准值（层数z=3~12） */
  var DELTA_ORD = [3.6, 4.8, 6.0, 7.2, 8.4, 9.6, 10.8, 12.0, 13.2, 14.4];
  /* 尼龙片复合平带总厚标准值（LL/LR(LT)/RR 系列 data-value，升序） */
  var DELTA_NYLON = [1.6, 1.8, 1.9, 2.0, 2.3, 2.4, 2.5, 2.8, 2.9, 3.2, 3.4, 3.7, 4.0, 4.2, 4.5, 4.8, 5.2, 6.0];
  /* 标准带宽系列（表"平带宽度公称值"） */
  var B_STD = [16, 20, 25, 32, 40, 50, 63, 71, 80, 90, 100, 112, 125, 140, 160, 180, 200, 224, 250, 280, 315, 355, 400, 450, 500];

  /* 表13-1-70 胶帆布平带单位截面积传递的基本额定功率 P0（kW/cm²）
   * α=180°、载荷平稳、预紧应力 σ0=1.8MPa，仅适用于 b<300mm */
  var P0_V = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30];
  var P0_D = [30, 35, 40, 50, 75, 100];
  var P0_TAB = [
    [1.1, 1.3, 1.5, 1.7, 1.9, 2.1, 2.3, 2.5, 2.7, 2.9, 3, 3.2, 3.3, 3.5, 3.6, 3.7, 4, 4.1, 4.3, 4.3, 4.3],
    [1.1, 1.3, 1.5, 1.7, 2, 2.2, 2.4, 2.5, 2.7, 2.9, 3.1, 3.2, 3.4, 3.6, 3.7, 3.8, 4, 4.1, 4.3, 4.4, 4.4],
    [1.1, 1.3, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 2.9, 3.1, 3.3, 3.4, 3.6, 3.7, 3.9, 4.1, 4.3, 4.4, 4.4, 4.5],
    [1.2, 1.4, 1.6, 1.8, 2.1, 2.3, 2.5, 2.6, 2.8, 3, 3.2, 3.4, 3.5, 3.7, 3.8, 4, 4.2, 4.4, 4.5, 4.5, 4.6],
    [1.2, 1.4, 1.7, 1.9, 2.1, 2.3, 2.5, 2.7, 2.9, 3.1, 3.3, 3.5, 3.6, 3.8, 3.9, 4.1, 4.3, 4.5, 4.6, 4.7, 4.7],
    [1.2, 1.4, 1.7, 1.9, 2.1, 2.4, 2.5, 2.8, 2.9, 3.2, 3.4, 3.6, 3.7, 3.9, 4, 4.1, 4.4, 4.6, 4.7, 4.7, 4.8]
  ];

  /* 表13-1-71 平带传动的包角修正系数 Kα */
  var KALPHA = [[120, 0.82], [130, 0.85], [140, 0.88], [150, 0.91], [160, 0.94], [170, 0.97], [180, 1], [190, 1.05], [200, 1.1], [210, 1.15], [220, 1.2]];

  /* 表13-1-72 传动布置系数 Kβ（行=传动布置，列=两轮轴连心线与水平线交角β） */
  var KBETA = { autoTension: [1, 1, 1], simpleOpen: [1, 0.9, 0.8], cross: [0.9, 0.8, 0.7], halfCross: [0.8, 0.7, 0.6] };

  /* 表13-1-76 尼龙片复合平带的基本额定功率 P0（kW/mm，α=180°、载荷平稳、σ0=3MPa）
   * v 节点 [10,15,20,25,30,35,40,45,50,55~60,65,70]，"55~60"按 57.5 插值 */
  var P0N_V = [10, 15, 20, 25, 30, 35, 40, 45, 50, 57.5, 65, 70];
  var P0N = {
    EL: [0.060, 0.089, 0.116, 0.143, 0.166, 0.187, 0.204, 0.219, 0.228, 0.234, 0.230, 0.218],
    L: [0.100, 0.148, 0.194, 0.238, 0.276, 0.312, 0.340, 0.365, 0.380, 0.391, 0.384, 0.364],
    M: [0.140, 0.208, 0.272, 0.333, 0.386, 0.436, 0.476, 0.510, 0.532, 0.547, 0.537, 0.510],
    H: [0.200, 0.297, 0.388, 0.475, 0.552, 0.623, 0.680, 0.729, 0.760, 0.781, 0.767, 0.728],
    EH: [0.280, 0.416, 0.543, 0.665, 0.773, 0.872, 0.952, 1.021, 1.064, 1.093, 1.074, 1.019],
    EEH: [0.400, 0.594, 0.776, 0.950, 1.104, 1.246, 1.360, 1.458, 1.520, 1.562, 1.534, 1.456]
  };
  /* 尼龙带型（LL 系列）对应总厚 δ */
  var NYLON_DELTA = { EL: 2.4, L: 3.2, M: 4.0, H: 4.2, EH: 4.8, EEH: 6.0 };

  /* ---------- 通用插值 / 选型 ---------- */
  function interp1(xs, ys, x) { /* 单调序列线性插值，出界返回 null */
    if (x < xs[0] - 1e-12 || x > xs[xs.length - 1] + 1e-12) return null;
    if (x <= xs[0]) return ys[0];
    if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
    for (var i = 0; i < xs.length - 1; i++) {
      if (x >= xs[i] && x <= xs[i + 1]) {
        var f = (x - xs[i]) / (xs[i + 1] - xs[i]);
        return ys[i] * (1 - f) + ys[i + 1] * f;
      }
    }
    return null;
  }
  function nearest(arr, x) { /* 就近选取（并列取先出现者，与原站一致） */
    var best = null, bd = Infinity;
    for (var i = 0; i < arr.length; i++) {
      var d = Math.abs(arr[i] - x);
      if (d < bd) { bd = d; best = arr[i]; }
    }
    return best;
  }
  function firstAtLeast(arr, x) {
    for (var i = 0; i < arr.length; i++) if (arr[i] >= x) return arr[i];
    return arr.length ? arr[arr.length - 1] : null;
  }

  /* ---------- 与原站 API 一致的分步计算 ---------- */
  /* flatbeltKAlphaQuery：α∈[120,220] 表13-1-71 线性插值，3位小数 */
  function kAlphaQuery(alpha1) {
    var xs = KALPHA.map(function (r) { return r[0]; });
    var ys = KALPHA.map(function (r) { return r[1]; });
    var v = interp1(xs, ys, alpha1);
    return v === null ? null : r3(v);
  }
  /* flatbeltP0Query（ordinary）：表13-1-70 双线性插值 × σ0 修正；d1/δ∈[30,100]、v∈[5,30]
   * 插值顺序：先按 d1/δ 在两行间插出 v 节点值、再按 v 插值（与原站浮点结果一致）；
   * σ0=1.8 返回未舍入原值，σ0≠1.8 时 ×(1+0.39(σ0−1.8)) 后保留 3 位小数（经 API 探针验证） */
  function p0Ordinary(d1OverDelta, v, sigma0) {
    if (d1OverDelta < 30 || d1OverDelta > 100 || v < 5 || v > 30) return null;
    if (v <= P0_V[0]) v = P0_V[0];
    if (v >= P0_V[P0_V.length - 1]) v = P0_V[P0_V.length - 1];
    var vi = 0;
    while (vi < P0_V.length - 2 && v > P0_V[vi + 1]) vi++;
    var fv = (v - P0_V[vi]) / (P0_V[vi + 1] - P0_V[vi]);
    function atD(col) { /* 在 d1/δ 方向插值（出界取端行） */
      if (d1OverDelta <= P0_D[0]) return P0_TAB[0][col];
      if (d1OverDelta >= P0_D[P0_D.length - 1]) return P0_TAB[P0_TAB.length - 1][col];
      for (var i = 0; i < P0_D.length - 1; i++) {
        if (d1OverDelta >= P0_D[i] && d1OverDelta <= P0_D[i + 1]) {
          var fd = (d1OverDelta - P0_D[i]) / (P0_D[i + 1] - P0_D[i]);
          return P0_TAB[i][col] * (1 - fd) + P0_TAB[i + 1][col] * fd;
        }
      }
      return null;
    }
    var lo = atD(vi), hi = atD(vi + 1);
    if (lo === null || hi === null) return null;
    var p0 = lo + fv * (hi - lo);
    if (Math.abs(sigma0 - 1.8) > 1e-12) p0 = r3(p0 * (1 + 0.39 * (sigma0 - 1.8)));
    return p0;
  }
  /* flatbeltP0Query（nylon）：表13-1-76 按 v 线性插值，返回原始精度；v∈[10,70] */
  function p0Nylon(beltType, v) {
    var row = P0N[beltType];
    if (!row) return null;
    var val = interp1(P0N_V, row, v);
    return val === null ? null : val;
  }
  /* 计算带长 L0 与包角 α1（未圆整） */
  function beltLen0(d1, d2, a, type) {
    var base = 2 * a + Math.PI / 2 * (d1 + d2);
    if (type === 'cross') return base + Math.pow(d1 + d2, 2) / (4 * a);
    if (type === 'halfCross') return base + (d1 * d1 + d2 * d2) / (4 * a);
    return base + Math.pow(d2 - d1, 2) / (4 * a); /* open */
  }
  function alpha1Cal(d1, d2, a, type) {
    if (type === 'cross') return 180 + (d1 + d2) / a * 57.3;
    if (type === 'halfCross') return 180 + d1 / a * 57.3;
    return 180 - (d2 - d1) / a * 57.3; /* open */
  }
  /* flatbelt1 */
  function belt1(d1, d2, a0, type) {
    var L0 = beltLen0(d1, d2, a0, type);
    var a1 = alpha1Cal(d1, d2, a0, type);
    var kA = kAlphaQuery(r2(a1));
    if (kA === null) return null;
    return { a: r2(a0), calBeltLen: r2(L0), alpha1: r2(a1), kAlpha: kA };
  }
  /* flatbeltAlpha1 */
  function alpha1Query(d1, d2, a, type) {
    var a1 = r2(alpha1Cal(d1, d2, a, type));
    var kA = kAlphaQuery(a1);
    if (kA === null) return null;
    return { alpha1: a1, kAlpha: kA };
  }
  /* flatbelt2：ordinary→{A(cm²),b,Fr}；nylon→{b,Fr}；均 2 位小数，中间量不舍入 */
  function belt2(Pd, P0, kAlpha, kBeta, category, delta, alpha1, sigma0) {
    var sinHalf = Math.sin(alpha1 / 2 * Math.PI / 180);
    if (category === 'nylon') {
      var bRaw = Pd / (P0 * kAlpha * kBeta);
      return { b: r2(bRaw), Fr: r2(2 * sigma0 * bRaw * delta * sinHalf) };
    }
    var A = Pd / (P0 * kAlpha * kBeta); /* cm² */
    var b = 100 * A / delta;            /* mm */
    return { A: r2(A), b: r2(b), Fr: r2(2 * sigma0 * A * 100 * sinHalf) };
  }

  /* ---------- 工具注册 ---------- */
  App.registerTool({
    id: 'flat-belt-design',
    name: '普通平带传动设计计算',
    category: 'trans',
    keywords: '平带 带传动 胶帆布平带 尼龙片复合平带 带宽 压轴力 包角 轴间距 带厚',
    brief: '普通胶帆布平带 / 尼龙片复合平带传动设计：带轮直径、带长、带宽与压轴力全流程计算。',
    doc: '按《机械设计手册》表13-1-68 流程复刻 mechtool.cn 平带设计工具：d1=C·∛(P/n₁) 系数法选标准直径 → d2=i·d1·(1−ε) → 轴间距 a₀∈[1.5, 5](d₁+d₂) → 按传动形式（开口/交叉/半交叉）计算带长 L₀ 与包角 α₁ → 选标准内周长度 Lᵢ → <b>胶帆布平带按表13-1-70 双线性插值取 P0（σ0 线性修正）、尼龙片平带按表13-1-76 取 P0</b> → A=Pd/(P0·Kα·Kβ) → 圆整标准带宽 → 压轴力 Fr=2σ₀A·sin(α₁/2)。所有中间量与原站 API 逐字段一致。',
    inputs: [
      { key: 'P', label: '传动功率 P', group: '输入初始参数', type: 'number', unit: 'kW', default: 5, step: 'any' },
      { key: 'n1', label: '主动轴转速 n₁', group: '输入初始参数', type: 'number', unit: 'r/min', default: 1460, step: 'any' },
      { key: 'n2', label: '从动轴转速 n₂', group: '输入初始参数', type: 'number', unit: 'r/min', default: 400, step: 'any' },
      { key: 'i', label: '传动比 i（留空自动）', group: '输入初始参数', type: 'number', default: '', step: 'any', hint: '留空按 i=n₁/n₂ 计算（3位小数）' },
      { key: 'KA', label: '工况系数 KA', group: '选定带型和带轮直径', type: 'number', default: 1.5, step: 'any', hint: '查表13-1-69 工况系数，载荷平稳取小值' },
      { key: 'eps', label: '弹性滑动率 ε', group: '选定带型和带轮直径', type: 'number', default: 0.01, step: 'any', hint: '取 0.01~0.02' },
      { key: 'd1Coeff', label: '小带轮直径系数 C', group: '选定带型和带轮直径', type: 'select', options: [
        { v: '1100', t: '1100' }, { v: '1150', t: '1150' }, { v: '1200', t: '1200' },
        { v: '1250', t: '1250' }, { v: '1300', t: '1300' }, { v: '1350', t: '1350' }
      ], default: '1250' },
      { key: 'd1', label: '小带轮直径 d₁（留空自动）', group: '选定带型和带轮直径', type: 'number', unit: 'mm', default: '', step: 'any', hint: '留空取 C·∛(P/n₁) 就近标准值（20~2000）' },
      { key: 'd2', label: '大带轮直径 d₂（留空自动）', group: '选定带型和带轮直径', type: 'number', unit: 'mm', default: '', step: 'any', hint: '留空取 i·d₁·(1−ε) 就近标准值' },
      { key: 'type', label: '传动形式', group: '确定轴间距和带长', type: 'segment', options: [
        { v: 'open', t: '开口传动' }, { v: 'cross', t: '交叉传动' }, { v: 'halfCross', t: '半交叉传动' }
      ] },
      { key: 'a0', label: '初定轴间距 a₀（留空取下限）', group: '确定轴间距和带长', type: 'number', unit: 'mm', default: '', step: 'any', hint: '推荐范围 1.5(d₁+d₂) ≤ a₀ ≤ 5(d₁+d₂)' },
      { key: 'beltCat', label: '平带类型', group: '确定轴间距和带长', type: 'segment', options: [
        { v: 'ordinary', t: '普通胶帆布平带' }, { v: 'nylon', t: '尼龙片复合平带' }
      ] },
      { key: 'nylonType', label: '尼龙带型', group: '确定轴间距和带长', type: 'select', options: [
        { v: 'EL', t: 'EL（LL 总厚 2.4mm）' }, { v: 'L', t: 'L（LL 总厚 3.2mm）' },
        { v: 'M', t: 'M（LL 总厚 4.0mm）' }, { v: 'H', t: 'H（LL 总厚 4.2mm）' },
        { v: 'EH', t: 'EH（LL 总厚 4.8mm）' }, { v: 'EEH', t: 'EEH（LL 总厚 6.0mm）' }
      ], default: 'EL', visible: function (v) { return v.beltCat === 'nylon'; } },
      { key: 'delta', label: '带厚 δ（留空自动）', group: '确定轴间距和带长', type: 'number', unit: 'mm', default: '', step: 'any', hint: '推荐 δ≈d₁/40~d₁/30，自动取标准系列中首个 ≥d₁/40 者' },
      { key: 'li', label: '内周长度 Lᵢ（留空自动）', group: '确定轴间距和带长', type: 'number', unit: 'mm', default: '', step: 'any', hint: '留空取与计算带长 L₀ 就近的标准值（500~5000）' },
      { key: 'm', label: '带轮数 m', group: '确定轴间距和带长', type: 'select', options: [
        { v: '2', t: '2' }, { v: '3', t: '3' }, { v: '4', t: '4' }, { v: '5', t: '5' },
        { v: '6', t: '6' }, { v: '7', t: '7' }, { v: '8', t: '8' }
      ], default: '2' },
      { key: 'sigma0', label: '预紧应力 σ₀', group: '确定带宽和压轴力', type: 'number', unit: 'MPa', default: 1.8, step: 'any', hint: '胶帆布平带推荐 1.8MPa，尼龙片复合平带取 3MPa' },
      { key: 'form', label: '传动布置', group: '确定带宽和压轴力', type: 'select', options: [
        { v: 'autoTension', t: '自动张紧传动' }, { v: 'simpleOpen', t: '简单开口传动（定期张紧或改缝）' },
        { v: 'cross', t: '交叉传动' }, { v: 'halfCross', t: '半交叉传动、有导轮的角度传动' }
      ], default: 'simpleOpen' },
      { key: 'beta', label: '两轮轴连心线与水平线交角 β', group: '确定带宽和压轴力', type: 'select', options: [
        { v: '0_60', t: '0~60°' }, { v: '60_80', t: '60°~80°' }, { v: '80_90', t: '80°~90°' }
      ], default: '0_60' }
    ],
    compute: function (v) {
      var P = +v.P, n1 = +v.n1, n2 = +v.n2, KA = +v.KA, eps = +v.eps, sigma0 = +v.sigma0;
      if (!(P > 0) || !(n1 > 0)) return { error: '请输入传动功率 P 与主动轴转速 n₁' };
      if (!(KA > 0)) return { error: '请输入工况系数 KA' };
      var iIn = v.i === '' || v.i === undefined ? null : +v.i;
      if (iIn === null && !(n2 > 0)) return { error: '请输入从动轴转速 n₂ 或传动比 i' };
      if (iIn !== null && !(iIn > 0)) return { error: '传动比 i 需大于 0' };
      if (!(eps >= 0) || eps > 0.05) return { error: '弹性滑动率 ε 取 0.01~0.02' };
      var i = iIn !== null ? iIn : r3(n1 / n2);
      var Pd = r3(KA * P);
      var type = v.type || 'open';
      var cat = v.beltCat || 'ordinary';

      /* --- 1. 带轮直径与带速 --- */
      var d1Cal = (+v.d1Coeff || 1250) * Math.cbrt(P / n1);
      var d1 = v.d1 !== '' && v.d1 !== undefined && +v.d1 > 0 ? +v.d1 : nearest(D_STD, d1Cal);
      if (!(d1 >= 20) || d1 > 10000) return { error: '小带轮直径 d₁ 请输入 20~10000 之间的数' };
      var vel = r3(Math.PI * d1 * n1 / 60000);           /* 带速（3位小数，与原站显示一致） */
      if (!(vel > 0)) return { error: '带速计算异常，请检查输入' };
      var d2Cal = d1 * i * (1 - eps);
      var d2 = v.d2 !== '' && v.d2 !== undefined && +v.d2 > 0 ? +v.d2 : nearest(D_STD, d2Cal);
      if (!(d2 >= 20) || d2 > 10000) return { error: '大带轮直径 d₂ 请输入 20~10000 之间的数' };

      /* --- 2. 轴间距、带长、包角 --- */
      var a0min = 1.5 * (d1 + d2), a0max = 5 * (d1 + d2);
      var a0 = v.a0 !== '' && v.a0 !== undefined && +v.a0 > 0 ? +v.a0 : r1(a0min);
      if (!(a0 > 0)) return { error: '请输入初定轴间距 a₀' };
      var L0raw = beltLen0(d1, d2, a0, type);
      var L0 = r2(L0raw);                                 /* 计算带长（未考虑接头长度） */

      /* 带厚：留空自动取标准系列中首个 ≥round1(d1/40) 者 */
      var deltaIn = v.delta !== '' && v.delta !== undefined && +v.delta > 0 ? +v.delta : null;
      if (deltaIn !== null && (deltaIn > 20)) return { error: '带厚 δ 请输入 0~20 之间的数' };
      var delta = deltaIn !== null ? deltaIn : firstAtLeast(cat === 'nylon' ? DELTA_NYLON : DELTA_ORD, r1(d1 / 40));
      var d1od = r1(d1 / delta);                          /* d1/δ（1位小数） */

      var LiCal = r2(L0 - Math.PI * delta);               /* 内周长度计算值 */
      var liStd = v.li !== '' && v.li !== undefined && +v.li > 0 ? +v.li : nearest(LI_STD, L0);
      var L = r2(liStd + Math.PI * delta);                /* 实际带长 */
      var a = r2(a0 + (L - L0) / 2);                      /* 实际轴间距 */
      var a1q = alpha1Query(d1, d2, a, type);
      if (!a1q) return { error: '包角 α₁ 超出 Kα 表范围（120°~220°），请增大轴间距 a₀ 或调整带轮直径' };
      var alpha1 = a1q.alpha1, kAlpha = a1q.kAlpha;
      var y = r1(1000 * (+v.m || 2) * vel / L0);          /* 曲挠次数 1/s */

      /* --- 3. 额定功率 P0 与修正系数 --- */
      var P0;
      if (cat === 'nylon') {
        P0 = p0Nylon(v.nylonType || 'EL', vel);
        if (P0 === null) return { error: '带速 v=' + fmt(vel) + ' m/s 超出尼龙片平带 P0 表范围（10~70 m/s）' };
      } else {
        P0 = p0Ordinary(d1od, vel, sigma0);
        if (P0 === null) return { error: 'd₁/δ=' + fmt(d1od) + ' 或带速 v=' + fmt(vel) + ' m/s 超出胶帆布平带 P0 表范围（d₁/δ∈[30,100]、v∈[5,30]）' };
      }
      var betaIdx = v.beta === '60_80' ? 1 : v.beta === '80_90' ? 2 : 0;
      var kBeta = KBETA[v.form || 'simpleOpen'][betaIdx];

      /* --- 4. 截面积、带宽与压轴力 --- */
      var res2 = belt2(Pd, P0, kAlpha, kBeta, cat, delta, alpha1, sigma0);
      var bStd = firstAtLeast(B_STD, res2.b);
      var Frmax = r2(1.5 * res2.Fr);

      /* --- 提示 --- */
      var warns = [];
      if (a0 < r1(a0min) || a0 > a0max) warns.push('初定轴间距 a₀=' + fmt(a0, 1) + ' 超出推荐范围 ' + fmt(r1(a0min), 1) + '~' + fmt(r1(a0max), 1) + ' mm');
      if (a < r1(a0min)) warns.push('标准带长偏短，实际轴间距 a=' + fmt(a, 1) + ' mm 低于推荐下限 ' + fmt(r1(a0min), 1) + ' mm，可增大 a₀ 或选更长带');
      if (vel < 10 || vel > 20) warns.push('带速 v=' + fmt(vel) + ' m/s 偏离最优范围 10~20 m/s');
      if (cat === 'ordinary' && vel > 30) warns.push('胶帆布平带 vmax=30 m/s，带速超限');
      if (cat === 'nylon' && vel < 10) warns.push('尼龙片复合平带 v 宜 >10~15 m/s');
      if (type === 'open' && alpha1 < 150) warns.push('开口传动 α₁=' + fmt(alpha1) + '° < 150°，应增大 a、降低 i 或用张紧轮');
      if (y > 10) warns.push('曲挠次数 y=' + fmt(y, 1) + ' 1/s 超过 ymax=6~10，应减小 d₁ 或缩短带长');
      if (cat === 'ordinary' && bStd >= 315) warns.push('带宽 b=' + bStd + 'mm ≥300mm，超出表13-1-70 适用范围（b<300mm）');

      var typeName = type === 'open' ? '开口' : type === 'cross' ? '交叉' : '半交叉';
      var catName = cat === 'ordinary' ? '胶帆布平带' : '尼龙片复合平带(' + (v.nylonType || 'EL') + ')';

      var secGeo = { title: '轴间距、带长与包角（' + typeName + '传动）', rows: [
        { label: '轴间距推荐范围', html: fmt(r1(a0min), 1) + ' ~ ' + fmt(r1(a0max), 1) + ' mm' },
        { label: '初定轴间距 a₀', value: a0, unit: 'mm', d: 2, hl: true },
        { label: '带厚 δ（标准值）', value: delta, unit: 'mm', d: 1 },
        { label: '计算带长 L₀（未计接头）', value: L0, unit: 'mm', d: 2 },
        { label: '内周长度计算值 Lᵢ=L₀−πδ', value: LiCal, unit: 'mm', d: 2 },
        { label: '选用标准内周长度 Lᵢ', value: liStd, unit: 'mm', hl: true },
        { label: '实际带长 L=Lᵢ+πδ', value: L, unit: 'mm', hl: true },
        { label: '实际轴间距 a=a₀+(L−L₀)/2', value: a, unit: 'mm', d: 2, hl: true },
        { label: '曲挠次数 y=1000mv/L₀', value: y, unit: '1/s', d: 1 },
        { label: '小带轮包角 α₁', value: alpha1, unit: '°', d: 2, hl: true },
        { label: '包角修正系数 Kα（表13-1-71）', value: kAlpha, d: 3 }
      ] };

      var secPow = { title: '额定功率与修正系数', rows: [
        { label: '设计功率 Pd=KA·P', value: Pd, unit: 'kW', d: 3, hl: true },
        { label: '实际传动比 i', value: i, d: 3 }
      ] };
      if (cat === 'ordinary') {
        secPow.rows.push({ label: 'd₁/δ', value: d1od, d: 1 });
        secPow.rows.push({ label: '基本额定功率 P0（表13-1-70 插值×σ₀修正）', value: P0, unit: 'kW/cm²', d: 3, hl: true });
      } else {
        secPow.rows.push({ label: '基本额定功率 P0（表13-1-76，kW/mm）', value: P0, unit: 'kW/mm', d: 4, hl: true });
      }
      secPow.rows.push({ label: '传动布置系数 Kβ（表13-1-72）', value: kBeta, d: 1 });

      var secB = { title: '带宽与压轴力', rows: [] };
      if (cat === 'ordinary') {
        secB.rows.push({ label: '截面积 A=Pd/(P0·Kα·Kβ)', value: res2.A, unit: 'cm²', d: 2, hl: true });
        secB.rows.push({ label: '计算带宽 b=100A/δ', value: res2.b, unit: 'mm', d: 2, hl: true });
      } else {
        secB.rows.push({ label: '计算带宽 b=Pd/(P0·Kα·Kβ)', value: res2.b, unit: 'mm', d: 2, hl: true });
      }
      secB.rows.push({ label: '标准带宽 b（圆整）', value: bStd, unit: 'mm', hl: true });
      secB.rows.push({ label: '压轴力 Fr=2σ₀A·sin(α₁/2)', value: res2.Fr, unit: 'N', d: 2, hl: true });
      secB.rows.push({ label: '压轴力 Frmax=1.5Fr', value: Frmax, unit: 'N', d: 2 });

      return {
        sections: [
          { title: '带轮直径与带速', rows: [
            { label: '小带轮计算直径 d₁ᶜ=C·∛(P/n₁)', value: r1(d1Cal), unit: 'mm', d: 1 },
            { label: '小带轮直径 d₁（标准值）', value: d1, unit: 'mm', hl: true },
            { label: '带速 v=πd₁n₁/60000', value: vel, unit: 'm/s', d: 3, hl: true },
            { label: '大带轮计算直径 d₂ᶜ=i·d₁·(1−ε)', value: r1(d2Cal), unit: 'mm', d: 1 },
            { label: '大带轮直径 d₂（标准值）', value: d2, unit: 'mm', hl: true }
          ] },
          secGeo, secPow, secB
        ],
        verdict: {
          level: warns.length ? 'warn' : 'ok',
          text: (warns.length ? warns.join('；') : catName + typeName + '传动：d₁=' + fmt(d1) + '/d₂=' + fmt(d2) + 'mm，L=' + fmt(L, 1) + 'mm，a=' + fmt(a, 1) + 'mm，标准带宽 b=' + bStd + 'mm，Fr=' + fmt(res2.Fr) + 'N'),
          note: cat === 'ordinary' ? '胶帆布平带预紧应力推荐 σ₀=1.8MPa；带长未考虑接头长度。' : '尼龙片复合平带按 σ₀=3MPa 的 P0 表计算；小带轮直径可比计算值小 30%~35%。'
        },
        notes: [
          '小带轮直径 d₁ 按计算推荐值就近选取标准值（20~2000 系列），为提高带的寿命条件允许时尽量取较大值；d₂=i·d₁·(1−ε)，ε 取 0.01~0.02。',
          '带速最有利范围 10~20 m/s：胶帆布平带 vmax=30 m/s；尼龙片复合平带 v 宜 >10~15 m/s，否则应改变 d₁。',
          '初定轴间距推荐 1.5(d₁+d₂) ≤ a₀ ≤ 5(d₁+d₂)，也可按结构要求确定；计算带长 L₀ 未考虑接头长度，按标准内周长度系列（500~5000，优选+第二系列）选取后 L=Lᵢ+πδ、a=a₀+(L−L₀)/2。',
          '开口传动 α₁ 不应小于 150°，否则应增大 a、降低 i 或使用张紧轮；曲挠次数 y=1000mv/L₀ 应小于 ymax=6~10 1/s。',
          'P0 表13-1-70 仅适用于 b<300mm 的胶帆布平带（α=180°、载荷平稳、σ₀=1.8MPa）；σ₀=1.6MPa 时表值约小 7.8%、σ₀=2.0MPa 时约大 7.8%，本工具按 (1+0.39(σ₀−1.8)) 线性修正。尼龙片复合平带 P0 查表13-1-76（σ₀=3MPa，单位 kW/mm）。',
          '带宽按标准系列 16,20,25,...,500mm 向上圆整；作用在轴上的力 Fr=2σ₀A·sin(α₁/2)（A 为截面积），最大压轴力按 1.5Fr 考虑。'
        ],
        debug: {
          Pd: Pd, i: i, d1Cal: d1Cal, d1: d1, v: vel, d2Cal: d2Cal, d2: d2,
          a0min: r1(a0min), a0max: r1(a0max), a0: a0, L0: L0, delta: delta, d1od: d1od,
          LiCal: LiCal, li: liStd, L: L, a: a, alpha1: alpha1, kAlpha: kAlpha, y: y,
          P0: P0, kBeta: kBeta, A: cat === 'ordinary' ? res2.A : null,
          b: res2.b, bStd: bStd, Fr: res2.Fr, Frmax: Frmax,
          beltCategory: cat, nylonBeltType: v.nylonType || 'EL', transmissionType: type, sigma0: sigma0
        }
      };
    },
    formulas: [
      'Pd = KA·P；i = n₁/n₂；d₁ᶜ = C·∛(P/n₁)（C=1100~1350）；v = πd₁n₁/60000',
      'd₂ᶜ = i·d₁·(1−ε)；1.5(d₁+d₂) ≤ a₀ ≤ 5(d₁+d₂)',
      '开口：L₀ = 2a₀ + π/2·(d₁+d₂) + (d₂−d₁)²/(4a₀)；交叉：L₀ = 2a₀ + π/2·(d₁+d₂) + (d₁+d₂)²/(4a₀)；半交叉：L₀ = 2a₀ + π/2·(d₁+d₂) + (d₁²+d₂²)/(4a₀)',
      '开口：α₁ = 180° − (d₂−d₁)/a×57.3°；交叉：α₁ ≈ 180° + (d₁+d₂)/a×57.3°；半交叉：α₁ ≈ 180° + d₁/a×57.3°',
      'Lᵢ = L₀ − πδ；L = Lᵢ + πδ；a = a₀ + (L−L₀)/2；y = 1000mv/L₀',
      '胶帆布平带：A = Pd/(P0·Kα·Kβ)（cm²），b = 100A/δ（mm）；尼龙片平带：b = Pd/(P0·Kα·Kβ)（mm，P0 单位 kW/mm）',
      'Fr = 2σ₀A·sin(α₁/2)；Frmax = 1.5Fr'
    ],
    reference: 'GB/T 524-2007《平型传动带》；《机械设计手册》表13-1-68 普通平带传动的设计计算、表13-1-69 工况系数KA、表13-1-70 胶帆布平带单位截面积传递的基本额定功率P0、表13-1-71 包角修正系数Kα、表13-1-72 传动布置系数Kβ、表13-1-73~76 平带规格与尼龙片复合平带P0；原站工具 <a href="https://www.mechtool.cn/calculation/calculation_flatbelt.html" target="_blank">mechtool.cn 平带设计</a>',
    /* 分步中间量（与原站 API 端点 flatbelt1 / flatbeltAlpha1 / flatbeltP0Query / flatbeltKAlphaQuery / flatbelt2 一一对应，供自测比对） */
    internals: { kAlphaQuery: kAlphaQuery, p0Ordinary: p0Ordinary, p0Nylon: p0Nylon, belt1: belt1, alpha1Query: alpha1Query, belt2: belt2, nearestD: nearest, nearestLi: nearest }
  });
})();
