// 默认用例全链路精确走查 + 与服务端 5 曲线返回值逐一核对
const R3 = v => Math.round(v * 1000) / 1000; // 检查用

const g = 9.807;
const curves = {
  'M.T':   { am: 4.89,  vm: 2,    qm: 1.655 },
  'M.S':   { am: 5.53,  vm: 1.76, qm: 0.987 },
  'M.C.V': { am: 8.01,  vm: 1.28, qm: 0.715 },
  'SMS-3': { am: 4.848, vm: 1.818, qm: 1.178 },
  'SMCV-3':{ am: 6.882, vm: 1.29,  qm: 0.836 },
};
// 默认输入
const S = 6, th = 270, W1 = 11.026, W2 = 3, W3 = 0.25;
const D = 300, De = 200, R = 100, miu = 0.15, fc = 2, eta = 0.6, n = 80, Tw = 0, Tca = 0;

const server = {
  'M.T':   { j1:0.124, j2:0.18, j3:0.015, jT:0.319, alpha:16.184, torqueI:5.163, torqueF:4.491, torqueT:9.654, torqueE:19.308, torqueC:7.101, power:0.099 },
  'M.S':   { j1:0.124, j2:0.18, j3:0.015, jT:0.319, alpha:18.302, torqueI:5.839, torqueF:4.491, torqueT:10.33, torqueE:20.66, torqueC:4.531, power:0.063 },
  'M.C.V': { j1:0.124, j2:0.18, j3:0.015, jT:0.319, alpha:26.51, torqueI:8.458, torqueF:4.491, torqueT:12.948, torqueE:25.897, torqueC:4.115, power:0.057 },
  'SMS-3': { j1:0.124, j2:0.18, j3:0.015, jT:0.319, alpha:16.045, torqueI:5.119, torqueF:4.491, torqueT:9.61, torqueE:19.219, torqueC:5.031, power:0.07 },
  'SMCV-3':{ j1:0.124, j2:0.18, j3:0.015, jT:0.319, alpha:22.777, torqueI:7.267, torqueF:4.491, torqueT:11.757, torqueE:23.515, torqueC:4.369, power:0.061 },
};

// 与输入无关的公共量
const j1 = W1 * D * D / 8 / 1e6;            // = W1*(D/2)^2/2 /1e6
const j2 = S * W2 * (De / 2) ** 2 / 1e6;
const j3 = S * W3 * (De / 2) ** 2 / 1e6;
const jT = j1 + j2 + j3;
const W = W1 + S * W2 + S * W3;
const Tf = miu * W * g * R / 1000;
console.log(`公共: j1=${j1} j2=${j2} j3=${j3} jT=${jT} W=${W} Tf=${Tf}`);

for (const [name, c] of Object.entries(curves)) {
  const alpha = c.am * (2 * Math.PI / S) * (360 * n / (60 * th)) ** 2;
  const Ti = jT * alpha;
  const Tt = Ti + Tf + Tw;
  const Te = fc * Tt;
  const Tc = 360 / (th * S) * c.qm * Te + Tca;
  const P = 2 * Math.PI * n / 60 / eta * Tc / 1000;
  const calc = { j1: R3(j1), j2: R3(j2), j3: R3(j3), jT: R3(jT), alpha: R3(alpha),
                 torqueI: R3(Ti), torqueF: R3(Tf), torqueT: R3(Tt), torqueE: R3(Te),
                 torqueC: R3(Tc), power: R3(P) };
  let ok = true;
  for (const k of Object.keys(calc)) if (calc[k] !== server[name][k]) { ok = false; console.log(`  ✗ ${name}.${k}: calc=${calc[k]} server=${server[name][k]}`); }
  console.log(`${name}: alpha=${alpha} Ti=${Ti} Tt=${Tt} Te=${Te} Tc=${Tc} P=${P}  => ${ok ? '全部 11 项与服务端一致 ✓' : '存在差异'}`);
}
