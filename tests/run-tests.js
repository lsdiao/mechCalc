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
['js/tools/connection.js', 'js/tools/linear.js', 'js/tools/transmission.js', 'js/tools/fluid.js', 'js/tools/selection.js', 'js/tools/common.js'].forEach(function (f) {
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
/* 提取 sections 中 label 对应的数值（去掉 html 行） */
function val(res, label) {
  if (!res || !res.sections) return null;
  for (var i = 0; i < res.sections.length; i++) {
    var rows = res.sections[i].rows || [];
    for (var j = 0; j < rows.length; j++) {
      if (rows[j].label && rows[j].label.indexOf(label) === 0 && rows[j].value !== undefined) return rows[j].value;
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

console.log('== 2) 螺栓连接（M12 8.8级 F=5000N） ==');
(function () {
  var r = runTool('bolt-check', {});
  // F0 = F" + F = 1000 + 5000 = 6000 N；σca = 1.3F0/(πd1²/4)，M12 小径 d1=10.106
  var sig = 1.3 * 6000 / (Math.PI * 10.106 * 10.106 / 4);
  ok('总拉力 F0 = 6000 N', near(val(r, '螺栓总拉力'), 6000, 1e-4), String(val(r, '螺栓总拉力')));
  ok('计算应力 σca ≈ ' + sig.toFixed(1), near(val(r, '计算应力'), sig, 1e-3), String(val(r, '计算应力')));
})();

console.log('== 3) 平键（d=40 → 12×8；d=100 → 25×14 修正档） ==');
(function () {
  var r = runTool('key-check', { d: 100, T: 500, L: 100, autoBh: 'auto' });
  var row = (r.sections[0].rows[0].html || '');
  ok('d=100 推荐 25×14', row.indexOf('25×14') === 0, row);
  var r2 = runTool('key-check', { d: 40, T: 500, L: 63, autoBh: 'auto' });
  ok('d=40 推荐 12×8', (r2.sections[0].rows[0].html || '').indexOf('12×8') === 0, r2.sections[0].rows[0].html);
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

console.log('== 11) 变工况复测（每工具 2 组非常规参数不崩溃） ==');
var CASES = [
  ['bolt-check', { d: '24', grade: '10.9', F: 20000, resType: '0.6' }],
  ['bolt-check', { d: '8', grade: '4.8', F: 800, resType: '1.5' }],
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
  ['steel-weight', { shape: 'pipe', p1: 89, p2: 80, L: 6, qty: 4 }]
];
CASES.forEach(function (c) {
  var r = runTool(c[0], c[1]);
  ok(c[0] + ' 变工况', !r.error, r.error || '');
});

console.log('\n结果：' + passed + ' 通过，' + failed + ' 失败');
process.exit(failed ? 1 : 0);
