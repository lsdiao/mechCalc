/* =========================================================
 * 凸轮分度(割)器选型计算（1:1 复刻 原站 camindexerselection）
 * 公式与字段名与原站 calculation_camindexer1 逐值一致
 * 依据：《机械设计手册》凸轮分度机构；潭子精密凸轮分度器样本
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  /* ---------- 凸轮曲线特征值（原站 camCurveValueQuery） ---------- */
  var CURVES = {
    '变形梯形曲线(M.T)': { am: 4.89, vm: 2, qm: 1.655 },
    '变形正弦曲线(M.S)': { am: 5.53, vm: 1.76, qm: 0.987 },
    '变形等速曲线(M.C.V)': { am: 8.01, vm: 1.28, qm: 0.715 },
    '三共变形正弦(SMS-3)': { am: 4.848, vm: 1.818, qm: 1.178 },
    '三共变形等速(SMCV-3)': { am: 6.882, vm: 1.29, qm: 0.836 }
  };
  var G = 9.807; /* 原站重力加速度取值（API 反推：Tf=μWRg） */

  App.registerTool({
    id: 'cam-indexer-design',
    name: '凸轮分度(割)器选型计算',
    category: 'trans',
    keywords: '凸轮 分割器 分度器 间歇机构 转动惯量 惯性转矩 分度角 潭子',
    brief: '凸轮分度器选型：负载转动惯量、各转矩与电机功率计算。',
    doc: '按凸轮分度器样本方法计算负载转动惯量（转盘/夹具/工件）、输出轴最大角加速度、惯性/摩擦/工作转矩、实际负载转矩 Te、输入轴转矩 Tc 与所需电机功率 P。凸轮曲线特征值 Am/Vm/Qm 内置 5 种常用曲线。输入轴转速 n 与分度时间 t₂ 可互相换算（t₂=60·θ<sub>h</sub>/(360·n)）。',
    inputs: [
      { key: 'divisions', label: '分割数 S', group: '设计参数（初始条件）', type: 'number', default: 6, step: 'any', hint: '输出轴旋转一周所需停留的次数' },
      { key: 'indexAngle', label: '分度(驱动)角 θh', group: '设计参数（初始条件）', type: 'number', unit: '°', default: 270, step: 'any', hint: '输入轴凸轮驱使输出轴分度所需旋转的角度' },
      { key: 'w1', label: '转盘重量 W1', group: '设计参数（初始条件）', type: 'number', unit: 'kg', default: 11.026, step: 'any' },
      { key: 'w2', label: '夹具重量 W2', group: '设计参数（初始条件）', type: 'number', unit: 'kg/组', default: 3, step: 'any', hint: '一组的重量' },
      { key: 'w3', label: '工件重量 W3', group: '设计参数（初始条件）', type: 'number', unit: 'kg/组', default: 0.25, step: 'any', hint: '一组的重量' },
      { key: 'turntableDia', label: '转盘直径 D', group: '设计参数（初始条件）', type: 'number', unit: 'mm', default: 300, step: 'any' },
      { key: 'centerDis', label: '工件中心距 De', group: '设计参数（初始条件）', type: 'number', unit: 'mm', default: 200, step: 'any', hint: '夹具/工件分布圆直径' },
      { key: 'supportRadius', label: '支撑半径 R', group: '设计参数（初始条件）', type: 'number', unit: 'mm', default: 100, step: 'any', hint: '转盘底部支撑接触点到转盘中心的有效半径' },
      { key: 'miu', label: '支撑摩擦系数 μ', group: '设计参数（初始条件）', type: 'number', default: 0.15, step: 'any', hint: '转盘与其底部支撑之间的摩擦系数' },
      { key: 'factorC', label: '转矩安全系数 fc', group: '设计参数（初始条件）', type: 'number', default: 2, step: 'any', hint: '一般取 1.5~2，驱动角为 90° 时可取 2' },
      { key: 'efficiency', label: '电机及传动系统效率 η', group: '设计参数（初始条件）', type: 'number', default: 0.6, step: 'any', hint: '0~1' },
      { key: 'inputShaftSpeed', label: '输入轴转速 n', group: '设计参数（初始条件）', type: 'number', unit: 'rpm', default: 80, step: 'any', hint: 'n = 60/t₂×θh/(360×m)，m 为 Dwell 数' },
      { key: 'camCurveType', label: '凸轮曲线类型', group: '设计参数（初始条件）', type: 'select', options: [
        { v: '变形梯形曲线(M.T)', t: '变形梯形曲线(M.T)' },
        { v: '变形正弦曲线(M.S)', t: '变形正弦曲线(M.S)' },
        { v: '变形等速曲线(M.C.V)', t: '变形等速曲线(M.C.V)' },
        { v: '三共变形正弦(SMS-3)', t: '三共变形正弦(SMS-3)' },
        { v: '三共变形等速(SMCV-3)', t: '三共变形等速(SMCV-3)' }
      ], default: '变形正弦曲线(M.S)' },
      { key: 'torqueW', label: '工作转矩 Tw', group: '负载转矩（可选）', type: 'number', unit: 'N·m', default: 0, step: 'any', hint: '转位分度时的负载转矩；分度器在间歇分割时没有做功则取 0' },
      { key: 'torqueCa', label: '输入轴启动负载转矩 Tca', group: '负载转矩（可选）', type: 'number', unit: 'N·m', default: 0, step: 'any' }
    ],
    compute: function (v) {
      var S = +v.divisions, th = +v.indexAngle;
      var W1 = +v.w1, W2 = +v.w2, W3 = +v.w3;
      var D = +v.turntableDia, De = +v.centerDis, R = +v.supportRadius;
      var miu = +v.miu, fc = +v.factorC, eta = +v.efficiency, n = +v.inputShaftSpeed;
      var Tw = +v.torqueW || 0, Tca = +v.torqueCa || 0;
      var curve = CURVES[v.camCurveType] || CURVES['变形正弦曲线(M.S)'];

      /* ---------- 输入校验（与原站一致的范围） ---------- */
      if (!(S > 0) || S !== Math.floor(S) || S > 100) return { error: '分割数 S 请输入 0-100 之间的整数' };
      if (!(th > 0) || th > 360) return { error: '分度角 θh 请输入 0-360 之间的数' };
      if (!(W1 > 0) || W1 > 10000) return { error: '转盘重量 W1 请输入 0-10000 之间的数' };
      if (!(W2 > 0) || W2 > 10000) return { error: '夹具重量 W2 请输入 0-10000 之间的数' };
      if (!(W3 > 0) || W3 > 10000) return { error: '工件重量 W3 请输入 0-10000 之间的数' };
      if (!(D > 0) || D > 10000) return { error: '转盘直径 D 请输入 0-10000 之间的数' };
      if (!(De > 0) || De > 10000) return { error: '工件中心距 De 请输入 0-10000 之间的数' };
      if (!(R > 0) || R > 10000) return { error: '支撑半径 R 请输入 0-10000 之间的数' };
      if (!(miu > 0) || miu > 10) return { error: '支撑摩擦系数 μ 请输入 0-10 之间的数' };
      if (!(fc > 0) || fc > 5) return { error: '转矩安全系数 fc 请输入 0-5 之间的数' };
      if (!(eta > 0) || eta > 1) return { error: '效率 η 请输入 0-1 之间的数' };
      if (!(n >= 10) || n > 1000) return { error: '输入轴转速 n 请输入 10-1000 之间的数' };
      if (Tw < 0 || Tw > 1000) return { error: '工作转矩 Tw 请输入 0-1000 之间的数' };
      if (Tca < 0 || Tca > 1000) return { error: '输入轴启动负载转矩 Tca 请输入 0-1000 之间的数' };

      /* ---------- 转动惯量 ---------- */
      var j1 = W1 * Math.pow(D / 1000, 2) / 8;            /* 转盘（圆盘） */
      var j2 = S * W2 * Math.pow(De / 2000, 2);           /* 夹具：S 组点质量于分布圆半径 De/2 */
      var j3 = S * W3 * Math.pow(De / 2000, 2);           /* 工件 */
      var jT = j1 + j2 + j3;

      /* ---------- 角加速度 ---------- */
      var t2 = th / (6 * n);                              /* 分度时间 s：t2 = 60·θh/(360·n) */
      var thRad = 2 * Math.PI * th / 360;                 /* 分度角 rad */
      var alpha = curve.am * (2 * Math.PI / S) / (t2 * t2); /* α = Am·(2π/S)/t2² */

      /* ---------- 转矩 ---------- */
      var Ti = jT * alpha;                                /* 惯性转矩 */
      var W = W1 + S * (W2 + W3);                         /* 转盘+夹具+工件质量 */
      var Tf = miu * W * G * (R / 1000);                  /* 摩擦转矩 */
      var Tt = Ti + Tf + Tw;                              /* 总负载转矩 */
      var Te = fc * Tt;                                   /* 实际负载转矩 */
      var Tc = curve.qm * Te * (th / 360) * (1 + 1 / S) + Tca; /* 输入轴转矩 */
      var P = 2 * Math.PI * n / (60 * eta) * Tc / 1000;   /* 电机功率 kW */

      var vOut = 0; /* 输出轴最大角速度 ω = Vm·(2π/S)/t2，供参考 */
      if (t2 > 0) vOut = curve.vm * (2 * Math.PI / S) / t2;

      return {
        sections: [
          { title: '凸轮曲线特征值', rows: [
            { label: '最大加速度系数 Am', value: curve.am },
            { label: '最大速度系数 Vm', value: curve.vm },
            { label: '最大转矩系数 Qm', value: curve.qm }
          ] },
          { title: '负载转动惯量', rows: [
            { label: '转盘转动惯量 J1 = W1·D²/8', value: j1, unit: 'kg·m²', d: 3, hl: true },
            { label: '夹具转动惯量 J2 = S·W2·(De/2)²', value: j2, unit: 'kg·m²', d: 3, hl: true },
            { label: '工件转动惯量 J3 = S·W3·(De/2)²', value: j3, unit: 'kg·m²', d: 3, hl: true },
            { label: '总转动惯量 J = J1+J2+J3', value: jT, unit: 'kg·m²', d: 3, hl: true },
            { label: '负载总质量 W = W1+S(W2+W3)', value: W, unit: 'kg', d: 2 }
          ] },
          { title: '分度运动参数', rows: [
            { label: '分度时间 t2 = 60·θh/(360·n)', value: t2, unit: 's', d: 4 },
            { label: '输出轴最大角加速度 α = Am·(2π/S)/t2²', value: alpha, unit: 'rad/s²', d: 3, hl: true },
            { label: '输出轴最大角速度 ω = Vm·(2π/S)/t2', value: vOut, unit: 'rad/s', d: 3 },
            { label: '停歇角 360°−θh', value: 360 - th, unit: '°', d: 1 }
          ] },
          { title: '负载转矩', rows: [
            { label: '惯性转矩 Ti = J·α', value: Ti, unit: 'N·m', d: 3, hl: true },
            { label: '摩擦转矩 Tf = μ·W·g·R', value: Tf, unit: 'N·m', d: 3, hl: true },
            { label: '工作转矩 Tw', value: Tw, unit: 'N·m', d: 3 },
            { label: '总负载转矩 Tt = Ti+Tf+Tw', value: Tt, unit: 'N·m', d: 3, hl: true },
            { label: '实际负载转矩 Te = fc·Tt', value: Te, unit: 'N·m', d: 3, hl: true }
          ] },
          { title: '输入轴转矩与功率', rows: [
            { label: '输入轴转矩 Tc = Qm·Te·(θh/360)·(1+1/S)+Tca', value: Tc, unit: 'N·m', d: 2, hl: true },
            { label: '所需电机功率 P = 2πn/(60η)·Tc', value: P, unit: 'kW', d: 3, hl: true }
          ] }
        ],
        verdict: {
          level: 'ok',
          text: '实际负载转矩 Te=' + fmt(Te, 1) + ' N·m，输入轴转矩 Tc=' + fmt(Tc, 1) + ' N·m，所需电机功率 P=' + fmt(P, 2) + ' kW（' + v.camCurveType + '）'
        },
        notes: [
          '总负载转矩 Tt = Ti+Tf+Tw；Ti=J·α（J=J1+J2+J3，α 为输出轴最大角加速度）；Tf=μ·W·R（W 为转盘+夹具+工件总质量，R 为支撑半径）；Tw 为转位分度时的负载转矩，间歇分割不做功时取 0。',
          '实际负载转矩 Te = fc·Tt，安全系数 fc 一般取 1.5~2，驱动角为 90° 时可取 2。',
          '输入轴转矩 Tc = Qm·Te·(θh/360)·(1+1/S)+Tca；电机功率 P = 2πn/(60η)·Tc（kW），n 为输入轴转速 rpm。',
          '输入轴转速 n = 60/t2·θh/(360·m)，其中 t2 为分度时间 s，m 为 Dwell 数（停歇次数）。',
          '凸轮曲线特征值：变形梯形(M.T) Am=4.89/Vm=2/Qm=1.655；变形正弦(M.S) 5.53/1.76/0.987；变形等速(M.C.V) 8.01/1.28/0.715；三共变形正弦(SMS-3) 4.848/1.818/1.178；三共变形等速(SMCV-3) 6.882/1.29/0.836。'
        ]
      };
    },
    formulas: [
      'J1 = W1·D²/8；J2 = S·W2·(De/2)²；J3 = S·W3·(De/2)²（kg·m²，长度换算为 m）',
      't2 = 60·θh/(360·n)；α = Am·(2π/S)/t2²；Ti = J·α',
      'Tf = μ·W·g·R；Tt = Ti+Tf+Tw；Te = fc·Tt',
      'Tc = Qm·Te·(θh/360)·(1+1/S)+Tca；P = 2πn/(60η)·Tc'
    ],
    reference: '潭子精密凸轮分度器样本；《机械设计手册》凸轮分度机构篇。复刻自 原站 凸轮分度(割)器选型（calculation_camindexer1）。'
  });
})();
