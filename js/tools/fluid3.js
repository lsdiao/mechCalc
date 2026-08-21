/* =========================================================
 * 气压传动与缓冲器类工具（原站 复刻）
 * 1. 气动手指（气爪）夹紧力计算  pneumatic-finger
 * 2. 气缸耗气量计算（最大/平均） cylinder-consumption
 * 3. 气动回路计算               pneumatic-circuit
 * 4. 真空吸盘与真空发生器选型    vacuum-suction
 * 5. 油压缓冲器选型             hydraulic-buffer
 * 6. 气动供应商在线计算工具      cheli-air
 * 公式与默认值均按 原站 对应计算页面 1:1 复刻。
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  var SAFE = 1e-9;
  var P_ATM = 0.101325;   // MPa 标准大气压

  /* ============ 1. 气动手指（气爪）夹紧力计算 ============ */
  App.registerTool({
    id: 'pneumatic-finger',
    name: '气动手指夹紧力计算',
    category: 'fluid',
    keywords: '气动手指 气爪 夹紧力 机械锁紧 摩擦锁紧 V形 工件 安全系数',
    brief: '按工件质量、加速度与安全系数计算气动手指（气爪）所需的最小夹紧力，支持机械锁紧/摩擦锁紧/V 形气爪复合工况。',
    doc: '取工件在极限加速度下的<b>当量负载 W=m(g+a)</b>，再按爪数 n 与工况（机械锁紧、摩擦锁紧除以摩擦系数 μ、V 形气爪乘以 tanα）放大/折减得到单个夹持点所需<b>最小夹紧力</b>。本工具依 原站 气动手指夹紧力计算页面复刻。',
    inputs: [
      { key: 'operatingCondition', label: '工况', group: '工况选择', type: 'select', options: [
        { v: '二爪机械锁紧', t: '二爪机械锁紧' },
        { v: '二爪机械锁紧带V形气爪夹具', t: '二爪机械锁紧带V形气爪夹具' },
        { v: '二爪摩擦锁紧', t: '二爪摩擦锁紧' },
        { v: '二爪摩擦锁紧带V形气爪夹具', t: '二爪摩擦锁紧带V形气爪夹具' },
        { v: '三爪机械锁紧', t: '三爪机械锁紧' },
        { v: '三爪机械锁紧带V形气爪夹具', t: '三爪机械锁紧带V形气爪夹具' },
        { v: '三爪摩擦锁紧', t: '三爪摩擦锁紧' }
      ], default: '二爪机械锁紧' },
      { key: 'workpieceMass', label: '工件质量 m', group: '工件与负载', type: 'number', unit: 'kg', default: 1, step: 0.1 },
      { key: 'acceleration', label: '加速度 a', group: '工件与负载', type: 'number', unit: 'm/s²', default: 4, step: 0.1 },
      { key: 'safetyFactor', label: '安全系数 S', group: '工件与负载', type: 'number', default: 4, step: 0.1 },
      { key: 'alpha', label: 'V 形夹角 α', group: '复合工况参数', type: 'number', unit: '°', default: 60, step: 1, hint: '仅“带 V 形气爪夹具”工况生效' },
      { key: 'miu', label: '摩擦系数 μ', group: '复合工况参数', type: 'number', default: 0.2, step: 0.1, hint: '仅“摩擦锁紧”类工况生效' }
    ],
    compute: function (v) {
      var m = +v.workpieceMass, a = +v.acceleration, S = +v.safetyFactor;
      if (!(m > 0)) return { error: '请输入工件质量 m' };
      var cond = v.operatingCondition || '二爪机械锁紧';
      var n = /三爪/.test(cond) ? 3 : 2;                     // 夹爪爪数
      var isFriction = /摩擦/.test(cond);                     // 摩擦锁紧
      var isV = /V形|V 形/i.test(cond);                       // 带 V 形气爪夹具
      var g = 10;                                             // 原站取 g=10 m/s²
      var mu = (+v.miu > 0) ? +v.miu : 0.2;
      var alphaDeg = (+v.alpha > 0) ? +v.alpha : 60;
      var W = m * (g + a) * S;                                // 当量负载（机械锁紧理论夹紧力）
      var F;
      if (isV) {
        // 机械锁紧带V形: W·tanα/n；摩擦锁紧带V形: W·tanα/(n·μ)
        F = isFriction ? W * Math.tan(alphaDeg * Math.PI / 180) / (n * mu)
                       : W * Math.tan(alphaDeg * Math.PI / 180) / n;
      } else if (isFriction) {
        // 摩擦锁紧: W/(n·μ)
        F = W / (n * mu);
      } else {
        // 纯机械锁紧（二/三爪）：W，不除爪数
        F = W;
      }
      var forceClass = isFriction ? '摩擦锁紧' : '机械锁紧' + (isV ? '+V 形' : '');
      return {
        sections: [
          { title: '当量负载', rows: [
            { label: '当量负载 W=m(g+a)', value: W, unit: 'N', hl: true },
            { label: '加速度当量 (g+a)', value: g + a, unit: 'm/s²', d: 2 },
            { label: '夹爪数 n', value: n, unit: '爪' }
          ] },
          { title: '夹紧力校核', rows: [
            { label: '所需最小夹紧力 F', value: F, unit: 'N', hl: true },
            { label: '计算公式', value: (isFriction ? 'W/(n·μ)' : (isV ? 'W·tanα/n' : 'W')) },
            { label: '工况', value: forceClass }
          ] }
        ],
        verdict: {
          level: 'ok',
          text: '(' + fmt(n) + ' 爪 ' + forceClass + ')所需最小夹紧力 ' + fmt(F, 1) + ' N，选型应选用额定夹紧力 ≥ ' + fmt(F, 1) + ' N 的气爪',
          note: '安全系数已计入 S=' + fmt(S, 1) + '；若工件表面油污需取较大 μ 裕度。原站 g 取 10 m/s²。'
        },
        notes: [
          '机械锁紧：F = m(g+a)·S；摩擦锁紧：F = m(g+a)·S/(n·μ)；V 形气爪：F = m(g+a)·S·tanα/n。',
          '摩擦锁紧对工件表面状态敏感，μ 取 0.1~0.2；加装 V 形气爪夹具可显著降低所需夹紧力。',
          '本工具公式与默认值依 原站 气动手指夹紧力计算页（airclawClampingForce）。'
        ]
      };
    },
    formulas: [
      'W = m(g+a)，g=10 m/s²',
      '机械锁紧 F = W·S（不除爪数）；摩擦锁紧 F = W·S/(n·μ)',
      'V 形气爪：机械 F=W·S·tanα/n；摩擦 F=W·S·tanα/(n·μ)'
    ],
    reference: '原站 气动手指夹紧力计算；SMC《气动手指选型》'
  });

  /* ============ 2. 气缸耗气量计算（最大/平均） ============ */
  App.registerTool({
    id: 'cylinder-consumption',
    name: '气缸耗气量计算',
    category: 'fluid',
    keywords: '气缸 耗气量 最大耗气量 平均耗气量 空压机 阀 配管',
    brief: '计算气缸最大耗气量、Cv 值、阀有效截面积，以及计入活塞杆与配管的平均耗气量，用于空压机与阀件选型。',
    doc: '<b>最大耗气量</b>用于选定控制阀、空气处理元件及配管尺寸；<b>平均耗气量</b>用于选用空压机与核算运行成本，两者之差用于选定气罐容积。本工具依 原站 气缸耗气量计算页复刻。',
    inputs: [
      { key: 'cylBore', label: '缸径 D', group: '气缸参数', type: 'number', unit: 'mm', default: 100, step: 1 },
      { key: 'cylRod', label: '活塞杆径 d', group: '气缸参数', type: 'number', unit: 'mm', default: 30, step: 1 },
      { key: 'strokeS', label: '行程 L', group: '气缸参数', type: 'number', unit: 'mm', default: 300, step: 1 },
      { key: 'workingPressure', label: '工作压力 p', group: '工况参数', type: 'number', unit: 'MPa', default: 0.5, step: 0.1 },
      { key: 'actTime', label: '单程动作时间 t', group: '最大耗气量', type: 'number', unit: 's', default: 0.5, step: 0.1 },
      { key: 'actFreq', label: '每分钟往复次数 N', group: '平均耗气量', type: 'number', unit: '次/min', default: 60, step: 0.1 },
      { key: 'hoseID', label: '配管内径 dn', group: '平均耗气量', type: 'number', unit: 'mm', default: 6, step: 0.1 },
      { key: 'hoseLen', label: '配管长度 Lp', group: '平均耗气量', type: 'number', unit: 'mm', default: 4000, step: 1 }
    ],
    compute: function (v) {
      var D = +v.cylBore, d = +v.cylRod, L = +v.strokeS, p = +v.workingPressure;
      if (!(D > 0) || !(L > 0) || !(p > 0)) return { error: '请输入有效缸径、行程与压力' };
      var t = +v.actTime > 0 ? +v.actTime : 0.5;
      var freq = +v.actFreq || 0;
      /* 最大耗气量（依原站系数）：Qmax = K·D²·S·(p+0.102)/t，D/S 用 mm（与原站 int 换算一致） */
      var qMax = 0.0004684 * D * D * L * (p + 0.102) / t;             // L/min
      var areaS = 8.0834e-6 * D * D * L * (p + 0.102) / t;            // 阀有效截面积 mm²·分辨率
      var cV = areaS * 0.0589;                                        // 阀 Cv 值
      /* 平均耗气量：计入活塞杆（有杆腔）与配管容积，折标态 */
      var A_b = Math.PI / 4 * D * D;                                  // 无杆腔面积 mm²
      var A_rod = Math.PI / 4 * (D * D - d * d);                      // 有杆腔面积 mm²
      /* 配管容积（两端，往返均需填充） */
      var A_hose = Math.PI / 4 * v.hoseID * v.hoseID;
      var V_line = A_hose * v.hoseLen;                                // mm³
      var V_total = (A_b + A_rod) * L + 2 * V_line;                   // 每往复总扫气 mm³
      var qCa = V_total / 1e6 * ((p + 0.1013) / 0.1013) * freq;       // L/min
      return {
        sections: [
          { title: '最大耗气量（选阀/配管）', rows: [
            { label: '最大耗气量 Qmax', value: qMax, unit: 'L/min', d: 2, hl: true },
            { label: '阀 Cv 值', value: cV, unit: '', d: 2 },
            { label: '阀有效面积 S', value: areaS, unit: 'mm²', d: 3 }
          ] },
          { title: '平均耗气量（选空压机）', rows: [
            { label: '平均耗气量 Qca（标态）', value: qCa, unit: 'L/min', d: 2, hl: true },
            { label: '单程扫气（前进）', value: A_b * L / 1e6, unit: 'L', d: 4 },
            { label: '单程扫气（后退）', value: A_rod * L / 1e6, unit: 'L', d: 4 },
            { label: '配管容积（往返）', value: 2 * V_line / 1e6, unit: 'L', d: 4 }
          ] }
        ],
        verdict: {
          level: 'ok',
          text: '最大耗气量 ' + fmt(qMax, 1) + ' L/min（Cv ' + fmt(cV, 2) + '），平均耗气量 ' + fmt(qCa, 1) + ' L/min',
          note: '空压机容量按平均耗气量并留 1.5~2 倍余量；阀与配管按最大耗气量选。'
        },
        notes: [
          '最大耗气量 Qmax ∝ D²·S·(p+0.102)/t；平均耗气量计入活塞杆面积与两端配管容积。',
          '本工具公式与默认值依 原站 气缸耗气量计算页（maxGasConsumption / avgGasConsumption）。'
        ]
      };
    },
    formulas: [
      'Qmax = 0.0004684·D²·S·(p+0.102)/t  [L/min]（D、S 单位 mm）',
      'Qca = (A₁+A₂)·S·(p+0.1013)/0.1013 + 2·A_pipe·Lp 折标态×N',
      'Cv ≈ 0.0589·S；S 为阀有效截面积'
    ],
    reference: '原站 气缸耗气量计算；SMC《空压气与阀选型》'
  });

  /* ============ 3. 气动回路计算 ============ */
  App.registerTool({
    id: 'pneumatic-circuit',
    name: '气动回路计算',
    category: 'fluid',
    keywords: '气动回路 气缸推力 耗气量 管路压降 压缩机功率 空压机',
    brief: '气动回路压力：气缸前进/后退推力、标准状态耗气量、管路压降与压缩机功率估算。',
    doc: '对压缩空气驱动系统进行定量分析：<b>气缸推力</b>、<b>标准状态空气消耗量</b>、<b>管路压降（Darcy-Weisbach 可压缩流近似）</b>与<b>压缩机功率估算</b>，覆盖空压机产气→管路输送→气缸做功全过程。本工具依 原站 气动回路计算页复刻。',
    inputs: [
      { key: 'stdBore', label: '标准缸径', group: '气缸参数', type: 'select', options: [
        { v: '32', t: 'φ32mm' }, { v: '40', t: 'φ40mm' }, { v: '50', t: 'φ50mm' },
        { v: '63', t: 'φ63mm' }, { v: '80', t: 'φ80mm' }, { v: '100', t: 'φ100mm' },
        { v: 'custom', t: '自定义' }
      ], default: '63' },
      { key: 'boreDia', label: '缸径 D（自定义）', group: '气缸参数', type: 'number', unit: 'mm', default: 63, step: 1 },
      { key: 'rodDia', label: '活塞杆径 d', group: '气缸参数', type: 'number', unit: 'mm', default: 20, step: 1 },
      { key: 'stroke', label: '行程 L', group: '气缸参数', type: 'number', unit: 'mm', default: 100, step: 10 },
      { key: 'pressure', label: '供气压力 P', group: '工况参数', type: 'number', unit: 'MPa', default: 0.5, step: 0.01 },
      { key: 'efficiency', label: '机械效率 η', group: '工况参数', type: 'number', unit: '%', default: 85, step: 5 },
      { key: 'cycles', label: '循环次数', group: '系统配置', type: 'number', unit: '次/min', default: 10, step: 1 },
      { key: 'cylCount', label: '气缸数量', group: '系统配置', type: 'number', default: 2, step: 1 },
      { key: 'pipeDia', label: '管路内径 dp', group: '管路参数', type: 'number', unit: 'mm', default: 10, step: 0.5 },
      { key: 'pipeLen', label: '管路长度 Lp', group: '管路参数', type: 'number', unit: 'm', default: 5, step: 0.5 }
    ],
    compute: function (v) {
      var D = (v.stdBore === 'custom') ? (+v.boreDia || +v.stdBore) : +v.stdBore;
      var d = +v.rodDia, S = +v.stroke, P = +v.pressure;
      var eta = (+v.efficiency || 85) / 100;
      var cycles = +v.cycles || 0, cnt = +v.cylCount || 1;
      var pipeDia = +v.pipeDia || 10, pipeLen = +v.pipeLen || 5;
      if (!(D > 0) || !(P > 0)) return { error: '请输入有效缸径与供气压力' };
      var P_abs = P + P_ATM;                                         // MPa 绝对压力
      var A_bore = Math.PI / 4 * D * D;                              // 缸径侧面积 mm²
      var A_rod = Math.PI / 4 * (D * D - d * d);                     // 杆侧面积 mm²
      var F_advT = A_bore * P, F_retT = A_rod * P;                   // 理论推力 N（MPa·mm²=N）
      var F_adv = A_bore * P * eta, F_ret = A_rod * P * eta;         // 实际推力 N
      var q_adv = (P_abs / P_ATM) * A_bore * S * 1e-6;               // 前进耗气 NL/行程
      var q_ret = (P_abs / P_ATM) * A_rod * S * 1e-6;                // 后退耗气 NL/行程
      var q_cycle = q_adv + q_ret;                                   // 单循环 NL
      var q_total = q_cycle * cycles * cnt;                          // NL/min
      var P_comp = q_total * P / 100;                                // kW
      /* 管路流速与压降（Darcy-Weisbach, f=0.02, ρstd=1.2 kg/m³） */
      var Ap = Math.PI / 4 * Math.pow(0.001 * pipeDia, 2);           // 管路截面积 m²
      var v_pipe = Ap > 0 ? q_total / 60 * 0.001 * (P_ATM / P_abs) / Ap : 0; // m/s
      var pipeDPa = (pipeLen / (0.001 * pipeDia)) * 0.02
        * ((P_abs / P_ATM) * 1.2 * v_pipe * v_pipe / 2);              // Pa
      var dp_kPa = pipeDPa / 1000;                                   // kPa
      return {
        sections: [
          { title: '气缸推力', rows: [
            { label: '前进推力 F=πD²/4·P·η（实际）', value: F_adv, unit: 'N', hl: true },
            { label: '前进推力（理论）', value: F_advT, unit: 'N', d: 1 },
            { label: '后退推力 F=π(D²-d²)/4·P·η（实际）', value: F_ret, unit: 'N', d: 1 },
            { label: '后退推力（理论）', value: F_retT, unit: 'N', d: 1 },
            { label: '缸径侧受压面积', value: A_bore / 100, unit: 'cm²', d: 3 },
            { label: '杆侧受压面积', value: A_rod / 100, unit: 'cm²', d: 3 }
          ] },
          { title: '耗气量', rows: [
            { label: '单次行程耗气（前进）', value: q_adv, unit: 'NL', d: 4 },
            { label: '单次行程耗气（后退）', value: q_ret, unit: 'NL', d: 4 },
            { label: '单次循环总耗气', value: q_cycle, unit: 'NL', d: 3 },
            { label: '全部气缸所需流量', value: q_total, unit: 'NL/min', d: 2, hl: true }
          ] },
          { title: '管路与功率', rows: [
            { label: '管路流速（估算）', value: v_pipe, unit: 'm/s', d: 2 },
            { label: '管路压降 ΔP=f·L/d·ρv²/2', value: dp_kPa, unit: 'kPa', d: 3 },
            { label: '压缩机功率 P=Q·P/100', value: P_comp, unit: 'kW', d: 3, hl: true }
          ] }
        ],
        verdict: {
          level: v_pipe <= 20 ? 'ok' : 'warn',
          text: '前进推力 ' + fmt(F_adv) + ' N（实际），系统需流量 ' + fmt(q_total, 1) + ' NL/min，压缩机约 ' + fmt(P_comp, 2) + ' kW',
          note: '主管路流速建议控制在 5~10 m/s 以下；空压机选型建议留 1.5~2.0 倍安全余量。'
        },
        notes: [
          '推力 F=πD²/4·P·η（前进），F=π(D²-d²)/4·P·η（后退），P 为表压。',
          '标准耗气量 Q=(P_abs/P_atm)·V，折算到 101.3 kPa 标准大气压。',
          '本工具公式与默认值依 原站 气动回路计算页（pneumaticCircuit / pipeFlowAndPressureCal）。'
        ]
      };
    },
    formulas: [
      'F_adv=πD²/4·P·η；F_ret=π(D²-d²)/4·P·η（N）',
      'Q_std=(P_abs/P_atm)·V（NL/行程）',
      'ΔP=f·(L/d)·(ρ·v²/2)，f=0.02，ρ_act=ρ_std·P_abs/P_atm',
      'P_comp(kW)=Q_total(NL/min)×P(MPa)/100'
    ],
    reference: '原站 气动回路计算；Darcy-Weisbach 压降模型'
  });

  /* ============ 4. 真空吸盘与真空发生器选型 ============ */
  App.registerTool({
    id: 'vacuum-suction',
    name: '真空吸盘与真空发生器',
    category: 'fluid',
    keywords: '真空吸盘 真空发生器 吸附力 吸盘直径 真空度 缓冲罐 反应时间',
    brief: '按运动方式（顶吸/侧吸/平移）计算真空吸盘吸附力、所需吸盘直径与标准规格面积，并由吸盘体积与反应时间反算真空发生器所需流量。',
    doc: '根据<b>运动方式</b>（顶吸提升/顶吸平移/侧吸提升）计算吸附力与<b>吸盘直径</b>，再由吸盘/配管总容积与要求的<b>反应时间</b>反算<b>真空发生器流量 Q1</b> 与真空泵<b>最大流量 Qmax</b>。本工具依 原站 真空吸盘与真空发生器页复刻。',
    inputs: [
      { key: 'motionStyle', label: '运动方式', group: '工况选择', type: 'select', options: [
        { v: '顶吸提升', t: '顶吸提升' }, { v: '顶吸平移', t: '顶吸平移' }, { v: '侧吸提升', t: '侧吸提升' }
      ], default: '顶吸提升' },
      { key: 'workpieceMass', label: '工件质量 m', group: '吸附工况', type: 'number', unit: 'kg', default: 4, step: 0.1 },
      { key: 'acceleration', label: '加速度 a', group: '吸附工况', type: 'number', unit: 'm/s²', default: 5, step: 0.1 },
      { key: 'safetyFactor', label: '安全系数 S', group: '吸附工况', type: 'number', default: 1.5, step: 0.1 },
      { key: 'miu', label: '摩擦系数 μ', group: '吸附工况', type: 'number', default: 0.15, step: 0.01, hint: '侧吸/顶吸平移工况生效' },
      { key: 'vacuum', label: '真空度 pV', group: '吸附工况', type: 'number', unit: 'kPa', default: 70, step: 1 },
      { key: 'suctionCupsNo', label: '吸盘数量 n', group: '吸附工况', type: 'number', default: 6, step: 1 },
      { key: 'cupDiameterS', label: '吸盘直径（发生器）', group: '真空发生器', type: 'number', unit: 'mm', default: 50, step: 1 },
      { key: 'responseTime', label: '反应时间 T', group: '真空发生器', type: 'number', unit: 's', default: 1, step: 0.1 },
      { key: 'hoseDia', label: '配管内径 dn', group: '真空发生器', type: 'number', unit: 'mm', default: 4, step: 0.1 },
      { key: 'hoseLen', label: '配管长度 Lp', group: '真空发生器', type: 'number', unit: 'm', default: 1, step: 0.1 },
      { key: 'cupV2', label: '单个吸盘容积 V2', group: '真空发生器', type: 'number', unit: 'L', default: 0.016, step: 0.01 }
    ],
    compute: function (v) {
      var m = +v.workpieceMass, a = +v.acceleration, S = +v.safetyFactor;
      var mode = v.motionStyle || '顶吸提升';
      var n = +v.suctionCupsNo > 0 ? +v.suctionCupsNo : 1;
      var mu = (+v.miu > 0) ? +v.miu : 0.15;
      var pV = +v.vacuum > 0 ? +v.vacuum : 70;
      var g = 9.81;
      var forceH, singleForceH, formulaName;
      if (mode === '侧吸提升') {
        formulaName = 'F=m(g+a)·S/(n·μ)';
        forceH = m * (g + a) * S / mu;            // 总吸附力
      } else if (mode === '顶吸平移') {
        formulaName = 'F=m·(g+a/μ)·S';
        forceH = m * (g + a / mu) * S;            // 平移需克服摩擦提供水平加速度
      } else {
        formulaName = 'F=m(g+a)·S/n';
        forceH = m * (g + a) * S;                 // 顶吸提升总吸附力
      }
      singleForceH = forceH / n;                  // 单个吸盘所需吸附力
      /* 吸盘直径 D=√(4F/(π·p))，pV 单位 kPa → N/m² */
      var cupDia = Math.sqrt(4 * singleForceH / (Math.PI * pV * 1000)) * 1000; // mm
      var cupSize = Math.PI / 4 * Math.pow(cupDia / 10, 2);                    // 有效面积 cm²
      /* 真空发生器：由吸盘体积+配管体积与反应时间算流量 */
      var hoseV1 = Math.PI / 4 * Math.pow(+v.hoseDia, 2) * (+v.hoseLen * 1000) / 1e6; // 配管容积 L
      var totalV = hoseV1 + (+v.cupV2 || 0) * n;                                  // 总容积 L
      var pWorking = singleForceH / (Math.PI / 4 * Math.pow(+v.cupDiameterS, 2)) * 1000; // kPa 到达压力
      var r = Math.max(0, Math.min(0.99, pWorking / pV));                         // 压力比
      var tT1 = -Math.log(1 - r);                                                 // 吸附时间比（泵抽特性）
      var T = +v.responseTime > 0 ? +v.responseTime : 1;
      var q1 = 60 * totalV * tT1 / T;                                              // 所需流量 L/min
      var qMax = 2 * q1;                                                          // 发生器最大流量
      return {
        sections: [
          { title: '吸盘吸附力', rows: [
            { label: '总吸附力 ' + formulaName, value: forceH, unit: 'N', hl: true },
            { label: '单吸盘所需吸附力', value: singleForceH, unit: 'N', hl: true },
            { label: '计算吸盘直径 D=√(4F/(π·p))', value: cupDia, unit: 'mm', d: 1 },
            { label: '吸盘有效面积', value: cupSize, unit: 'cm²', d: 2 }
          ] },
          { title: '真空发生器流量', rows: [
            { label: '配管容积 V1', value: hoseV1, unit: 'L', d: 4 },
            { label: '总容积 V=V1+n·V2', value: totalV, unit: 'L', d: 4 },
            { label: '吸附时间比 tT1', value: tT1, unit: '', d: 3 },
            { label: '所需流量 Q1=60·V·tT1/T', value: q1, unit: 'L/min', d: 2, hl: true },
            { label: '发生器最大流量 Qmax=2·Q1', value: qMax, unit: 'L/min', d: 2, hl: true }
          ] }
        ],
        verdict: {
          level: 'ok',
          text: mode + '：总吸附力 ' + fmt(forceH, 1) + ' N，单吸盘 ' + fmt(singleForceH, 1) + ' N，吸盘直径约 ' + fmt(cupDia, 1) + ' mm；发生器需流量 ' + fmt(q1, 1) + ' L/min',
          note: '发生器额定吸气量建议取 Qmax（2·Q1）以上，保证反应时间 T=' + fmt(T, 1) + ' s 内完成吸附。'
        },
        notes: [
          '顶吸提升 F=m(g+a)·S；侧吸提升 F=m(g+a)·S/μ；顶吸平移 F=m·(g+a/μ)·S；g=9.81 m/s²。',
          '吸盘直径 D=√(4F/(π·p))，F 单盘吸附力(N)，p 真空度(Pa)。',
          '本工具公式与默认值依 原站 真空吸盘与真空发生器页（vacuumSuctionCupCal / vacuumGeneratorCal）。'
        ]
      };
    },
    formulas: [
      '顶吸提升 F=m(g+a)S；侧吸提升 F=m(g+a)S/μ；顶吸平移 F=m(g+a/μ)S',
      '单盘 F=F_total/n；D=√(4F/(π·p))',
      'Q1=60·V·tT1/T；Qmax=2·Q1；tT1=-ln(1-p_work/pV)'
    ],
    reference: '原站 真空吸盘与真空发生器；SMC/SCHMALZ 真空工学'
  });

  /* ============ 5. 油压缓冲器选型 ============ */
  App.registerTool({
    id: 'hydraulic-buffer',
    name: '油压缓冲器选型',
    category: 'select',
    keywords: '油压缓冲器 缓冲器 动能 驱动能 等效质量 冲击速度 选型',
    brief: '计算运动体动能、驱动能、总吸收能量与每小时吸收能量、等效质量，作为油压缓冲器选型依据，支持直线与旋转运动。',
    doc: '按<b>运动情况</b>（直线运动 / 旋转或摇摆运动）计算运动体的<b>动能 E1</b>、<b>驱动/重力做功 E2</b> 与<b>每小时吸收能量 ETC</b>、<b>等效质量 me</b>，据此校核所选油压缓冲器的最大吸收能量与等效质量。本工具依 原站 油压缓冲器选型页复刻。',
    inputs: [
      { key: 'motionSituation', label: '运动情况', group: '运动情况', type: 'select', options: [
        { v: '直线运动时', t: '直线运动时' }, { v: '旋转或摇摆运动时', t: '旋转或摇摆运动时' }
      ], default: '直线运动时' },
      { key: 'workpieceMass', label: '工件质量 m', group: '直线运动参数', type: 'number', unit: 'kg', default: 50, step: 1 },
      { key: 'bufferStrokeS', label: '缓冲器行程 S', group: '直线运动参数', type: 'number', unit: 'mm', default: 40, step: 1 },
      { key: 'bevelAngle', label: '斜面角度 θ', group: '直线运动参数', type: 'number', unit: '°', default: 45, step: 1 },
      { key: 'axialLoad', label: '驱动力 F', group: '直线运动参数', type: 'number', unit: 'N', default: 190, step: 1 },
      { key: 'impactVelocity', label: '冲击速度 v', group: '直线运动参数', type: 'number', unit: 'm/s', default: 1.5, step: 0.1 },
      { key: 'inertiaJ', label: '转动惯量 J', group: '旋转运动参数', type: 'number', unit: 'kg·m²', default: 2, step: 1 },
      { key: 'angularVelocity', label: '角速度 ω', group: '旋转运动参数', type: 'number', unit: 'rad/s', default: 4, step: 0.1 },
      { key: 'torque', label: '驱动力矩 M', group: '旋转运动参数', type: 'number', unit: 'N·m', default: 20, step: 1 },
      { key: 'distanceR', label: '缓冲器安装半径 R', group: '旋转运动参数', type: 'number', unit: 'm', default: 0.4, step: 0.1 },
      { key: 'hitTimes', label: '每小时冲击次数 N', group: '运行工况', type: 'number', unit: '次/h', default: 1800, step: 1 }
    ],
    compute: function (v) {
      var mode = v.motionSituation || '直线运动时';
      var N = +v.hitTimes > 0 ? +v.hitTimes : (mode === '旋转或摇摆运动时' ? 900 : 1800);
      var g = 9.81;
      var eK, eD, eT, eTC, equivMass, vImp;
      if (mode === '旋转或摇摆运动时') {
        var J = +v.inertiaJ || 0, w = +v.angularVelocity || 0, M = +v.torque || 0, R = +v.distanceR > 0 ? +v.distanceR : 0.4;
        var S = +v.bufferStrokeS || 20;
        vImp = R * w;                                   // 缓冲点冲击速度 m/s
        eK = 0.5 * J * w * w;                           // 动=0.5·J·ω²
        var theta = (S / 1000) / R;                     // 缓冲行程角 rad
        eD = M * theta;                                 // 驱动力矩做功
        eT = eK + eD;
        eTC = eT * N;
        equivMass = (J / (R * R)) * (eT / eK);          // 等效质量（旋转）
      } else {
        var m = +v.workpieceMass || 0, v2 = +v.impactVelocity || 0;
        var S = +v.bufferStrokeS || 40;
        var ang = +v.bevelAngle || 0;
        var F = +v.axialLoad || 0;
        vImp = v2;
        eK = 0.5 * m * v2 * v2;                        // 动能
        eD = m * g * (S / 1000) * Math.sin(ang * Math.PI / 180) + F * (S / 1000); // 重力分力+驱动力做功
        eT = eK + eD;
        eTC = eT * N;
        equivMass = m * (eT / eK);                     // 等效质量（直线）
      }
      return {
        sections: [
          { title: '能量计算', rows: [
            { label: '冲击速度 v', value: vImp, unit: 'm/s', d: 2 },
            { label: '动能 E1=½·M·v²', value: eK, unit: 'J', hl: true },
            { label: '驱动能 E2', value: eD, unit: 'J', d: 1 },
            { label: '总吸收能量 E=E1+E2', value: eT, unit: 'J', hl: true }
          ] },
          { title: '选型校核', rows: [
            { label: '每小时吸收能量 ETC', value: eTC, unit: 'J/h', hl: true },
            { label: '等效质量 me', value: equivMass, unit: 'kg', d: 2 }
          ] }
        ],
        verdict: {
          level: 'ok',
          text: '总吸收能量 ' + fmt(eT, 1) + ' J，每小时 ' + fmt(eTC) + ' J/h，等效质量 ' + fmt(equivMass, 2) + ' kg',
          note: '所选缓冲器须满足：最大吸收能量 ≥ E、最高冲击速度 ≥ v、等效质量在允许范围内；转速过快留 30% 以上余量。'
        },
        notes: [
          '直线：E1=½mv²，E2=mg·S·sinθ+F·S；旋转：E1=½Jω²，E2=M·(S/R)。',
          '等效质量 直线 me=m·E/E1；旋转 me=(J/R²)·(E/E1)。',
          '本工具公式与默认值依 原站 油压缓冲器选型页（hydraulicBufferCal）。'
        ]
      };
    },
    formulas: [
      'E = E1 + E2（动能+驱动能）',
      '直线：E1=½mv²，E2=mg·S·sinθ+F·S',
      '旋转：E1=½Jω²，E2=M·θ（θ=S/R），v=R·ω',
      'me（直线）=m·E/E1；me(旋转)=(J/R²)·E/E1；ETC=N·E'
    ],
    reference: '原站 油压缓冲器选型；ACE/SMC 缓冲器选型手册'
  });

  /* ============ 6. 气动供应商在线计算工具（信息页） ============ */
  App.registerTool({
    id: 'cheli-air',
    name: '气动供应商在线计算工具',
    category: 'fluid',
    keywords: '气动 供应商 SMC Festo 台湾气立 在线计算',
    brief: '汇总台湾气立、SMC、Festo 等气动厂商的在线选型与计算工具入口。',
    doc: '本页为<b>外部工具入口集合</b>，收录台湾气立在线计算、SMC 选型与计算程序、Festo 工程设计软件等在线链接，本身不做本地计算。',
    inputs: [],
    compute: function () {
      return {
        sections: [
          { title: '收录的外部在线工具', rows: [
            { label: '台湾气立在线计算工具', value: 'chelic.com（技术支援/计算公式）' },
            { label: 'SMC 选型与计算程序', value: 'smc.com.cn/select（产品选型计算）' },
            { label: 'SMC 主管路压降/流量计算', value: 'mssc.smcworld.com（压力降/建议流量）' },
            { label: 'SMC 流量特性计算软件', value: 'mssc.smcworld.com/fccs（空气流量特性/合成计算）' },
            { label: 'Festo 工程设计软件', value: 'festo.com.cn（自动化工程设计）' }
          ] },
          { title: '说明', rows: [
            { label: '工具性质', value: '本项为外部供应商计算工具入口，需跳转至对应官方网站使用' }
          ] }
        ],
        verdict: {
          level: 'info',
          text: '此为外部工具入口集合，请选择对应厂商工具跳转使用',
          note: '各供应商在线工具以对应官网为准。'
        },
        notes: [
          'SMC 压降/流量类工具还包括：气罐选型、气罐充放气、液/蒸汽/气体流量特性合成等。',
          '本页依 原站 气动供应商在线计算工具页（cheli-online-calculation）整理。'
        ]
      };
    },
    formulas: [],
    reference: '原站 气动供应商在线计算工具；SMC / Festo / 台湾气立官方'
  });

})();