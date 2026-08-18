// 补解码：闭包内嵌套别名调用对
const fs = require('fs');
const path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, 'camindexer.min.js'), 'utf8');
const head = SRC.slice(0, SRC.indexOf('$(function()'));
eval(head + '\n;global.__dec=_0x1e74;');

const pairs = [
  [0x103, 'Q*TH'], [0x160, 's7L8'], [0x107, 'DYh6'], [0x1a2, 'vuNk'],
  [0x115, ')dRB'], [0x15f, 'H](7'], [0x1ae, 'EDK['],
  [0x155, '(7Kf'], [0x109, 'qKYT'], [0x12f, '^l*O'], [0x195, ']qz!'],
  [0x181, 'bjZ['], [0x101, 'i8&W'],
  [0x1ab, 'lny4'], [0x15c, '7WjN'], [0x13e, '&@7Y'], [0x1aa, 'i8&W'],
  [0x199, 'SNUq'], [0x187, '@x8S'], [0x17b, 'souT'], [0x10a, 'qHDf'],
  [0x162, 'ea!#'], [0x122, 'Yq$)'], [0x18a, 'MAnK'], [0x137, 'HMc]'],
  [0x1a9, 'I2&['], [0x10f, 'I4Gn'], [0x19f, 'I4Gn'], [0x146, 'Je$U'],
  [0x18b, 'w*m%'], [0x17c, 'souT'],
  [0x153, 'souT'],            // $.???('cal/calculation_camindexer1', ...)
  [0xfc, 'I4Gn'],             // resp.??? &&
  [0x19a, 'rKng'],            // X+'ta' -> resultData?
  [0x15d, 'H](7'], [0x154, '*8KR'], [0x145, 'EDK['], [0x163, 'H](7'],
  [0x10d, ']qz!'], [0x141, 'qHDf'], [0x19e, 'KuNt'],
];
for (const [i, k] of pairs) {
  let v;
  try { v = JSON.stringify(global.__dec(i, k)); } catch (e) { v = 'FAIL ' + e.message; }
  console.log('0x' + i.toString(16), k, '=>', v);
}
