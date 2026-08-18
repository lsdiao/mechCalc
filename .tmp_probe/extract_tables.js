// 提取 mechtool HTML 中所有表格数据
const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2);

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&plusmn;/g, '±')
    .replace(/&le;/g, '≤')
    .replace(/&ge;/g, '≥')
    .replace(/&ne;/g, '≠')
    .replace(/&deg;/g, '°')
    .replace(/&mu;/g, 'μ')
    .replace(/&pi;/g, 'π')
    .replace(/&alpha;/g, 'α')
    .replace(/&beta;/g, 'β')
    .replace(/&delta;/g, 'δ')
    .replace(/&sigma;/g, 'σ')
    .replace(/&omega;/g, 'ω')
    .replace(/&theta;/g, 'θ')
    .replace(/&lambda;/g, 'λ')
    .replace(/&sub([0-9]+)/g, '$1')
    .replace(/&sup([0-9]+)/g, '^$1')
    .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
}

function getInnerText(html) {
  // <br> 转换行，去标签
  let s = html.replace(/<br\s*\/?>/gi, ' ');
  s = s.replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  return s.replace(/\s+/g, ' ').trim();
}

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  // 去 script/style/head 注释
  let body = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  console.log('\n' + '='.repeat(100));
  console.log('FILE: ' + path.basename(file));
  console.log('='.repeat(100));

  // ---- 找出所有 <img>（可能为图片形式的表）----
  const imgs = [];
  const imgRe = /<img\b[^>]*>/gi;
  let m;
  while ((m = imgRe.exec(body)) !== null) {
    const tag = m[0];
    let src = (tag.match(/\bsrc\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || '';
    let alt = (tag.match(/\balt\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
    // img 前的文字
    const before = body.slice(Math.max(0, m.index - 400), m.index);
    const beforeText = getInnerText(before);
    imgs.push({ src, alt, beforeText: beforeText.slice(-120) });
  }

  // ---- 解析所有 <table> ----
  const tables = [];
  const tableRe = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let tm;
  while ((tm = tableRe.exec(body)) !== null) {
    const tableHtml = tm[0];
    const startIdx = tm.index;

    // 标题：表前的文字（向前找最近的文本），也包含 table 内部的 caption
    const beforeChunk = body.slice(Math.max(0, startIdx - 1200), startIdx);
    // 去掉可能嵌套的前一个 table 尾部
    const beforeText = getInnerText(beforeChunk);

    // caption
    const capMatch = tableHtml.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i);
    const caption = capMatch ? getInnerText(capMatch[1]) : '';

    // 行
    const rows = [];
    const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let trm;
    while ((trm = trRe.exec(tableHtml)) !== null) {
      const trHtml = trm[1];
      const cells = [];
      const cellRe = /<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi;
      let cm;
      while ((cm = cellRe.exec(trHtml)) !== null) {
        let cellText = getInnerText(cm[2]);
        // 检测单元格内是否有 img
        if (/<img\b/i.test(cm[2])) {
          const isrc = (cm[2].match(/\bsrc\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || '';
          cellText = (cellText ? cellText + ' ' : '') + '[图:' + path.basename(isrc) + ']';
        }
        cells.push(cellText);
      }
      if (cells.length > 0) rows.push(cells);
    }

    tables.push({
      index: tables.length + 1,
      pos: startIdx,
      beforeText,
      caption,
      rows,
      htmlLen: tableHtml.length,
    });
  }

  // ---- 输出 ----
  console.log('\n>>> 共找到 ' + tables.length + ' 个 <table>，' + imgs.length + ' 个 <img>');
  console.log('\n--- IMG 清单（可能是图片形式的表/公式）---');
  imgs.forEach((im, i) => {
    console.log(`IMG${i + 1}: ${path.basename(im.src)} | alt="${im.alt}" | 前文:${im.beforeText}`);
  });

  tables.forEach((t) => {
    console.log('\n' + '#'.repeat(90));
    console.log(`TABLE ${t.index}  (行数=${t.rows.length}, 位置=${t.pos})`);
    console.log(`CAPTION: ${t.caption || '(无)'}`);
    console.log(`BEFORE_TEXT(末尾300字): …${t.beforeText.slice(-300)}`);
    console.log('#'.repeat(90));
    t.rows.forEach((r, ri) => {
      console.log(`R${ri + 1}: ${r.join(' | ')}`);
    });
  });
}
