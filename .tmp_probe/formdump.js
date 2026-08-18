var fs = require('fs');
var f = process.argv[2];
var s = fs.readFileSync(f, 'utf8');
(s.match(/<form[\s\S]*?<\/form>/g) || []).forEach(function (form, idx) {
  var id = (form.match(/id="([^"]+)"/) || [])[1];
  if (!id || /searchform/i.test(id)) return;
  console.log('--- FORM ' + id);
  (form.match(/<select[\s\S]*?<\/select>/g) || []).forEach(function (sel) {
    var nm = (sel.match(/name="([^"]+)"/) || [])[1];
    var opts = sel.match(/<option[^>]*>[^<]*/g) || [];
    var vals = opts.map(function (o) {
      var v = (o.match(/value="([^"]*)"/) || [])[1];
      if (v === undefined) v = (o.match(/>([^<]*)$/) || [])[1];
      return /selected/.test(o) ? '*' + v : v;
    });
    console.log('  SELECT ' + nm + ' : ' + vals.join(','));
  });
  (form.match(/<input[^>]*>/g) || []).forEach(function (inp) {
    var nm = (inp.match(/name="([^"]+)"/) || [])[1];
    if (!nm) return;
    var val = (inp.match(/value="([^"]*)"/) || [])[1];
    var tp = (inp.match(/type="([^"]+)"/) || [])[1] || 'text';
    if (tp === 'hidden' || tp === 'submit' || tp === 'button') return;
    console.log('  INPUT ' + nm + ' (' + tp + ') value=' + val);
  });
});
