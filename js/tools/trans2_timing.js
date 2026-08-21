/* =========================================================
 * 梯形齿同步带传动设计（1:1 复刻 原站 梯形齿同步带设计工具）
 * 数据依据：GB/T 11362-2008 / GB/T 11362-1989 / GB/T 11616-2013
 * 计算链与原站 API（z1MinQuery / timingbelt1 / timingbeltLenChange / timingbelt2）逐字段一致
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;
  var PI = Math.PI;

  /* ---------- 舍入 ---------- */
  function r1(x) { return Math.round(x * 10) / 10; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function r3(x) { return Math.round(x * 1000) / 1000; }

  /* ---------- 基础数据表（内嵌） ---------- */
  /* 节距 pb（mm） */
  var PB = { MXL: 2.032, XXL: 3.175, XL: 5.08, L: 9.525, H: 12.7, XH: 22.225, XXH: 31.75 };
  /* 基准宽度 bs0(mm)、许用工作拉力 Ta(N)、单位长度质量 m(kg/m)、最大线速度 vmax(m/s)
   * 表"梯形齿同步带的基准宽度bs0、许用工作拉力Ta、单位长度的质量m和最大线速度vmax"(GB/T 11362-2008) */
  var BS0 = { MXL: 6.4, XXL: 6.4, XL: 9.5, L: 25.4, H: 76.2, XH: 101.6, XXH: 127 };
  var TA = { MXL: 27, XXL: 31, XL: 50.17, L: 244.46, H: 2100.85, XH: 4048.9, XXH: 6398.03 };
  var MM = { MXL: 0.007, XXL: 0.01, XL: 0.022, L: 0.095, H: 0.448, XH: 1.484, XXH: 2.473 };
  var VMAX = { MXL: 50, XXL: 50, XL: 50, L: 50, H: 40, XH: 30, XXH: 30 };
  /* 带宽 bs 系列（表"梯形齿同步带宽度bs系列"） */
  var WIDTHS = {
    MXL: [3.0, 4.8, 6.4], XXL: [3.0, 4.8, 6.4], XL: [6.4, 7.9, 9.5],
    L: [12.7, 19.1, 25.4, 38.1], H: [19.1, 25.4, 38.1, 50.8, 76.2],
    XH: [50.8, 76.2, 101.6], XXH: [50.8, 76.2, 101.6, 127]
  };
  /* 小带轮最小齿数 zmin（GB/T 11362-1989）：列对应 n1 <900 / 900~<1200 / 1200~<1800 / 1800~<3600 / 3600~<4800 */
  var ZMIN_N = [900, 1200, 1800, 3600, 4800];
  var ZMIN = {
    MXL: [10, 12, 14, 16, 18],
    XXL: [10, 12, 14, 16, 18],
    XL: [10, 10, 12, 12, 15],
    L: [12, 12, 14, 16, 18],
    H: [14, 16, 18, 20, 22],
    XH: [22, 24, 26, 30, null],
    XXH: [22, 24, 26, null, null]
  };

  /* 各带型节线长系列（齿数 zB，节线长 = zB×pb；显示按 r2 舍入）
   * = GB/T 11616 标准系列表 ∪ 原站 API timingbelt1 实测选取的系列成员（逐项探针校验：
   *   H 型实测成员 62,68,76,91,97,98,107,121,138,154,184,210,240,272 等不在 GB 表内，
   *   L 型 75,106,108,138,176,224,274,375,378，XH 型 91,105,106,140,180,214，
   *   XL 型 22,28,36~59(部分),124,138,172,174,176,650,1064 —— 原站系列为扩展系列） */
  var SERIES = {
    MXL: [45, 50, 55, 60, 70, 75, 80, 90, 100, 110, 125, 140, 155, 175, 200, 225, 250],
    XXL: [40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 144, 160, 176],
    XL: [22, 28, 30, 35, 36, 37, 38, 40, 41, 42, 44, 45, 46, 47, 48, 49, 50, 51, 53, 54, 55, 56,
      57, 58, 59, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 124, 125, 130, 138,
      172, 174, 176, 650, 1064],
    L: [33, 40, 50, 56, 60, 64, 68, 72, 75, 76, 80, 86, 92, 98, 104, 106, 108, 112, 120, 128, 136,
      138, 144, 160, 176, 224, 274, 375, 378],
    H: [48, 54, 60, 62, 66, 68, 72, 76, 78, 84, 90, 91, 96, 97, 98, 102, 107, 108, 114, 120, 121,
      126, 132, 138, 140, 150, 154, 160, 170, 180, 184, 200, 210, 220, 240, 250, 272, 280, 340],
    XH: [58, 64, 72, 80, 88, 91, 96, 105, 106, 128, 140, 144, 160, 176, 180, 200, 214],
    XXH: [56, 64, 72, 96, 112, 128, 144]
  };

  /* ---------- 通用 ---------- */
  function z1MinQuery(beltSize, n1) { /* 原站 z1MinQuery：带型+n1 查 zmin，超范围返回 null */
    var row = ZMIN[beltSize];
    if (!row) return null;
    for (var k = 0; k < ZMIN_N.length; k++) {
      if (n1 < ZMIN_N[k]) return row[k] === null || row[k] === undefined ? null : row[k];
    }
    return null;
  }
  /* 精确开口传动带长（原站 calBeltLen 用同一公式） */
  function beltL(d1, d2, a) {
    var dl = (d2 - d1) / 2;
    if (!(a > Math.abs(dl))) return NaN;
    var th = Math.asin(dl / a);
    return 2 * Math.sqrt(a * a - dl * dl) + (PI - 2 * th) * d1 / 2 + (PI + 2 * th) * d2 / 2;
  }
  /* 数值反解实际轴间距 a：beltL(a)=L（原站 a 的精度与此一致到 0.001mm） */
  function solveA(d1, d2, L) {
    var lo = Math.abs((d2 - d1) / 2) + 1e-6, hi = 30000;
    for (var i = 0; i < 200; i++) {
      var m = (lo + hi) / 2;
      if (beltL(d1, d2, m) < L) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }
  /* 就近选取节线长（原站按系列就近；返回 r2 后的节线长，与 API beltLen 字段一致） */
  function nearestLen(beltSize, cal) {
    var pb = PB[beltSize], s = SERIES[beltSize], best = null, bd = Infinity;
    for (var i = 0; i < s.length; i++) {
      var L = s[i] * pb, d = Math.abs(L - cal);
      if (d < bd) { bd = d; best = L; }
    }
    return best === null ? null : r2(best);
  }
  /* 由节线长求几何量（原站 timingbelt1 后半段 / timingbeltLenChange；beltLen 传 r2 值，
   * zB=r2(beltLen)/pb 再 r3 —— 与 API 一致，如 L 型 75 齿 → 714.38 → zB=75.001） */
  function geoByLen(z1, z2, pb, beltLen) {
    var d1 = z1 * pb / PI, d2 = z2 * pb / PI;
    var a = solveA(d1, d2, beltLen);
    var zM = Math.floor(z1 / 2 - z1 * (d2 - d1) / (2 * PI * a) + 1e-9);
    var kZ = zM >= 6 ? 1 : zM === 5 ? 0.8 : zM === 4 ? 0.6 : 0.4;
    var alpha1 = 180 - (d2 - d1) / a * 57.3;
    return { a: r3(a), zM: zM, zB: r3(beltLen / pb), kZ: kZ, alpha1: r2(alpha1) };
  }
  /* 原站 timingbelt1：z1/z2/a0/带型 → 计算带长、系列节线长、实际轴间距、啮合齿数等 */
  function timingbelt1(z1, z2, a0, beltSize) {
    var pb = PB[beltSize];
    var d1 = z1 * pb / PI, d2 = z2 * pb / PI;
    var cal = beltL(d1, d2, a0);
    var beltLen = nearestLen(beltSize, cal);
    var g = geoByLen(z1, z2, pb, beltLen);
    g.calBeltLen = r2(cal);
    g.beltLen = beltLen;
    return g;
  }
  /* 原站 timingbelt2：设计功率/带型/带速/kZ → 基准额定功率、最小带宽、带宽、额定功率、压轴力 */
  function timingbelt2(powerD, beltSize, v, kZ) {
    var Ta = TA[beltSize], m = MM[beltSize], bs0 = BS0[beltSize];
    var P0 = (Ta - m * v * v) * v / 1000;                       /* 基准额定功率（未舍入） */
    var power0 = r2(P0);
    if (!(power0 > 0)) return null;
    var bsMin = bs0 * Math.pow(powerD / (kZ * P0), 1 / 1.14);   /* 所需最小带宽 */
    var W = WIDTHS[beltSize], bs = 0;
    for (var i = 0; i < W.length; i++) if (W[i] >= bsMin) { bs = W[i]; break; }
    var ratio = bs > 0 ? bs / bs0 : 0;
    var powerR = bs > 0 ? r2((kZ * Ta * Math.pow(ratio, 1.14) - m * ratio * v * v) * v / 1000) : 0;
    return {
      power0: power0, bsMin: r3(bsMin), bs: bs, bs0: bs0, m: m,
      powerR: powerR, forceQ: r2(1000 * powerD / v)
    };
  }

  /* ---------- 主计算 ---------- */
  App.registerTool({
    id: 'timing-belt-design',
    name: '梯形齿同步带传动设计',
    category: 'trans',
    keywords: '同步带 梯形齿同步带 带传动 MXL XXL XL L H XH XXH 节距 带宽 节线长 啮合齿数 压轴力',
    brief: '梯形齿同步带（周节制 MXL~XXH）传动设计：带型与带轮齿数、节圆直径、节线长与轴间距、带宽与额定功率全流程计算。',
    doc: '按 原站 梯形齿同步带设计工具 1:1 复刻：Pd=KA·P → 查表定带型与节距 pb → zmin 查表校验 z₁ → d₁=z₁pb/π、z₂ 圆整 → 带速 v → 初定轴间距 0.7(d₁+d₂)≤a₀≤2(d₁+d₂) → 精确带长公式算 L<sub>p0</sub> 并按系列就近选节线长 L<sub>p</sub> → 数值反解实际轴间距 a、啮合齿数 z<sub>m</sub> 与 K<sub>z</sub> → <b>P0=(Ta−mv²)v/1000，b′<sub>s</sub>=b<sub>s0</sub>·(Pd/(K<sub>z</sub>P0))^(1/1.14) 按带宽系列圆整，Pr=(K<sub>z</sub>Ta·(b<sub>s</sub>/b<sub>s0</sub>)^1.14−m·(b<sub>s</sub>/b<sub>s0</sub>)v²)·v/1000</b>，压轴力 FQ=1000Pd/v。中间量不舍入，与原站 API 逐字段一致。',
    inputs: [
      { key: 'P', label: '传动功率 P', group: '输入初始参数', type: 'number', unit: 'kW', default: 4, step: 'any' },
      { key: 'n1', label: '主动轴转速 n₁', group: '输入初始参数', type: 'number', unit: 'r/min', default: 1440, step: 'any' },
      { key: 'n2', label: '从动轴转速 n₂', group: '输入初始参数', type: 'number', unit: 'r/min', default: 500, step: 'any', hint: '与传动比 i 二选一，i 优先' },
      { key: 'i', label: '传动比 i（留空按 n₁/n₂）', group: '输入初始参数', type: 'number', default: '', step: 'any', hint: '0＜i≤10' },
      { key: 'KA', label: '工况系数 KA', group: '输入初始参数', type: 'number', default: 1.5, step: 'any', hint: '查 GB/T 11362-2008 载荷修正系数表，0＜KA≤3' },
      { key: 'beltSize', label: '带型（节距 pb）', group: '选定带型和带轮节圆直径', type: 'select', options: [
        { v: 'MXL', t: 'MXL（pb=2.032）' }, { v: 'XXL', t: 'XXL（pb=3.175）' },
        { v: 'XL', t: 'XL（pb=5.080）' }, { v: 'L', t: 'L（pb=9.525）' },
        { v: 'H', t: 'H（pb=12.700）' }, { v: 'XH', t: 'XH（pb=22.225）' },
        { v: 'XXH', t: 'XXH（pb=31.750）' }
      ], default: 'H', hint: '根据 Pd 与 n₁ 由同步带选型图选取' },
      { key: 'z1', label: '小带轮齿数 z₁（留空自动）', group: '选定带型和带轮节圆直径', type: 'number', default: '', step: '1', hint: '自动取 zmin+4；zmin≤z₁≤216，条件允许尽量取大值' },
      { key: 'z2', label: '大带轮齿数 z₂（留空自动）', group: '选定带型和带轮节圆直径', type: 'number', default: '', step: '1', hint: '自动取 round(i·z₁)，可圆整修改' },
      { key: 'a0', label: '初定轴间距 a₀', group: '确定轴间距和带长', type: 'number', unit: 'mm', default: 500, step: 'any', hint: '推荐 0.7(d₁+d₂) ≤ a₀ ≤ 2(d₁+d₂)，也可按结构要求定' },
      { key: 'beltLen', label: '节线长 Lp（留空自动）', group: '确定轴间距和带长', type: 'number', unit: 'mm', default: '', step: 'any', hint: '留空取与计算带长 Lp0 就近的该带型节线长系列值' },
      { key: 'bs', label: '带宽 bs（留空自动）', group: '确定带宽', type: 'number', unit: 'mm', default: '', step: 'any', hint: '留空按 b′s 向上圆整至该带型带宽系列' }
    ],
    compute: function (v) {
      var P = +v.P, n1 = +v.n1, n2 = +v.n2, KA = +v.KA;
      var size = v.beltSize || 'H';
      if (!(P > 0) || P > 500) return { error: '请输入 0~500 之间的传动功率 P（kW）' };
      if (!(n1 > 0) || n1 > 15000) return { error: '请输入 0~15000 之间的主动轴转速 n₁（r/min）' };
      if (!(KA > 0) || KA > 3) return { error: '请输入 0~3 之间的工况系数 KA' };

      var pb = PB[size];
      /* 1. 设计功率 */
      var Pd = r3(KA * P);
      /* 2. 小带轮最小齿数 zmin 查表 */
      var zmin = z1MinQuery(size, n1);
      if (zmin === null) return { error: '小带轮转速 n₁=' + fmt(n1) + ' r/min 超出' + size + ' 型带 zmin 表范围（需 n₁＜4800 r/min），请改选带型' };
      /* 3. 传动比 */
      var i = v.i !== '' && v.i !== undefined && !isNaN(+v.i) ? +v.i : n1 / n2;
      if (!(i > 0) || i > 10) return { error: '请输入 0~10 之间的传动比 i（或有效的 n₂）' };
      /* 4. 齿数 */
      var z1 = v.z1 !== '' && v.z1 !== undefined && !isNaN(+v.z1) ? Math.round(+v.z1) : zmin + 4;
      if (z1 < zmin || z1 > 216) return { error: '请输入 ' + zmin + '~216 之间的小带轮齿数 z₁（' + size + ' 型 zmin=' + zmin + '）' };
      var z2Cal = r2(i * z1);
      var z2 = v.z2 !== '' && v.z2 !== undefined && !isNaN(+v.z2) ? Math.round(+v.z2) : Math.round(i * z1);
      if (!(z2 > 0)) return { error: '请输入有效的大带轮齿数 z₂' };
      /* 5. 节圆直径（显示 r2；计算用精确值） */
      var d1e = z1 * pb / PI, d2e = z2 * pb / PI;
      var d1 = r2(d1e), d2 = r2(d2e);
      /* 6. 带速（原站按圆整后 d1 计算，保留 3 位小数） */
      var vDisp = (PI * d1 * n1 / 60000).toFixed(3);
      var vel = Number(vDisp);
      var vmax = VMAX[size];
      /* 7. 初定轴间距范围 */
      var a0min = r1(0.7 * (d1 + d2)), a0max = r1(2 * (d1 + d2));
      var a0 = v.a0 !== '' && v.a0 !== undefined && !isNaN(+v.a0) ? +v.a0 : a0min;
      if (!(a0 > 0)) return { error: '请输入大于 0 的初定轴间距 a₀' };
      /* 8. 计算带长 Lp0（精确公式）与节线长选取 */
      var cal = beltL(d1e, d2e, a0);
      if (isNaN(cal)) return { error: '初定轴间距 a₀ 过小（a₀ 需大于 (d₂−d₁)/2=' + fmt((d2e - d1e) / 2, 2) + 'mm）' };
      var lpAuto = nearestLen(size, cal);
      if (lpAuto === null) return { error: '计算带长超出 ' + size + ' 型节线长系列范围，请调整 a₀ 或带型' };
      var lp = v.beltLen !== '' && v.beltLen !== undefined && !isNaN(+v.beltLen) ? +v.beltLen : lpAuto;
      var lpInSeries = SERIES[size].indexOf(Math.round(lp / pb)) >= 0;
      /* 9. 实际轴间距 / 节线长齿数 / 啮合齿数 / Kz / 包角 */
      var g = geoByLen(z1, z2, pb, lp);
      /* 10. 带宽方向 */
      var res2 = timingbelt2(Pd, size, vel, g.kZ);
      if (!res2) return { error: '输入参数超出范围，无法计算！（带速 v=' + vDisp + ' m/s 下基准额定功率 P0≤0）' };
      var bs = v.bs !== '' && v.bs !== undefined && !isNaN(+v.bs) ? +v.bs : res2.bs;

      var warns = [];
      if (vel > vmax) warns.push('带速 v=' + vDisp + 'm/s 超过 ' + size + ' 型最大线速度 vmax=' + vmax + 'm/s，应减小 d₁ 或 n₁');
      if (a0 < a0min || a0 > a0max) warns.push('初定轴间距 a₀=' + fmt(a0, 1) + ' 超出推荐范围 ' + fmt(a0min, 1) + '~' + fmt(a0max, 1) + 'mm');
      if (g.zM < 6) warns.push('小带轮啮合齿数 zm=' + g.zM + '＜6，Kz=' + g.kZ + '（zm＜4 时应增设张紧轮或增大 a₀）');
      if (!lpInSeries) warns.push('节线长 Lp=' + fmt(r2(lp), 2) + ' 不在 ' + size + ' 型节线长系列内（非标准长度）');
      var bsOver = false, powerR = 0;
      if (bs > 0) {
        var ratio = bs / res2.bs0;
        powerR = r2((g.kZ * TA[size] * Math.pow(ratio, 1.14) - MM[size] * ratio * vel * vel) * vel / 1000);
      } else { bsOver = true; }
      if (bsOver || res2.bs === 0) warns.push('所需最小带宽 b′s=' + fmt(res2.bsMin, 3) + 'mm 超出 ' + size + ' 型带宽系列最大值 ' + WIDTHS[size][WIDTHS[size].length - 1] + 'mm，应增大小带轮齿数 z₁、带轮直径或改选大带型');
      if (powerR > 0 && powerR < Pd) warns.push('额定功率 Pr=' + fmt(powerR, 2) + 'kW ＜ 设计功率 Pd=' + fmt(Pd, 2) + 'kW，应加大带宽或改选大带型');

      var sec1 = { title: '设计功率与带型、带轮', rows: [
        { label: '设计功率 Pd=KA·P', value: Pd, unit: 'kW', d: 3, hl: true },
        { label: '带型 / 节距 pb', value: size + ' / ' + fmt(pb, 3), unit: 'mm' },
        { label: '小带轮最小齿数 zmin（查表）', value: zmin },
        { label: '小带轮齿数 z₁', value: z1, hl: true },
        { label: '计算大带轮齿数 i·z₁', value: z2Cal, d: 2 },
        { label: '大带轮齿数 z₂（圆整）', value: z2, hl: true },
        { label: '小带轮节圆直径 d₁=z₁pb/π', value: d1, unit: 'mm', d: 2 },
        { label: '大带轮节圆直径 d₂=z₂pb/π', value: d2, unit: 'mm', d: 2 },
        { label: '带速 v=πd₁n₁/60000', value: vel, unit: 'm/s', d: 3, hl: true }
      ] };
      var sec2 = { title: '轴间距与节线长', rows: [
        { label: '推荐轴间距下限 0.7(d₁+d₂)', value: a0min, unit: 'mm', d: 1 },
        { label: '初定轴间距 a₀', value: a0, unit: 'mm', d: 1 },
        { label: '推荐轴间距上限 2(d₁+d₂)', value: a0max, unit: 'mm', d: 1 },
        { label: '计算带长 Lp0（精确公式）', value: r2(cal), unit: 'mm', d: 2 },
        { label: '节线长 Lp（系列值）', value: r2(lp), unit: 'mm', d: 2, hl: true },
        { label: '实际轴间距 a', value: g.a, unit: 'mm', d: 3, hl: true },
        { label: '节线长上齿数 z=Lp/pb', value: g.zB, d: 3 }
      ] };
      var sec3 = { title: '啮合齿数与带宽、功率', rows: [
        { label: '小带轮啮合齿数 zm', value: g.zM, hl: true },
        { label: '啮合齿数系数 Kz', value: g.kZ, d: 1 },
        { label: '基准额定功率 P0=(Ta−mv²)v/1000', value: res2.power0, unit: 'kW', d: 2 },
        { label: '基准宽度 bs0', value: res2.bs0, unit: 'mm', d: 1 },
        { label: '所需最小带宽 b′s', value: res2.bsMin, unit: 'mm', d: 3 },
        { label: '带宽 bs（系列值）', value: bs, unit: 'mm', d: 1, hl: true },
        { label: '带单位长度质量 m', value: res2.m, unit: 'kg/m', d: 3 },
        { label: '额定功率 Pr', value: powerR, unit: 'kW', d: 2, hl: true },
        { label: '小带轮包角 α₁', value: g.alpha1, unit: '°', d: 2 },
        { label: '压轴力 FQ=1000Pd/v', value: res2.forceQ, unit: 'N', d: 2 }
      ] };

      var okText = size + ' 型梯形齿同步带：z₁=' + z1 + '/z₂=' + z2 + '，d₁=' + fmt(d1, 2) + '/d₂=' + fmt(d2, 2) +
        'mm，v=' + vDisp + 'm/s，Lp=' + fmt(r2(lp), 2) + 'mm，a=' + fmt(g.a, 2) + 'mm，bs=' + fmt(bs, 1) +
        'mm，Pr=' + fmt(powerR, 2) + 'kW' + (powerR >= Pd ? ' ≥ Pd=' + fmt(Pd, 2) + 'kW，满足要求' : '（Pd=' + fmt(Pd, 2) + 'kW）');

      return {
        sections: [sec1, sec2, sec3],
        verdict: {
          level: warns.length ? (bsOver ? 'bad' : 'warn') : 'ok',
          text: warns.length ? warns[0] + (warns.length > 1 ? '（共' + warns.length + '项提示）' : '') : okText,
          note: 'KA 按载荷性质查表选取；计算链与 原站 原站一致：zmin 查表→z₁ 校验→d₁/d₂→v→P0→b′s→bs 系列圆整→Pr。'
        },
        notes: [
          '设计功率 Pd=KA·P；工况系数 KA 按 GB/T 11362-2008 载荷修正系数表选取（原站为手输参数），增速传动或频繁正反转时应视情况增大。',
          '小带轮最小齿数 zmin 查表（GB/T 11362-1989，按带型与 n₁ 分档：＜900 / 900~＜1200 / 1200~＜1800 / 1800~＜3600 / 3600~＜4800 r/min）；z₁ 自动取 zmin+4，条件允许时尽量取较大值以提高带寿命。',
          '带速 v=πd₁n₁/60000（按圆整后 d₁ 计算、保留 3 位小数）；通常 XL、L 型 vmax=50、H 型 vmax=40、XH、XXH 型 vmax=30 m/s。',
          '初定轴间距推荐 0.7(d₁+d₂) ≤ a₀ ≤ 2(d₁+d₂)；计算带长 Lp0 按精确带长公式 2√(a₀²−((d₂−d₁)/2)²)+(π−2θ)d₁/2+(π+2θ)d₂/2（θ=arcsin((d₂−d₁)/2a₀)），节线长 Lp 按该带型系列就近选取，实际轴间距 a 由 Lp 数值反解。',
          '啮合齿数 zm=z₁/2−z₁(d₂−d₁)/(2πa)（取整）；Kz：zm≥6 取 1、zm=5 取 0.8、zm=4 取 0.6；zm＜4 时应增设张紧轮或增大轴间距。',
          '基准额定功率 P0=(Ta−m·v²)·v/1000（Ta、m、bs0 查 GB/T 11362-2008 表）；所需最小带宽 b′s=bs0·(Pd/(Kz·P0))^(1/1.14)，带宽 bs 按系列向上圆整（一般 bs＜d₁）；额定功率 Pr=(Kz·Ta·(bs/bs0)^1.14−m·(bs/bs0)·v²)·v/1000；压轴力 FQ=1000·Pd/v。'
        ],
        debug: {
          Pd: Pd, beltSize: size, pb: pb, zmin: zmin, i: i, z1: z1, z2Cal: z2Cal, z2: z2,
          d1: d1, d2: d2, beltVelocity: vDisp, a0min: a0min, a0max: a0max, a0: a0,
          calBeltLen: r2(cal), beltLen: r2(lp), lpExact: lp, a: g.a, zB: g.zB,
          zM: g.zM, kZ: g.kZ, alpha1: g.alpha1,
          power0: res2.power0, bs0: res2.bs0, bsMin: res2.bsMin, bs: bs, m: res2.m,
          powerR: powerR, forceQ: res2.forceQ
        }
      };
    },
    formulas: [
      'Pd = KA·P；带型与节距 pb 根据 Pd、n₁ 由同步带选型图选取',
      'zmin：按带型与 n₁ 查表（GB/T 11362-1989）；要求 z₁ ≥ zmin',
      'd₁ = z₁pb/π；z₂ = i·z₁（圆整）；d₂ = z₂pb/π；v = πd₁n₁/60000 ≤ vmax',
      '0.7(d₁+d₂) ≤ a₀ ≤ 2(d₁+d₂)；Lp0 = 2√(a₀²−Δ²) + (π−2θ)d₁/2 + (π+2θ)d₂/2，Δ=(d₂−d₁)/2，θ=arcsin(Δ/a₀)',
      'Lp 按节线长系列就近选取；a 由 Lp 精确反解；z = Lp/pb；zm = ⌊z₁/2 − z₁(d₂−d₁)/(2πa)⌋',
      'Kz：zm≥6→1.0，zm=5→0.8，zm=4→0.6；α₁ = 180° − (d₂−d₁)/a×57.3°',
      'P0 = (Ta − m·v²)·v/1000；b′s = bs0·(Pd/(Kz·P0))^(1/1.14)；bs 按带宽系列圆整',
      'Pr = (Kz·Ta·(bs/bs0)^1.14 − m·(bs/bs0)·v²)·v/1000；FQ = 1000·Pd/v'
    ],
    reference: 'GB/T 11362-2008《同步带传动 梯形齿同步带传动 额定功率和传动中心距的计算》、GB/T 11362-1989（zmin、Kz、P0 表）、GB/T 11616-2013《同步带传动 节距制梯形齿同步带和带轮 尺寸》、GB/T 15531-2008（中心距调整范围）；原站工具 原站 梯形齿同步带传动设计',
    /* 分步中间量（与原站 API 端点 z1MinQuery / timingbelt1 / timingbeltLenChange / timingbelt2 一一对应，供自测比对） */
    internals: {
      PB: PB, TA: TA, MM: MM, BS0: BS0, WIDTHS: WIDTHS, SERIES: SERIES,
      z1MinQuery: z1MinQuery, beltL: beltL, solveA: solveA, nearestLen: nearestLen,
      geoByLen: geoByLen, timingbelt1: timingbelt1, timingbelt2: timingbelt2
    }
  });
})();
