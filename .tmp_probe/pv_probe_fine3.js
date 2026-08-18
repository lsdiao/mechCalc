/* Fine node scans: PK(100)/PL(150)/PM(250) with breakpoint detection */
var pv = require('./pvlib.js');
var fs = require('fs');
var jobs = JSON.parse(fs.readFileSync(__dirname + '/pv_fine_jobs.json', 'utf8'));
var tag = process.argv[2];
var j = jobs[tag];
function p1(n1) {
  var r = pv.post('polyvP1Query', { beltSize: j.bs, n1: n1, de1: j.de, i: 1 });
  return r.flag ? r.resultData.p1 : null;
}
var rows = [];
for (var n = j.from; n <= j.to; n += j.step) {
  rows.push([n, p1(n)]);
  pv.sleep(110);
}
fs.writeFileSync('/workspace/.tmp_probe/fine_' + tag + '.json', JSON.stringify(rows));
var bps = [];
for (var i = 1; i < rows.length - 1; i++) {
  if (rows[i][1] === null || rows[i - 1][1] === null || rows[i + 1][1] === null) continue;
  var s1 = (rows[i][1] - rows[i - 1][1]) / (rows[i][0] - rows[i - 1][0]);
  var s2 = (rows[i + 1][1] - rows[i][1]) / (rows[i + 1][0] - rows[i][0]);
  if (Math.abs(s2 - s1) > 0.000004) bps.push([rows[i][0], +s1.toPrecision(4), +s2.toPrecision(4)]);
}
console.log(tag, 'breakpoints:', JSON.stringify(bps));
