// E2E 验证探针：用工具自算中间量（Pd/v/kZ/beltLen/alpha1/zM）调用原站 timingbelt2 API，
// 结果与逐字段比对写入 /workspace/.tmp_probe/e2e_out.json（供 test_timing.js 阶段3比对）。
// API 被限流期间自动等待恢复（每 45s 探一次 sanity），恢复后逐场景执行（每场景带重试）。
// 用法: node /workspace/.tmp_probe/probe_e2e.js &   （后台运行，日志 e2e.log）
var fs = require('fs'), vm = require('vm');
var { execFileSync } = require('child_process');

/* ---------- 加载工具（浏览器 shim，与 test_timing.js 相同） ---------- */
global.window = global;
global.document = {
  addEventListener() { }, getElementById() { return null; }, querySelectorAll() { return []; },
  querySelector() { return null },
  createElement() { return { style: {}, classList: { add() { }, remove() { } } } },
  body: { appendChild() { } }
};
global.location = { hash: '' };
vm.runInThisContext(fs.readFileSync('/workspace/js/app.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('/workspace/js/tools/trans2_timing.js', 'utf8'));
var t = App.getTool('timing-belt-design');

/* ---------- 7 个 E2E 场景（与 test_timing.js 保持一致） ---------- */
var E2E = [
  { name: 'S1 H 4kW 1440r/min z18/52 a0=500', input: { P: 4, n1: 1440, n2: 1440 * 52 / 18, KA: 1.5, beltSize: 'H', z1: 18, z2: 52, a0: 500, beltLen: '', bs: '' } },
  { name: 'S2 XL 0.05kW 1000r/min z10/30 a0=300 (kZ=0.6, bs 超系列)', input: { P: 0.05, n1: 1000, n2: 1000 / 3, KA: 1.5, beltSize: 'XL', z1: 10, z2: 30, a0: 300, beltLen: '', bs: '' } },
  { name: 'S3 L 0.5kW 1440r/min z24/48 a0=600', input: { P: 0.5, n1: 1440, n2: 720, KA: 1.5, beltSize: 'L', z1: 24, z2: 48, a0: 600, beltLen: '', bs: '' } },
  { name: 'S4 XH 10kW KA2 800r/min z24/48 a0=800', input: { P: 10, n1: 800, n2: 400, KA: 2, beltSize: 'XH', z1: 24, z2: 48, a0: 800, beltLen: '', bs: '' } },
  { name: 'S5 XXH 20kW KA2 800r/min z22/66 a0=1000', input: { P: 20, n1: 800, n2: 800 / 3, KA: 2, beltSize: 'XXH', z1: 22, z2: 66, a0: 1000, beltLen: '', bs: '' } },
  { name: 'S6 H i=1 4kW 1440r/min z18/18 a0=500', input: { P: 4, n1: 1440, n2: 1440, KA: 1.5, beltSize: 'H', z1: 18, z2: 18, a0: 500, beltLen: '', bs: '' } },
  { name: 'S7 L 8kW 1440r/min z16/48 a0=700 (bs 超系列)', input: { P: 8, n1: 1440, n2: 480, KA: 1.5, beltSize: 'L', z1: 16, z2: 48, a0: 700, beltLen: '', bs: '' } }
];

function log(s) { fs.appendFileSync('/workspace/.tmp_probe/e2e.log', new Date().toISOString() + ' ' + s + '\n'); }
function post(path, body, tries) {
  for (var k = 0; k < (tries || 3); k++) {
    var r = '';
    try {
      r = execFileSync('curl', ['-s', '-m', '20', '-X', 'POST', 'https://www.mechtool.cn/calculation/' + path,
        '-d', body, '-H', 'X-Requested-With: XMLHttpRequest'], { encoding: 'utf8', timeout: 25000 });
    } catch (e) { r = ''; }
    if (r && r[0] === '{') return r;
    try { execFileSync('sleep', ['2']); } catch (e) { }
  }
  return null;
}

/* 1) 等待 API 恢复（sanity：timingbelt1） */
var up = false;
for (var w = 0; w < 400; w++) {
  var r0 = post('timingbelt1', 'z1=18&z2=52&a0=500.0&beltSize=H', 1);
  if (r0) { try { if (JSON.parse(r0).flag) { up = true; log('API RECOVERED at wait#' + w); break; } } catch (e) { } }
  if (w % 5 === 0) log('waiting... #' + w);
  try { execFileSync('sleep', ['45']); } catch (e) { }
}
if (!up) { log('API NOT RECOVERED after 400 tries (~5h). give up.'); process.exit(2); }

/* 2) 逐场景：工具自算中间量 → timingbelt2 API → 逐字段比对 */
var out = [];
E2E.forEach(function (s) {
  var r = t.compute(s.input);
  if (r.error) { log(s.name + ' COMPUTE ERROR ' + r.error); out.push({ name: s.name, error: r.error }); return; }
  var d = r.debug;
  var body = 'powerD=' + d.Pd + '&beltSize=' + d.beltSize + '&beltVelocity=' + d.beltVelocity +
    '&kZ=' + d.kZ + '&n1=' + s.input.n1 + '&beltLen=' + d.beltLen + '&z1=' + d.z1 +
    '&kA=' + s.input.KA + '&alpha1=' + d.alpha1 + '&zM=' + d.zM;
  var raw = post('timingbelt2', body, 6);
  if (!raw) { log(s.name + ' API FAIL ' + body); out.push({ name: s.name, sent: body, api: null }); return; }
  var api = null;
  try { var j = JSON.parse(raw); api = j.flag ? j.resultData : { flagFalse: true }; } catch (e) { }
  var cmp = {};
  if (api && !api.flagFalse) {
    ['power0', 'bs0', 'bsMin', 'bs', 'm', 'powerR', 'forceQ'].forEach(function (k) {
      cmp[k] = { tool: d[k], api: api[k], ok: Number(d[k]) === Number(api[k]) };
    });
  }
  log(s.name + ' sent=' + body + ' api=' + JSON.stringify(api) + ' cmp=' + JSON.stringify(cmp));
  out.push({ name: s.name, sent: body, api: api, cmp: cmp });
  try { execFileSync('sleep', ['3']); } catch (e) { }
});
fs.writeFileSync('/workspace/.tmp_probe/e2e_out.json', JSON.stringify(out, null, 1));
var allOk = out.every(function (o) { return o.api && o.cmp && Object.keys(o.cmp).every(function (k) { return o.cmp[k].ok; }); });
log('E2E DONE allOk=' + allOk);
console.log('e2e_out.json written, allOk=' + allOk);
