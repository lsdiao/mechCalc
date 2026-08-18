/* Fast parallel prober for mechtool polyv API (curl via proxy, retry) */
var cp = require('child_process');
var fs = require('fs');

function postOne(ep, params) {
  var d = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
  var cmd = "curl -s -X POST 'https://www.mechtool.cn/calculation/" + ep + "' -d '" + d + "' -H 'X-Requested-With: XMLHttpRequest' --max-time 15";
  try {
    var out = cp.execSync(cmd, { encoding: 'utf8', timeout: 20000 });
    if (!out || out.indexOf('flag') < 0) return null;
    return JSON.parse(out);
  } catch (e) { return null; }
}

function postRetry(ep, params, tries) {
  tries = tries || 8;
  for (var i = 0; i < tries; i++) {
    var r = postOne(ep, params);
    if (r) return r;
  }
  return { flag: false, dead: true };
}

/* tasks: [{ep, params, key}]  -> results {key: resultData or {ERR}} */
function runAll(tasks, conc, cb) {
  conc = conc || 8;
  var results = {};
  var idx = 0, done = 0, errs = 0;
  var t0 = Date.now();
  function next() {
    if (idx >= tasks.length) { if (done >= tasks.length) cb(results); return; }
    var t = tasks[idx++];
    postRetry(t.ep, t.params, 8);
    done++;
  }
  // re-implement with actual result capture
  results = {}; idx = 0; done = 0;
  var workers = [];
  for (var w = 0; w < conc; w++) workers.push(step());
  function step() {
    if (idx >= tasks.length) return Promise.resolve();
    var t = tasks[idx++];
    return new Promise(function (res) {
      setImmediate(function () {
        var r = postRetry(t.ep, t.params, 8);
        if (r.flag) results[t.key] = r.resultData;
        else { results[t.key] = { ERR: 1 }; errs++; }
        done++;
        if (done % 200 === 0) {
          var dt = (Date.now() - t0) / 1000;
          console.error('  ' + done + '/' + tasks.length + ' errs=' + errs + ' ' + dt.toFixed(1) + 's ' + (done / dt).toFixed(1) + '/s');
          fs.writeFileSync('/workspace/.tmp_probe/_pvfast_progress.json', JSON.stringify({ done: done, total: tasks.length, errs: errs }));
        }
        res();
      });
    }).then(step);
  }
  Promise.all(workers).then(function () {
    var dt = (Date.now() - t0) / 1000;
    console.error('DONE ' + tasks.length + ' errs=' + errs + ' in ' + dt.toFixed(1) + 's');
    cb(results);
  });
}

module.exports = { post: postRetry, runAll: runAll };
