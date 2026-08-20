/* MechCalc 全工具回归测试（Node 直接驱动 compute）
 * 运行：node tests/run-tests.js
 */
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');

global.window = global;
global.document = {
  addEventListener: function () {},
  getElementById: function () { return null; },
  querySelectorAll: function () { return []; },
  querySelector: function () { return null; },
  createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, appendChild: function () {}, setAttribute: function () {} }; },
  body: { appendChild: function () {}, classList: { add: function () {}, remove: function () {} } }
};
global.location = { hash: '' };

var ROOT = path.join(__dirname, '..');
/* 先加载 app.js，再包装 registerTool 收集工具，最后加载工具文件 */
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8'), { filename: 'js/app.js' });
var App = global.App;
var ALL = [];
(function () {
  var orig = App.registerTool;
  App.registerTool = function (t) { if (t && t.id) ALL.push(t); return orig.call(App, t); };
})();
['js/tools/connection.js', 'js/tools/linear.js', 'js/tools/transmission.js', 'js/tools/trans2_chain.js', 'js/tools/trans2_timing.js', 'js/tools/trans2_flat.js', 'js/tools/trans2_ribbed.js', 'js/tools/trans2_worm.js', 'js/tools/trans2_cam.js', 'js/tools/fluid.js', 'js/tools/selection.js', 'js/tools/common.js', 'js/tools/toldata.js', 'js/tools/tolerance.js', 'js/tools/gtdata.js', 'js/tools/gdttol.js'].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f });
});

/* 由 inputs 定义生成默认参数 */
function defaults(tool) {
  var v = {};
  tool.inputs.forEach(function (inp) {
    if (inp.default !== undefined) v[inp.key] = inp.default;
    else if (inp.type === 'select' && inp.options && inp.options.length) v[inp.key] = inp.options[0].v;
    else if (inp.type === 'segment' && inp.options && inp.options.length) v[inp.key] = inp.options[0].v;
  });
  return v;
}
/* 提取 sections 中 label 对应的数值（html 行返回去标签后的文本） */
function val(res, label) {
  if (!res || !res.sections) return null;
  for (var i = 0; i < res.sections.length; i++) {
    var rows = res.sections[i].rows || [];
    for (var j = 0; j < rows.length; j++) {
      if (rows[j].label && rows[j].label.indexOf(label) === 0) {
        if (rows[j].value !== undefined) return rows[j].value;
        if (rows[j].html !== undefined) return String(rows[j].html).replace(/<[^>]+>/g, '');
      }
    }
  }
  return null;
}
var passed = 0, failed = 0;
function ok(name, cond, info) {
  if (cond) { passed++; console.log('  PASS  ' + name + (info ? '  [' + info + ']' : '')); }
  else { failed++; console.log('  FAIL  ' + name + (info ? '  [' + info + ']' : '')); }
}
function near(a, b, tol) { tol = tol || 1e-6; return Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)); }
function runTool(id, over) {
  var t = App.getTool(id);
  if (!t) return { error: 'tool not found: ' + id };
  var v = defaults(t);
  if (over) for (var k in over) v[k] = over[k];
  return t.compute(v);
}

console.log('== 1) 全部工具默认参数可运行，无 error ==');
ALL.forEach(function (t) {
  var r = runTool(t.id);
  ok(t.id + ' 默认计算', !r.error, r.error || ('verdict=' + (r.verdict && r.verdict.level)));
});

console.log('== 2) 螺栓连接（M10 6.8级 F=2kN，与 mechtool.cn 默认一致） ==');
(function () {
  var r = runTool('bolt-check', {});
  // F0 = F" + F = 3200 + 2000 = 5200 N；σca = 1.3F0/(πd1²/4)，M10 小径 d1=8.376
  var sig = 1.3 * 5200 / (Math.PI * 8.376 * 8.376 / 4);
  ok('总拉力 F0 = 5200 N', near(val(r, '螺栓总拉力'), 5200, 1e-4), String(val(r, '螺栓总拉力')));
  ok('计算应力 σca ≈ ' + sig.toFixed(1), near(val(r, '计算应力'), sig, 1e-3), String(val(r, '计算应力')));
})();

