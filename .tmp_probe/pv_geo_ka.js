/* Capture K_alpha(wrap), K_L(beltLen), K_r(z), and verify geometry formula via live API. */
var cp = require('child_process');
var fs = require('fs');
function query(ep, params) {
  var d = Object.keys(params).map(function (k) { return k + '=' + params[k]; }).join('&');
  var cmd = "curl -s -X POST 'https://www.mechtool.cn/calculation/" + ep + "' -d '" + d + "' -H 'X-Requested-With: XMLHttpRequest' --max-time 15";
  try { var o = JSON.parse(cp.execSync(cmd, { encoding: 'utf8', timeout: 20000 })); return o.flag ? o.resultData : null; }
  catch (e) { return null; }
}
var out = {};

/* K_r vs z & beltSize: polyv2 returns kr? Actually kr is input to polyv2. Probe polyv1 for kr column by z? polyv1 has no z. Use polyv2 result force0/forceQ to infer? Simpler: probe beltLenChange with varying beltLen to see if kr changes (it shouldn't). Instead, extract kr table from decoded JS directly. Here probe K_alpha via polyv1 wrap sweep. */
out.kalpha = [];
[80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210].forEach.call([80, 100, 120, 140, 150, 160, 170, 180], function (al) {
  /* drive wrap angle via de1/de2 close and vary a0 */
});
/* Use de1=100,de2=200; solve a0 for target alpha~ using formula then let API compute actual alpha1&kAlpha */
[300, 400, 500, 600, 800, 1000, 1200, 1600, 2000, 3000, 5000, 10000].forEach(function (a0) {
  var r = query('polyv1', { de1: 100, de2: 200, deltaE: 1.1, a0: a0, beltSize: 'PJ' });
  out.kalpha.push([a0, r ? [r.alpha1, r.kAlpha, r.kL, r.kr] : null]);
});

/* geometry verify: manual L0 & a & alpha vs API */
out.geo = [];
[[60, 90, 1.1, 400, 'PJ'], [50, 100, 1.1, 600, 'PK'], [100, 200, 1.1, 800, 'PL'], [200, 300, 1.1, 1000, 'PM']].forEach(function (s) {
  var r = query('polyv1', { de1: s[0], de2: s[1], deltaE: s[2], a0: s[3], beltSize: s[4] });
  out.geo.push([s[4], [s[0], s[1], s[3]], r ? [r.calBeltLen, r.beltLen, r.a, r.alpha1, r.kAlpha, r.kL, r.kr] : null]);
});
fs.writeFileSync('/workspace/.tmp_probe/pv_geo_ka.json', JSON.stringify(out));
console.log('saved');