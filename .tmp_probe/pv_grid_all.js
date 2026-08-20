/* Probe P1 (table path) surface + deltaP1 for all belt types, coarse but decisive grid. */
var pv = require('./pvfast.js');
var cp = require('child_process');
var fs = require('fs');

function query(ep, params) {
  var d = Object.keys(params).map(function (k) { return k + '=' + params[k]; }).join('&');
  var cmd = "curl -s -X POST 'https://www.mechtool.cn/calculation/" + ep + "' -d '" + d + "' -H 'X-Requested-With: XMLHttpRequest' --max-time 15";
  try { var o = JSON.parse(cp.execSync(cmd, { encoding: 'utf8', timeout: 20000 })); return o.flag ? o.resultData : null; }
  catch (e) { return null; }
}

var BELTS = {
  PJ: { de: [20, 25, 31.5, 40, 50, 63, 75, 90, 100, 118, 132, 150, 180, 224, 300], n1: [200, 500, 900, 1460, 2000, 3000, 4000, 4500] },
  PK: { de: [45, 50, 56, 63, 71, 80, 90, 100, 112, 125, 140, 160, 180, 200, 224, 250, 300, 355], n1: [200, 500, 900, 1460, 2000, 3000, 4000, 5000, 6000, 6790] },
  PL: { de: [75, 90, 100, 112, 125, 140, 160, 180, 200, 224, 250, 280, 300, 355, 400, 450, 500, 600, 750], n1: [200, 500, 900, 1460, 2000, 3000, 4000, 4400] },
  PM: { de: [180, 200, 224, 250, 280, 300, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1120], n1: [200, 500, 900, 1460, 2000, 2600] }
};

var out = { p1: {}, dp1: {} };
Object.keys(BELTS).forEach(function (bs) {
  var B = BELTS[bs];
  out.p1[bs] = {};
  B.de.forEach(function (de) {
    var row = [];
    B.n1.forEach(function (n) {
      var r = query('polyvP1Query', { beltSize: bs, n1: n, de1: de, i: 1 });
      row.push([n, r ? r.p1 : null, r ? r.deltaP1 : null]);
    });
    out.p1[bs][de] = row;
  });
  /* deltaP1 vs i at mid diameter, two n */
  out.dp1[bs] = { de: B.de[Math.min(6, B.de.length - 1) % B.de.length] };
  var dmid = B.de[0];
  out.dp1[bs].mid = [];
  [1460, 2850].forEach(function (n) {
    var r = query('polyvP1Query', { beltSize: bs, n1: n, de1: dmid, i: 1 });
    out.dp1[bs].mid.push([n, r ? r.p1 : null, r ? r.deltaP1 : null]);
  });
  var iseries = [1, 1.1, 1.2, 1.3, 1.5, 1.56, 2, 3, 5].map(function (i) {
    var r = query('polyvP1Query', { beltSize: bs, n1: 1460, de1: dmid, i: i });
    return [i, r ? r.p1 : null, r ? r.deltaP1 : null];
  });
  out.dp1[bs].i = iseries;
});

fs.writeFileSync('/workspace/.tmp_probe/pv_grid_all.json', JSON.stringify(out));
console.log('saved');