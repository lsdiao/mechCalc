// 提取 timingbelt1 各带型的节线长系列：对每个候选齿数 t，令 calBeltLen=t*pb（数值反解 a0），
// 探针返回的最近系列项 e 即为系列成员；e>t 时 (t,e) 内无系列项，可跳跃。
var { execFileSync } = require('child_process');
var fs = require('fs');
var PI = Math.PI;
var PB = { MXL: 2.032, XXL: 3.175, XL: 5.08, L: 9.525, H: 12.7, XH: 22.225, XXH: 31.75 };

function post(body) {
  for (var t = 0; t < 4; t++) {
    var r = '';
    try {
      r = execFileSync('curl', ['-s', '-m', '20', '-X', 'POST', 'https://www.mechtool.cn/calculation/timingbelt1',
        '-d', body, '-H', 'X-Requested-With: XMLHttpRequest'], { encoding: 'utf8', timeout: 25000 });
    } catch (e) { r = 'ERR'; }
    if (r && r[0] === '{') return r;
    try { execFileSync('sleep', ['1']); } catch (e) { }
  }
  return null;
}
function probe(z1, z2, a0, size) {
  var r = post('z1=' + z1 + '&z2=' + z2 + '&a0=' + a0.toFixed(9) + '&beltSize=' + size);
  if (!r) return null;
  try {
    var j = JSON.parse(r);
    if (!j.flag || !j.resultData) return null;
    return j.resultData;
  } catch (e) { return null; }
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

var TYPES = process.argv.slice(2).length ? process.argv.slice(2) : ['MXL', 'XXL', 'XL', 'L', 'H', 'XH', 'XXH'];
var out = {};
var known = { // 已验证观测（用于交叉校验）
  H: [54, 62, 68, 76, 84, 91, 97, 98, 107, 114, 121, 138, 154, 170, 184, 210, 240, 272],
  L: [75, 106, 138, 176, 224, 274, 375, 378],
  XH: [58, 72, 91, 105, 106, 128, 160, 180, 214],
  XXH: [112], XL: [138]
};
TYPES.forEach(function (size) {
  var pb = PB[size];
  var z1 = 18, z2 = 20;
  var d1 = z1 * pb / PI, d2 = z2 * pb / PI;
  var a0min = Math.abs((d2 - d1) / 2) + 0.5;
  var lo = probe(z1, z2, a0min, size);
  var hi = probe(z1, z2, 9000, size);
  if (!lo || !hi) { console.log(size + ' BOUNDARY FAIL'); out[size] = null; return; }
  var start = Math.round(lo.zB), end = Math.round(hi.zB);
  var series = [];
  var t = start, guard = 0;
  while (t <= end && guard++ < 400) {
    var L = t * pb;
    var a0 = solveA(d1, d2, L);
    if (!isFinite(a0) || a0 <= 0) { t++; continue; }
    var r = probe(z1, z2, a0, size);
    if (!r) { console.log(size + ' probe fail @t=' + t); t++; continue; }
    var e = Math.round(r.zB);
    if (e === t) { series.push(t); t++; }
    else if (e > t) { series.push(e); t = e + 1; }
    else { series.push(e); t++; } // 异常：e<t（不应发生）
    if (series.length % 20 === 0) process.stdout.write(size + ':' + series.length + ' ');
  }
  console.log('');
  // 校验已知观测 ⊆ series
  var miss = (known[size] || []).filter(function (k) { return series.indexOf(k) < 0; });
  out[size] = { start: start, end: end, teeth: series, lengths: series.map(function (z) { return +(z * pb).toFixed(5); }), knownMissing: miss };
  console.log('== ' + size + ' == start=' + start + ' end=' + end + ' n=' + series.length + (miss.length ? '  MISSKNOWN:' + miss.join(',') : ' OK') + '\n  ' + series.join(','));
});
fs.writeFileSync('/workspace/.tmp_probe/walk_out' + (TYPES.length === 1 ? '_' + TYPES[0] : '') + '.json', JSON.stringify(out, null, 1));
console.log('saved');
