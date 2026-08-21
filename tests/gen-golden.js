/* 黄金值生成器：用前端 JS compute 跑出所有工具的期望结果，供后端比对
 * 运行：node tests/gen-golden.js > tests/golden.json
 * 每个工具输出默认参数 + 若干变工况的 {params, result} 快照。
 * 数值字段只保存原始 value（不格式化），后端 Java 需与之逐值一致。
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
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8'), { filename: 'js/app.js' });
var App = global.App;
var ALL = [];
(function () {
  var orig = App.registerTool;
  App.registerTool = function (t) { if (t && t.id) ALL.push(t); return orig.call(App, t); };
})();
['js/tools/connection.js', 'js/tools/linear.js', 'js/tools/transmission.js', 'js/tools/trans2_chain.js', 'js/tools/trans2_timing.js', 'js/tools/trans2_flat.js', 'js/tools/trans2_ribbed.js', 'js/tools/trans2_worm.js', 'js/tools/trans2_cam.js', 'js/tools/trans2_extra.js', 'js/tools/math3.js', 'js/tools/fluid.js', 'js/tools/fluid2.js', 'js/tools/fluid3.js', 'js/tools/fluid4.js', 'js/tools/bearing.js', 'js/tools/other1.js', 'js/tools/common2.js', 'js/tools/selection.js', 'js/tools/common.js', 'js/tools/toldata.js', 'js/tools/tolerance.js', 'js/tools/gtdata.js', 'js/tools/gdttol.js'].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f });
});

function defaults(tool) {
  var v = {};
  tool.inputs.forEach(function (inp) {
    if (inp.default !== undefined) v[inp.key] = inp.default;
    else if (inp.type === 'select' && inp.options && inp.options.length) v[inp.key] = inp.options[0].v;
    else if (inp.type === 'segment' && inp.options && inp.options.length) v[inp.key] = inp.options[0].v;
  });
  return v;
}

/* 变工况用例（与 tests/run-tests.js 的 CASES 及关键断言场景一致） */
var CASES = {
  'bolt-check': [{ d: '24', grade: '10.9', F: 20, resType: '0.6' }, { d: '8', grade: '4.8', F: 0.8, resType: '1.5' }],
  'bolt-dynamic': [{ grade: '8.8', F: 10, lambda: 0.8, d: '16' }, { process: 'roll', nutType: 'tens' }, { mode: 'design', grade: '8.8', F: 10, lambda: 0.8 }, { matType: 'ss', gradeSS: 'C*-110', d: '24', F: 20, lambda: 0.3 }],
  'key-check': [{ connType: 'dynamic' }, { material: '铸铁', loadType: '冲击载荷' }, { keyNumber: '双键' }, { keyType: 'B型' }, { d: 130, T: 5000, L: 200 }, { d: 95, T: 3000, L: 160 }],
  'key-half': [{ material: '钢', loadType: '轻微冲击载荷' }, { material: '铸铁', loadType: '冲击载荷' }],
  'key-wedge': [{ miu: 0.2 }],
  'key-tangent': [{ d: 100 }],
  'key-spline-rect': [{ connType: 'dynamic', workingWay: '载荷作用下移动' }, { heatTreatment: 'no' }],
  'spring-design': [{ mat: 'carbon', cls: 'c2', F2: 500, lam2: 40 }, { mat: 'sus', cls: 'c1', F2: 80, lam2: 10, C: 10 }, { mat: 'carbon', cls: 'c3', F2: 2000, lam2: 60, C: 8 }],
  'ball-screw': [{ F: 5000, n: 1500, Lh: 30000, Ph: 20, Dm: 40, dk: 34.9, support: 'ff' }, { F: 300, n: 4000, Lh: 15000, Ph: 5, Dm: 16, dk: 13.2, support: 'ss', Lb: 400, La: 400 }, { support: 'fk' }],
  'v-belt': [{ P: 22, n1: 970, i: 3, KA: '1.5', beltType: 'C', dd1: 250 }, { P: 0.3, n1: 2880, i: 1.5, beltType: 'Z', dd1: 56 }, { beltType: 'Z', dd1: 75, P: 0.5, n1: 1440, i: 2 }],
  'involute-gear': [{ m: 4, z1: 17, z2: 85, beta: 12, x1: 0.3, x2: -0.3 }, { m: 1.5, z1: 14, z2: 45, x1: 0.35, x2: 0.35 }, { x1: 0.5, x2: 0.3 }, { beta: 15 }],
  'linear-bearing': [{ Pc: 1200, P: 2000, S: 1200, n1: 15, Lh: 8000 }],
  'cable-chain': [{ S: 4500, R: 200, fix: 'end' }],
  'hardness-convert': [{ scale: 'HBW', val: 300 }],
  'steel-weight': [{ shape: 'pipe', p1: 89, p2: 80, L: 6, qty: 4 }, { shape: 'hex', p1: 30, p2: 0, p3: 0, L: 1, qty: 1 }],
  'tolerance-query': [{ D: 40, obj: 'shaft', shaftCode: 'k', shaftGrade: 6 }, { D: 40, obj: 'hole', holeCode: 'F', holeGrade: 8 }, { D: 40, obj: 'hole', holeCode: 'G', holeGrade: 7 }, { D: 40, obj: 'hole', holeCode: 'JS', holeGrade: 7 }, { D: 40, obj: 'hole', holeCode: 'P', holeGrade: 7 }, { D: 100, obj: 'shaft', shaftCode: 's', shaftGrade: 6 }, { D: 5, obj: 'shaft', shaftCode: 'm', shaftGrade: 5 }, { D: 450, obj: 'hole', holeCode: 'D', holeGrade: 10 }],
  'tolerance-fit-query': [{ D: 40, fitType: 'transition' }, { D: 40, shaftCode: 'f', shaftGrade: 7, fitType: 'clearance' }, { D: 40, shaftCode: 'p', shaftGrade: 6, fitType: 'interference' }, { D: 120, holeCode: 'E', holeGrade: 9, shaftCode: 'h', shaftGrade: 8 }, { D: 3, holeCode: 'K', holeGrade: 7, shaftCode: 'p', shaftGrade: 6 }],
  'shape-tolerance': [{ D: 40, grade: 7, item: 'roundness' }, { D: 100, grade: 6, item: 'flatness' }, { D: 500, grade: 12, item: 'cylindricity' }],
  'position-tolerance': [{ D: 100, grade: 6, item: 'coaxiality' }, { D: 500, grade: 9, item: 'fullbeat' }],
  'multi-ribbed-belt': [{ beltType: 'PL', P: 30, n1: 1000, n2: 300, a0: 800 }, { beltType: 'PM', P: 60, n1: 2000, n2: 1000, a0: 1200 }, { beltType: 'PJ', P: 0.3, n1: 2880, n2: 960, a0: 100 }, { beltType: 'PK', P: 2.5, n1: 1460, n2: 500, a0: 200 }, { beltType: 'PL', P: 12, n1: 1460, n2: 500, a0: 350 }, { beltType: 'PM', P: 40, n1: 1460, n2: 500, a0: 800 }, { beltType: 'PK', P: 2.5, n1: 1460, n2: 500, de1: 45, de2: 355, a0: 250 }, { beltType: 'PK', P: 2.5, n1: 1460, n2: 500, de1: 71, a0: 250 }, { beltType: 'PK', P: 2.5, n1: 1460, n2: 500, a0: 200, beltLen: 2000 }],
  'hydraulic-pump': [{}, {}],
  'pneumatic-finger': [{}, {}],
  'vacuum-suction': [{}, {}],
  'rolling-bearing': [{}, {}],
  'shaft-design': [{}, {}],
  'linear-guide': [{}, {}],
  'double-speed-chain': [{}, {}],
  'gear-thickness': [{}, {}],
  'beam-calculator': [{}, {}],
  'material-weight': [{}, {}],
  'sealing-o-ring': [{}, {}],
  'water-pump': [{}, {}],
  'impact-load': [{ scene: 'fall', Q: 1000, l: 1, E: 200000, A: 0.25, H: 0.4 }],
  'plate-critical-load': [{ scene: '1', a: 1000, b: 500, t: 10, E: 206000, nu: 0.3, m: 1 }],
  'involute-function': [{ mode: 'inv', degree: 20, minute: 0 }, { mode: 'back', invVal: 0.014904 }]
};

