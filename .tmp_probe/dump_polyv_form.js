var s = require('fs').readFileSync('/workspace/.tmp_probe/polyvbeltdesign.html', 'utf8');
var m = s.match(/<form[\s\S]*?<\/form>/g) || [];
console.log('forms:', m.length);
m.forEach(function (f) {
  if (/searchform/.test(f)) return;
  (f.match(/<select[\s\S]*?<\/select>/g) || []).forEach(function (sel) {
    var id = (sel.match(/id="([^"]+)"/) || [])[1];
    console.log('SELECT id=' + id);
    var opts = sel.match(/<option[^>]*>[^<]*<\/option>/g) || [];
    console.log('  opts(' + opts.length + '): ' + opts.slice(0, 12).join(' ').replace(/\s+/g, ' '));
    if (opts.length > 12) console.log('  ... total ' + opts.length);
  });
  (f.match(/<input[^>]*>/g) || []).forEach(function (inp) {
    var id = (inp.match(/id="([^"]+)"/) || [])[1];
    var nm = (inp.match(/name="([^"]+)"/) || [])[1];
    var vl = (inp.match(/value="([^"]*)"/) || [])[1];
    var tp = (inp.match(/type="([^"]*)"/) || [])[1];
    if (id || nm) console.log('INPUT id=' + id + ' name=' + nm + ' type=' + tp + ' value=' + vl);
  });
});
// labels for inputs
var lab = s.match(/<label[^>]*>[\s\S]*?<\/label>/g) || [];
console.log('--- labels with for= ---');
lab.forEach(function (l) {
  var fr = (l.match(/for="([^"]+)"/) || [])[1];
  if (fr && /pv_|^power$|^n1$|^n2$|transmission/.test(fr)) console.log(fr, '=>', l.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
});
