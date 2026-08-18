/* Analyze fine n1 scans: find exact piecewise-linear breakpoints (table row nodes) */
var fs = require('fs');
function load(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

function breakpoints(rows, tol) {
  // rows: [[n, v], ...] with uniform or non-uniform steps; v may be null
  var bps = [];
  for (var i = 1; i < rows.length - 1; i++) {
    var a = rows[i - 1], b = rows[i], c = rows[i + 1];
    if (a[1] === null || b[1] === null || c[1] === null) continue;
    var s1 = (b[1] - a[1]) / (b[0] - a[0]), s2 = (c[1] - b[1]) / (c[0] - b[0]);
    if (Math.abs(s2 - s1) > (tol || 0.0000015)) bps.push(b[0]);
  }
  return bps;
}

var scans = {
  PK: load('/workspace/.tmp_probe/fine_pk.json'),
  PL: load('/workspace/.tmp_probe/fine_pl.json'),
  PM: load('/workspace/.tmp_probe/fine_pm.json'),
  PJ: load('/workspace/.tmp_probe/pv_n1nodes.json')
};
var res = {};
Object.keys(scans).forEach(function (k) {
  var rows = scans[k];
  var valid = rows.filter(function (r) { return r[1] !== null; });
  res[k] = {
    range: [rows[0][0], rows[rows.length - 1][0]],
    nulls: rows.filter(function (r) { return r[1] === null; }).map(function (r) { return r[0]; }).slice(0, 50),
    bps_tol15e7: breakpoints(rows, 0.0000015),
    bps_tol4e6: breakpoints(rows, 0.000004)
  };
});
fs.writeFileSync('/workspace/.tmp_probe/fine_analysis.json', JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1).slice(0, 6000));
