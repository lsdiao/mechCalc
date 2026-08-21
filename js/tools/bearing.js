/* =========================================================
 * 滚动轴承 / 轴设计计算工具（复刻 mechtool.cn）
 * - rolling-bearing      滚动轴承设计计算（综合）
 * - deep-groove-bearing  深沟球轴承设计与查询
 * - angular-contact-bearing 角接触球轴承设计与查询
 * - thrust-ball-bearing  推力球轴承设计与查询
 * - tapered-roller-bearing 圆锥滚子轴承设计与查询
 * - shaft-design         轴设计计算
 * 公式来源（与 mechtool.cn 一致）：
 *   当量动载荷  P = fp·(X·Fr + Y·Fa)
 *   基本额定寿命 L10 = (C/P)^ε，L10h = 10^6/(60n)·L10
 *   寿命指数 ε：球轴承 = 3，滚子轴承 = 10/3
 *   温度因数 fT、可靠度因数 a1 见 GB/T 6391 常用取值表
 * ========================================================= */

(function () {
  'use strict';
  if (typeof window.App === 'undefined' || !window.App.registerTool) return;

  /* ---------- 轴承数据集（节选自 mechtool.cn 原始数据） ---------- */
  var BEARING_DATA = {
    deepGroove: [
      { bcode: '619/3', d: 3, dd: 8, b: 3, cr: 0.45, c0r: 0.15 }, { bcode: '619/5', d: 5, dd: 13, b: 4, cr: 1.08, c0r: 0.42 },
      { bcode: '606', d: 6, dd: 17, b: 6, cr: 1.95, c0r: 0.72 }, { bcode: '628/8', d: 8, dd: 16, b: 5, cr: 1.32, c0r: 0.65 },
      { bcode: '609', d: 9, dd: 24, b: 7, cr: 3.35, c0r: 1.4 }, { bcode: '6300', d: 10, dd: 35, b: 11, cr: 7.65, c0r: 3.48 },
      { bcode: '6301', d: 12, dd: 37, b: 12, cr: 9.72, c0r: 5.08 }, { bcode: '6302', d: 15, dd: 42, b: 13, cr: 11.5, c0r: 5.42 },
      { bcode: '6303', d: 17, dd: 47, b: 14, cr: 13.5, c0r: 6.58 }, { bcode: '6204', d: 20, dd: 47, b: 14, cr: 12.8, c0r: 6.65 },
      { bcode: '6005', d: 25, dd: 47, b: 12, cr: 10, c0r: 5.85 }, { bcode: '16006', d: 30, dd: 55, b: 9, cr: 11.2, c0r: 7.4 },
      { bcode: '61907', d: 35, dd: 55, b: 10, cr: 9.5, c0r: 6.8 }, { bcode: '61808', d: 40, dd: 52, b: 7, cr: 5.1, c0r: 4.4 },
      { bcode: '6408', d: 40, dd: 110, b: 27, cr: 65.5, c0r: 37.5 }, { bcode: '6309', d: 45, dd: 100, b: 25, cr: 52.8, c0r: 31.8 },
      { bcode: '6210', d: 50, dd: 90, b: 20, cr: 35, c0r: 23.2 }, { bcode: '6011', d: 55, dd: 90, b: 18, cr: 30.2, c0r: 21.8 },
      { bcode: '6211', d: 55, dd: 100, b: 21, cr: 43.2, c0r: 29.2 }, { bcode: '16012', d: 60, dd: 95, b: 11, cr: 19.9, c0r: 17.5 },
      { bcode: '61913', d: 65, dd: 90, b: 13, cr: 17.4, c0r: 16 }, { bcode: '61814', d: 70, dd: 90, b: 10, cr: 12.1, c0r: 11.9 },
      { bcode: '6414', d: 70, dd: 180, b: 42, cr: 140, c0r: 99.5 }, { bcode: '6315', d: 75, dd: 160, b: 37, cr: 113, c0r: 76.8 },
      { bcode: '6216', d: 80, dd: 140, b: 26, cr: 71.5, c0r: 54.2 }, { bcode: '6017', d: 85, dd: 130, b: 22, cr: 50.8, c0r: 42.8 },
      { bcode: '16018', d: 90, dd: 140, b: 16, cr: 41.5, c0r: 39.3 }, { bcode: '61919', d: 95, dd: 130, b: 18, cr: 33.7, c0r: 33.3 },
      { bcode: '61920', d: 100, dd: 140, b: 20, cr: 42.7, c0r: 41.9 }, { bcode: '61821', d: 105, dd: 130, b: 13, cr: 20.3, c0r: 22.7 },
      { bcode: '61822', d: 110, dd: 140, b: 16, cr: 28.1, c0r: 30.7 }, { bcode: '6422', d: 110, dd: 280, b: 65, cr: 225, c0r: 238 },
      { bcode: '6324', d: 120, dd: 260, b: 55, cr: 228, c0r: 208 }, { bcode: '6326', d: 130, dd: 280, b: 58, cr: 253, c0r: 242 },
      { bcode: '6328', d: 140, dd: 300, b: 62, cr: 275, c0r: 272 }, { bcode: '6330', d: 150, dd: 320, b: 65, cr: 288, c0r: 295 },
      { bcode: '6332', d: 160, dd: 340, b: 68, cr: 313, c0r: 340 }, { bcode: '6334', d: 170, dd: 360, b: 72, cr: 335, c0r: 378 },
      { bcode: '61838', d: 190, dd: 240, b: 24, cr: 75.1, c0r: 91.6 }, { bcode: '61940', d: 200, dd: 280, b: 38, cr: 149, c0r: 168 },
      { bcode: '16044', d: 220, dd: 340, b: 37, cr: 181, c0r: 216 }, { bcode: '6048', d: 240, dd: 360, b: 56, cr: 270, c0r: 292 },
      { bcode: '61856', d: 280, dd: 350, b: 33, cr: 135, c0r: 178 }, { bcode: '61964', d: 320, dd: 440, b: 56, cr: 275, c0r: 392 },
      { bcode: '61892', d: 460, dd: 580, b: 56, cr: 322, c0r: 538 }
    ],
    angularContact: [
      { bcode: '7000C', d: 10, dd: 26, b: 8, cr: 4.92, c0r: 2.25 }, { bcode: '7001AC', d: 12, dd: 28, b: 8, cr: 5.2, c0r: 2.55 },
      { bcode: '7202C', d: 15, dd: 35, b: 11, cr: 8.68, c0r: 4.62 }, { bcode: '7203AC', d: 17, dd: 40, b: 12, cr: 10.5, c0r: 5.65 },
      { bcode: '7204B', d: 20, dd: 47, b: 14, cr: 14, c0r: 7.85 }, { bcode: '7205B', d: 25, dd: 52, b: 15, cr: 15.8, c0r: 9.45 },
      { bcode: '7206AC', d: 30, dd: 62, b: 16, cr: 22, c0r: 14.2 }, { bcode: '7207C', d: 35, dd: 72, b: 17, cr: 30.5, c0r: 20 },
      { bcode: '7008AC', d: 40, dd: 68, b: 15, cr: 19, c0r: 14.5 }, { bcode: '7408B', d: 40, dd: 110, b: 27, cr: 67, c0r: 47.5 },
      { bcode: '7209B', d: 45, dd: 85, b: 19, cr: 36, c0r: 26.2 }, { bcode: '7210AC', d: 50, dd: 90, b: 20, cr: 40.8, c0r: 30.5 },
      { bcode: '7011AC', d: 55, dd: 90, b: 18, cr: 35.2, c0r: 29.2 }, { bcode: '7012C', d: 60, dd: 95, b: 18, cr: 38.2, c0r: 32.8 },
      { bcode: '7312B', d: 60, dd: 130, b: 31, cr: 90, c0r: 66.3 }, { bcode: '7213AC', d: 65, dd: 120, b: 23, cr: 66.5, c0r: 52.5 },
      { bcode: '7214C', d: 70, dd: 125, b: 24, cr: 70.2, c0r: 60 }, { bcode: '7015AC', d: 75, dd: 115, b: 20, cr: 46.8, c0r: 44.2 },
      { bcode: '7016C', d: 80, dd: 125, b: 22, cr: 58.5, c0r: 55.8 }, { bcode: '7316B', d: 80, dd: 170, b: 39, cr: 135, c0r: 110 },
      { bcode: '7217B', d: 85, dd: 150, b: 28, cr: 93, c0r: 81.5 }, { bcode: '7218AC', d: 90, dd: 160, b: 30, cr: 18, c0r: 100 },
      { bcode: '7219C', d: 95, dd: 170, b: 32, cr: 35, c0r: 115 }, { bcode: '7020AC', d: 100, dd: 150, b: 24, cr: 75, c0r: 74.8 },
      { bcode: '7021C', d: 105, dd: 160, b: 26, cr: 88.5, c0r: 88.8 }, { bcode: '7321B', d: 105, dd: 225, b: 49, cr: 202, c0r: 195 },
      { bcode: '7222B', d: 110, dd: 200, b: 38, cr: 155, c0r: 145 }, { bcode: '7224AC', d: 120, dd: 215, b: 40, cr: 180, c0r: 172 },
      { bcode: '7028C', d: 140, dd: 210, b: 33, cr: 140, c0r: 145 }, { bcode: '7030C', d: 150, dd: 225, b: 35, cr: 160, c0r: 155 },
      { bcode: '7234C', d: 170, dd: 310, b: 52, cr: 322, c0r: 390 }, { bcode: '7040AC', d: 200, dd: 310, b: 51, cr: 252, c0r: 325 }
    ],
    thrust: [
      { bcode: '51100', d: 10, dd: 24, b: 9, ca: 10, c0a: 14 }, { bcode: '51103', d: 17, dd: 30, b: 9, ca: 10.8, c0a: 18.2 },
      { bcode: '51205', d: 25, dd: 47, b: 15, ca: 27.8, c0a: 50.5 }, { bcode: '51406', d: 30, dd: 70, b: 28, ca: 72.5, c0a: 125 },
      { bcode: '51208', d: 40, dd: 68, b: 19, ca: 47, c0a: 98.2 }, { bcode: '51409', d: 45, dd: 100, b: 39, ca: 140, c0a: 262 },
      { bcode: '51109', d: 45, dd: 65, b: 14, ca: 27, c0a: 66 }, { bcode: '51211', d: 55, dd: 90, b: 25, ca: 67.5, c0a: 158 },
      { bcode: '51412', d: 60, dd: 130, b: 51, ca: 200, c0a: 395 }, { bcode: '51214', d: 70, dd: 105, b: 27, ca: 73.5, c0a: 188 },
      { bcode: '51415', d: 75, dd: 160, b: 65, ca: 268, c0a: 615 }, { bcode: '51217', d: 85, dd: 125, b: 31, ca: 102, c0a: 280 },
      { bcode: '51418', d: 90, dd: 190, b: 77, ca: 325, c0a: 825 }, { bcode: '51222', d: 110, dd: 160, b: 38, ca: 138, c0a: 412 },
      { bcode: '51424', d: 120, dd: 250, b: 102, ca: 412, c0a: 1220 }, { bcode: '51228', d: 140, dd: 200, b: 46, ca: 190, c0a: 598 },
      { bcode: '51430', d: 150, dd: 300, b: 120, ca: 670, c0a: 2240 }, { bcode: '51334', d: 170, dd: 280, b: 87, ca: 470, c0a: 1580 },
      { bcode: '51338', d: 190, dd: 320, b: 105, ca: 608, c0a: 2220 }, { bcode: '51148', d: 240, dd: 300, b: 45, ca: 258, c0a: 1040 },
      { bcode: '51256', d: 280, dd: 380, b: 80, ca: 490, c0a: 2140 }, { bcode: '51268', d: 340, dd: 460, b: 96, ca: 620, c0a: 3040 },
      { bcode: '51180', d: 400, dd: 480, b: 65, ca: 452, c0a: 2320 }, { bcode: '51292', d: 460, dd: 620, b: 130, ca: 892, c0a: 5230 },
      { bcode: '52305', d: 20, dd: 52, b: 34, ca: 35.5, c0a: 61.5 }, { bcode: '52307', d: 30, dd: 68, b: 44, ca: 55.2, c0a: 105 },
      { bcode: '52409', d: 35, dd: 100, b: 72, ca: 140, c0a: 262 }, { bcode: '52411', d: 45, dd: 120, b: 87, ca: 182, c0a: 355 },
      { bcode: '52313', d: 55, dd: 115, b: 65, ca: 115, c0a: 262 }, { bcode: '52415', d: 60, dd: 160, b: 115, ca: 268, c0a: 615 },
      { bcode: '52317', d: 70, dd: 150, b: 87, ca: 208, c0a: 495 }, { bcode: '52320', d: 85, dd: 170, b: 97, ca: 235, c0a: 595 },
      { bcode: '52426', d: 100, dd: 270, b: 192, ca: 630, c0a: 2010 }, { bcode: '52430', d: 120, dd: 300, b: 209, ca: 670, c0a: 2240 },
      { bcode: '52334', d: 150, dd: 280, b: 153, ca: 470, c0a: 1580 }
    ],
    tapered: [
      { bcode: '30302', d: 15, dd: 42, cr: 22.8, c0r: 21.5 }, { bcode: '32005', d: 25, dd: 47, cr: 28, c0r: 34 },
      { bcode: '32006', d: 30, dd: 55, cr: 35.8, c0r: 46.8 }, { bcode: '32906', d: 30, dd: 47, cr: 17, c0r: 23.2 },
      { bcode: '32007X2', d: 35, dd: 62, cr: 33.8, c0r: 47.2 }, { bcode: '32008', d: 40, dd: 68, cr: 51.8, c0r: 71 },
      { bcode: '32009', d: 45, dd: 75, cr: 58.5, c0r: 81.5 }, { bcode: '32010', d: 50, dd: 80, cr: 61, c0r: 89 },
      { bcode: '33011', d: 55, dd: 90, cr: 94.8, c0r: 145 }, { bcode: '33012', d: 60, dd: 95, cr: 96.8, c0r: 150 },
      { bcode: '33113', d: 65, dd: 110, cr: 142, c0r: 220 }, { bcode: '33114', d: 70, dd: 120, cr: 172, c0r: 268 },
      { bcode: '30215', d: 75, dd: 130, cr: 138, c0r: 185 }, { bcode: '32216', d: 80, dd: 140, cr: 198, c0r: 278 },
      { bcode: '32217', d: 85, dd: 150, cr: 228, c0r: 325 }, { bcode: '32218', d: 90, dd: 160, cr: 270, c0r: 395 },
      { bcode: '33219', d: 95, dd: 170, cr: 378, c0r: 568 }, { bcode: '30320', d: 100, dd: 215, cr: 405, c0r: 525 },
      { bcode: '31321', d: 105, dd: 225, cr: 398, c0r: 525 }, { bcode: '32322', d: 110, dd: 240, cr: 725, c0r: 1060 },
      { bcode: '32926', d: 130, dd: 180, cr: 205, c0r: 380 }, { bcode: '33028', d: 140, dd: 210, cr: 408, c0r: 755 },
      { bcode: '30330', d: 150, dd: 320, cr: 802, c0r: 1090 }, { bcode: '32034', d: 170, dd: 260, cr: 520, c0r: 920 },
      { bcode: '32038X2', d: 190, dd: 290, cr: 502, c0r: 932 }, { bcode: '32044X2', d: 220, dd: 340, cr: 702, c0r: 1330 },
      { bcode: '32056', d: 280, dd: 420, cr: 1190, c0r: 2290 }, { bcode: '32972', d: 360, dd: 480, cr: 1060, c0r: 2430 }
    ]
  };

  /* ---------- 温度因数 fT（GB/T 6391 常用取值） ---------- */
  function factorTQuery(t) {
    switch (t) {
      case '<=120': return 1.0;
      case '125': return 0.95;
      case '150': return 0.9;
      case '175': return 0.85;
      case '200': return 0.8;
      case '225': return 0.75;
      case '250': return 0.7;
      case '300': return 0.6;
      case '350': return 0.5;
    }
    return 1.0;
  }
  /* ---------- 可靠度因数 a1（GB/T 6391 常用取值） ---------- */
  function coEfficientA1Query(r) {
    switch (String(r)) {
      case '90': return 1.0;
      case '95': return 0.62;
      case '96': return 0.53;
      case '97': return 0.44;
      case '98': return 0.33;
      case '99': return 0.21;
    }
    return 1.0;
  }

  /* ---------- 深沟球轴承判断系数表：ratio = Fa/(f0·C0r) ---------- */
  var DEEP_GROOVE_ETABLE = [
    { ratio: 0.014, e: 0.19, Y1: 2.3 }, { ratio: 0.028, e: 0.22, Y1: 1.99 }, { ratio: 0.056, e: 0.26, Y1: 1.71 },
    { ratio: 0.084, e: 0.28, Y1: 1.55 }, { ratio: 0.11, e: 0.3, Y1: 1.45 }, { ratio: 0.17, e: 0.34, Y1: 1.31 },
    { ratio: 0.28, e: 0.38, Y1: 1.15 }, { ratio: 0.42, e: 0.42, Y1: 1.04 }, { ratio: 0.56, e: 0.44, Y1: 1 }
  ];
  function interpolateE(x) {
    var t = DEEP_GROOVE_ETABLE;
    if (x <= t[0].ratio) return t[0].e;
    if (x >= t[t.length - 1].ratio) return t[t.length - 1].e;
    for (var i = 0; i < t.length - 1; i++) {
      if (x >= t[i].ratio && x <= t[i + 1].ratio) {
        var k = (x - t[i].ratio) / (t[i + 1].ratio - t[i].ratio);
        return t[i].e + k * (t[i + 1].e - t[i].e);
      }
    }
    return 0.3;
  }
  function interpolateY(x) {
    var t = DEEP_GROOVE_ETABLE;
    if (x <= t[0].ratio) return t[0].Y1;
    if (x >= t[t.length - 1].ratio) return t[t.length - 1].Y1;
    for (var i = 0; i < t.length - 1; i++) {
      if (x >= t[i].ratio && x <= t[i + 1].ratio) {
        var k = (x - t[i].ratio) / (t[i + 1].ratio - t[i].ratio);
        return t[i].Y1 + k * (t[i + 1].Y1 - t[i].Y1);
      }
    }
    return 1.45;
  }

  function deepGrooveCoeff(Fr, Fa, C0rN) {
    var e = 0, X = 1, Y = 0;
    if (C0rN > 0) {
      var r = Fa / (14.7 * C0rN);           // f0≈14.7（深沟球轴承）
      e = interpolateE(r);
      if (Fr > 0 && Fa > 0) {
        if (Fa / Fr <= e) { X = 1; Y = 0; }
        else { X = 0.56; Y = interpolateY(r); }
      } else if (Fa === 0) { X = 1; Y = 0; }
      else { X = 0.56; Y = interpolateY(r); }
    } else { e = 0.3; X = 0.56; }
    return { e: e, X: X, Y: Y };
  }
  /* 角接触球轴承：按接触角 15°(C) / 25°(AC) / 40°(B) 选取系数 */
  function angularCoeff(bcode, Fr, Fa) {
    var config = { e: 0.46, X: 0.44, Y: 1.19 };   // C：15°
    if (/B$/.test(bcode)) config = { e: 1.14, X: 0.35, Y: 0.57 };        // B：40°
    else if (/AC$/.test(bcode)) config = { e: 0.68, X: 0.41, Y: 0.87 };  // AC：25°
    var X = 1, Y = 0;
    if (!(Fa / Fr <= config.e)) { X = config.X; Y = config.Y; }
    return { e: config.e, X: X, Y: Y };
  }
  /* 推力球轴承：仅受轴向载荷，X=0，Y=1 */
  function thrustCoeff() { return { e: 0, X: 0, Y: 1 }; }
  /* 圆锥滚子轴承：ε=10/3 */
  function taperedCoeff(Fr, Fa) {
    var e = 0.37, X = 1, Y = 0;
    if (!(Fa / Fr <= e)) { X = 0.4; Y = 1.6; }
    return { e: e, X: X, Y: Y };
  }

  function fmt(v, d) {
    if (v === null || v === undefined || isNaN(v)) return '--';
    if (!isFinite(v)) return '∞';
    if (d === undefined) {
      var a = Math.abs(v);
      if (a >= 100000) d = 0; else if (a >= 100) d = 1; else if (a >= 1) d = 2; else if (a >= 0.01) d = 4; else d = 6;
    }
    var s = Number(v).toFixed(d).replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  }

  var TEMP_OPTIONS = '<select><option selected value="<=120">≤120°C</option><option value="125">125°C</option><option value="150">150°C</option><option value="175">175°C</option><option value="200">200°C</option><option value="225">225°C</option><option value="250">250°C</option><option value="300">300°C</option><option value="350">350°C</option></select>';
  function tempOptions() {
    return [
      { v: '<=120', t: '≤120 °C' }, { v: '125', t: '125 °C' }, { v: '150', t: '150 °C' }, { v: '175', t: '175 °C' },
      { v: '200', t: '200 °C' }, { v: '225', t: '225 °C' }, { v: '250', t: '250 °C' }, { v: '300', t: '300 °C' }, { v: '350', t: '350 °C' }
    ];
  }
  function relOptions() {
    return [{ v: '90', t: '90%' }, { v: '95', t: '95%' }, { v: '96', t: '96%' }, { v: '97', t: '97%' }, { v: '98', t: '98%' }, { v: '99', t: '99%' }];
  }
  function codeOptions(ds) {
    return ds.map(function (b) { return { v: b.bcode, t: b.bcode + '（d=' + b.d + '）' }; });
  }
  function findBearing(ds, code) {
    for (var i = 0; i < ds.length; i++) if (ds[i].bcode === code) return ds[i];
    return ds[0];
  }

  /* =========================================================
   * 单类型轴承通用计算内核
   * type: 'deepGroove' | 'angularContact' | 'thrust' | 'tapered'
   * ========================================================= */
  function bearingCompute(opts, vals) {
    var Fr = +vals.forceR, Fa = +vals.forceA, n = +vals.rotatingSpeed, LhReq = +vals.requiredLife;
    var fp = +vals.factorP, S0 = +vals.factorS0;
    var fT = factorTQuery(vals.workingTemperature), a1 = coEfficientA1Query(vals.reliability);
    var A2 = +vals.coEfficientA2, A3 = +vals.coEfficientA3;
    var ds = opts.data;
    var b = findBearing(ds, vals.bearing);
    var epsilon = opts.epsilon;   // 球 3，滚子 10/3
    var Cr = (b.cr ? b.cr : b.ca) * 1000;   // N（推力轴承用轴向动载荷 da/ca）
    var coeff;
    if (opts.type === 'deepGroove') coeff = deepGrooveCoeff(Fr, Fa, b.c0r * 1000);
    else if (opts.type === 'angularContact') coeff = angularCoeff(b.bcode, Fr, Fa);
    else if (opts.type === 'thrust') coeff = thrustCoeff(Fr, Fa);
    else coeff = taperedCoeff(Fr, Fa);
    var e = coeff.e, X = coeff.X, Y = coeff.Y;
    var P = fp * (X * Fr + Y * Fa);           // 当量动载荷 P=fp(XFr+YFa)
    var fn = Math.pow(100 / n, 1 / epsilon);  // 速度因数
    var fh = Math.pow(LhReq / 500, 1 / epsilon); // 寿命因数
    var Ccalc = fh * fp * P / (fn * fT);      // 基本额定动载荷计算值
    var isC = Ccalc <= Cr;
    // 静载荷
    var C0r = b.c0r ? b.c0r * 1000 : b.c0a * 1000;
    var P0;
    if (opts.type === 'thrust') { P0 = Fa; }
    else { P0 = 0.6 * Fr + 0.5 * Fa; if (P0 < Fr) P0 = Fr; }
    var C0calc = S0 * P0;
    var isStatic = C0calc <= C0r;
    // 寿命
    var Plife = P;
    var L10 = Math.pow(Cr / Plife, epsilon);            // 10^6 转
    var Lh = (1000000 / (60 * n)) * L10;                // h（基本额定寿命）
    var Lna = a1 * A2 * A3 * L10;                       // 可靠度修正寿命 10^6 转
    var Lha = a1 * A2 * A3 * Lh;                        // h
    var lifePass = Lh >= LhReq;
    var level = (lifePass && isC && isStatic) ? 'ok' : (lifePass ? 'warn' : 'bad');

    var sections = [
      {
        title: '设计参数', rows: [
          { label: '轴承型号', value: b.bcode, hl: true },
          { label: '内径 d / 外径 D', value: b.d + ' / ' + b.dd, unit: 'mm' },
          { label: '径向载荷 F_r', value: Fr, unit: 'N', href: '#' },
          { label: '轴向载荷 F_a', value: Fa, unit: 'N' },
          { label: '转速 n', value: n, unit: 'r/min' },
          { label: '要求寿命 Lh′', value: LhReq, unit: 'h', hl: true }
        ]
      },
      {
        title: '当量动载荷 P 与基本额定动载荷 C',
        rows: [
          { label: '判断系数 e', value: e, d: 3 },
          { label: '径向动载荷系数 X', value: X, d: 3 },
          { label: '轴向动载荷系数 Y', value: Y, d: 3 },
          { label: '冲击载荷系数 f_p', value: fp, d: 2 },
          { label: '当量动载荷 P=f_p(X·F_r+Y·F_a)', value: P, unit: 'N', hl: true },
          { label: '速度因数 f_n', value: fn, d: 3 },
          { label: '寿命因数 f_h', value: fh, d: 3 },
          { label: '温度因数 f_T', value: fT, d: 2 },
          { label: '基本额定动载荷计算值 C', value: Ccalc, unit: 'N', hl: true },
          { label: '轴承基本额定动载荷 C_r', value: Cr, unit: 'N' },
          { label: '校核 C ≤ C_r', value: isC ? '满足' : '不满足', d: 0 }
        ]
      },
      {
        title: '校核额定静载荷',
        rows: [
          { label: (opts.type === 'thrust' ? '轴向当量静载荷 P_0 = F_a' : '径向当量静载荷 P_0 = max(0.6F_r+0.5F_a, F_r)'), value: P0, unit: 'N', d: 1 },
          { label: '安全因数 S_0', value: S0, d: 2 },
          { label: '额定静载荷计算值 C_0=S_0·P_0', value: C0calc, unit: 'N', hl: true },
          { label: (opts.type === 'thrust' ? '基本额定静载荷 C_0a' : '基本额定静载荷 C_0r'), value: C0r, unit: 'N' },
          { label: '校核 C_0 ≤ C_0r', value: isStatic ? '满足' : '不满足', d: 0 }
        ]
      },
      {
        title: '寿命计算',
        rows: [
          { label: '寿命指数 ε（球=3）', value: epsilon, d: 3 },
          { label: '基本额定寿命 L_10=(C_r/P)^ε', value: L10, unit: '×10⁶转', d: 1, hl: true },
          { label: '基本额定寿命 L_10h=10⁶/(60n)·L_10', value: Lh, unit: 'h', hl: true },
          { label: '可靠度因数 a1(' + vals.reliability + '%)', value: a1, d: 2 },
          { label: '修正寿命 L_na=a1·a2·a3·L_10', value: Lna, unit: '×10⁶转', d: 1 },
          { label: '修正寿命 L_nh', value: Lha, unit: 'h', d: 1 },
          { label: '要求寿命 Lh′', value: LhReq, unit: 'h' },
          { label: '寿命校核 L_10h ≥ Lh′', value: lifePass ? '满足' : '不满足', d: 0, hl: true }
        ]
      }
    ];
    var note = (opts.type === 'deepGroove') ? '深沟球轴承 e 值按 Fa/(f0·C0r)（f0≈14.7）查表线性插值，寿命指数 ε=3。'
      : (opts.type === 'angularContact') ? '角接触球轴承按接触角（C=15°、AC=25°、B=40°）选用 e / X / Y 值，寿命指数 ε=3。'
      : (opts.type === 'thrust') ? '推力球轴承仅承受轴向载荷，X=0、Y=1，P=F_a，寿命指数 ε=3。'
      : '圆锥滚子轴承 e / X / Y 按 0.37 / 0.4 / 1.6 常用取值，寿命指数 ε=10/3。';
    return {
      sections: sections,
      verdict: { level: level, text: '当量动载荷 P=' + fmt(P) + ' N，基本额定寿命 L_10h=' + fmt(Lh) + ' h，' + (lifePass ? '寿命满足要求寿命 ' + LhReq + ' h' : '寿命不满足要求寿命 ' + LhReq + ' h') },
      notes: [note, '基本额定动载荷判据：C ≤ C_r 且 C_0 ≤ C_0r 且 L_10h ≥ Lh′ 时选型合格。']
    };
  }

  /* ---------- 通用输入定义 ---------- */
  function bearingInputs(data, dflt) {
    return [
      { key: 'bearing', label: '轴承型号', group: '设计参数', type: 'select', options: codeOptions(data), dflt: dflt, hint: '按轴颈直径 d 近似选型' },
      { key: 'forceR', label: '径向力 Fr', group: '设计参数', type: 'number', default: 5500, unit: 'N', hint: '单个轴承所受径向载荷' },
      { key: 'forceA', label: '轴向力 Fa', group: '设计参数', type: 'number', default: 2700, unit: 'N' },
      { key: 'shaftDiameter', label: '轴颈直径 d', group: '设计参数', type: 'number', default: 55, unit: 'mm' },
      { key: 'rotatingSpeed', label: '轴承转速 n', group: '设计参数', type: 'number', default: 1250, unit: 'r/min' },
      { key: 'requiredLife', label: '要求寿命 Lh′', group: '设计参数', type: 'number', default: 5000, unit: 'h' },
      { key: 'workingTemperature', label: '工作温度 T', group: '设计参数', type: 'select', options: tempOptions(), dflt: '<=120' },
      { key: 'factorP', label: '冲击载荷系数 fp', group: '当量动载荷', type: 'number', default: 1.2, step: '0.1', unit: '' },
      { key: 'factorS0', label: '安全因数 S0', group: '静载荷校核', type: 'number', default: 1, step: '0.1' },
      { key: 'reliability', label: '可靠度（%）', group: '寿命计算', type: 'select', options: relOptions(), dflt: '90' },
      { key: 'coEfficientA2', label: '寿命系数 a2', group: '寿命计算', type: 'number', default: 1, step: '0.1' },
      { key: 'coEfficientA3', label: '寿命系数 a3', group: '寿命计算', type: 'number', default: 1, step: '0.1' }
    ];
  }

  /* =========================================================
   * 1) 深沟球轴承设计与查询
   * ========================================================= */
  App.registerTool({
    id: 'deep-groove-bearing',
    name: '深沟球轴承设计与查询',
    category: 'connect',
    keywords: '深沟球 滚动轴承 当量动载荷 额定寿命 选型 6205 6211 L10 L10h',
    brief: '深沟球轴承当量动载荷 P、基本额定动载荷 C、静载荷校核与寿命 L10h 计算（GB/T 276）。',
    doc: '按 mechtool.cn《深沟球轴承设计与查询》复刻。输入径向力 F_r、轴向力 F_a、转速 n 与要求寿命 Lh′，输出判断系数 e、当量动载荷 P=f_p(X·F_r+Y·F_a)、基本额定动载荷计算值 C 及寿命 L_10h=(C/P)^3·10^6/(60n)。寿命指数 ε=3。',
    inputs: (function () {
      var ins = bearingInputs(BEARING_DATA.deepGroove, '6211');
      ins[1].default = 5500; ins[2].default = 2700; ins[3].default = 55;
      ins[4].default = 1250; ins[5].default = 5000;
      return ins;
    })(),
    compute: function (v) {
      if (!v.bearing) v.bearing = '6211';
      var r = bearingCompute({ type: 'deepGroove', data: BEARING_DATA.deepGroove, epsilon: 3 }, v);
      r.notes.unshift('深沟球轴承（GB/T 276-2013 单列 60000、62000、63000 系列）。');
      return r;
    },
    formulas: [
      '当量动载荷 P = fp·(X·Fr + Y·Fa)',
      '基本额定寿命 L10h = (C/P)^ε · 10^6/(60n)，ε=3（球轴承）',
      '判断系数 e 按 Fa/(f0·C0r)（f0≈14.7）查表线性插值'
    ],
    reference: 'GB/T 276、GB/T 6391《滚动轴承 额定动载荷和额定寿命》'
  });

  /* =========================================================
   * 2) 角接触球轴承设计与查询
   * ========================================================= */
  App.registerTool({
    id: 'angular-contact-bearing',
    name: '角接触球轴承设计与查询',
    category: 'connect',
    keywords: '角接触球轴承 7000 7200 接触角 C AC B 当量动载荷 寿命',
    brief: '角接触球轴承（C/AC/B 接触角 15°/25°/40°）当量动载荷、额定动载荷与寿命 L10h 计算。',
    doc: '按 mechtool.cn《角接触球轴承设计与查询》复刻。按轴承代号后缀（C=15°、AC=25°、B=40°）选用判断系数 e、径向系数 X、轴向系数 Y，计算当量动载荷 P=f_p(X·F_r+Y·F_a) 与寿命 L_10h，寿命指数 ε=3。',
    inputs: (function () {
      var ins = bearingInputs(BEARING_DATA.angularContact, '7207C');
      ins[1].default = 900; ins[2].default = 400; ins[3].default = 35;
      ins[4].default = 520; ins[5].default = 15000; ins[7].default = 1.5;
      return ins;
    })(),
    compute: function (v) {
      if (!v.bearing) v.bearing = '7207C';
      return bearingCompute({ type: 'angularContact', data: BEARING_DATA.angularContact, epsilon: 3 }, v);
    },
    formulas: [
      '当量动载荷 P = fp·(X·Fr + Y·Fa)',
      '接触角 C=15°(e≈0.46,X=0.44,Y=1.19)、AC=25°(e≈0.68,X=0.41,Y=0.87)、B=40°(e≈1.14,X=0.35,Y=0.57)',
      '基本额定寿命 L10h = (C/P)^3 · 10^6/(60n)'
    ],
    reference: 'GB/T 292、GB/T 6391'
  });

  /* =========================================================
   * 3) 推力球轴承设计与查询
   * ========================================================= */
  App.registerTool({
    id: 'thrust-ball-bearing',
    name: '推力球轴承设计与查询',
    category: 'connect',
    keywords: '推力球轴承 单向 双向 轴向载荷 当量动载荷 寿命 51000 52000',
    brief: '推力球轴承（单向/双向）轴向当量动载荷、额定动载荷与寿命 L10h 计算。',
    doc: '按 mechtool.cn《推力球轴承设计与查询》复刻。推力球轴承仅承受轴向载荷，取 X=0、Y=1，当量动载荷 P=F_a，寿命指数 ε=3。',
    inputs: (function () {
      var ins = bearingInputs(BEARING_DATA.thrust, '51409');
      ins[1].default = 1; ins[1].hint = '推力轴承忽略径向力，仅用轴向力'; ins[2].default = 1891;
      ins[3].default = 45; ins[4].default = 1451; ins[5].default = 16000;
      return ins;
    })(),
    compute: function (v) {
      if (!v.bearing) v.bearing = '51409';
      return bearingCompute({ type: 'thrust', data: BEARING_DATA.thrust, epsilon: 3 }, v);
    },
    formulas: [
      '当量动载荷 P = Fa（X=0，Y=1）',
      '基本额定寿命 L10h = (Ca/P)^3 · 10^6/(60n)',
      '轴向当量静载荷 P0 = Fa'
    ],
    reference: 'GB/T 301、GB/T 6391'
  });

  /* =========================================================
   * 4) 圆锥滚子轴承设计与查询
   * ========================================================= */
  App.registerTool({
    id: 'tapered-roller-bearing',
    name: '圆锥滚子轴承设计与查询',
    category: 'connect',
    keywords: '圆锥滚子轴承 30000 32000 33000 当量动载荷 寿命 10/3',
    brief: '圆锥滚子轴承当量动载荷、额定动载荷与寿命 L10h 计算（滚子轴承 ε=10/3）。',
    doc: '按 mechtool.cn《圆锥滚子轴承设计与查询》复刻。圆锥滚子轴承既能承受径向又能承受轴向载荷，寿命指数 ε=10/3（滚子轴承）。',
    inputs: (function () {
      var ins = bearingInputs(BEARING_DATA.tapered, '32006');
      ins[1].default = 3000; ins[2].default = 1000; ins[3].default = 30;
      ins[4].default = 3000; ins[5].default = 4500; ins[7].default = 1.2; ins[8].default = 3;
      return ins;
    })(),
    compute: function (v) {
      if (!v.bearing) v.bearing = '32006';
      return bearingCompute({ type: 'tapered', data: BEARING_DATA.tapered, epsilon: 10 / 3 }, v);
    },
    formulas: [
      '当量动载荷 P = fp·(X·Fr + Y·Fa)（e≈0.37，X=0.4，Y=1.6）',
      '基本额定寿命 L10h = (C/P)^ε · 10^6/(60n)，ε=10/3（滚子轴承）'
    ],
    reference: 'GB/T 297、GB/T 6391'
  });

  /* =========================================================
   * 5) 滚动轴承设计计算（综合入口，9 大类）
   * ========================================================= */
  var TYPE_CFG = {
    deepGroove: { label: '深沟球轴承', type: 'deepGroove', data: BEARING_DATA.deepGroove, epsilon: 3, isRoller: false },
    angularContact: { label: '角接触球轴承', type: 'angularContact', data: BEARING_DATA.angularContact, epsilon: 3, isRoller: false },
    thrustBall: { label: '推力球轴承', type: 'thrust', data: BEARING_DATA.thrust, epsilon: 3, isRoller: false },
    cylindricalRoller: { label: '圆柱滚子轴承', type: 'deepGroove', data: BEARING_DATA.deepGroove, epsilon: 10 / 3, isRoller: true },
    needleRoller: { label: '滚针轴承', type: 'deepGroove', data: BEARING_DATA.deepGroove, epsilon: 10 / 3, isRoller: true },
    sphericalRoller: { label: '调心滚子轴承', type: 'deepGroove', data: BEARING_DATA.deepGroove, epsilon: 10 / 3, isRoller: true },
    taperedRoller: { label: '圆锥滚子轴承', type: 'tapered', data: BEARING_DATA.tapered, epsilon: 10 / 3, isRoller: true },
    selfAlignBall: { label: '调心球轴承', type: 'deepGroove', data: BEARING_DATA.deepGroove, epsilon: 3, isRoller: false },
    thrustRoller: { label: '推力滚子轴承', type: 'thrust', data: BEARING_DATA.thrust, epsilon: 10 / 3, isRoller: true }
  };
  var MAJOR_OPTIONS = [
    { v: 'deepGroove', t: '深沟球轴承' }, { v: 'selfAlignBall', t: '调心球轴承' }, { v: 'angularContact', t: '角接触球轴承' },
    { v: 'cylindricalRoller', t: '圆柱滚子轴承' }, { v: 'needleRoller', t: '滚针轴承' }, { v: 'sphericalRoller', t: '调心滚子轴承' },
    { v: 'taperedRoller', t: '圆锥滚子轴承' }, { v: 'thrustBall', t: '推力球轴承' }, { v: 'thrustRoller', t: '推力滚子轴承' }
  ];
  var CALC_MODE_OPTIONS = [
    { v: 'trial', t: '试选轴承（计算所需动载荷 C）' }, { v: 'life', t: '计算寿命（校核 Lh）' }
  ];

  App.registerTool({
    id: 'rolling-bearing',
    name: '滚动轴承设计计算',
    category: 'connect',
    keywords: '滚动轴承 综合 试选 寿命 当量动载荷 深沟球 圆锥滚子 推力球',
    brief: '滚动轴承综合设计入口：试选所需额定动载荷 C 或核算寿命 L10h，支持 9 种轴承大类型。',
    doc: '按 mechtool.cn《滚动轴承设计计算》复刻。两种模式：试选轴承（求所需 C，校核静载荷）与计算寿命（校核 Lh）。引入力矩载荷因数 f_m，当量动载荷 P=X·F_r+Y·F_a，基本额定动载荷 C=P·f_d·f_h/(f_n·f_t·f_m)。',
    inputs: [
      { key: 'calcMode', label: '计算模式', group: '模式', type: 'select', options: CALC_MODE_OPTIONS, dflt: 'trial' },
      { key: 'majorType', label: '轴承大类型', group: '模式', type: 'select', options: MAJOR_OPTIONS, dflt: 'deepGroove' },
      { key: 'bearing', label: '轴承型号', group: '设计参数', type: 'select', options: codeOptions(BEARING_DATA.deepGroove), dflt: '6211', hint: '默认按深沟球轴承（可在上方切换大类型后选型）' },
      { key: 'forceR', label: '径向载荷 Fr', group: '设计参数', type: 'number', default: 5500, unit: 'N' },
      { key: 'forceA', label: '轴向载荷 Fa', group: '设计参数', type: 'number', default: 2700, unit: 'N' },
      { key: 'requiredLife', label: '使用寿命 Lh′', group: '设计参数', type: 'number', default: 5000, unit: 'h' },
      { key: 'rotatingSpeed', label: '工作转速 n', group: '设计参数', type: 'number', default: 1250, unit: 'r/min' },
      { key: 'factorD', label: '冲击载荷因数 fd', group: '因数', type: 'number', default: 2.4, step: '0.1' },
      { key: 'factorT', label: '温度因数 ft', group: '因数', type: 'number', default: 1.0, step: '0.05' },
      { key: 'factorM', label: '力矩载荷因数 fm', group: '因数', type: 'number', default: 1.0, step: '0.05' },
      { key: 'factorS0', label: '安全因数 S0', group: '因数', type: 'number', default: 1.6, step: '0.1' }
    ],
    compute: function (v) {
      var cfg = TYPE_CFG[v.majorType] || TYPE_CFG.deepGroove;
      if (!v.bearing) v.bearing = '6211';
      var b = findBearing(cfg.data, v.bearing);
      var Fr = +v.forceR, Fa = +v.forceA, n = +v.rotatingSpeed, LhReq = +v.requiredLife;
      var fd = +v.factorD, ft = +v.factorT, fm = +v.factorM, S0 = +v.factorS0;
      var eps = cfg.epsilon;
      var Cr = (b.cr ? b.cr : b.ca) * 1000, C0r = b.c0r ? b.c0r * 1000 : b.c0a * 1000;
      var coeff;
      if (cfg.type === 'deepGroove') coeff = deepGrooveCoeff(Fr, Fa, C0r);
      else if (cfg.type === 'angularContact') coeff = angularCoeff(b.bcode, Fr, Fa);
      else if (cfg.type === 'thrust') coeff = thrustCoeff(Fr, Fa);
      else coeff = taperedCoeff(Fr, Fa);
      var e = coeff.e, X = coeff.X, Y = coeff.Y;
      var P = X * Fr + Y * Fa;                       // 当量动载荷（不含 fd）
      var fn = Math.pow(100 / n, 1 / eps);           // 速度因数
      var fh = Math.pow(LhReq / 500, 1 / eps);       // 寿命因数
      var Ccalc = P * fd * fh / (fn * ft * fm);      // 基本额定动载荷计算值
      var isC = Ccalc <= Cr;
      var P0 = 0.6 * Fr + 0.5 * Fa; if (P0 < Fr) P0 = Fr;
      if (cfg.type === 'thrust') P0 = Fa;
      var C0calc = S0 * P0;
      var isStatic = C0calc <= C0r;
      var Pe = P * fd * fm;                          // 寿命用等效载荷
      var L10 = Math.pow(Cr / Pe, eps);              // ×10^6 转
      var Lh = (1000000 / (60 * n)) * L10;           // h
      var lifePass = Lh >= LhReq;
      var level = (lifePass && isC && isStatic) ? 'ok' : (lifePass ? 'warn' : 'bad');

      var rowsPar = [
        { label: '轴承大类型', value: cfg.label, hl: true },
        { label: '轴承型号', value: b.bcode, hl: true },
        { label: '径向载荷 F_r', value: Fr, unit: 'N' },
        { label: '轴向载荷 F_a', value: Fa, unit: 'N' },
        { label: '工作转速 n', value: n, unit: 'r/min' },
        { label: '使用寿命 Lh′', value: LhReq, unit: 'h', hl: true },
        { label: '基本额定动载荷 C_r', value: Cr, unit: 'N' },
        { label: '基本额定静载荷 C_0r', value: C0r, unit: 'N' }
      ];
      var rowsP = [
        { label: '判断系数 e', value: e, d: 3 }, { label: '径向系数 X', value: X, d: 3 }, { label: '轴向系数 Y', value: Y, d: 3 },
        { label: '当量动载荷 P=X·F_r+Y·F_a', value: P, unit: 'N', hl: true },
        { label: '速度因数 f_n=(100/n)^(1/ε)', value: fn, d: 3 },
        { label: '寿命因数 f_h=(Lh′/500)^(1/ε)', value: fh, d: 3 },
        { label: '冲击载荷因数 f_d', value: fd, d: 2 },
        { label: '温度因数 f_t', value: ft, d: 2 },
        { label: '力矩载荷因数 f_m', value: fm, d: 2 },
        { label: '基本额定动载荷 C=f_d·f_h·P/(f_n·f_t·f_m)', value: Ccalc, unit: 'N', hl: true },
        { label: '校核 C ≤ C_r', value: isC ? '满足' : '不满足', d: 0 }
      ];
      var rowsS = [
        { label: '径向当量静载荷 P_0=max(0.6F_r+0.5F_a,F_r)', value: P0, unit: 'N', d: 1 },
        { label: '安全因数 S_0', value: S0, d: 2 },
        { label: '额定静载荷计算值 C_0=S_0·P_0', value: C0calc, unit: 'N', hl: true },
        { label: '校核 C_0 ≤ C_0r', value: isStatic ? '满足' : '不满足', d: 0 }
      ];
      var rowsL = [
        { label: '寿命指数 ε（球=3，滚子=10/3）', value: eps, d: 4 },
        { label: '寿命等效载荷 P_e=P·f_d·f_m', value: Pe, unit: 'N', d: 1 },
        { label: '基本额定寿命 L_10=(C_r/P_e)^ε', value: L10, unit: '×10⁶转', d: 1, hl: true },
        { label: '基本额定寿命 L_10h=10⁶/(60n)·L_10', value: Lh, unit: 'h', hl: true },
        { label: '要求寿命 Lh′', value: LhReq, unit: 'h' },
        { label: '寿命校核 L_10h ≥ Lh′', value: lifePass ? '满足' : '不满足', d: 0, hl: true }
      ];
      var sections = [
        { title: '设计参数', rows: rowsPar },
        { title: '当量动载荷 P 与基本额定动载荷 C', rows: rowsP },
        { title: '校核额定静载荷', rows: rowsS },
        { title: '寿命计算', rows: rowsL }
      ];
      var verdictText = '当量动载荷 P=' + fmt(P) + ' N，基本额定寿命 L_10h=' + fmt(Lh) + ' h，' +
        (lifePass ? '寿命满足设计寿命 ' + LhReq + ' h' : '寿命不满足设计寿命 ' + LhReq + ' h');
      return {
        sections: sections,
        verdict: { level: level, text: verdictText },
        notes: [
          '支持 9 种轴承大类型；综合入口按 mechtool.cn《滚动轴承设计计算》公式一致。',
          '基本额定动载荷 C ≤ C_r、静载荷 C_0 ≤ C_0r、寿命 L_10h ≥ Lh′ 时选型合格。'
        ]
      };
    },
    formulas: [
      '当量动载荷 P = X·Fr + Y·Fa',
      '基本额定动载荷 C = P·fd·fh/(fn·ft·fm)',
      '寿命指数 ε：球轴承=3，滚子轴承=10/3',
      '基本额定寿命 L10h = 10^6/(60n)·(C/P)^ε'
    ],
    reference: 'GB/T 6391《滚动轴承 额定动载荷和额定寿命》、GB/T 4662 额定静载荷'
  });

  /* =========================================================
   * 6) 轴设计计算
   * ========================================================= */
  var MATERIALS = {
    'Q235-A,20': { tauMin: 15, tauMax: 25, Amin: 126, Amax: 149 },
    '35,06Cr18Ni11Ti': { tauMin: 20, tauMax: 35, Amin: 112, Amax: 135 },
    '45': { tauMin: 25, tauMax: 45, Amin: 103, Amax: 126 },
    '40Cr,35SiMn,42CrMo,30Cr13': { tauMin: 35, tauMax: 55, Amin: 97, Amax: 112 },
    '34CrNiMo,18CrNiMo7-6,38CrMoAlA,20CrMnMo': { tauMin: 50, tauMax: 70, Amin: 88, Amax: 99 }
  };
  var STANDARD_D = [10, 11, 12, 14, 16, 18, 19, 20, 21, 22, 24, 25, 26, 28, 30, 32, 34, 35, 38, 40, 42, 45, 48, 50, 52, 55, 58, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 130, 140, 150, 160, 170, 180, 190, 200];

  App.registerTool({
    id: 'shaft-design',
    name: '轴设计计算',
    category: 'connect',
    keywords: '轴 传动轴 最小直径 扭转强度 扭转刚度 键槽 弯曲 疲劳安全',
    brief: '轴设计：按扭转强度/刚度计算最小直径，校核弯曲强度与疲劳安全系数。',
    doc: '按 mechtool.cn《轴设计计算》复刻。实心轴 d ≥ A·∛(P/n)，空心轴 d ≥ A·∛(P/n)/∛(1-α⁴)，并按键槽情况放大（单键槽 5%、双键槽 10%）。式中 A 按材料查表。',
    inputs: [
      { key: 'material', label: '轴选用材料', group: '扭转强度', type: 'select', options: Object.keys(MATERIALS).map(function (m) { return { v: m, t: m }; }), dflt: 'Q235-A,20' },
      { key: 'power', label: '传递功率 P', group: '扭转强度', type: 'number', default: 10, step: '0.1', unit: 'KW' },
      { key: 'n', label: '轴的转速 n', group: '扭转强度', type: 'number', default: 100, unit: 'r/min' },
      { key: 'torque', label: '传递转矩 T', group: '扭转强度', type: 'number', default: 955, unit: 'N·m' },
      { key: 'hollow', label: '实心/空心', group: '扭转强度', type: 'select', options: [{ v: 'solid', t: '实心轴' }, { v: 'hollow', t: '空心轴' }], dflt: 'solid' },
      { key: 'alpha', label: '内外径比 α', group: '扭转强度', type: 'number', default: 0.5, step: '0.01' },
      { key: 'tau', label: '许用剪应力 [τ]', group: '扭转强度', type: 'number', default: 15, unit: 'MPa', hint: '由材料自动给出范围' },
      { key: 'valueA', label: 'A 值', group: '扭转强度', type: 'number', default: 148 },
      { key: 'keyway', label: '键槽情况', group: '扭转强度', type: 'select', options: [{ v: 'none', t: '无键槽' }, { v: 'one', t: '有一个键槽' }, { v: 'two', t: '有两个相隔180°键槽' }], dflt: 'none' },
      { key: 'selectedD', label: '选定标准直径 d', group: '扭转强度', type: 'number', default: 55, unit: 'mm', hint: '由最小直径圆整到标准值' },
      { key: 'bend_M', label: '弯矩 M', group: '弯曲强度', type: 'number', default: 955000, unit: 'N·mm' },
      { key: 'bend_T', label: '扭矩 T', group: '弯曲强度', type: 'number', default: 955000, unit: 'N·mm' },
      { key: 'bend_psi', label: '折合系数 ψ', group: '弯曲强度', type: 'number', default: 0.3, step: '0.05' },
      { key: 'bend_sigmaAllow', label: '许用弯曲应力 [σ]', group: '弯曲强度', type: 'number', default: 75, unit: 'MPa' }
    ],
    compute: function (v) {
      var mat = MATERIALS[v.material] || MATERIALS['Q235-A,20'];
      var P = +v.power, n = +v.n, T = +v.torque;
      var tau = +v.tau, A = +v.valueA, alpha = +v.alpha;
      var hollow = v.hollow === 'hollow';
      var keyInc = v.keyway === 'one' ? 5 : (v.keyway === 'two' ? 10 : 0);
      // 按扭转强度：d = A·∛(P/n)·键槽系数，空心再除以 ∛(1-α⁴)
      var dBase = A * Math.pow(P / n, 1 / 3) * (1 + keyInc / 100);
      var dTorsion = hollow ? dBase / Math.pow(1 - Math.pow(alpha, 4), 1 / 3) : dBase;
      var dRec = STANDARD_D[0];
      for (var i = 0; i < STANDARD_D.length; i++) { if (STANDARD_D[i] >= dTorsion) { dRec = STANDARD_D[i]; break; } }
      // 按扭转刚度（Φp）：d = B·∛(P/n)，B 由材料类给定（简化取常用值 109 区间）
      var dStiff = 109 * Math.pow(P / n, 1 / 3);
      // 弯曲强度：Meq = sqrt(M² + (ψT)²)，d = ∛(10·Meq/[σ])
      var M = +v.bend_M || 0, Tb = +v.bend_T || 0, psi = +v.bend_psi, sigAllow = +v.bend_sigmaAllow || 75;
      var Meq = Math.sqrt(M * M + Math.pow(psi * Tb, 2));
      var dBend = Math.pow(10 * Meq / sigAllow, 1 / 3);
      // 校核选定直径
      var dSel = +v.selectedD || dRec;
      var torsionOk = dSel >= dTorsion;
      var bendOk = dSel >= dBend;
      var level = (torsionOk && bendOk) ? 'ok' : 'bad';

      var sections = [
        {
          title: '按扭转强度/刚度求最小直径',
          rows: [
            { label: '轴选用材料', value: v.material, hl: true },
            { label: '传递功率 P', value: P, unit: 'KW' },
            { label: '转速 n', value: n, unit: 'r/min' },
            { label: '传递转矩 T=9550P/n', value: (9550 * P / n), unit: 'N·m', d: 1 },
            { label: '许用剪应力 [τ] 范围', value: mat.tauMin + '~' + mat.tauMax, unit: 'MPa' },
            { label: 'A 值范围', value: mat.Amin + '~' + mat.Amax },
            { label: '选取 [τ] / A', value: '[τ]=' + fmt(tau) + ' MPa, A=' + fmt(A) },
            { label: '相对最小直径 d₀=A·∛(P/n)', value: A * Math.pow(P / n, 1 / 3) * (1 + keyInc / 100), unit: 'mm', d: 2 },
            { label: '键槽增大', value: keyInc + '%', d: 0 },
            { label: (hollow ? '空心轴 d=A·∛(P/n)/∛(1-α⁴)' : '实心轴最小直径 d=A·∛(P/n)'), value: dTorsion, unit: 'mm', hl: true },
            { label: '按扭转刚度 d=B·∛(P/n)（[Φp]=0.5°/m 仅供参考）', value: dStiff, unit: 'mm', d: 2 },
            { label: '圆整到标准直径（推荐）', value: dRec, unit: 'mm', hl: true },
            { label: '选定标准直径 d', value: dSel, unit: 'mm' },
            { label: '校核 d ≥ d₀', value: torsionOk ? '满足' : '不满足', d: 0, hl: true }
          ]
        },
        {
          title: '按弯曲强度校核',
          rows: [
            { label: '弯矩 M', value: M, unit: 'N·mm' },
            { label: '扭矩 T', value: Tb, unit: 'N·mm' },
            { label: '折合系数 ψ', value: psi, d: 2 },
            { label: '当量弯矩 M_eq=√(M²+(ψT)²)', value: Meq, unit: 'N·mm', hl: true },
            { label: '许用弯曲应力 [σ]', value: sigAllow, unit: 'MPa' },
            { label: '所需直径 d=∛(10·M_eq/[σ])', value: dBend, unit: 'mm', d: 2 },
            { label: '校核 d ≥ d_bend', value: bendOk ? '满足' : '不满足', d: 0 }
          ]
        }
      ];
      var noteStr = '(单键槽 +5%，两相隔180°键槽 +10%)';
      return {
        sections: sections,
        verdict: { level: level, text: '按扭转强度最小直径 d=' + fmt(dTorsion, 2) + ' mm，推荐标准直径 ' + dRec + ' mm；弯曲所需直径 ' + fmt(dBend, 2) + ' mm。' },
        notes: ['键槽削弱截面：' + (v.keyway === 'one' ? '单键槽 +5%' : v.keyway === 'two' ? '双键槽 +10%' : '无键槽不放大。') + ' A、[τ] 按材料表对应（如 Q235-A,20 取 [τ]=15~25 MPa、A=126~149）。', '转矩 T 与功率 P 关系 T≈9550·P/n（N·m）。']
      };
    },
    formulas: [
      '按扭转强度：实心轴 d ≥ A·∛(P/n)；空心轴 d ≥ A·∛(P/n)/∛(1-α⁴)',
      '按扭转刚度：d ≥ B·∛(P/n)',
      '按弯曲强度：Meq = √(M²+(ψT)²)，d = ∛(10·Meq/[σ])'
    ],
    reference: 'GB/T 4335 传动轴、机械设计手册（轴设计）'
  });
})();