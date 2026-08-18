// 耐心等待 mechtool API 恢复后，逐带型提取节线长系列（walk 跳跃法），并追加 E2E 验证探针。
// 用法: node walk2.js &   （后台运行，进度写入 walk_out2.json / walk2.log）
var { execFileSync } = require('child_process');
var fs = require('fs');
var PI = Math.PI;
var PB = { MXL: 2.032, XXL: 3.175, XL: 5.08, L: 9.525, H: 12.7, XH: 22.225, XXH: 31.75 };
var LMAX = 5300; // mm，系列提取上限（GB 表最大 4572，留裕量）

function log(s) { fs.appendFileSync('/workspace/.tmp_probe/walk2.log', new Date().toISOString() + ' ' + s + '\n'); }
function post(body, tries) {
  for (var t = 0; t < (tries || 3); t++) {
    var r = '';
    try {
      r = execFileSync('curl', ['-s', '-m', '20', '-X', 'POST', 'https://www.mechtool.cn/calculation/timingbelt1',
        '-d', body, '-H', 'X-Requested-With: XMLHttpRequest'], { encoding: 'utf8', timeout: 25000 });
    } catch (e) { r = ''; }
    if (r && r[0] === '{') return r;
    try { execFileSync('sleep', ['1.5']); } catch (e) { }
  }
  return null;
}
function probe1(z1, z2, a0, size) {
  var r = post('z1=' + z1 + '&z2=' + z2 + '&a0=' + a0.toFixed(9) + '&beltSize=' + size);
  if (!r) return null;
  try { var j = JSON.parse(r); return j.flag && j.resultData ? j.resultData : null; } catch (e) { return null; }
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

// 1) 等待 API 恢复
var up = false;
for (var w = 0; w < 90; w++) {
  var t0 = probe1(18, 52, 500, 'H');
  if (t0) { up = true; log('API RECOVERED at wait#' + w + ' sanity=' + JSON.stringify(t0)); break; }
  if (w % 5 === 0) log('waiting... #' + w);
  try { execFileSync('sleep', ['40']); } catch (e) { }
}
if (!up) { log('API NOT RECOVERED after 90 tries (~60min). give up.'); process.exit(2); }

// 2) 逐带型 walk
var known = {
  H: [54, 62, 68, 76, 84, 91, 97, 98, 107, 114, 120, 121, 138, 154, 170, 184, 210, 240, 272],
  L: [75, 106, 108, 128, 138, 176, 224, 274, 375, 378],
  XH: [58, 72, 91, 96, 105, 106, 128, 140, 160, 180, 214],
  XXH: [56, 64, 72, 112, 128, 144],
  XL: [100, 130, 138]
};
var out = {};
['MXL', 'XXL', 'XL', 'L', 'H', 'XH', 'XXH'].forEach(function (size) {
  var pb = PB[size];
  var z1 = 18, z2 = 20;
  var d1 = z1 * pb / PI, d2 = z2 * pb / PI;
  var a0min = Math.abs((d2 - d1) / 2) + 0.5;
  var lo = probe1(z1, z2, a0min, size);
  if (!lo) { log(size + ' BOUNDARY FAIL'); out[size] = null; return; }
  var start = Math.round(lo.zB), end = Math.floor(LMAX / pb);
  var series = [], t = start, guard = 0;
  while (t <= end && guard++ < 500) {
    var L = t * pb;
    var a0 = solveA(d1, d2, L);
    if (!isFinite(a0) || a0 <= 0) { t++; continue; }
    var r = probe1(z1, z2, a0, size);
    if (!r) { log(size + ' probe fail @t=' + t); t++; continue; }
    var e = Math.round(r.zB);
    if (e === t) { series.push(t); t++; }
    else if (e > t) { series.push(e); t = e + 1; }
    else { series.push(e); t++; }
    if (series.length % 25 === 0) log(size + ' progress n=' + series.length);
    try { execFileSync('sleep', ['0.8']); } catch (e2) { }
  }
  var miss = (known[size] || []).filter(function (k) { return series.indexOf(k) < 0; });
  out[size] = { start: start, end: end, teeth: series, lengths: series.map(function (z) { return +(z * pb).toFixed(5); }), knownMissing: miss };
  log('== ' + size + ' == n=' + series.length + (miss.length ? ' MISSKNOWN:' + miss.join(',') : ' OK') + ' :: ' + series.join(','));
  fs.writeFileSync('/workspace/.tmp_probe/walk_out2.json', JSON.stringify(out, null, 1));
  try { execFileSync('sleep', ['2']); } catch (e) { }
});
log('WALK DONE');
