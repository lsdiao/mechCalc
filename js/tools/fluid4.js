/* =========================================================
 * 密封(O形圈) + 水系统(水泵选型) 计算工具
 * 1. O形圈计算（sealing-o-ring）—— connect
 *    按沟槽尺寸计算压缩量/压缩率/适用密封压力（ISO 3601-2 沟槽设计原则）
 * 2. 水泵选型（water-pump）—— fluid
 *    由流量 Q、扬程 H 求轴功率 P=ρgQH/η 并圆整电机功率（选型）
 *
 * 说明：原站 对应页面（calculation_sealingsolutions.html、
 *       calculation_watersystemcalculation.html）为"在线工具导航页"，
 *       页面仅外链第三方工具（特瑞堡/Parker/O 圈重量计算器、CNP/凯泉/格兰富选型），
 *       无内嵌计算表单与专属计算 JS。本文件按任务给定公式与常用工程方法实现，
 *       压缩率推荐区间与许用压力表参照《机械设计手册》密封篇 / ISO 3601。
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  /* ---------- O形圈：密封形式 -> 推荐压缩率范围 %（来源：《机械设计手册》密封篇 / ISO 3601 沟槽设计） ---------- */
  var ORING_RANGE = {
    static: { min: 15, max: 25, rec: '15%~25%', desc: '静密封' },
    recip:  { min: 8,  max: 15, rec: '8%~15%',  desc: '往复动密封' },
    rotary: { min: 5,  max: 10, rec: '5%~10%',  desc: '旋转动密封' }
  };
  /* 压缩率 -> 可耐受密封压力（静密封经验表，来源：密封设计手册） */
  var ORING_PRESSURE = [
    { min: 22, p: '≤ 35 MPa（高压密封，建议加装挡圈/支承环）' },
    { min: 18, p: '≤ 25 MPa（中高压）' },
    { min: 12, p: '≤ 16 MPa（一般密封压力）' },
    { min: 8,  p: '≤ 8 MPa（轻微密封，仅适宜低压）' },
    { min: -999, p: '< 5 MPa（压缩不足，密封不可靠）' }
  ];
  /* O形圈线径标准系列 mm（ISO 3601-1 / GB/T 3452.1） */
  App.registerTool({
    id: 'sealing-o-ring',
    name: 'O形圈计算器',
    category: 'connect',
    keywords: 'O形圈 密封 压缩率 压缩量 沟槽 密封压力 线径 GB/T 3452 ISO 3601',
    brief: '按沟槽尺寸计算 O 形圈压缩量、压缩率与适用密封压力，校核沟槽填充率。',
    doc: '按 ISO 3601-2 / GB/T 3452.1 沟槽设计原则，由<b>线径 d₀</b> 与<b>沟槽深度 h</b> 计算<b>压缩量 δ=d₀-h</b> 与<b>压缩率 ε=δ/d₀</b>，据密封形式（静/往复/旋转）对照推荐压缩率区间判定合理性，并由压缩率给出可耐受的<b>适用密封压力</b>；同时校核压缩后 O 形圈截面在沟槽内的<b>填充率</b>（应留余量，一般 ≤ 90%）。',
    inputs: [
      { key: 'sealType', label: '密封形式', group: '密封与沟槽参数（ISO 3601-2）', type: 'segment', options: [
        { v: 'static', t: '静密封' }, { v: 'recip', t: '往复动密封' }, { v: 'rotary', t: '旋转动密封' }
      ] },
      { key: 'grooveType', label: '沟槽形式', group: '密封与沟槽参数（ISO 3601-2）', type: 'segment', options: [
        { v: 'radial', t: '径向沟槽' }, { v: 'axial', t: '轴向沟槽' }
      ] },
      { key: 'd0', label: 'O形圈线径 d₀', group: '密封与沟槽参数（ISO 3601-2）', type: 'number', unit: 'mm', default: 3.53, step: 'any', hint: '标准线径 1.8/2.65/3.53/5.3/7.0 mm' },
      { key: 'h', label: '沟槽深度 h', group: '密封与沟槽参数（ISO 3601-2）', type: 'number', unit: 'mm', default: 2.9, step: 'any', hint: '径向沟槽为槽底到配合面的最小距离' },
      { key: 'b', label: '沟槽宽度 b', group: '密封与沟槽参数（ISO 3601-2）', type: 'number', unit: 'mm', default: 4.7, step: 'any', hint: '轴向沟槽取槽宽即可' },
      { key: 'p', label: '工作压力 p', group: '工作条件', type: 'number', unit: 'MPa', default: 10, step: 'any' }
    ],
    compute: function (v) {
      var d0 = +v.d0, h = +v.h, b = +v.b, p = +v.p;
      if (!(d0 > 0) || !(h > 0)) return { error: '请输入有效的线径与沟槽深度' };
      if (h >= d0) return { error: '沟槽深度 h 不得大于等于线径 d₀，否则无压缩量' };
      var delta = d0 - h;                 // 压缩量 mm
      var eps = delta / d0 * 100;         // 压缩率 %
      var Aring = Math.PI * d0 * d0 / 4;  // O形圈截面面积 mm²
      var Agroove = b * h;                // 沟槽截面面积 mm²
      var fill = Aring / Agroove * 100;   // 填充率 %
      var range = ORING_RANGE[v.sealType] || ORING_RANGE.static;
      // 压缩率 -> 适用密封压力
      var rated = '';
      for (var i = 0; i < ORING_PRESSURE.length; i++) {
        if (eps >= ORING_PRESSURE[i].min) { rated = ORING_PRESSURE[i].p; break; }
      }
      // 压缩率判定
      var level = eps >= range.min - 1e-9 && eps <= range.max + 1e-9 ? 'ok' : (eps < range.min ? 'warn' : 'bad');
      var marginMax = d0 - (range.max / 100) * d0;  // 满足上限所需的沟槽深度下限
      return {
        sections: [
          { title: '压缩量', rows: [
            { label: '压缩量 δ=d₀-h', value: delta, unit: 'mm', d: 2, hl: true },
            { label: '压缩率 ε=δ/d₀', value: eps, unit: '%', d: 2, hl: true },
            { label: '该密封形式推荐压缩率', value: range.rec, unit: '', hl: true }
          ] },
          { title: '适用密封压力', rows: [
            { label: '由压缩率确定的适用压力', value: rated, unit: '', d: 0, hl: true },
            { label: '输入工作压力 p', value: p, unit: 'MPa' },
            { label: eps >= ratingFloor(eps) ? '压力校核' : '压力校核', value: pOk(p, eps) ? '满足' : '不足，需提高压缩率', unit: '', d: 0, hl: true }
          ] },
          { title: '沟槽校核', rows: [
            { label: 'O形圈截面面积 πd₀²/4', value: Aring, unit: 'mm²', d: 2 },
            { label: '沟槽截面面积 b·h', value: Agroove, unit: 'mm²', d: 2 },
            { label: '填充率 Aring/(b·h)', value: fill, unit: '%', d: 2, hl: true },
            { label: fill > 95 ? '填充率判定' : '填充率判定', value: fill > 95 ? '过大，易挤出或损坏' : (fill > 85 ? '偏大，建议加大槽宽' : '合适（留有余量）'), unit: '', d: 0 }
          ] }
        ],
        verdict: {
          level: level,
          text: level === 'ok'
            ? '压缩率 ' + fmt(eps, 2) + '% 处于' + range.desc + '推荐区间 ' + range.rec + '，密封设计合理'
            : (eps < range.min
                ? '压缩率 ' + fmt(eps, 2) + '% 低于' + range.desc + '下限，密封不可靠，建议沟槽深度 ≤ ' + fmt(marginMax, 2) + ' mm'
                : '压缩率 ' + fmt(eps, 2) + '% 超过' + range.desc + '上限 ' + range.rec + '，压缩过大易使 O 形圈应力松弛/切断，应加深沟槽'),
          note: '高压（≥16 MPa）或存在脉冲时应加装挡圈/支承环；动密封还应保证 1~2 圈的润滑油膜。'
        },
        notes: [
          '压缩量 δ = d₀ - h；压缩率 ε = δ/d₀ × 100%。',
          '推荐压缩率：静密封 15~25%，往复动密封 8~15%，旋转动密封 5~10%（《机械设计手册》密封篇）。',
          '槽宽 b 取槽底宽度（含圆角后的名义宽）；轴向密封时 b 为槽宽、h 为沿轴向的槽深。',
          '填充率 = O形圈截面面积 / 沟槽截面面积，一般 ≤ 85%~90%，否则易被挤出（extrusion）。',
          '适用密封压力随压缩率提高而增大，同时需兼顾 O 形圈材料硬度（~邵氏 70A）与工作温度。'
        ]
      };
    },
    formulas: [
      '压缩量 δ = d₀ - h',
      '压缩率 ε = δ/d₀ × 100%',
      '填充率 = (πd₀²/4) / (b·h)',
      '适用密封压力由 ε 查表（静密封经验表）'
    ],
    reference: 'ISO 3601-1/3601-2、GB/T 3452.1《液压气动用 O 形橡胶密封圈》；《机械设计手册》密封篇。'
  });

  /* ---------- 水泵：根据工作压力是否高于压缩率对应的许用压力判定 ---------- */
  function ratingFloor(eps) {
    // 由 ORING_PRESSURE 推出的压力-压缩率下限近似（来源：密封手册经验）
    if (eps >= 22) return 35; if (eps >= 18) return 25; if (eps >= 12) return 16;
    if (eps >= 8) return 8; return 5;
  }
  function pOk(p, eps) { return p <= ratingFloor(eps); }

  /* ---------- 水泵选型 ---------- */
  var PUMP_MOTOR_KW = [0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 185, 200, 250, 315, 355];
  /* 轴功率 -> 配套电机功率储备系数 K（来源：《机械设计手册》泵篇，吸水管路常规） */
  function pumpK(PkW) {
    if (PkW < 1) return 1.5;       // 小功率大储备
    if (PkW < 5) return 1.25;
    if (PkW < 50) return 1.15;
    return 1.1;                    // 大功率
  }

  App.registerTool({
    id: 'water-pump',
    name: '水泵选型',
    category: 'fluid',
    keywords: '水泵 选型 扬程 流量 轴功率 电机功率 比转速 泵',
    brief: '由流量 Q、扬程 H 计算轴功率 P=ρgQH/η 并圆整配套电机功率，输出泵型建议。',
    doc: '按<b>轴功率 P=ρgQH/η</b> 计算水泵所需功率：Q 为体积流量、H 为扬程、ρ 为介质密度、η 为泵效率；再乘以<b>安全储备系数 K</b> 圆整到标准电机功率，实现<b>水泵选型</b>；同时给出<b>比转速</b>用于判断泵型式与效率参考。',
    inputs: [
      { key: 'Q', label: '流量 Q', group: '工况参数', type: 'number', unit: 'm³/h', default: 15, step: 'any' },
      { key: 'H', label: '扬程 H', group: '工况参数', type: 'number', unit: 'm', default: 30, step: 'any' },
      { key: 'rho', label: '介质密度 ρ', group: '工况参数', type: 'number', unit: 'kg/m³', default: 1000, step: 'any', hint: '清水≈1000 kg/m³' },
      { key: 'eta', label: '泵效率 η', group: '工况参数', type: 'number', default: 0.7, step: 'any', hint: '离心泵 0.6~0.85' },
      { key: 'n', label: '转速 n', group: '工况参数', type: 'number', unit: 'r/min', default: 1450, step: 'any' }
    ],
    compute: function (v) {
      var Q = +v.Q, H = +v.H, rho = +v.rho, eta = +v.eta, n = +v.n;
      if (!(Q > 0) || !(H > 0)) return { error: '请输入有效的流量与扬程' };
      if (!(eta > 0 && eta <= 1)) return { error: '泵效率 η 应在 (0,1] 之间' };
      var g = 9.81;
      var Qs = Q / 3600;                       // m³/h -> m³/s
      var Pw = rho * g * Qs * H / eta;         // 轴功率 W
      var PkW = Pw / 1000;                     // 轴功率 kW
      var K = pumpK(PkW);                      // 储备系数
      var Pmotor = PkW * K;                    // 所需电机功率
      var sel = null;
      for (var i = 0; i < PUMP_MOTOR_KW.length; i++) if (PUMP_MOTOR_KW[i] >= Pmotor - 1e-9) { sel = PUMP_MOTOR_KW[i]; break; }
      if (sel === null) sel = Math.ceil(Pmotor);
      // 比转速 ns = 3.65·n√Q / H^(3/4)，Q 取双吸时按半流量，单吸直接用
      var ns = n > 0 ? 3.65 * n * Math.sqrt(Qs) / Math.pow(H, 0.75) : 0;
      var pumpType = ns < 30 ? '容积/高扬程小流量类' : (ns < 80 ? '低速离心泵' : (ns < 150 ? '正常转速离心泵' : (ns < 300 ? '高速/混流式' : '轴流式')));
      return {
        sections: [
          { title: '水力参数', rows: [
            { label: '体积流量 Q', value: Q, unit: 'm³/h', hl: true },
            { label: '扬程 H', value: H, unit: 'm', hl: true },
            { label: '质量流量 qm=ρQ', value: rho * Qs, unit: 'kg/s', d: 2 }
          ] },
          { title: '功率计算', rows: [
            { label: '轴功率 P=ρgQH/η', value: PkW, unit: 'kW', d: 3, hl: true },
            { label: '储备系数 K', value: K, d: 2 },
            { label: '所需配套功率 P·K', value: Pmotor, unit: 'kW', d: 3, hl: true },
            { label: '圆整标准电机功率', value: sel, unit: 'kW', hl: true }
          ] },
          { title: '泵型与比转速', rows: [
            { label: '比转速 n_s=3.65n√Q/H^¾', value: ns, d: 1, hl: true },
            { label: '泵型判断', value: pumpType, d: 0 }
          ] }
        ],
        verdict: {
          level: PkW > 0 ? 'ok' : 'bad',
          text: '选配 ' + fmt(sel) + ' kW 电机（轴功率 ' + fmt(PkW, 3) + ' kW，储备 ' + fmt(K, 2) + '），泵型倾向：' + pumpType,
          note: '实际选型应校核流量-扬程匹配工作点；比转速偏大（>300）宜选轴流泵，偏小（<30）建议容积泵。'
        },
        notes: [
          '轴功率 P = ρgQH/η（Q:m³/s，P:W）；界面 Q 以 m³/h 输入，换算 Q(m³/s)=Q(m³/h)/3600。',
          '配套电机功率 = 轴功率 × 储备系数 K（小泵 K=1.25~1.5，大泵 K=1.1~1.15）。',
          '比转速 n_s=3.65n√Q/H^¾，用于判断泵型与最高效率区（离心<150、混流150~300、轴流>300）。',
          '管路系统应计入吸上高度、管路沿程/局部阻力损失，扬程取系统总需要扬程。'
        ]
      };
    },
    formulas: [
      'P = ρgQH/η（W，Q 用 m³/s）',
      'P电机 = P × K，圆整到标准电机功率',
      'n_s = 3.65·n·√Q / H^¾（Q:m³/s，H:m）'
    ],
    reference: '《机械设计手册》泵与风机篇；GB/T 5662 离心泵技术条件；ISO 9906 泵水力性能试验。'
  });
})();