/* 普通平带传动设计计算 — 自测脚本
 * 1) 模拟浏览器加载 js/app.js + js/tools/trans2_flat.js
 * 2) 单元测试：分步中间量 vs spec_flat.md 记录的 API 探针结果（离线）
 * 3) 全链测试：compute() 的 debug 中间量逐字段调用 mechtool.cn API 比对（在线，curl）
 * 用法：node .tmp_probe/test_flat.js [--offline]
 */
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var cp = require('child_process');

var ROOT = path.resolve(__dirname, '..');
var OFFLINE = process.argv.indexOf('--offline') >= 0;

/* ---------- 模拟浏览器环境 ---------- */
var sandbox = { window: {}, console: console, Math: Math, isNaN: isNaN, Number: Number, String: String, JSON: JSON };
vm.createContext(sandbox);
function load(file) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
}
load('js/app.js');
sandbox.App = sandbox.window.App; /* 工具文件以全局 App 引用 */
load('js/tools/trans2_flat.js');
var tool = sandbox.App.getTool('flat-belt-design');
if (!tool) { console.error('FATAL: flat-belt-design 未注册'); process.exit(1); }
var itl = tool.internals;

var pass = 0, fail = 0, liveDone = 0, liveSkip = 0;
function ok(cond, name, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name + (detail ? '  [' + detail + ']' : '')); }
  else { fail++; console.log('  FAIL  ' + name + '  ' + (detail || '')); }
}
function eqNum(a, b, tol) {
  if (a === null || b === null || a === undefined || b === undefined) return false;
  return Math.abs(Number(a) - Number(b)) <= (tol || 1e-9);
}
function deepEq(o1, o2, tol) {
  var k1 = Object.keys(o1).sort(), k2 = Object.keys(o2).sort();
  if (k1.join(',') !== k2.join(',')) return false;
  return k1.every(function (k) { return eqNum(o1[k], o2[k], tol); });
}

