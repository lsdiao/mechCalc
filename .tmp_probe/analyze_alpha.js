/* Extract kAlpha and kr tables (alpha1 -> value) from polyv1 sweep: segment growing on rounded steps */
var fs = require('fs');
var rows = JSON.parse(fs.readFileSync('/workspace/.tmp_probe/pv_alpha_sweep.json', 'utf8'));
var pts = rows.filter(function (r) { return r[1] !== 'ERR'; }).map(function (r) { return [r[2], r[3], r[4], r[1], r[0], r[6], r[5]]; }); // alpha, kAlpha, kr, a, a0, calBeltLen, kL
pts.sort(function (a, b) { return a[0] - b[0]; });

function stepTable(idx, tol) {
  // values are step functions (rounded to 2-3 dp); find transition alphas
  var out = [];
  for (var i = 1; i < pts.length; i++) {
    if (Math.abs(pts[i][idx] - pts[i - 1][idx]) > 1e-9) {
      out.push([+pts[i - 1][0].toFixed(3), +pts[i - 1][idx], +pts[i][0].toFixed(3), +pts[i][idx]]);
    }
  }
  return out;
}
console.log('alpha range:', pts[0][0], '->', pts[pts.length - 1][0]);
console.log('=== kAlpha transitions (prevA,prevV,nextA,nextV) ===');
stepTable(1).forEach(function (t) { console.log(t.join(' ')); });
console.log('=== kr transitions ===');
stepTable(2).forEach(function (t) { console.log(t.join(' ')); });
console.log('=== kL transitions ===');
stepTable(6).forEach(function (t) { console.log(t.join(' ')); });
