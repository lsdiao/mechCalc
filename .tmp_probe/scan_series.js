// 并行扫描提取 timingbelt1 各带型节线长系列：
// 对范围内每个候选齿数 t 生成一条探针（calBeltLen=t*pb 反解 a0），curl --parallel 并发执行，
// 返回 zB==t ⇒ t 属于系列。用法: node scan_series.js XL L H
var { execFileSync } = require('child_process');
var fs = require('fs');
var PI = Math.PI;
var PB = { MXL: 2.032, XXL: 3.175, XL: 5.08, L: 9.525, H: 12.7, XH: 22.225, XXH: 31.75 };

function post(body) {
  var r = '';
  try {
    r = execFileSync('curl', ['-s', '-m', '20', '-X', 'POST', 'https://www.mechtool.cn/calculation/timingbelt1',
      '-d', body, '-H', 'X-Requested-With: XMLHttpRequest'], { encoding: 'utf8', timeout: 25000 });
  } catch (e) { r = ''; }
  if (r && r[0] === '{') return r;
  return null;
}
function probe(z1, z2, a0, size) {
  for (var k = 0; k < 3; k++) {
    var r = post('z1=' + z1 + '&z2=' + z2 + '&a0=' + a0 + '&beltSize=' + size);
    if (r) { try { var j = JSON.parse(r); if (j.flag && j.resultData) return j.resultData; } catch (e) { } }
  }
  return null;
}
function beltL(d1, d2, a) {
  var dl = (d2 - d1) / 2;
  if (Math.abs(dl) >= a) return NaN;
  var th = Math.asin(dl / a);
  return 2 * Math.sqrt(a * a - dl * dl) + (PI - 2 * th) * d1 / 2 + (PI + 2 * th) * d2 / 2;
}
function solveA(d1, d2, L) {
  var lo = Math.abs((d2 - d1) / 2) + 1e-4, hi = 30000;
  for (var i = 0; i < 160; i++) {
    var m = (lo + hi) / 2;
    if (beltL(d1, d2, m) < L) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}
function parallelScan(size, ts) {
  var pb = PB[size], z1 = 18, z2 = 20;
  var d1 = z1 * pb / PI, d2 = z2 * pb / PI;
  var cfg = '/tmp/scan_' + size + '.cfg';
  var lines = ['parallel-max = 10', 'silent', 'max-time = 25', 'request = POST',
    'header = "X-Requested-With: XMLHttpRequest"',
    'url = "https://www.mechtool.cn/calculation/timingbelt1"'];
  ts.forEach(function (t) {
    lines.push('next'); // 新的独立请求
    lines.push('url = "https://www.mechtool.cn/calculation/timingbelt1"');
    lines.push('request = POST');
    lines.push('header = "X-Requested-With: XMLHttpRequest"');
    lines.push('data = "z1=18&z2=20&a0=' + solveA(d1, d2, t * pb).toFixed(9) + '&beltSize=' + size + '"');
  });
  lines.shift(); lines.shift(); lines.shift(); lines.shift(); lines.shift(); // 移除开头的全局项(保留格式整洁)
  fs.writeFileSync(cfg, lines.join('\n') + '\n');
  var out = '';
  try {
    out = execFileSync('curl', ['--parallel', '--parallel-max', '10', '--parallel-immediate',
      '--config', cfg, '-m', '120', '-s'], { encoding: 'utf8', timeout: 150000, maxBuffer: 60 * 1024 * 1024 });
  } catch (e) { out = (e.stdout || '') + ''; }
  var chunks = out.split(/(?=\{"dataList")/).filter(function (s) { return s[0] === '{'; });
  var res = {};
  chunks.forEach(function (s) {
    try { var j = JSON.parse(s.substring(0, s.lastIndexOf('}') + 1)); if (j.flag && j.resultData) res[Math.round(j.resultData.zB)] = true; } catch (e) { }
  });
  return res;
}

var TYPES = process.argv.slice(2).length ? process.argv.slice(2) : ['MXL', 'XXL', 'XL', 'L', 'H', 'XH', 'XXH'];
var all = {};
TYPES.forEach(function (size) {
  var pb = PB[size], z1 = 18, z2 = 20;
  var d1 = z1 * pb / PI, d2 = z2 * pb / PI;
  var t0 = Date.now();
  var lo = probe(18, 20, (Math.abs((d2 - d1) / 2) + 0.5).toFixed(9), size);
  var hi = probe(18, 20, '9000', size);
  if (!lo || !hi) { console.log(size + ' BOUNDARY FAIL'); all[size] = null; return; }
  var start = Math.round(lo.zB), end = Math.round(hi.zB);
  console.log(size + ' range ' + start + '..' + end);
  var ts = []; for (var t = start; t <= end; t++) ts.push(t);
  var hits = parallelScan(size, ts);
  var series = ts.filter(function (t) { return hits[t]; });
  // 重试缺失的
  var missing = ts.filter(function (t) { return !hits[t]; });
  if (missing.length && missing.length < ts.length) {
    console.log(size + ' retry ' + missing.length);
    var hits2 = parallelScan(size, missing);
    missing.forEach(function (t) { if (hits2[t]) series.push(t); });
    series.sort(function (a, b) { return a - b; });
  }
  all[size] = { start: start, end: end, teeth: series };
  console.log(size + ' n=' + series.length + ' [' + series.join(',') + '] (' + ((Date.now() - t0) / 1000).toFixed(0) + 's)');
  fs.writeFileSync('/workspace/.tmp_probe/scan_out_' + size + '.json', JSON.stringify(all[size]));
});
console.log('DONE');
