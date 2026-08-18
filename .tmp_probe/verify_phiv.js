// Verify phiV table model against all sweep data
var fs = require('fs');
var D = Math.PI / 180;
function atanDeg(f) { return Math.atan(f) / D; }
function r3(x) { return Math.round(x * 1000) / 1000; }

// node tables: [vS, f]
var T = {
  xc45: [[0.01,0.110],[0.05,0.090],[0.10,0.080],[0.25,0.065],[0.50,0.055],[1.0,0.045],[1.5,0.040],[2.0,0.035],[2.5,0.030],[3.0,0.028],[4.0,0.024],[5.0,0.022],[8.0,0.018],[10,0.016],[15,0.014],[24,0.013]],
  xc45l: [[0.01,0.120],[0.05,0.100],[0.10,0.090],[0.25,0.075],[0.50,0.065],[1.0,0.055],[1.5,0.050],[2.0,0.045],[2.5,0.040],[3.0,0.035],[4.0,0.031],[5.0,0.029],[8.0,0.026],[10,0.024],[15,0.020]],
  lqt: [[0.01,0.180],[0.05,0.140],[0.10,0.130],[0.25,0.100],[0.50,0.090],[1.0,0.070],[1.5,0.065],[2.0,0.055],[2.5,0.050],[3.0,0.045],[4.0,0.040],[5.0,0.035],[8.0,0.030]],
  htz45l: [[0.01,0.190],[0.05,0.160],[0.10,0.140],[0.25,0.120],[0.50,0.100],[1.0,0.090],[1.5,0.080],[2.0,0.070],[2.5,0.060],[3.0,0.055],[4.0,0.050],[5.0,0.045]]
};
var MAP = { xc45:'xc45', xc45l:'xc45l', lqt:'lqt', htz45:'lqt', htz45l:'htz45l', lqt45l:'lqt' };
var FILES = { 'phiv_xc_45.txt':'xc45', 'phiv_xc_45less.txt':'xc45l', 'phiv_lqt_45.txt':'lqt', 'phiv_lqt_45less.txt':'lqt45l', 'phiv_htz_45.txt':'htz45', 'phiv_htz_45less.txt':'htz45l' };

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

var fails = 0, total = 0;
Object.keys(FILES).forEach(function (fn) {
  var txt = fs.readFileSync('/workspace/.tmp_probe/' + fn, 'utf8');
  txt.split('\n').forEach(function (line) {
    var m = line.match(/vS_req=([\d.]+).*?(?:"phiV":([\d.]+),"efficiency":([\d.]+),"vS":([\d.]+)|"flag":false|"y1" is null)/);
    if (!m) return;
    total++;
    var vsReq = +m[1], tbl = T[MAP[FILES[fn]]];
    if (!m[2]) { console.log(fn + ' vS=' + vsReq + ' => no-result (flag:false or NPE)'); return; }
    var f = interp(tbl, vsReq);
    if (f === null) { console.log(fn + ' vS=' + vsReq + ' OUT-OF-TABLE but API returned ' + m[2]); fails++; return; }
    var pv = r3(atanDeg(f));
    var g = 10; // sweep used gama=10
    var eta = r3(0.95 * Math.tan(g * D) / Math.tan((g + pv) * D));
    var ok1 = pv === +m[2], ok2 = eta === +m[3];
    if (!ok1 || !ok2) { console.log(fn + ' vS=' + vsReq + ' phiV calc=' + pv + ' api=' + m[2] + (ok1 ? '' : ' <<PHIV FAIL') + ' eta calc=' + eta + ' api=' + m[3] + (ok2 ? '' : ' <<ETA FAIL')); fails++; }
  });
});
console.log('total=' + total + ' fails=' + fails);
