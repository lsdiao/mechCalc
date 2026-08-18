// 解码 obfuscator.io 混淆：提取 shuffle IIFE + 字符串数组函数 + 解码器，执行后批量还原调用
const fs = require('fs');
const src = fs.readFileSync('/workspace/.tmp_probe/wormandwormwheeldrive.min.js', 'utf8');

// 1. 提取三块代码
const shuffleM = src.match(/\(function\(_0x2016ca,_0x408a7f\)\{[\s\S]*?\}\(_0x4c86,0x2907a\)\);/);
const arrFnM = src.match(/function _0x4c86\(\)\{[\s\S]*?return _0x4c86\(\);[\s\S]*?\}/);
const dStart = src.indexOf('function _0x55de(');
const dEnd = src.indexOf('_0x55de40;}', dStart) + '_0x55de40;}'.length;
const decFnM = [src.slice(dStart, dEnd)];
if (!shuffleM || !arrFnM || !decFnM) { console.error('extract fail', !!shuffleM, !!arrFnM, !!decFnM); process.exit(1); }

const sandbox = {};
require('vm').createContext(sandbox);
require('vm').runInContext(arrFnM[0] + '\n' + decFnM[0] + '\n' + shuffleM[0], sandbox);

const decode = sandbox._0x55de;
// 数组长度
const arr = sandbox._0x4c86();
console.error('array len:', arr.length);

// 2. 批量替换源码中的 _0xXXXX(0xNNN,'key')
let out = src.replace(/_0x[0-9a-f]{4,8}\((0x[0-9a-f]+),'((?:[^'\\]|\\.)*)'\)/g, (m, idx, key) => {
  try {
    const v = decode(parseInt(idx, 16), key);
    return JSON.stringify(v);
  } catch (e) { return m; }
});
fs.writeFileSync('/workspace/.tmp_probe/worm_drive.decoded.js', out);
console.error('decoded written');

// 3. 也输出索引->字符串的完整映射（尝试用已知 key 集合）
const keySet = new Set();
for (const m of src.matchAll(/'([A-Za-z0-9!$%^&*(){}\[\]@#~?<>|;:,\-_+=\\.\/]{2,6})'\)/g)) keySet.add(m[1]);
console.error('keys:', [...keySet].join(' '));
