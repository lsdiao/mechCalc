// 去混淆 camindexer.min.js：执行字符串数组+RC4/base64 解码器，替换源码中所有 _0x1e74 别名调用为明文
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, 'camindexer.min.js'), 'utf8');

const cutPos = SRC.indexOf('$(function()');
const head = SRC.slice(0, cutPos);
const wrapped = head + '\n;global.__dec = _0x1e74; global.__curve = camCurveValueQuery;';
eval(wrapped);

const aliasSet = new Set(['_0x1e74']);
const aliasRe = /([A-Za-z_$][\w$]*)\s*=\s*_0x1e74\b/g;
let m;
while ((m = aliasRe.exec(SRC))) aliasSet.add(m[1]);

const aliasAlt = [...aliasSet].map(a => a.replace(/\$/g, '\\$')).join('|');
const calls = SRC.match(new RegExp('(?:' + aliasAlt + ')\\(0x[0-9a-fA-F]+,\'[^\']*\'\\)', 'g')) || [];
console.log('decoder call sites found:', calls.length);

let out = SRC;
const seen = new Map();
for (const c of calls) {
  const mm = c.match(/^(.*?)\(0x([0-9a-fA-F]+),'([^']*)'\)$/);
  if (!mm) continue;
  const idx = parseInt(mm[2], 16);
  let plain;
  try { plain = global.__dec(idx, mm[3]); } catch (e) { plain = '<DECODE_FAIL>'; }
  out = out.split(c).join(JSON.stringify(plain));
  const k = mm[2] + '|' + mm[3];
  if (!seen.has(k)) seen.set(k, plain);
}
fs.writeFileSync(path.join(__dirname, 'camindexer.deob.js'), out);
console.log('written camindexer.deob.js');

const sorted = [...seen.entries()].sort((a, b) => parseInt(a[0].split('|')[0], 16) - parseInt(b[0].split('|')[0], 16));
for (const [k, v] of sorted) console.log('0x' + k.split('|')[0], 'key=' + k.split('|')[1], '=>', JSON.stringify(v));

console.log('\n--- camCurveValueQuery 执行结果 ---');
for (const name of ['变形梯形曲线(M.T)', '变形正弦曲线(M.S)', '变形等速曲线(M.C.V)', '三共变形正弦(SMS-3)', '三共变形等速(SMCV-3)', '未知曲线XX']) {
  const r = global.__curve(name);
  console.log(name, '=> am=' + r.get('am'), 'vm=' + r.get('vm'), 'qm=' + r.get('qm'));
}
