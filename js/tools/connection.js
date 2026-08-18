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

  // 性能等级 → 屈服强度 σs MPa、抗拉强度 σB MPa（与 mechtool.cn 数据 1:1 一致）
  var GRADE_SS = {
    '3.6': 180, '4.6': 240, '4.8': 320, '5.6': 300, '5.8': 400,
    '6.8': 480, '8.8': 640, '9.8': 720, '10.9': 900, '12.9': 1080, '14.9': 1260
  };
  var GRADE_SB = {
    '3.6': 300, '4.6': 400, '4.8': 400, '5.6': 500, '5.8': 500,
    '6.8': 600, '8.8': 800, '9.8': 900, '10.9': 1000, '12.9': 1200, '14.9': 1400
  };
  function gradeOpts() {
    return Object.keys(GRADE_SS).map(function (k) {
      return { v: k, t: k + ' 级（σs=' + GRADE_SS[k] + 'MPa, σB=' + GRADE_SB[k] + 'MPa）' };
    });
  }

  // 不锈钢等级 → [σs, σB, σ-1t, Kσ]（与 mechtool.cn 数据 1:1 一致）
  var SS_DATA = {
    'A*-50': [210, 500, 175, 3.9], 'A*-70': [450, 700, 245, 4.8], 'A*-80': [600, 800, 280, 4.8],
    'C*-50': [250, 500, 175, 3.9], 'C*-70': [410, 700, 245, 4.8], 'C*-80': [640, 800, 280, 4.8],
    'C*-110': [820, 1100, 385, 5.2], 'F1-45': [250, 450, 158, 3.9], 'F1-60': [410, 600, 210, 3.9]
  };
  function ssGradeOpts() {
    return Object.keys(SS_DATA).map(function (k) {
      return { v: k, t: k + '（σs=' + SS_DATA[k][0] + 'MPa, σB=' + SS_DATA[k][1] + 'MPa）' };
    });
  }
  // 兼容旧引用：不锈钢默认 A*-70
  var SS_GRADE = { name: 'A*-70（不锈钢）', ss: 450, sb: 700 };
  // 统一取等级数据：返回 { ss, sb }
  function gradeData(v) {
    if (v.matType === 'ss') {
      var g = SS_DATA[v.gradeSS || 'A*-70'] || SS_DATA['A*-70'];
      return { ss: g[0], sb: g[1] };
    }
    return { ss: GRADE_SS[v.grade] || GRADE_SS['4.8'], sb: GRADE_SB[v.grade] || GRADE_SB['4.8'] };
  }

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
      { key: 'gradeSS', label: '不锈钢等级', group: '载荷与材料', type: 'select', options: ssGradeOpts(), default: 'A*-70',
        visible: function (v) { return v.matType === 'ss'; } },
      { key: 'F', label: '轴向工作载荷 F', group: '载荷与材料', type: 'number', unit: 'kN', default: 10, step: 'any' },
      { key: 'S', label: '安全系数 S', group: '载荷与材料', type: 'number', default: 1.4, step: 'any', hint: '松螺栓常取 1.2~1.7（与 mechtool.cn 默认一致）' },
      { key: 'd', label: '螺栓公称直径', group: '螺栓尺寸', type: 'select', options: threadOpts(), default: '12',
        visible: function (v) { return v.mode !== 'design'; } }
    ],
    compute: function (v) {
      var F = +v.F * 1000, S = +v.S;
      if (!(F > 0)) return { error: '请输入轴向工作载荷 F（kN）' };
      if (!(S > 0)) return { error: '请输入安全系数 S' };
      var ss = gradeData(v).ss;
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
      { key: 'gradeSS', label: '不锈钢等级', group: '载荷与材料', type: 'select', options: ssGradeOpts(), default: 'A*-70',
        visible: function (v) { return v.matType === 'ss'; } },
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
        placeholder: '默认取公称直径',
        hint: '铰制孔螺栓受剪段（光杆）直径，留空默认取所选公称直径' }
    ],
    compute: function (v) {
      var dynFactor = v.dyn === 'yes' ? (+v.dynFactor || 0.7) : 1;
      var F = +v.F * 1000, Sp = +v.Sp, St = +v.St, h = +v.h, m = +v.m;
      if (!(F > 0)) return { error: '请输入横向载荷 F（kN）' };
      if (!(Sp > 0) || !(St > 0)) return { error: '请输入挤压/抗剪安全系数' };
      if (!(h > 0)) return { error: '请输入受挤压高度 h（mm）' };
      if (!(m >= 1)) return { error: '受剪面数 m 应≥1' };

      var gd = gradeData(v), ss = gd.ss, sb = gd.sb;
      // 许用挤压应力 [σp] = σs / Sp × 动载荷系数（动载时折减）
      var sigmaPAllow = ss / Sp * dynFactor;
      // 许用剪切应力 [τ] = σs / St（动载不折减，参考 mechtool.cn）
      var tauAllow = ss / St;

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
      var d0 = +v.d0 || +v.d;        // 受剪直径，优先取用户输入，默认取公称直径（与 mechtool.cn 一致）
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
          '铰制孔螺栓的受剪直径 d₀ 为螺栓杆（光杆）直径，由用户输入；默认取公称直径。',
          '动载荷时仅对挤压许用应力进行折减，即 [σp] = σs/Sp × 系数；剪切许用应力 [τ] = σs/St 不变。'
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
      { key: 'grade', label: '机械性能等级', group: '载荷与材料', type: 'select', options: gradeOpts(), default: '6.8',
        visible: function (v) { return v.matType !== 'ss'; } },
      { key: 'gradeSS', label: '不锈钢等级', group: '载荷与材料', type: 'select', options: ssGradeOpts(), default: 'A*-70',
        visible: function (v) { return v.matType === 'ss'; } },
      { key: 'F', label: '横向载荷 F', group: '载荷与材料', type: 'number', unit: 'kN', default: 0.7, step: 'any' },
      { key: 'Kf', label: '可靠性系数 K<sub>f</sub>', group: '连接参数', type: 'number', default: 1.2, step: 'any', hint: '常取 1.1~1.3' },
      { key: 'm', label: '接合面数 m', group: '连接参数', type: 'number', default: 1, step: '1', hint: '单面=1，双面=2' },
      { key: 'f', label: '接合面摩擦因数 f', group: '连接参数', type: 'number', default: 0.15, step: 'any', hint: '钢-钢：0.1~0.15；钢-铸铁：0.15~0.2' },
      { key: 'S', label: '安全系数 S', group: '连接参数', type: 'number', default: 3.5, step: 'any', hint: '控制预紧力 1.2~1.5，不控制查手册' },
      { key: 'dyn', label: '载荷性质', group: '连接参数', type: 'segment', options: [
        { v: 'static', t: '静载荷' }, { v: 'dynamic', t: '动载荷' }
      ] },
      { key: 'd', label: '螺栓公称直径', group: '螺栓尺寸', type: 'select', options: threadOpts(), default: '10',
        visible: function (v) { return v.mode !== 'design'; } }
    ],
    compute: function (v) {
      var F = +v.F * 1000, Kf = +v.Kf, m = +v.m, f = +v.f, S = +v.S;
      if (!(F > 0)) return { error: '请输入横向载荷 F（kN）' };
      if (!(Kf >= 1)) return { error: '可靠性系数 Kf 应≥1' };
      if (!(m >= 1)) return { error: '接合面数 m 应≥1' };
      if (!(f > 0)) return { error: '请输入摩擦因数 f' };
      if (!(S > 0)) return { error: '请输入安全系数 S' };

      var ss = gradeData(v).ss;
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
      { key: 'grade', label: '性能等级', group: '螺栓与工况', type: 'select', options: gradeOpts(), default: '6.8',
        visible: function (v) { return v.matType !== 'ss'; } },
      { key: 'gradeSS', label: '不锈钢等级', group: '螺栓与工况', type: 'select', options: ssGradeOpts(), default: 'A*-70',
        visible: function (v) { return v.matType === 'ss'; } },
      { key: 'd', label: '螺栓公称直径', group: '螺栓与工况', type: 'select', options: threadOpts(), default: '10',
        visible: function (v) { return v.mode !== 'design'; } },
      { key: 'F', label: '轴向工作载荷 F', group: '载荷参数', type: 'number', unit: 'kN', default: 2, step: 'any' },
      { key: 'resType', label: '残余预紧力系数', group: '载荷参数', type: 'number', default: 1.6, step: 'any',
        hint: '残余预紧力 F″ = 系数×F；一般 1.5~1.8，变载/密封取大' },
      { key: 'lambda', label: '相对刚度 λ', group: '载荷参数', type: 'number', default: 0.25, step: 'any',
        hint: '金属垫/无垫片 0.2~0.3，皮革/铜皮石棉 0.5，软垫片 0.7~0.9' },
      { key: 'S', label: '安全系数 S', group: '载荷参数', type: 'number', default: 3, step: 'any', hint: '控制预紧力：1.2~1.5；不控制查手册（一般1.6~3）' }
    ],
    compute: function (v) {
      var F = +v.F * 1000, S = +v.S, kRes = +v.resType, lambda = +v.lambda;
      if (!(F > 0)) return { error: '请输入工作载荷 F（kN）' };
      if (!(S > 0)) return { error: '请输入安全系数 S' };
      var ss = gradeData(v).ss;
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
      'F″ = k·F（残余预紧力系数 k 由用户输入，与 mechtool.cn 一致）',
      'F₀ = F″ + F = F′ + λ·F，F′ = F″ + (1−λ)·F',
      'σ<sub>ca</sub> = 1.3·F₀ / (π·d₁²/4) ≤ [σ] = σ<sub>s</sub>/S',
      '设计：d₁ ≥ √(4×1.3·F₀/(π·[σ]))'
    ],
    reference: 'GB/T 196《普通螺纹 基本尺寸》、GB/T 3098.1《紧固件机械性能 螺栓、螺钉和螺柱》；《机械设计》第九版 第四章。'
  });

  /* =====================================================
   * 工具 5：受轴向载荷-紧螺栓连接（动载荷）校核与设计
   * 1:1 复刻 mechtool.cn（calculation_boltconnection4）
   * σa = λF/(2A)；[σa] = ε·Kt·Ku·σ-1t/(Kσ·Sa1)
   * ===================================================== */
  // 等级 → 抗压疲劳强度 σ-1t（MPa）、缺口应力集中因数 Kσ（与 mechtool.cn 一致）
  var GRADE_S1T = {
    '3.6': 105, '4.6': 140, '4.8': 140, '5.6': 175, '5.8': 175,
    '6.8': 210, '8.8': 280, '9.8': 315, '10.9': 350, '12.9': 420, '14.9': 490
  };
  function ksBySb(sb) {           // 按 σB 分段取 Kσ（mechtool.cn 逻辑）
    return sb <= 400 ? 3 : sb <= 600 ? 3.9 : sb <= 800 ? 4.8 : 5.2;
  }
  function sizeFactor(d) {        // 尺寸因数 ε（表2，d≤12 取 1，非标准档就近向下取）
    d = +d;
    if (!(d > 0)) return 1;
    if (d <= 12) return 1;
    if (d <= 16) return 0.87;
    if (d <= 20) return 0.8;
    if (d <= 24) return 0.74;
    if (d <= 30) return 0.65;
    if (d <= 36) return 0.64;
    if (d <= 42) return 0.6;
    if (d <= 48) return 0.57;
    if (d <= 56) return 0.54;
    return 0.53;
  }
  // mechtool.cn 设计推荐序列（不含 M14/M18/M22/M27/M33/M39/M45）
  var MT_SIZES = ['1', '1.2', '1.6', '2', '2.5', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24', '30', '36', '42', '48', '56', '64'];

  App.registerTool({
    id: 'bolt-dynamic',
    name: '螺栓连接动载荷校核',
    category: 'connect',
    keywords: '螺栓 动载荷 疲劳 应力幅 疲劳强度 校核 紧螺栓 轴向载荷',
    brief: '受轴向载荷的紧螺栓连接动载荷疲劳强度校核与设计，校核应力幅与许用应力幅。',
    doc: '用于<b>受轴向工作载荷的紧螺栓连接（动载荷）</b>疲劳强度校核与设计。计算螺栓应力幅 σ<sub>a</sub>=λF/(2A)，许用应力幅 [σ<sub>a</sub>]=ε·K<sub>t</sub>·K<sub>u</sub>·σ<sub>-1t</sub>/(K<sub>σ</sub>·S<sub>a1</sub>)，与 mechtool.cn 计算方式 1:1 一致。',
    inputs: [
      { key: 'mode', label: '计算模式', group: '计算模式', type: 'segment', options: [
        { v: 'check', t: '校核计算' }, { v: 'design', t: '设计计算' }
      ] },
      { key: 'matType', label: '螺栓材料', group: '载荷与材料', type: 'segment', options: [
        { v: 'steel', t: '钢' }, { v: 'ss', t: '不锈钢' }
      ] },
      { key: 'grade', label: '机械性能等级', group: '载荷与材料', type: 'select', options: gradeOpts(), default: '4.8',
        visible: function (v) { return v.matType !== 'ss'; } },
      { key: 'gradeSS', label: '不锈钢等级', group: '载荷与材料', type: 'select', options: ssGradeOpts(), default: 'A*-70',
        visible: function (v) { return v.matType === 'ss'; } },
      { key: 'F', label: '轴向工作载荷 F', group: '载荷与材料', type: 'number', unit: 'kN', default: 1, step: 'any' },
      { key: 'lambda', label: '相对刚度 λ', group: '载荷与材料', type: 'number', default: 0.25, step: 'any',
        hint: '金属垫/无垫片 0.2~0.3，皮革 0.7，铜皮石棉 0.8，橡胶 0.9' },
      { key: 'd', label: '螺栓公称尺寸', group: '螺栓尺寸', type: 'select', options: threadOpts(), default: '10',
        visible: function (v) { return v.mode !== 'design'; } },
      { key: 'Sa1', label: '安全系数 S<sub>a1</sub>', group: '疲劳参数', type: 'number', default: 2, step: 'any',
        hint: '控制预紧力取 2；不控制预紧力取 3.7' },
      { key: 'preloadCtrl', label: '预紧力控制', group: '疲劳参数', type: 'segment', options: [
        { v: 'yes', t: '控制预紧力' }, { v: 'no', t: '不控制预紧力' }
      ], hint: '选择后请核对安全系数：控制=2，不控制=3.7' },
      { key: 'process', label: '制造工艺', group: '疲劳参数', type: 'segment', options: [
        { v: 'cut', t: '切制螺纹（Kt=1）' }, { v: 'roll', t: '滚制/搓制螺纹（Kt=1.25）' }
      ] },
      { key: 'nutType', label: '螺母类型', group: '疲劳参数', type: 'segment', options: [
        { v: 'comp', t: '受压螺母（Ku=1）' }, { v: 'tens', t: '受拉螺母（Ku=1.55）' }
      ] },
      { key: 'Ksigma', label: '缺口应力集中因数 Kσ', group: '疲劳参数', type: 'number', step: 'any',
        placeholder: '自动',
        hint: '留空按 σB 自动推荐：≤400→3，≤600→3.9，≤800→4.8，其余 5.2；可手动修改' },
      { key: 'epsilon', label: '尺寸因数 ε', group: '疲劳参数', type: 'number', step: 'any',
        placeholder: '自动',
        hint: '留空按直径自动推荐：≤M12→1，M16→0.87，M20→0.8，M24→0.74，M30→0.65，M36→0.64，M42→0.6，M48→0.57，M56→0.54，M64→0.53' }
    ],
    compute: function (v) {
      var F = +v.F * 1000, lambda = +v.lambda, S = +v.Sa1;
      if (!(F > 0)) return { error: '请输入轴向工作载荷 F（kN）' };
      if (!(S > 0)) return { error: '请输入安全系数 Sa1' };

      var gd = gradeData(v);                       // { ss, sb }
      var ss = gd.ss, sb = gd.sb;
      var isSS = v.matType === 'ss';
      // σ-1t 与 Kσ 推荐值（等级数据表）
      var s1tRec = isSS ? SS_DATA[v.gradeSS || 'A*-70'][2] : GRADE_S1T[v.grade];
      var ksRec = ksBySb(sb);

      var Ksigma = +v.Ksigma > 0 ? +v.Ksigma : ksRec;
      var Kt = v.process === 'roll' ? 1.25 : 1;    // 制造工艺因数
      var Ku = v.nutType === 'tens' ? 1.55 : 1;    // 受力不均匀因数

      if (v.mode === 'design') {
        var epsilon = +v.epsilon > 0 ? +v.epsilon : 1;   // 设计模式 ε 取 1（直径未知）
        var sigmaAAllow = epsilon * Kt * Ku * s1tRec / (ksRec * S);
        var needD1 = Math.sqrt(2 * lambda * F / (Math.PI * sigmaAAllow));
        var recD = null;
        for (var i = 0; i < MT_SIZES.length; i++) {
          var k = MT_SIZES[i];
          if (THREAD_D1[k] >= needD1) { recD = k; break; }
        }
        return {
          sections: [
            { title: '材料与疲劳参数', rows: [
              { label: '螺栓抗拉强度 σB', value: sb, unit: 'MPa' },
              { label: '螺栓屈服强度 σs', value: ss, unit: 'MPa' },
              { label: '抗压疲劳强度 σ-1t', value: s1tRec, unit: 'MPa' },
              { label: '尺寸因数 ε', value: epsilon, unit: '' },
              { label: '制造工艺因数 Kt', value: Kt, unit: '' },
              { label: '受力不均匀因数 Ku', value: Ku, unit: '' },
              { label: '缺口应力集中因数 Kσ', value: ksRec, unit: '' },
              { label: '安全系数 Sa1', value: S, unit: '' },
              { label: '许用应力幅 [σa]', value: sigmaAAllow, unit: 'MPa', d: 2, hl: true }
            ] },
            { title: '设计结果', rows: [
              { label: '所需螺纹小径 d₁≥', value: needD1, unit: 'mm', d: 3, hl: true },
              { label: '应选用螺栓公称直径', html: recD ? 'M' + recD : '超出数据范围' },
              { label: '螺栓小径 d₁', html: recD ? String(THREAD_D1[recD]) : '--', unit: recD ? 'mm' : '' }
            ] }
          ],
          verdict: { level: 'ok', text: '按疲劳强度设计，所需 d₁ ≥ ' + fmt(needD1, 3) + ' mm，应选用 M' + (recD || '--') },
          notes: [
            '设计模式下尺寸因数 ε 取 1（直径未定），与 mechtool.cn 一致。',
            '动载荷设计后还应进行静强度校核（见静载荷工具）。'
          ]
        };
      }

      var d1 = THREAD_D1[v.d];
      if (!d1) return { error: '未找到所选螺栓的小径数据' };
      var epsRec = sizeFactor(v.d);
      var epsilon = +v.epsilon > 0 ? +v.epsilon : epsRec;
      var A = Math.PI * d1 * d1 / 4;
      var sigmaA = lambda * F / (2 * A);                    // 应力幅
      var sigmaAAllow = epsilon * Kt * Ku * s1tRec / (Ksigma * S);  // 许用应力幅
      var ok = sigmaA <= sigmaAAllow;

      return {
        sections: [
          { title: '材料与疲劳参数', rows: [
            { label: '螺栓抗拉强度 σB', value: sb, unit: 'MPa' },
            { label: '螺栓屈服强度 σs', value: ss, unit: 'MPa' },
            { label: '抗压疲劳强度 σ-1t', value: s1tRec, unit: 'MPa' },
            { label: '尺寸因数 ε', value: epsilon, unit: '' },
            { label: '制造工艺因数 Kt', value: Kt, unit: '' },
            { label: '受力不均匀因数 Ku', value: Ku, unit: '' },
            { label: '缺口应力集中因数 Kσ', value: Ksigma, unit: '' },
            { label: '安全系数 Sa1', value: S, unit: '' },
            { label: '许用应力幅 [σa]', value: sigmaAAllow, unit: 'MPa', d: 2, hl: true }
          ] },
          { title: '校核结果', rows: [
            { label: '螺栓公称直径', html: 'M' + v.d },
            { label: '螺栓小径 d₁', value: d1, unit: 'mm' },
            { label: '危险截面积 A', value: A, unit: 'mm²', d: 2 },
            { label: '计算应力幅 σa=λF/(2A)', value: sigmaA, unit: 'MPa', d: 2, hl: true }
          ] }
        ],
        verdict: {
          level: ok ? 'ok' : 'bad',
          text: ok ? '校核通过：σa = ' + fmt(sigmaA, 2) + ' MPa ≤ [σa] = ' + fmt(sigmaAAllow, 2) + ' MPa'
                   : '校核不通过：σa = ' + fmt(sigmaA, 2) + ' MPa > [σa] = ' + fmt(sigmaAAllow, 2) + ' MPa',
          note: '若不满足，可：① 增大螺栓直径 ② 提高性能等级 ③ 降低相对刚度 ④ 采用滚制螺纹 ⑤ 采用受拉螺母'
        },
        notes: [
          '应力幅 σa = λF/(2A)，工作载荷在 0~F 之间脉动变化。',
          '许用应力幅 [σa] = ε·Kt·Ku·σ-1t/(Kσ·Sa1)，与 mechtool.cn 完全一致。',
          '抗压疲劳强度 σ-1t = 0.35σB（按等级数据表）。',
          'Kσ 按 σB 推荐：≤400→3，≤600→3.9，≤800→4.8，其余 5.2；ε 按公称直径查表。',
          '动载荷下还需进行静强度校核（见静载荷工具）。'
        ]
      };
    },
    formulas: [
      'σ<sub>a</sub> = λF/(2A)，A = πd₁²/4',
      '[σ<sub>a</sub>] = ε·K<sub>t</sub>·K<sub>u</sub>·σ<sub>-1t</sub>/(K<sub>σ</sub>·S<sub>a1</sub>)',
      '设计：d₁ ≥ √(2λF/(π[σ<sub>a</sub>]))',
      'K<sub>t</sub>：切制 1、滚制搓制 1.25；K<sub>u</sub>：受压螺母 1、受拉螺母 1.55'
    ],
    reference: 'GB/T 3098.1《紧固件机械性能》；《机械设计》第九版 第四章；mechtool.cn 螺栓连接（动载荷）。'
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
  /* =====================================================
   * 键连接系列 —— 1:1 复刻 mechtool.cn（calculation_keyconnection 等 6 页）
   * ===================================================== */
  // 平键/楔键 键截面系列（b×h）
  var KEY_BH = ['2x2','3x3','4x4','5x5','6x6','8x7','10x8','12x8','14x9','16x10','18x11','20x12','22x14','25x14','28x16','32x18','36x20','40x22','45x25','50x28','56x32','63x32','70x36','80x40','90x45','100x50'];
  var KEY_LEN_SERIES = [6,8,10,12,14,16,18,20,22,25,28,32,36,40,45,50,56,63,70,80,90,100,110,125,140,160,180,200,220,250,280,320,360,400,450,500];
  // 按轴径推荐 平键/楔键 截面与长度（mechtool.cn calculation_keysize 实测）
  var FLAT_REC = [
    { max: 8, bh: '2x2', L: 6 }, { max: 10, bh: '3x3', L: 6 }, { max: 12, bh: '4x4', L: 8 },
    { max: 16, bh: '5x5', L: 10 }, { max: 22, bh: '6x6', L: 14 }, { max: 28, bh: '8x7', L: 18 },
    { max: 36, bh: '10x8', L: 22 }, { max: 40, bh: '12x8', L: 28 }, { max: 50, bh: '14x9', L: 36 },
    { max: 56, bh: '16x10', L: 45 }, { max: 63, bh: '18x11', L: 50 }, { max: 75, bh: '20x12', L: 56 },
    { max: 85, bh: '22x14', L: 63 }, { max: 95, bh: '25x14', L: 70 }, { max: 110, bh: '28x16', L: 80 }, { max: 120, bh: '32x18', L: 90 }
  ];
  function flatRec(d) {
    for (var i = 0; i < FLAT_REC.length; i++) if (d <= FLAT_REC[i].max) return FLAT_REC[i];
    return FLAT_REC[FLAT_REC.length - 1];
  }
  // 平键/半圆键 许用挤压应力 [σp]（mechtool.cn 自动推荐，MPa；实测其 JS：钢 135/101/68、铸铁 75/56/38）
  var SIGP_FLAT = {
    '钢': { '静载荷': 135, '轻微冲击载荷': 101, '冲击载荷': 68 },
    '铸铁': { '静载荷': 75, '轻微冲击载荷': 56, '冲击载荷': 38 }
  };
  var P_DYN = { '静载荷': 50, '轻微冲击载荷': 40, '冲击载荷': 30 };   // 平键动连接 [p]（钢）
  // 平键/楔键 有效长度：A型 L-b，B型 L，C型 L-b/2
  function effLen(keyType, L, b) {
    if (keyType === 'B型') return L;
    if (keyType === 'C型') return L - b / 2;
    return L - b;      // A型
  }
  // 双键承载系数：单键 1，双键 1.5
  function nKeys(v) { return v === '双键' ? 1.5 : 1; }

  /* ============ 6. 平键连接强度校核（静/动连接） ============ */
  App.registerTool({
    id: 'key-check',
    name: '平键连接强度校核',
    category: 'connect',
    keywords: '平键 键连接 挤压应力 静连接 动连接 A型 B型 C型 单键 双键',
    brief: '平键连接（静连接/动连接）强度校核，σp=2T/(dkl)，与 mechtool.cn 1:1 一致。',
    doc: '平键连接强度校核：σ<sub>p</sub> = 2T/(d·k·l) ≤ [σ<sub>p</sub>]，接触高度 k≈0.4h；A 型有效长度 l=L−b、B 型 l=L、C 型 l=L−b/2；双键按 1.5 倍承载。静/动连接仅许用应力不同，与 mechtool.cn 完全一致。',
    inputs: [
      { key: 'connType', label: '连接类型', group: '工况', type: 'segment', options: [
        { v: 'static', t: '静连接' }, { v: 'dynamic', t: '动连接（导向平键/滑键）' }
      ] },
      { key: 'T', label: '传递转矩 T', group: '工况', type: 'number', unit: 'N·m', default: 840, step: 'any' },
      { key: 'd', label: '轴的直径 d', group: '工况', type: 'number', unit: 'mm', default: 60, step: 'any', hint: '键截面与长度可按轴径在下方选择推荐值' },
      { key: 'material', label: '最弱的材料', group: '工况', type: 'select', options: [
        { v: '钢', t: '钢' }, { v: '铸铁', t: '铸铁' }
      ], default: '钢', visible: function (v) { return v.connType !== 'dynamic'; } },
      { key: 'loadType', label: '载荷类型', group: '工况', type: 'select', options: [
        { v: '静载荷', t: '静载荷' }, { v: '轻微冲击载荷', t: '轻微冲击载荷' }, { v: '冲击载荷', t: '冲击载荷' }
      ], default: '静载荷' },
      { key: 'keySize', label: '键的截面尺寸 b×h', group: '键参数', type: 'select', default: '18x11',
        options: KEY_BH.map(function (s) { return { v: s, t: s }; }) },
      { key: 'keyType', label: '键的类型', group: '键参数', type: 'segment', options: [
        { v: 'A型', t: 'A型（圆头）' }, { v: 'B型', t: 'B型（方头）' }, { v: 'C型', t: 'C型（单圆头）' }
      ], default: 'A型' },
      { key: 'keyLength', label: '键的长度 L', group: '键参数', type: 'select', default: '90',
        options: KEY_LEN_SERIES.map(function (n) { return { v: String(n), t: String(n) }; }) },
      { key: 'keyNumber', label: '键的个数', group: '键参数', type: 'segment', options: [
        { v: '单键', t: '单键' }, { v: '双键', t: '双键' }
      ] },
      { key: 'allowableStress', label: '许用应力 [σ<sub>p</sub>]', group: '键参数', type: 'number', unit: 'MPa', step: 'any',
        placeholder: '自动',
        hint: '留空自动推荐：静连接 钢 135/101/68、铸铁 75/56/38；动连接 50/40/30（静/轻微冲击/冲击）' }
    ],
    compute: function (v) {
      var T = +v.T * 1000, d = +v.d;
      if (!(T > 0)) return { error: '请输入传递转矩 T' };
      if (!(d > 0)) return { error: '请输入轴的直径 d' };
      var parts = String(v.keySize).split('x');
      var b = +parts[0], h = +parts[1];
      var L = +v.keyLength;
      var l = effLen(v.keyType, L, b);
      if (!(l > 0)) return { error: '有效长度 l≤0：请检查键长 L 与键宽 b（A 型 l=L−b）' };
      var k = 0.4 * h;
      var n = nKeys(v.keyNumber);
      var allow = +v.allowableStress > 0 ? +v.allowableStress
        : (v.connType === 'dynamic' ? P_DYN[v.loadType] : SIGP_FLAT[v.material][v.loadType]);
      var sigmaP = 2 * T / (d * k * l * n);
      var ok = sigmaP <= allow;
      var rec = flatRec(d);
      return {
        sections: [
          { title: '输入参数', rows: [
            { label: '键的类型 sType', html: esc(v.keyType) },
            { label: '键的截面尺寸 b×h', html: b + '×' + h },
            { label: '键的长度 L', value: L, unit: 'mm' },
            { label: '键的有效长度 l', value: l, unit: 'mm', d: 2, hl: true },
            { label: '接触高度 k=0.4h', value: k, unit: 'mm', d: 2 },
            { label: '键的个数', html: esc(v.keyNumber) + (n > 1 ? '（承载按 ' + n + ' 倍计）' : '') },
            { label: '按轴径推荐', html: 'b×h=' + rec.bh + '，L=' + rec.L + '（当前 d=' + d + '）' }
          ] },
          { title: '校核结果', rows: [
            { label: '许用应力 [σ<sub>p</sub>]', value: allow, unit: 'MPa', hl: true },
            { label: '计算应力 σ<sub>p</sub>=2T/(dkl)', value: sigmaP, unit: 'MPa', d: 3, hl: true },
            { label: '连接允许最大转矩', value: allow * d * k * l * n / 2000, unit: 'N·m', d: 1 }
          ] }
        ],
        verdict: {
          level: ok ? 'ok' : 'bad',
          text: ok ? '校核通过：σ<sub>p</sub> = ' + fmt(sigmaP, 2) + ' MPa ≤ [σ<sub>p</sub>] = ' + allow + ' MPa'
                   : '校核不通过：σ<sub>p</sub> = ' + fmt(sigmaP, 2) + ' MPa > [σ<sub>p</sub>] = ' + allow + ' MPa',
          note: '若不满足，可：① 增加键长 ② 改用双键（相隔180°，按1.5倍承载）③ 改用花键 ④ 提高轮毂材料'
        },
        notes: [
          '静连接按挤压应力校核，动连接（导向平键/滑键）按工作面压强 p 校核，公式相同、许用值不同。',
          'A 型（圆头）l=L−b，B 型（方头）l=L，C 型（单圆头）l=L−b/2；接触高度 k≈0.4h。',
          '与 mechtool.cn《平键连接校核计算》1:1 一致。'
        ]
      };
    },
    formulas: [
      'σ<sub>p</sub> = 2T/(d·k·l) ≤ [σ<sub>p</sub>]，k≈0.4h',
      'l：A型 L−b、B型 L、C型 L−b/2；双键除以 1.5',
      '[σ<sub>p</sub>] 静连接：钢 135/101/68、铸铁 75/56/38；[p] 动连接：50/40/30 MPa'
    ],
    reference: 'GB/T 1095-2003、GB/T 1096-2003；mechtool.cn 平键连接校核计算。'
  });

  /* ============ 6b. 半圆键连接强度校核 ============ */
  // 半圆键规格 b×h×D×L×k（含接触高度 k，GB/T 1098/1099）
  var HALF_KEYS = [
    '1x1.4x4x3.9x0.4', '1.5x2.6x7x6.8x0.72', '2x2.6x7x6.8x0.97', '2x3.7x10x9.7x0.95',
    '2.5x3.7x10x9.7x1.2', '3x5x13x12.7x1.43', '3x6.5x16x15.7x1.4', '4x6.5x16x15.7x1.8',
    '4x7.5x19x18.6x1.75', '5x6.5x16x15.7x2.35', '5x7.5x19x18.6x2.32', '5x9x22x21.6x2.29',
    '6x9x22x21.6x2.87', '6x10x25x24.5x2.83', '8x11x28x27.4x3.51', '10x13x32x31.4x3.67'
  ];
  // 按轴径推荐半圆键（mechtool.cn calculation_keysize 实测）
  var HALF_REC_LOAD = [
    { max: 6, s: '2x2.6x7x6.8x0.97' }, { max: 8, s: '2.5x3.7x10x9.7x1.2' }, { max: 10, s: '3x5x13x12.7x1.43' },
    { max: 12, s: '3x6.5x16x15.7x1.4' }, { max: 14, s: '4x6.5x16x15.7x1.8' }, { max: 16, s: '4x7.5x19x18.6x1.75' },
    { max: 18, s: '5x6.5x16x15.7x2.35' }, { max: 20, s: '5x7.5x19x18.6x2.32' }, { max: 22, s: '5x9x22x21.6x2.29' },
    { max: 25, s: '6x9x22x21.6x2.87' }, { max: 28, s: '6x10x25x24.5x2.83' }, { max: 32, s: '8x11x28x27.4x3.51' }
  ];
  var HALF_REC_POS = [
    { max: 6, s: '1.5x2.6x7x6.8x0.72' }, { max: 8, s: '2x2.6x7x6.8x0.97' }, { max: 10, s: '2x3.7x10x9.7x0.95' },
    { max: 12, s: '2.5x3.7x10x9.7x1.2' }, { max: 14, s: '3x5x13x12.7x1.43' }, { max: 16, s: '3x6.5x16x15.7x1.4' },
    { max: 18, s: '3x6.5x16x15.7x1.4' }, { max: 20, s: '4x6.5x16x15.7x1.8' }, { max: 22, s: '4x7.5x19x18.6x1.75' },
    { max: 25, s: '5x6.5x16x15.7x2.35' }
  ];
  App.registerTool({
    id: 'key-half',
    name: '半圆键连接强度校核',
    category: 'connect',
    keywords: '半圆键 键连接 挤压强度 校核 定位 传递载荷',
    brief: '半圆键连接强度校核：σp=2T/(dkl)，k、l 取自键规格表，与 mechtool.cn 1:1 一致。',
    doc: '半圆键（GB/T 1098/1099）连接强度校核：σ<sub>p</sub> = 2T/(d·k·L) ≤ [σ<sub>p</sub>]。键规格 b×h×D×L×k 中已含接触高度 k 与长度 L；双键（同一直径上 180°）按 1.5 倍承载。与 mechtool.cn《半圆键连接校核计算》一致。',
    inputs: [
      { key: 'T', label: '传递转矩 T', group: '工况', type: 'number', unit: 'N·m', default: 50, step: 'any' },
      { key: 'd', label: '轴的直径 d', group: '工况', type: 'number', unit: 'mm', default: 20, step: 'any' },
      { key: 'material', label: '最弱的材料', group: '工况', type: 'select', options: [
        { v: '钢', t: '钢' }, { v: '铸铁', t: '铸铁' }
      ], default: '钢' },
      { key: 'loadType', label: '载荷类型', group: '工况', type: 'select', options: [
        { v: '静载荷', t: '静载荷' }, { v: '轻微冲击载荷', t: '轻微冲击载荷' }, { v: '冲击载荷', t: '冲击载荷' }
      ], default: '静载荷' },
      { key: 'forUse', label: '用途', group: '键参数', type: 'segment', options: [
        { v: '传递载荷用', t: '传递载荷用' }, { v: '定位用', t: '定位用' }
      ] },
      { key: 'keySize', label: '键尺寸 b×h×D×L×k', group: '键参数', type: 'select', default: '5x7.5x19x18.6x2.32',
        options: HALF_KEYS.map(function (s) { return { v: s, t: s }; }) },
      { key: 'keyNumber', label: '键的个数', group: '键参数', type: 'segment', options: [
        { v: '单键', t: '单键' }, { v: '双键', t: '双键' }
      ] },
      { key: 'allowableStress', label: '许用应力 [σ<sub>p</sub>]', group: '键参数', type: 'number', unit: 'MPa', step: 'any',
        placeholder: '自动',
        hint: '留空自动推荐：钢 135/110/75、铸铁 75/55/37（静/轻微冲击/冲击）' }
    ],
    compute: function (v) {
      var T = +v.T * 1000, d = +v.d;
      if (!(T > 0)) return { error: '请输入传递转矩 T' };
      if (!(d > 0)) return { error: '请输入轴的直径 d' };
      var p = String(v.keySize).split('x');
      var b = +p[0], h = +p[1], D = +p[2], L = +p[3], k = +p[4];
      var n = nKeys(v.keyNumber);
      var allow = +v.allowableStress > 0 ? +v.allowableStress
        : (v.material === '钢' ? { '静载荷': 135, '轻微冲击载荷': 110, '冲击载荷': 75 }[v.loadType]
                               : { '静载荷': 75, '轻微冲击载荷': 55, '冲击载荷': 37 }[v.loadType]);
      var sigmaP = 2 * T / (d * k * L * n);
      var ok = sigmaP <= allow;
      var recTab = v.forUse === '定位用' ? HALF_REC_POS : HALF_REC_LOAD;
      var rec = null;
      for (var i = 0; i < recTab.length; i++) if (d <= recTab[i].max) { rec = recTab[i]; break; }
      return {
        sections: [
          { title: '输入参数', rows: [
            { label: '键尺寸 b×h×D', html: b + '×' + h + '×' + D },
            { label: '键的长度 L', value: L, unit: 'mm' },
            { label: '接触高度 k', value: k, unit: 'mm', d: 2 },
            { label: '键的个数', html: esc(v.keyNumber) + (n > 1 ? '（承载按 ' + n + ' 倍计）' : '') },
            { label: '按轴径推荐（' + v.forUse + '）', html: rec ? rec.s : '超出推荐范围' }
          ] },
          { title: '校核结果', rows: [
            { label: '许用应力 [σ<sub>p</sub>]', value: allow, unit: 'MPa', hl: true },
            { label: '计算应力 σ<sub>p</sub>=2T/(dkL)', value: sigmaP, unit: 'MPa', d: 3, hl: true }
          ] }
        ],
        verdict: {
          level: ok ? 'ok' : 'bad',
          text: ok ? '校核通过：σ<sub>p</sub> = ' + fmt(sigmaP, 2) + ' MPa ≤ [σ<sub>p</sub>] = ' + allow + ' MPa'
                   : '校核不通过：σ<sub>p</sub> = ' + fmt(sigmaP, 2) + ' MPa > [σ<sub>p</sub>] = ' + allow + ' MPa',
          note: '半圆键常用于锥形轴端与定位，承载较低；不满足时可加大轴径或改用平键/花键。'
        },
        notes: ['半圆键能在轴槽中摆动自位，装配方便；k、L 直接取自规格表，与 mechtool.cn 一致。']
      };
    },
    formulas: [
      'σ<sub>p</sub> = 2T/(d·k·L) ≤ [σ<sub>p</sub>]，k、L 取自键规格 b×h×D×L×k',
      '[σ<sub>p</sub>]：钢 135/110/75、铸铁 75/55/37 MPa（静/轻微冲击/冲击）；双键除以 1.5'
    ],
    reference: 'GB/T 1098-2003、GB/T 1099.1-2003；mechtool.cn 半圆键连接校核计算。'
  });

  /* ============ 6c. 楔键连接强度校核 ============ */
  App.registerTool({
    id: 'key-wedge',
    name: '楔键连接强度校核',
    category: 'connect',
    keywords: '楔键 键连接 挤压强度 摩擦 楔紧 1:100 斜度',
    brief: '普通楔键连接强度校核：σp=12T/(bl(b+6μd))，与 mechtool.cn 1:1 一致。',
    doc: '普通楔键（1:100 斜度）连接强度校核：σ<sub>p</sub> = 12T/(b·l·(b+6μd)) ≤ [σ<sub>p</sub>]，μ 为键毂摩擦系数（一般 0.14~0.2）。楔键靠上下面楔紧传扭，对中性差，只用于低速回转或传动精度要求不高的场合。与 mechtool.cn《普通楔键连接校核计算》一致。',
    inputs: [
      { key: 'T', label: '传递转矩 T', group: '工况', type: 'number', unit: 'N·m', default: 840, step: 'any' },
      { key: 'd', label: '轴的直径 d', group: '工况', type: 'number', unit: 'mm', default: 60, step: 'any' },
      { key: 'material', label: '最弱的材料', group: '工况', type: 'select', options: [
        { v: '钢', t: '钢' }, { v: '铸铁', t: '铸铁' }
      ], default: '钢' },
      { key: 'loadType', label: '载荷类型', group: '工况', type: 'select', options: [
        { v: '静载荷', t: '静载荷' }, { v: '轻微冲击载荷', t: '轻微冲击载荷' }, { v: '冲击载荷', t: '冲击载荷' }
      ], default: '静载荷' },
      { key: 'keySize', label: '键的截面尺寸 b×h', group: '键参数', type: 'select', default: '18x11',
        options: KEY_BH.map(function (s) { return { v: s, t: s }; }) },
      { key: 'keyType', label: '键的类型', group: '键参数', type: 'segment', options: [
        { v: 'A型', t: 'A型（圆头）' }, { v: 'B型', t: 'B型（方头）' }, { v: 'C型', t: 'C型（单圆头）' }
      ] },
      { key: 'keyLength', label: '键的长度 L', group: '键参数', type: 'select', default: '90',
        options: KEY_LEN_SERIES.map(function (n) { return { v: String(n), t: String(n) }; }) },
      { key: 'keyNumber', label: '键的个数', group: '键参数', type: 'segment', options: [
        { v: '单键', t: '单键' }, { v: '双键', t: '双键' }
      ] },
      { key: 'miu', label: '摩擦系数 μ', group: '键参数', type: 'number', step: 'any', default: 0.14,
        hint: '键与毂/轴接触面摩擦系数，一般 0.14~0.20' },
      { key: 'allowableStress', label: '许用应力 [σ<sub>p</sub>]', group: '键参数', type: 'number', unit: 'MPa', step: 'any',
        placeholder: '自动',
        hint: '留空自动推荐：钢 135/101/68、铸铁 75/56/38（静/轻微冲击/冲击）' }
    ],
    compute: function (v) {
      var T = +v.T * 1000, d = +v.d, miu = +v.miu;
      if (!(T > 0)) return { error: '请输入传递转矩 T' };
      if (!(d > 0)) return { error: '请输入轴的直径 d' };
      if (!(miu > 0)) return { error: '请输入摩擦系数 μ' };
      var p = String(v.keySize).split('x');
      var b = +p[0];
      var L = +v.keyLength;
      var l = effLen(v.keyType, L, b);
      if (!(l > 0)) return { error: '有效长度 l≤0：请检查键长 L 与键宽 b' };
      var n = nKeys(v.keyNumber);
      var allow = +v.allowableStress > 0 ? +v.allowableStress : SIGP_FLAT[v.material][v.loadType];
      var sigmaP = 12 * T / (b * l * (b + 6 * miu * d) * n);
      var ok = sigmaP <= allow;
      var rec = flatRec(d);
      return {
        sections: [
          { title: '输入参数', rows: [
            { label: '键的类型 sType', html: esc(v.keyType) },
            { label: '键的截面尺寸 b×h', html: esc(v.keySize).replace('x', '×') },
            { label: '键的长度 L', value: L, unit: 'mm' },
            { label: '键的有效长度 l', value: l, unit: 'mm', d: 2, hl: true },
            { label: '摩擦系数 μ', value: miu, d: 2 },
            { label: '键的个数', html: esc(v.keyNumber) + (n > 1 ? '（承载按 ' + n + ' 倍计）' : '') },
            { label: '按轴径推荐', html: 'b×h=' + rec.bh + '，L=' + rec.L }
          ] },
          { title: '校核结果', rows: [
            { label: '许用应力 [σ<sub>p</sub>]', value: allow, unit: 'MPa', hl: true },
            { label: '计算应力 σ<sub>p</sub>=12T/(bl(b+6μd))', value: sigmaP, unit: 'MPa', d: 3, hl: true }
          ] }
        ],
        verdict: {
          level: ok ? 'ok' : 'bad',
          text: ok ? '校核通过：σ<sub>p</sub> = ' + fmt(sigmaP, 2) + ' MPa ≤ [σ<sub>p</sub>] = ' + allow + ' MPa'
                   : '校核不通过：σ<sub>p</sub> = ' + fmt(sigmaP, 2) + ' MPa > [σ<sub>p</sub>] = ' + allow + ' MPa',
          note: '楔键楔紧后轴与毂产生偏心，不宜用于高速、精密传动。'
        },
        notes: ['与 mechtool.cn《普通楔键连接校核计算》1:1 一致：σp = 12T/(b·l·(b+6μd))。']
      };
    },
    formulas: [
      'σ<sub>p</sub> = 12T/(b·l·(b+6μd)) ≤ [σ<sub>p</sub>]',
      'l：A型 L−b、B型 L、C型 L−b/2；双键除以 1.5；μ=0.14~0.20'
    ],
    reference: 'GB/T 1563-2017《楔键》；mechtool.cn 普通楔键连接校核计算。'
  });

  /* ============ 6d. 切向键连接强度校核 ============ */
  // 按轴径推荐切向键（mechtool.cn calculation_keysize 实测：t 厚度、c 倒角、b 宽度、L0=1.5d）
  var TAN_REC = [
    { max: 70, t: 7, c: 0.7 }, { max: 90, t: 8, c: 0.7 }, { max: 110, t: 9, c: 0.7 },
    { max: 130, t: 10, c: 1.1 }, { max: 150, t: 11, c: 1.1 }, { max: 180, t: 12, c: 1.1 },
    { max: 200, t: 14, c: 1.1 }, { max: 230, t: 16, c: 1.8 }
  ];
  App.registerTool({
    id: 'key-tangent',
    name: '切向键连接强度校核',
    category: 'connect',
    keywords: '切向键 键连接 挤压强度 重载 单向传动',
    brief: '切向键连接强度校核：σp=2T/(d(t−c)l(0.9+μ))，与 mechtool.cn 1:1 一致。',
    doc: '切向键连接强度校核：σ<sub>p</sub> = 2T/(d·(t−c)·l·(0.9+μ)) ≤ [σ<sub>p</sub>]。切向键由一对 1:100 楔键组成，沿切向楔紧，能传递大转矩，键工作长度常取 l=1.5d；单向传动用一对，双向用两对互成 120°~135°。与 mechtool.cn《切向键连接校核计算》一致。',
    inputs: [
      { key: 'T', label: '传递转矩 T', group: '工况', type: 'number', unit: 'N·m', default: 840, step: 'any' },
      { key: 'd', label: '轴的直径 d', group: '工况', type: 'number', unit: 'mm', default: 60, step: 'any' },
      { key: 'material', label: '最弱的材料', group: '工况', type: 'select', options: [
        { v: '钢', t: '钢' }, { v: '铸铁', t: '铸铁' }
      ], default: '钢' },
      { key: 'loadType', label: '载荷类型', group: '工况', type: 'select', options: [
        { v: '静载荷', t: '静载荷' }, { v: '轻微冲击载荷', t: '轻微冲击载荷' }, { v: '冲击载荷', t: '冲击载荷' }
      ], default: '静载荷' },
      { key: 'keyThickness', label: '键的厚度 t', group: '键参数', type: 'select', default: '7',
        options: [7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 26, 30, 34, 38, 42].map(function (n) { return { v: String(n), t: String(n) }; }) },
      { key: 'keyCorner', label: '键的倒角 c', group: '键参数', type: 'number', unit: 'mm', default: 0.7, step: 'any',
        hint: '按轴径自动推荐：d≤110 取 0.7，120~200 取 1.1，>200 取 1.8' },
      { key: 'keyWidth', label: '键的宽度 b', group: '键参数', type: 'number', unit: 'mm', default: 19.26, step: 'any',
        placeholder: '19.26', hint: '查 GB/T 1974 表，按轴径选取（如 d=60 时 b≈19.26）' },
      { key: 'keyEffectiveLength', label: '键工作长度 l', group: '键参数', type: 'number', unit: 'mm', default: 90, step: 'any',
        hint: '默认按 1.5d 自动推荐（d=60 → l=90），可修改' },
      { key: 'miu', label: '摩擦系数 μ', group: '键参数', type: 'number', step: 'any', default: 0.14,
        hint: '一般 0.14~0.20' },
      { key: 'allowableStress', label: '许用应力 [σ<sub>p</sub>]', group: '键参数', type: 'number', unit: 'MPa', step: 'any',
        placeholder: '自动',
        hint: '留空自动推荐：钢 135/101/68、铸铁 75/56/38（静/轻微冲击/冲击）' }
    ],
    compute: function (v) {
      var T = +v.T * 1000, d = +v.d, t = +v.keyThickness, c = +v.keyCorner, l = +v.keyEffectiveLength, miu = +v.miu;
      if (!(T > 0)) return { error: '请输入传递转矩 T' };
      if (!(d > 0)) return { error: '请输入轴的直径 d' };
      if (!(l > 0)) return { error: '请输入键工作长度 l' };
      if (!(miu > 0)) return { error: '请输入摩擦系数 μ' };
      if (t - c <= 0) return { error: '键厚 t 需大于倒角 c' };
      var allow = +v.allowableStress > 0 ? +v.allowableStress : SIGP_FLAT[v.material][v.loadType];
      var sigmaP = 2 * T / (d * (t - c) * l * (0.9 + miu));
      var ok = sigmaP <= allow;
      var rec = null;
      for (var i = 0; i < TAN_REC.length; i++) if (d <= TAN_REC[i].max) { rec = TAN_REC[i]; break; }
      return {
        sections: [
          { title: '输入参数', rows: [
            { label: '键的厚度 t', value: t, unit: 'mm' },
            { label: '键的倒角 c', value: c, unit: 'mm', d: 2 },
            { label: '键的宽度 b', value: +v.keyWidth, unit: 'mm', d: 2 },
            { label: '键工作长度 l', value: l, unit: 'mm', hl: true },
            { label: '摩擦系数 μ', value: miu, d: 2 },
            { label: '按轴径推荐', html: rec ? ('t=' + rec.t + '，c=' + rec.c + '，l=1.5d=' + (1.5 * d)) : '超出推荐范围' }
          ] },
          { title: '校核结果', rows: [
            { label: '许用应力 [σ<sub>p</sub>]', value: allow, unit: 'MPa', hl: true },
            { label: '计算应力 σ<sub>p</sub>', value: sigmaP, unit: 'MPa', d: 3, hl: true }
          ] }
        ],
        verdict: {
          level: ok ? 'ok' : 'bad',
          text: ok ? '校核通过：σ<sub>p</sub> = ' + fmt(sigmaP, 2) + ' MPa ≤ [σ<sub>p</sub>] = ' + allow + ' MPa'
                   : '校核不通过：σ<sub>p</sub> = ' + fmt(sigmaP, 2) + ' MPa > [σ<sub>p</sub>] = ' + allow + ' MPa',
          note: '双向传动时采用两对切向键（互成 120°~135°），按单对分别校核。'
        },
        notes: ['与 mechtool.cn《切向键连接校核计算》1:1 一致：σp = 2T/(d·(t−c)·l·(0.9+μ))。']
      };
    },
    formulas: [
      'σ<sub>p</sub> = 2T/(d·(t−c)·l·(0.9+μ)) ≤ [σ<sub>p</sub>]',
      '工作长度常取 l = 1.5d；μ = 0.14~0.20'
    ],
    reference: 'GB/T 1974-2003《切向键》；mechtool.cn 切向键连接校核计算。'
  });

  /* ============ 6e. 矩形花键连接强度校核（静/动连接） ============ */
  var RECT_SPLINE = ['6×23×26×6','6×26×30×6','6×28×32×7','8×32×36×6','8×36×40×7','8×42×46×8','8×46×50×9','8×52×58×10','8×56×62×10','8×62×68×12','10×72×78×12','10×82×88×12','10×92×98×11','10×102×108×16','10×112×120×18'];
  // 矩形花键 [p] 范围表（GB/T 1144，MPa）
  var RECT_P_STATIC = { heat: { '不良': '40~70', '中等': '100~140', '良好': '120~200' },
                        noheat: { '不良': '35~50', '中等': '60~100', '良好': '80~120' } };
  var RECT_P_DYN = { loaded: { '不良': '3~10', '中等': '5~15', '良好': '10~20' },
                     unload_heat: { '不良': '20~35', '中等': '30~60', '良好': '40~70' },
                     unload_noheat: { '不良': '15~20', '中等': '20~30', '良好': '25~40' } };
  App.registerTool({
    id: 'key-spline-rect',
    name: '矩形花键连接强度校核',
    category: 'connect',
    keywords: '矩形花键 花键连接 GB/T 1144 轻系列 中系列 静连接 动连接',
    brief: '矩形花键连接（静/动连接）强度校核：p=2T/(φ·N·h·dm·L)，与 mechtool.cn 1:1 一致。',
    doc: '矩形花键连接（GB/T 1144）强度校核：p = 2T/(φ·N·h·d<sub>m</sub>·L) ≤ [p]，d<sub>m</sub>=(D+d)/2 为平均直径，h=(D−d)/2−2c 为键齿工作高度，φ 为载荷分布不均系数（一般 0.7~0.8）。[p] 按使用/制造情况与齿面热处理自动推荐。与 mechtool.cn《矩形花键连接校核计算》一致。',
    inputs: [
      { key: 'connType', label: '连接类型', group: '工况', type: 'segment', options: [
        { v: 'static', t: '静连接' }, { v: 'dynamic', t: '动连接' }
      ] },
      { key: 'workingWay', label: '移动方式', group: '工况', type: 'segment', options: [
        { v: '空载下移动', t: '空载下移动' }, { v: '载荷作用下移动', t: '载荷作用下移动' }
      ], visible: function (v) { return v.connType === 'dynamic'; } },
      { key: 'T', label: '传递转矩 T', group: '工况', type: 'number', unit: 'N·m', default: 85, step: 'any' },
      { key: 'keySeries', label: '键系列', group: '工况', type: 'segment', options: [
        { v: '轻系列', t: '轻系列' }, { v: '中系列', t: '中系列' }
      ], default: '中系列', hint: '同规格下中系列齿数/齿高更大，承载更高' },
      { key: 'workingCondition', label: '使用和制造情况', group: '工况', type: 'select', options: [
        { v: '不良', t: '不良' }, { v: '中等', t: '中等' }, { v: '良好', t: '良好' }
      ], default: '中等' },
      { key: 'heatTreatment', label: '齿面热处理', group: '工况', type: 'segment', options: [
        { v: 'yes', t: '齿面经热处理' }, { v: 'no', t: '齿面未经热处理' }
      ], default: 'yes' },
      { key: 'keySize', label: '花键规格 N×d×D×B', group: '花键参数', type: 'select', default: '6×23×26×6',
        options: RECT_SPLINE.map(function (s) { return { v: s, t: s }; }) },
      { key: 'keyLength', label: '键的长度 L', group: '花键参数', type: 'select', default: '30',
        options: [10,12,15,18,22,25,28,30,32,36,38,42,45,48,50,56,60,63,71,75,80,85,90,95,100,110,120,130,140,160,180,200].map(function (n) { return { v: String(n), t: String(n) }; }) },
      { key: 'keyCorner', label: '键的倒角 c', group: '花键参数', type: 'number', unit: 'mm', default: 0.2, step: 'any' },
      { key: 'phi', label: '载荷不均系数 φ', group: '花键参数', type: 'number', default: 0.75, step: 'any',
        hint: '各齿载荷分布不均系数，一般 0.7~0.8（齿数多、精度差取小）' },
      { key: 'allowableStress', label: '许用应力 [p]', group: '花键参数', type: 'number', unit: 'MPa', step: 'any',
        placeholder: '自动',
        hint: '留空按范围中值自动推荐（静连接中等/经热处理 100~140 → 120；具体见说明）' }
    ],
    compute: function (v) {
      var T = +v.T * 1000;
      if (!(T > 0)) return { error: '请输入传递转矩 T' };
      var p = String(v.keySize).split('×');
      var N = +p[0], dd = +p[1], D = +p[2];
      var L = +v.keyLength, c = +v.keyCorner, phi = +v.phi;
      if (!(phi > 0)) return { error: '请输入载荷不均系数 φ' };
      var dm = (D + dd) / 2;
      var h = (D - dd) / 2 - 2 * c;
      if (!(h > 0)) return { error: '键齿工作高度 h≤0：请减小倒角 c' };
      // [p] 范围自动推荐
      var rangeStr, heat = v.heatTreatment === 'yes';
      if (v.connType === 'static') {
        rangeStr = (heat ? RECT_P_STATIC.heat : RECT_P_STATIC.noheat)[v.workingCondition];
      } else if (v.workingWay === '载荷作用下移动') {
        rangeStr = RECT_P_DYN.loaded[v.workingCondition];
      } else {
        rangeStr = (heat ? RECT_P_DYN.unload_heat : RECT_P_DYN.unload_noheat)[v.workingCondition];
      }
      var range = rangeStr.split('~').map(Number);
      var allow = +v.allowableStress > 0 ? +v.allowableStress : (range[0] + range[1]) / 2;
      var sig = 2 * T / (phi * N * h * dm * L);
      var ok = sig <= allow;
      return {
        sections: [
          { title: '花键参数', rows: [
            { label: '花键规格 N×d×D×B', html: esc(v.keySize) },
            { label: '键系列', html: esc(v.keySeries) },
            { label: '键的长度 L', value: L, unit: 'mm' },
            { label: '键的倒角 c', value: c, unit: 'mm', d: 2 },
            { label: '平均直径 d<sub>m</sub>=(D+d)/2', value: dm, unit: 'mm', d: 2 },
            { label: '键齿工作高度 h', value: h, unit: 'mm', d: 2, hl: true },
            { label: '载荷不均系数 φ', value: phi, d: 2 }
          ] },
          { title: '校核结果', rows: [
            { label: '许用应力范围', html: rangeStr + ' MPa（' + (heat ? '齿面经热处理' : '齿面未经热处理') + '）' },
            { label: '许用应力 [p]', value: allow, unit: 'MPa', hl: true },
            { label: '计算应力 p=2T/(φNhd<sub>m</sub>L)', value: sig, unit: 'MPa', d: 3, hl: true },
            { label: '连接允许最大转矩', value: allow * phi * N * h * dm * L / 2000, unit: 'N·m', d: 1 }
          ] }
        ],
        verdict: {
          level: ok ? 'ok' : 'bad',
          text: ok ? '校核通过：p = ' + fmt(sig, 2) + ' MPa ≤ [p] = ' + allow + ' MPa'
                   : '校核不通过：p = ' + fmt(sig, 2) + ' MPa > [p] = ' + allow + ' MPa',
          note: '不满足时可：① 增加键长 L ② 选用更大规格系列 ③ 齿面淬火提高 [p] ④ 改善制造/使用情况'
        },
        notes: [
          '静连接按挤压（p≤[p]）校核；动连接（移动的花键）按工作面磨损（压强）校核。',
          '[p] 范围：静/热处理 40~70、100~140、120~200；静/未处理 35~50、60~100、80~120；动·载荷下移动 3~10、5~15、10~20；动·空载移动/热处理 20~35、30~60、40~70；动·空载/未处理 15~20、20~30、25~40 MPa（不良/中等/良好）。',
          '与 mechtool.cn《矩形花键连接校核计算》1:1 一致。'
        ]
      };
    },
    formulas: [
      'p = 2T/(φ·N·h·d<sub>m</sub>·L) ≤ [p]',
      'd<sub>m</sub> = (D+d)/2，h = (D−d)/2 − 2c，φ = 0.7~0.8'
    ],
    reference: 'GB/T 1144-2001《矩形花键尺寸》；mechtool.cn 矩形花键连接校核计算。'
  });

  /* ============ 6f. 渐开线花键连接强度校核（静/动连接） ============ */
  App.registerTool({
    id: 'key-spline-inv',
    name: '渐开线花键连接强度校核',
    category: 'connect',
    keywords: '渐开线花键 花键连接 30度 45度 压力角 模数 定心',
    brief: '渐开线花键连接（静/动连接）强度校核：p=2T/(φ·z·h·d·L)，与 mechtool.cn 1:1 一致。',
    doc: '渐开线花键连接（GB/T 3478）强度校核：p = 2T/(φ·z·h·d·L) ≤ [p]，d=m·z 为分度圆直径，工作高度 h：30°压力角取 m、45° 取 0.8m，φ 为载荷不均系数（0.7~0.8）。与 mechtool.cn《渐开线花键连接校核计算》一致。',
    inputs: [
      { key: 'connType', label: '连接类型', group: '工况', type: 'segment', options: [
        { v: 'static', t: '静连接' }, { v: 'dynamic', t: '动连接' }
      ] },
      { key: 'workingWay', label: '移动方式', group: '工况', type: 'segment', options: [
        { v: '空载下移动', t: '空载下移动' }, { v: '载荷作用下移动', t: '载荷作用下移动' }
      ], visible: function (v) { return v.connType === 'dynamic'; } },
      { key: 'T', label: '传递转矩 T', group: '工况', type: 'number', unit: 'N·m', default: 840, step: 'any' },
      { key: 'workingCondition', label: '使用和制造情况', group: '工况', type: 'select', options: [
        { v: '不良', t: '不良' }, { v: '中等', t: '中等' }, { v: '良好', t: '良好' }
      ], default: '中等' },
      { key: 'heatTreatment', label: '齿面热处理', group: '工况', type: 'segment', options: [
        { v: 'yes', t: '齿面经热处理' }, { v: 'no', t: '齿面未经热处理' }
      ], default: 'yes' },
      { key: 'modulus', label: '模数 m', group: '花键参数', type: 'select', default: '2',
        options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10].map(function (n) { return { v: String(n), t: String(n) }; }) },
      { key: 'angle', label: '花键压力角 α', group: '花键参数', type: 'segment', options: [
        { v: '30', t: '30°' }, { v: '45', t: '45°' }
      ] },
      { key: 'teethNo', label: '齿数 z', group: '花键参数', type: 'number', default: 20, step: 'any' },
      { key: 'keyLength', label: '键的长度 L', group: '花键参数', type: 'number', unit: 'mm', default: 30, step: 'any' },
      { key: 'diameter', label: '分度圆直径 d', group: '花键参数', type: 'number', unit: 'mm', default: 40, step: 'any',
        hint: 'd = m·z（m=2、z=20 时 d=40），修改模数/齿数后请同步' },
      { key: 'keyHeight', label: '键齿工作高度 h', group: '花键参数', type: 'number', unit: 'mm', default: 2, step: 'any',
        hint: '30° 取 h=m，45° 取 h=0.8m' },
      { key: 'phi', label: '载荷不均系数 φ', group: '花键参数', type: 'number', default: 0.75, step: 'any' },
      { key: 'allowableStress', label: '许用应力 [p]', group: '花键参数', type: 'number', unit: 'MPa', step: 'any',
        placeholder: '自动', hint: '留空按范围中值推荐（默认 60~100 → 80 MPa）' }
    ],
    compute: function (v) {
      var T = +v.T * 1000;
      if (!(T > 0)) return { error: '请输入传递转矩 T' };
      var m = +v.modulus, z = +v.teethNo, L = +v.keyLength, h = +v.keyHeight, phi = +v.phi;
      var d = +v.diameter > 0 ? +v.diameter : m * z;
      if (!(z > 0) || !(L > 0) || !(h > 0) || !(phi > 0)) return { error: '请完整输入齿数、键长、工作高度与 φ' };
      var rangeStr = (v.connType === 'dynamic' && v.workingWay === '载荷作用下移动')
        ? RECT_P_DYN.loaded[v.workingCondition]
        : (v.heatTreatment === 'yes' ? RECT_P_STATIC.heat : RECT_P_STATIC.noheat)[v.workingCondition];
      var range = rangeStr.split('~').map(Number);
      var allow = +v.allowableStress > 0 ? +v.allowableStress : (range[0] + range[1]) / 2;
      var sig = 2 * T / (phi * z * h * d * L);
      var ok = sig <= allow;
      var dEE = +v.angle === 30 ? m * (z + 1) : m * (z + 0.8);
      return {
        sections: [
          { title: '花键参数', rows: [
            { label: '模数 m', value: m, unit: 'mm', d: 2 },
            { label: '花键压力角 α', value: +v.angle, unit: '°' },
            { label: '齿数 z', value: z },
            { label: '分度圆直径 d=m·z', value: d, unit: 'mm', d: 2, hl: true },
            { label: '花键轴大径 D<sub>ee</sub>', value: dEE, unit: 'mm', d: 2 },
            { label: '键齿工作高度 h', value: h, unit: 'mm', d: 2 },
            { label: '键的长度 L', value: L, unit: 'mm' },
            { label: '载荷不均系数 φ', value: phi, d: 2 }
          ] },
          { title: '校核结果', rows: [
            { label: '许用应力范围', html: rangeStr + ' MPa' },
            { label: '许用应力 [p]', value: allow, unit: 'MPa', hl: true },
            { label: '计算应力 p=2T/(φzhdL)', value: sig, unit: 'MPa', d: 3, hl: true },
            { label: '连接允许最大转矩', value: allow * phi * z * h * d * L / 2000, unit: 'N·m', d: 1 }
          ] }
        ],
        verdict: {
          level: ok ? 'ok' : 'bad',
          text: ok ? '校核通过：p = ' + fmt(sig, 2) + ' MPa ≤ [p] = ' + allow + ' MPa'
                   : '校核不通过：p = ' + fmt(sig, 2) + ' MPa > [p] = ' + allow + ' MPa',
          note: '不满足时可：① 增加键长 ② 增大模数/齿数 ③ 齿面淬火 ④ 改善制造与使用情况'
        },
        notes: [
          '30° 压力角渐开线花键 h=m；45°（代替矩形花键/轻载）h=0.8m。',
          '与 mechtool.cn《渐开线花键连接校核计算》1:1 一致。'
        ]
      };
    },
    formulas: [
      'p = 2T/(φ·z·h·d·L) ≤ [p]',
      'd = m·z；h：30° 取 m、45° 取 0.8m；D<sub>ee</sub>：30° m(z+1)、45° m(z+0.8)'
    ],
    reference: 'GB/T 3478.1-2008《圆柱直齿渐开线花键》；mechtool.cn 渐开线花键连接校核计算。'
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