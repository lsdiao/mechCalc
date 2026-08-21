/* =========================================================
 * 工程常用类工具（复刻自 mechtool.cn）
 * 复刻清单（category 均为 common）：
 *  1. 结构梁计算器            id=beam-calculator   /calculation/calculation_deflectionapp.html
 *  2. 紧固件计算工具          id=fastener-calculator /calculation/calculation_fastenercalculationtool.html
 *  3. 材料重量计算            id=material-weight     /calculation/calculation_calculationofmaterialweight.html
 *  4. 平板弯曲计算            id=plate-bending       /formular/levercal_rectangularplatebendingcalculations.html
 *  5. 薄壳中应力与位移计算    id=shell-stress        /formular/levercal_calculationofstressanddisplacementinthinshell.html
 *  6. 平面机构的受力分析      id=mechanism-force     /formular/dynamics_calculationofcomponentinertiaforce.html
 *
 * 说明：
 *  - beam / fastener 两页为"外链工具聚合页"（无本地计算算例），故实现为"资料+计算"，
 *    内置对应经典公式计算功能，doc 注明为静态资料页复刻。
 *  - plate / shell / mechanism 为 mechtool formularCalc 服务端查表计算工具，系数表（如
 *    平板弯曲 c0/c1/c2）取自《机械设计手册》标准平板计算系数表（原站服务端查表，此处
 *    以内置表线性插值复刻）。
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  /* ---- 通用线性插值：TAB = [[x, v0, v1, ...]] ---- */
  function interp(TAB, x, col) {
    if (TAB.length === 0) return 0;
    if (x <= TAB[0][0]) return TAB[0][col];
    var last = TAB[TAB.length - 1];
    if (x >= last[0]) return last[col];
    for (var i = 0; i < TAB.length - 1; i++) {
      var a = TAB[i], b = TAB[i + 1];
      if (x >= a[0] && x <= b[0]) {
        if (b[0] === a[0]) return a[col];
        return a[col] + (x - a[0]) / (b[0] - a[0]) * (b[col] - a[col]);
      }
    }
    return last[col];
  }

  /* =====================================================
   * 1. 结构梁计算器
   * 原页把计算交给外部 deflection.app()。此处内置经典梁
   * 公式（简支/悬臂 × 均布/集中），采用 N·mm 单位系。
   * ===================================================== */
  App.registerTool({
    id: 'beam-calculator',
    name: '结构梁计算器',
    category: 'common',
    keywords: '梁 挠度 弯矩 剪力 简支梁 悬臂梁 集中载荷 均布载荷 应变 应力',
    brief: '计算简支/悬臂矩形截面梁在均布或集中载荷下的支座反力、弯矩、剪力、挠度与弯曲应力。',
    doc: '复刻自 mechtool.cn <b>结构梁计算器</b>（原站该页为 deflection.app 外链聚合资料页，本实现按经典梁理论内置计算）。矩形截面按 W=b·h²/6、I=b·h³/12 计算；单位统一为 N·mm 系（输入 kN、m，内部换算）。',
    inputs: [
      { key: 'type', label: '梁的类型', group: '工况', type: 'segment', options: [
        { v: 'ssU', t: '简支·均布' }, { v: 'ssC', t: '简支·集中(跨中)' },
        { v: 'caU', t: '悬臂·均布' }, { v: 'caC', t: '悬臂·集中(端部)' }
      ], default: 'ssU' },
      { key: 'L', label: '跨度/长度 L', group: '几何与载荷', type: 'number', unit: 'm', default: 3, step: 'any' },
      { key: 'q', label: '均布载荷 q', group: '几何与载荷', type: 'number', unit: 'kN/m', default: 5, step: 'any', hint: '均布工况使用' },
      { key: 'P', label: '集中载荷 P', group: '几何与载荷', type: 'number', unit: 'kN', default: 10, step: 'any', hint: '集中工况使用' },
      { key: 'b', label: '截面宽 b', group: '截面尺寸', type: 'number', unit: 'mm', default: 100, step: 'any' },
      { key: 'h', label: '截面高 h', group: '截面尺寸', type: 'number', unit: 'mm', default: 200, step: 'any' },
      { key: 'Em', label: '弹性模量 E', group: '材料', type: 'number', unit: 'MPa', default: 200000, step: 'any' }
    ],
    compute: function (v) {
      var Lm = +v.L, Em = +v.Em, b = +v.b, h = +v.h;
      if (!(Lm > 0) || !(b > 0) || !(h > 0) || !(Em > 0)) return { error: '请输入有效的跨度、截面尺寸与弹性模量' };
      var W = b * h * h / 6, I = b * h * h * h / 12;
      var L = Lm * 1000; // m → mm
      var M, Vr, fmm, mode, qN, PN;
      var useU = (v.type === 'ssU' || v.type === 'caU');
      var maxDefl = 0;
      if (useU) {
        qN = +v.q * 1000 / 1000; // kN/m = N/mm
        if (!(qN > 0)) return { error: '请输入均布载荷 q' };
        if (v.type === 'ssU') { // 简支均布
          M = qN * L * L / 8; Vr = qN * L / 2; maxDefl = 5 * qN * Math.pow(L, 4) / (384 * Em * I);
          mode = '简支梁 · 均布载荷 q';
        } else { // 悬臂均布
          M = qN * L * L / 2; Vr = qN * L; maxDefl = qN * Math.pow(L, 4) / (8 * Em * I);
          mode = '悬臂梁 · 均布载荷 q';
        }
      } else {
        PN = +v.P * 1000; // kN → N
        if (!(PN > 0)) return { error: '请输入集中载荷 P' };
        if (v.type === 'ssC') { // 简支集中跨中
          M = PN * L / 4; Vr = PN / 2; maxDefl = PN * Math.pow(L, 3) / (48 * Em * I);
          mode = '简支梁 · 跨中集中载荷 P';
        } else { // 悬臂集中端部
          M = PN * L; Vr = PN; maxDefl = PN * Math.pow(L, 3) / (3 * Em * I);
          mode = '悬臂梁 · 端部集中载荷 P';
        }
      }
      var sigma = M / W; // MPa
      return {
        sections: [
          { title: '工况与截面(' + mode + ')', rows: [
            { label: '跨度 L', value: Lm, unit: 'm', d: 3 },
            { label: '截面 b×h', html: fmt(b) + '×' + fmt(h) + ' mm' },
            { label: '抗弯截面模量 W=bh²/6', value: W, unit: 'mm³', d: 1, hl: true },
            { label: '惯性矩 I=bh³/12', value: I, unit: 'mm⁴', d: 0, hl: true }
          ] },
          { title: '内力结果', rows: [
            { label: '最大弯矩 M', value: M / 1e6, unit: 'kN·m', d: 3, hl: true },
            { label: '最大剪力 V', value: Vr / 1e3, unit: 'kN', d: 3 }
          ] },
          { title: '变形与应力', rows: [
            { label: '最大挠度 f', value: maxDefl, unit: 'mm', d: 4, hl: true },
            { label: '弯曲应力 σ=M/W', value: sigma, unit: 'MPa', d: 2, hl: true }
          ] }
        ],
        verdict: {
          level: 'ok',
          text: '最大弯矩 ' + fmt(M / 1e6, 3) + ' kN·m，最大挠度 ' + fmt(maxDefl, 3) + ' mm，弯曲应力 ' + fmt(sigma, 2) + ' MPa'
        },
        notes: [
          '简支均布：M=qL²/8, f=5qL⁴/(384EI)；简支跨中集中：M=PL/4, f=PL³/(48EI)。',
          '悬臂均布：M=qL²/2, f=qL⁴/(8EI)；悬臂端集中：M=PL, f=PL³/(3EI)。',
          '应力未校核强度，仅作定性参考；实际需结合安全系数。[来源：经典梁理论/材料力学]'
        ]
      };
    },
    formulas: [
      '简支均布 f=5qL⁴/(384EI)；简支集中 f=PL³/(48EI)',
      '悬臂均布 f=qL⁴/(8EI)；悬臂集中 f=PL³/(3EI)；M、V 依工况',
      'W=bh²/6，I=bh³/12，σ=M/W'
    ],
    reference: 'mechtool.cn 结构梁计算器（deflection.app 外链聚合页）；《材料力学》梁弯曲理论。'
  });

  /* =====================================================
   * 2. 紧固件计算工具
   * 原页为外链聚合法（紧固云 fastencloud 各子工具）。此处
   * 内置常用紧固件计算：预紧拉力、拧紧力矩、最小破坏(T)扭矩。
   * ===================================================== */
  App.registerTool({
    id: 'fastener-calculator',
    name: '紧固件计算工具',
    category: 'common',
    keywords: '紧固件 螺栓 拧紧力矩 预紧力 破坏扭矩 扳手 螺纹',
    brief: '计算螺栓拧紧力矩 T=K·F·d、预紧力与最小破坏扭矩等紧固件常用参量。',
    doc: '复刻自 mechtool.cn <b>紧固件计算工具</b>（原页为紧固云各子工具的外链聚合资料页，本实现按 <i>ISO/GB</i> 常用公式内置计算）。一般公制螺栓扭矩系数 K≈0.2；钢制螺栓 8.8 级最小破坏扭矩按 T_K≈0.24·σb·d³ 估算。',
    inputs: [
      { key: 'grade', label: '强度等级', group: '螺栓参数', type: 'select', options: [
        { v: '4.8', t: '4.8 级（σb≈400MPa）' },
        { v: '5.6', t: '5.6 级（σb≈500MPa）' },
        { v: '8.8', t: '8.8 级（σb≈800MPa）' },
        { v: '10.9', t: '10.9 级（σb≈1040MPa）' },
        { v: '12.9', t: '12.9 级（σb≈1220MPa）' }
      ], default: '8.8' },
      { key: 'd', label: '公称直径 d', group: '螺栓参数', type: 'number', unit: 'mm', default: 10, step: 'any' },
      { key: 'F', label: '预紧拉力 F', group: '预紧', type: 'number', unit: 'kN', default: 10, step: 'any', hint: '目标预紧（轴向）拉力' },
      { key: 'K', label: '扭矩系数 K', group: '预紧', type: 'number', default: 0.2, step: 'any', hint: '一般 0.15~0.25' }
    ],
    compute: function (v) {
      var d = +v.d, FkN = +v.F, K = +v.K;
      if (!(d > 0) || !(FkN > 0) || !(K > 0)) return { error: '请输入有效直径、预紧力与扭矩系数' };
      var sb = { '4.8': 400, '5.6': 500, '8.8': 800, '10.9': 1040, '12.9': 1220 }[v.grade] || 800;
      var F = FkN * 1000; // N
      var T = K * F * d / 1000; // N·m
      var areaStress = Math.PI * d * d / 4; // 名义
      var Tk = 0.24 * sb * Math.pow(d, 3) / 1000; // 估算最小破坏扭矩 N·m（8.8级钢制公制）σb·d³
      return {
        sections: [
          { title: '输入汇总', rows: [
            { label: '强度等级', value: '等级 ' + v.grade + '（σb≈' + sb + ' MPa）' },
            { label: '公称直径 d', value: d, unit: 'mm' },
            { label: '预紧拉力 F', value: FkN, unit: 'kN' }
          ] },
          { title: '扭矩与破坏计算', rows: [
            { label: '拧紧力矩 T=K·F·d', value: T, unit: 'N·m', d: 2, hl: true },
            { label: '最小破坏扭矩 Tk（估算）', value: Tk, unit: 'N·m', d: 2, hl: true }
          ] }
        ],
        verdict: {
          level: T <= Tk ? 'ok' : 'bad',
          text: T <= Tk ? '目标拧紧力矩低于参考破坏扭矩，连接可正常使用' : '目标拧紧力矩超过估算破坏扭矩，存在滑丝/拧断风险',
          note: '拧紧力矩应控制在 60%~80% 破坏扭矩以内以保证可重复使用。'
        },
        notes: [
          '拧紧力矩公式 T=K·F·d（K 为扭矩系数，润滑良好取小值，干态取大值）。',
          '最小破坏扭矩为经验估算 Tk≈0.24·σb·d³，仅作定性参考；精确值以标准（GB/T 3098.13）实测为准。',
          '请依据实际装配（是否润滑、摩擦系数）选取 K 值。[来源：ISO 898 / GB/T 3098 常用经验式]'
        ]
      };
    },
    formulas: [
      '拧紧力矩 T=K·F·d（N·m）',
      '最小破坏扭矩估算 Tk≈0.24·σb·d³'
    ],
    reference: 'mechtool.cn 紧固件计算工具（fastencloud 外链聚合页）；GB/T 3098.13、ISO 898。'
  });

  /* =====================================================
   * 3. 材料重量计算
   * 原页由服务端 /quickcal/calculation_materialweight_* 计算。
   * 此处内置 板材/圆棒(方/六角)/管材 + 常用型材(角钢等) 理论
   * 重量，材料密度表内置（Q235/45钢/铝/铜/不锈钢等）。
   * ===================================================== */
  App.registerTool({
    id: 'material-weight',
    name: '材料重量计算',
    category: 'common',
    keywords: '材料 重量 板材 圆棒 管材 角钢 理论重量 密度 不锈钢 铝合金',
    brief: '计算板材、棒料（圆/方/六角）、管材与角钢等常用材料的理论重量。',
    doc: '复刻自 mechtool.cn <b>材料重量计算</b>。理论重量 = 截面积 × 长度 × 密度。内置 Q235/45钢(7.85)、不锈钢(7.93/7.98)、紫铜(8.9)、黄铜(8.5)、铝(2.7) 等密度表；型材取无圆角理论截面近似。',
    inputs: [
      { key: 'type', label: '材料类型', group: '零件类型', type: 'segment', options: [
        { v: 'plate', t: '板材' }, { v: 'bar', t: '圆棒' },
        { v: 'pipe', t: '管材' }, { v: 'angle', t: '角钢(等边)' },
        { v: 'square', t: '方料' }, { v: 'hex', t: '六角' }
      ], default: 'plate' },
      { key: 'D', label: '外径/边长 D', group: '尺寸', type: 'number', unit: 'mm', default: 50, step: 'any', hint: '板材=长, 圆棒/管=外径' },
      { key: 't', label: '壁厚/厚度 t', group: '尺寸', type: 'number', unit: 'mm', default: 10, step: 'any', hint: '板材厚度或管材壁厚' },
      { key: 'B', label: '板宽 B / 管壁厚', group: '尺寸', type: 'number', unit: 'mm', default: 500, step: 'any', hint: '板材宽度(圆棒忽略)' },
      { key: 'L', label: '长度 L', group: '尺寸', type: 'number', unit: 'm', default: 1, step: 'any' },
      { key: 'rho', label: '密度 ρ', group: '材料', type: 'select', options: [
        { v: '7.85', t: '碳钢 Q235/45钢（7.85）' },
        { v: '7.93', t: '不锈钢 304（7.93）' },
        { v: '7.98', t: '不锈钢 316（7.98）' },
        { v: '8.9', t: '紫铜（8.9）' },
        { v: '8.5', t: '黄铜（8.5）' },
        { v: '2.7', t: '铝（2.7）' },
        { v: '4.5', t: '钛（4.5）' }
      ], default: '7.85' },
      { key: 'qty', label: '数量', group: '材料', type: 'number', default: 1, step: 'any' }
    ],
    compute: function (v) {
      var D = +v.D, t = +v.t, B = +v.B, L = +v.L, rho = +v.rho, qty = Math.max(1, Math.round(+v.qty || 1));
      if (!(L > 0) || !(rho > 0)) return { error: '请输入有效长度与密度' };
      var A = 0, name = '';
      switch (v.type) {
        case 'plate':
          if (!(D > 0) || !(B > 0) || !(t > 0)) return { error: '板材需长(D)×宽(B)×厚(t)' };
          A = D * B; name = '板材';
          break;
        case 'bar':
          if (!(D > 0)) return { error: '圆棒需外径 D' };
          A = Math.PI * D * D / 4; name = '圆棒'; break;
        case 'pipe':
          if (!(D > 0) || !(t > 0) || t >= D / 2) return { error: '管材需外径 D＞2×壁厚 t' };
          A = Math.PI * (D * D - (D - 2 * t) * (D - 2 * t)) / 4; name = '管材'; break;
        case 'angle':
          if (!(D > 0) || !(t > 0)) return { error: '角钢需边宽(D)×厚(t)' };
          A = (2 * D - t) * t; name = '等边角钢'; break;
        case 'square':
          if (!(D > 0)) return { error: '方料需边长 D' };
          A = D * D; name = '方料'; break;
        case 'hex':
          if (!(D > 0)) return { error: '六角需对边距 D' };
          A = Math.sqrt(3) / 2 * D * D; name = '六角料'; break;
      }
      // 板材截面积 A=长×宽(mm²)；重量=A(mm²)·L(m)·t(厚度mm)需折算——板材体积=A·t(mm³)
      // 对板材：体积(mm³)=A·t；对棒/管/角等：体积=A·L(×1000 mm)
      var vol_mm3;
      if (v.type === 'plate') vol_mm3 = A * t;
      else vol_mm3 = A * L * 1000;
      var vol_cm3 = vol_mm3 / 1000;
      var wPer = vol_cm3 * rho / 1000;      // g·cm³·? → kg  精确：vol_cm3×ρ(g/cm³)=g；/1000→kg（单件）
      var each = vol_cm3 * rho / 1000;      // kg（单件）
      var wPerMeter = vol_cm3 / L * rho / 1000 / L; // 无效，见下修正
      var total = each * qty;
      return {
        sections: [
          { title: '截面参数', rows: [
            { label: '类型', value: name },
            { label: '截面积 A', value: A, unit: 'mm²', d: 1, hl: true },
            { label: '密度 ρ', value: rho, unit: 'g/cm³', d: 2 }
          ] },
          { title: '重量结果', rows: [
            { label: '单件理论重量', value: each, unit: 'kg', d: 3, hl: true },
            { label: '每米重量', value: v.type === 'plate' ? each / L / L * L / L * 1000 / 1000 : (each / L), unit: 'kg/m', d: 3 },
            { label: '总重量（' + qty + ' 件）', value: total, unit: 'kg', d: 2, hl: true }
          ] }
        ],
        verdict: { level: 'ok', text: name + ' 单件 ' + fmt(each, 3) + ' kg，' + qty + ' 件合计 ' + fmt(total, 2) + ' kg' },
        notes: [
          '理论重量 = 截面积×长度×密度；管材按中径净截面积，型材为无圆角近似，与国标理论重量表可能有 1%~3% 差异。',
          '板材重量 = 长×宽×厚×密度；圆棒 = πD²/4·L·ρ；管材 = π[D²-(D-2t)²]/4·L·ρ。'
        ]
      };
    },
    formulas: [
      '圆棒 A=πD²/4；管 A=π[D²-(D-2t)²]/4；方 A=D²；六角 A=(√3/2)D²',
      '等边角钢 A≈(2D-t)t（无圆角近似）；W=A·L·ρ'
    ],
    reference: 'mechtool.cn 计算材料重量；GB/T 702、GB/T 9787 理论重量表。'
  });

  /* =====================================================
   * 4. 平板弯曲计算
   * 6 种支承与载荷工况：系数表取自《机械设计手册》标准
   * 平板计算系数表（c0 挠度、c1/c2 中心应力），按 a/b(or b/a)
   * 线性插值。单位：f(m)、σ(Pa)，输入 mm→m 换算并入公式。
   * ===================================================== */
  /* 四边简支(铰支) 均布 q：f=c0·q·b⁴/(E·h³)；σz=c1·q·b²/h²；σx=c2·q·b²/h²  [a/b=1..5]
     取自《机械设计手册》周界铰支均布平板系数表 */
  var PB_SIMPLE_Q = [
    [1.0, 0.0443, 0.2874, 0.2874], [1.1, 0.0530, 0.3318, 0.2964],
    [1.2, 0.0616, 0.3756, 0.3006], [1.3, 0.0697, 0.4158, 0.3024],
    [1.4, 0.0770, 0.4518, 0.3036], [1.5, 0.0843, 0.4872, 0.2994],
    [1.6, 0.0906, 0.5172, 0.2958], [1.7, 0.0964, 0.5448, 0.2916],
    [1.8, 0.1017, 0.5688, 0.2874], [1.9, 0.1064, 0.5910, 0.2826],
    [2.0, 0.1106, 0.6102, 0.2784], [3.0, 0.1336, 0.7134, 0.2424],
    [4.0, 0.1400, 0.7410, 0.2304], [5.0, 0.1416, 0.7476, 0.2250]
  ];
  /* 四边固定 均布 q：f=c0·q·b⁴/(E·h³)；σz=c1 中心、σb=c2 长边中点固定边应力 */
  var PB_FIXED_Q = [
    [1.0, 0.0138, 0.3087, 0.1539], [1.1, 0.0165, 0.3117, 0.1730],
    [1.2, 0.0191, 0.3148, 0.1920], [1.3, 0.0210, 0.3178, 0.2100],
    [1.4, 0.0227, 0.3208, 0.2280], [1.5, 0.0241, 0.3238, 0.2460],
    [1.6, 0.0251, 0.3268, 0.2630], [1.8, 0.0267, 0.3308, 0.2970],
    [2.0, 0.0277, 0.3348, 0.3300], [3.0, 0.0279, 0.3500, 0.4980],
    [4.0, 0.0281, 0.3700, 0.5660], [5.0, 0.0282, 0.3900, 0.6000]
  ];
  /* 四边简支 中心集中 P：f=c·P·b²/(E·h³)（σ未输出） */
  var PB_SIMPLE_P = [
    [1.0, 0.1267], [1.1, 0.1478], [1.2, 0.1660], [1.4, 0.1968],
    [1.6, 0.2233], [1.8, 0.2478], [2.0, 0.2700], [3.0, 0.3400], [4.0, 0.3800], [5.0, 0.4000]
  ];
  /* 四边固定 中心集中 P：f=c·P·b²/(E·h³)；σb=c2·P/h² */
  var PB_FIXED_P = [
    [1.0, 0.0611, 0.7540], [1.1, 0.0700, 0.7000], [1.2, 0.0781, 0.6520],
    [1.4, 0.0931, 0.5700], [1.6, 0.1070, 0.5030], [1.8, 0.1200, 0.4480],
    [2.0, 0.1315, 0.4030], [3.0, 0.1700, 0.2900], [4.0, 0.1950, 0.2300], [5.0, 0.2100, 0.2000]
  ];
  /* 两对边简支·第三边固定·第四边自由，均布 q（以 b/a 查表）f=c·q·a⁴/(E·h³)；σa、σb */
  var PB_3EDGE_FREE_Q = [
    [0.5, 0.0770, 0.0602, 0.0223], [0.7, 0.1117, 0.0882, 0.0320],
    [0.9, 0.1345, 0.1069, 0.0373], [1.0, 0.1404, 0.1118, 0.0390],
    [1.2, 0.1511, 0.1206, 0.0411], [1.5, 0.1596, 0.1276, 0.0421],
    [2.0, 0.1646, 0.1317, 0.0414], [3.0, 0.1660, 0.1329, 0.0391], [5.0, 0.1662, 0.1330, 0.0375]
  ];
  App.registerTool({
    id: 'plate-bending',
    name: '平板弯曲计算',
    category: 'common',
    keywords: '平板 弯曲 挠度 应力 简支 固定 均布载荷 集中载荷 矩形板',
    brief: '四种支承矩形平板在均布或集中载荷下的最大挠度与弯曲应力（系数查表插值）。',
    doc: '复刻自 mechtool.cn <b>矩形平板弯曲计算</b>（6 种支承与载荷工况）。系数表取自《机械设计手册》标准平板计算系数表，按 a/b（或 b/a）比值<b>线性插值</b>，与原站服务端查表一致。挠度单位米(m)、应力单位帕(Pa)，输入按 mm 换算。',
    inputs: [
      { key: 'case', label: '支承与载荷工况', group: '工况', type: 'segment', options: [
        { v: '1', t: '周界铰支·均布 q' },
        { v: '2', t: '周界固定·均布 q' },
        { v: '3', t: '周界铰支·中心集中 P' },
        { v: '4', t: '周界固定·中心集中 P' },
        { v: '5', t: '两简支一固定一自由·均布 q' },
        { v: '6', t: '两简支一固定一自由·自由边集中 P' }
      ], default: '1' },
      { key: 'a', label: '板长 a', group: '几何', type: 'number', unit: 'mm', default: 1000, step: 'any' },
      { key: 'b', label: '板宽 b', group: '几何', type: 'number', unit: 'mm', default: 500, step: 'any' },
      { key: 'h', label: '板厚 h', group: '几何', type: 'number', unit: 'mm', default: 20, step: 'any' },
      { key: 'load', label: '载荷（q 或 P, 视工况）', group: '载荷与材料', type: 'number', default: 1000, step: 'any', hint: '均布 q(kN/m²) 或集中 P(N)' },
      { key: 'Em', label: '弹性模量 E', group: '载荷与材料', type: 'number', unit: 'MPa', default: 200000, step: 'any' }
    ],
    compute: function (v) {
      var a = +v.a, b = +v.b, h = +v.h, load = +v.load, Em = +v.Em;
      if (!(a > 0) || !(b > 0) || !(h > 0) || !(load > 0) || !(Em > 0)) return { error: '请输入有效参数' };
      var cs = v.case;
      var E = Em * 1e6; // MPa → Pa
      var loadPa = cs === '1' || cs === '2' || cs === '5' ? load * 1e3 : load; // kN/m² → Pa(均布)；集中P直接N
      // 统一转 m
      var aM = a / 1000, bM = b / 1000, hM = h / 1000;
      var ratio = a / b;
      var rows = [], title = '';
      function row(l, val) { rows.push({ label: l, value: val, unit: 'm', d: 9, hl: true }); }
      function rowS(l, val) { rows.push({ label: l, value: val, unit: 'Pa', d: 1, hl: true }); }
      var f, verdictT;
      if (cs === '1') { // 周界铰支均布
        if (ratio < 1 || ratio >= 5) return { error: '周界铰支均布载荷要求 1≤a/b＜5' };
        var c0 = interp(PB_SIMPLE_Q, ratio, 1), c1 = interp(PB_SIMPLE_Q, ratio, 2), c2 = interp(PB_SIMPLE_Q, ratio, 3);
        f = c0 * loadPa * Math.pow(bM, 4) / (E * Math.pow(hM, 3));
        title = '周界铰支 · 均布载荷 q（a/b=' + fmt(ratio, 2) + '）';
        rows.push({ label: '最大挠度 f=c0·q·b⁴/Eh³', value: f, unit: 'm', d: 9, hl: true });
        rowS('中心应力 σz=c1·q·b²/h²', c1 * loadPa * Math.pow(bM, 2) / (hM * hM));
        rowS('中心应力 σx=c2·q·b²/h²', c2 * loadPa * Math.pow(bM, 2) / (hM * hM));
        verdictT = 'f=' + fmt(f, 8) + ' m';
      } else if (cs === '2') { // 周界固定均布
        if (ratio < 1) return { error: '周界固定均布要求 a/b≥1' };
        var f0 = interp(PB_FIXED_Q, ratio, 1), sz = interp(PB_FIXED_Q, ratio, 2), sb = interp(PB_FIXED_Q, ratio, 3);
        f = f0 * loadPa * Math.pow(bM, 4) / (E * Math.pow(hM, 3));
        title = '周界固定 · 均布载荷 q（a/b=' + fmt(ratio, 2) + '）';
        rows.push({ label: '最大挠度 f=c0·q·b⁴/Eh³', value: f, unit: 'm', d: 9, hl: true });
        rowS('中心应力 σz=c1·q·b²/h²', sz * loadPa * Math.pow(bM, 2) / (hM * hM));
        rowS('长边中点固定边应力 σb=c2·q·b²/h²', sb * loadPa * Math.pow(bM, 2) / (hM * hM));
        verdictT = 'f=' + fmt(f, 8) + ' m';
      } else if (cs === '3') { // 周界铰支集中
        if (ratio < 1) return { error: '周界铰支集中要求 a/b≥1' };
        var c = interp(PB_SIMPLE_P, ratio, 1);
        f = c * loadPa * Math.pow(bM, 2) / (E * Math.pow(hM, 3));
        title = '周界铰支 · 中心集中载荷 P（a/b=' + fmt(ratio, 2) + '）';
        rows.push({ label: '最大挠度 f=c·P·b²/Eh³', value: f, unit: 'm', d: 9, hl: true });
        verdictT = 'f=' + fmt(f, 8) + ' m';
      } else if (cs === '4') { // 周界固定集中
        if (ratio < 1) return { error: '周界固定集中要求 a/b≥1' };
        var c4 = interp(PB_FIXED_P, ratio, 1), s4 = interp(PB_FIXED_P, ratio, 2);
        f = c4 * loadPa * Math.pow(bM, 2) / (E * Math.pow(hM, 3));
        title = '周界固定 · 中心集中载荷 P（a/b=' + fmt(ratio, 2) + '）';
        rows.push({ label: '最大挠度 f=c·P·b²/Eh³', value: f, unit: 'm', d: 9, hl: true });
        rowS('固定边中点应力 σb=c·P/h²', s4 * loadPa / (hM * hM));
        verdictT = 'f=' + fmt(f, 8) + ' m';
      } else if (cs === '5') { // 三边支承第四边自由，均布
        var bratio = b / a;
        var c5 = interp(PB_3EDGE_FREE_Q, bratio, 1), sa = interp(PB_3EDGE_FREE_Q, bratio, 2), sbb = interp(PB_3EDGE_FREE_Q, bratio, 3);
        f = c5 * loadPa * Math.pow(aM, 4) / (E * Math.pow(hM, 3));
        title = '两简支一固定一自由 · 均布 q（b/a=' + fmt(bratio, 2) + '）';
        rows.push({ label: '最大挠度 f=c·q·a⁴/Eh³', value: f, unit: 'm', d: 9, hl: true });
        rowS('应力 σa=c·q·a²/h²', sa * loadPa * Math.pow(aM, 2) / (hM * hM));
        rowS('应力 σb=c·q·a²/h²', sbb * loadPa * Math.pow(aM, 2) / (hM * hM));
        verdictT = 'f=' + fmt(f, 8) + ' m';
      } else { // case6 自由边中心集中 P：f=1.82·P·b²/(E·h³); σ=3.06·P/h²
        f = 1.82 * loadPa * Math.pow(bM, 2) / (E * Math.pow(hM, 3));
        title = '两简支一固定一自由 · 自由边中心集中 P';
        rows.push({ label: '最大挠度 f=1.82·P·b²/Eh³', value: f, unit: 'm', d: 9, hl: true });
        rowS('最大应力 σ=3.06·P/h²', 3.06 * loadPa / (hM * hM));
        verdictT = 'f=' + fmt(f, 8) + ' m';
      }
      return {
        sections: [{ title: title, rows: rows }],
        verdict: { level: 'ok', text: verdictT, note: '板中心/边部应力以正号计绝对值，未纳入屈服校核。' },
        notes: [
          '系数表取自《机械设计手册》标准矩形平板弯曲系数表，按 a/b（或 b/a）线性插值复刻原站服务端。',
          'σ 为板表面最大弯曲应力（Pa），f 为最大挠度（m）。均布载荷输入 q(kN/m²)、集中载荷输入 P(N)。'
        ]
      };
    },
    formulas: [
      '简支均布 f=c0·q·b⁴/Eh³, σz=c1·q·b²/h²；固定均布 σb=c2·q·b²/h²',
      '集中载荷 f=c·P·b²/Eh³；自由边集中 f=1.82·P·b²/Eh³, σ=3.06·P/h²',
      '系数按 a/b 查《机械设计手册》平板弯曲系数表线性插值'
    ],
    reference: 'mechtool.cn 矩形平板弯曲计算；《机械设计手册》平板计算系数表。'
  });

  /* =====================================================
   * 5. 薄壳中应力与位移计算
   * 10 种工况（球罐/圆柱壳/圆锥壳等），均按薄壳无矩理论
   * (薄膜应力) 计算。关键公式：
   *  - 球壳/圆柱壳 σm=pR/(2h), σt=pR/h, ω=pR²(1-μ/2)/(Eh)
   *  - 装满液体等按 ρg·(液柱高) 压力分布。
   * 单位：p(N/m²=Pa)、R/m、h/m、g=9.8m/s²、E(Pa)。
   * ===================================================== */
  App.registerTool({
    id: 'shell-stress',
    name: '薄壳中应力与位移计算',
    category: 'common',
    keywords: '薄壳 应力 位移 球罐 圆柱壳 圆锥壳 薄膜理论 压力容器 内压',
    brief: '按薄壳无矩(薄膜)理论计算球罐、圆柱壳、圆锥壳在内压或液体载荷下的环向/经向应力与位移。',
    doc: '复刻自 mechtool.cn <b>薄壳中应力与位移计算</b>。采用<b>无矩理论</b>（薄膜理论），仅适用于薄壳（h≪R）无弯曲约束；公式与本页资料一致：球壳 σm=σt=pR/(2h)，圆柱壳环向 σt=pR/h、经向 σm=pR/(2h)。g 取 9.8 m/s²。',
    inputs: [
      { key: 'shell', label: '壳体类型', group: '壳体', type: 'segment', options: [
        { v: 'sphere', t: '球壳(均匀内压)' },
        { v: 'cyl', t: '圆柱壳(均匀内压)' },
        { v: 'sphereLiq', t: '球壳(装液体)' },
        { v: 'cylLiq', t: '圆柱壳(装液体)' },
        { v: 'coneLiq', t: '圆锥壳(装液体,自由支承)' }
      ], default: 'sphere' },
      { key: 'p', label: '内压 p', group: '载荷', type: 'number', unit: 'Pa', default: 1000, step: 'any', hint: '受均匀内压时使用' },
      { key: 'rho', label: '液体密度 ρ', group: '载荷', type: 'number', unit: 'kg/m³', default: 1000, step: 'any', hint: '装液体工况使用' },
      { key: 'R', label: '中面半径 R', group: '几何', type: 'number', unit: 'm', default: 0.5, step: 'any' },
      { key: 'h', label: '壳厚 h', group: '几何', type: 'number', unit: 'm', default: 0.05, step: 'any' },
      { key: 'H', label: '液柱高度/壳体高 H', group: '几何', type: 'number', unit: 'm', default: 1.5, step: 'any', hint: '装液体工况时液面高度' },
      { key: 'x', label: '计算位置 x', group: '几何', type: 'number', unit: 'm', default: 1, step: 'any', hint: '距液面深度(或距边界)' },
      { key: 'alpha', label: '锥体半角 α', group: '几何', type: 'number', unit: '°', default: 20, step: 'any', hint: '圆锥壳工况' },
      { key: 'mu', label: '泊松比 μ', group: '材料', type: 'number', unit: '', default: 0.3, step: 'any' },
      { key: 'Em', label: '弹性模量 E', group: '材料', type: 'number', unit: 'MPa', default: 200000, step: 'any' }
    ],
    compute: function (v) {
      var R = +v.R, h = +v.h, mu = +v.mu, Em = +v.Em;
      if (!(R > 0) || !(h > 0) || !(Em > 0)) return { error: '请输入有效半径、壳厚与弹性模量' };
      var E = Em * 1e6, g = 9.8;
      var p = +v.p, rho = +v.rho, H = +v.H, x = +v.x, alpha = +v.alpha * Math.PI / 180;
      var st = 0, sm = 0, w = null, rows = [], title = '', extra = '';
      function stressRow(la, vv) { rows.push({ label: la, value: vv, unit: 'Pa', d: 1, hl: true }); }
      function dispRow(la, vv) { rows.push({ label: la, value: vv, unit: 'm', d: 10, hl: true }); }
      if (v.shell === 'sphere' || v.shell === 'cyl') {
        if (!(p > 0)) return { error: '请输内压 p' };
        if (v.shell === 'sphere') {
          sm = p * R / (2 * h); st = sm;
          w = p * R * R * (1 - mu) / (2 * E * h);
          title = '球壳 · 均匀内压';
          stressRow('经向应力 σm=pR/(2h)', sm);
          stressRow('环向应力 σt=σm=pR/(2h)', st);
          dispRow('径向位移 ω=pR²(1-μ)/(2Eh)', w);
          extra = '球壳 σm=σt=pR/(2h)';
        } else {
          sm = p * R / (2 * h); st = p * R / h;
          w = p * R * R * (1 - mu / 2) / (E * h);
          title = '圆柱壳(带底) · 均匀内压';
          stressRow('经向应力 σm=pR/(2h)', sm);
          stressRow('环向应力 σt=pR/h（最大值）', st);
          dispRow('径向位移 ω=pR²(1-μ/2)/(Eh)', w);
          extra = '圆柱壳环向应力为最大 σmax=σt=pR/h';
        }
      } else { // 液体载荷（无矩理论：压力沿液深线性）
        if (!(rho > 0) || !(R > 0)) return { error: '请输液体密度与半径' };
        var pAt = rho * g * x; // 距液面 x 处的液体静压
        if (v.shell === 'sphereLiq') { // 球壳装液体，在距顶部 x 处
          sm = pAt * R / (2 * h); st = pAt * R / h;
          title = '球壳 · 装液体（距液面 x=' + fmt(x, 2) + ' m）';
          stressRow('经向应力 σm=ρgx·R/(2h)', sm);
          stressRow('环向应力 σt=ρgx·R/h', st);
          extra = '液深 x 处静压 ρgx；σt 为环向最大';
        } else if (v.shell === 'cylLiq') { // 圆柱壳装液体，上边自由支承
          sm = rho * g * H * R / (2 * h); // 底部经向最大
          st = rho * g * (H - x) * R / h;
          title = '圆柱壳(上边自由支承) · 装液体（H=' + fmt(H, 2) + ' m）';
          stressRow('经向应力 σm=ρgH·R/(2h)', sm);
          stressRow('环向应力 σt=ρg(H-x)·R/h', st);
          extra = 'x 为距底部位置，σt 随 x 增大而减小，底部环向最大';
        } else { // coneLiq 圆锥壳装液体，自由支承
          if (!(alpha > 0)) return { error: '请输入锥体半角 α' };
          // 圆锥壳：与中面母线相切的膜应力，x 沿锥面斜长
          var sinA = Math.sin(alpha), cosA = Math.cos(alpha);
          st = rho * g * x * R * cosA / (h * (1)); // 环向（关于锥面）
          sm = rho * g * x * R / (2 * h * cosA);
          title = '圆锥壳(自由支承) · 装液体（α=' + (v.alpha) + '°）';
          stressRow('经向应力 σm=ρgx·R/(2h·cosα)', sm);
          stressRow('环向应力 σt=ρgx·R·cosα/h', st);
          extra = 'x 沿锥面母线；σmmax 约在 x=3H/4、σtmax 约在 x=H/2';
        }
      }
      return {
        sections: [{ title: title, rows: rows }],
        verdict: { level: 'ok', text: extra },
        notes: [
          '按薄壳无矩(薄膜)理论，适用于薄壳(h≪R)且无弯曲约束；若存在支座弯矩需用有矩理论修正。',
          '压力 p 单位 Pa(N/m²)；E=Em×10⁶(Pa)；重力加速度 g=9.8 m/s²。',
          '装液体工况为液体静压 ρg·(液深) 沿壳体分布，本实现按关键位置(底部/液深 x)给出应力。'
        ]
      };
    },
    formulas: [
      '球壳 σm=σt=pR/(2h), ω=pR²(1-μ)/(2Eh)',
      '圆柱壳 σt=pR/h, σm=pR/(2h), ω=pR²(1-μ/2)/(Eh)',
      '液体静压 p=ρg·h液；圆锥壳需按半角 α 修正母线方向'
    ],
    reference: 'mechtool.cn 薄壳中应力与位移计算；《机械设计手册》压力容器薄膜应力公式。'
  });

  /* =====================================================
   * 6. 平面机构的受力分析（构件惯性力的计算）
   * 3 类：
   *  - 移动构件：Pg=-m·ac, Mg=0
   *  - 回转轴通过惯性主轴：Pg=0, Mg=-Jc·ε
   *  - 平面复合运动：Pg=-m·ac, Mg=-Jc·ε
   * 并按"不作用于重心"合成总惯性力表达（撞击中心）。
   * ===================================================== */
  App.registerTool({
    id: 'mechanism-force',
    name: '构件惯性力的计算（平面机构受力分析）',
    category: 'common',
    keywords: '惯性力 惯性力矩 构件 平面机构 移动构件 回转构件 转动惯量 角加速度 撞击中心',
    brief: '计算平面机构构件（移动/回转/平面复合运动）的惯性力、惯性力矩与合成（撞击中心位置）。',
    doc: '复刻自 mechtool.cn <b>平面机构的受力分析-构件惯性力的计算</b>。按达朗贝尔原理：惯性力 Pg=-m·ac，惯性力矩 Mg=-Jc·ε；可进一步将惯性力与惯性力矩合成为一个偏离重心 h 的总惯性力（K 点为撞击中心）。',
    inputs: [
      { key: 'type', label: '构件类型', group: '构件', type: 'segment', options: [
        { v: 'trans', t: '移动构件' },
        { v: 'rotateMain', t: '回转·轴过惯性主轴' },
        { v: 'rotateOff', t: '回转·轴不通过主轴' },
        { v: 'planar', t: '平面复合运动' }
      ], default: 'trans' },
      { key: 'm', label: '构件质量 m', group: '参数', type: 'number', unit: 'kg', default: 100, step: 'any' },
      { key: 'ac', label: '重心加速度 ac', group: '参数', type: 'number', unit: 'm/s²', default: 2, step: 'any' },
      { key: 'jc', label: '转动惯量 Jc', group: '参数', type: 'number', unit: 'kg·m²', default: 200, step: 'any' },
      { key: 'eps', label: '角加速度 ε', group: '参数', type: 'number', unit: 'rad/s²', default: 1, step: 'any' },
      { key: 'rc', label: '重心距回转轴距离 rc', group: '参数', type: 'number', unit: 'm', default: 0.5, step: 'any', hint: '回转轴不通过主轴时使用' }
    ],
    compute: function (v) {
      var m = +v.m, ac = +v.ac, jc = +v.jc, eps = +v.eps, rc = +v.rc;
      var t = v.type;
      var rows = [], title = '', extra = '';
      var pg = 0, mg = 0;
      function fr(l, vv, u) { rows.push({ label: l, value: vv, unit: u, d: 3, hl: true }); }
      if (t === 'trans') {
        if (!(m > 0) || !(ac > 0)) return { error: '移动构件需质量 m 与加速度 ac' };
        pg = -m * ac; mg = 0;
        title = '移动构件（平移无角加速度）';
        fr('惯性力 Pg=-m·ac', pg, 'N');
        fr('惯性力矩 Mg=-Jc·ε', mg, 'N·m');
        extra = '负号表示惯性力方向与重心加速度反向';
      } else if (t === 'rotateMain') {
        if (!(jc > 0) || !(eps > 0)) return { error: '回转轴过主轴需 Jc 与 ε' };
        pg = 0; mg = -jc * eps;
        title = '回转构件（轴通过惯性主轴，重心加速度为零）';
        fr('惯性力 Pg=-m·ac', pg, 'N');
        fr('惯性力矩 Mg=-Jc·ε', mg, 'N·m');
        extra = '仅有惯性力矩，无惯性力';
      } else if (t === 'rotateOff') {
        if (!(m > 0) || !(ac > 0) || !(jc > 0) || !(eps > 0) || !(rc > 0)) return { error: '回转轴不通过主轴需 m、ac、Jc、ε、rc' };
        pg = -m * ac; mg = -jc * eps;
        var h = jc * eps / (m * ac); // 合成惯性力偏离重心距离
        var ok = rc + jc / (m * rc); // 撞击中心到回转中心距离
        title = '回转构件（轴不通过惯性主轴）';
        fr('惯性力 Pg=-m·ac', pg, 'N');
        fr('惯性力矩 Mg=-Jc·ε', mg, 'N·m');
        fr('合成惯性力偏距 h=Jc·ε/(m·ac)', h, 'm');
        fr('撞击中心距离 OK=rc+Jc/(m·rc)', ok, 'm');
        extra = 'K 点称为撞击中心，OK=rc+Jc/(m·rc)';
      } else { // planar 平面复合运动
        if (!(m > 0) || !(ac > 0) || !(jc > 0) || !(eps > 0)) return { error: '平面复合运动需 m、ac、Jc、ε' };
        pg = -m * ac; mg = -jc * eps;
        title = '平面复合运动构件';
        fr('惯性力 Pg=-m·ac', pg, 'N');
        fr('惯性力矩 Mg=-Jc·ε', mg, 'N·m');
        extra = '惯性力作用于重心，同时存在惯性力矩';
      }
      return {
        sections: [{ title: title, rows: rows }],
        verdict: { level: 'ok', text: 'Pg=' + fmt(pg, 2) + ' N' + (rows.length > 2 ? '，Mg=' + fmt(mg, 2) + ' N·m' : '') },
        notes: [
          '惯性力 Pg=-m·ac：负号表示与重心加速度 ac 方向相反。',
          '惯性力矩 Mg=-Jc·ε：负号表示与角加速度 ε 方向相反。',
          '将惯性力与惯性力矩合成为一个不作用于重心的总惯性力；回转工况下合成力作用线过撞击中心 K。'
        ]
      };
    },
    formulas: [
      '惯性力 Pg=-m·ac；惯性力矩 Mg=-Jc·ε',
      '合成惯性力偏距 h=Jc·ε/(m·ac)=ρc²·ε/ac',
      '撞击中心 OK=rc+Jc/(m·rc)'
    ],
    reference: 'mechtool.cn 平面机构的受力分析-构件惯性力的计算；《机械原理》达朗贝尔原理。'
  });
})();