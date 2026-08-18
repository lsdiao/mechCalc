var rows = JSON.parse(require('fs').readFileSync('/workspace/.tmp_probe/pv_alpha_sweep.json', 'utf8'));
var ka = [];
rows.forEach(function (r) { if (r[1] !== 'ERR') ka.push([r[2], r[3]]); });
ka.sort(function (a, b) { return b[0] - a[0]; });
// group: print all pairs where kAlpha changes
var prev = null;
ka.forEach(function (p) {
  if (prev === null || p[1] !== prev) {
    console.log(p[0].toFixed(2), p[1]);
    prev = p[1];
  }
});
