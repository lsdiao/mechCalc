/* Quick structural verification probes */
var pv = require('./pvfast.js');
var out = {};

function pq(bs, n1, de1, i) {
  var r = pv.post('polyvP1Query', { beltSize: bs, n1: n1, de1: de1, i: i });
  return r.flag ? r.resultData : { ERR: 1 };
}

/* (a) PJ de=150 / n1=1460 null check + de domain edges */
out.pj_de_domain = [];
[100, 112, 125, 140, 150, 160, 170].forEach(function (de) {
  out.pj_de_domain.push([de, pq('PJ', 1460, de, 1)]);
  pv.sleep === undefined;
});

/* (b) dP1 de-independence: PJ n1=1460 de=75 full band sweep */
var bands = [1.005, 1.03, 1.08, 1.15, 1.22, 1.32, 1.45, 1.7, 2.5, 4];
out.dp1_de75 = bands.map(function (i) { return [i, pq('PJ', 1460, 75, i)]; });
out.dp1_de150 = bands.map(function (i) { return [i, pq('PJ', 1460, 150, i)]; });

/* (c) node density checks: PL de=75 around 1900-2000, PM de=180 around 2300-2500 */
out.pl_dense = [];
for (var n = 1880; n <= 2020; n += 10) out.pl_dense.push([n, pq('PL', n, 75, 1).p1]);
out.pm_dense = [];
for (var m = 2280; m <= 2420; m += 10) out.pm_dense.push([m, pq('PM', m, 180, 1).p1]);
out.pj_dense = [];
for (var j = 1880; j <= 2020; j += 10) out.pj_dense.push([j, pq('PJ', j, 50, 1).p1]);

/* (d) formula cap check: PJ n1=7000 de=50 PrFormula i=1,1.3,1.7,2,4 vs table bands */
function prf(bs, n1, de1, i) {
  var r = pv.post('polyvPrFormula', { beltSize: bs, n1: n1, de1: de1, deltaE: 0, i: i, kL: 1, kAlpha: 1 });
  return r.flag ? r.resultData : { ERR: 1 };
}
out.cap7k = [1, 1.3, 1.7, 2, 4].map(function (i) { return [i, prf('PJ', 7000, 50, i)]; });
out.tbl7k = bands.map(function (i) { return [i, pq('PJ', 7000, 50, i)]; });

/* (e) n1 domain edges per belt at a mid de */
out.edges = [];
[['PJ', 50, 4600, 5000], ['PK', 45, 6800, 8000], ['PL', 75, 4400, 5000], ['PM', 180, 2600, 3400]].forEach(function (s) {
  [s[2] - 100, s[2] - 10, s[2], s[2] + 10, s[3]].forEach(function (n) {
    out.edges.push([s[0], n, pq(s[0], n, s[1], 1).p1]);
  });
});

require('fs').writeFileSync('/workspace/.tmp_probe/pv_quick_verify.json', JSON.stringify(out));
console.log(JSON.stringify(out, null, 1));
