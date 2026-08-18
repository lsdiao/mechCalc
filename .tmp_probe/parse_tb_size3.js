// dump the 节线长 table (contains 91.44) fully
var fs = require('fs');
var s = fs.readFileSync('/workspace/.tmp_probe/tb_size.html', 'utf8');
function strip(h) { return h.replace(/<[^>]+>/g, '\u0001').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&'); }
var tables = s.match(/<table[\s\S]*?<\/table>/g) || [];
tables.forEach(function(t, i) {
  if (!/91\.44/.test(t)) return;
  var rows = t.match(/<tr[\s\S]*?<\/tr>/g) || [];
  console.log('==== LENGTH TABLE idx=' + i + ' rows=' + rows.length + ' ====');
  rows.forEach(function(r) {
    var cells = r.match(/<t[dh][\s\S]*?<\/t[dh]>/g) || [];
    var cs = cells.map(function(c) { return strip(c).replace(/\u0001/g, '').replace(/\s+/g, ' ').trim(); });
    console.log(cs.join(' | '));
  });
});
// first width row raw
var m = s.match(/<td>\s*12\s*<\/td>[\s\S]{0,400}?<\/tr>/);
console.log('RAW first width row:', m ? m[0].replace(/\s+/g, ' ') : 'not found');
