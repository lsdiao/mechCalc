var cp = require('child_process');
function one(n) {
  var cmd = "curl -s -X POST 'https://www.mechtool.cn/calculation/polyvP1Query' -d 'beltSize=PJ&n1=" + n + "&de1=20&i=1' -H 'X-Requested-With: XMLHttpRequest' --max-time 25";
  var t0 = Date.now();
  var out = cp.execSync(cmd, { encoding: 'utf8' });
  return [n, Date.now() - t0, out.slice(0, 80)];
}
[200, 300, 400].forEach(function (n) { console.log(JSON.stringify(one(n))); });
// parallel test: 4 at once
var t0 = Date.now();
var procs = [500, 600, 700, 800].map(function (n) {
  var cmd = "curl -s -X POST 'https://www.mechtool.cn/calculation/polyvP1Query' -d 'beltSize=PJ&n1=" + n + "&de1=20&i=1' -H 'X-Requested-With: XMLHttpRequest' --max-time 25";
  return cp.exec(cmd, { encoding: 'utf8' }, function () {});
});
setTimeout(function () {
  console.log('4 parallel done in', Date.now() - t0, 'ms');
  procs.forEach(function (p) { try { p.kill(); } catch (e) {} });
}, 8000);
