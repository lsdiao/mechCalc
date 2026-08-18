var rows = JSON.parse(require('fs').readFileSync('/workspace/.tmp_probe/pv_alpha_sweep.json', 'utf8'));
// kr table from HTML modal
var KR = [[180, 5.00], [170, 4.57], [160, 4.18], [150, 3.82], [140, 3.50], [130, 3.20], [120, 2.92], [110, 2.67], [100, 2.45], [90, 2.24], [80, 2.04], [70, 1.87], [60, 1.71]];
function interp(t, x) {
  if (x >= t[0][0]) return t[0][1];
  for (var i = 0; i < t.length - 1; i++) {
    if (x <= t[i][0] && x >= t[i + 1][0]) {
      var f = (t[i][0] - x) / (t[i][0] - t[i + 1][0]);
      return t[i][1] - f * (t[i][1] - t[i + 1][1]);
    }
  }
  return t[t.length - 1][1];
}
var krOK = 0, krBad = [], ka = [];
rows.forEach(function (r) {
  if (r[1] === 'ERR') return;
  var a1 = r[2], kr = r[4], kaV = r[3];
  var e = interp(KR, a1);
  if (Math.abs(e - kr) < 0.0051) krOK++; else krBad.push([a1, kr, e]);
  ka.push([a1, kaV]);
});
ka.sort(function (a, b) { return a[0] - b[0]; });
console.log('kr linear-interp OK:', krOK, 'bad:', krBad.length, JSON.stringify(krBad.slice(0, 10)));
// kAlpha: print as function of alpha1, check granularity: successive distinct alphas
var seen = {};
ka.forEach(function (p) { seen[p[0]] = p[1]; });
var keys = Object.keys(seen).map(Number).sort(function (a, b) { return b - a; });
console.log('kAlpha samples (alpha desc):');
keys.forEach(function (k) { if (k % 2 < 0.4 || k % 1 === 0) console.log(k.toFixed(2), seen[k]); });
// try fit: kAlpha vs alpha1 slope changes
var diffs = [];
for (var i = 0; i < ka.length - 1; i++) {
  var d = (ka[i + 1][1] - ka[i][1]) / (ka[i + 1][0] - ka[i][0]);
  diffs.push([ka[i][0], d]);
}
console.log('slope samples:', diffs.filter(function (d, idx) { return idx % 12 === 0; }).map(function (d) { return d[0].toFixed(1) + ':' + d[1].toFixed(5); }).join(' '));
