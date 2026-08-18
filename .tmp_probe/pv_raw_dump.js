var pv = require('./pvlib.js');
function dump(tag, ep, params) {
  var r = pv.post(ep, params);
  console.log(tag, JSON.stringify(r).slice(0, 400));
  pv.sleep(200);
}
dump('PJ d150 i1', 'polyvP1Query', { beltSize: 'PJ', n1: 1460, de1: 150, i: 1 });
dump('PJ d150 i1.2', 'polyvP1Query', { beltSize: 'PJ', n1: 1460, de1: 150, i: 1.2 });
dump('PJ d160 i1.2', 'polyvP1Query', { beltSize: 'PJ', n1: 1460, de1: 160, i: 1.2 });
dump('PK d45 i1.2', 'polyvP1Query', { beltSize: 'PK', n1: 1460, de1: 45, i: 1.2 });
dump('PK d47.5 i1.2', 'polyvP1Query', { beltSize: 'PK', n1: 1460, de1: 47.5, i: 1.2 });
dump('PK d300 i1', 'polyvP1Query', { beltSize: 'PK', n1: 1460, de1: 300, i: 1 });
dump('PK d300 i1.2', 'polyvP1Query', { beltSize: 'PK', n1: 1460, de1: 300, i: 1.2 });
dump('PK d150 i1.2', 'polyvP1Query', { beltSize: 'PK', n1: 1460, de1: 150, i: 1.2 });
dump('PK polyv1', 'polyv1', { de1: 45, de2: 90, deltaE: 1.1, a0: 300, beltSize: 'PK' });
dump('PJ polyv1', 'polyv1', { de1: 20, de2: 40, deltaE: 1.1, a0: 300, beltSize: 'PJ' });
