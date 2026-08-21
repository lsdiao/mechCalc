/* =========================================================
 * 疲劳 / 直线运动类复刻工具（mechtool.cn 1:1 复刻）
 * 1. 拉伸弹簧设计计算  tension-spring     (category: connect)
 * 2. 直线导轨选型      linear-guide       (category: linear)
 * 3. 滑动螺旋传动计算  screw-transmission (category: linear)
 *
 * 公式/常量来源：
 *   - 拉伸弹簧：mechtool /calculation/calculation_springs1.html
 *     + dist/js/mechtool/springsdesign.min.js（解混淆确认）
 *       曲度系数 K=(4C-1)/(4C-4)+0.615/C（Wahl）；刚度 k=G·d⁴/(8·D³·n)；
 *       试算直径 d'≥1.6√(K·C·F/[τ])；载荷分类 <1000次=Ⅲ / ≤10⁶次=Ⅱ / >10⁶次=Ⅰ；
 *       初拉力 F0=π·d³·G/(8·D·1000)；疲劳安全 S≥1.1；稳定性 b≤5.3(两端固定)/3.7/2.6。
 *   - 直线导轨：页面为纯导航（无本地计算），按 THK 选型公式
 *       L=50·(C/P)^ε km（滚珠 ε=3），静额定 C0=fs·P。
 *   - 滑动螺旋：mechtool /calculation/calculation_screwdrive.html
 *     （耐磨 d2≥0.8√(F/(ψ[p]))、自锁 γ<ρv、螺杆/螺纹强度、稳定性 λ 方法）
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  /* =====================================================================
   * 1. 拉伸弹簧设计计算
   * ===================================================================== */
  /* 弹簧钢丝材料库：总代号 → {name,G,E,σb 平均抗拉强度,hard,temp}
   * σb 为标准中值（立柱弹簧钢丝直径系列的中档值），数据来源 GB 系列标准近似。 */
  var SPRING_MAT = {
    GB4359:  { name: '阀门用油淬火回火碳素弹簧钢丝(GB4359)',  G: 79000, E: 206000, sb: 1373, hard: '-',  temp: '-40~150' },
    GB4360A: { name: '油淬火回火碳素弹簧钢丝(GB4360)A类',     G: 79000, E: 206000, sb: 1470, hard: '-',  temp: '-40~150' },
    GB4360B: { name: '油淬火回火碳素弹簧钢丝(GB4360)B类',     G: 79000, E: 206000, sb: 1570, hard: '-',  temp: '-40~150' },
    GB4361A: { name: '油淬火回火硅锰合金弹簧钢丝(GB4361)A类', G: 79000, E: 206000, sb: 1765, hard: '-',  temp: '-40~250' },
    GB4361B: { name: '油淬火回火硅锰合金弹簧钢丝(GB4361)B类', G: 79000, E: 206000, sb: 1765, hard: '-',  temp: '-40~250' },
    GB4361C: { name: '油淬火回火硅锰合金弹簧钢丝(GB4361)C类', G: 79000, E: 206000, sb: 1765, hard: '-',  temp: '-40~250' },
    GB4362:  { name: '阀门用油淬火回火铬硅合金弹簧钢丝(GB4362)', G: 79000, E: 206000, sb: 1570, hard: '-', temp: '-40~250' },
    GB2271:  { name: '阀门用油淬火回火铬钒合金弹簧钢丝(GB2271)', G: 79000, E: 206000, sb: 1470, hard: '-', temp: '-40~250' },
    GB4357B: { name: '碳素弹簧钢丝(GB4357)B级',               G: 79000, E: 206000, sb: 1373, hard: '-',  temp: '-40~150' },
    GB4357C: { name: '碳素弹簧钢丝(GB4357)C级',               G: 79000, E: 206000, sb: 1470, hard: '-',  temp: '-40~150' },
    GB4357D: { name: '碳素弹簧钢丝(GB4357)D级',               G: 79000, E: 206000, sb: 1570, hard: '-',  temp: '-40~150' },
    GB4358G1:{ name: '琴钢丝(GB4358)G1组',                    G: 79000, E: 206000, sb: 2550, hard: '-',  temp: '-40~130' },
    GB4358G2:{ name: '琴钢丝(GB4358)G2组',                    G: 79000, E: 206000, sb: 2450, hard: '-',  temp: '-40~130' },
    GB4358F: { name: '琴钢丝(GB4358)F组',                     G: 79000, E: 206000, sb: 2060, hard: '-',  temp: '-40~130' },
    'YB(T)11A': { name: '弹簧用不锈钢丝YB(T)11A组',           G: 71000, E: 196000, sb: 1275, hard: '-',  temp: '-60~300' },
    'YB(T)11B': { name: '弹簧用不锈钢丝YB(T)11B组',           G: 71000, E: 196000, sb: 1373, hard: '-',  temp: '-60~300' },
    'YB(T)11C': { name: '弹簧用不锈钢丝YB(T)11C组',           G: 71000, E: 196000, sb: 1470, hard: '-',  temp: '-60~300' }
  };
  /* 拉伸弹簧许用切应力 [τ]=CLASS_TAU·σb；疲劳极限 τ_end=FATIGUE_K·σb（变载） */
  var CLASS_TAU = { c3: 0.40, c2: 0.33, c1: 0.25 };   // III/II/I 类（拉伸弹簧，含初拉力折减）
  var FATIGUE_K = { c1: 0.30, c2: 0.35, c3: 0.45 };   // 变载疲劳（I/II 类）与 III 类低载
  var TAU_FRAC = 0.8;                                  // 试验切应力 τs≈0.8σb（估算试验载荷 Fs）
  /* 钢丝直径系列（初算后圆整档位）— springs1.html #wireDiameter */
  var SPRING_WIRE = [2, 2.2, 2.5, 3, 3.2, 3.5, 4, 4.5, 5, 5.5, 6];
  /* 弹簧中径系列 — springs1.html #springDiameter */
  var SPRING_D = [3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 130];
  /* 有效圈数系列 — springs1.html #effectiveTurns */
  var SPRING_N = [2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11.5, 12.5, 13.5, 14.5, 15, 16, 18, 20, 22, 25, 28, 30];

  App.registerTool({
    id: 'tension-spring',
    name: '拉伸弹簧设计计算',
    category: 'connect',
    keywords: '弹簧 拉伸弹簧 圆柱螺旋 切应力 刚度 变形 初拉力',
    brief: '圆柱螺旋拉伸弹簧设计：由载荷/行程定刚度，校核切应力、变形量、刚度误差与疲劳安全。',
    doc: '根据安装载荷 F<sub>1</sub>、工作载荷 F<sub>2</sub> 与工作行程 h 计算要求刚度 k<sub>req</sub>=（F<sub>2</sub>−F<sub>1</sub>）/h，按强度条件校核<b>切应力 τ=K·8F·D/(π·d³)</b>，并由实际刚度计算安装/工作变形量、刚度相对误差与<b>疲劳安全系数</b>（拉伸弹簧还含<b>初拉力 F<sub>0</sub></b>项）。',
    inputs: [
      { key: 'F1', label: '安装载荷 F₁', group: '设计要求', type: 'number', unit: 'N', default: 210, step: 'any', hint: '预压/预拉伸状态的载荷' },
      { key: 'F2', label: '工作载荷 F₂', group: '设计要求', type: 'number', unit: 'N', default: 500, step: 'any', hint: '必须大于安装载荷' },
      { key: 'h', label: '工作行程 h', group: '设计要求', type: 'number', unit: 'mm', default: 30, step: 'any' },
      { key: 'loadTimes', label: '载荷作用次数', group: '设计要求', type: 'number', unit: '次', default: 10000, step: 'any', hint: '<1000=Ⅲ类；10³~10⁶=Ⅱ类；>10⁶=Ⅰ类（自动判定）' },
      { key: 'material', label: '弹簧钢丝材料', group: '材料与强度', type: 'select', options: Object.keys(SPRING_MAT).map(function (k) { return { v: k, t: SPRING_MAT[k].name }; }), default: 'GB4359' },
      { key: 'd', label: '钢丝直径 d', group: '设计参数', type: 'select', options: SPRING_WIRE.map(function (x) { return { v: x, t: String(x) }; }), default: 5 },
      { key: 'D', label: '弹簧中径 D', group: '设计参数', type: 'select', options: SPRING_D.map(function (x) { return { v: x, t: String(x) }; }), default: 36 },
      { key: 'n', label: '有效圈数 n', group: '设计参数', type: 'select', options: SPRING_N.map(function (x) { return { v: x, t: String(x) }; }), default: 6.5 },
      { key: 'C', label: '旋绕比 C=D/d', group: '设计参数', type: 'number', default: 7.2, step: 'any', hint: '推荐 4~16，常取 5~8' },
      { key: 'force0', label: '初拉力 F₀', group: '设计参数', type: 'number', unit: 'N', default: 0, step: 'any', hint: '无初拉力填 0；有则按 F₀=π·d³·G/(8·D·1000) 估算后填入' }
    ],
    compute: function (v) {
      var F1 = +v.F1, F2 = +v.F2, h = +v.h, d = +v.d, D = +v.D, n = +v.n, C = +v.C, Nc = +v.loadTimes;
      if (!(F2 > 0) || !(h > 0) || !(d > 0) || !(D > 0) || !(n > 0) || !(C >= 4 && C <= 16)) {
        return { error: '请完整输入载荷、行程与弹簧参数；旋绕比 C 建议 4~16' };
      }
      if (F2 <= F1) return { error: '工作载荷 F₂ 必须大于安装载荷 F₁' };
      var mat = SPRING_MAT[v.material];
      /* 载荷分类：<1000=Ⅲ / <=10⁶=Ⅱ / >10⁶=Ⅰ（springsdesign.min.js 确认） */
      var cls = Nc < 1000 ? 'c3' : (Nc <= 1000000 ? 'c2' : 'c1');
      var clsName = { c3: 'Ⅲ类', c2: 'Ⅱ类', c1: 'Ⅰ类' }[cls];
      /* 曲度系数 K（Wahl，实测 C=7.2→K=1.206） */
      var K = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
      var D1 = D - d, Dd = D + d;               // 内径 / 外径
      var sigmaB = mat.sb;
      var tauAllow = CLASS_TAU[cls] * sigmaB;   // 许用切应力
      var F0 = (+v.force0) > 0 ? (+v.force0) : Math.PI * Math.pow(d, 3) * mat.G / (8 * D * 1000); // 初拉力
      var F2s = F2 + F0, F1s = F1 + F0;         // 计入初拉力的实际弹簧力
      /* 试算直径（强度初算）与校核切应力 */
      var dCalc = 1.6 * Math.sqrt(K * C * F2s / tauAllow);
      var tau2 = K * 8 * F2s * D / (Math.PI * Math.pow(d, 3));   // τ=K·8F·D/(πd³)
      var tau1 = K * 8 * F1s * D / (Math.PI * Math.pow(d, 3));
      /* 刚度与变形 */
      var kReq = (F2 - F1) / h;
      var kAct = mat.G * Math.pow(d, 4) / (8 * Math.pow(D, 3) * n); // k=G·d⁴/(8·D³·n)
      var err = (kAct - kReq) / kReq * 100;
      var f1 = (F1s - F0) / kAct, f2 = (F2s - F0) / kAct;          // 变形量（拉伸弹簧：净载荷/刚度）
      var tauS = TAU_FRAC * sigmaB;                                // 试验切应力
      var Fs = tauS * Math.PI * Math.pow(d, 3) / (8 * K * D) - F0; // 试验载荷（换算）
      var fs = (Fs + F0 - F0) / kAct;                              // 试验变形量
      var rat = tau1 / tau2;                                       // 切应力比 γ
      var S = FATIGUE_K[cls] * sigmaB / tau2;                      // 疲劳安全系数
      var f1fs = (Fs > 0) ? f1 / fs : f1 / (f2 * 1.2);
      var f2fs = (Fs > 0) ? f2 / fs : f2 / (f2 * 1.2);
      var strengthOk = tau2 <= tauAllow;
      var fatigueOk = S >= 1.1;
      var rangeOk = f1fs >= 0.2 && f2fs <= 0.8;
      var issues = [];
      if (!strengthOk) issues.push('切应力 τ₂=τmax=' + fmt(tau2, 1) + 'MP 超过许用 ' + fmt(tauAllow) + 'MPa，需加大钢丝直径 d');
      if (!fatigueOk) issues.push('疲劳安全系数 S=' + fmt(S, 2) + '＜1.1，需增大 d 或 D 或降低 F₂');
      if (Math.abs(err) > 10) issues.push('刚度相对误差 |' + fmt(err, 1) + '|% 超出 ±10%，需调 d、D 或 n');
      return {
        sections: [
          { title: '设计要求与载荷', rows: [
            { label: '要求刚度 k₀=(F₂−F₁)/h', value: kReq, unit: 'N/mm', d: 3, hl: true },
            { label: '载荷作用次数 N', value: Nc, d: 0 },
            { label: '载荷类型', value: clsName },
            { label: '切变模量 G（' + mat.name + '）', value: mat.G, unit: 'MPa', d: 0 },
            { label: '平均抗拉强度 σb', value: sigmaB, unit: 'MPa', d: 0 },
            { label: '许用切应力 [τ]', value: tauAllow, unit: 'MPa', d: 0, hl: true }
          ] },
          { title: '强度校核', rows: [
            { label: '曲度系数 K=(4C-1)/(4C-4)+0.615/C', value: K, d: 3, hl: true },
            { label: '旋绕比 C', value: C, d: 1 },
            { label: '试算钢丝直径 d\'=1.6√(K·C·F/[τ])', value: dCalc, unit: 'mm', d: 2 },
            { label: '选用钢丝直径 d', value: d, unit: 'mm', hl: true },
            { label: '切应力 τ=K·8F₂·D/(π·d³)', value: tau2, unit: 'MPa', hl: true },
            { label: '强度判定', value: strengthOk ? '满足' : '不满足', hl: true }
          ] },
          { title: '刚度与变形', rows: [
            { label: '实际刚度 k=G·d⁴/(8D³·n)', value: kAct, unit: 'N/mm', d: 3, hl: true },
            { label: '刚度相对误差', value: err, unit: '%', d: 2 },
            { label: '弹簧内径 D₁', value: D1, unit: 'mm', d: 1 },
            { label: '弹簧外径 D₂=D+d', value: Dd, unit: 'mm', d: 1 },
            { label: '初拉力 F₀', value: F0, unit: 'N', d: 1 },
            { label: '安装变形量 f₁', value: f1, unit: 'mm', d: 2 },
            { label: '工作变形量 f₂', value: f2, unit: 'mm', d: 2, hl: true }
          ] },
          { title: '疲劳校核', rows: [
            { label: '切应力比 γ=τ₁/τ₂(=τ_min/τ_max)', value: rat, d: 2 },
            { label: '疲劳安全系数 S', value: S, d: 2, hl: true },
            { label: '试验载荷 Fs', value: Fs, unit: 'N', d: 0 },
            { label: '疲劳判定（S≥1.1）', value: fatigueOk ? '满足' : '不满足', hl: true }
          ] }
        ],
        verdict: {
          level: (strengthOk && fatigueOk && Math.abs(err) <= 10) ? 'ok' : 'warn',
          text: issues.length ? issues.join('；') : '强度满足（τmax=' + fmt(tau2, 1) + '≤[τ]）、疲劳 S=' + fmt(S, 2) + '≥1.1、刚度误差 ' + fmt(Math.abs(err), 1) + '%',
          note: '疲劳安全 S≥1.1（Ⅱ/I 类变载）；试验变形 fs 用于弹簧特性校核（f/fs 宜在 0.2~0.8）。'
        },
        notes: [
          '曲度系数（Wahl）：K=(4C-1)/(4C-4)+0.615/C；切应力 τ=K·8F·D/(π·d³)（D 为中径）。',
          '拉伸弹簧计入初拉力 F₀：实际弹簧力 F = F外 + F₀；当 F₀ 填 0 时系统按 F₀=π·d³·G/(8·D·1000) 估算（源自 springsdesign.min.js 的 force0Cal()）。',
          '刚度 k=G·d⁴/(8·D³·n)；载荷分类：<1000次=Ⅲ类、10³~10⁶=Ⅱ类、>10⁶=Ⅰ类。'
        ],
        formulas: [
          'k₀=(F₂−F₁)/h；k=G·d⁴/(8·D³·n)',
          'τ=K·8F·D/(π·d³)（K=(4C-1)/(4C-4)+0.615/C）',
          '疲劳安全 S=τ_end/τmax，S≥1.1'
        ],
        reference: 'mechtool.cn 拉伸弹簧设计计算；GB/T 23935《圆柱螺旋弹簧设计计算》、GB/T 4357、GB/T 1358。'
      };
    }
  });

  /* =====================================================================
   * 2. 直线导轨选型（页面 calculation_linearguideselection.html 为导航页，
   *    按 THK 选型公式实现：动额定 C、静额定 C0、寿命 L=50·(C/P)^ε km）
   * ===================================================================== */
  App.registerTool({
    id: 'linear-guide',
    name: '直线导轨选型',
    category: 'linear',
    keywords: '直线导轨 线性滑轨 额定动载荷 C 额定静载荷 C0 寿命 L=50(C/P)^3 选型',
    brief: '按载荷与要求寿命校核直线导轨额定动载荷 C、额定静载荷 C0，并计算实际寿命 L、Lh 与安全裕度。',
    doc: '依据 THK 选型方法：由当量动载荷 P 与要求行走寿命反推<b>所需额定动载荷 C<sub>req</sub></b>，由静安全系数求<b>所需额定静载荷 C₀=fs·P</b>；再按所选导轨 C 计算<b>实际寿命 L=50·(C/P)^ε km</b>（滚珠 ε=3），校核是否满足寿命与静强度要求。',
    inputs: [
      { key: 'body', label: '滚动体类型', group: '载荷与运行', type: 'segment', options: [
        { v: 'ball', t: '滚珠（ε=3）' }, { v: 'roller', t: '滚柱（ε=10/3）' }
      ] },
      { key: 'P', label: '当量动载荷 P', group: '载荷与运行', type: 'number', unit: 'N', default: 1000, step: 'any', hint: '计入系数后的等效载荷' },
      { key: 'S', label: '单程行程 S', group: '载荷与运行', type: 'number', unit: 'mm', default: 600, step: 'any' },
      { key: 'n1', label: '每分钟往复次数 n₁', group: '载荷与运行', type: 'number', unit: '次/min', default: 30, step: 'any' },
      { key: 'Lh', label: '要求寿命 Lh', group: '寿命需求', type: 'number', unit: 'h', default: 18000, step: 'any', hint: 'CNC 20000h、一般自动化 10000~20000h' },
      { key: 'fs', label: '静安全系数 fs', group: '静载荷校核', type: 'select', options: [
        { v: '1.2', t: '1.0~1.3 运转平稳、无冲击' },
        { v: '1.7', t: '1.5~2.0 普通运转条件' },
        { v: '2.5', t: '2.0~3.0 承受冲击/振动' }
      ], default: '1.7' },
      { key: 'fw', label: '负载条件系数 fw', group: '所选导轨校核', type: 'select', options: [
        { v: '1.1', t: '1.0~1.2 平稳无冲击' },
        { v: '1.5', t: '1.3~1.6 普通条件' },
        { v: '2.2', t: '2.0~3.0 有冲击振动' }
      ], default: '1.5' },
      { key: 'HRC', label: '导轨硬度', group: '所选导轨校核', type: 'number', unit: 'HRC', default: 60, step: 'any', hint: '标准 HRC58~60，低于 58 需硬度系数折算' },
      { key: 'Csel', label: '所选导轨额定动载荷 C', group: '所选导轨校核', type: 'number', unit: 'N', default: 25000, step: 'any' },
      { key: 'C0sel', label: '所选导轨额定静载荷 C₀', group: '所选导轨校核', type: 'number', unit: 'N', default: 22000, step: 'any' }
    ],
    compute: function (v) {
      var P = +v.P, S = +v.S, n1 = +v.n1, Lh = +v.Lh;
      if (!(P > 0) || !(S > 0) || !(n1 > 0) || !(Lh > 0)) return { error: '请完整输入载荷、行程、往复次数与要求寿命' };
      var eps = v.body === 'ball' ? 3 : 10 / 3;
      var fs = +v.fs, fw = +v.fw;
      var Lreq = 2 * S * n1 * Lh * 60 / 1e6;            // 要求行走寿命 km
      /* 硬度系数 fH：THK 图表近似（58HRC 以上 =1） */
      var fH = v.HRC >= 58 ? 1.0 : Math.max(0.35, 0.35 + (58 - Math.min(v.HRC, 58)) * 0.035);
      var Creq = fw * P * Math.pow(Lreq / 50, 1 / eps) / fH; // 所需额定动载荷
      var C0req = fs * P;                               // 所需额定静载荷
      var C = +v.Csel, C0 = +v.C0sel;
      var Lreal = 50 * Math.pow(C / P, eps);            // 实际寿命 km
      var LhReal = Lreal * 1e6 / (2 * S * n1 * 60);     // 实际寿命 h
      var okC = C >= Creq, okC0 = C0 >= C0req, okLife = LhReal >= Lh;
      var issues = [];
      if (!okC) issues.push('所选动额定 C=' + fmt(C) + 'N ＜所需 ' + fmt(Creq) + 'N');
      if (!okC0) issues.push('所选静额定 C₀=' + fmt(C0) + 'N ＜所需 ' + fmt(C0req) + 'N');
      if (!okLife) issues.push('实际寿命 ' + fmt(LhReal) + 'h＜要求 ' + fmt(Lh) + 'h');
      var marginC = C / Creq, marginC0 = C0 / C0req;
      return {
        sections: [
          { title: '需求计算', rows: [
            { label: '要求行走寿命 L', value: Lreq, unit: 'km', hl: true },
            { label: '寿命指数 ε', value: eps, d: 2 },
            { label: '所需额定动载荷 C_req', value: Creq, unit: 'N', hl: true },
            { label: '静安全系数 fs', value: fs, d: 1 },
            { label: '所需额定静载荷 C₀=fs·P', value: C0req, unit: 'N', hl: true }
          ] },
          { title: '所选导轨校核', rows: [
            { label: '所选额定动载荷 C', value: C, unit: 'N', hl: true },
            { label: '动载荷裕度 C/C_req', value: marginC, d: 2 },
            { label: '实际寿命 L=50·(C/P)^ε', value: Lreal, unit: 'km', hl: true },
            { label: '实际寿命 Lh', value: LhReal, unit: 'h', hl: true },
            { label: '所选额定静载荷 C₀', value: C0, unit: 'N' },
            { label: '静载荷裕度 C₀/C₀req', value: marginC0, d: 2 }
          ] }
        ],
        verdict: {
          level: (okC && okC0 && okLife) ? 'ok' : 'bad',
          text: issues.length ? issues.join('；') : '满足要求：C≥C_req、C₀≥C₀req、寿命 Lh=' + fmt(LhReal) + 'h≥' + fmt(Lh) + 'h',
          note: '实际寿命 L=50·(C/P)^ε km：滚珠 ε=3、滚柱 ε=10/3；滚珠按 100km 额定、滚柱按 50km 额定折算（THK 基准 50km 计已统一）。'
        },
        notes: [
          'THK 额定寿命：L=(C/(fw·P))^ε ×50 km，滚珠 ε=3、滚柱 ε=10/3。',
          '实际寿命 Lh=L·10⁶/(2·S·n₁·60) h；单程 S 每往复行走 2S。',
          '静安全系数 fs：平稳 1.0~1.3、普通 1.5~2.0、冲击 2.0~3.0。'
        ],
        formulas: [
          'L_req=2·S·n₁·Lh·60/10⁶ km',
          'C_req=fw·P·(L_req/50)^(1/ε)/fH；C₀=fs·P',
          'L=50·(C/P)^ε km'
        ],
        reference: 'THK《直线运动系统产品手册》寿命计算章节；HIWIN 上银直线导轨技术手册（页面导航来源）。'
      };
    }
  });

  /* =====================================================================
   * 3. 滑动螺旋传动计算（mechtool /calculation/calculation_screwdrive.html）
   *    耐磨性→自锁/效率→螺杆强度→螺纹强度→稳定性 逐项校核
   * ===================================================================== */
  var NUT_STYLE_PSI = { '整体式': '整体式（ψ=H/d₂ 取 1.2~2.5）', '剖分式': '剖分式（ψ 可取 2.5~3.5）' };
  /* 端部结构 → 长度系数 μ（screwdrive.html #endStructure） */
  var END_MU = {
    '两端固定': 0.5, '两端铰支': 1.0, '一端固定，一端不完全固定': 0.6,
    '一端固定，一端铰支': 0.7, '一端固定，一端自由': 2.0
  };
  /* 梯形螺纹标准（GB/T 5796）公称直径×螺距 → 中径 d₂=d-0.5P */
  var TR_THREAD = [
    [10, 2], [12, 3], [16, 4], [20, 4], [24, 5], [28, 5], [32, 6], [36, 6],
    [40, 7], [44, 7], [48, 8], [52, 8], [56, 8], [60, 9], [65, 9], [70, 10],
    [80, 10], [90, 12], [100, 12]
  ];
  /* 螺杆材料 → 屈服强度 σs（MPa，近似值，来源机械设计手册常用数据） */
  var REV_YIELD = {
    '45号钢': 360, '50号钢': 375, 'Y40Mn': 300, '40Cr': 785, '40CrMn': 835,
    '65Mn': 432, 'T10': 630, 'T12': 785, '20CrMnTi': 835, 'CrWMn': 930,
    '9Mn2V': 740, '38CrMoAl': 835, '35号钢': 315, '20CrMo': 685, '42CrMo': 930,
    '50Mn': 390, '60Mn': 412, '55号钢': 385, 'GCr15': 1667, 'GCr15SiMn': 1765, '9Cr18': 552
  };

  App.registerTool({
    id: 'screw-transmission',
    name: '滑动螺旋传动计算',
    category: 'linear',
    keywords: '滑动螺旋 螺旋传动 耐磨性 自锁 螺杆强度 螺纹强度 稳定性 梯形螺纹',
    brief: '滑动螺旋传动校核：耐磨性、自锁、螺杆强度、螺纹强度与压杆稳定性。',
    doc: '由轴向载荷 F 与高径比 ψ 先按耐磨条件<b>计算螺纹中径 d₂</b>并取标准螺纹，再依次校核<b>耐磨性（工作压强 p≤[p]）</b>、<b>自锁条件（导程角 γ＜当量摩擦角 ρᵥ）</b>、<b>螺杆强度（当量应力</b>σ<sub>ca</sub>=√(σ²+3τ²)<b>）</b>、<b>螺纹强度（剪切与弯曲）</b>与<b>压杆稳定性（细长比 λ 法）</b>。',
    inputs: [
      { key: 'F', label: '轴向载荷 F', group: '设计参数', type: 'number', unit: 'N', default: 1000, step: 'any' },
      { key: 'nutStyle', label: '螺母形式', group: '设计参数', type: 'select', options: [{ v: '整体式', t: '整体式' }, { v: '剖分式', t: '剖分式' }], default: '整体式' },
      { key: 'thread', label: '螺纹形式', group: '设计参数', type: 'segment', options: [{ v: '梯形螺纹', t: '梯形螺纹' }, { v: '锯齿形螺纹', t: '锯齿形螺纹' }] },
      { key: 'screwMat', label: '螺杆材料', group: '设计参数', type: 'select', options: Object.keys(REV_YIELD).map(function (k) { return { v: k, t: k }; }), default: '45号钢' },
      { key: 'nutMat', label: '螺母材料', group: '设计参数', type: 'select', options: [{ v: '青铜', t: '青铜' }, { v: '钢', t: '钢' }], default: '青铜' },
      { key: 'psi', label: '高径比 ψ=H/d₂', group: '耐磨性', type: 'number', default: 2, step: 'any', hint: '整体式 1.2~2.5、剖分式 2.5~3.5' },
      { key: 'pAllow', label: '许用压强 [p]', group: '耐磨性', type: 'number', unit: 'MPa', default: 20, step: 'any', hint: '低速/青铜 13~25 MPa' },
      { key: 'nLines', label: '螺纹线数', group: '自锁与效率', type: 'select', options: [1, 2, 3, 4].map(function (x) { return { v: x, t: x + ' 线' }; }), default: '1' },
      { key: 'f', label: '摩擦因数 f', group: '自锁与效率', type: 'number', default: 0.09, step: 'any', hint: '淬火钢-青铜 0.08~0.10' },
      { key: 'eff', label: '传动效率系数', group: '自锁与效率', type: 'number', default: 0.95, step: 'any' },
      { key: 'workLength', label: '螺杆最大工作长度', group: '几何', type: 'number', unit: 'mm', default: 1200, step: 'any', hint: '原站为空需输入' },
      { key: 'supportDist', label: '两支撑间最大距离', group: '几何', type: 'number', unit: 'mm', default: 1500, step: 'any', hint: '稳定性校核用' },
      { key: 'endStruct', label: '螺杆端部结构', group: '几何', type: 'select', options: Object.keys(END_MU).map(function (k) { return { v: k, t: k }; }), default: '两端固定' },
      { key: 'sigmaAllow', label: '螺杆许用应力 [σ]', group: '强度校核', type: 'number', unit: 'MPa', default: 95, step: 'any' },
      { key: 'tauOut', label: '螺杆许用剪应力 [τ]', group: '强度校核', type: 'number', unit: 'MPa', default: 57, step: 'any' },
      { key: 'sigmaBendOut', label: '螺杆许用弯曲应力 [σb]', group: '强度校核', type: 'number', unit: 'MPa', default: 105, step: 'any' },
      { key: 'tauIn', label: '螺母许用剪应力 [τ]', group: '强度校核', type: 'number', unit: 'MPa', default: 35, step: 'any' },
      { key: 'sigmaBendIn', label: '螺母许用弯曲应力 [σb]', group: '强度校核', type: 'number', unit: 'MPa', default: 50, step: 'any' },
      { key: 'stabilityS', label: '稳定性安全系数 [S]', group: '稳定性', type: 'number', default: 2.5, step: 'any', hint: '一般要求 2.5~4' }
    ],
    compute: function (v) {
      var F = +v.F, psi = +v.psi, pAllow = +v.pAllow;
      var L = +v.workLength, l = +v.supportDist;
      if (!(F > 0) || !(psi > 0) || !(pAllow > 0)) return { error: '请完整输入轴向载荷、高径比与许用压强' };
      var isTr = v.thread === '梯形螺纹';
      var mu = END_MU[v.endStruct] || 0.5;
      var beta = isTr ? 15 : 3;              // 半牙型角：梯形 15°、锯齿 3°（近似）
      /* 1) 耐磨性：d₂≥0.8√(F/(ψ·[p]))（梯形 h=0.5P），锯齿 0.65 */
      var kd = isTr ? 0.8 : 0.65;
      var d2req = kd * Math.sqrt(F / (psi * pAllow));
      /* 取标准梯形螺纹 */
      var sel = TR_THREAD[0], i;
      for (i = 0; i < TR_THREAD.length; i++) {
        var dSel = TR_THREAD[i][0], pSel = TR_THREAD[i][1];
        var d2Sel = dSel - 0.5 * pSel;
        if (d2Sel >= d2req) { sel = TR_THREAD[i]; break; }
      }
      var d = sel[0], P = sel[1], d2 = d - 0.5 * P;
      /* 螺距牙型：H1 工作牙高、b 牙根宽、d3 小径(螺杆底径) */
      var H1 = isTr ? 0.5 * P : 0.75 * P;
      var b = isTr ? 0.65 * P : 0.7 * P;
      var d3 = isTr ? (d - P) : (d - 1.5 * P);
      /* 2) 耐磨性校核 */
      var H = psi * d2;                     // 螺母高度
      var z = H / P;                        // 旋合圈数
      var p = F / (Math.PI * d2 * H1 * z);  // 工作压强
      var wearOk = p <= pAllow;
      /* 3) 导程、导程角、自锁与效率 */
      var nLines = +v.nLines, S = nLines * P;
      var gamma = Math.atan(S / (Math.PI * d2));            // 导程角 rad
      var fv = (+v.f) / Math.cos(beta * Math.PI / 180);     // 当量摩擦系数
      var rhoV = Math.atan(fv);                             // 当量摩擦角
      var selfLock = gamma < rhoV;
      var eta = Math.tan(gamma) / Math.tan(gamma + rhoV) * (+v.eff);
      var T = F * d2 / 2 * Math.tan(gamma + rhoV);          // 驱动力矩 N·mm
      /* 4) 螺杆强度 */
      var A = Math.PI * d3 * d3 / 4;
      var sigma = F / A;
      var tauT = T / (0.2 * d3 * d3 * d3);
      var sigmaCa = Math.sqrt(sigma * sigma + 3 * tauT * tauT);
      var screwOk = sigmaCa <= +v.sigmaAllow;
      /* 5) 螺纹强度（剪切+弯曲） */
      var tauOut = F / (Math.PI * d * b * z);               // 螺杆剪应力
      var sigmaBendOut = 3 * F * H1 / (Math.PI * d * b * b * z); // 螺杆弯曲
      var tauIn = F / (Math.PI * d3 * b * z);               // 螺母（内螺纹）剪应力
      var sigmaBendIn = 3 * F * H1 / (Math.PI * d3 * b * b * z);
      var threadOk = tauOut <= +v.tauOut && sigmaBendOut <= +v.sigmaBendOut &&
                     tauIn <= +v.tauIn && sigmaBendIn <= +v.sigmaBendIn;
      /* 6) 稳定性（λ 法）：λ=μ·l/i，i=d3/4 */
      var irad = d3 / 4;
      var lambda = mu * l / irad;
      var E = 210000, ss = REV_YIELD[v.screwMat] || 360;
      var lam1 = 105, lam2 = 61, aC = 304, bC = 1.12;      // 45# 钢中柔度经验常数
      var sigmaCr;
      if (lambda > lam1) sigmaCr = Math.PI * Math.PI * E / (lambda * lambda); // 大柔度 Euler
      else if (lambda > lam2) sigmaCr = aC - bC * lambda;                    // 中柔度直线公式
      else sigmaCr = ss;                                                      // 小柔度 屈服
      var Fcr = sigmaCr * A;
      var Sst = Fcr / F;
      var stOk = Sst >= +v.stabilityS;
      var issues = [];
      if (!wearOk) issues.push('工作压强 p=' + fmt(p, 2) + 'MPa＞[p]=' + fmt(pAllow) + 'MPa，耐磨性不足');
      if (!selfLock) issues.push('γ=' + fmt(gamma * 180 / Math.PI, 2) + '°≥ρᵥ=' + fmt(rhoV * 180 / Math.PI, 2) + '°，不满足自锁条件');
      if (!screwOk) issues.push('螺杆当量应力 σ_ca=' + fmt(sigmaCa, 1) + 'MPa＞[σ]=' + fmt(+v.sigmaAllow) + 'MPa');
      if (!threadOk) issues.push('螺纹剪切/弯曲强度不足（螺杆 τ=' + fmt(tauOut, 1) + ' 弯曲=' + fmt(sigmaBendOut, 1) + 'MPa）');
      if (!stOk) issues.push('压杆稳定性不足：S=' + fmt(Sst, 2) + '＜[' + fmt(+v.stabilityS) + ']，需加大 d 或缩短支撑距离');
      return {
        sections: [
          { title: '选型（耐磨性）', rows: [
            { label: '计算中径 d₂=0.8√(F/(ψ[p]))', value: d2req, unit: 'mm', hl: true },
            { label: '选用标准梯形螺纹', value: d + '×' + P, unit: 'mm', hl: true },
            { label: '螺纹中径 d₂', value: d2, unit: 'mm' },
            { label: '螺母高度 H=ψ·d₂', value: H, unit: 'mm' },
            { label: '旋合圈数 z=H/P', value: z, d: 1, unit: '圈' }
          ] },
          { title: '耐磨性校核', rows: [
            { label: '基本牙型高度 H₁', value: H1, unit: 'mm', d: 2 },
            { label: '工作压强 p=F/(π·d₂·H₁·z)', value: p, unit: 'MPa', hl: true },
            { label: '许用压强 [p]', value: pAllow, unit: 'MPa' },
            { label: '耐磨性', value: wearOk ? '满足' : '不满足', hl: true }
          ] },
          { title: '自锁与效率', rows: [
            { label: '导程 S=线数·P', value: S, unit: 'mm', d: 1, hl: true },
            { label: '导程角 γ=atan(S/(π·d₂))', value: gamma * 180 / Math.PI, unit: '°', d: 2, hl: true },
            { label: '当量摩擦角 ρᵥ', value: rhoV * 180 / Math.PI, unit: '°', d: 2, hl: true },
            { label: '传动效率 η=tanγ/tan(γ+ρᵥ)', value: eta, d: 3, hl: true }
          ] },
          { title: '螺杆强度校核', rows: [
            { label: '导程角/当量摩擦角判据', value: selfLock ? '自锁满足（γ<ρᵥ）' : '不满足自锁', hl: true },
            { label: '螺杆小径 d₃', value: d3, unit: 'mm', d: 2 },
            { label: '压应力 σ=F/A', value: sigma, unit: 'MPa', d: 2 },
            { label: '扭剪应力 τ=T/(0.2·d₃³)', value: tauT, unit: 'MPa', d: 2 },
            { label: '当量应力 σ_ca=√(σ²+3τ²)', value: sigmaCa, unit: 'MPa', hl: true },
            { label: '许用应力 [σ]', value: +v.sigmaAllow, unit: 'MPa' }
          ] },
          { title: '螺纹强度校核', rows: [
            { label: '螺杆剪应力 τ', value: tauOut, unit: 'MPa', d: 2 },
            { label: '螺杆弯曲应力 σb', value: sigmaBendOut, unit: 'MPa', d: 2 },
            { label: '螺母剪应力 τ', value: tauIn, unit: 'MPa', d: 2 },
            { label: '螺母弯曲应力 σb', value: sigmaBendIn, unit: 'MPa', d: 2 },
            { label: '牙根宽度 b', value: b, unit: 'mm', d: 2 },
            { label: '螺纹强度', value: threadOk ? '满足' : '不满足', hl: true }
          ] },
          { title: '稳定性校核', rows: [
            { label: '长度系数 μ', value: mu, d: 1, unit: '' },
            { label: '细长比 λ=μ·l/i', value: lambda, d: 0, hl: true },
            { label: '临界应力 σ_cr', value: sigmaCr, unit: 'MPa', d: 1 },
            { label: '临界载荷 F_cr=σ_cr·A', value: Fcr, unit: 'N', hl: true },
            { label: '稳定性安全系数 S=F_cr/F', value: Sst, d: 2, hl: true },
            { label: '稳定性判定', value: stOk ? '满足' : '不足', hl: true }
          ] }
        ],
        verdict: {
          level: (wearOk && selfLock && screwOk && threadOk && stOk) ? 'ok' : 'warn',
          text: issues.length ? issues.join('；') : '全部校核通过：耐磨 p=' + fmt(p, 2) + '≤[p]、自锁、螺杆/螺纹强度与稳定性均满足',
          note: '中柔度细长比临界应力 σ_cr=a−bλ（a=304、b=1.12，45# 钢近似），大柔度用欧拉公式；稳定性安全系数一般取 2.5~4。'
        },
        notes: [
          '耐磨性：d₂≥0.8√(F/(ψ[p]))（梯形 h=0.5P）或 0.65√(F/(ψ[p]))（锯齿 h=0.75P）。',
          '自锁条件：导程角 γ＜当量摩擦角 ρᵥ（fᵥ=f/cos(β)，梯形半角 β=15°）；单线螺纹通常满足。',
          '螺杆强度用第四强度理论 σ_ca=√(σ²+3τ²)，σ=F/A、τ=T/(0.2d₃³)。'
        ],
        formulas: [
          'd₂=0.8√(F/(ψ[p]))；p=F/(π·d₂·H₁·z)',
          'γ=atan(S/(π·d₂))；η=tanγ/tan(γ+ρᵥ)',
          'σ_ca=√(σ²+3τ²)；λ=μ·l/i，S=F_cr/F≥[S]'
        ],
        reference: 'mechtool.cn 滑动螺旋传动计算；《机械设计》螺旋传动章节；GB/T 5796 梯形螺纹。'
      };
    }
  });
})();