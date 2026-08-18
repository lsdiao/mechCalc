/* Verify kAlpha table vs sweep + probe KL for all belt types/lengths */
var pv = require('./pvlib.js');
var KA = [[180, 1], [177, .99], [174, .98], [171, .97], [169, .97], [166, .96], [163, .95], [160, .94], [157, .93], [154, .92], [151, .91], [148, .90], [145, .89], [142, .88], [139, .87], [136, .86], [133, .85], [130, .84], [127, .83], [125, .81], [120, .80], [117, .79], [113, .77], [110, .76], [106, .75], [103, .73], [99, .72], [95, .70], [91, .68], [87, .66], [83, .64]];
function r3(x) { return Math.round(x * 1000) / 1000; }
function kA(a1) {
  if (a1 >= 180) return 1;
  for (var i = 0; i < KA.length - 1; i++) {
    if (a1 <= KA[i][0] && a1 >= KA[i + 1][0]) {
      var t = (KA[i][0] - a1) / (KA[i][0] - KA[i + 1][0]);
      return r3(KA[i][1] - t * (KA[i][1] - KA[i + 1][1]));
    }
  }
  return 0.64;
}
var rows = JSON.parse(require('fs').readFileSync('/workspace/.tmp_probe/pv_alpha_sweep.json', 'utf8'));
var bad = 0, tot = 0;
rows.forEach(function (r) {
  if (r[1] === 'ERR') return;
  tot++;
  var e = kA(r[2]);
  if (Math.abs(e - r[3]) > 0.0005) { bad++; if (bad < 8) console.log('Kα MISMATCH', r[2], 'api=', r[3], 'calc=', e); }
});
console.log('kAlpha check: total', tot, 'bad', bad);
// Also verify a/alpha1/calBeltLen chain from polyv1: a = a0 + (Le-Le0)/2, alpha1 = 180-(de2-de1)/a*57.3
var DE = { PJ: 1.1, PK: 1.6, PL: 2, PM: 2.5 };
var PJLEN = [300, 330, 350, 375, 400, 425, 450, 475, 500, 560, 630, 710, 750, 800, 850, 900, 950, 1000, 1060, 1120, 1250, 1320, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2120, 2240, 2360, 2500];
function nearest(arr, x) { var b = null, bd = 1 / 0; for (var i = 0; i < arr.length; i++) { var d = Math.abs(arr[i] - x); if (d < bd) { bd = d; b = arr[i]; } } return b; }
var bad2 = 0;
rows.forEach(function (r) {
  if (r[1] === 'ERR') return;
  var a0 = r[0];
  var de1 = 20, de2 = 118;
  var le0 = 2 * a0 + Math.PI * (de1 + de2) / 2 + (de2 - de1) * (de2 - de1) / (4 * a0);
  var le = nearest(PJLEN, le0);
  var a = a0 + (le - le0) / 2;
  var al = 180 - (de2 - de1) / a * 57.3;
  var okA = Math.abs(a - r[1]) < 0.006, okL = Math.abs(le0 - r[6]) < 0.006, okAl = Math.abs(al - r[2]) < 0.006;
  if (!okA || !okL || !okAl) { bad2++; if (bad2 < 6) console.log('CHAIN diff', a0, JSON.stringify({ a: [r[1], a], le0: [r[6], le0], al: [r[2], al] })); }
});
console.log('chain check bad:', bad2);