console.log('== 2b) 动载荷紧螺栓（与 mechtool.cn boltconnection4 API 实测一致） ==');
(function () {
  // 用例 A：默认 4.8级 M10 F=1kN λ=0.25 S=2 切制/受压（原网站 σa=2.27，[σa]=23.33）
  var rA = runTool('bolt-dynamic', {});
  ok('A: σa = 2.27 MPa', near(val(rA, '计算应力幅'), 2.27, 5e-3), String(val(rA, '计算应力幅')));
  ok('A: [σa] = 23.33 MPa', near(val(rA, '许用应力幅'), 23.33, 5e-3), String(val(rA, '许用应力幅')));
  // 用例 B：8.8级 M16 F=10kN λ=0.8 ε=0.87（原网站 σa=26.61，[σa]=25.38，不满足）
  var rB = runTool('bolt-dynamic', { grade: '8.8', F: 10, lambda: 0.8, d: '16' });
  ok('B: σa = 26.61 MPa', near(val(rB, '计算应力幅'), 26.61, 5e-3), String(val(rB, '计算应力幅')));
  ok('B: [σa] = 25.38 MPa', near(val(rB, '许用应力幅'), 25.38, 5e-3), String(val(rB, '许用应力幅')));
  ok('B: 校核不通过', rB.verdict.level === 'bad', rB.verdict.level);
  // 用例 C：滚制螺纹 + 受拉螺母（原网站 [σa]=45.21）
  var rC = runTool('bolt-dynamic', { process: 'roll', nutType: 'tens' });
  ok('C: [σa] = 45.21 MPa', near(val(rC, '许用应力幅'), 45.21, 5e-3), String(val(rC, '许用应力幅')));
  // 用例 D：设计计算 8.8级 F=10kN λ=0.8（原网站 d1=13.835 → M16）
  var rD = runTool('bolt-dynamic', { mode: 'design', grade: '8.8', F: 10, lambda: 0.8 });
  ok('D: 推荐公称直径 M16', val(rD, '应选用螺栓公称直径') === 'M16', String(val(rD, '应选用螺栓公称直径')));
  ok('D: 小径 d1 = 13.835', near(parseFloat(val(rD, '螺栓小径')), 13.835, 1e-6), String(val(rD, '螺栓小径')));
  // 用例 E：不锈钢 C*-110 M24 F=20kN λ=0.3（原网站 σ-1t=385, Kσ=5.2, ε=0.74）
  var rE = runTool('bolt-dynamic', { matType: 'ss', gradeSS: 'C*-110', d: '24', F: 20, lambda: 0.3 });
  ok('E: σ-1t = 385 MPa', val(rE, '抗压疲劳强度') === 385, String(val(rE, '抗压疲劳强度')));
  ok('E: Kσ = 5.2', val(rE, '缺口应力集中因数') === 5.2, String(val(rE, '缺口应力集中因数')));
  ok('E: ε = 0.74', val(rE, '尺寸因数') === 0.74, String(val(rE, '尺寸因数')));
  var A24 = Math.PI * 20.752 * 20.752 / 4;
  ok('E: σa = 0.3×20000/(2A) ≈ 8.86', near(val(rE, '计算应力幅'), 0.3 * 20000 / (2 * A24), 1e-4), String(val(rE, '计算应力幅')));
})();

console.log('== 3) 键连接系列（与 mechtool.cn 1:1：公式/许用应力/推荐表均实测对齐） ==');
// 3a 平键：默认 T=840 d=60 18×11 A型 L=90 单键 钢/静载荷 → l=72, k=0.4h=4.4, σp=2T/(dkl)
(function () {
  var r = runTool('key-check', {});
  var exp = 2 * 840000 / (60 * 0.4 * 11 * (90 - 18));   // = 88.386
  ok('平键 有效长度 l = L−b = 72', near(val(r, '键的有效长度'), 72, 1e-9), String(val(r, '键的有效长度')));
  ok('平键 接触高度 k = 0.4h = 4.4', near(val(r, '接触高度'), 4.4, 1e-9), String(val(r, '接触高度')));
  ok('平键 [σp] 钢/静载荷 = 135', val(r, '许用应力 [') === 135, String(val(r, '许用应力 [')));
  ok('平键 默认 σp ≈ 88.386', near(val(r, '计算应力'), exp, 1e-4), String(val(r, '计算应力')));
  ok('平键 默认校核通过', r.verdict.level === 'ok', r.verdict.text);
  var rd = runTool('key-check', { connType: 'dynamic' });
  ok('平键 动连接 [p] = 50（静载荷）', val(rd, '许用应力 [') === 50, String(val(rd, '许用应力 [')));
  var rc = runTool('key-check', { material: '铸铁', loadType: '冲击载荷' });
  ok('平键 [σp] 铸铁/冲击 = 38', val(rc, '许用应力 [') === 38, String(val(rc, '许用应力 [')));
  var rk = runTool('key-check', { keyNumber: '双键' });
  ok('平键 双键 σp 减半（÷1.5）', near(val(rk, '计算应力'), exp / 1.5, 1e-4), String(val(rk, '计算应力')));
  var rB = runTool('key-check', { keyType: 'B型' });
  ok('平键 B型 l = L = 90', near(val(rB, '键的有效长度'), 90, 1e-9), String(val(rB, '键的有效长度')));
  var rec = runTool('key-check', { d: 100, keySize: '28x16' });
  ok('平键 d=100 推荐 28×16/L=80', String(val(rec, '按轴径推荐')).indexOf('28x16') >= 0 && String(val(rec, '按轴径推荐')).indexOf('L=80') >= 0, String(val(rec, '按轴径推荐')));
})();

