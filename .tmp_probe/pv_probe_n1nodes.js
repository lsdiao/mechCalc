/* find n1 grid nodes using steep column PJ de1=150 (n1 1000..4200) */
var pv = require('./pvlib.js');
var rows = [];
function p1(n1) {
  var r = pv.post('polyvP1Query', { beltSize: 'PJ', n1: n1, de1: 150, i: 1 });
  return r.flag ? r.resultData.p1 : null;
}
for (var n = 1000; n <= 1600; n += 10) { rows.push([n, p1(n)]); pv.sleep(110); }
for (var n2 = 1620; n2 <= 4200; n2 += 20) { rows.push([n2, p1(n2)]); pv.sleep(110); }
require('fs').writeFileSync('/workspace/.tmp_probe/pv_n1nodes.json', JSON.stringify(rows));
// piecewise-linear breakpoint detection
var bps = [rows[0][0]];
for (var i = 1; i < rows.length - 1; i++) {
  var x0 = rows[i - 1][0], y0 = rows[i - 1][1], x1 = rows[i][0], y1 = rows[i][1], x2 = rows[i + 1][0], y2 = rows[i + 1][1];
  var s1 = (y1 - y0) / (x1 - x0), s2 = (y2 - y1) / (x2 - x1);
  if (Math.abs(s2 - s1) > 0.000003) bps.push([x1, +s1.toPrecision(4), +s2.toPrecision(4)]);
}
console.log(JSON.stringify(bps));
