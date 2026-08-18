/* Robust node detection: grow linear segments within rounding tolerance (±0.0002) */
var fs = require('fs');
function load(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

function segments(rows, tol) {
  tol = tol || 0.0002;
  var pts = rows.filter(function (r) { return r[1] !== null && isFinite(r[1]); });
  var segs = [];
  var a = pts[0], b = pts[1];
  for (var i = 2; i < pts.length; i++) {
    var c = pts[i];
    var pred = b[1] + (c[0] - b[0]) * (b[1] - a[1]) / (b[0] - a[0]);
    if (Math.abs(pred - c[1]) <= tol) { b = c; continue; }
    segs.push([a, b]);
    a = b; b = c;
  }
  segs.push([a, b]);
  return segs;
}

var scans = {
  PK: load('/workspace/.tmp_probe/fine_pk.json'),
  PL: load('/workspace/.tmp_probe/fine_pl.json'),
  PM: load('/workspace/.tmp_probe/fine_pm.json'),
  PJ: load('/workspace/.tmp_probe/pv_n1nodes.json')
};
var out = {};
Object.keys(scans).forEach(function (k) {
  var segs = segments(scans[k]);
  out[k] = segs.map(function (s) {
    return [s[0][0], s[1][0], +(s[0][1]).toFixed(4), +((s[1][1] - s[0][1]) / (s[1][0] - s[0][0])).toPrecision(4)];
  });
});
fs.writeFileSync('/workspace/.tmp_probe/fine_segments.json', JSON.stringify(out, null, 1));
Object.keys(out).forEach(function (k) {
  console.log('== ' + k + ' (' + out[k].length + ' segs)');
  console.log(out[k].map(function (s) { return s[0] + '-' + s[1] + ' v' + s[2] + ' sl' + s[3]; }).join(' | '));
});