// 3b 半圆键：默认 T=50 d=20 5x7.5x19x18.6x2.32 单键 钢/静载荷 → σp=2T/(dkL)，k/L 取自规格
(function () {
  var r = runTool('key-half', {});
  var exp = 2 * 50000 / (20 * 2.32 * 18.6);             // = 115.875
  ok('半圆键 k=2.32、L=18.6（规格表）', near(val(r, '接触高度'), 2.32, 1e-9) && near(val(r, '键的长度'), 18.6, 1e-9), val(r, '接触高度') + '/' + val(r, '键的长度'));
  ok('半圆键 [σp] 钢/静 = 135', val(r, '许用应力 [') === 135, String(val(r, '许用应力 [')));
  ok('半圆键 默认 σp ≈ 115.875', near(val(r, '计算应力'), exp, 1e-4), String(val(r, '计算应力')));
  var rm = runTool('key-half', { material: '钢', loadType: '轻微冲击载荷' });
  ok('半圆键 钢/轻微冲击 = 110（半圆键专用档）', val(rm, '许用应力 [') === 110, String(val(rm, '许用应力 [')));
  var ri = runTool('key-half', { material: '铸铁', loadType: '冲击载荷' });
  ok('半圆键 铸铁/冲击 = 37（半圆键专用档）', val(ri, '许用应力 [') === 37, String(val(ri, '许用应力 [')));
  var rrec = runTool('key-half', { d: 20 });
  ok('半圆键 d=20 传递载荷用推荐 5x7.5x19x18.6x2.32', String(val(rrec, '按轴径推荐')).indexOf('5x7.5x19x18.6x2.32') >= 0, String(val(rrec, '按轴径推荐')));
})();

// 3c 楔键：默认 μ=0.14 → σp=12T/(b·l·(b+6μd))，l=L−b=72
(function () {
  var r = runTool('key-wedge', {});
  var exp = 12 * 840000 / (18 * (90 - 18) * (18 + 6 * 0.14 * 60));   // = 113.710
  ok('楔键 默认 σp ≈ 113.71', near(val(r, '计算应力'), exp, 1e-4), String(val(r, '计算应力')));
  ok('楔键 默认校核通过（≤135）', r.verdict.level === 'ok', r.verdict.text);
  var rmu = runTool('key-wedge', { miu: 0.2 });
  ok('楔键 μ=0.2 应力更低', val(rmu, '计算应力') < val(r, '计算应力'), val(rmu, '计算应力') + ' < ' + val(r, '计算应力'));
})();

// 3d 切向键：默认 t=7 c=0.7 l=90 μ=0.14 → σp=2T/(d(t−c)l(0.9+μ))
(function () {
  var r = runTool('key-tangent', {});
  var exp = 2 * 840000 / (60 * (7 - 0.7) * 90 * (0.9 + 0.14));       // = 47.483
  ok('切向键 默认 σp ≈ 47.48', near(val(r, '计算应力'), exp, 1e-4), String(val(r, '计算应力')));
  var rec = runTool('key-tangent', { d: 100 });
  ok('切向键 d=100 推荐 t=9/c=0.7/l=150', String(val(rec, '按轴径推荐')).indexOf('t=9') >= 0 && String(val(rec, '按轴径推荐')).indexOf('150') >= 0, String(val(rec, '按轴径推荐')));
})();

// 3e 矩形花键：默认 6×23×26×6 L=30 c=0.2 φ=0.75 → dm=24.5, h=1.1, [p]=120（100~140 中值）
(function () {
  var r = runTool('key-spline-rect', {});
  var dm = (26 + 23) / 2, h = (26 - 23) / 2 - 2 * 0.2;
  var exp = 2 * 85000 / (0.75 * 6 * h * dm * 30);       // = 46.726
  ok('矩形花键 dm=24.5、h=1.1', near(val(r, '平均直径'), 24.5, 1e-9) && near(val(r, '键齿工作高度'), 1.1, 1e-9), val(r, '平均直径') + '/' + val(r, '键齿工作高度'));
  ok('矩形花键 [p] 静/热/中等 = 120（100~140 中值）', val(r, '许用应力 [') === 120, String(val(r, '许用应力 [')));
  ok('矩形花键 默认 p ≈ 46.73', near(val(r, '计算应力'), exp, 1e-4), String(val(r, '计算应力')));
  var rl = runTool('key-spline-rect', { connType: 'dynamic', workingWay: '载荷作用下移动' });
  ok('矩形花键 动·载荷下移动/中等 [p]=10（5~15 中值）', val(rl, '许用应力 [') === 10, String(val(rl, '许用应力 [')));
  var rn = runTool('key-spline-rect', { heatTreatment: 'no' });
  ok('矩形花键 静/未热处理/中等 [p]=80（60~100 中值）', val(rn, '许用应力 [') === 80, String(val(rn, '许用应力 [')));
})();

// 3f 渐开线花键：默认 m=2 30° z=20 d=40 h=2 L=30 φ=0.75 → p=2T/(φzhdL)
(function () {
  var r = runTool('key-spline-inv', {});
  var exp = 2 * 840000 / (0.75 * 20 * 2 * 40 * 30);     // = 46.667
  ok('渐开线花键 默认 [p] = 120（静/热/中等）', val(r, '许用应力 [') === 120, String(val(r, '许用应力 [')));
  ok('渐开线花键 默认 p ≈ 46.67', near(val(r, '计算应力'), exp, 1e-4), String(val(r, '计算应力')));
  ok('渐开线花键 默认校核通过', r.verdict.level === 'ok', r.verdict.text);
})();

