/* 汇总验证：全部 6 个 wormDrive 端点公式 vs 全部已记录 API 探针数据 */
'use strict';
var fs = require('fs');
var D = Math.PI / 180;
function r2(x) { return Math.round(x * 100) / 100; }
function r3(x) { return Math.round(x * 1000) / 1000; }
function r4(x) { return Math.round(x * 10000) / 10000; }
var pass = 0, fail = 0;
function ok(c, name, detail) {
  if (c) { pass++; }
  else { fail++; console.log('  FAIL ' + name + '  ' + (detail || '')); }
}

/* ============ wormDrive1: a = cbrt(K·T2·1000·(ZE·Zρ)²/σHP²), r2 ============ */
console.log('== wormDrive1 ==');
[[1.2075, 948.4, 2.9, 160, 217.98, 173.13],
 [1.0, 1000, 3.0, 160, 200, 179.26],
 [1.5, 2500.5, 2.5, 155, 180.5, 258.56],
 [2.05, 123.456, 3.1, 160, 130, 154.45],
 [1.2075, 948.4, 2.9, 160, 217.985, 173.12],
 [1.2075, 948.416, 2.9, 160, 217.98, 173.13]].forEach(function (c) {
  var a = Math.pow(c[0] * c[1] * 1000 * Math.pow(c[2] * c[3], 2) / (c[4] * c[4]), 1 / 3);
  ok(r2(a) === c[5], 'wd1 ' + c.join(','), 'calc=' + r2(a) + ' api=' + c[5]);
});

/* ============ wormDrive2 ============ */
console.log('== wormDrive2 ==');
[[8, 41, 2, 80, 200, 5120, 10, -0.5, 328, 11.31],
 [10, 31, 4, 90, 250, 9000, 9, 5, 310, 23.962],
 [5, 71, 1, 50, 200, 1250, 10, -0.5, 355, 5.711],
 [3.15, 53, 2, 35.5, 125, 352.25, 11.27, 7.548, 166.95, 10.063],
 [12.5, 29, 6, 112, 250, 17500, 8.96, 1.02, 362.5, 33.808],
 [2, 40, 1, 22.4, 63, 89.6, 11.2, 5.9, 80, 5.102]].forEach(function (c) {
  var m = c[0], z2 = c[1], z1 = c[2], d1 = c[3], a = c[4];
  var d2 = r2(m * z2), q = r2(d1 / m);
  var x2 = r3(a / m - (d1 + m * z2) / (2 * m));
  var gama = r3(Math.atan(z1 * m / d1) / D);
  var m2d1 = r2(m * m * d1);
  ok(m2d1 === c[5] && q === c[6] && x2 === c[7] && d2 === c[8] && gama === c[9],
    'wd2 m=' + m, 'm2d1=' + m2d1 + '/' + c[5] + ' q=' + q + '/' + c[6] + ' x2=' + x2 + '/' + c[7] + ' d2=' + d2 + '/' + c[8] + ' gama=' + gama + '/' + c[9]);
});

