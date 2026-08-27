/* =========================================================
 * 轴承型号补全/合并脚本
 * - 对 44 个分类全量重抓（带重试），与已有 seed 合并去重
 * - 每个分类抓完打印该分类条数与参考站期望总数的比较
 * 运行：node tools/scrape_bearings_fill.js
 * ========================================================= */
'use strict';

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONCURRENCY = Number(process.env.BK_CONC || 4);
const GAP_MS = Number(process.env.BK_GAP || 70);
const OUT = path.join(__dirname, '..', 'data', 'bearings_seed.json');
const BASE = 'https://c.zcwz.com/param';

const CLASSIDS = [];
for (let i = 1; i <= 43; i++) CLASSIDS.push(i);
CLASSIDS.push(44);

function fetchHTML(url, tries) {
  if (tries === undefined) tries = 0;
  return new Promise((res) => {
    execFile('curl', ['-s', '-m', '25', url], { maxBuffer: 8 * 1024 * 1024 }, (err, stdout) => {
      if (!err && stdout) return res(stdout);
      if (tries < 4) setTimeout(() => res(fetchHTML(url, tries + 1)), 400 * (tries + 1));
      else res('');
    });
  });
}

const pageCountOf = (html, classid) => {
  // 期望总条数
  let total = 0;
  const cm = html.match(/\u5171\s*(\d+)/); // 共 XXXX
  if (cm) total = parseInt(cm[1], 10);
  const re = new RegExp('turn_x=(\\d+)&classid_x=' + classid + '"', 'g');
  let m, max = 1;
  while ((m = re.exec(html))) max = Math.max(max, parseInt(m[1], 10));
  return { pages: max, total };
};

function parseRows(html) {
  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let t;
  while ((t = trRe.exec(html))) {
    const tr = t[1];
    if (!/class="sub"/.test(tr)) continue;
    const tds = [];
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let d;
    while ((d = tdRe.exec(tr))) {
      const cell = d[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      tds.push(cell);
    }
    if (tds.length < 11) continue;
    rows.push({
      cat_name: tds[0], name: tds[1], old_name: tds[2],
      bore: tds[3], u_bore: tds[4], width: tds[5],
      cr: tds[6], cor: tds[7], grease_speed: tds[8],
      oil_speed: tds[9], weight: tds[10]
    });
  }
  return rows;
}

const keyOf = (r) => r.name + '|' + r.bore;

(async () => {
  // 加载已有 seed（如有）
  const map = new Map();
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
  for (const r of prev) map.set(keyOf(r), r);
  console.log(`[已有] ${map.size} 条，开始补全…`);

  // 预取每类第1页拿页数/期望条数（并收集第1页数据）
  const jobs = [];
  const expectBy = new Map(); // 分类名 -> 期望总条数
  const p1html = new Map();
  for (const cid of CLASSIDS) {
    const html = await fetchHTML(`${BASE}?mode_x=1&classid_x=${cid}`);
    if (!html) { console.log(`[警告] 分类#${cid} 探测失败（重试后仍失败），跳过`); continue; }
    const { pages, total } = pageCountOf(html, cid);
    const rows = parseRows(html);
    const cname = rows.length ? rows[0].cat_name : `#${cid}`;
    expectBy.set(cname, total);
    p1html.set(cid, html);
    jobs.push({ cid, page: 1 });
    for (let p = 2; p <= pages; p++) jobs.push({ cid, page: p });
  }
  console.log(`[开始] 共 ${jobs.length} 页补抓`);

  let done = 0, next = 0;
  const t0 = Date.now();
  async function worker() {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    while (true) {
      const i = next++;
      if (i >= jobs.length) break;
      const job = jobs[i];
      let html = job.page === 1 ? p1html.get(job.cid) : null;
      if (!html) html = await fetchHTML(`${BASE}?mode_x=1&turn_x=${job.page}&classid_x=${job.cid}`);
      if (html) for (const r of parseRows(html)) if (!map.has(keyOf(r))) map.set(keyOf(r), r);
      done++;
      if (done % 100 === 0 || done === jobs.length) {
        const el = (Date.now() - t0) / 1000;
        const eta = el / done * (jobs.length - done);
        console.log(`[进度] ${done}/${jobs.length} 页 · ${map.size} 条 · 已用 ${(el/60).toFixed(1)}min · 预计剩余 ${(eta/60).toFixed(1)}min`);
      }
      if (GAP_MS) await wait(GAP_MS);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // 汇总：每分类实际条数 vs 期望
  const perCat = {};
  for (const r of map.values()) perCat[r.cat_name] = (perCat[r.cat_name] || 0) + 1;
  console.log('\n=== 每分类 实际/期望 对比（期望为参考站第1页标注总数） ===');
  let sumExpect = 0;
  Object.entries(perCat).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    // 期望总数只到分类名；这里按名字匹配尽量找
    const e = expectBy.get(c);
    if (e !== undefined) sumExpect += e;
    console.log(String(n).padStart(6), c, (e !== undefined ? `(期望 ${e})` : ''));
  });
  console.log('本地实际合计:', map.size, ' | 参考站标注总记录合计(仅能匹配到的分类):', sumExpect);

  fs.writeFileSync(OUT, JSON.stringify(Array.from(map.values())), 'utf8');
  console.log(`\n[完成] 写出 ${map.size} 条 → ${OUT}`);
})().catch((e) => { console.error('[错误]', e); process.exit(1); });