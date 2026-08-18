// Determine exact phiV->eta computation rule against ALL sweep data
var fs = require('fs');
var D = Math.PI / 180;
function r3(x) { return Math.round(x * 1000) / 1000; }

var T = {
  xc45: [[0.01,0.110],[0.05,0.090],[0.10,0.080],[0.25,0.065],[0.50,0.055],[1.0,0.045],[1.5,0.040],[2.0,0.035],[2.5,0.030],[3.0,0.028],[4.0,0.024],[5.0,0.022],[8.0,0.018],[10,0.016],[15,0.014],[24,0.013]],
  xc45l: [[0.01,0.120],[0.05,0.100],[0.10,0.090],[0.25,0.075],[0.50,0.065],[1.0,0.055],[1.5,0.050],[2.0,0.045],[2.5,0.040],[3.0,0.035],[4.0,0.031],[5.0,0.029],[8.0,0.026],[10,0.024],[15,0.020]],
  lqt: [[0.01,0.180],[0.05,0.140],[0.10,0.130],[0.25,0.100],[0.50,0.090],[1.0,0.070],[1.5,0.065],[2.0,0.055],[2.5,0.050],[3.0,0.045],[4.0,0.040],[5.0,0.035],[8.0,0.030]],
  htz45l: [[0.01,0.190],[0.05,0.160],[0.10,0.140],[0.25,0.120],[0.50,0.100],[1.0,0.090],[1.5,0.080],[2.0,0.070],[2.5,0.060],[3.0,0.055],[4.0,0.050],[5.0,0.045]]
};
var MAP = { 'phiv_xc_45.txt':'xc45', 'phiv_xc_45less.txt':'xc45l', 'phiv_lqt_45.txt':'lqt', 'phiv_lqt_45less.txt':'lqt', 'phiv_htz_45.txt':'lqt', 'phiv_htz_45less.txt':'htz45l' };

function interp(tbl, x) {
  if (x < tbl[0][0] || x > tbl[tbl.length - 1][0]) return null;
  for (var i = 0; i < tbl.length - 1; i++) {
    if (x >= tbl[i][0] && x <= tbl[i + 1][0]) {
      var t = (x - tbl[i][0]) / (tbl[i + 1][0] - tbl[i][0]);
      return tbl[i][1] + t * (tbl[i + 1][1] - tbl[i][1]);
    }
  }
  return null;
}

var counts = { A: 0, B: 0, C: 0, D: 0, total: 0 };
Object.keys(MAP).forEach(function (fn) {
  var txt = fs.readFileSync('/workspace/.tmp_probe/' + fn, 'utf8');
  txt.split('\n').forEach(function (line) {
    var m = line.match(/vS_req=([\d.]+) n1=([\d.]+).*?"phiV":([\d.]+),"efficiency":([\d.]+),"vS":([\d.]+)/);
    if (!m) return;
    var vsReq = +m[1], n1 = +m[2], apiPv = +m[3], apiEta = +m[4], apiVs = +m[5];
    var tbl = T[MAP[fn]];
    // recompute vS exactly from n1 to mirror server
    var g = 10;
    var vSfromN1 = Math.PI * 100 * n1 / (60000 * Math.cos(g * D));
    var f1 = interp(tbl, vsReq);
    var f2 = interp(tbl, vSfromN1);
    if (f1 === null || f2 === null) return;
    counts.total++;
    var pvA = Math.atan(f2) / D;            // true degrees
    var pvB = Math.atan(f2) * 57.3;          // x57.3
    var pvC = r3(pvA);
    var pvD = r3(pvB);
    var eA = r3(0.95 * Math.tan(g * D) / Math.tan((g + pvA) * D));
    var eB = r3(0.95 * Math.tan(g * D) / Math.tan((g + pvB) * D));
    var eC = r3(0.95 * Math.tan(g * D) / Math.tan((g + pvC) * D));
    var eD = r3(0.95 * Math.tan(g * D) / Math.tan((g + pvD) * D));
    if (eA === apiEta) counts.A++;
    if (eB === apiEta) counts.B++;
    if (eC === apiEta) counts.C++;
    if (eD === apiEta) counts.D++;
    if (eA !== apiEta || eB !== apiEta) {
      console.log(fn + ' vsReq=' + vsReq + ' vS_n1=' + vSfromN1 + ' pvA=' + pvA + ' pvB=' + pvB + ' api_pv=' + apiPv + ' eA=' + eA + ' eB=' + eB + ' eC=' + eC + ' eD=' + eD + ' api_eta=' + apiEta);
    }
  });
});
console.log(JSON.stringify(counts));
