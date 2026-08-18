/* Probe PrFormula structure + kL for non-T4 lengths */
var fs = require('fs');
var pv = require('./pvlib.js');
var out = {};

function pr(bs, n1, de1, i, kL, kA) {
  return pv.post('polyvPrFormula', { beltSize: bs, n1: n1, de1: de1, deltaE: 0, i: i, kL: kL || 1, kAlpha: kA || 1 });
}
function prE(bs, n1, de1, dE, i, kL, kA) {
  return pv.post('polyvPrFormula', { beltSize: bs, n1: n1, de1: de1, deltaE: dE, i: i, kL: kL || 1, kAlpha: kA || 1 });
}

// 1) K vs n1  (PJ de=20 i=1.3): derive K = (Pr - P1) / (n1*(1-1/i))
out.kVsn1 = [];
[200, 400, 700, 1000, 1200, 1460, 1700, 2000, 2500, 3000, 3600, 4200, 4800, 5400, 6000].forEach(function (n) {
  var r = pr('PJ', n, 20, 1.3);
  out.kVsn1.push([n, r.flag ? r.resultData : null]);
  pv.sleep(140);
});

// 2) K vs de1 (PJ n1=1460 i=1.3)
out.kVsde = [];
[20, 25, 31.5, 40, 50, 63, 75, 90, 100, 118, 132, 150, 180, 224, 300].forEach(function (d) {
  var r = pr('PJ', 1460, d, 1.3);
  out.kVsde.push([d, r.flag ? r.resultData : null]);
  pv.sleep(140);
});

// 3) K vs deltaE (PJ n1=1460 de=20 i=1.3, deltaE varies)
out.kVsdeltaE = [];
[0, 1.1, 2, 3.5].forEach(function (e) {
  var r = prE('PJ', 1460, 20, e, 1.3);
  out.kVsdeltaE.push([e, r.flag ? r.resultData : null]);
  pv.sleep(140);
});

// 4) threshold i: PJ n1=1460 de=20, i from 1.50 to 1.70 step small
out.iThresh = [];
for (var i = 1.5; i <= 1.7001; i += 0.01) {
  var r = pr('PJ', 1460, 20, +i.toFixed(2));
  out.iThresh.push([+i.toFixed(2), r.flag ? r.resultData : null]);
  pv.sleep(120);
}

// 5) kL/kAlpha scaling: PJ 1460/20 i=1.3 with kL=2 kAlpha=3; kL=0.5 kA=0.8
out.scale = [];
[[1, 1], [2, 1], [1, 3], [2, 3], [0.5, 0.8]].forEach(function (s) {
  var r = pr('PJ', 1460, 20, 1.3, s[0], s[1]);
  out.scale.push([s[0], s[1], r.flag ? r.resultData : null]);
  pv.sleep(140);
});

// 6) all belts: PK/PL/PM n1=1460, de=min, i=1.3 and i=2.5
out.belts = [];
[['PK', 45], ['PL', 75], ['PM', 180], ['PK', 100], ['PL', 150], ['PM', 250]].forEach(function (b) {
  [1.3, 2.5].forEach(function (ii) {
    var r = pr(b[0], 1460, b[1], ii);
    out.belts.push([b[0], b[1], ii, r.flag ? r.resultData : null]);
    pv.sleep(140);
  });
});

// 7) n2 direction: same n1*(1-1/i) via different (n1,i)
out.sameDiff = [];
[[1460, 1.3], [730, 1.65], [2920, 1.15]].forEach(function (c) {
  var r = pr('PJ', c[0], 20, c[1]);
  out.sameDiff.push([c[0], c[1], c[0] * (1 - 1 / c[1]), r.flag ? r.resultData : null]);
  pv.sleep(140);
});

fs.writeFileSync('/workspace/.tmp_probe/pv_formula_probe.json', JSON.stringify(out));
console.log('done', JSON.stringify(out).length);
