var fs = require('fs');
var T6 = JSON.parse(fs.readFileSync('/workspace/.tmp_probe/pv1992_T6.json', 'utf8'));
console.log('T6 rows:');
T6.forEach(function (r, i) { console.log(i, JSON.stringify(r).slice(0, 220)); });