/* ============ wormDrive3: φV 插值表 + vS/η ============ */
var FV = {
  xc45: [[0.01, 0.110], [0.05, 0.090], [0.10, 0.080], [0.25, 0.065], [0.50, 0.055], [1.0, 0.045], [1.5, 0.040], [2.0, 0.035], [2.5, 0.030], [3.0, 0.028], [4.0, 0.024], [5.0, 0.022], [8.0, 0.018], [10, 0.016], [15, 0.014], [24, 0.013]],
  xc45l: [[0.01, 0.120], [0.05, 0.100], [0.10, 0.090], [0.25, 0.075], [0.50, 0.065], [1.0, 0.055], [1.5, 0.050], [2.0, 0.045], [2.5, 0.040], [3.0, 0.035], [4.0, 0.031], [5.0, 0.029], [8.0, 0.026], [10, 0.024], [15, 0.020]],
  lqt: [[0.01, 0.180], [0.05, 0.140], [0.10, 0.130], [0.25, 0.100], [0.50, 0.090], [1.0, 0.070], [1.5, 0.065], [2.0, 0.055], [2.5, 0.050], [3.0, 0.045], [4.0, 0.040], [5.0, 0.035], [8.0, 0.030]],
  htz45l: [[0.01, 0.190], [0.05, 0.160], [0.10, 0.140], [0.25, 0.120], [0.50, 0.100], [1.0, 0.090], [1.5, 0.080], [2.0, 0.070]]
};
function fvLookup(tblKey, x) {
  var tbl = FV[tblKey];
  if (x < tbl[0][0] || x > tbl[tbl.length - 1][0]) return null;
  for (var i = 0; i < tbl.length - 1; i++) {
    if (x >= tbl[i][0] && x <= tbl[i + 1][0]) {
      var t = (x - tbl[i][0]) / (tbl[i + 1][0] - tbl[i][0]);
      return tbl[i][1] + t * (tbl[i + 1][1] - tbl[i][1]);
    }
  }
  return null;
}
function wd3(gama, d1, n1, hardness, material) {
  var vsRaw = Math.PI * d1 * n1 / (60000 * Math.cos(gama * D));
  var key;
  if (material === '锡青铜') key = hardness === '≥45HRC' ? 'xc45' : 'xc45l';
  else if (material === '铝铁青铜') key = 'lqt';
  else key = hardness === '≥45HRC' ? 'lqt' : 'htz45l';
  var maxVS = material === '灰铸铁' ? 2.0 : FV[key][FV[key].length - 1][0];
  var fv = (vsRaw < FV[key][0][0] || vsRaw >= maxVS) ? null : fvLookup(key, vsRaw);
  if (fv === null) return null;
  var pv = Math.atan(fv) / D;
  return { vS: r3(vsRaw), phiV: r3(pv), efficiency: r3(0.95 * Math.tan(gama * D) / Math.tan((gama + pv) * D)) };
}
console.log('== wormDrive3（定点） ==');
[[11.31, 80, 1450, '≥45HRC', '锡青铜', 1.169, 0.859, 6.194],
 [18.435, 45, 2900, '≥45HRC', '铝铁青铜', 1.794, 0.859, 7.203],
 [10, 100, 333, '≥45HRC', '锡青铜', 2.136, 0.779, 1.77],
 [33.808, 112, 960, '≥45HRC', '锡青铜', 1.125, 0.911, 6.775]].forEach(function (c) {
  var r = wd3(c[0], c[1], c[2], c[3], c[4]);
  ok(r && r.phiV === c[5] && r.efficiency === c[6] && r.vS === c[7],
    'wd3 g=' + c[0] + ' ' + c[4] + c[3], JSON.stringify(r) + ' api pv=' + c[5] + ' eta=' + c[6] + ' vs=' + c[7]);
});
console.log('== wormDrive3（全量扫描数据：锡青铜/铝铁青铜/灰铸铁 × 2 硬度） ==');
var FILES = [
  ['phiv_xc_45.txt', '锡青铜', '≥45HRC', 'xc45'],
  ['phiv_xc_45less.txt', '锡青铜', '<45HRC', 'xc45l'],
  ['phiv_lqt_45.txt', '铝铁青铜', '≥45HRC', 'lqt'],
  ['phiv_lqt_45less.txt', '铝铁青铜', '<45HRC', 'lqt'],
  ['phiv_htz_45.txt', '灰铸铁', '≥45HRC', 'lqt'],
  ['phiv_htz_45less.txt', '灰铸铁', '<45HRC', 'htz45l']
];
FILES.forEach(function (F) {
  var txt = fs.readFileSync('/workspace/.tmp_probe/' + F[0], 'utf8');
  var n = 0;
  txt.split('\n').forEach(function (line) {
    var m = line.match(/vS_req=([\d.]+) n1=([\d.]+).*?"flag":(true|false).*?"phiV":([\d.]+),"efficiency":([\d.]+),"vS":([\d.]+)/);
    var mf = line.match(/vS_req=([\d.]+) n1=([\d.]+).*?"flag":false/);
    if (m) {
      var r = wd3(10, 100, +m[2], F[2], F[1]);
      ok(r && r.phiV === +m[4] && r.efficiency === +m[5] && r.vS === +m[6],
        F[0] + ' vS_req=' + m[1], JSON.stringify(r) + ' api pv=' + m[4] + ' eta=' + m[5] + ' vs=' + m[6]);
      n++;
    } else if (mf) {
      var rn = wd3(10, 100, +mf[2], F[2], F[1]);
      ok(rn === null, F[0] + ' vS_req=' + mf[1] + ' 应 flag:false', 'calc=' + JSON.stringify(rn));
      n++;
    }
  });
  console.log('  (' + F[0] + ' checked ' + n + ' rows)');
});

