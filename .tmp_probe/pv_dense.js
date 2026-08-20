/* Determine P1(n1) structure: stepwise / linear-interp / smooth formula */
var cp = require('child_process');
var P1 = function (bs, n1, de1) {
  var d = 'beltSize=' + bs + '&n1=' + n1 + '&de1=' + de1 + '&i=1';
  var cmd = "curl -s -X POST 'https://www.mechtool.cn/calculation/polyvP1Query' -d '" + d + "' -H 'X-Requested-With: XMLHttpRequest' --max-time 15";
  try { var o = JSON.parse(cp.execSync(cmd, { encoding: 'utf8', timeout: 20000 })); return o.flag ? o.resultData.p1 : null; }
  catch (e) { return null; }
};
var out = { PJ_de20: [], PJ_de300: [], PK_de300: [] };
function series(arr, bs, de, lo, hi, step) {
  for (var n = lo; n <= hi; n += step) { arr.push([n, P1(bs, n, de)]); }
  // wait, need to capture which array. handled by caller
}
(async function () {
  for (var n = 100; n <= 10000; n += 100) out.PJ_de20.push([n, P1('PJ', n, 20)]);
  for (var n = 100; n <= 10000; n += 100) out.PJ_de300.push([n, P1('PJ', n, 300)]);
  for (var n = 100; n <= 6000; n += 100) out.PK_de300.push([n, P1('PK', n, 300)]);
  // write compact
  var s = JSON.stringify(out);
  require('fs').writeFileSync('/workspace/.tmp_probe/pv_p1_dense.json', s);
  console.log('SAVED', s.length);
})();