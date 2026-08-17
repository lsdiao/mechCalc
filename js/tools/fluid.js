/* =========================================================
 * 液压与气压类工具
 * 1. 液压油缸计算
 * 2. 气缸最小缸径计算
 * 依据：GB/T 2348 液压缸缸径/杆径系列、JB/T 标准
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  /* GB/T 2348 液压缸内径系列 */
  var BORE_SERIES = [25, 32, 40, 50, 63, 80, 100, 125, 160, 180, 200, 250, 320, 400, 500];
  /* 气缸标准缸径系列 */
  var PNEU_BORE = [32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320];

  /* ============ 1. 液压油缸计算 ============ */
  App.registerTool({
    id: 'hydraulic-cylinder',
    name: '液压油缸计算',
    category: 'fluid',
    keywords: '液压缸 油缸 推力 拉力 速比 流量 压力 缸径 活塞杆',
    brief: '液压油缸推/拉力、运行速度、流量与功率计算，支持背压工况与缸径圆整。',
    doc: '按 GB/T 2348 缸径/杆径系列计算液压缸<b>无杆腔推力与有杆腔拉力</b>（计及背压与机械效率）、双方向运行速度、所需流量与液压功率，并可反算一定压力下所需缸径。',
    inputs: [
      { key: 'D', label: '缸径 D', group: '油缸参数（GB/T 2348）', type: 'select', options: BORE_SERIES.map(function (d) { return { v: d, t: d + ' mm' }; }), default: '63' },
      { key: 'rodType', label: '杆径 d', group: '油缸参数（GB/T 2348）', type: 'segment', options: [
        { v: '0.5', t: 'd≈0.5D（速比1.33）' }, { v: '0.7', t: 'd≈0.7D（速比2.0）' }
      ] },
      { key: 'rodMan', label: '杆径 d 手动输入', group: '油缸参数（GB/T 2348）', type: 'number', unit: 'mm', default: 32, step: 'any', hint: '填写后优先于上面的比例选择' },
      { key: 'p1', label: '进油压力 p₁', group: '工况参数', type: 'number', unit: 'MPa', default: 10, step: 'any' },
      { key: 'p2', label: '回油背压 p₂', group: '工况参数', type: 'number', unit: 'MPa', default: 0.5, step: 'any', hint: '无背压填 0' },
      { key: 'Q', label: '输入流量 Q', group: '工况参数', type: 'number', unit: 'L/min', default: 30, step: 'any' },
      { key: 'etaM', label: '机械效率 ηm', group: '工况参数', type: 'number', default: 0.95, step: 'any' },
      { key: 'etaV', label: '容积效率 ηv', group: '工况参数', type: 'number', default: 0.98, step: 'any' },
      { key: 'stroke', label: '行程 S', group: '工况参数', type: 'number', unit: 'mm', default: 300, step: 'any' }
    ],
    compute: function (v) {
      var D = +v.D, p1 = +v.p1, p2 = +v.p2, Q = +v.Q, etaM = +v.etaM, etaV = +v.etaV, stroke = +v.stroke;
      if (!(D > 0) || !(p1 > 0) || !(Q > 0)) return { error: '请输入有效缸径、压力与流量' };
      var d = (+v.rodMan > 0) ? +v.rodMan : Math.round(D * (+v.rodType));
      var A1 = Math.PI * D * D / 4;               // 无杆腔面积
      var A2 = Math.PI * (D * D - d * d) / 4;     // 有杆腔面积
      var F1 = (p1 * A1 - p2 * A2) * etaM;        // 推力 N (MPa·mm²=N)
      var F2 = (p1 * A2 - p2 * A1) * etaM;        // 拉力 N
      var v1 = Q * 1000 / 60 / A1 * etaV;         // 伸出速度 mm/s
      var v2 = Q * 1000 / 60 / A2 * etaV;         // 缩回速度 mm/s
      var phi = A1 / A2;                          // 速比
      var t1 = stroke / v1, t2 = stroke / v2;     // 动作时间 s
      var PkW = p1 * Q / 60 / etaM;               // 液压功率 kW (MPa·L/min /60 = kW)
      var strokeVol = A1 * stroke / 1e6;          // 无杆腔容积 L
      var rodSideVol = A2 * stroke / 1e6;
      return {
        sections: [
          { title: '面积与几何', rows: [
            { label: '无杆腔面积 A₁=πD²/4', value: A1, unit: 'mm²', d: 1 },
            { label: '有杆腔面积 A₂=π(D²-d²)/4', value: A2, unit: 'mm²', d: 1 },
            { label: '活塞杆直径 d', value: d, unit: 'mm', hl: true },
            { label: '面积比（速比φ）', value: phi, d: 3 }
          ] },
          { title: '输出力', rows: [
            { label: '推力（无杆腔进油）F₁', value: F1, unit: 'N', hl: true },
            { label: '推力 F₁', value: F1 / 1000, unit: 'kN', d: 3, hl: true },
            { label: '拉力（有杆腔进油）F₂', value: F2, unit: 'N', d: 1 },
            { label: '拉力 F₂', value: F2 / 1000, unit: 'kN', d: 3 }
          ] },
          { title: '速度与流量', rows: [
            { label: '伸出速度 v₁', value: v1, unit: 'mm/s', d: 2, hl: true },
            { label: '缩回速度 v₂', value: v2, unit: 'mm/s', d: 2 },
            { label: '伸出时间（全行程）', value: t1, unit: 's', d: 2 },
            { label: '缩回时间（全行程）', value: t2, unit: 's', d: 2 },
            { label: '无杆腔行程容积', value: strokeVol, unit: 'L', d: 3 },
            { label: '有杆腔行程容积', value: rodSideVol, unit: 'L', d: 3 }
          ] },
          { title: '功率', rows: [
            { label: '液压输入功率 P=p₁Q/60ηm', value: PkW, unit: 'kW', d: 3, hl: true },
            { label: '伸出方向输出功率', value: F1 * v1 / 1000, unit: 'W', d: 1 }
          ] }
        ],
        verdict: {
          level: 'ok',
          text: 'φ' + fmt(D) + '×' + fmt(d) + ' 油缸：推力 ' + fmt(F1 / 1000) + ' kN，拉力 ' + fmt(F2 / 1000) + ' kN，伸出速度 ' + fmt(v1) + ' mm/s',
          note: '活塞杆受压且行程较长时，需按欧拉公式校核活塞杆稳定性。'
        },
        notes: [
          '推力 F₁ = (p₁A₁ - p₂A₂)·ηm；拉力 F₂ = (p₁A₂ - p₂A₁)·ηm。',
          '杆径系列 GB/T 2348：速比 1.33 取 d≈0.5D，速比 2 取 d≈0.7D，耐压反靠时取大杆径。',
          '长行程（L＞10D）受压活塞杆需校核纵向弯曲稳定性（欧拉载荷或雅辛斯基公式）。'
        ]
      };
    },
    formulas: [
      'A₁ = πD²/4；A₂ = π(D²-d²)/4',
      'F₁ = (p₁A₁-p₂A₂)ηm；F₂ = (p₁A₂-p₂A₁)ηm',
      'v = Q/(A)（Q:L/min → mm/s：Q×1000/60/A）',
      'P(kW) = p(MPa)×Q(L/min)/60'
    ],
    reference: 'GB/T 2348《流体传动系统及元件 缸径及活塞杆直径》；《液压工程设计手册》。'
  });

  /* ============ 2. 气缸最小缸径计算 ============ */
  App.registerTool({
    id: 'pneumatic-cylinder',
    name: '气缸最小缸径计算',
    category: 'fluid',
    keywords: '气缸 缸径 气压 夹紧力 输出力 负载率 耗气量',
    brief: '按负载力、气压与负载率计算气缸最小缸径并圆整到标准缸径，附耗气量估算。',
    doc: '气缸的<b>理论输出力</b>随负载率 η 打折扣（运动惯性越大取值越低），由 F/η 求所需理论输出力，反算<b>最小缸径</b>并按标准系列圆整；拉力工况还需计入活塞杆面积。',
    inputs: [
      { key: 'F', label: '负载（夹紧）力 F', group: '负载与气压', type: 'number', unit: 'N', default: 500, step: 'any' },
      { key: 'dir', label: '作用方向', group: '负载与气压', type: 'segment', options: [
        { v: 'push', t: '推（无杆腔进气）' }, { v: 'pull', t: '拉（有杆腔进气）' }
      ] },
      { key: 'p', label: '工作气压 p', group: '负载与气压', type: 'number', unit: 'MPa', default: 0.5, step: 'any', hint: '常规 0.4~0.7 MPa' },
      { key: 'load', label: '负载率 η（气缸效率折减）', group: '负载与气压', type: 'select', options: [
        { v: '0.7', t: '0.65~0.75 静负载 / 低速夹紧' },
        { v: '0.5', t: '0.4~0.5 中速运动（100~500mm/s）' },
        { v: '0.35', t: '0.3~0.4 高速冲击 / 惯性负载' }
      ], default: '0.5' },
      { key: 'rodRatio', label: '杆径估算比例（拉力工况）', group: '负载与气压', type: 'select', options: [
        { v: '0.3', t: 'd≈0.3D' }, { v: '0.5', t: 'd≈0.5D' }
      ], default: '0.3' },
      { key: 'stroke', label: '行程 S', group: '耗气量估算', type: 'number', unit: 'mm', default: 100, step: 'any' },
      { key: 'n', label: '每分钟动作次数', group: '耗气量估算', type: 'number', unit: '次/min', default: 30, step: 'any' }
    ],
    compute: function (v) {
      var F = +v.F, p = +v.p, eta = +v.load, rodRatio = +v.rodRatio;
      if (!(F > 0)) return { error: '请输入负载力 F' };
      if (!(p > 0.05)) return { error: '工作气压过低（最低约 0.1 MPa）' };
      var F0 = F / eta;                             // 所需理论输出力
      var dCalc;
      if (v.dir === 'push') {
        dCalc = Math.sqrt(4 * F0 / (Math.PI * p * 1e6)) * 1000; // mm
      } else {
        // F0 = p·π(D²-d²)/4，d=kD → D²(1-k²)=4F0/(πp)
        dCalc = Math.sqrt(4 * F0 / (Math.PI * p * 1e6 * (1 - rodRatio * rodRatio))) * 1000;
      }
      var bore = null;
      for (var i = 0; i < PNEU_BORE.length; i++) if (PNEU_BORE[i] >= dCalc) { bore = PNEU_BORE[i]; break; }
      if (bore === null) { bore = Math.ceil(dCalc / 50) * 50; }
      var rod = Math.round(bore * rodRatio);
      var A1 = Math.PI * bore * bore / 4;
      var A2 = Math.PI * (bore * bore - rod * rod) / 4;
      var Ause = v.dir === 'push' ? A1 : A2;
      var Fout = p * Ause * eta;                    // 实际输出力
      var margin = Fout / F;
      // 耗气量：每往复单腔，压缩空气耗量 q=活塞面积×行程×次数（标准状态折算）
      var stroke = +v.stroke, n = +v.n || 0;
      var qFree = (A1 + A2) * stroke / 1e6 * n * (p + 0.1013) / 0.1013; // L/min（标态近似）
      return {
        sections: [
          { title: '理论力需求', rows: [
            { label: '所需理论输出力 F₀=F/η', value: F0, unit: 'N', hl: true },
            { label: '计算最小缸径', value: dCalc, unit: 'mm', d: 2, hl: true },
            { label: '圆整标准缸径', value: bore, unit: 'mm', hl: true },
            { label: '活塞杆直径 d', value: rod, unit: 'mm' }
          ] },
          { title: '实际输出校验', rows: [
            { label: v.dir === 'push' ? '作用面积 A₁' : '作用面积 A₂', value: Ause, unit: 'mm²', d: 1 },
            { label: '实际输出力', value: Fout, unit: 'N', hl: true },
            { label: '力裕度 Fout/F', value: margin, d: 2, hl: true },
            { label: '无杆腔面积 A₁', value: A1, unit: 'mm²', d: 1 },
            { label: '有杆腔面积 A₂', value: A2, unit: 'mm²', d: 1 }
          ] },
          { title: '耗气量估算（标准状态）', rows: [
            { label: '每往复一次耗气', value: (A1 + A2) * stroke / 1e6 * (p + 0.1013) / 0.1013, unit: 'L', d: 3 },
            { label: '每分钟耗气量', value: qFree, unit: 'L/min', d: 2 },
            { label: '折合 m³/h', value: qFree * 60 / 1000, unit: 'm³/h', d: 3 }
          ] }
        ],
        verdict: {
          level: margin >= 1.15 ? 'ok' : 'warn',
          text: margin >= 1.15
            ? '选缸径 φ' + bore + ' mm：输出力 ' + fmt(Fout) + ' N，裕度 ' + fmt(margin, 2) + '，满足要求'
            : '选缸径 φ' + bore + ' mm 裕度仅 ' + fmt(margin, 2) + '，建议加大一档缸径或提高气压',
          note: '一般建议裕度 ≥ 1.15~1.3，供气压力波动与摩擦损耗会吃掉部分理论力。'
        },
        notes: [
          '气缸负载率（效率）η：静载夹紧 0.65~0.75、一般运动 0.4~0.5、高速冲击 0.3~0.4。',
          '耗气量按理想气体折算到标准大气压状态，供气系统按最大耗气量×同期系数配置气源。',
          '气缸速度需由节流阀控制；要求精确低速平稳时建议选带液压缓冲器或低速气缸。'
        ]
      };
    },
    formulas: [
      'F₀ = F/η（η 为负载率）',
      '推：D ≥ √(4F₀/(πp))；拉：D ≥ √(4F₀/(πp(1-k²)))，k=d/D',
      '耗气量 q = (A₁+A₂)·S·n·(p+0.101)/0.101（折标态）'
    ],
    reference: 'SMC《气动元件选型手册》、Festo 气动技术资料；《机械设计手册》气压传动篇。'
  });
})();
