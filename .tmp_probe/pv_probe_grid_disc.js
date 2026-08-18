/* Discover grid nodes: local slope of p1 vs n1 (PJ de1=20), and de1 interp check */
var pv = require('./pvlib.js');
var out = { slope: [], de: [], n1nodes: [] };
function p1(bs, n1, de, i) {
  var r = pv.post('polyvP1Query', { beltSize: bs, n1: n1, de1: de, i: i || 1 });
  return r.flag ? r.resultData : null;
}
// A) slope scan: p1(n) and p1(n+2) for n=200..1980 step 20  (PJ de20)
for (var n = 200; n <= 1980; n += 20) {
  var a = p1('PJ', n, 20), b = p1('PJ', n + 2, 20);
  if (a && b) out.slope.push([n, a.p1, b.p1, (b.p1 - a.p1) / 2]);
  pv.sleep(120);
}
// B) de1 interpolation check at n1=1460: probe 20, 20.5, 21, 21.5, 22.4, 23
[20, 20.5, 21, 21.5, 22, 22.4, 23, 24].forEach(function (d) {
  var a = p1('PJ', 1460, d);
  out.de.push([d, a && a.p1, a && a.deltaP1]);
  pv.sleep(120);
});
// C) n1 half-step: check 1425,1449,1450,1451,1459,1460,1461
[1420, 1425, 1430, 1449, 1450, 1451, 1459, 1460, 1461, 1470].forEach(function (n) {
  var a = p1('PJ', n, 20);
  out.n1nodes.push([n, a && a.p1]);
  pv.sleep(120);
});
require('fs').writeFileSync('/workspace/.tmp_probe/pv_grid_disc.json', JSON.stringify(out));
console.log(JSON.stringify(out.de));
console.log(JSON.stringify(out.n1nodes));
console.log('slopes:', out.slope.map(function (r) { return r[0] + ':' + r[3].toFixed(6); }).join(' '));
