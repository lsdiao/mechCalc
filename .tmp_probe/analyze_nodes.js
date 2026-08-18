/* Analyze fine scan data -> n1 node candidates per belt; verify PJ breakpoints subset of T6 rows */
var fs = require('fs');
function bps(rows, tol) {
  var out = [];
  for (var i = 1; i < rows.length - 1; i++) {
    if (rows[i][1] === null || rows[i - 1][1] === null || rows[i + 1][1] === null) continue;
    var s1 = (rows[i][1] - rows[i - 1][1]) / (rows[i][0] - rows[i - 1][0]);
    var s2 = (rows[i + 1][1] - rows[i][1]) / (rows[i + 1][0] - rows[i][0]);
    if (Math.abs(s2 - s1) > (tol || 1e-7)) out.push([rows[i][0], +(s1 * 1e4).toFixed(4), +(s2 * 1e4).toFixed(4)]);
  }
  return out;
}
var T6rows = [200,300,400,500,600,700,800,900,950,1000,1100,1160,1200,1300,1400,1425,1500,1600,1700,1800,1900,2000,2200,2400,2600,2850,3000,3200,3400,3600,4000,5000,6000,7000,8000,9000,10000];
var T7rows = [100,200,300,400,500,540,575,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200,2300,2400,2600,2800,2900,3000,3500,4000,4500,5000];
var T8rows = [100,200,300,400,500,540,575,600,675,700,800,870,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000,2200,2400,2600,2800,2900,3000,3400,3800];

// PJ: pv_n1nodes.json (de150, 1000-1600 s10, 1620-4200 s20)
var pj = JSON.parse(fs.readFileSync('/workspace/.tmp_probe/pv_n1nodes.json', 'utf8'));
var pjBps = bps(pj, 4e-8);
console.log('PJ(de150) breakpoints 1000-4200:', JSON.stringify(pjBps));
var notInT6 = pjBps.filter(function (b) { return T6rows.indexOf(b[0]) < 0; });
console.log('PJ bps NOT in T6 rows:', JSON.stringify(notInT6));

// PK: fine_pk.json (de100, 200-6800 s20)
var pk = JSON.parse(fs.readFileSync('/workspace/.tmp_probe/fine_pk.json', 'utf8'));
var pkBps = bps(pk, 4e-8);
console.log('PK(de100) breakpoints 200-6800:', JSON.stringify(pkBps));

// PL: fine_pl.json (de150, 2400-5000 s10)
var pl = JSON.parse(fs.readFileSync('/workspace/.tmp_probe/fine_pl.json', 'utf8'));
var plBps = bps(pl, 4e-8);
console.log('PL(de150) breakpoints 2400-5000:', JSON.stringify(plBps));
console.log('PL bps NOT in T7 rows:', JSON.stringify(plBps.filter(function (b) { return T7rows.indexOf(b[0]) < 0; })));

// PM: fine_pm.json (de250, 1900-2900 s10)
var pm = JSON.parse(fs.readFileSync('/workspace/.tmp_probe/fine_pm.json', 'utf8'));
var pmBps = bps(pm, 4e-8);
console.log('PM(de250) breakpoints 1900-2900:', JSON.stringify(pmBps));
console.log('PM bps NOT in T8 rows:', JSON.stringify(pmBps.filter(function (b) { return T8rows.indexOf(b[0]) < 0; })));