console.log('== 4) 压缩弹簧（C=6 曲度系数 Wahl） ==');
(function () {
  var K6 = (4 * 6 - 1) / (4 * 6 - 4) + 0.615 / 6; // 1.2525
  var r = runTool('spring-design', { mat: 'si' });
  ok('C=6 曲度系数 K = 1.2525', near(val(r, '曲度系数'), K6, 1e-4), String(val(r, '曲度系数')));
  var rc = runTool('spring-design', { mat: 'carbon', cls: 'c2', F2: 500, lam2: 40 });
  // 碳素 B 级 [τ]=0.4σb(d) 随直径分级：σb(4)=1320 → 528；σb(5)=1270 → 508
  ok('碳素钢丝 II 类 [τ] < 600（直径分级生效）', val(rc, '材料许用切应力') < 600 && val(rc, '材料许用切应力') > 400, String(val(rc, '材料许用切应力')));
})();

console.log('== 5) 滚珠丝杠（临界转速/压杆） ==');
(function () {
  var r = runTool('ball-screw', {});
  var nc = 15.1 * 21.9 / (500 * 500) * 1e7;
  ok('固定-支承 nc = ' + nc.toFixed(0) + ' r/min', near(val(r, '临界转速'), nc, 1e-4), String(val(r, '临界转速')));
  var Pk = 0.5 * 2.0 * Math.PI * Math.PI * 2.06e5 * (Math.PI * Math.pow(21.9, 4) / 64) / (500 * 500);
  ok('压杆临界载荷 Pk ≈ ' + Pk.toFixed(0) + ' N', near(val(r, '压杆临界载荷'), Pk, 1e-4), String(val(r, '压杆临界载荷')));
  var r2 = runTool('ball-screw', { support: 'fk' }); // 固定-自由 λ₂=3.4
  ok('固定-自由 nc = 0.225×固定-支承', near(val(r2, '临界转速'), nc * 3.4 / 15.1, 1e-4), String(val(r2, '临界转速')));
})();

console.log('== 6) V带传动（A型 4kW/1440rpm/i=2.5） ==');
(function () {
  var r = runTool('v-belt', {});
  ok('自动选型为 A 型', val(r, '推荐/选用带型') === 'A', String(val(r, '推荐/选用带型')));
  ok('dd1 圆整 100', val(r, '小带轮直径') === 100, String(val(r, '小带轮直径')));
  ok('dd2 圆整 250', val(r, '大带轮直径') === 250, String(val(r, '大带轮直径')));
  ok('带速 ≈ 7.54 m/s', near(val(r, '带速'), Math.PI * 100 * 1440 / 60000, 1e-4), String(val(r, '带速')));
  var z = val(r, '计算根数');
  ok('根数 4~6 根之间', z > 3 && z < 7, 'z=' + z + ' → ' + val(r, '选用根数') + ' 根');
  // Z 带可用性
  var rz = runTool('v-belt', { beltType: 'Z', dd1: 75, P: 0.5, n1: 1440, i: 2 });
  ok('Z 型带可计算', !rz.error, rz.error || ('z=' + val(rz, '选用根数')));
})();

console.log('== 7) 渐开线齿轮（m2 z20/60 标准直齿） ==');
(function () {
  var r = runTool('involute-gear', {});
  ok('d1 = 40 / d2 = 120 / a = 80', val(r, '小轮分度圆') === 40 && val(r, '大轮分度圆') === 120 && val(r, '标准中心距') === 80, val(r, '小轮分度圆') + '/' + val(r, '大轮分度圆') + '/' + val(r, '标准中心距'));
  ok('da1 = 44', near(val(r, '小轮齿顶圆'), 44, 1e-9), String(val(r, '小轮齿顶圆')));
  ok('k1 = 3，W1 ≈ 15.321', val(r, '小轮跨测齿数') === 3 && near(val(r, '小轮公法线'), 2 * Math.cos(20 * Math.PI / 180) * (Math.PI * 2.5 + 20 * (Math.tan(20 * Math.PI / 180) - 20 * Math.PI / 180)), 1e-4), String(val(r, '小轮公法线')));
  // 变位 x1=0.5, x2=0.3 角变位：a′ > a，σ > 0
  var rx = runTool('involute-gear', { x1: 0.5, x2: 0.3 });
  ok('角变位 a′ > a 且 σ>0', val(rx, '实际中心距') > 80 && val(rx, '齿顶高变动系数') > 0, 'a′=' + val(rx, '实际中心距') + ' σ=' + val(rx, '齿顶高变动系数'));
  // 斜齿轮 β=15°：mt=m/cosβ
  var rh = runTool('involute-gear', { beta: 15 });
  ok('斜齿 mt = 2/cos15°', near(val(rh, '端面模数'), 2 / Math.cos(15 * Math.PI / 180), 1e-4), String(val(rh, '端面模数')));
})();

console.log('== 8) 液压/气压（油缸速度量纲） ==');
(function () {
  var r = runTool('hydraulic-cylinder', {});
  ok('油缸速度计算无 error', !r.error, r.error || 'ok');
})();

