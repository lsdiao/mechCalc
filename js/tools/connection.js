/* =========================================================
 * 连接与校核类工具
 * 1. 螺栓连接强度校核（受轴向载荷-紧螺栓连接，静载荷）
 * 2. 平键连接强度校核
 * 3. 压缩弹簧设计计算
 * 依据：《机械设计》（濮良贵版）及相关国家标准
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt, esc = App.esc;

  /* ============ 1. 螺栓连接强度校核 ============ */
  // 普通螺纹小径 GB/T 196-2003
  var THREAD_D1 = { '6': 4.917, '8': 6.647, '10': 8.376, '12': 10.106, '14': 11.835, '16': 13.835, '18': 15.294, '20': 17.294, '22': 19.294, '24': 20.752, '27': 23.752, '30': 26.211, '33': 29.211, '36': 31.670, '39': 34.670, '42': 37.129, '45': 40.129, '48': 42.587 };
  // 性能等级 → 最小屈服强度 MPa (GB/T 3098.1)
  var GRADE_SS = { '4.8': 320, '5.6': 300, '5.8': 400, '6.8': 480, '8.8': 640, '9.8': 720, '10.9': 940, '12.9': 1100 };

  App.registerTool({
    id: 'bolt-check',
    name: '螺栓连接强度校核',
    category: 'connect',
    keywords: '螺栓 螺纹 强度 校核 预紧力 轴向载荷',
    brief: '受轴向工作载荷的紧螺栓连接强度校核与设计，计算残余预紧力、总拉力与计算应力。',
    doc: '用于<b>受轴向工作载荷的紧螺栓连接</b>（静载荷）强度校核：先由工作载荷 F 与残余预紧力 F″ 求螺栓总拉力 F<sub>0</sub>，再按 1.3 倍系数（考虑螺纹拧紧扭转切应力）校核危险截面拉伸应力。',
    inputs: [
      { key: 'd', label: '螺栓公称直径', group: '螺栓与工况', type: 'select', options: Object.keys(THREAD_D1).map(function (k) { return { v: k, t: 'M' + k }; }), default: '12' },
      { key: 'grade', label: '性能等级', group: '螺栓与工况', type: 'select', options: Object.keys(GRADE_SS).map(function (k) { return { v: k, t: k + ' 级（σs≥' + GRADE_SS[k] + 'MPa）' }; }), default: '8.8' },
      { key: 'F', label: '轴向工作载荷 F', group: '载荷参数', type: 'number', unit: 'N', default: 5000, step: 'any' },
      { key: 'resType', label: '残余预紧力取值', group: '载荷参数', type: 'select', options: [
        { v: '0.2', t: '一般静载荷连接 F″=0.2F' }, { v: '0.6', t: '变载荷 / 重要连接 F″=0.6F' },
        { v: '1.0', t: '有密封要求 F″=1.0F' }, { v: '1.5', t: '冲击载荷 / 高压密封 F″=1.5F' }
      ], default: '0.2' },
      { key: 'gasket', label: '被连接件垫片（相对刚度）', group: '载荷参数', type: 'select', options: [
        { v: '0.25', t: '金属垫片 / 无垫片（0.2~0.3）' }, { v: '0.45', t: '皮革 / 铜皮石棉垫（0.4~0.5）' },
        { v: '0.7', t: '皮革石棉 / 纸垫（0.6~0.7）' }, { v: '0.9', t: '橡胶 / 软垫片（0.8~0.9）' }
      ], default: '0.25' },
      { key: 'S', label: '安全系数 S', group: '载荷参数', type: 'number', default: 1.5, step: 'any', hint: '控制预紧力：1.2~1.5；不控制预紧力：查手册（一般1.6~3）' }
    ],
    compute: function (v) {
      var F = +v.F, S = +v.S, kRes = +v.resType, lambda = +v.gasket;
      if (!(F > 0)) return { error: '请输入工作载荷 F（N）' };
      if (!(S > 0)) return { error: '请输入安全系数 S' };
      var d1 = THREAD_D1[v.d];
      var ss = GRADE_SS[v.grade];
      var F2 = kRes * F;                 // 残余预紧力
      var F0 = F2 + F;                   // 螺栓总拉力 F₀ = F″ + F = F′ + λF
      var Fp0 = F2 + (1 - lambda) * F;   // 预紧力 F′ = F″ + (1-λ)F
      var A = Math.PI * d1 * d1 / 4;     // 危险截面面积
      var sigma = 1.3 * F0 / A;          // 计算应力
      var sigmaAllow = ss / S;
      var ok = sigma <= sigmaAllow;
      return {
        sections: [
          { title: '载荷计算', rows: [
            { label: '残余预紧力 F″', value: F2, unit: 'N' },
            { label: '螺栓预紧力 F′', value: Fp0, unit: 'N' },
            { label: '螺栓总拉力 F₀', value: F0, unit: 'N', hl: true },
            { label: '被连接件剩余预紧力', value: F2, unit: 'N' }
          ] },
          { title: '强度校核', rows: [
            { label: '螺纹小径 d₁', value: d1, unit: 'mm' },
            { label: '危险截面积 A', value: A, unit: 'mm²', d: 2 },
            { label: '计算应力 σca=1.3F₀/A', value: sigma, unit: 'MPa', hl: true },
            { label: '许用应力 [σ]=σs/S', value: sigmaAllow, unit: 'MPa', hl: true },
            { label: '屈服强度 σs', value: ss, unit: 'MPa' },
            { label: '强度裕度', value: sigmaAllow / sigma, d: 2, unit: '' }
          ] }
        ],
        verdict: {
          level: ok ? 'ok' : 'bad',
          text: ok ? '校核通过：σca = ' + fmt(sigma) + ' MPa ≤ [σ] = ' + fmt(sigmaAllow) + ' MPa'
                   : '校核不通过：σca = ' + fmt(sigma) + ' MPa > [σ] = ' + fmt(sigmaAllow) + ' MPa，请增大大径或提高性能等级',
          note: '若不满足，可：① 增大螺栓直径 ② 提高性能等级 ③ 改用金属垫片降低相对刚度 ④ 改善预紧控制'
        },
        notes: [
          '总拉力 F₀ = F″ + F（亦即 F′ + λF），其中 λ 为螺栓与被连接件的相对刚度系数（取决于垫片材料）。',
          '1.3 为考虑拧紧时螺纹副中扭转切应力的折算系数。',
          '不控制预紧力时安全系数与螺栓直径有关（M6~M16：1.6~3），此处由用户直接输入。'
        ]
      };
    },
    formulas: [
      'F″ = k·F（k=0.2 静载、0.6 变载、1.0 密封、1.5 冲击/高压）',
      'F₀ = F″ + F = F′ + λ·F，F′ = F″ + (1−λ)·F；λ：金属垫 0.2~0.3，皮革铜皮石棉 0.5，橡胶 0.9',
      'σ<sub>ca</sub> = 1.3·F₀ / (π·d₁²/4) ≤ [σ] = σ<sub>s</sub>/S'
    ],
    reference: '依据 GB/T 196《普通螺纹 基本尺寸》、GB/T 3098.1《紧固件机械性能 螺栓、螺钉和螺柱》；《机械设计》第九版 第四章。'
  });

  /* ============ 2. 平键连接强度校核 ============ */
  // 平键尺寸 GB/T 1095-2003：轴径段 → b×h
  var KEY_DIMS = [
    { max: 8, b: 2, h: 2 }, { max: 10, b: 3, h: 3 }, { max: 12, b: 4, h: 4 },
    { max: 17, b: 5, h: 5 }, { max: 22, b: 6, h: 6 }, { max: 30, b: 8, h: 7 },
    { max: 38, b: 10, h: 8 }, { max: 44, b: 12, h: 8 }, { max: 50, b: 14, h: 9 },
    { max: 58, b: 16, h: 10 }, { max: 65, b: 18, h: 11 }, { max: 75, b: 20, h: 12 },
    { max: 85, b: 22, h: 14 }, { max: 95, b: 24, h: 14 }, { max: 110, b: 25, h: 14 },
    { max: 130, b: 28, h: 16 }, { max: 150, b: 32, h: 18 }, { max: 170, b: 36, h: 20 },
    { max: 200, b: 40, h: 22 }, { max: 230, b: 45, h: 25 }, { max: 260, b: 50, h: 28 },
    { max: 290, b: 56, h: 32 }, { max: 330, b: 63, h: 32 }, { max: 380, b: 70, h: 36 },
    { max: 440, b: 80, h: 40 }, { max: 500, b: 90, h: 45 }
  ];
  function pickKey(d) {
    for (var i = 0; i < KEY_DIMS.length; i++) if (d <= KEY_DIMS[i].max) return KEY_DIMS[i];
    return KEY_DIMS[KEY_DIMS.length - 1];
  }
  var SP_ALLOW = { // 许用挤压应力 MPa：静、轻微冲击、冲击
    steel: { s: 125, m: 100, i: 50 }, cast: { s: 70, m: 50, i: 30 }
  };

  App.registerTool({
    id: 'key-check',
    name: '平键连接强度校核',
    category: 'connect',
    keywords: '平键 键连接 挤压应力 剪切 轴毂',
    brief: '按 GB/T 1095 自动推荐键尺寸，校核普通平键连接的挤压强度并计算承载能力。',
    doc: '普通平键（A 型圆头）连接强度校核：键的主要失效形式是较弱零件（通常轮毂）工作面<b>压溃</b>，故按挤压应力校核；仅重载时才需校核键的剪切。',
    inputs: [
      { key: 'd', label: '轴径 d', group: '键连接参数', type: 'number', unit: 'mm', default: 40, step: 'any' },
      { key: 'T', label: '传递转矩 T', group: '键连接参数', type: 'number', unit: 'N·m', default: 200, step: 'any' },
      { key: 'L', label: '键公称长度 L', group: '键连接参数', type: 'number', unit: 'mm', default: 63, step: 'any', hint: '一般取 1.2d~1.5d 并圆整至标准长度系列' },
      { key: 'autoBh', label: '键截面 b×h', group: '键连接参数', type: 'segment', options: [
        { v: 'auto', t: '按 GB/T 1095 自动推荐' }, { v: 'man', t: '手动指定' }
      ] },
      { key: 'b', label: '键宽 b', group: '键连接参数', type: 'number', unit: 'mm', default: 12, step: 'any' },
      { key: 'h', label: '键高 h', group: '键连接参数', type: 'number', unit: 'mm', default: 8, step: 'any' },
      { key: 'mat', label: '轮毂材料（取较弱者）', group: '工况', type: 'select', options: [
        { v: 'steel', t: '钢（σb＞500MPa）' }, { v: 'cast', t: '铸铁' }
      ], default: 'steel' },
      { key: 'load', label: '载荷性质', group: '工况', type: 'select', options: [
        { v: 's', t: '静载荷' }, { v: 'm', t: '轻微冲击' }, { v: 'i', t: '冲击载荷' }
      ], default: 'm' }
    ],
    compute: function (v) {
      var d = +v.d, T = +v.T, L = +v.L;
      if (!(d > 0) || !(T > 0) || !(L > 0)) return { error: '请完整输入轴径、转矩与键长' };
      var rec = pickKey(d);
      var b, h;
      if (v.autoBh === 'auto') { b = rec.b; h = rec.h; } else { b = +v.b; h = +v.h; }
      if (!(b > 0) || !(h > 0)) return { error: '请输入有效的键截面尺寸 b×h' };
      var l = L - b;                      // A 型键有效工作长度
      if (l <= 0) return { error: '键长 L 需大于键宽 b（A 型键工作长度 l = L - b）' };
      var k = 0.4 * h;                    // 键与轮毂的接触高度 ≈ 0.4h
      var Tmm = T * 1000;                 // N·mm
      var sigmaP = 2 * Tmm / (d * k * l); // 挤压应力
      var tau = 2 * Tmm / (d * b * l);    // 键剪切应力（参考）
      var allow = SP_ALLOW[v.mat][v.load];
      var Tmax = 0.5 * allow * d * k * l / 1000; // 允许最大转矩 N·m
      var ok = sigmaP <= allow;
      return {
        sections: [
          { title: '键参数（GB/T 1095）', rows: [
            { label: '推荐截面 b×h', html: (v.autoBh === 'auto' ? rec.b + '×' + rec.h + '（已采用）' : rec.b + '×' + rec.h + '（推荐）') },
            { label: '采用截面 b×h', html: b + '×' + h },
            { label: '有效工作长度 l=L-b', value: l, unit: 'mm' },
            { label: '工作高度 k≈0.4h', value: k, unit: 'mm', d: 2 }
          ] },
          { title: '强度校核', rows: [
            { label: '挤压应力 σp', value: sigmaP, unit: 'MPa', hl: true },
            { label: '许用挤压应力 [σp]', value: allow, unit: 'MPa', hl: true },
            { label: '键剪切应力 τ（参考）', value: tau, unit: 'MPa' },
            { label: '许用切应力 [τ]（参考）', value: 120, unit: 'MPa' },
            { label: '连接允许最大转矩', value: Tmax, unit: 'N·m', d: 1 },
            { label: '转矩裕度', value: Tmax / T, d: 2 }
          ] }
        ],
        verdict: {
          level: ok ? 'ok' : 'bad',
          text: ok ? '校核通过：σp = ' + fmt(sigmaP) + ' MPa ≤ [σp] = ' + allow + ' MPa'
                   : '校核不通过：σp = ' + fmt(sigmaP) + ' MPa > [σp] = ' + allow + ' MPa',
          note: '若不满足，可：① 增加键长 ② 采用双键（相隔180°，考虑1.5倍承载折减）③ 改用花键连接 ④ 提高轮毂材料'
        },
        notes: [
          '采用 GB/T 1095-2003 普通平键和键槽尺寸，A 型（圆头）工作长度 l = L - b。',
          '定键宽的轴段如未选中推荐值，请核对 GB/T 1095 表。',
          '双平键布置（180°）时承载按单键 1.5 倍计，强度校核时工作长度乘 0.75 折减。'
        ]
      };
    },
    formulas: [
      'σ<sub>p</sub> = 2T/(d·k·l) ≤ [σ<sub>p</sub>]，其中 k≈0.4h（键的接触高度）',
      'τ = 2T/(d·b·l) ≤ [τ]（一般钢制键 [τ]=120 MPa）',
      '[σp]：钢/静 125、轻微冲击 100、冲击 50；铸铁/70、50、30（MPa）'
    ],
    reference: 'GB/T 1095-2003《平键 键槽的剖面尺寸》、GB/T 1096-2003《普通型 平键》；《机械设计》第九版 第六章。'
  });

  /* ============ 3. 压缩弹簧设计 ============ */
  /* 碳素弹簧钢丝抗拉强度 σb（GB/T 4357-2009，MPa）：随钢丝直径增大而降低 */
  var SB_B = [[1, 1660], [1.2, 1620], [1.6, 1580], [2, 1520], [2.5, 1460], [3, 1410], [3.5, 1370], [4, 1320], [4.5, 1290], [5, 1270], [5.5, 1250], [6, 1220], [7, 1180], [8, 1160], [9, 1130], [10, 1110], [11, 1090], [12, 1070], [13, 1050], [14, 1030], [16, 990], [18, 960], [20, 930], [22, 900], [25, 870]];
  var SB_C = [[1, 1960], [1.2, 1910], [1.6, 1850], [2, 1810], [2.5, 1760], [3, 1710], [3.5, 1660], [4, 1620], [4.5, 1590], [5, 1560], [5.5, 1520], [6, 1480], [7, 1430], [8, 1400], [9, 1380], [10, 1350], [11, 1320], [12, 1300], [13, 1280]];
  function sbLookup(tab, d) {
    if (d <= tab[0][0]) return tab[0][1];
    for (var i = 0; i < tab.length - 1; i++) {
      var a = tab[i], b = tab[i + 1];
      if (d >= a[0] && d <= b[0]) return a[1] + (d - a[0]) / (b[0] - a[0]) * (b[1] - a[1]);
    }
    return tab[tab.length - 1][1];
  }
  var SPRING_MAT = {
    carbon: { name: '碳素弹簧钢丝 B级（GB/T 4357）', G: 79000, sb: SB_B },
    music: { name: '碳素弹簧钢丝 C级·高强度（GB/T 4357）', G: 79000, sb: SB_C },
    si: { name: '60Si2Mn 硅锰弹簧钢（油淬火）', G: 79000, tau2: 640 },
    crv: { name: '50CrVA 铬钒弹簧钢（油淬火）', G: 79000, tau2: 610 },
    sus: { name: '不锈钢 304', G: 71000, tau2: 440 }
  };
  /* 碳素钢丝许用切应力按载荷类别取 σb 的比例（III/II/I 类） */
  var CARBON_CLASS = { c3: 0.5, c2: 0.4, c1: 0.3 };
  var SPRING_CLASS = { c3: 1.25, c2: 1.0, c1: 0.72 }; // III类(静/计数少) II类 I类(无限寿命)
  // 钢丝直径优先系列（第1系列）
  var WIRE_SERIES = [1, 1.2, 1.6, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 8, 10, 12, 16, 20, 25, 30, 40];

  App.registerTool({
    id: 'spring-design',
    name: '压缩弹簧设计计算',
    category: 'connect',
    keywords: '弹簧 压缩弹簧 圆柱螺旋 刚度 圈数 旋绕比',
    brief: '圆柱螺旋压缩弹簧设计：由载荷与变形量计算簧丝直径、中径、有效圈数、刚度并校核稳定性。',
    doc: '根据最大工作载荷 F<sub>2</sub>、最大变形 λ<sub>2</sub> 与旋绕比 C，用强度条件试算簧丝直径 d，再由刚度条件求有效圈数 n，最后估算节距、自由高度并校核<b>稳定性</b>（细长比 b=H<sub>0</sub>/D<sub>2</sub>）。',
    inputs: [
      { key: 'F2', label: '最大工作载荷 F₂', group: '设计条件', type: 'number', unit: 'N', default: 500, step: 'any' },
      { key: 'lam2', label: '最大变形量 λ₂', group: '设计条件', type: 'number', unit: 'mm', default: 40, step: 'any' },
      { key: 'F1', label: '最小工作载荷 F₁', group: '设计条件', type: 'number', unit: 'N', default: 200, step: 'any', hint: '无最小载荷要求可填 0' },
      { key: 'C', label: '旋绕比 C=D₂/d', group: '设计参数', type: 'number', default: 6, step: 'any', hint: '推荐 4~16，常取 5~8' },
      { key: 'mat', label: '弹簧材料', group: '设计参数', type: 'select', options: Object.keys(SPRING_MAT).map(function (k) { return { v: k, t: SPRING_MAT[k].name + '，G=' + SPRING_MAT[k].G + 'MPa' }; }), default: 'si' },
      { key: 'cls', label: '载荷类别', group: '设计参数', type: 'select', options: [
        { v: 'c3', t: 'III 类：静载或变载次数<10⁴' },
        { v: 'c2', t: 'II 类：变载 10⁴~10⁵ 次、冲击' },
        { v: 'c1', t: 'I 类：变载 >10⁵ 次或无限寿命' }
      ], default: 'c2' },
      { key: 'endType', label: '端部结构（支承圈）', group: '设计参数', type: 'select', options: [
        { v: '2', t: '两端磨平，并紧（每端1圈支承）' },
        { v: '2.5', t: '两端磨平，支承圈共 2.5' },
        { v: '2x', t: '两端不磨平（支承圈共 2）' }
      ], default: '2' }
    ],
    compute: function (v) {
      var F2 = +v.F2, lam2 = +v.lam2, F1 = +v.F1, C = +v.C;
      if (!(F2 > 0) || !(lam2 > 0)) return { error: '请输入最大工作载荷 F₂ 与最大变形量 λ₂' };
      if (!(C >= 4 && C <= 16)) return { error: '旋绕比 C 建议取 4~16' };
      var mat = SPRING_MAT[v.mat];
      var K = (4 * C - 1) / (4 * C - 4) + 0.615 / C;   // 曲度系数（Wahl）
      var d, dCalc, tauAllow, tauCheck;
      if (mat.sb) {
        /* 碳素钢丝：σb 随直径降低 → [τ]=比例·σb(d) 随选径迭代 */
        var frac = CARBON_CLASS[v.cls];
        d = null; dCalc = 0;
        for (var i = 0; i < WIRE_SERIES.length; i++) {
          var di = WIRE_SERIES[i];
          var tauI = frac * sbLookup(mat.sb, di);
          var need = 1.6 * Math.sqrt(K * C * F2 / tauI); // 该档 [τ] 对应的试算直径
          if (di >= need) { d = di; tauAllow = tauI; dCalc = need; break; }
        }
        if (d === null) {
          d = WIRE_SERIES[WIRE_SERIES.length - 1];
          tauAllow = frac * sbLookup(mat.sb, d);
          dCalc = 1.6 * Math.sqrt(K * C * F2 / tauAllow);
        }
      } else {
        tauAllow = mat.tau2 * SPRING_CLASS[v.cls];
        dCalc = 1.6 * Math.sqrt(K * C * F2 / tauAllow); // 试算直径
        d = null;
        for (var j = 0; j < WIRE_SERIES.length; j++) if (WIRE_SERIES[j] >= dCalc) { d = WIRE_SERIES[j]; break; }
        if (d === null) { d = Math.ceil(dCalc); }
      }
      tauCheck = 8 * K * F2 * (C * d) / (Math.PI * Math.pow(d, 3)); // 校核切应力
      var D2 = C * d;                                   // 中径
      var D1 = D2 - d, Dd = D2 + d;                     // 内径/外径
      var k = F2 / lam2;                                // 刚度 N/mm
      var n = mat.G * Math.pow(d, 4) / (8 * Math.pow(D2, 3) * k); // 有效圈数
      var nR = Math.max(2, Math.round(n * 0.5) / 0.5);  // 圈数取 0.5 圈尾数
      var nTotal = nR + (v.endType === '2' ? 2 : v.endType === '2.5' ? 2.5 : 2);
      var kReal = mat.G * Math.pow(d, 4) / (8 * Math.pow(D2, 3) * nR); // 实际刚度
      var delta = 0.1 * d;                              // 余隙
      var t = d + lam2 / nR + delta;                    // 节距 t = d + λ2/n + δ
      var H0 = nR * t + (v.endType === '2x' ? 3 : 1.5) * d; // 自由高（磨平1.5d）
      var b = H0 / D2;                                  // 稳定性细长比
      var alpha = Math.atan(t / (Math.PI * D2)) * 180 / Math.PI; // 螺旋角
      var lam1 = F1 / kReal;
      var Fmin = kReal * lam2;
      var stable = b <= 5.3;
      var sbShow = mat.sb ? sbLookup(mat.sb, d) : null;
      return {
        sections: [
          { title: '材料与强度', rows: [
            { label: '钢丝抗拉强度 σb（GB/T 4357）', value: sbShow, unit: 'MPa', d: 0 },
            { label: '材料许用切应力 [τ]', value: tauAllow, unit: 'MPa', d: 0, hl: true },
            { label: '曲度系数 K', value: K, d: 3 },
            { label: '试算簧丝直径', value: dCalc, unit: 'mm', d: 3 },
            { label: '选用簧丝直径 d', value: d, unit: 'mm', hl: true },
            { label: '校核切应力 τ=8K·F₂·D₂/(π·d³)', value: tauCheck, unit: 'MPa', hl: true }
          ] },
          { title: '几何参数', rows: [
            { label: '弹簧中径 D₂=C·d', value: D2, unit: 'mm', hl: true },
            { label: '弹簧内径 D₁', value: D1, unit: 'mm' },
            { label: '弹簧外径 D', value: Dd, unit: 'mm' },
            { label: '有效圈数 n', value: nR, unit: '圈', hl: true },
            { label: '总圈数 n₁', value: nTotal, unit: '圈' },
            { label: '节距 t≈d+λ₂/n+0.1d', value: t, unit: 'mm', d: 2 },
            { label: '自由高度 H₀（估算）', value: H0, unit: 'mm', d: 1 },
            { label: '螺旋角 α（5°~9°为宜）', value: alpha, unit: '°', d: 2 }
          ] },
          { title: '刚度与变形', rows: [
            { label: '理论刚度 k=F₂/λ₂', value: k, unit: 'N/mm', d: 3 },
            { label: '实际刚度（圆整圈数后）', value: kReal, unit: 'N/mm', d: 3, hl: true },
            { label: '最小载荷变形 λ₁', value: lam1, unit: 'mm', d: 2 },
            { label: 'λ₂ 时实际载荷', value: Fmin, unit: 'N', d: 1 },
            { label: '稳定性细长比 b=H₀/D₂', value: b, d: 2, hl: true }
          ] }
        ],
        verdict: {
          level: (stable && tauCheck <= tauAllow) ? 'ok' : 'warn',
          text: (tauCheck <= tauAllow ? '强度满足（τ=' + fmt(tauCheck, 1) + '≤[τ]）' : '强度不足（τ=' + fmt(tauCheck, 1) + '＞[τ]=' + fmt(tauAllow) + '）') +
                (stable ? '，稳定性 b=' + fmt(b, 2) + ' ≤ 5.3' : '；稳定性不足：b=' + fmt(b, 2) + ' > 5.3，弹簧可能失稳'),
          note: '细长比许用值：两端固定 5.3、一端固定一端回转 3.7、两端回转 2.6；超限时应加导杆或导套。'
        },
        notes: [
          '簧丝直径按 GB/T 1358 第一系列圆整；圈数尾数取 0.5 圈。',
          '节距 t 的估算采用 t = d + λ₂/n + δ（δ≈0.1d 余隙），并保证在最大压缩时仍有少量间隙。',
          '碳素弹簧钢丝（B/C级）σb 随直径增大而降低（GB/T 4357），许用切应力按 [τ]=0.5σb（III类）/0.4σb（II类）/0.3σb（I类）随选径自动取值；合金钢（60Si2Mn、50CrVA）油淬火后 [τ] 按类别系数取定值。'
        ]
      };
    },
    formulas: [
      'K = (4C-1)/(4C-4) + 0.615/C（曲度系数，Wahl）',
      'd ≥ 1.6√(K·C·F₂/[τ])；碳素钢丝 [τ]=0.5σb(III)/0.4σb(II)/0.3σb(I)，σb 查 GB/T 4357',
      'n = G·d⁴/(8·D₂³·k)，k = F₂/λ₂',
      'H₀ ≈ n·t + 1.5d（两端磨平），t = d + λ₂/n + 0.1d',
      '稳定条件：b = H₀/D₂ ≤ 5.3（两端固定）'
    ],
    reference: 'GB/T 23935-2022《圆柱螺旋弹簧设计计算》、GB/T 1358《圆柱螺旋弹簧尺寸系列》、GB/T 4357-2009《冷拉碳素弹簧钢丝》；《机械设计》第九版 第十六章。'
  });
})();
