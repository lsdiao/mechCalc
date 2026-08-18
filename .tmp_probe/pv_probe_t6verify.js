/* Verify T6 n1-row grid at PJ de1=150: node values + off-node linearity checks */
var pv = require('./pvlib.js');
function p1(n1, de) {
  var r = pv.post('polyvP1Query', { beltSize: 'PJ', n1: n1, de1: de || 150, i: 1 });
  return r.flag ? r.resultData.p1 : null;
}
var T6rows = [200,300,400,500,600,700,800,900,950,1000,1100,1160,1200,1300,1400,1425,1500,1600,1700,1800,1900,2000,2200,2400,2600,2850,3000,3200,3400,3600,4000,5000,6000,7000,8000,9000,10000];
var nodes = [];
T6rows.forEach(function (n) { nodes.push([n, p1(n)]); pv.sleep(110); });
console.log('nodes:', JSON.stringify(nodes));
var off = [450,715,850,965,1030,1150,1240,1350,1450,1460,1550,1650,1750,1850,1950,2100,2300,2900,3100,4200,4400,4500,4600];
var res = [];
off.forEach(function (n) { res.push([n, p1(n)]); pv.sleep(110); });
// check linearity vs adjacent nodes
var bad = [];
res.forEach(function (p) {
  var n = p[0], v = p[1];
  if (v === null) { bad.push([n, 'null']); return; }
  var lo = null, hi = null;
  for (var i = 0; i < nodes.length - 1; i++) if (n > nodes[i][0] && n < nodes[i + 1][0]) { lo = nodes[i]; hi = nodes[i + 1]; break; }
  if (!lo) { bad.push([n, 'outside', v]); return; }
  var lin = lo[1] + (n - lo[0]) / (hi[0] - lo[0]) * (hi[1] - lo[1]);
  if (Math.abs(lin - v) > 0.00006) bad.push([n, v, +lin.toFixed(5)]);
});
console.log('off-node NON-linear:', JSON.stringify(bad));
console.log('off-node ok count:', res.length - bad.length);
