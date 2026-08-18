// 反混淆 beltdrivedesign.min.js（独立命名避免并行会话冲突）
const fs = require('fs');
const SRC = '/workspace/.tmp_probe/beltdrivedesign.min.js';
const OUT = '/workspace/.tmp_probe/belt.decoded.x9.js';
const src = fs.readFileSync(SRC, 'utf8');

function extractFn(name) {
  const idx = src.indexOf('function ' + name + '(');
  if (idx < 0) throw new Error('not found ' + name);
  let i = src.indexOf('{', idx), depth = 0, j = i, inStr = null;
  for (; j < src.length; j++) {
    const c = src[j];
    if (inStr) { if (c === '\\') { j++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === "'" || c === '"') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(idx, j + 1);
}
const arrFn = extractFn('_0x1bd7');
const decFn = extractFn('_0x2fcd');
let shuffle = '';
{
  const start = src.indexOf('(function(');
  let depth = 0, j = start, inStr = null;
  for (j = start; j < src.length; j++) {
    const c = src[j];
    if (inStr) { if (c === '\\') { j++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === "'" || c === '"') { inStr = c; continue; }
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) break; }
  }
  shuffle = src.slice(start, j + 1);
}
const vm = require('vm');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(arrFn + '\n' + decFn + '\n' + shuffle + '\n', ctx);
const decode = (a, b) => vm.runInContext('_0x2fcd(' + a + (b !== undefined ? ',' + JSON.stringify(b) : '') + ')', ctx);

// 别名链解析：X = Y（Y 也是 _0x 开头）
const aliasDefs = {};
for (const m of src.matchAll(/(_0x[0-9a-f]+)\s*=\s*(_0x[0-9a-f]+)\s*(?=[,;)(])/g)) aliasDefs[m[1]] = m[2];
function resolve(n) { const seen = new Set(); while (aliasDefs[n] && !seen.has(n)) { seen.add(n); n = aliasDefs[n]; } return n; }
const aliasSet = new Set(['_0x2fcd']);
for (const k of Object.keys(aliasDefs)) if (resolve(k) === '_0x2fcd') aliasSet.add(k);
const aliases = [...aliasSet].join('|');
console.log('aliases:', aliasSet.size);

let count = 0, fail = 0;
let out = src.replace(new RegExp('(' + aliases + ')\\((0x[0-9a-fA-F]+)\\s*,\\s*(\'(?:[^\'\\\\]|\\\\.)*\'|"(?:[^"\\\\]|\\\\.)*")\\)', 'g'),
  (m, fn, num, key) => {
    try { const v = decode(num, eval(key)); count++; return JSON.stringify(v); }
    catch (e) { fail++; return m; }
  });
out = out.replace(new RegExp('(' + aliases + ')\\((0x[0-9a-fA-F]+)\\)', 'g'),
  (m, fn, num) => {
    try { const v = decode(num); count++; return JSON.stringify(v); }
    catch (e) { fail++; return m; }
  });
console.log('replaced:', count, 'failed:', fail);
fs.writeFileSync(OUT, out);
console.log('written', OUT, out.length);
// 剩余检查
const rem = [...out.matchAll(/(_0x[0-9a-f]+)\((0x[0-9a-fA-F]+)\s*,/g)].length;
console.log('remaining alias-style calls:', rem);
