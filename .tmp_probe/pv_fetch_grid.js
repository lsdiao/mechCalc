/* Quick checks before big fetch: dP1 de-independence, dP1 n1 behavior between knots, PK kL field */
var pv = require('./pvlib.js');
var out = {};
function q(bs, n1, de, i) {
  var r = pv.post('polyvP1Query', { beltSize: bs, n1: n1, de1: de, i: i });
  return r.flag ? r.resultData : { ERR: (r.raw || '').slice(0, 60) };
}
// 1) dP1 vs de (PJ, n1=1460, i=1.2)
out.dp1_de = [['PJ',1460,20,1.2],['PJ',1460,50,1.2],['PJ',1460,75,1.2],['PJ',1460,100,1.2],['PJ',1460,150,1.2],['PK',1460,45,1.2],['PK',1460,100,1.2],['PK',1460,300,1.2],['PL',1460,75,1.2],['PL',1460,150,1.2],['PM',1460,180,1.2],['PM',1460,250,1.2]].map(function (c) {
  var r = q(c[0], c[1], c[2], c[3]); pv.sleep(150);
  return [c[0], c[2], r.p1, r.deltaP1];
});
// 2) dP1 n1 linearity: PJ de=50, i=1.2, n1=1450..1500 step 10 (knot at 1425, next 1700)
out.dp1_n1 = [];
for (var n = 1425; n <= 1700; n += 25) { out.dp1_n1.push([n, q('PJ', n, 50, 1.2).deltaP1]); pv.sleep(150); }
require('fs').writeFileSync('/workspace/.tmp_probe/pv_dp1_check.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
