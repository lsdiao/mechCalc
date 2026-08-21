/* =========================================================
 * 液压传动系统类工具（第 2 批，复刻 原站）
 * 1. 液压传动系统计算（阻力/压降）      id=hydraulic-pipe-loss
 * 2. 液压泵计算                         id=hydraulic-pump
 * 3. 液压马达计算                       id=hydraulic-motor
 * 4. 液压千斤顶计算                     id=hydraulic-jack
 * 5. 油箱热平衡计算                     id=oil-tank-balance
 *
 * 来源页（category=fluid）：
 *   
 *   
 *   
 *   
 *   
 * 原站公式位于混淆前端 JS（hydraulicdrive.min.js / hydraulicpneumatic.min.js），
 * 经服务端接口(计算在服务端)逐点打桩对齐得到。本文件按 App.registerTool 模式实现。
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  /* ============ 1. 液压传动系统计算（阻力/压降） ============ */
  /* 来源页：calculation_hydraulicdrivesystemcalculation.html
   * 表单① 沿程阻力（id=headLossCal1，接口 headloss1）
   *   默认值：Q=23 L/min，d=8 mm，ν=40 cSt，ε=0.1 mm，l=1 m，ρ=900 kg/m³
   *   关键常量：层流↔湍流临界 Re=2320；水力光滑判据 (ε/d)·Re<40→Blasius，否则 Swamee-Jain；
   *   Δp(bar)=λ·(l/d)·ρv²/2 / 1e5
   * 表单② 局部阻力（id=headLossCal2，接口 headloss2）
   *   默认值：Q=23 L/min，d=8 mm，ρ=900 kg/m³，ζ=1
   *   Δp(bar)=ζ·ρv²/2 / 1e5
   */
  App.registerTool({
    id: 'hydraulic-pipe-loss',
    name: '液压传动系统计算（阻力/压降）',
    category: 'fluid',
    keywords: '液压 管路 阻力 压降 沿程 局部 雷诺数 层流 湍流 粗糙度',
    brief: '液压管路沿程与局部压力损失计算（雷诺数、阻力系数、流速、压降），同样适用于水系统。',
    doc: '计算液压管路<b>沿程压力损失</b>（基于雷诺数判别层流/湍流，水力光滑用 Blasius、粗糙管用 Swamee-Jain 求阻力系数 λ）与<b>局部压力损失</b>（ζ·ρv²/2）。输入流量、管路内径、油液参数即可得到流速、雷诺数、阻力系数与压降(bar)。',
    inputs: [
      { key: 'mode', label: '计算方式', group: '类型', type: 'segment', options: [
        { v: 'friction', t: '沿程阻力（直管）' }, { v: 'local', t: '局部阻力（管件）' }
      ] },
      { key: 'Q', label: '系统流量 Q', group: '系统参数', type: 'number', unit: 'L/min', default: 23, step: 'any' },
      { key: 'd', label: '管路内径 d', group: '系统参数', type: 'number', unit: 'mm', default: 8, step: 'any' },
      { key: 'rho', label: '液压油密度 ρ', group: '系统参数', type: 'number', unit: 'kg/m³', default: 900, step: 'any' },
      { key: 'nu', label: '油液运动粘度 ν', group: '沿程阻力参数', type: 'number', unit: 'cSt', default: 40, step: 'any' },
      { key: 'eps', label: '管壁粗糙度 ε', group: '沿程阻力参数', type: 'number', unit: 'mm', default: 0.1, step: 'any' },
      { key: 'L', label: '直管长度 l', group: '沿程阻力参数', type: 'number', unit: 'm', default: 1, step: 'any' },
      { key: 'zeta', label: '局部阻力系数 ζ', group: '局部阻力参数', type: 'number', default: 1, step: 'any', hint: '可查《机械设计手册》或原站局部阻力系数表' }
    ],
    compute: function (v) {
      var Q = +v.Q, d = +v.d, rho = +v.rho;
      if (!(Q > 0) || !(d > 0) || !(rho > 0)) return { error: '请输入有效的流量、内径与密度' };
      var A = Math.PI * Math.pow(d / 1000, 2) / 4; // m²
      var vel = (Q / 60000) / A;                    // m/s

      if (v.mode === 'local') {
        var zeta = +v.zeta;
        var hlLocal = zeta * rho * vel * vel / 2 / 1e5; // bar
        return {
          sections: [{
            title: '局部压力损失', rows: [
              { label: '平均流速 v=Q/A', value: vel, unit: 'm/s', d: 3, hl: true },
              { label: '动态压力 ρv²/2', value: rho * vel * vel / 2, unit: 'Pa', d: 1 },
              { label: '局部压降 Δp=ζ·ρv²/2', value: hlLocal, unit: 'bar', d: 4, hl: true },
              { label: '局部压降 Δp', value: hlLocal * 1e5, unit: 'Pa', d: 0 },
              { label: '局部压降 Δp', value: hlLocal / 10, unit: 'MPa', d: 5 }
            ]
          }],
          verdict: {
            level: 'ok',
            text: '局部压力损失 Δp = ' + fmt(hlLocal, 4) + ' bar（ζ=' + fmt(zeta) + '）',
            note: '局部阻力系数 ζ 随管件类型差异很大，弯头/接头/阀体可从手册或原站阻力系数表查取。'
          },
          notes: [
            '局部压降 Δp = ζ·ρv²/2，v 取局部管件后过流断面平均流速。',
            '多个管件串联时局部压降相加；本项目同原站仅计算单个管件。'
          ]
        };
      }

      var nu = +v.nu, eps = +v.eps, L = +v.L;
      if (!(nu > 0) || eps < 0 || !(L > 0)) return { error: '请输入有效的粘度、粗糙度与长度' };
      var nuM = nu * 1e-6;                          // cSt → m²/s
      var dm = d / 1000;
      var Re = vel * dm / nuM;                      // 雷诺数
      var laminar = Re < 2320;                      // 层流临界 Re=2320
      var lambda;
      if (laminar) {
        lambda = 64 / Re;                           // 层流 λ=64/Re
      } else if ((eps / d) * Re < 40) {
        lambda = 0.3164 / Math.pow(Re, 0.25);       // 水力光滑 → Blasius 公式
      } else {
        lambda = 0.25 / Math.pow(Math.log10(eps / (3.7 * d) + 5.74 / Math.pow(Re, 0.9)), 2); // Swamee-Jain
      }
      var hl = lambda * (L / dm) * rho * vel * vel / 2 / 1e5; // bar
      return {
        sections: [
          { title: '流动参数', rows: [
            { label: '平均流速 v=Q/A', value: vel, unit: 'm/s', d: 3, hl: true },
            { label: '雷诺数 Re=vd/ν', value: Re, d: 1, hl: true },
            { label: '流态（Re<2320 层流）', value: laminar ? '层流' : '湍流', hl: true }
          ] },
          { title: '阻力系数与压降', rows: [
            { label: '阻力系数 λ（Re<2320→64/Re，光滑→Blasius，粗糙→Swamee-Jain）', value: lambda, d: 4, hl: true },
            { label: '沿程压降 Δp=λ·(l/d)·ρv²/2', value: hl, unit: 'bar', d: 4, hl: true },
            { label: '沿程压降 Δp', value: hl * 1e5, unit: 'Pa', d: 0 },
            { label: '沿程压降 Δp', value: hl / 10, unit: 'MPa', d: 5 },
            { label: '管长直径比 l/d', value: L / dm, d: 1 }
          ] }
        ],
        verdict: {
          level: laminar ? 'ok' : (hl > 10 ? 'warn' : 'ok'),
          text: (laminar ? '层流' : '湍流') + '流动，λ=' + fmt(lambda, 4) + '，沿程压降 Δp=' + fmt(hl, 4) + ' bar',
          note: '湍流状态下阻力系数随雷诺数与相对粗糙度变化；ε/d 越大 λ 越大。局部损失需另外叠加。'
        },
        notes: [
          '雷诺数 Re = v·d/ν（ν 为运动粘度，cSt→m²/s 乘 1e-6）。',
          '层流（Re<2320）λ=64/Re；水力光滑（ε/d·Re<40）用 Blasius λ=0.3164·Re^-0.25；粗糙管用 Swamee-Jain。',
          '沿程压降 Δp = λ·(l/d)·ρv²/2，输出单位 bar（1bar=1e5Pa）。',
          '本页同时适用于水系统（水系统计算见原站 water 系列页面）。'
        ]
      };
    },
    formulas: [
      'v = Q/A（Q:L/min→m³/s 除 60000；A=πd²/4，d 以 m 计）',
      'Re = v·d/ν，ν(cSt)×1e-6 = m²/s',
      '层流 λ=64/Re；光滑（ε/d·Re<40）λ=0.3164Re^-0.25；粗糙 λ=0.25/[log10(ε/3.7d+5.74/Re^0.9)]²',
      'Δp(bar)=λ(l/d)ρv²/2 /1e5；局部 Δp(bar)=ζρv²/2 /1e5'
    ],
    reference: '来源 '
  });

  /* ============ 2. 液压泵计算 ============ */
  /* 来源页：calculation_hydraulicpumpcalculation.html（form=hydraulicPumpCal）
   * 计算方法下拉：流量(默认)/排量/电机功率/总效率；单位：V(mL/rev)、N(rpm)、Q(L/min)、p(MPa)、效率(%)。
   * 关键常量/公式：Q=V·N·ηv/60；V=Q·60/(N·ηv)；P(W)=p·Q·1000/(60·ηv·ηm)；η=ηv·ηm(%)
   * 注：原站默认输入为空（需用户手填），此处给出可用于量级校验的参考默认值。
   */
  App.registerTool({
    id: 'hydraulic-pump',
    name: '液压泵计算',
    category: 'fluid',
    keywords: '液压泵 流量 排量 电机功率 总效率 容积效率 机械效率',
    brief: '液压泵流量、排量、驱动电机功率与总效率计算（支持三种求解方式）。',
    doc: '由液压泵<b>排量 V、转速 n</b>与容积效率 ηv 求<b>流量</b>，可选<b>排量、电机功率、总效率</b>等求解方式。电机功率 P=p·Q/(60·ηv·ηm)，总效率 η=(ηv·ηm)%。',
    inputs: [
      { key: 'calc', label: '计算方式', group: '求解方式', type: 'select', options: [
        { v: '流量', t: '流量' }, { v: '排量', t: '排量' }, { v: '电机功率', t: '电机功率' }, { v: '总效率', t: '总效率' }
      ] },
      { key: 'V', label: '排量 V', group: '泵参数', type: 'number', unit: 'mL/rev', default: 50, step: 'any' },
      { key: 'N', label: '转速 n', group: '泵参数', type: 'number', unit: 'rpm', default: 1000, step: 'any' },
      { key: 'Q', label: '流量 Q', group: '泵参数', type: 'number', unit: 'L/min', default: 45, step: 'any' },
      { key: 'p', label: '压力 p', group: '泵参数', type: 'number', unit: 'MPa', default: 10, step: 'any' },
      { key: 'etav', label: '容积效率 ηv', group: '效率参数', type: 'number', unit: '%', default: 90, step: 'any' },
      { key: 'etam', label: '机械效率 ηm', group: '效率参数', type: 'number', unit: '%', default: 90, step: 'any' }
    ],
    compute: function (v) {
      var V = +v.V, N = +v.N, Q = +v.Q, p = +v.p, etav = +v.etav, etam = +v.etam;
      var fv = etav / 100, fm = etam / 100;
      var out = { sections: [], notes: [] };
      var verdict = { level: 'ok', text: '', note: '' };

      if (v.calc === '流量') {
        if (!(V > 0) || !(N > 0) || !(fv > 0)) return { error: '流量需 排量V、转速n、容积效率ηv' };
        var Qo = V * N * fv / 60;                    // L/min
        var Po = V * N / 60 / fv;                    // 理论流量（忽略容积效率）
        out.sections = [{ title: '泵流量', rows: [
          { label: '实际流量 Q=V·n·ηv/60', value: Qo, unit: 'L/min', d: 3, hl: true },
          { label: '理论流量（无泄漏）', value: Po, unit: 'L/min', d: 3 },
          { label: '容积参数 V·n', value: V * N, unit: 'mL/min', d: 0 }
        ] }];
        verdict.text = '泵实际流量 Q = ' + fmt(Qo, 3) + ' L/min';
        verdict.note = 'V=50mL/rev、n=1000rpm、ηv=90% 时 Q=750 L/min。';
      } else if (v.calc === '排量') {
        if (!(Q > 0) || !(N > 0) || !(fv > 0)) return { error: '排量需 流量Q、转速n、容积效率ηv' };
        var Vo = Q * 60 / (N * fv);                  // mL/rev
        out.sections = [{ title: '泵排量', rows: [
          { label: '排量 V=Q·60/(n·ηv)', value: Vo, unit: 'mL/rev', d: 3, hl: true },
          { label: '需泵每分钟扫过的容积', value: Q * 1000 / fv, unit: 'mm³/rev', d: 0 }
        ] }];
        verdict.text = '所需排量 V = ' + fmt(Vo, 3) + ' mL/rev (Q=' + fmt(Q) + ' L/min, n=' + fmt(N) + ' rpm, ηv=' + fmt(fv * 100) + '%)';
      } else if (v.calc === '电机功率') {
        // 若给定 V、n 且未给 Q，则由 V、n 求 Q
        if ((!Q || !(Q > 0)) && V > 0 && N > 0 && fv > 0) Q = V * N * fv / 60;
        if (!(Q > 0) || !(p > 0)) return { error: '电机功率需 压力p 与 流量Q' };
        if (!(fv > 0) || !(fm > 0)) return { error: '电机功率需 容积效率与机械效率' };
        var Pw = p * Q * 1000 / (60 * fv * fm);      // W
        out.sections = [{ title: '驱动电机功率', rows: [
          { label: '有效输出功率（理论）', value: p * Q / 60, unit: 'kW', d: 3 },
          { label: '电机功率 P=p·Q/(60·ηv·ηm)', value: Pw / 1000, unit: 'kW', d: 3, hl: true },
          { label: '电机功率 P', value: Pw, unit: 'W', d: 1, hl: true }
        ] }];
        verdict.text = '驱动电机功率 P = ' + fmt(Pw / 1000, 3) + ' kW';
        verdict.note = '工程经验通常再留 1.1~1.25 倍裕量选电机。';
      } else if (v.calc === '总效率') {
        if (!(etav > 0) || !(etam > 0)) return { error: '总效率需 容积效率与机械效率' };
        var eta = (etav * etam) / 100;               // %
        out.sections = [{ title: '泵总效率', rows: [
          { label: '容积效率 ηv', value: etav, unit: '%', d: 2 },
          { label: '机械效率 ηm', value: etam, unit: '%', d: 2 },
          { label: '总效率 η=ηv·ηm', value: eta, unit: '%', d: 2, hl: true }
        ] }];
        verdict.text = '泵总效率 η = ' + fmt(eta, 2) + ' %';
        verdict.note = '总效率为容积与机械效率之积，实际还应计入液压冲击与元件损耗。';
      }
      return { sections: out.sections, verdict: verdict, notes: out.notes };
    },
    formulas: [
      '流量 Q = V·n·ηv/60（V:mL/rev，n:rpm，Q:L/min）',
      '排量 V = Q·60/(n·ηv)',
      '电机功率 P(W) = p(MPa)·Q(L/min)·1000/(60·ηv·ηm)',
      '总效率 η(%) = ηv·ηm'
    ],
    reference: '来源 '
  });

  /* ============ 3. 液压马达计算 ============ */
  /* 来源页：calculation_hydraulicmotorcalculation.html（form=hydraulicMotorCal）
   * 计算方法下拉：流量(默认)/压力/排量/速度/扭矩/功率；单位：V(mL/rev)、n(rpm)、Q(L/min)、p(MPa)、
   * T(N·m)、P(W)、效率(%)。关键公式：扭矩 T=p·V·ηm/(2π)；压力 p=2π·T/(V·ηm)；
   * 功率 P=p·Q·ηv·ηm/60(kW)；速度 n=60·Q·ηv/V；流量 Q=V·n/(60·ηv)；排量 V=Q·60/(n·ηv)。
   * 注：原站默认输入为空，此处给出参考默认值。
   */
  App.registerTool({
    id: 'hydraulic-motor',
    name: '液压马达计算',
    category: 'fluid',
    keywords: '液压马达 扭矩 转速 排量 流量 压力 功率',
    brief: '液压马达扭矩、转速、排量、进出口压力与输出功率计算（六种求解方式）。',
    doc: '由液压马达<b>排量 V、压力 p、转速 n</b>等按需求解<b>扭矩、速度、排量、流量、压力、功率</b>。扭矩 T=p·V·ηm/(2π)，输出功率 P=p·Q·ηv·ηm/60(kW)。',
    inputs: [
      { key: 'calc', label: '计算方式', group: '求解方式', type: 'select', options: [
        { v: '流量', t: '流量' }, { v: '压力', t: '压力' }, { v: '排量', t: '排量' }, { v: '速度', t: '速度' }, { v: '扭矩', t: '扭矩' }, { v: '功率', t: '功率' }
      ] },
      { key: 'V', label: '排量 V', group: '马达参数', type: 'number', unit: 'mL/rev', default: 40, step: 'any' },
      { key: 'N', label: '转速 n', group: '马达参数', type: 'number', unit: 'rpm', default: 1500, step: 'any' },
      { key: 'Q', label: '流量 Q', group: '马达参数', type: 'number', unit: 'L/min', default: 50, step: 'any' },
      { key: 'p', label: '进出口压力差 p', group: '马达参数', type: 'number', unit: 'MPa', default: 10, step: 'any' },
      { key: 'T', label: '输出扭矩 T', group: '马达参数', type: 'number', unit: 'N·m', default: 50, step: 'any' },
      { key: 'P', label: '输出功率 P', group: '马达参数', type: 'number', unit: 'W', default: 5000, step: 'any' },
      { key: 'etav', label: '容积效率 ηv', group: '效率参数', type: 'number', unit: '%', default: 90, step: 'any' },
      { key: 'etam', label: '机械效率 ηm', group: '效率参数', type: 'number', unit: '%', default: 90, step: 'any' }
    ],
    compute: function (v) {
      var V = +v.V, N = +v.N, Q = +v.Q, p = +v.p, T = +v.T, P = +v.P, etav = +v.etav, etam = +v.etam;
      var fv = etav / 100, fm = etam / 100;
      var rows = [];
      var verdict = { level: 'ok', text: '', note: '' };

      if (v.calc === '流量') {
        if (!(V > 0) || !(N > 0) || !(fv > 0)) return { error: '流量需 排量V、转速n、容积效率ηv' };
        rows = [{ label: '输入流量 Q=V·n/(60·ηv)', value: V * N / (60 * fv), unit: 'L/min', d: 3, hl: true },
                { label: '流量（理论）V·n/60', value: V * N / 60, unit: 'L/min', d: 3 }];
        verdict.text = '液压马达输入流量 Q = ' + fmt(V * N / (60 * fv), 3) + ' L/min';
      } else if (v.calc === '压力') {
        if (T > 0 && V > 0 && fm > 0) {
          rows = [{ label: '压力差 p=2π·T/(V·ηm)', value: 2 * Math.PI * T / (V * fm), unit: 'MPa', d: 3, hl: true }];
        } else if (P > 0 && Q > 0 && fv > 0 && fm > 0) {
          var pk = P / 1000; // W→kW
          rows = [{ label: '压力差 p=P/(Q/60·ηv·ηm)', value: pk / ((Q / 60) * fv * fm), unit: 'MPa', d: 3, hl: true }];
        } else return { error: '压力需 扭矩+排量+机械效率 或 功率+流量+效率' };
        verdict.text = '马达进出口压力差 p = ' + fmt(rows[0].value, 3) + ' MPa';
      } else if (v.calc === '排量') {
        if (Q > 0 && N > 0 && fv > 0) {
          rows = [{ label: '排量 V=Q·60/(n·ηv)', value: Q * 60 / (N * fv), unit: 'mL/rev', d: 3, hl: true }];
        } else if (p > 0 && T > 0 && fm > 0) {
          rows = [{ label: '排量 V=2π·T/(p·ηm)', value: 2 * Math.PI * T / (p * fm), unit: 'mL/rev', d: 3, hl: true }];
        } else return { error: '排量需 流量+转速+容积效率 或 压力+扭矩+机械效率' };
        verdict.text = '马达排量 V = ' + fmt(rows[0].value, 3) + ' mL/rev';
      } else if (v.calc === '速度') {
        if (Q > 0 && V > 0 && fv > 0) {
          rows = [{ label: '转速 n=60·Q·ηv/V', value: 60 * Q * fv / V, unit: 'rpm', d: 3, hl: true }];
        } else return { error: '速度需 流量Q、排量V、容积效率ηv' };
        verdict.text = '马达转速 n = ' + fmt(60 * Q * fv / V, 3) + ' rpm';
      } else if (v.calc === '扭矩') {
        if (p > 0 && V > 0 && fm > 0) {
          rows = [{ label: '扭矩 T=p·V·ηm/(2π)', value: p * V * fm / (2 * Math.PI), unit: 'N·m', d: 3, hl: true }];
        } else return { error: '扭矩需 压力差p、排量V、机械效率ηm' };
        verdict.text = '马达输出扭矩 T = ' + fmt(p * V * fm / (2 * Math.PI), 3) + ' N·m';
      } else if (v.calc === '功率') {
        var Pw;
        if (T > 0 && N > 0) {
          Pw = T * N / 9550 * 1000;                  // W
          rows = [{ label: '输出功率 P=T·n/9550', value: Pw / 1000, unit: 'kW', d: 3, hl: true }];
        } else if (p > 0 && Q > 0 && fv > 0 && fm > 0) {
          Pw = (p * Q / 60) * fv * fm;               // kW → W
          rows = [{ label: '输出功率 P=p·Q·ηv·ηm/60', value: Pw, unit: 'kW', d: 3, hl: true },
                  { label: '输入液压功率 p·Q/60', value: p * Q / 60, unit: 'kW', d: 3 }];
        } else return { error: '功率需 扭矩+转速 或 压力+流量+效率' };
        verdict.text = '马达输出功率 P = ' + fmt(Pw, 3) + ' kW';
      }
      return {
        sections: [{ title: '马达计算（' + v.calc + '）', rows: rows }],
        verdict: verdict,
        notes: [
          '扭矩 T = p·V·ηm/(2π)（p:MPa，V:mL/rev，T:N·m）。',
          '输出功率 P = T·n/9550（kW）或 P = p·Q/60·ηv·ηm（kW）。',
          '输入流量 Q = V·n/(60·ηv)；容积效率与机械效率均为百分比输入。'
        ]
      };
    },
    formulas: [
      '扭矩 T = p·V·ηm/(2π)',
      '转速 n = 60·Q·ηv/V；排量 V = 60·Q/(n·ηv)',
      '输出功率 P = T·n/9550（kW）= p·Q·ηv·ηm/60（kW）',
      '压力差 p = 2π·T/(V·ηm)'
    ],
    reference: '来源 '
  });

  /* ============ 4. 液压千斤顶计算 ============ */
  /* 来源页：calculation_hydraulicjackcalculation.html（hydraulicpneumatic.min.js，帕斯卡原理）
   * 默认值：d1=20mm、F1=100N、s1=50mm、d2=80mm、Plim=20MPa、tCycle=5s
   * 关键公式：A=πd²/4(m²)；F2=F1·(d2/d1)²；s2=s1·(A1/A2)；P=F1/A1(Pa→MPa)；
   *   Q(L/min)=A1·s1·60/tCycle（A1:m²，s1:mm）；P泵(W)=F1·s1/(1000·tCycle)
   * 默认值校验：倍率16、F2=1600N、P=0.318MPa、s2=3.13mm、Q=0.19L/min、P=1.0W（与原站一致）。
   */
  App.registerTool({
    id: 'hydraulic-jack',
    name: '液压千斤顶计算',
    category: 'fluid',
    keywords: '千斤顶 帕斯卡 力放大 倍率 输出力 液压放大',
    brief: '基于帕斯卡原理计算液压千斤顶的力放大倍数、输出力、工作压力、输出行程、流量与泵功率。',
    doc: '基于<b>帕斯卡原理</b>（压力在各处等值传递）计算液压千斤顶。小活塞施加 F₁ 产生压力 P=F₁/A₁，作用到大活塞即放大输出力 F₂=P·A₂；输出行程按体积守恒 s₂=s₁·(A₁/A₂)。附带单次行程所需流量与泵功率，并可校核工作压力是否超过上限。',
    inputs: [
      { key: 'd1', label: '小活塞直径 d₁', group: '输入活塞', type: 'number', unit: 'mm', default: 20, step: 'any' },
      { key: 'f1', label: '输入力 F₁', group: '输入活塞', type: 'number', unit: 'N', default: 100, step: 'any' },
      { key: 's1', label: '输入行程 s₁', group: '输入活塞', type: 'number', unit: 'mm', default: 50, step: 'any' },
      { key: 'd2', label: '大活塞直径 d₂', group: '输出缸', type: 'number', unit: 'mm', default: 80, step: 'any' },
      { key: 'plim', label: '压力上限', group: '输出缸', type: 'number', unit: 'MPa', default: 20, step: 'any' },
      { key: 'tCycle', label: '单次行程时间', group: '时间参数', type: 'number', unit: 's', default: 5, step: 'any' }
    ],
    compute: function (v) {
      var d1 = +v.d1, f1 = +v.f1, s1 = +v.s1, d2 = +v.d2, plim = +v.plim, tCycle = +v.tCycle;
      if (!(d1 > 0) || !(d2 > 0) || !(f1 > 0)) return { error: '请输入有效的小/大活塞直径与输入力' };
      var A1 = Math.PI * Math.pow(d1 / 1000, 2) / 4; // m²
      var A2 = Math.PI * Math.pow(d2 / 1000, 2) / 4;
      var amp = A2 / A1;
      var PPa = f1 / A1;                             // Pa
      var PMPa = PPa / 1e6;
      var F2 = PPa * A2;                             // N
      var s2 = (s1 / 1000) * (A1 / A2) * 1000;       // mm
      var Q = A1 * s1 * 60 / tCycle;                 // L/min
      var pow = f1 * s1 / (1000 * tCycle);           // W
      var over = PMPa > plim;
      return {
        sections: [
          { title: '面积与倍率', rows: [
            { label: '小活塞面积 A₁=πd₁²/4', value: A1, unit: 'm²', d: 6, hl: true },
            { label: '大活塞面积 A₂=πd₂²/4', value: A2, unit: 'm²', d: 6 },
            { label: '面积比（力放大倍率）', value: amp, unit: '倍', d: 1, hl: true },
            { label: '输出/输入行程比', value: A1 / A2, d: 4 }
          ] },
          { title: '输出能力', rows: [
            { label: '工作压力 P=F₁/A₁', value: PMPa, unit: 'MPa', d: 3, hl: true },
            { label: '输出力 F₂=P·A₂', value: F2, unit: 'N', hl: true },
            { label: '输出力 F₂', value: F2 / 1000, unit: 'kN', d: 2 },
            { label: '输出行程 s₂=s₁·(A₁/A₂)', value: s2, unit: 'mm', d: 2, hl: true }
          ] },
          { title: '流量与泵功率', rows: [
            { label: '所需流量 Q=A₁·s₁·60/t', value: Q, unit: 'L/min', d: 3, hl: true },
            { label: '泵功率 P=F₁·s₁/t', value: pow, unit: 'W', d: 2, hl: true }
          ] }
        ],
        verdict: over ? {
          level: 'warn',
          text: '工作压力 ' + fmt(PMPa, 2) + ' MPa 超过设定上限 ' + fmt(plim) + ' MPa，请增大活塞直径或降低输入力',
          note: '超压易导致元件泄漏或损坏；工程上作业压力通常控制在 25~30 MPa 内。'
        } : {
          level: 'ok',
          text: '力放大 ' + fmt(amp, 1) + ' 倍，输出力 ' + fmt(F2) + ' N，工作压力 ' + fmt(PMPa, 3) + ' MPa',
          note: '需要大输出力时应优先增大活塞直径而非盲目提高压力。'
        },
        notes: [
          '帕斯卡原理：压力在连通容器内处处等值，F₂=F₁·(A₂/A₁)=F₁·(d₂/d₁)²。',
          '体积守恒：输入行程 s₁ 对应输出行程 s₂=s₁·(A₁/A₂)，活塞越大行程越小。',
          '流量 Q(单行程) = A₁·s₁·60/t；泵功率 = 输入力×输入速度 = F₁·s₁/t（W）。'
        ]
      };
    },
    formulas: [
      'A=πd²/4；F₂=F₁·(d₂/d₁)²；s₂=s₁·(A₁/A₂)',
      'P=F₁/A₁（Pa→MPa 除 1e6）',
      'Q(L/min)=A₁(m²)·s₁(mm)·60/t；P泵(W)=F₁·s₁/(1000·t)'
    ],
    reference: '来源 '
  });

  /* ============ 5. 油箱热平衡计算 ============ */
  /* 来源页：calculation_oiltankthermalbalancecalculation.html（form=oilTankCal1，接口 oiltank1）
   * 默认值：V=400L、H=2.5kW、k=9W/(m²·K)、Ph=0kW、c=1900J/(kg·K)、Pc=1kW、TA=20℃、T=65℃
   * 关键常量/公式：油密度取 0.72kg/L → m=0.72V(kg)；散热面积 A=V^(2/3)/15(m²)；
   *   热平衡温度 Tb=TA+(H+Ph-Pc)·1000/(k·A)(℃)；油箱冷却功率 Pct=k·A·(T-TA)/1000(kW)；
   *   温升时间 t=mc/(kA)·ln((Tb-TA)/(Tb-T))/60(s)，当 T≥Tb(不可达)时 t=0。
   * 默认值校验：m=288kg、A=3.62m²、Tb=66.1℃、Pct=1.46kW、t=1047.8s（与原站一致）。
   */
  App.registerTool({
    id: 'oil-tank-balance',
    name: '油箱热平衡计算',
    category: 'fluid',
    keywords: '油箱 热平衡 温升 散热 换热量 平衡温度 发热 冷却',
    brief: '液压油箱热平衡计算：油质量、散热面积、油箱冷却功率、热平衡温度与温升时间。',
    doc: '根据油箱容积与散热面积，对系统<b>发热功率 H、冷却功率 Pc（及加热功率 Ph）</b>做热平衡。给出<b>油质量、油箱散热面积、油箱冷却功率、热平衡温度</b>，以及油液从环境温度升到<b>设定油温</b>所需的时间。',
    inputs: [
      { key: 'V', label: '油箱总体积 V', group: '油箱与发热', type: 'number', unit: 'L', default: 400, step: 'any' },
      { key: 'H', label: '系统发热功率 H', group: '油箱与发热', type: 'number', unit: 'kW', default: 2.5, step: 'any' },
      { key: 'k', label: '油箱传热系数 k', group: '油箱与发热', type: 'number', unit: 'W/(m²·K)', default: 9, step: 'any' },
      { key: 'Ph', label: '加热功率 Ph', group: '油箱与发热', type: 'number', unit: 'kW', default: 0, step: 'any' },
      { key: 'c', label: '油液比热容 c', group: '油液参数', type: 'number', unit: 'J/(kg·K)', default: 1900, step: 'any' },
      { key: 'Pc', label: '冷却功率 Pc', group: '油液参数', type: 'number', unit: 'kW', default: 1, step: 'any' },
      { key: 'TA', label: '环境温度 T₀', group: '温度参数', type: 'number', unit: '℃', default: 20, step: 'any' },
      { key: 'T', label: '设定油温 T', group: '温度参数', type: 'number', unit: '℃', default: 65, step: 'any' }
    ],
    compute: function (v) {
      var V = +v.V, H = +v.H, k = +v.k, Ph = +v.Ph, c = +v.c, Pc = +v.Pc, TA = +v.TA, T = +v.T;
      if (!(V > 0) || !(k > 0) || !(c > 0)) return { error: '请输入有效的油箱体积、传热系数与比热容' };
      var m = 0.72 * V;                                   // kg（油密度 0.72 kg/L）
      var A = Math.pow(V, 2 / 3) / 15;                    // m²
      var net = (H + Ph - Pc);                            // 净发热功率 kW
      var Tb = TA + net * 1000 / (k * A);                 // 热平衡温度 ℃
      var Pct = k * A * (T - TA) / 1000;                  // 油箱冷却功率 kW（按设定油温）
      var t;
      if (T >= Tb) {
        t = 0;                                            // 设定油温 ≥ 平衡温度，不可达
      } else {
        t = (m * c / (k * A)) * Math.log((Tb - TA) / (Tb - T)) / 60; // s
      }
      var overTem = Tb > 70;
      return {
        sections: [
          { title: '油量与散热面积', rows: [
            { label: '油质量 m=0.72·V', value: m, unit: 'kg', d: 1, hl: true },
            { label: '油箱散热面积 A=V^(2/3)/15', value: A, unit: 'm²', d: 2, hl: true },
            { label: '净发热功率 H+Ph-Pc', value: net, unit: 'kW', d: 2 }
          ] },
          { title: '热平衡结果', rows: [
            { label: '热平衡温度 Tb=TA+(H+Ph-Pc)·1000/(k·A)', value: Tb, unit: '℃', d: 1, hl: true },
            { label: '油箱冷却功率 Pct=k·A·(T-TA)/1000', value: Pct, unit: 'kW', d: 2, hl: true },
            { label: '设定油温温升 ΔT=T-T₀', value: T - TA, unit: '℃', d: 1 },
            { label: '温升时间 t', value: t, unit: 's', d: 1 },
            { label: '温升时间 t', value: t / 60, unit: 'min', d: 2 }
          ] }
        ],
        verdict: overTem ? {
          level: 'warn',
          text: '热平衡温度 ' + fmt(Tb, 1) + ' ℃ 偏高（＞70℃），散热面积不足，建议增大油箱或加装冷却器',
          note: '液压油长期高于 70℃ 会加速氧化、降低粘度与寿命。'
        } : {
          level: 'ok',
          text: '热平衡温度 ' + fmt(Tb, 1) + ' ℃，油量 ' + fmt(m) + ' kg，散热面积 ' + fmt(A, 2) + ' m²',
          note: '温升时间按一阶热惯性模型（指数上升）估算，用于评估系统达到设定油温的快慢。'
        },
        notes: [
          '油质量 m=0.72V（V:L，油液密度取 0.72 kg/L）。',
          '散热面积经验式 A=V^(2/3)/15（V:L，A:m²），见原站油箱热平衡说明。',
          '热平衡温度 Tb=TA+(H+Ph-Pc)·1000/(k·A)；油箱冷却功率 Pct=k·A·(T-TA)/1000。',
          '温升时间 t=mc/(kA)·ln((Tb-TA)/(Tb-T))/60(s)；当设定油温 T≥Tb 时系统达不到该温度，t 计为 0。'
        ]
      };
    },
    formulas: [
      'm = 0.72·V（V:L）；A = V^(2/3)/15（m²）',
      'Tb = TA + (H+Ph-Pc)·1000/(k·A)',
      'Pct = k·A·(T-TA)/1000（kW）',
      't = mc/(kA)·ln((Tb-TA)/(Tb-T))/60（s）'
    ],
    reference: '来源 '
  });
})();