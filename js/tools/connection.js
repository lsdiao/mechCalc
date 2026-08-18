/* =========================================================
 * 连接与校核类工具
 * 1. 松螺栓连接强度校核（受轴向载荷）
 * 2. 铰制孔螺栓连接强度校核（受横向载荷）
 * 3. 受横向载荷-紧螺栓连接强度校核与设计
 * 4. 受轴向载荷-紧螺栓连接（静载荷）校核与设计
 * 5. 受轴向载荷-紧螺栓连接（动载荷）校核与设计
 * 6. 平键连接强度校核
 * 7. 压缩弹簧设计计算
 * 依据：《机械设计》（濮良贵版）及相关国家标准，1:1 复刻 mechtool.cn 布局与计算方式
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt, esc = App.esc;

  /* =====================================================
   * 共享数据：螺纹小径 / 性能等级
   * ===================================================== */
  // 普通螺纹小径 GB/T 196-2003（mm）
  var THREAD_D1 = {
    '1': 0.693, '1.2': 0.857, '1.6': 1.171, '2': 1.509, '2.5': 1.948,
    '3': 2.387, '4': 3.242, '5': 4.134, '6': 4.917, '8': 6.647,
    '10': 8.376, '12': 10.106, '14': 11.835, '16': 13.835, '18': 15.294,
    '20': 17.294, '22': 19.294, '24': 20.752, '27': 23.752, '30': 26.211,
    '33': 29.211, '36': 31.670, '39': 34.670, '42': 37.129, '45': 40.129,
    '48': 42.587, '56': 50.046, '64': 57.505
  };
  var THREAD_SIZES = Object.keys(THREAD_D1);
  function threadOpts() {
    return THREAD_SIZES.map(function (k) { return { v: k, t: 'M' + k + '（d₁=' + THREAD_D1[k] + '）' }; });
  }

  // 性能等级 → 最小屈服强度 σs MPa、抗拉强度 σb MPa (GB/T 3098.1)
  var GRADE_SS = {
    '3.6': 180, '4.6': 240, '4.8': 320, '5.6': 300, '5.8': 400,
    '6.8': 480, '8.8': 640, '9.8': 720, '10.9': 940, '12.9': 1100, '14.9': 1260
  };
  var GRADE_SB = {
    '3.6': 300, '4.6': 400, '4.8': 420, '5.6': 500, '5.8': 520,
    '6.8': 600, '8.8': 800, '9.8': 900, '10.9': 1040, '12.9': 1220, '14.9': 1400
  };
  function gradeOpts() {
    return Object.keys(GRADE_SS).map(function (k) {
      return { v: k, t: k + ' 级（σs=' + GRADE_SS[k] + 'MPa, σb=' + GRADE_SB[k] + 'MPa）' };
    });
  }

  // 不锈钢 A2-70 参考值
  var SS_GRADE = { name: 'A2-70（不锈钢）', ss: 450, sb: 700 };

  /* =====================================================
   * 安全系数参考表（预紧螺栓连接，GB/T 150 / 机械设计手册）
   * 材料、直径、静/动载荷
   * ===================================================== */
  function safetyFactor(isSteel, d, isDynamic) {
    var dNum = +d;
    if (isDynamic) {
      if (isSteel) {
        if (dNum <= 16) return 6.5;
        if (dNum <= 30) return 6.5;
        return 8;
      } else {
        if (dNum <= 16) return 5;
        if (dNum <= 30) return 5;
        return 6.5;
      }
    } else {
      if (isSteel) {
        if (dNum <= 16) return 3.5;
        if (dNum <= 30) return 2.5;
        return 1.7;
      } else {
        if (dNum <= 16) return 4.5;
        if (dNum <= 30) return 3.3;
        return 2.5;
      }
    }
  }

  /* =====================================================
   * 工具 1：松螺栓连接（受轴向载荷）
   * ===================================================== */
  App.registerTool({
    id: 'bolt-loose',
    name: '松螺栓连接强度校核',
    category: 'connect',
    keywords: '松螺栓 轴向载荷 拉伸 强度 校核 设计',
    brief: '受轴向载荷的松螺栓连接强度校核与设计计算，计算拉伸应力并校核。',
    doc: '松螺栓连接在工作前不拧紧（无预紧力），只承受轴向工作载荷。校核计算：由螺栓小径求危险截面应力 σ = F/A；设计计算：由载荷与许用应力求所需小径，推荐公称直径。',
    inputs: [
      { key: 'mode', label: '计算模式', group: '计算模式', type: 'segment', options: [
        { v: 'check', t: '校核计算' }, { v: 'design', t: '设计计算' }
      ] },
      { key: 'matType', label: '螺栓材料', group: '载荷与材料', type: 'segment', options: [
        { v: 'steel', t: '钢' }, { v: 'ss', t: '不锈钢' }
      ] },
      { key: 'grade', label: '机械性能等级', group: '载荷与材料', type: 'select', options: gradeOpts(), default: '4.8',
        visible: function (v) { return v.matType !== 'ss'; } },
      { key: 'F', label: '轴向工作载荷 F', group: '载荷与材料', type: 'number', unit: 'kN', default: 10, step: 'any' },
      { key: 'S', label: '安全系数 S', group: '载荷与材料', type: 'number', default: 3, step: 'any', hint: '松螺栓通常取 2.5~4' },
      { key: 'd', label: '螺栓公称直径', group: '螺栓尺寸', type: 'select', options: threadOpts(), default: '12',
        visible: function (v) { return v.mode !== 'design'; } }
    ],
    compute: function (v) {
      var F = +v.F * 1000, S = +v.S;
      if (!(F > 0)) return { error: '请输入轴向工作载荷 F（kN）' };
      if (!(S > 0)) return { error: '请输入安全系数 S' };
      var ss = v.matType === 'ss' ? SS_GRADE.ss : GRADE_SS[v.grade];
      var sigmaAllow = ss / S;

      if (v.mode === 'design') {
        var needD1 = Math.sqrt(4 * F / (Math.PI * sigmaAllow));
        var recD = null;
        for (var i = 0; i < THREAD_SIZES.length; i++) {
          var k = THREAD_SIZES[i];
          if (THREAD_D1[k] >= needD1) { recD = k; break; }
        }
        return {
          sections: [
            { title: '设计计算结果', rows: [
              { label: '所需螺纹小径 d₁≥', value: needD1, unit: 'mm', d: 3, hl: true },
              { label: '推荐公称直径', html: recD ? 'M' + recD + '（d₁=' + THREAD_D1[recD] + 'mm）' : '超出数据范围' },
              { label: '许用应力 [σ]=σs/S', value: sigmaAllow, unit: 'MPa', hl: true },
              { label: '屈服强度 σs', value: ss, unit: 'MPa' }
            ] }
          ],
          verdict: { level: 'ok', text: '所需小径 d₁ ≥ ' + fmt(needD1, 3) + ' mm，推荐选用 M' + recD },
          notes: ['松螺栓连接仅承受轴向拉伸（无预紧力），无需考虑 1.3 扭转系数。']
        };
      }

      var d1 = THREAD_D1[v.d];
      if (!d1) return { error: '未找到所选螺栓的小径数据' };
      var A = Math.PI * d1 * d1 / 4;
      var sigma = F / A;
      var ok = sigma <= sigmaAllow;
      return {
        sections: [
          { title: '强度校核', rows: [
            { label: '螺纹小径 d₁', value: d1, unit: 'mm' },
            { label: '危险截面积 A', value: A, unit: 'mm²', d: 2 },
            { label: '拉伸应力 σ=F/A', value: sigma, unit: 'MPa', hl: true },
            { label: '许用应力 [σ]=σs/S', value: sigmaAllow, unit: 'MPa', hl: true },
            { label: '屈服强度 σs', value: ss, unit: 'MPa' },
            { label: '强度裕度', value: sigmaAllow / sigma, d: 2, unit: '' }
          ] }
        ],
        verdict: {
          level: ok ? 'ok' : 'bad',
          text: ok ? '校核通过：σ = ' + fmt(sigma) + ' MPa ≤ [σ] = ' + fmt(sigmaAllow) + ' MPa'
                   : '校核不通过：σ = ' + fmt(sigma) + ' MPa > [σ] = ' + fmt(sigmaAllow) + ' MPa，请增大螺栓直径或提高等级'
        },
        notes: ['松螺栓连接仅承受轴向拉伸，危险截面为螺纹小径处。']
      };
    },
    formulas: [
      'σ = F / A = 4F / (π·d₁²) ≤ [σ] = σs / S',
      '设计：d₁ ≥ √(4F / (π[σ]))'
    ],
    reference: 'GB/T 196《普通螺纹 基本尺寸》、GB/T 3098.1《紧固件机械性能》；《机械设计》第九版 第五章。'
  });

  /* =====================================================
   * 工具 2：铰制孔螺栓连接（受横向载荷）
   * ===================================================== */
  App.registerTool({
    id: 'bolt-reamed',
    name: '铰制孔螺栓连接强度校核',
    category: 'connect',
    keywords: '铰制孔 螺栓 横向载荷 剪切 挤压 强度 校核',
    brief: '受横向载荷的铰制孔螺栓连接强度校核与设计，校核挤压应力与剪切应力。',
    doc: '铰制孔螺栓受横向载荷时，螺栓杆与孔壁间为配合面，靠螺栓杆的<b>剪切</b>和<b>挤压</b>传递载荷。需同时校核挤压强度与抗剪强度，并取两者中最不利者。',
    inputs: [
      { key: 'mode', label: '计算模式', group: '计算模式', type: 'segment', options: [
        { v: 'check', t: '校核计算' }, { v: 'design', t: '设计计算' }
      ] },
      { key: 'matType', label: '螺栓材料', group: '载荷与材料', type: 'segment', options: [
        { v: 'steel', t: '钢' }, { v: 'ss', t: '不锈钢' }
      ] },
      { key: 'grade', label: '机械性能等级', group: '载荷与材料', type: 'select', options: gradeOpts(), default: '8.8',
        visible: function (v) { return v.matType !== 'ss'; } },
      { key: 'F', label: '横向载荷 F', group: '载荷与材料', type: 'number', unit: 'kN', default: 15, step: 'any' },
      { key: 'Sp', label: '挤压安全系数 S<sub>p</sub>', group: '载荷与材料', type: 'number', default: 1.5, step: 'any' },
      { key: 'St', label: '抗剪安全系数 S<sub>τ</sub>', group: '载荷与材料', type: 'number', default: 2.5, step: 'any' },
      { key: 'h', label: '受挤压高度 h', group: '连接参数', type: 'number', unit: 'mm', default: 20, step: 'any', hint: '取 h₁ 与 h₂ 中的较小值' },
      { key: 'm', label: '受剪面数 m', group: '连接参数', type: 'number', default: 1, step: '1', hint: '单剪=1，双剪=2' },
      { key: 'dyn', label: '动载荷', group: '连接参数', type: 'segment', options: [
        { v: 'no', t: '静载荷' }, { v: 'yes', t: '动载荷' }
      ] },
      { key: 'dynFactor', label: '动载荷系数', group: '连接参数', type: 'number', default: 0.7, step: 'any',
        visible: function (v) { return v.dyn === 'yes'; }, hint: '许用应力折减系数，常取 0.7~0.8' },
      { key: 'd', label: '螺栓公称直径', group: '螺栓尺寸', type: 'select', options: threadOpts(), default: '12',
        visible: function (v) { return v.mode !== 'design'; } },
      { key: 'd0', label: '受剪直径 d₀', group: '螺栓尺寸', type: 'number', unit: 'mm', step: 'any',
        default: '10.106',
        hint: '铰制孔螺栓受剪段（光杆）直径，默认取 M12 螺纹小径 10.106mm，按所选螺栓修改' }
    ],
    compute: function (v) {
      var dynFactor = v.dyn === 'yes' ? (+v.dynFactor || 0.7) : 1;
      var F = +v.F * 1000, Sp = +v.Sp, St = +v.St, h = +v.h, m = +v.m;
      if (!(F > 0)) return { error: '请输入横向载荷 F（kN）' };
      if (!(Sp > 0) || !(St > 0)) return { error: '请输入挤压/抗剪安全系数' };
      if (!(h > 0)) return { error: '请输入受挤压高度 h（mm）' };
      if (!(m >= 1)) return { error: '受剪面数 m 应≥1' };

      var ss = v.matType === 'ss' ? SS_GRADE.ss : GRADE_SS[v.grade];
      var sb = v.matType === 'ss' ? SS_GRADE.sb : GRADE_SB[v.grade];
      // 许用挤压应力 [σp] = σs / Sp × 动载荷系数（动载时折减）
      var sigmaPAllow = ss / Sp * dynFactor;
      // 许用剪切应力 [τ] = σs / St × 动载荷系数（动载时折减）
      var tauAllow = ss / St * dynFactor;

      if (v.mode === 'design') {
        // 设计计算：由挤压强度求 d_min，由抗剪强度求 d_min，取较大者
        var dMinP = F / (h * sigmaPAllow);
        var dMinT = Math.sqrt(4 * F / (m * Math.PI * tauAllow));
        var dMin = Math.max(dMinP, dMinT);
        var recD = null;
        for (var i = 0; i < THREAD_SIZES.length; i++) {
          var k = THREAD_SIZES[i];
          if (THREAD_D1[k] >= dMin) { recD = k; break; }
        }
        return {
          sections: [
            { title: '设计计算结果', rows: [
              { label: '挤压所需 d₁≥', value: dMinP, unit: 'mm', d: 3 },
              { label: '剪切所需 d₁≥', value: dMinT, unit: 'mm', d: 3 },
              { label: '所需最小 d₁', value: dMin, unit: 'mm', d: 3, hl: true },
              { label: '推荐公称直径', html: recD ? 'M' + recD + '（d₁=' + THREAD_D1[recD] + 'mm）' : '超出数据范围' },
              { label: '许用挤压应力 [σp]=σs/Sp', value: sigmaPAllow, unit: 'MPa' },
              { label: '许用剪应力 [τ]=σs/St', value: tauAllow, unit: 'MPa' }
            ] }
          ],
          verdict: { level: 'ok', text: '所需 d₁ ≥ ' + fmt(dMin, 3) + ' mm，推荐选用 M' + (recD || '--') },
          notes: ['设计计算中 d₀ 按受剪直径要求确定，由 d₀ 反推所需螺纹小径 d₁，再推荐公称直径。']
        };
      }

      var d1 = THREAD_D1[v.d];
      if (!d1) return { error: '未找到所选螺栓的小径数据' };
      var d0 = +v.d0 || d1;          // 受剪直径，优先取用户输入，默认取螺纹小径
      var A = Math.PI * d0 * d0 / 4;
      var sigmaP = F / (d0 * h);     // 挤压应力
      var tau = F / (m * A);         // 剪切应力
      var okP = sigmaP <= sigmaPAllow;
      var okT = tau <= tauAllow;
      var ok = okP && okT;

      return {
        sections: [
          { title: '挤压强度校核', rows: [
            { label: '挤压应力 σp=F/(d₀·h)', value: sigmaP, unit: 'MPa', hl: true },
            { label: '许用挤压应力 [σp]=σs/Sp', value: sigmaPAllow, unit: 'MPa', hl: true },
            { label: '受剪直径 d₀', value: d0, unit: 'mm' },
            { label: '受挤压高度 h', value: h, unit: 'mm' },
            { label: '挤压裕度', value: sigmaPAllow / sigmaP, d: 2, unit: '' }
          ] },
          { title: '抗剪强度校核', rows: [
            { label: '剪切应力 τ=F/(m·A)', value: tau, unit: 'MPa', hl: true },
            { label: '许用剪应力 [τ]=σs/St', value: tauAllow, unit: 'MPa', hl: true },
            { label: '受剪面数 m', value: m, unit: '' },
            { label: '受剪截面积 A', value: A, unit: 'mm²', d: 2 },
            { label: '剪切裕度', value: tauAllow / tau, d: 2, unit: '' }
          ] }
        ],
        verdict: {
          level: ok ? 'ok' : 'bad',
          text: (okP ? '挤压满足' : '挤压不满足') + '，' + (okT ? '剪切满足' : '剪切不满足') +
                '；' + (ok ? '校核通过' : '校核不通过，请增大螺栓直径或提高等级'),
          note: ok ? '' : '若不满足：① 增大螺栓直径 ② 提高性能等级 ③ 增加受剪面数 ④ 增大挤压高度'
        },
        notes: [
          '铰制孔螺栓的受剪直径 d₀ 为螺栓杆（光杆）直径，由用户输入；默认取所选螺栓的螺纹小径 d₁。',
          '动载荷时许用应力乘以折减系数（0.7~0.8），即 [σp] = σs/Sp × 系数，[τ] = σs/St × 系数。'
        ]
      };
    },
    formulas: [
      '挤压强度：σp = F/(d₀·h) ≤ [σp] = σs/Sp',
      '抗剪强度：τ = 4F/(m·π·d₀²) ≤ [τ] = σs/St',
      '设计：d₀ ≥ max( F/(h·[σp]), √(4F/(m·π·[τ])) )'
    ],
    reference: 'GB/T 196《普通螺纹 基本尺寸》、GB/T 3098.1《紧固件机械性能》；《机械设计》第九版 第五章。'
  });

  /* =====================================================
   * 工具 3：受横向载荷-紧螺栓连接
   * ===================================================== */
  App.registerTool({
    id: 'bolt-transverse',
    name: '横向载荷-紧螺栓连接强度校核',
    category: 'connect',
    keywords: '横向载荷 紧螺栓 预紧力 摩擦 接合面 强度 校核',
    brief: '受横向载荷的紧螺栓连接强度校核与设计，由摩擦力平衡条件求预紧力后校核。',
    doc: '受横向载荷的紧螺栓连接靠连接接合面间的<b>摩擦力</b>传递横向载荷。预紧力 F′ = K<sub>f</sub>·F / (m·f)，再按 1.3 倍系数校核螺栓拉伸应力。',
    inputs: [
      { key: 'mode', label: '计算模式', group: '计算模式', type: 'segment', options: [
        { v: 'check', t: '校核计算' }, { v: 'design', t: '设计计算' }
      ] },
      { key: 'matType', label: '螺栓材料', group: '载荷与材料', type: 'segment', options: [
        { v: 'steel', t: '钢' }, { v: 'ss', t: '不锈钢' }
      ] },
      { key: 'grade', label: '机械性能等级', group: '载荷与材料', type: 'select', options: gradeOpts(), default: '8.8',
        visible: function (v) { return v.matType !== 'ss'; } },
      { key: 'F', label: '横向载荷 F', group: '载荷与材料', type: 'number', unit: 'kN', default: 5, step: 'any' },
      { key: 'Kf', label: '可靠性系数 K<sub>f</sub>', group: '连接参数', type: 'number', default: 1.2, step: 'any', hint: '常取 1.1~1.3' },
      { key: 'm', label: '接合面数 m', group: '连接参数', type: 'number', default: 1, step: '1', hint: '单面=1，双面=2' },
      { key: 'f', label: '接合面摩擦因数 f', group: '连接参数', type: 'number', default: 0.15, step: 'any', hint: '钢-钢：0.1~0.15；钢-铸铁：0.15~0.2' },
      { key: 'S', label: '安全系数 S', group: '连接参数', type: 'number', default: 2.5, step: 'any', hint: '控制预紧力 1.2~1.5，不控制查手册' },
      { key: 'dyn', label: '载荷性质', group: '连接参数', type: 'segment', options: [
        { v: 'static', t: '静载荷' }, { v: 'dynamic', t: '动载荷' }
      ] },
      { key: 'd', label: '螺栓公称直径', group: '螺栓尺寸', type: 'select', options: threadOpts(), default: '12',
        visible: function (v) { return v.mode !== 'design'; } }
    ],
    compute: function (v) {
      var F = +v.F * 1000, Kf = +v.Kf, m = +v.m, f = +v.f, S = +v.S;
      if (!(F > 0)) return { error: '请输入横向载荷 F（kN）' };
      if (!(Kf >= 1)) return { error: '可靠性系数 Kf 应≥1' };
      if (!(m >= 1)) return { error: '接合面数 m 应≥1' };
      if (!(f > 0)) return { error: '请输入摩擦因数 f' };
      if (!(S > 0)) return { error: '请输入安全系数 S' };

      var ss = v.matType === 'ss' ? SS_GRADE.ss : GRADE_SS[v.grade];
      var sigmaAllow = ss / S;
      var Fp = Kf * F / (m * f);  // 所需预紧力

      if (v.mode === 'design') {
        var needD1 = Math.sqrt(4 * 1.3 * Fp / (Math.PI * sigmaAllow));
        var recD = null;
        for (var i = 0; i < THREAD_SIZES.length; i++) {
          var k = THREAD_SIZES[i];
          if (THREAD_D1[k] >= needD1) { recD = k; break; }
        }
        return {
          sections: [
            { title: '设计计算结果', rows: [
              { label: '所需预紧力 F′=Kf·F/(m·f)', value: Fp, unit: 'N', hl: true },
              { label: '所需螺纹小径 d₁≥', value: needD1, unit: 'mm', d: 3, hl: true },
              { label: '推荐公称直径', html: recD ? 'M' + recD + '（d₁=' + THREAD_D1[recD] + 'mm）' : '超出数据范围' },
              { label: '许用应力 [σ]=σs/S', value: sigmaAllow, unit: 'MPa' }
            ] }
          ],
          verdict: { level: 'ok', text: '需预紧力 F′ = ' + fmt(Fp) + ' N，所需 d₁ ≥ ' + fmt(needD1, 3) + ' mm，推荐 M' + (recD || '--') },
          notes: ['横向载荷紧螺栓连接靠摩擦力平衡，预紧力通常较大，可能导致螺栓尺寸偏大。必要时可采用铰制孔螺栓或减载装置。']
        };
      }

      var d1 = THREAD_D1[v.d];
      if (!d1) return { error: '未找到所选螺栓的小径数据' };
      var A = Math.PI * d1 * d1 / 4;
      var sigma = 1.3 * Fp / A;
      var ok = sigma <= sigmaAllow;
      var Tmax = 0.5 * sigmaAllow * A / 1.3 * m * f / Kf / 1000; // 允许最大横向载荷 kN

      return {
        sections: [
          { title: '预紧力计算', rows: [
            { label: '所需预紧力 F′=Kf·F/(m·f)', value: Fp, unit: 'N', hl: true },
            { label: '可靠性系数 Kf', value: Kf, unit: '' },
            { label: '接合面数 m', value: m, unit: '' },
            { label: '摩擦因数 f', value: f, unit: '' }
          ] },
          { title: '强度校核', rows: [
            { label: '螺纹小径 d₁', value: d1, unit: 'mm' },
            { label: '危险截面积 A', value: A, unit: 'mm²', d: 2 },
            { label: '计算应力 σca=1.3F′/A', value: sigma, unit: 'MPa', hl: true },
            { label: '许用应力 [σ]=σs/S', value: sigmaAllow, unit: 'MPa', hl: true },
            { label: '屈服强度 σs', value: ss, unit: 'MPa' },
            { label: '强度裕度', value: sigmaAllow / sigma, d: 2, unit: '' },
            { label: '允许最大横向载荷', value: Tmax, unit: 'kN', d: 2 }
          ] }
        ],
        verdict: {
          level: ok ? 'ok' : 'bad',
          text: ok ? '校核通过：σca = ' + fmt(sigma) + ' MPa ≤ [σ] = ' + fmt(sigmaAllow) + ' MPa'
                   : '校核不通过：σca = ' + fmt(sigma) + ' MPa > [σ] = ' + fmt(sigmaAllow) + ' MPa'
        },
        notes: [
          '预紧力 F′ = Kf·F/(m·f)，其中 Kf 取 1.1~1.3（防滑可靠性系数），m 为接合面数，f 为摩擦因数。',
          '1.3 为拧紧力矩引起的扭转切应力折算系数。',
          '若强度不足，可：① 增大螺栓直径 ② 提高等级 ③ 增加接合面数 ④ 采用铰制孔螺栓'
        ]
      };
    },
    formulas: [
      'F′ = Kf·F / (m·f)；Kf=1.1~1.3',
      'σca = 1.3·F′ / (π·d₁²/4) ≤ [σ] = σs/S',
      '设计：d₁ ≥ √(4×1.3·F′/(π·[σ]))'
    ],
    reference: 'GB/T 196、GB/T 3098.1；《机械设计》第九版 第五章。'
  });

  /* =====================================================
   * 工具 4：受轴向载荷-紧螺栓连接（静载荷）校核与设计
   * 1:1 复刻 mechtool.cn 计算方式
   * ===================================================== */
  var RES_K = { '0.2': '一般静载（F″=0.2F）', '0.6': '变载荷（F″=0.6F）', '1.0': '密封要求（F″=1.0F）', '1.5': '冲击/高压（F″=1.5F）', '1.8': '压力容器（F″=1.8F）' };
  var GASKET_LAMBDA = { '0.2': '金属垫/无垫片（0.2）', '0.3': '金属垫/无垫片（0.3）', '0.5': '皮革/铜皮石棉（0.5）', '0.7': '皮革石棉垫（0.7）', '0.8': '橡胶垫（0.8）', '0.9': '软垫片（0.9）' };

  App.registerTool({
    id: 'bolt-check',
    name: '螺栓连接强度校核',
    category: 'connect',
    keywords: '螺栓 螺纹 强度 校核 预紧力 轴向载荷 紧螺栓 静载荷',
    brief: '受轴向工作载荷的紧螺栓连接强度校核与设计，计算残余预紧力、总拉力与计算应力。',
    doc: '用于<b>受轴向工作载荷的紧螺栓连接</b>（静载荷）强度校核：先由工作载荷 F 与残余预紧力 F″ 求螺栓总拉力 F<sub>0</sub>，再按 1.3 倍系数（考虑螺纹拧紧扭转切应力）校核危险截面拉伸应力。',
    inputs: [
      { key: 'mode', label: '计算模式', group: '计算模式', type: 'segment', options: [
        { v: 'check', t: '校核计算' }, { v: 'design', t: '设计计算' }
      ] },
      { key: 'matType', label: '螺栓材料', group: '螺栓与工况', type: 'segment', options: [
        { v: 'steel', t: '钢' }, { v: 'ss', t: '不锈钢' }
      ] },
      { key: 'grade', label: '性能等级', group: '螺栓与工况', type: 'select', options: gradeOpts(), default: '8.8',
        visible: function (v) { return v.matType !== 'ss'; } },
      { key: 'd', label: '螺栓公称直径', group: '螺栓与工况', type: 'select', options: threadOpts(), default: '12',
        visible: function (v) { return v.mode !== 'design'; } },
      { key: 'F', label: '轴向工作载荷 F', group: '载荷参数', type: 'number', unit: 'N', default: 5000, step: 'any' },
      { key: 'resType', label: '残余预紧力取值', group: '载荷参数', type: 'select', options: [
        { v: '0.2', t: '一般静载荷连接 F″=0.2F' }, { v: '0.6', t: '变载荷 / 重要连接 F″=0.6F' },
        { v: '1.0', t: '有密封要求 F″=1.0F' }, { v: '1.5', t: '冲击载荷 / 高压密封 F″=1.5F' },
        { v: '1.8', t: '压力容器 F″=1.8F' }
      ], default: '0.2' },
      { key: 'lambda', label: '相对刚度 λ', group: '载荷参数', type: 'select', options: [
        { v: '0.2', t: '金属垫片 / 无垫片（0.2）' }, { v: '0.3', t: '金属垫片 / 无垫片（0.3）' },
        { v: '0.5', t: '皮革 / 铜皮石棉（0.5）' }, { v: '0.7', t: '皮革石棉垫（0.7）' },
        { v: '0.8', t: '橡胶垫（0.8）' }, { v: '0.9', t: '软垫片（0.9）' }
      ], default: '0.3' },
      { key: 'S', label: '安全系数 S', group: '载荷参数', type: 'number', default: 1.5, step: 'any', hint: '控制预紧力：1.2~1.5；不控制预紧力：查手册（一般1.6~3）' }
    ],
    compute: function (v) {
      var F = +v.F, S = +v.S, kRes = +v.resType, lambda = +v.lambda;
      if (!(F > 0)) return { error: '请输入工作载荷 F（N）' };
      if (!(S > 0)) return { error: '请输入安全系数 S' };
      var ss = v.matType === 'ss' ? SS_GRADE.ss : GRADE_SS[v.grade];
      var sigmaAllow = ss / S;

      var F2 = kRes * F;                 // 残余预紧力
      var F0 = F2 + F;                   // 螺栓总拉力 F₀ = F″ + F
      var Fp = F2 + (1 - lambda) * F;    // 预紧力 F′ = F″ + (1-λ)F
      var sigmaF0 = F0;

      if (v.mode === 'design') {
        var needD1 = Math.sqrt(4 * 1.3 * F0 / (Math.PI * sigmaAllow));
        var recD = null;
        for (var i = 0; i < THREAD_SIZES.length; i++) {
          var k = THREAD_SIZES[i];
          if (THREAD_D1[k] >= needD1) { recD = k; break; }
        }
        return {
          sections: [
            { title: '载荷计算', rows: [
              { label: '残余预紧力 F″', value: F2, unit: 'N' },
              { label: '螺栓预紧力 F′', value: Fp, unit: 'N' },
              { label: '螺栓总拉力 F₀', value: F0, unit: 'N', hl: true }
            ] },
            { title: '设计结果', rows: [
              { label: '所需螺纹小径 d₁≥', value: needD1, unit: 'mm', d: 3, hl: true },
              { label: '推荐公称直径', html: recD ? 'M' + recD + '（d₁=' + THREAD_D1[recD] + 'mm）' : '超出数据范围' },
              { label: '许用应力 [σ]=σs/S', value: sigmaAllow, unit: 'MPa', hl: true },
              { label: '屈服强度 σs', value: ss, unit: 'MPa' }
            ] }
          ],
          verdict: { level: 'ok', text: '所需 d₁ ≥ ' + fmt(needD1, 3) + ' mm，推荐选用 M' + (recD || '--') },
          notes: ['设计计算取总拉力 F₀ = F″ + F，按 1.3 倍系数求所需小径。']
        };
      }

      var d1 = THREAD_D1[v.d];
      if (!d1) return { error: '未找到所选螺栓的小径数据' };
      var A = Math.PI * d1 * d1 / 4;
      var sigma = 1.3 * F0 / A;
      var ok = sigma <= sigmaAllow;

      return {
        sections: [
          { title: '载荷计算', rows: [
            { label: '残余预紧力 F″', value: F2, unit: 'N' },
            { label: '螺栓预紧力 F′', value: Fp, unit: 'N' },
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
          '总拉力 F₀ = F″ + F（亦即 F′ + λF），其中 λ 为相对刚度系数。',
          '1.3 为考虑拧紧时螺纹副中扭转切应力的折算系数。',
          '不控制预紧力时安全系数与螺栓直径有关（M6~M16：1.6~3），此处由用户直接输入。'
        ]
      };
    },
    formulas: [
      'F″ = k·F（k=0.2 静载、0.6 变载、1.0 密封、1.5 冲击/高压、1.8 压力容器）',
      'F₀ = F″ + F = F′ + λ·F，F′ = F″ + (1−λ)·F',
      'σ<sub>ca</sub> = 1.3·F₀ / (π·d₁²/4) ≤ [σ] = σ<sub>s</sub>/S',
      '设计：d₁ ≥ √(4×1.3·F₀/(π·[σ]))'
    ],
    reference: 'GB/T 196《普通螺纹 基本尺寸》、GB/T 3098.1《紧固件机械性能 螺栓、螺钉和螺柱》；《机械设计》第九版 第四章。'
  });

  /* =====================================================
   * 工具 5：受轴向载荷-紧螺栓连接（动载荷）校核与设计
   * 1:1 复刻 mechtool.cn 计算方式
   * ===================================================== */
  // 疲劳强度相关参数
  var FATIGUE_K_SIGMA = { '3.6': 3.5, '4.6': 3.5, '4.8': 3.5, '5.6': 3.8, '5.8': 3.8, '6.8': 3.8,
    '8.8': 4.0, '9.8': 4.0, '10.9': 4.2, '12.9': 4.5, '14.9': 4.5 };
  var FATIGUE_EPSILON = { '1': 0.75, '1.2': 0.75, '1.6': 0.75, '2': 0.75, '2.5': 0.75,
    '3': 0.75, '4': 0.75, '5': 0.75, '6': 0.75, '8': 0.75,
    '10': 0.65, '12': 0.65, '14': 0.65, '16': 0.65, '18': 0.65,
    '20': 0.65, '22': 0.65, '24': 0.65, '27': 0.65, '30': 0.65,
    '33': 0.65, '36': 0.65, '39': 0.65, '42': 0.65, '45': 0.65,
    '48': 0.6, '56': 0.6, '64': 0.6 };
  // 抗压疲劳强度 σ-1p（MPa），按 σb 的比例估算
  function sigmaMinus1P(sb) {
    return 0.35 * sb;
  }

  App.registerTool({
    id: 'bolt-dynamic',
    name: '螺栓连接动载荷校核',
    category: 'connect',
    keywords: '螺栓 动载荷 疲劳 应力幅 疲劳强度 校核 紧螺栓',
    brief: '受轴向载荷的紧螺栓连接动载荷疲劳强度校核，校核应力幅与疲劳安全系数。',
    doc: '用于<b>受轴向工作载荷的紧螺栓连接（动载荷）</b>疲劳强度校核。计算螺栓应力幅，综合考虑缺口应力集中因数 K<sub>σ</sub>、尺寸因数 ε、制造工艺因数与受力不均匀因数，校核疲劳安全系数。',
    inputs: [
      { key: 'mode', label: '计算模式', group: '计算模式', type: 'segment', options: [
        { v: 'check', t: '校核计算' }, { v: 'design', t: '设计计算' }
      ] },
      { key: 'matType', label: '螺栓材料', group: '载荷与材料', type: 'segment', options: [
        { v: 'steel', t: '钢' }, { v: 'ss', t: '不锈钢' }
      ] },
      { key: 'grade', label: '机械性能等级', group: '载荷与材料', type: 'select', options: gradeOpts(), default: '8.8',
        visible: function (v) { return v.matType !== 'ss'; } },
      { key: 'F', label: '轴向工作载荷 F', group: '载荷与材料', type: 'number', unit: 'kN', default: 10, step: 'any' },
      { key: 'lambda', label: '相对刚度 λ', group: '载荷与材料', type: 'select', options: [
        { v: '0.2', t: '金属垫片 / 无垫片（0.2）' }, { v: '0.3', t: '金属垫片 / 无垫片（0.3）' },
        { v: '0.5', t: '皮革 / 铜皮石棉（0.5）' }, { v: '0.7', t: '皮革石棉垫（0.7）' },
        { v: '0.8', t: '橡胶垫（0.8）' }, { v: '0.9', t: '软垫片（0.9）' }
      ], default: '0.3' },
      { key: 'd', label: '螺栓公称直径', group: '螺栓尺寸', type: 'select', options: threadOpts(), default: '16',
        visible: function (v) { return v.mode !== 'design'; } },
      { key: 'S', label: '安全系数 S', group: '疲劳参数', type: 'number', default: 2, step: 'any', hint: '控制预紧力取 1.5~2.5；不控制预紧力取 2.5~4' },
      { key: 'preloadCtrl', label: '预紧力控制', group: '疲劳参数', type: 'segment', options: [
        { v: 'yes', t: '控制预紧力' }, { v: 'no', t: '不控制预紧力' }
      ] },
      { key: 'process', label: '制造工艺', group: '疲劳参数', type: 'segment', options: [
        { v: 'cut', t: '切制螺纹' }, { v: 'roll', t: '滚制/搓制螺纹' }
      ] },
      { key: 'nutType', label: '螺母类型', group: '疲劳参数', type: 'segment', options: [
        { v: 'comp', t: '受压螺母' }, { v: 'tens', t: '受拉螺母' }
      ] },
      { key: 'Ksigma', label: '缺口应力集中因数 Kσ', group: '疲劳参数', type: 'number', default: 3.5, step: 'any',
        hint: '按等级自动推荐，可手动修改' },
      { key: 'epsilon', label: '尺寸因数 ε', group: '疲劳参数', type: 'number', default: 0.75, step: 'any',
        hint: '按直径自动推荐，可手动修改' }
    ],
    compute: function (v) {
      var F = +v.F * 1000, lambda = +v.lambda, S = +v.S;
      if (!(F > 0)) return { error: '请输入轴向工作载荷 F（kN）' };
      if (!(S > 0)) return { error: '请输入安全系数 S' };

      var ss = v.matType === 'ss' ? SS_GRADE.ss : GRADE_SS[v.grade];
      var sb = v.matType === 'ss' ? SS_GRADE.sb : GRADE_SB[v.grade];
      var sigmaMinus1 = sigmaMinus1P(sb);

      // 疲劳强度各参数
      var Ksigma = +v.Ksigma || (FATIGUE_K_SIGMA[v.grade] || 3.5);
      var epsilon = +v.epsilon || (FATIGUE_EPSILON[v.d] || 0.65);
      // 制造工艺因数：切制=1，滚制=1.1~1.3
      var processFactor = v.process === 'roll' ? 1.2 : 1.0;
      // 受力不均匀因数：受压螺母=1，受拉螺母=1.3~1.5
      var nutFactor = v.nutType === 'tens' ? 1.4 : 1.0;

      // 综合影响因数 KσD = Kσ / (ε·β)
      var KsigmaD = Ksigma / (epsilon * processFactor * nutFactor);

      // 许用应力幅 [σa] = σ-1p / (KσD·S)
      var sigmaAAllow = sigmaMinus1 / (KsigmaD * S);

      // 应力幅：σa = λ·F/(2A)（动载荷下工作载荷在 0~F 之间变化）
      // 按 0 到 F 的脉动循环，应力幅 = λ·F / (2A)
      // 若为对称循环则 σa = λ·F/A，此处按脉动处理

      if (v.mode === 'design') {
        var needA = lambda * F / (2 * sigmaAAllow);
        var needD1 = Math.sqrt(4 * needA / Math.PI);
        var recD = null;
        for (var i = 0; i < THREAD_SIZES.length; i++) {
          var k = THREAD_SIZES[i];
          if (THREAD_D1[k] >= needD1) { recD = k; break; }
        }
        return {
          sections: [
            { title: '疲劳参数', rows: [
              { label: '抗压疲劳强度 σ<sub>-1p</sub>', value: sigmaMinus1, unit: 'MPa', d: 0 },
              { label: '综合影响因数 KσD', value: KsigmaD, d: 3, hl: true },
              { label: '许用应力幅 [σa]', value: sigmaAAllow, unit: 'MPa', d: 3, hl: true }
            ] },
            { title: '设计结果', rows: [
              { label: '所需截面积 A≥', value: needA, unit: 'mm²', d: 3 },
              { label: '所需螺纹小径 d₁≥', value: needD1, unit: 'mm', d: 3, hl: true },
              { label: '推荐公称直径', html: recD ? 'M' + recD + '（d₁=' + THREAD_D1[recD] + 'mm）' : '超出数据范围' }
            ] }
          ],
          verdict: { level: 'ok', text: '按疲劳强度，所需 d₁ ≥ ' + fmt(needD1, 3) + ' mm，推荐 M' + (recD || '--') },
          notes: ['动载荷设计中还需同时校核静强度（静强度校核另见静载荷工具）。']
        };
      }

      var d1 = THREAD_D1[v.d];
      if (!d1) return { error: '未找到所选螺栓的小径数据' };
      var A = Math.PI * d1 * d1 / 4;
      var sigmaA = lambda * F / (2 * A); // 应力幅（脉动循环）
      var sigmaMax = 1.3 * F / A;        // 最大应力（近似）
      var ok = sigmaA <= sigmaAAllow;
      var nA = sigmaAAllow / sigmaA;     // 疲劳安全系数

      return {
        sections: [
          { title: '疲劳强度参数', rows: [
            { label: '抗拉强度 σb', value: sb, unit: 'MPa', d: 0 },
            { label: '屈服强度 σs', value: ss, unit: 'MPa', d: 0 },
            { label: '抗压疲劳强度 σ<sub>-1p</sub>', value: sigmaMinus1, unit: 'MPa', d: 0 },
            { label: '缺口应力集中因数 Kσ', value: Ksigma, unit: '' },
            { label: '尺寸因数 ε', value: epsilon, unit: '' },
            { label: '制造工艺因数 β₁', value: processFactor, unit: '' },
            { label: '受力不均匀因数 β₂', value: nutFactor, unit: '' },
            { label: '综合影响因数 KσD', value: KsigmaD, d: 3, hl: true },
            { label: '许用应力幅 [σa]', value: sigmaAAllow, unit: 'MPa', d: 3, hl: true }
          ] },
          { title: '校核结果', rows: [
            { label: '螺纹小径 d₁', value: d1, unit: 'mm' },
            { label: '危险截面积 A', value: A, unit: 'mm²', d: 2 },
            { label: '应力幅 σa=λ·F/(2A)', value: sigmaA, unit: 'MPa', d: 3, hl: true },
            { label: '疲劳安全系数 n', value: nA, d: 3, hl: true },
            { label: '最大应力 σmax≈1.3F/A（参考）', value: sigmaMax, unit: 'MPa', d: 2 }
          ] }
        ],
        verdict: {
          level: ok ? 'ok' : 'bad',
          text: ok ? '疲劳强度满足：σa=' + fmt(sigmaA, 3) + ' MPa ≤ [σa]=' + fmt(sigmaAAllow, 3) + ' MPa，n=' + fmt(nA, 3)
                   : '疲劳强度不满足：σa=' + fmt(sigmaA, 3) + ' MPa > [σa]=' + fmt(sigmaAAllow, 3) + ' MPa',
          note: '若不满足，可：① 增大螺栓直径 ② 提高等级 ③ 降低相对刚度 ④ 采用滚制螺纹 ⑤ 采用受拉螺母'
        },
        notes: [
          '应力幅按脉动循环计算（工作载荷在 0~F 之间变化），σa = λ·F/(2A)。',
          '综合影响因数 KσD = Kσ/(ε·β₁·β₂)，其中 β₁ 为制造工艺因数，β₂ 为受力不均匀因数。',
          '抗压疲劳强度 σ<sub>-1p</sub> ≈ 0.35σb（经验值）。',
          '动载荷下还需进行静强度校核（见静载荷工具），此处仅校核疲劳强度。'
        ]
      };
    },
    formulas: [
      'σa = λ·F/(2A)（脉动循环）',
      'KσD = Kσ/(ε·β₁·β₂)',
      '[σa] = σ<sub>-1p</sub>/(KσD·S)，σ<sub>-1p</sub>≈0.35σb',
      '疲劳安全系数 n = [σa]/σa ≥ 1'
    ],
    reference: 'GB/T 3098.1《紧固件机械性能》；《机械设计》第九版 第四章，VDI 2230 标准。'
  });

  /* ============ 6. 平键连接强度校核 ============ */
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

  /* ============ 7. 压缩弹簧设计 ============ */
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