// 提取页面正文文字与完整 img URL
const fs = require('fs');
const path = require('path');
const file = process.argv[2];
const raw = fs.readFileSync(file, 'utf8');
let body = raw
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<!--[\s\S]*?-->/g, '');

// 完整 img src（处理引号内含空格的 URL）
const imgs = [];
const re = /<img\b[^>]*>/gi;
let m;
while ((m = re.exec(body)) !== null) {
  const tag = m[0];
  let src = '';
  let q = tag.match(/\bsrc\s*=\s*"([^"]*)"/i);
  if (!q) q = tag.match(/\bsrc\s*=\s*'([^']*)'/i);
  if (q) src = q[1];
  imgs.push({ pos: m.index, src });
}
console.log('--- IMGS ---');
imgs.forEach((im, i) => console.log(`IMG${i + 1} @${im.pos}: ${im.src}`));

// 正文文字（在 <body> 中），按块输出
const bodyMatch = body.match(/<body[^>]*>([\s\S]*)<\/body>/i);
let main = bodyMatch ? bodyMatch[1] : body;
// 去掉 header/nav/footer/评论/广告区域粗略：直接全文文字
let text = main
  .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/td|\/th)[^>]*>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (x, d) => String.fromCharCode(+d));
// 压缩空行
text = text.split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
console.log('\n--- TEXT ---');
console.log(text);
