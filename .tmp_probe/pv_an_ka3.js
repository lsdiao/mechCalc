/* Reconstruct exact kAlpha table from sweep data + probe polyvBeltLenChange a-formula */
var fs = require('fs');
var rows = JSON.parse(fs.readFileSync('/workspace/.tmp_probe/pv_alpha_sweep.json', 'utf8'));
var ka = [];
rows.forEach(function (r) { if (r[1] !== 'ERR') ka.push([r[2], r[3]]); });
ka.sort(function (a, b) { return b[0] - a[0]; }); // alpha desc
// print alpha,kAlpha where kAlpha changes
var prev = null;
ka.forEach(function (p) { if (prev === null || p[1] !== prev) { console.log(p[0].toFixed(4), p[1]); prev = p[1]; } });
console.log('=== local slopes (per deg) ===');
var sl = {};
for (var i = 0; i < ka.length - 1; i++) {
  if (ka[i][0] === ka[i + 1][0]) continue;
  var s = (ka[i + 1][1] - ka[i][1]) / (ka[i + 1][0] - ka[i][0]);
  sl[ka[i][0].toFixed(2)] = s;
}
Object.keys(sl).forEach(function (k) { console.log(k, (+sl[k]).toPrecision(5)); });