console.log('== 9) 钢材重量（六角钢 S30 ≈ 6.12 kg/m） ==');
(function () {
  var r = runTool('steel-weight', { shape: 'hex', p1: 30, p2: 0, p3: 0, L: 1, qty: 1 });
  ok('六角钢 S30 每米 ≈ 6.12 kg/m', near(val(r, '每米理论重量'), Math.sqrt(3) / 2 * 900 * 7.85 / 1000, 1e-4), String(val(r, '每米理论重量')));
})();

console.log('== 10) 硬度换算（HRC45 → HV≈446 / HBW≈429） ==');
(function () {
  var r = runTool('hardness-convert', { scale: 'HRC', val: 45 });
  function htmlOf(label) {
    var rows = r.sections[0].rows;
    for (var i = 0; i < rows.length; i++) if (rows[i].label === label) return String(rows[i].html);
    return '';
  }
  ok('HRC45 → HV 446', htmlOf('维氏硬度 HV') === '446', htmlOf('维氏硬度 HV'));
  ok('HRC45 → HBW 429', htmlOf('布氏硬度 HBW') === '429', htmlOf('布氏硬度 HBW'));
})();

console.log('== 11) 公差查询（GB/T 1800，φ40 各公差带） ==');
(function () {
  var r = runTool('tolerance-query', { D: 40, obj: 'hole', holeCode: 'H', holeGrade: 7 });
  ok('φ40 H7 = +0.025/0', val(r, 'φ40 H7') === '+0.025 / 0 mm', String(val(r, 'φ40 H7')));
  var r2 = runTool('tolerance-query', { D: 40, obj: 'shaft', shaftCode: 'k', shaftGrade: 6 });
  ok('φ40 k6 = +0.018/+0.002', val(r2, 'φ40 k6') === '+0.018 / +0.002 mm', String(val(r2, 'φ40 k6')));
  var r3 = runTool('tolerance-query', { D: 40, obj: 'hole', holeCode: 'F', holeGrade: 8 });
  ok('φ40 F8 = +0.064/+0.025', val(r3, 'φ40 F8') === '+0.064 / +0.025 mm', String(val(r3, 'φ40 F8')));
  var r4 = runTool('tolerance-query', { D: 40, obj: 'hole', holeCode: 'G', holeGrade: 7 });
  ok('φ40 G7 = +0.034/+0.009', val(r4, 'φ40 G7') === '+0.034 / +0.009 mm', String(val(r4, 'φ40 G7')));
  var r5 = runTool('tolerance-query', { D: 40, obj: 'hole', holeCode: 'JS', holeGrade: 7 });
  ok('φ40 JS7 = +0.0125/-0.0125', val(r5, 'φ40 JS7') === '+0.0125 / -0.0125 mm', String(val(r5, 'φ40 JS7')));
  var r6 = runTool('tolerance-query', { D: 40, obj: 'hole', holeCode: 'P', holeGrade: 7 });
  ok('φ40 P7 = -0.017/-0.042（Δ 修正）', val(r6, 'φ40 P7') === '-0.017 / -0.042 mm', String(val(r6, 'φ40 P7')));
  var r7 = runTool('tolerance-query', { D: 100, obj: 'shaft', shaftCode: 's', shaftGrade: 6 });
  ok('φ100 s6 = +0.093/+0.071', val(r7, 'φ100 s6') === '+0.093 / +0.071 mm', String(val(r7, 'φ100 s6')));
})();

console.log('== 12) 配合查询（φ40 H7/k6 过渡、H7/f7 间隙、H7/p6 过盈） ==');
(function () {
  var r = runTool('tolerance-fit-query', { D: 40, fitType: 'transition' });
  ok('φ40 H7/k6 为过渡配合', val(r, '配合类型') === '过渡配合', String(val(r, '配合类型')));
  ok('Xmax=23μm Ymax=18μm', near(val(r, '最大间隙 Xmax'), 0.023, 1e-9) && near(val(r, '最大过盈 Ymax'), 0.018, 1e-9),
    'Xmax=' + val(r, '最大间隙 Xmax') + ' Ymax=' + val(r, '最大过盈 Ymax'));
  var r2 = runTool('tolerance-fit-query', { D: 40, shaftCode: 'f', shaftGrade: 7, fitType: 'clearance' });
  ok('φ40 H7/f7 为间隙配合', val(r2, '配合类型') === '间隙配合', String(val(r2, '配合类型')));
  var r3 = runTool('tolerance-fit-query', { D: 40, shaftCode: 'p', shaftGrade: 6, fitType: 'interference' });
  ok('φ40 H7/p6 为过盈配合', val(r3, '配合类型') === '过盈配合', String(val(r3, '配合类型')));
  /* 键盘数据完整性：按钮 set 与文本一致 */
  var t = App.getTool('tolerance-fit-query');
  var kb = t.inputs.filter(function (f) { return f.type === 'keypad'; });
  ok('两个配合键盘（基孔制/基轴制）', kb.length === 2, 'keypads=' + kb.length);
  var bad = 0, total = 0;
  kb.forEach(function (f) {
    f.rows.forEach(function (row) { row.cells.forEach(function (c) {
      total++;
      var s = c.set;
      var txt = (s.holeCode + s.holeGrade) + '/' + (s.shaftCode + s.shaftGrade);
      /* 按钮文本必为孔带或轴带之一，且导入组合中另一侧来自行标签 */
      if (c.t !== (s.shaftCode + s.shaftGrade) && c.t !== (s.holeCode + s.holeGrade)) bad++;
    }); });
  });
  ok('键盘按钮文本与导入代号一致（' + total + ' 个）', bad === 0, 'bad=' + bad);
})();