/* 只保留可用于比对的字段：数值保留原始值；字符串原样 */
function sanitize(res) {
  if (!res) return null;
  if (res.error) return { error: res.error };
  var out = { sections: [] };
  (res.sections || []).forEach(function (sec) {
    var rows = (sec.rows || []).map(function (r) {
      var o = { label: r.label };
      if (r.value !== undefined) o.value = (typeof r.value === 'number') ? r.value : r.value;
      if (r.html !== undefined) o.html = String(r.html);
      if (r.unit !== undefined) o.unit = r.unit;
      if (r.hl !== undefined) o.hl = r.hl;
      return o;
    });
    out.sections.push({ title: sec.title, rows: rows });
  });
  if (res.verdict) out.verdict = { level: res.verdict.level, text: res.verdict.text, note: res.verdict.note || null };
  if (res.notes) out.notes = res.notes;
  if (res.debug) {
    out.debug = {};
    Object.keys(res.debug).forEach(function (k) {
      var d = res.debug[k];
      if (typeof d === 'number') out.debug[k] = d;
    });
  }
  return out;
}

var out = {};
ALL.forEach(function (t) {
  var cases = [{ params: defaults(t) }].concat((CASES[t.id] || []).map(function (c) { return { params: c }; }));
  out[t.id] = cases.map(function (c) {
    var r = t.compute(c.params);
    return { params: c.params, result: sanitize(r) };
  });
});
process.stdout.write(JSON.stringify(out, null, 1));
