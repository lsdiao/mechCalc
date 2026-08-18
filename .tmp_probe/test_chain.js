/* 自测：加载 js/app.js + js/tools/trans2_chain.js，与 mechtool.cn API 探针结果逐字段对比 */
var fs = require('fs'), vm = require('vm');
global.window = global;
global.document = { addEventListener(){}, getElementById(){return null}, querySelectorAll(){return[]}, querySelector(){return null}, createElement(){return{style:{},classList:{add(){},remove(){}}}}, body:{appendChild(){}} };
global.location = { hash: '' };
vm.runInThisContext(fs.readFileSync('/workspace/js/app.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('/workspace/js/tools/trans2_chain.js', 'utf8'));
var t = App.getTool('chain-drive-design');
if (!t) { console.error('工具未注册!'); process.exit(1); }

/* 默认值 = 原站表单默认 */
function mk(o) {
  var d = { power:'2.5', n1:'265', n2:'', velocity:'0.6~3', transmissionRatio:'2.5',
    drivingMachine:'运转平稳', drivenMachine:'运转平稳', chainNumber:'单排', chainType:'A型',
    z1:'19', z2:'', f2:'', chainSize:'08A', a0:'9.5', a0length:'', deltaA:'0.004', inputFactorF5:'1.2' };
  for (var k in o) d[k] = o[k];
  return d;
}
function rows(res) {
  var m = {};
  (res.sections || []).forEach(function (s) { (s.rows || []).forEach(function (r) { m[r.label] = r; }); });
  return m;
}
function near(got, exp, tol, name) {
  var ok = Math.abs(got - exp) <= tol;
  console.log((ok ? '  ok  ' : '  FAIL') + ' ' + name + ': got=' + got + ' exp=' + exp);
  return ok;
}
var pass = 0, fail = 0;
function check(ok) { ok ? pass++ : fail++; }

/* ========== 一、设计功率 Pc 探针（calculation_rollerChain1） ========== */
var PC_CASES = [
  { n:'P1 基准 km=1,f1=1,f2=1',        in:{},                                                        exp:2.5 },
  { n:'P2 km=1.75(双排)',              in:{ chainNumber:'双排' },                                     exp:1.43 },
  { n:'P3 f1=1.5(中等+轻微)',          in:{ drivenMachine:'中等冲击', drivingMachine:'轻微冲击' },       exp:3.75 },
  { n:'P4 f2=0.85',                    in:{ f2:'0.85' },                                              exp:2.13 },
  { n:'P5 三排,f1=1.7,f2=1.24,P=10',   in:{ chainNumber:'三排', drivenMachine:'中等冲击', drivingMachine:'中等冲击', f2:'1.24', power:'10' }, exp:8.43 },
  { n:'P6 f1=2.1,f2=0.79,P=100.5',     in:{ drivenMachine:'严重冲击', drivingMachine:'中等冲击', f2:'0.79', power:'100.5' }, exp:166.73 }
];
console.log('== rollerChain1: Pc = f1*f2*P/km（API 已验证，显示 2 位小数） ==');
PC_CASES.forEach(function (c) {
  var r = rows(t.compute(mk(c.in)));
  var Pc = r['设计功率 Pc = f1·f2·P/km'].value;
  var ok = Math.abs(+Pc.toFixed(2) - c.exp) < 1e-9;
  console.log((ok ? '  ok  ' : '  FAIL') + ' ' + c.n + ': Pc=' + Pc.toFixed(6) + ' → ' + Pc.toFixed(2) + ' (API ' + c.exp + ')');
  check(ok);
});

/* ========== 二、链条参数探针（calculation_rollerChain2） ========== */
var CH_CASES = [
  { n:'C1 原站默认 08A',        in:{},                                                                                          api:{ chainNoX0:54.74, chainNoX:56, chainLen:0.711, chainSpeed:1.08, centerDistanceMax:129.62, actualCenterDistance:129.1, alpha1:128.18, circularForce:2321.35, pullForceOnShaft:2785.62 } },
  { n:'C2 a0=20（X0=74.57→76）', in:{ a0:'20' },                                                                                 api:{ chainNoX0:74.57, chainNoX:76, chainLen:0.965, chainSpeed:1.08, centerDistanceMax:263.35, actualCenterDistance:262.3, alpha1:154.49, circularForce:2321.35, pullForceOnShaft:2785.62 } },
  { n:'C3 16A z1=21 z2=67',      in:{ a0:'24', z1:'21', z2:'67', chainSize:'16A', n2:'150', power:'7.5', drivenMachine:'中等冲击', drivingMachine:'轻微冲击', deltaA:'0.003', inputFactorF5:'1.1' }, api:{ chainNoX0:94.23, chainNoX:96, chainLen:2.438, chainSpeed:4.25, centerDistanceMax:633.09, actualCenterDistance:631.19, alpha1:146.34, circularForce:1762.84, pullForceOnShaft:2908.68 } },
  { n:'C4 10A z1=25 z2=57',      in:{ a0:'30', z1:'25', z2:'57', chainSize:'10A', n2:'200', power:'5', drivingMachine:'中等冲击', deltaA:'0.002', inputFactorF5:'1.05' }, api:{ chainNoX0:101.86, chainNoX:102, chainLen:1.619, chainSpeed:3.02, centerDistanceMax:477.34, actualCenterDistance:476.39, alpha1:160.59, circularForce:1657.69, pullForceOnShaft:2262.74 } },
  { n:'C5 20A z1=17 z2=100',     in:{ a0:'40', z1:'17', z2:'100', chainSize:'20A', n2:'90', power:'20', drivenMachine:'严重冲击', deltaA:'0.004', inputFactorF5:'1.2' }, api:{ chainNoX0:142.86, chainNoX:144, chainLen:4.572, chainSpeed:4.76, centerDistanceMax:1289.08, actualCenterDistance:1283.93, alpha1:142.71, circularForce:4199.48, pullForceOnShaft:9070.87 } },
  { n:'C6 48A z1=95 z2=110',     in:{ a0:'50', z1:'95', z2:'110', chainSize:'48A', n2:'30', power:'50', deltaA:'0.0035', inputFactorF5:'1.15' }, api:{ chainNoX0:202.61, chainNoX:204, chainLen:15.545, chainSpeed:4.19, centerDistanceMax:3862.87, actualCenterDistance:3849.35, alpha1:174.6, circularForce:11930.33, pullForceOnShaft:13719.88 } }
];
var LABEL = {
  chainNoX0:'链长节数 X0', chainNoX:'实际链长节数 X（向上取偶数）', chainLen:'链条长度 L = X·p',
  chainSpeed:'链速 v = z2·n2·p/60000', centerDistanceMax:'理论中心距 a', actualCenterDistance:'实际中心距 a·(1−Δa)',
  alpha1:'小链轮包角 α1', circularForce:'有效圆周力 F = 1000P/v', pullForceOnShaft:'作用于轴上的拉力 FQ = f5·f1·F'
};
var DEC = { chainNoX0:2, chainNoX:0, chainLen:3, chainSpeed:2, centerDistanceMax:2, actualCenterDistance:2, alpha1:2, circularForce:2, pullForceOnShaft:2 };
console.log('== rollerChain2：九项输出与 API 逐字段对比（按 API 位数四舍五入后相等） ==');
CH_CASES.forEach(function (c) {
  console.log('-- ' + c.n);
  var r = rows(t.compute(mk(c.in)));
  Object.keys(c.api).forEach(function (k) {
    var got = r[LABEL[k]].value;
    var rounded = +got.toFixed(DEC[k]);
    var ok = Math.abs(rounded - c.api[k]) < 1e-9 && Math.abs(got - c.api[k]) <= 0.0050000001;
    console.log((ok ? '  ok  ' : '  FAIL') + ' ' + k + ': got=' + got + ' → ' + rounded + ' (API ' + c.api[k] + ')');
    check(ok);
  });
});

/* ========== 三、联动与边界 ========== */
console.log('== 联动与边界 ==');
var r;

/* E1: a0length 毫米输入优先（254mm/12.7 = 20p，应与 C2 一致） */
r = rows(t.compute(mk({ a0:'', a0length:'254' })));
check(near(r[LABEL.chainNoX0].value, 74.57, 0.005, 'E1 a0length=254mm → X0'));
check(near(r[LABEL.chainNoX].value, 76, 1e-9, 'E1 X'));

/* E2: f2 自动 = (19/z1)^1.08 保留 2 位（z1=25 → 0.74），Pc=1×0.74×2.5 */
r = rows(t.compute(mk({ z1:'25', f2:'' })));
check(near(r['主动链轮齿数系数 f2'].value, 0.74, 1e-9, 'E2 f2 自动(z1=25)'));
check(near(r['设计功率 Pc = f1·f2·P/km'].value, 1.85, 1e-9, 'E2 Pc'));

/* E3: i≥4 时 a0min=0.33·z1·(i−1)；z2、n2、a0 自动 */
r = rows(t.compute(mk({ transmissionRatio:'5', n2:'', a0:'', z2:'' })));
check(near(r['从动轴转速 n2 = n1/i'].value, 53, 1e-9, 'E3 n2=265/5'));
check(near(r['大链轮齿数 z2（=z1·i 圆整）'].value, 95, 1e-9, 'E3 z2=19×5'));
check(near(r['最小中心距 a0min'].value, 0.33 * 19 * 4, 1e-9, 'E3 a0min=0.33·19·4'));
check(near(r['初定中心距 a0'].value, 25.08, 1e-9, 'E3 a0 取 a0min'));

/* E4: 校验报错（z1 超范围 / Δa 超范围 / f5 超范围） */
check(t.compute(mk({ z1:'10' })).error === '请输入17-120之间的数（小链轮齿数 z1）');
console.log('  ok   E4 z1=10 → ' + t.compute(mk({ z1:'10' })).error);
check(t.compute(mk({ deltaA:'0.005' })).error === '请输入0.002-0.004之间的数（Δa）');
console.log('  ok   E4 Δa=0.005 → ' + t.compute(mk({ deltaA:'0.005' })).error);
check(t.compute(mk({ inputFactorF5:'1.3' })).error === '请输入1.05-1.2之间的数（系数 f5）');
console.log('  ok   E4 f5=1.3 → ' + t.compute(mk({ inputFactorF5:'1.3' })).error);

/* E5: 默认整组跑通 + verdict */
var full = t.compute(mk({}));
check(!!full.verdict && full.verdict.level === 'warn' && full.verdict.text.indexOf('a0min') >= 0);
console.log('  ok   E5 默认 verdict(' + full.verdict.level + '): ' + full.verdict.text);

/* E6: B 系列链号节距 */
r = rows(t.compute(mk({ chainSize:'16B', a0:'40' })));
check(near(r['链条节距 p'].value, 25.4, 1e-9, 'E6 16B 节距=25.4'));
r = rows(t.compute(mk({ chainSize:'06B' })));
check(near(r['链条节距 p'].value, 9.525, 1e-9, 'E6 06B 节距=9.525'));

/* E7: f1 全表 9 档覆盖 */
var F1EXP = { '运转平稳|运转平稳':1, '运转平稳|轻微冲击':1.1, '运转平稳|中等冲击':1.3,
  '中等冲击|运转平稳':1.4, '中等冲击|轻微冲击':1.5, '中等冲击|中等冲击':1.7,
  '严重冲击|运转平稳':1.8, '严重冲击|轻微冲击':1.9, '严重冲击|中等冲击':2.1 };
Object.keys(F1EXP).forEach(function (k) {
  var p = k.split('|'); /* p[0]=从动 p[1]=主动 */
  r = rows(t.compute(mk({ drivenMachine:p[0], drivingMachine:p[1] })));
  check(near(r['工况系数 f1（主/从动机工况查表）'].value, F1EXP[k], 1e-12, 'E7 f1 ' + p[1] + '+' + p[0]));
});

/* E8: X0 恰为整数时不再上跳（a0=20,z1=19,z2=48 → X0=74.565→76；构造 X0 偶数整数 a0=47.5,z1=19,z2=48） */
/* 手算：X0=2×47.5+33.5+841/(4π²×47.5)=95+33.5+1.4196=129.92→130（ceil=130 偶数不变） */
r = rows(t.compute(mk({ a0:'47.5' })));
check(near(r[LABEL.chainNoX].value, 130, 1e-9, 'E8 X=130（ceil 后恰为偶数）'));

console.log('\n===== 结果：pass=' + pass + ' fail=' + fail + ' =====');
process.exit(fail ? 1 : 0);
