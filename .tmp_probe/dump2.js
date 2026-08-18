var fs = require('fs');
var s = fs.readFileSync(process.argv[2], 'utf8');
// 去掉 script，只看正文
var body = s.replace(/<script[\s\S]*?<\/script>/g, '');
(body.match(/<select[\s\S]*?<\/select>/g) || []).forEach(function (sel) {
  var nm = (sel.match(/id="([^"]+)"/) || [])[1] || (sel.match(/name="([^"]+)"/) || [])[1];
  var opts = sel.match(/<option[^>]*>[^<]*/g) || [];
  var vals = opts.map(function (o) {
    var v = (o.match(/value="([^"]*)"/) || [])[1];
    if (v === undefined) v = '';
    return /selected/.test(o) ? '*' + v : v;
  });
  console.log('SELECT ' + nm + ' : ' + vals.join(','));
});
(body.match(/<input[^>]*>/g) || []).forEach(function (inp) {
  var id = (inp.match(/id="([^"]+)"/) || [])[1];
  var tp = (inp.match(/type="([^"]+)"/) || [])[1] || 'text';
  if (!id || tp === 'hidden' || tp === 'submit' || tp === 'button' || /search/.test(id)) return;
  var val = (inp.match(/value="([^"]*)"/) || [])[1] || '';
  console.log('INPUT ' + id + ' (' + tp + ') value=' + val);
});
