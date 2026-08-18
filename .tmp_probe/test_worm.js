/* 普通圆柱蜗杆传动设计计算 — 自测脚本
 * 1) 模拟浏览器加载 js/app.js + js/tools/trans2_worm.js
 * 2) 离线单元测试：分步中间量 vs 已记录 API 探针结果（6 端点定点 + φV 全量扫描 6 文件，共 247 组）
 * 3) 全链测试：compute() 的 debug 中间量逐字段调用 mechtool.cn API 比对（在线，curl，9 组完整设计案例）
 * 4) 在线通过后自动生成 /workspace/.tmp_probe/spec_worm.md（探针记录）
 * 用法：node .tmp_probe/test_worm.js [--offline]
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
load('js/tools/trans2_worm.js');
var tool = sandbox.App.getTool('worm-drive-design');
if (!tool) { console.error('FATAL: worm-drive-design 未注册'); process.exit(1); }
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

/* ---------- API 调用（curl，自动走代理；网络抖动自动重试） ---------- */
function apiOnce(name, params) {
  var qs = Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  var out;
  try {
    out = cp.execFileSync('curl', ['-s', '--max-time', '25', '-X', 'POST',
      'https://www.mechtool.cn/calculation/cal/calculation_' + name, '-d', qs,
      '-H', 'X-Requested-With: XMLHttpRequest', '-H', 'Content-Type: application/x-www-form-urlencoded'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) { return null; }
  try { return JSON.parse(out); } catch (e) { return null; }
}
function api(name, params, allowFalse) {
  var r = null;
  /* 沙箱出口偶发 SSL_ERROR_SYSCALL（环境抖动，非 API 限流），多次重试 */
  for (var t = 0; t < 10; t++) {
    r = apiOnce(name, params);
    if (r !== null && (r.flag === true || (allowFalse && r.flag === false))) return r;
    cp.execSync('sleep 1');
  }
  return r;
}

/* ============ 一、离线单元测试（对照已记录 API 探针原始返回） ============ */
console.log('\n== 一、wormDrive1：最小中心距 a=∛(KT₂·10³(ZEZρ)²/[σH]²)（2位小数） ==');
/* [k, torque2, zRou, zE, sigmaHAllowable, api] */
[[1.2075, 948.4, 2.9, 160, 217.98, 173.13],
 [1.0, 1000, 3.0, 160, 200, 179.26],
 [1.5, 2500.5, 2.5, 155, 180.5, 258.56],
 [2.05, 123.456, 3.1, 160, 130, 154.45],
 [1.2075, 948.4, 2.9, 160, 217.985, 173.12],
 [1.2075, 948.416, 2.9, 160, 217.98, 173.13]].forEach(function (c) {
  ok(eqNum(itl.wd1(c[0], c[1], c[2], c[3], c[4]), c[5]),
    'wd1 k=' + c[0] + ' T2=' + c[1] + ' Zρ=' + c[2] + ' ZE=' + c[3] + ' [σH]=' + c[4] + ' → ' + c[5],
    'got ' + itl.wd1(c[0], c[1], c[2], c[3], c[4]));
});

console.log('\n== 二、wormDrive2：几何参数 {m2d1,q,x2,d2,gama} ==');
/* [m, z2, z1, d1, a, api{m2d1,q,x2,d2,gama}] */
[[8, 41, 2, 80, 200, { m2d1: 5120, q: 10, x2: -0.5, d2: 328, gama: 11.31 }],
 [10, 31, 4, 90, 250, { m2d1: 9000, q: 9, x2: 5, d2: 310, gama: 23.962 }],
 [5, 71, 1, 50, 200, { m2d1: 1250, q: 10, x2: -0.5, d2: 355, gama: 5.711 }],
 [3.15, 53, 2, 35.5, 125, { m2d1: 352.25, q: 11.27, x2: 7.548, d2: 166.95, gama: 10.063 }],
 [12.5, 29, 6, 112, 250, { m2d1: 17500, q: 8.96, x2: 1.02, d2: 362.5, gama: 33.808 }],
 [2, 40, 1, 22.4, 63, { m2d1: 89.6, q: 11.2, x2: 5.9, d2: 80, gama: 5.102 }]].forEach(function (c) {
  var g = itl.wd2(c[0], c[1], c[2], c[3], c[4]);
  var a = c[5];
  ok(g && eqNum(g.m2d1, a.m2d1) && eqNum(g.q, a.q) && eqNum(g.x2, a.x2) && eqNum(g.d2, a.d2) && eqNum(g.gama, a.gama),
    'wd2 m=' + c[0] + ' z2=' + c[1] + ' z1=' + c[2] + ' d1=' + c[3] + ' a=' + c[4],
    'got ' + JSON.stringify(g) + ' api ' + JSON.stringify(a));
});

console.log('\n== 三、wormDrive3：vS/φV/η（定点 + 出界） ==');
/* [gama, d1, n1, hardness, material, api{phiV,efficiency,vS} | null=flag:false] */
[[11.31, 80, 1450, '≥45HRC', '锡青铜', { phiV: 1.169, efficiency: 0.859, vS: 6.194 }],
 [18.435, 45, 2900, '≥45HRC', '铝铁青铜', { phiV: 1.794, efficiency: 0.859, vS: 7.203 }],
 [10, 100, 333, '≥45HRC', '锡青铜', { phiV: 2.136, efficiency: 0.779, vS: 1.77 }],
 [33.808, 112, 960, '≥45HRC', '锡青铜', { phiV: 1.125, efficiency: 0.911, vS: 6.775 }],
 [5.5, 63, 960, '<45HRC', '灰铸铁', null]].forEach(function (c) {
  var g = itl.wd3(c[0], c[1], c[2], c[3], c[4]);
  if (c[5] === null) ok(g === null, 'wd3 γ=' + c[0] + ' ' + c[4] + c[3] + ' vS 出界 → null（API flag:false）', 'got ' + JSON.stringify(g));
  else ok(g && eqNum(g.phiV, c[5].phiV) && eqNum(g.efficiency, c[5].efficiency) && eqNum(g.vS, c[5].vS),
    'wd3 γ=' + c[0] + ' d1=' + c[1] + ' n1=' + c[2] + ' ' + c[4] + c[3],
    'got ' + JSON.stringify(g) + ' api ' + JSON.stringify(c[5]));
});

console.log('\n== 四、wormDrive3：φV 表全量扫描（6 材料×硬度组合 × 35 点，gama=10/d1=100） ==');
var SWEEP = [
  ['phiv_xc_45.txt', '锡青铜', '≥45HRC'],
  ['phiv_xc_45less.txt', '锡青铜', '<45HRC'],
  ['phiv_lqt_45.txt', '铝铁青铜', '≥45HRC'],
  ['phiv_lqt_45less.txt', '铝铁青铜', '<45HRC'],
  ['phiv_htz_45.txt', '灰铸铁', '≥45HRC'],
  ['phiv_htz_45less.txt', '灰铸铁', '<45HRC']];
var sweepRows = 0, sweepFail = 0;
SWEEP.forEach(function (F) {
  var txt = fs.readFileSync(path.join(__dirname, F[0]), 'utf8');
  var n = 0;
  txt.split('\n').forEach(function (line) {
    var m = line.match(/vS_req=([\d.]+) n1=([\d.]+).*?"flag":(true|false).*?"resultData":(null|\{.*?\})/);
    if (!m) return;
    n++; sweepRows++;
    var g = itl.wd3(10, 100, +m[2], F[2], F[1]);
    if (m[3] === 'false') {
      if (g !== null) { sweepFail++; console.log('  FAIL  ' + F[0] + ' vS_req=' + m[1] + ' 应 flag:false，got ' + JSON.stringify(g)); }
    } else {
      var a = JSON.parse(m[4]);
      if (!(g && eqNum(g.phiV, a.phiV) && eqNum(g.efficiency, a.efficiency) && eqNum(g.vS, a.vS))) {
        sweepFail++; console.log('  FAIL  ' + F[0] + ' vS_req=' + m[1] + ' got ' + JSON.stringify(g) + ' api ' + m[4]);
      }
    }
  });
  console.log('  ----  ' + F[0] + '（' + F[1] + F[2] + '）checked ' + n + ' rows');
});
pass += sweepRows - sweepFail; fail += sweepFail;

console.log('\n== 五、wormDrive4：弯曲强度 {yBeta,zV2,kFN,sigmaFAllowable,sigmaF} ==');
/* [k,T2,yFa2,gama,m,d1,d2,z2,cycleTimes,sigmaFAllowableBasic, api{yBeta,kFN,sigmaFAllowable,sigmaF,zV2}] */
[[1.2075, 948.4, 2.87, 11.31, 8, 80, 328, 41, 52200000, 56, { yBeta: 0.92, kFN: 0.644, sigmaFAllowable: 36.09, sigmaF: 22.02, zV2: 43.48 }],
 [1.0, 1000, 2.0, 5, 5, 50, 300, 60, 1000000, 40, { yBeta: 0.96, kFN: 1.0, sigmaFAllowable: 40.0, sigmaF: 39.34, zV2: 60.69 }],
 [1.6, 3333.3, 3.0, 15, 10, 90, 310, 31, 2500000000, 80, { yBeta: 0.89, kFN: 0.541, sigmaFAllowable: 43.32, sigmaF: 78.34, zV2: 34.4 }],
 [1.15, 555.55, 2.5, 8, 6.3, 63, 371.7, 59, 50000, 64, { yBeta: 0.94, kFN: 1.292, sigmaFAllowable: 82.66, sigmaF: 15.62, zV2: 60.76 }],
 [1.2075, 948.4, 2.87, 11.31, 8, 80, 328, 41, 10000000, 56, { yBeta: 0.92, kFN: 0.774, sigmaFAllowable: 43.36, sigmaF: 22.02, zV2: 43.48 }],
 [1.2, 800, 2.5, 10, 3.15, 35.5, 166.95, 53, 1000000, 64, { yBeta: 0.93, kFN: 1.0, sigmaFAllowable: 64.0, sigmaF: 182.64, zV2: 55.49 }],
 [1.35, 1234.5, 2.66, 18.435, 6.3, 63, 371.7, 59, 8760000, 73, { yBeta: 0.87, kFN: 0.786, sigmaFAllowable: 57.36, sigmaF: 39.92, zV2: 69.1 }]]
  .forEach(function (c) {
    var g = itl.wd4(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9]);
    var a = c[10];
    ok(g && eqNum(g.yBeta, a.yBeta) && eqNum(g.zV2, a.zV2) && eqNum(g.kFN, a.kFN) && eqNum(g.sigmaFAllowable, a.sigmaFAllowable) && eqNum(g.sigmaF, a.sigmaF),
      'wd4 k=' + c[0] + ' T2=' + c[1] + ' γ=' + c[3] + ' m=' + c[4] + ' N=' + c[8],
      'got ' + JSON.stringify(g) + ' api ' + JSON.stringify(a));
  });

console.log('\n== 六、wormDrive5：受力与刚度 {forceT1,forceR1,dF1,inertia,maxY,yAllowable} ==');
/* [torque,torque2,m,d1,d2,distanceL, api{forceT1,forceR1,dF1,inertia,maxY,yAllowable}] */
[[59.27, 948.4, 8, 80, 328, 295.2, { forceT1: 1481.75, forceR1: 2104.81, dF1: 60.8, inertia: 670786.35, maxY: 0.01, yAllowable: 0.08 }],
 [100, 2000, 10, 90, 310, 280, { forceT1: 2222.22, forceR1: 4696.39, dF1: 66.0, inertia: 931420.18, maxY: 0.0124, yAllowable: 0.09 }],
 [12.5, 250.25, 4, 40, 280, 250, { forceT1: 625.0, forceR1: 650.6, dF1: 30.4, inertia: 41924.15, maxY: 0.034, yAllowable: 0.04 }],
 [33.33, 666.66, 6.3, 63, 371.7, 334.5, { forceT1: 1058.1, forceR1: 1305.59, dF1: 47.88, inertia: 257980.25, maxY: 0.0247, yAllowable: 0.063 }],
 [59.273, 800.137, 3.15, 35.5, 166.95, 150.26, { forceT1: 3339.32, forceR1: 3488.78, dF1: 27.94, inertia: 29914.07, maxY: 0.0554, yAllowable: 0.0355 }]]
  .forEach(function (c) {
    var g = itl.wd5(c[0], c[1], c[2], c[3], c[4], c[5]);
    var a = c[6];
    ok(g && eqNum(g.forceT1, a.forceT1) && eqNum(g.forceR1, a.forceR1) && eqNum(g.dF1, a.dF1) && eqNum(g.inertia, a.inertia) && eqNum(g.maxY, a.maxY) && eqNum(g.yAllowable, a.yAllowable),
      'wd5 T=' + c[0] + ' T2=' + c[1] + ' m=' + c[2] + ' d1=' + c[3] + ' L=' + c[5],
      'got ' + JSON.stringify(g) + ' api ' + JSON.stringify(a));
  });

console.log('\n== 七、wormDrive6：热平衡 {coolingArea,minCoolingArea} ==');
[[0.87, 60, 20, 8.5, 9, { coolingArea: 3.44, minCoolingArea: 2.29 }],
 [0.75, 70, 30, 12, 5.5, { coolingArea: 2.86, minCoolingArea: 2.29 }],
 [0.596, 65, 25, 10, 2.2, { coolingArea: 2.22, minCoolingArea: 1.62 }],
 [0.8, 60, 20, 15, 100, { coolingArea: 33.33, minCoolingArea: 22.22 }]].forEach(function (c) {
  var g = itl.wd6(c[0], c[1], c[2], c[3], c[4]);
  ok(g && eqNum(g.coolingArea, c[5].coolingArea) && eqNum(g.minCoolingArea, c[5].minCoolingArea),
    'wd6 η=' + c[0] + ' t0=' + c[1] + ' t1=' + c[2] + ' αd=' + c[3] + ' P=' + c[4],
    'got ' + JSON.stringify(g) + ' api ' + JSON.stringify(c[5]));
});

console.log('\n== 八、辅助函数：z1 推荐与 Zρ 拟合 ==');
[[5, '6'], [6, '6'], [7, '4'], [8, '4'], [9, '4,(3)'], [13, '4,(3)'], [14, '2,(4,3)'], [24, '2,(4,3)'],
 [25, '2,(3)'], [27, '2,(3)'], [28, '1,(2)'], [40, '1,(2)'], [41, '1'], [80, '1'], [4, undefined], [0, undefined]]
  .forEach(function (c) { ok(itl.assumeZ1Query(c[0]) === c[1], 'assumeZ1Query(' + c[0] + ')=' + c[1], 'got ' + itl.assumeZ1Query(c[0])); });
[[0.25, 3.33], [0.3, 3.1], [0.35, 2.9], [0.4, 2.75], [0.45, 2.65], [0.5, 2.59]].forEach(function (c) {
  ok(eqNum(itl.zRouCal(c[0]), c[1]), 'Zρ(d1/a=' + c[0] + ')=' + c[1] + '（原站拟合多项式）', 'got ' + itl.zRouCal(c[0]));
});
/* GB/T 10085 匹配表：53 对（含括号内尽量不用的值），且含 m²d1 验证 */
ok(itl.md1.length === 53, 'GB/T 10085 m-d1 匹配表 53 对', 'got ' + itl.md1.length);
[[8, 80, 5120], [12.5, 112, 17500], [25, 400, 250000], [1, 18, 18]].forEach(function (c) {
  var hit = itl.md1.some(function (p) { return p[0] === c[0] && p[1] === c[1]; });
  ok(hit && eqNum(c[0] * c[0] * c[1], c[2]), '匹配表含 m=' + c[0] + ',d1=' + c[1] + '（m²d1=' + c[2] + '）');
});

/* ============ 二、全链测试（在线 API 逐字段比对） ============ */
/* 案例输入：由工具 inputs 默认值生成（模拟表单 collectValues），再叠加案例覆盖 */
function defaults() {
  var v = {};
  tool.inputs.forEach(function (f) { v[f.key] = String(f.default === undefined ? '' : f.default); });
  return v;
}
function V(o) { var s = {}; Object.keys(o).forEach(function (k) { s[k] = String(o[k]); }); return s; }

/* 9 组完整设计案例：z1∈{1,2,4,6}；材料×硬度 6 组合；i∈{6,8,10,15,20,31,40}；n1∈{720~2900}；
 * 含手动转矩/η0/T2/L′ 覆盖分支、vS 出界分支 */
var CASES = [
  { no: 1, label: '基准案例：锡青铜+≥45HRC，z1=2，i=20，n1=1450（蜗杆下置减速器，全默认）', ov: {} },
  { no: 2, label: '锡青铜+<45HRC（砂型 ZCuSn10P1），z1=4，i=10，n1=2900 高速',
    ov: { power: 5.5, n1: 2900, transmissionRatio: 10, n2: '', lifeTime: 12000,
      wormHardness: '<45HRC', basicSigmaHAllowable: 150, sigmaFAllowableBasic: 40, yFa2: 2.3,
      centerDisAFinal: 125, m: 5, d1: 50, z1: 4, z2: 40, kA: 1.0, kV: 1.1, kBeta: 1 } },
  { no: 3, label: '铝铁青铜 ZCuAl10Fe3+≥45HRC，z1=6，i=6，n1=720 多头大传动',
    ov: { power: 15, n1: 720, transmissionRatio: 6, n2: '', lifeTime: 8000,
      wormWheelMaterial: '铝铁青铜', basicSigmaHAllowable: 160, sigmaFAllowableBasic: 90, yFa2: 2.24,
      centerDisAFinal: 225, m: 10, d1: 90, z1: 6, z2: 36, kA: 1.2, kV: 1.05, kBeta: 1.3,
      t0: 65, t1: 25, alphaD: 10 } },
  { no: 4, label: '灰铸铁 HT200+≥45HRC，z1=2，i=20，n1=730 低速（vS≈1.56<2）',
    ov: { power: 2.2, n1: 730, transmissionRatio: 20, n2: '', lifeTime: 12000,
      wormWheelMaterial: '灰铸铁', basicSigmaHAllowable: 154, sigmaFAllowableBasic: 48, yFa2: 2.47,
      centerDisAFinal: 100, m: 4, d1: 40, z1: 2, z2: 40, kA: 1.0, kV: 1.0, kBeta: 1.0,
      t0: 70, t1: 25, alphaD: 12 } },
  { no: 5, label: '灰铸铁 HT150+<45HRC（蜗杆未淬火），z1=1，i=40，n1=960 单头大传动比',
    ov: { power: 1.5, n1: 960, transmissionRatio: 40, n2: '', lifeTime: 20000,
      wormWheelMaterial: '灰铸铁', wormHardness: '<45HRC', basicSigmaHAllowable: 106, sigmaFAllowableBasic: 40, yFa2: 2.49,
      centerDisAFinal: 64, m: 2.5, d1: 28, z1: 1, z2: 40, kA: 1.15, kV: 1.0, kBeta: 1.0,
      t0: 65, t1: 25, alphaD: 10 } },
  { no: 6, label: '锡青铜 ZCuSn10P1 金属型+≥45HRC，z1=2，i=15，n1=1470 大功率（P=30kW）',
    ov: { power: 30, n1: 1470, transmissionRatio: 15, n2: '', lifeTime: 10000,
      basicSigmaHAllowable: 268, sigmaFAllowableBasic: 56, yFa2: 2.47,
      centerDisAFinal: 250, m: 12.5, d1: 112, z1: 2, z2: 30, kA: 1.2, kV: 1.1, kBeta: 1.3 } },
  { no: 7, label: '手动输入分支：T=25 N·m、η0=0.8、T2=650、L′=60，z1=1，i=31，n1=960',
    ov: { power: '', torque: 25, assumeEfficiency: 0.8, torque2: 650, n1: 960, transmissionRatio: 31, n2: '', lifeTime: 15000,
      basicSigmaHAllowable: 180, sigmaFAllowableBasic: 56, yFa2: 2.5,
      centerDisAFinal: 42.2, m: 2, d1: 22.4, z1: 1, z2: 31, distanceL: 60,
      kA: 1.15, kV: 1.0, kBeta: 1.3, t0: 65, t1: 25, alphaD: 10 } },
  { no: 8, label: '铝铁青铜+<45HRC，z1=4，i=8，n1=2880（同表验证）',
    ov: { power: 3, n1: 2880, transmissionRatio: 8, n2: '', lifeTime: 6000,
      wormWheelMaterial: '铝铁青铜', wormHardness: '<45HRC', basicSigmaHAllowable: 210, sigmaFAllowableBasic: 80, yFa2: 2.2,
      centerDisAFinal: 84, m: 4, d1: 40, z1: 4, z2: 32, kA: 1.0, kV: 1.2, kBeta: 1.3,
      t0: 70, t1: 30, alphaD: 15 } },
  { no: 9, label: '出界分支：灰铸铁+<45HRC，n1=2900 → vS≈6.19≥2，wormDrive3 应 flag:false',
    ov: { power: 2.2, n1: 2900, transmissionRatio: 20, n2: '', lifeTime: 12000,
      wormWheelMaterial: '灰铸铁', wormHardness: '<45HRC', basicSigmaHAllowable: 106, sigmaFAllowableBasic: 40, yFa2: 2.47,
      centerDisAFinal: 100, m: 4, d1: 40, z1: 2, z2: 40 } }
];

var specCalls = []; /* 在线探针原始记录 → spec_worm.md */

function runCase(cs) {
  var vals = V(Object.assign(defaults(), cs.ov));
  var r = tool.compute(vals);
  if (!r || r.error) { ok(false, 'L' + cs.no + ' compute', r ? r.error : 'null'); return null; }
  var d = r.debug;
  var inp = vals;
  var rec = { no: cs.no, label: cs.label, inputs: vals, calls: [], allPass: true };

  function cmp(field, apiVal, toolVal) {
    var good = eqNum(apiVal, toolVal);
    if (!good) rec.allPass = false;
    ok(good, 'L' + cs.no + ' ' + field + '=' + toolVal, 'api ' + apiVal);
    return good;
  }
  function call(ep, params, note) {
    var res = api(ep, params, ep === 'wormDrive3' && d.vS === null);
    rec.calls.push({ ep: 'calculation_' + ep, params: params, res: res, note: note });
    return res;
  }

  /* 1) wormDrive1 最小中心距 */
  var r1 = call('wormDrive1', { k: d.k, torque2: d.torque2, zRou: d.zRou, zE: inp.zE, sigmaHAllowable: d.sigmaHAllowable });
  if (r1 && r1.flag === true) cmp('centerDisA', r1.resultData, d.centerDisA);
  else { ok(false, 'L' + cs.no + ' wormDrive1 调用', JSON.stringify(r1)); rec.allPass = false; }

  /* 2) wormDrive2 几何参数 */
  var r2 = call('wormDrive2', { m: inp.m, z2: inp.z2, z1: inp.z1, d1: inp.d1, a: inp.centerDisAFinal });
  if (r2 && r2.flag === true) {
    cmp('m2d1', r2.resultData.m2d1, d.m2d1); cmp('q', r2.resultData.q, d.q);
    cmp('x2', r2.resultData.x2, d.x2); cmp('d2', r2.resultData.d2, d.d2); cmp('gama', r2.resultData.gama, d.gama);
  } else { ok(false, 'L' + cs.no + ' wormDrive2 调用', JSON.stringify(r2)); rec.allPass = false; }

  /* 3) wormDrive3 vS/φV/η */
  var r3 = call('wormDrive3', { gama: d.gama, d1: inp.d1, n1: inp.n1, wormHardness: inp.wormHardness, wormWheelMaterial: inp.wormWheelMaterial });
  if (r3 && r3.flag === true) {
    cmp('vS', r3.resultData.vS, d.vS); cmp('phiV', r3.resultData.phiV, d.phiV); cmp('efficiency', r3.resultData.efficiency, d.efficiency);
  } else if (r3 && r3.flag === false) {
    ok(d.vS === null && d.phiV === null && d.efficiency === null, 'L' + cs.no + ' wormDrive3 flag:false ↔ 工具 vS/φV/η=null', 'tool vS=' + d.vS);
  } else { ok(false, 'L' + cs.no + ' wormDrive3 调用', JSON.stringify(r3)); rec.allPass = false; }

  /* 4) wormDrive4 弯曲强度 */
  var r4 = call('wormDrive4', { k: d.k, torque2: d.torque2, yFa2: inp.yFa2, gama: d.gama, m: inp.m, d1: inp.d1, d2: d.d2, z2: inp.z2, cycleTimes: d.cycleTimes, sigmaFAllowableBasic: inp.sigmaFAllowableBasic });
  if (r4 && r4.flag === true) {
    cmp('yBeta', r4.resultData.yBeta, d.yBeta); cmp('zV2', r4.resultData.zV2, d.zV2);
    cmp('kFN', r4.resultData.kFN, d.kFN); cmp('sigmaFAllowable', r4.resultData.sigmaFAllowable, d.sigmaFAllowable);
    cmp('sigmaF', r4.resultData.sigmaF, d.sigmaF);
  } else { ok(false, 'L' + cs.no + ' wormDrive4 调用', JSON.stringify(r4)); rec.allPass = false; }

  /* 5) wormDrive5 受力与刚度 */
  var r5 = call('wormDrive5', { torque: d.torque, torque2: d.torque2, m: inp.m, d1: inp.d1, d2: d.d2, distanceL: d.distanceL });
  if (r5 && r5.flag === true) {
    cmp('forceT1', r5.resultData.forceT1, d.forceT1); cmp('forceR1', r5.resultData.forceR1, d.forceR1);
    cmp('dF1', r5.resultData.dF1, d.dF1); cmp('inertia', r5.resultData.inertia, d.inertia);
    cmp('maxY', r5.resultData.maxY, d.maxY); cmp('yAllowable', r5.resultData.yAllowable, d.yAllowable);
  } else { ok(false, 'L' + cs.no + ' wormDrive5 调用', JSON.stringify(r5)); rec.allPass = false; }

  /* 6) wormDrive6 热平衡（效率可得时） */
  if (d.efficiency !== null) {
    var r6 = call('wormDrive6', { efficiency: d.efficiency, t0: inp.t0, t1: inp.t1, alphaD: inp.alphaD, power: d.power });
    if (r6 && r6.flag === true) {
      cmp('coolingArea', r6.resultData.coolingArea, d.coolingArea); cmp('minCoolingArea', r6.resultData.minCoolingArea, d.minCoolingArea);
    } else { ok(false, 'L' + cs.no + ' wormDrive6 调用', JSON.stringify(r6)); rec.allPass = false; }
  }

  liveDone++;
  return rec;
}

console.log('\n== 九、全链 9 组（材料×硬度×z1×i×n1 覆盖 + 手动/出界分支，在线逐字段比对） ==');
var liveRecords = [];
if (OFFLINE) {
  console.log('  [跳过] --offline：仅执行离线单元测试');
  liveSkip = CASES.length;
} else {
  var probe = api('wormDrive1', { k: 1.2075, torque2: 948.4, zRou: 2.9, zE: 160, sigmaHAllowable: 217.98 });
  if (!probe || probe.flag !== true) {
    console.log('  [跳过] 无法访问 mechtool.cn API（网络不可达），仅执行离线单元测试');
    liveSkip = CASES.length;
  } else {
    CASES.forEach(function (cs) {
      var rec = runCase(cs);
      if (rec) liveRecords.push(rec);
    });
  }
}

/* ============ 三、生成 spec_worm.md（探针记录，仅在线全通过时更新） ============ */
function fmtParams(p) {
  return Object.keys(p).map(function (k) { return k + '=' + p[k]; }).join(', ');
}
function writeSpec() {
  var L = [];
  L.push('# 普通圆柱蜗杆传动设计计算 — mechtool.cn 1:1 复刻探针记录');
  L.push('');
  L.push('页面：https://www.mechtool.cn/calculation/wormandwormwheeldrive.html');
  L.push('JS：/dist/js/mechtool/wormandwormwheeldrive.min.js（美化件 worm_drive.pretty.js）');
  L.push('端点：`POST https://www.mechtool.cn/calculation/cal/calculation_wormDrive{1..6}`（表单编码 + `X-Requested-With: XMLHttpRequest`，返回 JSON `{flag, resultData}`）');
  L.push('');
  L.push('## 端点清单');
  L.push('');
  L.push('| 端点 | 参数 | 返回 resultData |');
  L.push('|---|---|---|');
  L.push('| wormDrive1 | k, torque2, zRou, zE, sigmaHAllowable | 最小中心距 a（数值，2位小数） |');
  L.push('| wormDrive2 | m, z2, z1, d1, a | {m2d1, q, x2, d2, gama}（q/x2/d2/gama 2~3位小数） |');
  L.push('| wormDrive3 | gama, d1, n1, wormHardness(≥45HRC/<45HRC), wormWheelMaterial(锡青铜/铝铁青铜/灰铸铁) | {phiV, efficiency, vS}（3位小数；vS 超表适用范围 flag:false） |');
  L.push('| wormDrive4 | k, torque2, yFa2, gama, m, d1, d2, z2, cycleTimes, sigmaFAllowableBasic | {yBeta, zV2, kFN, sigmaFAllowable, sigmaF} |');
  L.push('| wormDrive5 | torque, torque2, m, d1, d2, distanceL | {forceT1, forceR1, dF1, inertia, maxY, yAllowable} |');
  L.push('| wormDrive6 | efficiency, t0, t1, alphaD, power | {coolingArea, minCoolingArea}（2位小数） |');
  L.push('');
  L.push('## 由探针反推的服务端公式（共 247 组单元验证 + 9 组全链验证）');
  L.push('');
  L.push('- wormDrive1：`a = ∛(K·T₂·10³·(ZE·Zρ)²/[σH]²)` → round2');
  L.push('- wormDrive2：`m²d1=m²·d1`、`q=d1/m`、`d2=m·z2`（round2）；`x2=a/m−(d1+m·z2)/(2m)`（round3）；`γ=arctan(z1·m/d1)`（round3）');
  L.push('- wormDrive3：`vS=πd1·n1/(60000·cosγ)`（原值查表）；fv 按 vS 在当量摩擦系数表中**线性插值**（φV=arctan fv）；`η=0.95·tanγ/tan(γ+φV)`（**η 用未舍入 φV**，vS/φV/η 均 round3）。fv 表（vS 节点→fv）：');
  L.push('  - 锡青铜+≥45HRC：0.01→0.110、0.05→0.090、0.10→0.080、0.25→0.065、0.50→0.055、1.0→0.045、1.5→0.040、2.0→0.035、2.5→0.030、3.0→0.028、4.0→0.024、5.0→0.022、8.0→0.018、10→0.016、15→0.014、24→0.013（vS∈(0.01,24)）');
  L.push('  - 锡青铜+<45HRC：0.01→0.120、0.05→0.100、0.10→0.090、0.25→0.075、0.50→0.065、1.0→0.055、1.5→0.050、2.0→0.045、2.5→0.040、3.0→0.035、4.0→0.031、5.0→0.029、8.0→0.026、10→0.024、15→0.020（vS∈(0.01,15)）');
  L.push('  - 铸铝铁青铜（两种硬度同表）：0.01→0.180、0.05→0.140、0.10→0.130、0.25→0.100、0.50→0.090、1.0→0.070、1.5→0.065、2.0→0.055、2.5→0.050、3.0→0.045、4.0→0.040、5.0→0.035、8.0→0.030（vS∈(0.01,8)；灰铸铁+≥45HRC 亦用此表但仅 vS∈(0.01,2)）');
  L.push('  - 灰铸铁+<45HRC：0.01→0.190、0.05→0.160、0.10→0.140、0.25→0.120、0.50→0.100、1.0→0.090、1.5→0.080、2.0→0.070（仅 vS∈(0.01,2)）');
  L.push('- wormDrive4：`Yβ=1−γ/140`（round2，σF 用未舍入值）；`Zv2=z2/cos³γ`（round2）；`KFN=(10⁶/N)^(1/9)`（N∈[10⁵,2.5×10⁸] 截断，round3，许用应力用未舍入值）；`[σF]=[σF]′·KFN`、`σF=1.53KT₂·10³·YFa2·Yβ/(m³·q·z2)`（q=d1/m 用未舍入值，round2）');
  L.push('- wormDrive5：`Ft1=2T·10³/d1`、`Fr1=2T₂·10³·tan20°/d2`、`df1=d1−2.4m`、`I=πdf1⁴/64`、`y=√(Ft1²+Fr1²)·L′³/(48EI)`（E=206000MPa，全用未舍入原值）、`[y]=d1/1000`（round2；y/[y] round4）');
  L.push('- wormDrive6：`S=1000P(1−η)/(αd(t0−t1))`、`Smin=1000P(1−η)/(αd(80−t1))` → round2');
  L.push('- 前端链式规则（worm_drive.pretty.js）：`T=9550P/n1`（round3）、`i=n1/n2` 或直输、z1 推荐 i=5~6→6、7~8→4、9~13→4(3)、14~24→2(4,3)、25~27→2(3)、28~40→1(2)、>40→1；`z2′=round(z1′·i)`、`η0=(100−3.5√(z2′/z1′))/100`（round3）、`T2=(z2′/z1′)·η0·T`（round3）、`K=KA·KV·Kβ`（round4）、`N=60n2·j·L`、锡青铜 `KHN=(10⁷/N)^(1/8)`（N∈[2.6×10⁵,2.5×10⁸] 截断）、铝铁青铜/灰铸铁 N 取 10⁷（KHN=1）、`[σH]=[σH]′·KHN`（round2）、`Zρ=8.809524(d1/a)²−9.583333(d1/a)+5.177143`（round2）；选定后须验算 `d1/a ≥ 假设值`；`L′` 缺省取 `0.9·d2`（round1）');
  L.push('');
  L.push('## 单元探针记录（原始返回，离线回归数据）');
  L.push('');
  L.push('### wormDrive1（2位小数）');
  L.push('| k | torque2 | zRou | zE | sigmaHAllowable | 返回 resultData |');
  L.push('|---|---|---|---|---|---|');
  [[1.2075, 948.4, 2.9, 160, 217.98, 173.13], [1.0, 1000, 3.0, 160, 200, 179.26],
   [1.5, 2500.5, 2.5, 155, 180.5, 258.56], [2.05, 123.456, 3.1, 160, 130, 154.45],
   [1.2075, 948.4, 2.9, 160, 217.985, 173.12], [1.2075, 948.416, 2.9, 160, 217.98, 173.13]]
    .forEach(function (c) { L.push('| ' + c.join(' | ') + ' |'); });
  L.push('');
  L.push('### wormDrive2');
  L.push('| m | z2 | z1 | d1 | a | 返回 resultData |');
  L.push('|---|---|---|---|---|---|');
  [[8, 41, 2, 80, 200, { m2d1: 5120, q: 10, x2: -0.5, d2: 328, gama: 11.31 }],
   [10, 31, 4, 90, 250, { m2d1: 9000, q: 9, x2: 5, d2: 310, gama: 23.962 }],
   [5, 71, 1, 50, 200, { m2d1: 1250, q: 10, x2: -0.5, d2: 355, gama: 5.711 }],
   [3.15, 53, 2, 35.5, 125, { m2d1: 352.25, q: 11.27, x2: 7.548, d2: 166.95, gama: 10.063 }],
   [12.5, 29, 6, 112, 250, { m2d1: 17500, q: 8.96, x2: 1.02, d2: 362.5, gama: 33.808 }],
   [2, 40, 1, 22.4, 63, { m2d1: 89.6, q: 11.2, x2: 5.9, d2: 80, gama: 5.102 }]]
    .forEach(function (c) { L.push('| ' + c.slice(0, 5).join(' | ') + ' | `' + JSON.stringify(c[5]) + '` |'); });
  L.push('');
  L.push('### wormDrive3（定点）');
  L.push('| gama | d1 | n1 | wormHardness | wormWheelMaterial | 返回 resultData |');
  L.push('|---|---|---|---|---|---|');
  [[11.31, 80, 1450, '≥45HRC', '锡青铜', { phiV: 1.169, efficiency: 0.859, vS: 6.194 }],
   [18.435, 45, 2900, '≥45HRC', '铝铁青铜', { phiV: 1.794, efficiency: 0.859, vS: 7.203 }],
   [10, 100, 333, '≥45HRC', '锡青铜', { phiV: 2.136, efficiency: 0.779, vS: 1.77 }],
   [33.808, 112, 960, '≥45HRC', '锡青铜', { phiV: 1.125, efficiency: 0.911, vS: 6.775 }],
   [5.5, 63, 960, '<45HRC', '灰铸铁', null]]
    .forEach(function (c) { L.push('| ' + c.slice(0, 5).join(' | ') + ' | ' + (c[5] === null ? 'flag:false（vS≈3.17≥2 出界）' : '`' + JSON.stringify(c[5]) + '`') + ' |'); });
  L.push('');
  L.push('### wormDrive3（φV 表全量扫描：gama=10、d1=100，vS=0.01~25，n1=vS·60000·cos10°/(π·100)）');
  L.push('');
  L.push('原始返回见 `phiv_xc_45.txt`、`phiv_xc_45less.txt`、`phiv_lqt_45.txt`、`phiv_lqt_45less.txt`、`phiv_htz_45.txt`、`phiv_htz_45less.txt`（各 35 行，含出界 flag:false 行），插值模型逐行验证一致（247 组汇总于 fit_all_worm.js）。要点：');
  L.push('');
  L.push('- 各表 vS 下界 0.01 处 flag:false（排他下界）；锡青铜≥45HRC 上界 24、<45HRC 上界 15、铝铁青铜上界 8、灰铸铁上界 2（vS≥上界 flag:false，灰铸铁实测 1.99 可算、2.0 起 false）');
  L.push('- 铝铁青铜两种硬度返回完全相同（同表）；灰铸铁+≥45HRC 用铝铁青铜表但值域截断到 vS<2');
  L.push('');
  L.push('### wormDrive4');
  L.push('| k | torque2 | yFa2 | gama | m | d1 | d2 | z2 | cycleTimes | sigmaFAllowableBasic | 返回 resultData |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|');
  [[1.2075, 948.4, 2.87, 11.31, 8, 80, 328, 41, 52200000, 56, { yBeta: 0.92, kFN: 0.644, sigmaFAllowable: 36.09, sigmaF: 22.02, zV2: 43.48 }],
   [1.0, 1000, 2.0, 5, 5, 50, 300, 60, 1000000, 40, { yBeta: 0.96, kFN: 1.0, sigmaFAllowable: 40.0, sigmaF: 39.34, zV2: 60.69 }],
   [1.6, 3333.3, 3.0, 15, 10, 90, 310, 31, 2500000000, 80, { yBeta: 0.89, kFN: 0.541, sigmaFAllowable: 43.32, sigmaF: 78.34, zV2: 34.4 }],
   [1.15, 555.55, 2.5, 8, 6.3, 63, 371.7, 59, 50000, 64, { yBeta: 0.94, kFN: 1.292, sigmaFAllowable: 82.66, sigmaF: 15.62, zV2: 60.76 }],
   [1.2075, 948.4, 2.87, 11.31, 8, 80, 328, 41, 10000000, 56, { yBeta: 0.92, kFN: 0.774, sigmaFAllowable: 43.36, sigmaF: 22.02, zV2: 43.48 }],
   [1.2, 800, 2.5, 10, 3.15, 35.5, 166.95, 53, 1000000, 64, { yBeta: 0.93, kFN: 1.0, sigmaFAllowable: 64.0, sigmaF: 182.64, zV2: 55.49 }],
   [1.35, 1234.5, 2.66, 18.435, 6.3, 63, 371.7, 59, 8760000, 73, { yBeta: 0.87, kFN: 0.786, sigmaFAllowable: 57.36, sigmaF: 39.92, zV2: 69.1 }]]
    .forEach(function (c) { L.push('| ' + c.slice(0, 10).join(' | ') + ' | `' + JSON.stringify(c[10]) + '` |'); });
  L.push('');
  L.push('### wormDrive5');
  L.push('| torque | torque2 | m | d1 | d2 | distanceL | 返回 resultData |');
  L.push('|---|---|---|---|---|---|---|');
  [[59.27, 948.4, 8, 80, 328, 295.2, { forceT1: 1481.75, forceR1: 2104.81, dF1: 60.8, inertia: 670786.35, maxY: 0.01, yAllowable: 0.08 }],
   [100, 2000, 10, 90, 310, 280, { forceT1: 2222.22, forceR1: 4696.39, dF1: 66.0, inertia: 931420.18, maxY: 0.0124, yAllowable: 0.09 }],
   [12.5, 250.25, 4, 40, 280, 250, { forceT1: 625.0, forceR1: 650.6, dF1: 30.4, inertia: 41924.15, maxY: 0.034, yAllowable: 0.04 }],
   [33.33, 666.66, 6.3, 63, 371.7, 334.5, { forceT1: 1058.1, forceR1: 1305.59, dF1: 47.88, inertia: 257980.25, maxY: 0.0247, yAllowable: 0.063 }],
   [59.273, 800.137, 3.15, 35.5, 166.95, 150.26, { forceT1: 3339.32, forceR1: 3488.78, dF1: 27.94, inertia: 29914.07, maxY: 0.0554, yAllowable: 0.0355 }]]
    .forEach(function (c) { L.push('| ' + c.slice(0, 6).join(' | ') + ' | `' + JSON.stringify(c[6]) + '` |'); });
  L.push('');
  L.push('### wormDrive6');
  L.push('| efficiency | t0 | t1 | alphaD | power | 返回 resultData |');
  L.push('|---|---|---|---|---|---|');
  [[0.87, 60, 20, 8.5, 9, { coolingArea: 3.44, minCoolingArea: 2.29 }],
   [0.75, 70, 30, 12, 5.5, { coolingArea: 2.86, minCoolingArea: 2.29 }],
   [0.596, 65, 25, 10, 2.2, { coolingArea: 2.22, minCoolingArea: 1.62 }],
   [0.8, 60, 20, 15, 100, { coolingArea: 33.33, minCoolingArea: 22.22 }]]
    .forEach(function (c) { L.push('| ' + c.slice(0, 5).join(' | ') + ' | `' + JSON.stringify(c[5]) + '` |'); });
  L.push('');
  L.push('## 全链设计探针（' + liveRecords.length + ' 组：compute() 链式中间量 → 6 端点逐字段比对）');
  L.push('');
  liveRecords.forEach(function (rec) {
    L.push('### 案例 ' + rec.no + '：' + rec.label + (rec.allPass ? '（全部一致 ✓）' : '（存在不一致 ✗）'));
    L.push('');
    L.push('表单输入（非默认项）：`' + (function () {
      var def = defaults();
      var diffs = [];
      Object.keys(rec.inputs).forEach(function (k) {
        if (String(rec.inputs[k]) !== String(def[k])) diffs.push(k + '=' + rec.inputs[k]);
      });
      return diffs.join('，');
    })() + '`');
    L.push('');
    L.push('| 端点 | 请求参数 | API 原始返回 |');
    L.push('|---|---|---|');
    rec.calls.forEach(function (c) {
      L.push('| ' + c.ep + ' | ' + fmtParams(c.params) + ' | `' + JSON.stringify(c.res) + '` |');
    });
    L.push('');
  });
  L.push('## 覆盖面说明');
  L.push('');
  L.push('- 蜗杆头数 z1 ∈ {1, 2, 4, 6}；蜗轮材料×蜗杆硬度 6 组合（锡青铜/铝铁青铜/灰铸铁 × ≥45HRC/<45HRC）');
  L.push('- 传动比 i ∈ {6, 8, 10, 15, 20, 31, 40}；蜗杆转速 n1 ∈ {720, 730, 960, 1450, 1470, 2880, 2900} r/min');
  L.push('- 手动输入分支：蜗杆转矩 T、初算效率 η₀、蜗轮转矩 T₂、支撑跨距 L′；自动派生分支：P↔T 换算、n₂=n₁/i 取整、L′=0.9d₂、锡青铜 KHN 寿命系数与铝铁青铜/灰铸铁 N=10⁷（KHN=1）');
  L.push('- 出界分支：灰铸铁 vS≥2 m/s → wormDrive3 flag:false（效率无法计算，前端提示手动计算）');
  L.push('- 注：蜗杆传动无「蜗轮上/蜗杆上」布置选项（原站表单亦无此项），以材料副×硬度×头数组合覆盖同等差异面');
  L.push('');
  L.push('（本文件由 test_worm.js 在线探针自动生成；生成时间：' + new Date().toISOString() + '）');
  fs.writeFileSync(path.join(__dirname, 'spec_worm.md'), L.join('\n'), 'utf8');
}

if (liveRecords.length > 0 && fail === 0) {
  writeSpec();
  console.log('\n[spec] 已生成 /workspace/.tmp_probe/spec_worm.md（' + liveRecords.length + ' 组全链探针）');
} else if (liveRecords.length > 0) {
  console.log('\n[spec] 存在失败项，未更新 spec_worm.md');
}

console.log('\n========================================');
console.log('PASS=' + pass + '  FAIL=' + fail + '  在线全链=' + liveDone + ' 组' + (liveSkip ? '（跳过 ' + liveSkip + ' 组）' : ''));
console.log(fail === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
process.exit(fail === 0 ? 0 : 1);
