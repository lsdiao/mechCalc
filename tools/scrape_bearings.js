/* =========================================================
 * 轴承型号全量抓取器（参考站 c.zcwz.com/param）
 * - 遍历 44 个分类，逐分类翻页（turn_x=N&classid_x=C）
 * - 并发抓取 + 限速，边抓边打印进度与预计剩余时间
 * - 去重后输出 data/bearings_seed.json
 * 运行：node tools/scrape_bearings.js
 * ========================================================= */
'use strict';

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONCURRENCY = Number(process.env.BK_CONC || 4); // 并发数
const GAP_MS = Number(process.env.BK_GAP || 90);       // 每个 worker 请求间隔（限速，礼貌抓取）
const OUT = path.join(__dirname, '..', 'data', 'bearings_seed.json');

const CLASSIDS = []; // 1..44（含44轧机轴承）
for (let i = 1; i <= 43; i++) CLASSIDS.push(i);
CLASSIDS.push(44);

const BASE = 'https://c.zcwz.com/param';

/* ---------- 抓取单页（走系统代理） ---------- */
function fetchHTML(url) {
  return new Promise((res) => {
    execFile('curl', ['-s', '-m', '25', url], { maxBuffer: 8 * 1024 * 1024 }, (err, stdout) => {
      res(err ? '' : stdout);
    });
  });
}

/* ---------- 解析某分类第1页得到的总页数 ---------- */
const pageCountOf = (html, classid) => {
  const re = new RegExp('turn_x=(\\d+)&classid_x=' + classid + '"', 'g');
  let m, max = 1;
  while ((m = re.exec(html))) max = Math.max(max, parseInt(m[1], 10));
  return max;
};

/* ---------- 从一页 HTML 里解析出记录 ---------- */
function parseRows(html) {
  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let t;
  while ((t = trRe.exec(html))) {
    const tr = t[1];
    // 只处理表格行：包含 <td> 且有 class="sub" 的类型单元格（跳过表头/其它行）
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

/* 记录去重键 */
const keyOf = (r) => r.name + '|' + r.bore;

/* ---------- 任务队列（扁平：每页一个任务） ---------- */
const queue = [];
(async () => {
  console.log(`[准备] 并发=${CONCURRENCY} 限速=${GAP_MS}ms 获取各分类页数…`);

  // 1) 各分类第1页：拿总页数 + 抓第1页数据
  await Promise.all(CLASSIDS.map(async (cid) => {
    const html = await fetchHTML(`${BASE}?mode_x=1&classid_x=${cid}`);
    if (!html) { console.log(`[警告] 分类#${cid} 一次抓取失败，跳过`); return; }
    const pages = pageCountOf(html, cid);
    queue.push({ cid, page: 1, html });
    for (let p = 2; p <= pages; p++) queue.push({ cid, page: p });
    console.log(`[分类#${cid}] ${pages}页`);
  }));

  const TOTAL = queue.length;
  console.log(`[开始] 共 ${queue.length} 页待抓`);

  // 2) 并发抓取
  const map = new Map(); // key -> record
  let done = 0, next = 0;
  const t0 = Date.now();
  const logT = setInterval(() => { /* 空，避免残余 */ }, 60000);

  async function worker() {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    while (true) {
      const i = next++;
      if (i >= queue.length) break;
      const job = queue[i];
      let html = job.html;
      if (job.page > 1) html = await fetchHTML(`${BASE}?mode_x=1&turn_x=${job.page}&classid_x=${job.cid}`);
      if (html) {
        const rows = parseRows(html);
        for (const r of rows) if (!map.has(keyOf(r))) map.set(keyOf(r), r);
      }
      done++;
      const el = (Date.now() - t0) / 1000;
      const eta = el / done * (TOTAL - done);
      if (done % 20 === 0 || done === TOTAL) {
        const pct = (done / TOTAL * 100).toFixed(1);
        console.log(`[进度] ${done}/${TOTAL} 页 (${pct}%) · ${map.size} 条 · 已用 ${(el/60).toFixed(1)}min · 预计剩余 ${(eta/60).toFixed(1)}min`);
      }
      if (GAP_MS) await wait(GAP_MS);
    }
  }
  const workers = [];
  for (let w = 0; w < CONCURRENCY; w++) workers.push(worker());
  await Promise.all(workers);
  clearInterval(logT);

  // 3) 落盘
  const arr = Array.from(map.values());
  fs.writeFileSync(OUT, JSON.stringify(arr), 'utf8');
  console.log(`[完成] 共 ${arr.length} 条（去重后）→ ${OUT}`);
  console.log('分类数:', new Set(arr.map(r=>r.cat_name)).size);
})().catch((e) => { console.error('[错误]', e); process.exit(1); });