/* ============ wormDrive4: yBeta/zV2/kFN/σFP/σF ============ */
console.log('== wormDrive4 ==');
[[1.2075, 948.4, 2.87, 11.31, 8, 80, 328, 41, 52200000, 56, 0.92, 0.644, 36.09, 22.02, 43.48],
 [1.0, 1000, 2.0, 5, 5, 50, 300, 60, 1000000, 40, 0.96, 1.0, 40.0, 39.34, 60.69],
 [1.6, 3333.3, 3.0, 15, 10, 90, 310, 31, 2500000000, 80, 0.89, 0.541, 43.32, 78.34, 34.4],
 [1.15, 555.55, 2.5, 8, 6.3, 63, 371.7, 59, 50000, 64, 0.94, 1.292, 82.66, 15.62, 60.76],
 [1.2075, 948.4, 2.87, 11.31, 8, 80, 328, 41, 10000000, 56, 0.92, 0.774, 43.36, 22.02, 43.48],
 [1.2, 800, 2.5, 10, 3.15, 35.5, 166.95, 53, 1000000, 64, 0.93, 1.0, 64.0, 182.64, 55.49],
 [1.35, 1234.5, 2.66, 18.435, 6.3, 63, 371.7, 59, 8760000, 73, 0.87, 0.786, 57.36, 39.92, 69.1]].forEach(function (c) {
  var k = c[0], T2 = c[1], yFa2 = c[2], g = c[3], m = c[4], d1 = c[5], d2 = c[6], z2 = c[7], N = c[8], sfb = c[9];
  var yBetaRaw = 1 - g / 140;
  var zV2 = r2(z2 / Math.pow(Math.cos(g * D), 3));
  var Nc = Math.min(Math.max(N, 1e5), 2.5e8);
  var kfnRaw = Math.pow(1e6 / Nc, 1 / 9);
  var sfA = r2(sfb * kfnRaw);
  var qRaw = d1 / m, qR2 = r2(d1 / m);
  var sRaw = r2(1.53 * k * T2 * 1000 * yFa2 * yBetaRaw / (m * m * m * qRaw * z2));
  var sR2q = r2(1.53 * k * T2 * 1000 * yFa2 * yBetaRaw / (m * m * m * qR2 * z2));
  var sR2beta = r2(1.53 * k * T2 * 1000 * yFa2 * r2(yBetaRaw) / (m * m * m * qRaw * z2));
  ok(r2(yBetaRaw) === c[10] && zV2 === c[14] && r3(kfnRaw) === c[11] && sfA === c[12],
    'wd4 coef g=' + g, 'yBeta=' + r2(yBetaRaw) + '/' + c[10] + ' zV2=' + zV2 + '/' + c[14] + ' kFN=' + r3(kfnRaw) + '/' + c[11] + ' sfA=' + sfA + '/' + c[12]);
  ok(sRaw === c[13], 'wd4 sigmaF(q raw,yBeta raw)', 'calc=' + sRaw + ' api=' + c[13] + ' [qR2=' + sR2q + ' betaR2=' + sR2beta + ']');
});

/* ============ wormDrive5 ============ */
console.log('== wormDrive5 ==');
[[59.27, 948.4, 8, 80, 328, 295.2, 2104.81, 0.08, 1481.75, 670786.35, 0.01, 60.8],
 [100, 2000, 10, 90, 310, 280, 4696.39, 0.09, 2222.22, 931420.18, 0.0124, 66.0],
 [12.5, 250.25, 4, 40, 280, 250, 650.6, 0.04, 625.0, 41924.15, 0.034, 30.4],
 [33.33, 666.66, 6.3, 63, 371.7, 334.5, 1305.59, 0.063, 1058.1, 257980.25, 0.0247, 47.88],
 [59.273, 800.137, 3.15, 35.5, 166.95, 150.26, 3488.78, 0.0355, 3339.32, 29914.07, 0.0554, 27.94]].forEach(function (c) {
  var T1 = c[0], T2 = c[1], m = c[2], d1 = c[3], d2 = c[4], L = c[5];
  var ft1Raw = 2 * T1 * 1000 / d1, fr1Raw = 2 * T2 * 1000 * Math.tan(20 * D) / d2;
  var dF1Raw = d1 - 2.4 * m;
  var IRaw = Math.PI * Math.pow(dF1Raw, 4) / 64;
  var F = Math.sqrt(ft1Raw * ft1Raw + fr1Raw * fr1Raw);
  var yRaw = F * Math.pow(L, 3) / (48 * 206000 * IRaw);
  ok(r2(ft1Raw) === c[8] && r2(fr1Raw) === c[6] && r2(dF1Raw) === c[11] && r2(IRaw) === c[9] && r4(yRaw) === c[10] && r4(d1 * 0.001) === c[7],
    'wd5 d1=' + d1 + ' m=' + m,
    'ft1=' + r2(ft1Raw) + '/' + c[8] + ' fr1=' + r2(fr1Raw) + '/' + c[6] + ' dF1=' + r2(dF1Raw) + '/' + c[11] +
    ' I=' + r2(IRaw) + '/' + c[9] + ' y=' + r4(yRaw) + '/' + c[10] + ' yA=' + r4(d1 * 0.001) + '/' + c[7]);
});

/* ============ wormDrive6 ============ */
console.log('== wormDrive6 ==');
[[0.87, 60, 20, 8.5, 9, 3.44, 2.29],
 [0.75, 70, 30, 12, 5.5, 2.86, 2.29],
 [0.596, 65, 25, 10, 2.2, 2.22, 1.62],
 [0.8, 60, 20, 15, 100, 33.33, 22.22]].forEach(function (c) {
  var e = c[0], t0 = c[1], t1 = c[2], ad = c[3], P = c[4];
  var S = r2(1000 * P * (1 - e) / (ad * (t0 - t1)));
  var Smin = r2(1000 * P * (1 - e) / (ad * (80 - t1)));
  ok(S === c[5] && Smin === c[6], 'wd6 e=' + e, 'S=' + S + '/' + c[5] + ' Smin=' + Smin + '/' + c[6]);
});

console.log('\n==== TOTAL: pass=' + pass + ' fail=' + fail + ' ====');
