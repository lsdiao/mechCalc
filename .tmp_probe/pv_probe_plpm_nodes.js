/* Verify T7/T8 n1-row grids for PL (de=150) and PM (de=250); dump node vals + off-node linearity */
var pv = require('./pvlib.js');
var T7 = [100,200,300,400,500,540,575,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200,2300,2400,2600,2800,2900,3000,3500,4000,4500,5000];
var T8 = [100,200,300,400,500,540,575,600,675,700,800,870,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000,2200,2400,2600,2800,2900,3000,3400,3800];
function run(bs, de, rows, tag) {
  var nodes = [];
  rows.forEach(function (n) {
    var r = pv.post('polyvP1Query', { beltSize: bs, n1: n, de1: de, i: 1 });
    nodes.push([n, r.flag ? r.resultData.p1 : null]); pv.sleep(110);
  });
  console.log(tag, 'nodes:', JSON.stringify(nodes));
  var off = [250,450,560,640,760,835,950,1150,1350,1550,1750,1950,2050,2150,2250,2350,2700,2950,3200,3300,3600,3700,4200,4400,4600,4800];
  var bad = 0, tot = 0;
  off.forEach(function (n) {
    var r = pv.post('polyvP1Query', { beltSize: bs, n1: n, de1: de, i: 1 });
    var v = r.flag ? r.resultData.p1 : null; tot++;
    if (v === null) return;
    var lo = null, hi = null;
    for (var i = 0; i < nodes.length - 1; i++) if (n > nodes[i][0] && n < nodes[i + 1][0]) { lo = nodes[i]; hi = nodes[i + 1]; break; }
    if (!lo) { console.log(tag, n, 'OUTSIDE'); return; }
    var lin = lo[1] + (n - lo[0]) / (hi[0] - lo[0]) * (hi[1] - lo[1]);
    if (Math.abs(lin - v) > 0.0004) { bad++; console.log(tag, 'NONLIN', n, v, lin.toFixed(4)); }
    pv.sleep(110);
  });
  console.log(tag, 'off-node checked', tot, 'bad', bad);
}
run('PL', 150, T7, 'PL');
run('PM', 250, T8, 'PM');