/* ---------- API 调用（curl，自动走代理；网络抖动自动重试 3 次） ---------- */
function apiOnce(name, params) {
  var qs = Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  var out;
  try {
    out = cp.execFileSync('curl', ['-s', '--max-time', '25', '-X', 'POST',
      'https://www.mechtool.cn/calculation/' + name, '-d', qs,
      '-H', 'X-Requested-With: XMLHttpRequest', '-H', 'Content-Type: application/x-www-form-urlencoded'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) { return null; }
  try { return JSON.parse(out); } catch (e) { return null; }
}
function api(name, params) {
  var r = null;
  /* 沙箱出口偶发 SSL_ERROR_SYSCALL（环境抖动，非 API 限流），多次重试 */
  for (var t = 0; t < 6; t++) {
    r = apiOnce(name, params);
    if (r && r.flag === true) return r;
    cp.execSync('sleep 1');
  }
  return r;
}

/* ============ 一、单元测试（对照 spec_flat.md 记录的 API 探针结果） ============ */
console.log('\n== 一、flatbeltKAlphaQuery（表13-1-71 插值，α∈[120,220]） ==');
[[159.37, 0.938], [200, 1.1], [121, 0.823], [135, 0.865], [219.9, 1.2], [220, 1.2], [120, 0.82], [190, 1.05]]
  .forEach(function (c) { ok(eqNum(itl.kAlphaQuery(c[0]), c[1]), 'Kα(' + c[0] + '°)=' + c[1], 'got ' + itl.kAlphaQuery(c[0])); }); 
[119, 220.5, 95].forEach(function (a1) { ok(itl.kAlphaQuery(a1) === null, 'Kα(' + a1 + '°) 出界→null', 'got ' + itl.kAlphaQuery(a1)); });

console.log('\n== 二、flatbeltP0Query ordinary（表13-1-70 双线性插值×σ0修正） ==');
[[30, 10, 1.8, 2.1], [33, 10, 1.8, 2.16], [30, 10.5, 1.8, 2.2], [42.5, 17.2, 1.8, 3.465], [45, 12.34, 1.8, 2.668],
 [30, 10, 1.6, 1.936], [30, 10, 2.0, 2.264], [30, 10, 2.2, 2.428], [30, 10, 1.2, 1.609]]
  .forEach(function (c) { var g = itl.p0Ordinary(c[0], c[1], c[2]); ok(eqNum(g, c[3]), 'P0(' + c[0] + ',' + c[1] + ',' + c[2] + ')=' + c[3], 'got ' + g); });
[[20, 10, 1.8], [150, 10, 1.8], [30, 3, 1.8], [30, 35, 1.8]].forEach(function (c) {
  ok(itl.p0Ordinary(c[0], c[1], c[2]) === null, 'P0(' + c.join(',') + ') 出界→null');
});

console.log('\n== 三、flatbeltP0Query nylon（表13-1-76 插值，v∈[10,70]） ==');
[['EL', 10, 0.06], ['EL', 12.5, 0.0745], ['EH', 20, 0.543], ['EEH', 42, 1.3992], ['H', 55, 0.774], ['H', 57.5, 0.781],
 ['H', 60, 0.7763333333333333], ['M', 62.5, 0.5403333333333333], ['L', 67.5, 0.374], ['M', 25, 0.333]]
  .forEach(function (c) { var g = itl.p0Nylon(c[0], c[1]); ok(eqNum(g, c[2]), 'P0nylon(' + c[0] + ',' + c[1] + ')=' + c[2], 'got ' + g); });
[['EL', 8], ['EL', 75]].forEach(function (c) { ok(itl.p0Nylon(c[0], c[1]) === null, 'P0nylon(' + c.join(',') + ') 出界→null'); });

console.log('\n== 四、flatbelt1（计算带长/包角/Kα） ==');
[[224, 800, 1600, 'open', { a: 1600.0, calBeltLen: 4860.34, kAlpha: 0.938, alpha1: 159.37 }],
 [224, 800, 1600, 'cross', { a: 1600.0, calBeltLen: 4972.34, kAlpha: 1.183, alpha1: 216.67 }],
 [224, 800, 1600, 'halfCross', { a: 1600.0, calBeltLen: 4916.34, kAlpha: 1.04, alpha1: 188.02 }],
 [200, 630, 1245, 'cross', { a: 1245.0, calBeltLen: 3932.09, kAlpha: 1.191, alpha1: 218.2 }]]
  .forEach(function (c) {
    var g = itl.belt1(c[0], c[1], c[2], c[3]);
    ok(g && deepEq(g, c[4]), 'belt1(' + c.slice(0, 4).join(',') + ')', 'got ' + JSON.stringify(g));
  });

console.log('\n== 五、flatbeltAlpha1（实际轴间距下的包角/Kα） ==');
[[224, 800, 1627.95, 'open', { kAlpha: 0.939, alpha1: 159.73 }],
 [224, 800, 1627.95, 'cross', { kAlpha: 1.18, alpha1: 216.04 }],
 [100, 355, 800, 'halfCross', { kAlpha: 1.036, alpha1: 187.16 }]]
  .forEach(function (c) {
    var g = itl.alpha1Query(c[0], c[1], c[2], c[3]);
    ok(g && deepEq(g, c[4]), 'alpha1Query(' + c.slice(0, 4).join(',') + ')', 'got ' + JSON.stringify(g));
  });

console.log('\n== 六、flatbelt2（A/b/Fr） ==');
[[7.5, 2.1, 0.938, 1, 'ordinary', 6, 159.37, 1.8, { A: 3.81, b: 63.46, Fr: 1348.54 }],
 [7.5, 2.1, 0.938, 0.9, 'ordinary', 6, 159.37, 1.8, { A: 4.23, b: 70.51, Fr: 1498.38 }],
 [12.75, 3.465, 1.04, 1, 'ordinary', 9.6, 188.02, 2.0, { A: 3.54, b: 36.86, Fr: 1411.79 }],
 [7.5, 0.543, 0.938, 1, 'nylon', 4.8, 159.37, 3, { b: 14.73, Fr: 417.23 }],
 [5.4, 0.2, 1.15, 0.8, 'nylon', 2.4, 210.5, 3, { b: 29.35, Fr: 407.73 }]]
  .forEach(function (c) {
    var g = itl.belt2(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7]);
    ok(g && deepEq(g, c[8]), 'belt2(' + c.slice(0, 8).join(',') + ')', 'got ' + JSON.stringify(g));
  });

/* ============ 二、全链测试（在线 API 逐字段比对） ============ */
console.log('\n== 七、全链 6 组（开口/交叉/半交叉 × 胶帆布/尼龙，在线比对） ==');
function runCase(idx, vals, label) {
  var r = tool.compute(vals);
  if (!r || r.error) { ok(false, 'L' + idx + ' ' + label + ' compute', r ? r.error : 'null'); return; }
  var d = r.debug;
  /* 1) flatbelt1 */
  var r1 = api('flatbelt1', { d1: d.d1, d2: d.d2, a0: d.a0, transmissionType: d.transmissionType });
  if (!r1 || r1.flag !== true) { ok(false, 'L' + idx + ' flatbelt1 调用失败', JSON.stringify(r1)); return; }
  ok(eqNum(r1.resultData.calBeltLen, d.L0), 'L' + idx + ' flatbelt1.calBeltLen=' + d.L0, 'api ' + r1.resultData.calBeltLen);
  ok(eqNum(r1.resultData.a, d.a0), 'L' + idx + ' flatbelt1.a=' + d.a0, 'api ' + r1.resultData.a);
  /* 2) flatbeltAlpha1（实际 a） */
  var r2 = api('flatbeltAlpha1', { d1: d.d1, d2: d.d2, a: d.a, transmissionType: d.transmissionType });
  ok(r2 && r2.flag && eqNum(r2.resultData.alpha1, d.alpha1), 'L' + idx + ' alpha1=' + d.alpha1, 'api ' + (r2 && r2.resultData && r2.resultData.alpha1));
  ok(r2 && r2.flag && eqNum(r2.resultData.kAlpha, d.kAlpha), 'L' + idx + ' kAlpha=' + d.kAlpha, 'api ' + (r2 && r2.resultData && r2.resultData.kAlpha));
  /* 3) flatbeltP0Query */
  var q3 = d.beltCategory === 'nylon'
    ? api('flatbeltP0Query', { beltCategory: 'nylon', nylonBeltType: d.nylonBeltType, velocity: d.v })
    : api('flatbeltP0Query', { beltCategory: 'ordinary', d1OverDelta: d.d1od, velocity: d.v, sigma0: d.sigma0 });
  ok(q3 && q3.flag && eqNum(q3.resultData, d.P0, 1e-9), 'L' + idx + ' P0=' + d.P0, 'api ' + (q3 && q3.resultData));
  /* 4) flatbelt2 */
  var r4 = api('flatbelt2', { Pd: d.Pd, P0: d.P0, kAlpha: d.kAlpha, kBeta: d.kBeta, beltCategory: d.beltCategory, delta: d.delta, alpha1: d.alpha1, sigma0: d.sigma0 });
  if (!r4 || r4.flag !== true) { ok(false, 'L' + idx + ' flatbelt2 调用失败', JSON.stringify(r4)); return; }
  if (d.beltCategory === 'ordinary') ok(eqNum(r4.resultData.A, d.A), 'L' + idx + ' A=' + d.A, 'api ' + r4.resultData.A);
  ok(eqNum(r4.resultData.b, d.b), 'L' + idx + ' b=' + d.b, 'api ' + r4.resultData.b);
  ok(eqNum(r4.resultData.Fr, d.Fr), 'L' + idx + ' Fr=' + d.Fr, 'api ' + r4.resultData.Fr);
  liveDone++;
}

function V(o) { /* 全部转为字符串以模拟 collectValues */
  var s = {};
  Object.keys(o).forEach(function (k) { s[k] = String(o[k]); });
  return s;
}
var base = { P: 5, n1: 1460, n2: 400, i: '', KA: 1.5, eps: 0.01, d1Coeff: '1250', d1: '', d2: '',
  type: 'open', a0: '', beltCat: 'ordinary', nylonType: 'EL', delta: '', li: '', m: '2',
  sigma0: 1.8, form: 'simpleOpen', beta: '0_60' };

var cases = [
  [1, {}, '开口×胶帆布（全默认）'],
  [2, { type: 'cross', P: 10, n1: 960, n2: 480, KA: 1.3, a0: 1300 }, '交叉×胶帆布'],
  [3, { type: 'halfCross', P: 7.5, n1: 1440, n2: 720, a0: 2000 }, '半交叉×胶帆布'],
  [4, { beltCat: 'nylon', nylonType: 'EH', sigma0: 3 }, '开口×尼龙(EH)'],
  [5, { beltCat: 'nylon', nylonType: 'EEH', sigma0: 3, type: 'cross', P: 4, n1: 1200, n2: 480, a0: 1400 }, '交叉×尼龙(EEH)'],
  [6, { beltCat: 'nylon', nylonType: 'M', sigma0: 3, type: 'halfCross', P: 6, n1: 1450, n2: 580, a0: 1800 }, '半交叉×尼龙(M)'],
  [7, { d1: 224, d2: 800, a0: 1600, delta: 7.2 }, '开口×胶帆布（指定d1/d2/a0/δ）']
];

if (OFFLINE) {
  console.log('  [跳过] --offline：仅执行离线单元测试');
  liveSkip = cases.length;
} else {
  var probe = api('flatbeltKAlphaQuery', { alpha1: 180 });
  if (!probe || probe.flag !== true) {
    console.log('  [跳过] 无法访问 mechtool.cn API（网络不可达），仅执行离线单元测试');
    liveSkip = cases.length;
  } else {
    cases.forEach(function (c) {
      var vals = V(Object.assign({}, base, c[1]));
      runCase(c[0], vals, c[2]);
    });
  }
}

console.log('\n========================================');
console.log('PASS=' + pass + '  FAIL=' + fail + '  在线全链=' + liveDone + ' 组' + (liveSkip ? '（跳过 ' + liveSkip + ' 组）' : ''));
console.log(fail === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
process.exit(fail === 0 ? 0 : 1);
