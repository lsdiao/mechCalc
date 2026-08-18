// 提取 HTML 中的表单字段（id/label/单位/默认值）与内嵌表格
const fs = require('fs');
const file = process.argv[2];
const html = fs.readFileSync(file, 'utf8');

// 1. 提取所有 input/select
const inputs = [...html.matchAll(/<(input|select)\b[^>]*>/g)].map(m => m[0]);
for (const tag of inputs) {
  const id = (tag.match(/id="([^"]*)"/) || [])[1] || '';
  const name = (tag.match(/name="([^"]*)"/) || [])[1] || '';
  const val = (tag.match(/value="([^"]*)"/) || [])[1] || '';
  const type = (tag.match(/type="([^"]*)"/) || [])[1] || '';
  if (/google|ads|search|twikoo|comment/i.test(id + name)) continue;
  console.log(`[${m0type(tag)}] id=${id} name=${name} type=${type} value=${val} :: ${tag.slice(0, 150).replace(/\s+/g, ' ')}`);
}
function m0type(t) { return t.startsWith('<input') ? 'INPUT' : 'SELECT'; }
console.log('\n===== LABELS（id 前后文） =====');
// 提取 label 文本与 for
const labels = [...html.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/g)].map(m => m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
console.log(labels.filter(l => l).join(' | '));