console.log('== 13) 变工况复测（每工具 2 组非常规参数不崩溃） ==');
var CASES = [
  ['bolt-check', { d: '24', grade: '10.9', F: 20, resType: '0.6' }],
  ['bolt-check', { d: '8', grade: '4.8', F: 0.8, resType: '1.5' }],
  ['key-check', { d: 130, T: 5000, L: 200 }],
  ['key-check', { d: 95, T: 3000, L: 160 }],
  ['spring-design', { mat: 'carbon', cls: 'c3', F2: 2000, lam2: 60, C: 8 }],
  ['spring-design', { mat: 'sus', cls: 'c1', F2: 80, lam2: 10, C: 10 }],
  ['ball-screw', { F: 5000, n: 1500, Lh: 30000, Ph: 20, Dm: 40, dk: 34.9, support: 'ff' }],
  ['ball-screw', { F: 300, n: 4000, Lh: 15000, Ph: 5, Dm: 16, dk: 13.2, support: 'ss', Lb: 400, La: 400 }],
  ['v-belt', { P: 22, n1: 970, i: 3, KA: '1.5', beltType: 'C', dd1: 250 }],
  ['v-belt', { P: 0.3, n1: 2880, i: 1.5, beltType: 'Z', dd1: 56 }],
  ['involute-gear', { m: 4, z1: 17, z2: 85, beta: 12, x1: 0.3, x2: -0.3 }],
  ['involute-gear', { m: 1.5, z1: 14, z2: 45, x1: 0.35, x2: 0.35 }],
  ['linear-bearing', { Pc: 1200, P: 2000, S: 1200, n1: 15, Lh: 8000 }],
  ['cable-chain', { S: 4500, R: 200, fix: 'end' }],
  ['hardness-convert', { scale: 'HBW', val: 300 }],
  ['steel-weight', { shape: 'pipe', p1: 89, p2: 80, L: 6, qty: 4 }],
  ['tolerance-query', { D: 5, obj: 'shaft', shaftCode: 'm', shaftGrade: 5 }],
  ['tolerance-query', { D: 450, obj: 'hole', holeCode: 'D', holeGrade: 10 }],
  ['tolerance-fit-query', { D: 120, holeCode: 'E', holeGrade: 9, shaftCode: 'h', shaftGrade: 8 }],
  ['tolerance-fit-query', { D: 3, holeCode: 'K', holeGrade: 7, shaftCode: 'p', shaftGrade: 6 }],
  ['multi-ribbed-belt', { beltType: 'PL', P: 30, n1: 1000, n2: 300, a0: 800 }],
  ['multi-ribbed-belt', { beltType: 'PM', P: 60, n1: 2000, n2: 1000, a0: 1200 }]
];
CASES.forEach(function (c) {
  var r = runTool(c[0], c[1]);
  ok(c[0] + ' 变工况', !r.error, r.error || '');
});

console.log('== 14) 形状与位置公差查询（GB/T 1184） ==');
(function () {
  /* 形状·直线度 D=40/7级 → >25~40段 10μm */
  var r = runTool('shape-tolerance', { D: 40, grade: 7, item: 'straightness' });
  ok('φ40 直线度 7 级 = 0.01 mm', val(r, '直线度7级') === '0.01 mm', String(val(r, '直线度7级')));
  /* 形状·圆度 D=40/7级 → >30~50段 7μm */
  var r2 = runTool('shape-tolerance', { D: 40, grade: 7, item: 'roundness' });
  ok('φ40 圆度 7 级 = 0.007 mm', val(r2, '圆度7级') === '0.007 mm', String(val(r2, '圆度7级')));
  /* 形状·平面度 D=100/6级 → >63~100段 10μm */
  var r3 = runTool('shape-tolerance', { D: 100, grade: 6, item: 'flatness' });
  ok('φ100 平面度 6 级 = 0.01 mm', val(r3, '平面度6级') === '0.01 mm', String(val(r3, '平面度6级')));
  /* 形状·圆柱度 D=500/12级 → 400~500段 155μm */
  var r4 = runTool('shape-tolerance', { D: 500, grade: 12, item: 'cylindricity' });
  ok('φ500 圆柱度 12 级 = 0.155 mm', val(r4, '圆柱度12级') === '0.155 mm', String(val(r4, '圆柱度12级')));
  /* 圆度主参数超 500 报错 */
  var r5 = runTool('shape-tolerance', { D: 600, item: 'roundness' });
  ok('圆度超 500 报错', !!r5.error, r5.error || '');
  /* 位置·平行度 D=100/6级 → >63~100段 25μm */
  var p = runTool('position-tolerance', { D: 100, grade: 6, item: 'parallelism' });
  ok('φ100 平行度 6 级 = 0.025 mm', val(p, '平行度6级') === '0.025 mm', String(val(p, '平行度6级')));
  /* 位置·同轴度 D=100/6级 → >50~120段 15μm */
  var p2 = runTool('position-tolerance', { D: 100, grade: 6, item: 'coaxiality' });
  ok('φ100 同轴度 6 级 = 0.015 mm', val(p2, '同轴度6级') === '0.015 mm', String(val(p2, '同轴度6级')));
  /* 位置·全跳动 D=500/9级 → >250~500段 120μm */
  var p3 = runTool('position-tolerance', { D: 500, grade: 9, item: 'fullbeat' });
  ok('φ500 全跳动 9 级 = 0.12 mm', val(p3, '全跳动9级') === '0.12 mm', String(val(p3, '全跳动9级')));
})();

