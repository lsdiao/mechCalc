/* PK discovery: coarse n1 scan at de=100, find max n1, then detect nodes */
var pv = require('./pvlib.js');
function p1(n1, de) {
  var r = pv.post('polyvP1Query', { beltSize: 'PK', n1: n1, de1: de || 100, i: 1 });
  return r.flag ? r.resultData.p1 : null;
}
var rows = [];
for (var n = 100; n <= 6000; n += 100) { rows.push([n, p1(n)]); pv.sleep(110); }
console.log('coarse:', JSON.stringify(rows));
// fine scan in active region for node detection (step 20)
var maxN = 0; rows.forEach(function (r) { if (r[1] !== null) maxN = r[0]; });
console.log('maxN approx:', maxN);
var fine = [];
for (var m = 900; m <= Math.min(maxN + 100, 4600); m += 20) { fine.push([m, p1(m)]); pv.sleep(110); }
require('fs').writeFileSync('/workspace/.tmp_probe/pk_fine.json', JSON.stringify(fine));
var bps = [];
for (var i = 1; i < fine.length - 1; i++) {
  var s1 = (fine[i][1] - fine[i - 1][1]) / (fine[i][0] - fine[i - 1][0]);
  var s2 = (fine[i + 1][1] - fine[i][1]) / (fine[i + 1][0] - fine[i][0]);
  if (Math.abs(s2 - s1) > 0.0000035) bps.push([fine[i][0], +s1.toPrecision(4), +s2.toPrecision(4)]);
}
console.log('breakpoints:', JSON.stringify(bps));
