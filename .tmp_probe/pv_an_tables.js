var s = require('fs').readFileSync('/workspace/.tmp_probe/poly1992.html', 'utf8');
var m = s.match(/<table[\s\S]*?<\/table>/g) || [];
function rows(t) {
  return (t.match(/<tr[\s\S]*?<\/tr>/g) || []).map(function (r) {
    return (r.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g) || []).map(function (c) {
      return c.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    });
  });
}
fs = require('fs');
m.forEach(function (t, i) {
  var R = rows(t);
  fs.writeFileSync('/workspace/.tmp_probe/pv1992_T' + i + '.json', JSON.stringify(R, null, 1));
  console.log('T' + i, 'rows=' + R.length, 'cols0=' + (R[0] || []).length);
});
// print T3 (Kalpha) and T4 (KL) fully
console.log('=== T3 Kα ==='); rows(m[3]).forEach(function (r) { console.log(r.join(' | ')); });
console.log('=== T4 KL ==='); rows(m[4]).forEach(function (r) { console.log(r.join(' | ')); });