console.log('== 15) 多楔带传动设计（JB/T 5983-2017，复刻 mechtool.cn） ==');
(function () {
  /* ---- 默认用例（PJ、P=5kW、n1=1460、n2=400）---- */
  var r = runTool('multi-ribbed-belt', {});
  ok('多楔带 默认计算无 error', !r.error, r.error || '');
  ok('默认: de1=20 / de2=80', near(val(r, '小带轮有效直径 de₁'), 20) && near(val(r, '大带轮有效直径 de₂'), 80), val(r, '小带轮有效直径 de₁') + '/' + val(r, '大带轮有效直径 de₂'));
  ok('默认: Le0=309.94 → Le=300', near(r.debug.calLe, 309.94, 1e-4) && val(r, '选用标准有效长度 Le') === 300, r.debug.calLe + '→' + val(r, '选用标准有效长度 Le'));
  ok('默认: a=65.03, α1=127.13', near(val(r, '实际中心距'), 65.03, 1e-4) && near(val(r, '小带轮包角 α₁'), 127.13, 1e-4), val(r, '实际中心距') + '/' + val(r, '小带轮包角 α₁'));
  ok('默认: Kα=0.83, KL=0.78', near(val(r, '包角修正系数 Kα'), 0.83, 1e-3) && near(val(r, '带长修正系数 KL'), 0.78, 1e-3), val(r, '包角修正系数 Kα') + '/' + val(r, '带长修正系数 KL'));
  ok('默认: P1=0.0197, ΔP1=0.0085', near(r.debug.p1, 0.0197, 1e-4) && near(r.debug.deltaP1, 0.0085, 1e-4), r.debug.p1 + '/' + r.debug.deltaP1);
  ok('默认: z=116 向上圆整', r.debug.z === 116, String(r.debug.z));
  ok('默认: zStd=16 封顶到 PJ 最大楔数', r.debug.zStd === 16 && r.verdict.level === 'warn', 'zStd=' + r.debug.zStd + ', level=' + r.verdict.level);
  ok('默认: Ft=3535.65, FQ=6602.88', near(r.debug.Ft, 3535.65, 1e-3) && near(r.debug.FQ, 6602.88, 1e-3), r.debug.Ft.toFixed(2) + '/' + r.debug.FQ.toFixed(2));

  /* ---- PJ 手算用例（几何链/系数/楔数/力逐值验证）---- */
  var pj = runTool('multi-ribbed-belt', { beltType: 'PJ', P: 0.3, n1: 2880, n2: 960, a0: 100 });
  ok('PJ: v=3.348 m/s', near(val(pj, '带速'), 3.348, 1e-3), String(val(pj, '带速')));
  ok('PJ: de2=63, a=97.5, α1=154.73', near(pj.debug.de2, 63) && near(val(pj, '实际中心距'), 97.5, 1e-4) && near(val(pj, '小带轮包角 α₁'), 154.73, 1e-3), pj.debug.de2 + '/' + val(pj, '实际中心距') + '/' + val(pj, '小带轮包角 α₁'));
  ok('PJ: Kα=0.922, KL=0.78, Kr≈3.990', near(val(pj, '包角修正系数 Kα'), 0.922, 1e-3) && near(val(pj, '带长修正系数 KL'), 0.78, 1e-3) && near(pj.debug.kr, 3.990, 1e-2), val(pj, '包角修正系数 Kα') + '/' + val(pj, '带长修正系数 KL') + '/' + pj.debug.kr.toFixed(3));
  ok('PJ: P1=0.027084 (2880r/min 插值)', near(pj.debug.p1, 0.027084, 1e-5), String(pj.debug.p1));
  ok('PJ: zRaw=3.526 → z=4, zStd=4', near(pj.debug.zRaw, 3.526, 5e-3) && pj.debug.z === 4 && pj.debug.zStd === 4, pj.debug.zRaw.toFixed(3) + '→' + pj.debug.z + '/' + pj.debug.zStd);
  ok('PJ: 力 Ft/F0z/F0/FQ 手算一致', near(pj.debug.Ft, 107.53, 1e-2) && near(pj.debug.F0z, 22.43, 1e-2) && near(pj.debug.F0, 89.73, 1e-2) && near(pj.debug.FQ, 175.11, 1e-2), pj.debug.Ft.toFixed(2) + '/' + pj.debug.F0z.toFixed(2) + '/' + pj.debug.F0.toFixed(2) + '/' + pj.debug.FQ.toFixed(2));
  ok('PJ: verdict=ok', pj.verdict.level === 'ok', pj.verdict.level);

  /* ---- 各类带型走通（PK/PL/PM）---- */
  var pk = runTool('multi-ribbed-belt', { beltType: 'PK', P: 2.5, n1: 1460, n2: 500, a0: 200 });
  ok('PK: de1=45, de2=140, Le=710', pk.debug.de1 === 45 && pk.debug.de2 === 140 && pk.debug.Le === 710, pk.debug.de1 + '/' + pk.debug.de2 + '/' + pk.debug.Le);
  ok('PK: α1=153.32, Kα=0.918, KL=0.85', near(pk.debug.alpha1, 153.32, 1e-3) && near(pk.debug.kAlpha, 0.918, 1e-3) && near(pk.debug.kL, 0.85, 1e-3), pk.debug.alpha1 + '/' + pk.debug.kAlpha + '/' + pk.debug.kL);
  ok('PK: z=5, zStd=5, verdict=ok', pk.debug.z === 5 && pk.debug.zStd === 5 && pk.verdict.level === 'ok', pk.debug.z + '/' + pk.debug.zStd + '/' + pk.verdict.level);
  ok('PK: Ft=814.11, FQ=1331.16', near(pk.debug.Ft, 814.11, 1e-2) && near(pk.debug.FQ, 1331.16, 1e-2), pk.debug.Ft.toFixed(2) + '/' + pk.debug.FQ.toFixed(2));

  var pl = runTool('multi-ribbed-belt', { beltType: 'PL', P: 12, n1: 1460, n2: 500, a0: 350 });
  ok('PL: de2=224, Le0=1185.53→Le=1200, a=357.24', near(pl.debug.calLe, 1185.53, 1e-3) && pl.debug.Le === 1200 && near(pl.debug.a, 357.24, 1e-3), pl.debug.calLe + '/' + pl.debug.Le + '/' + pl.debug.a);
  ok('PL: P1=0.7088, ΔP1=0.0881', near(pl.debug.p1, 0.7088, 1e-4) && near(pl.debug.deltaP1, 0.0881, 1e-4), pl.debug.p1 + '/' + pl.debug.deltaP1);
  ok('PL: zRaw=5.677 → z=6, zStd=6', near(pl.debug.zRaw, 5.677, 5e-3) && pl.debug.z === 6 && pl.debug.zStd === 6, pl.debug.zRaw.toFixed(3) + '→' + pl.debug.z + '/' + pl.debug.zStd);

  var pm = runTool('multi-ribbed-belt', { beltType: 'PM', P: 40, n1: 1460, n2: 500, a0: 800 });
  ok('PM: de1=180, de2=500, Le=2650, P1=5.08', pm.debug.de1 === 180 && pm.debug.de2 === 500 && pm.debug.Le === 2650 && near(pm.debug.p1, 5.08, 1e-4), pm.debug.de1 + '/' + pm.debug.de2 + '/' + pm.debug.Le + '/' + pm.debug.p1);
  ok('PM: z=3, zStd=8(标准区间下限)', pm.debug.z === 3 && pm.debug.zStd === 8, pm.debug.z + '/' + pm.debug.zStd);

  /* ---- 楔数向上圆整（ceil 边界） ---- */
  ok('楔数向上圆整 ceil(3.526)=4', pj.debug.z === Math.ceil(pj.debug.zRaw - 1e-9), pj.debug.zRaw + '→' + pj.debug.z);

  /* ---- α<120° 警告 ---- */
  var low = runTool('multi-ribbed-belt', { beltType: 'PK', P: 2.5, n1: 1460, n2: 500, de1: 45, de2: 355, a0: 250 });
  ok('小包角 α1=105.3<120 触发警告', near(low.debug.alpha1, 105.3, 1e-3) && low.verdict.level === 'warn' && low.verdict.text.indexOf('120') >= 0, low.debug.alpha1 + '/' + low.verdict.level);

  /* ---- 手动指定 de1 / 指定带长覆盖 ---- */
  var d1 = runTool('multi-ribbed-belt', { beltType: 'PK', P: 2.5, n1: 1460, n2: 500, de1: 71, a0: 250 });
  ok('指定 de1=71 → P1=0.4525', d1.debug.de1 === 71 && near(d1.debug.p1, 0.4525, 1e-4), d1.debug.de1 + '/' + d1.debug.p1);
  var bl = runTool('multi-ribbed-belt', { beltType: 'PK', P: 2.5, n1: 1460, n2: 500, a0: 200, beltLen: 2000 });
  ok('指定 Le=2000 → α1=173.59, KL=1.04', bl.debug.Le === 2000 && near(bl.debug.alpha1, 173.59, 1e-3) && near(bl.debug.kL, 1.04, 1e-3), bl.debug.Le + '/' + bl.debug.alpha1 + '/' + bl.debug.kL);

  /* ---- P1 超界报错 ---- */
  var err = runTool('multi-ribbed-belt', { beltType: 'PJ', P: 5, n1: 1460, n2: 400, de1: 280, a0: 1000 });
  ok('de1=280(PJ) 无 P1 表值→报错', !!err.error && String(err.error).indexOf('P1') >= 0, err.error || '');
})();
