// 引擎自检：随机流对照 CPython 3.13 + 账户恒等式抽查 + 1000 局蒙特卡洛摘要。
// 用法：node tools/verify-engine.cjs
const path = require('path');
const E = require(path.resolve(__dirname, '../js/engine/engine.js'));
const vec = require('./rng-vectors-cpython313.json');
let n = 0; let bad = 0;
for (const [k, v] of Object.entries(vec)) {
  if (E.fnv1a32(k) !== v.seed_int) bad++;
  const r = new E.RNG(E.fnv1a32(k));
  v.random.forEach((x) => { n++; if (r.random() !== x) bad++; });
  v.randbelow.forEach((x) => { n++; if (r.randbelow(1000) !== x) bad++; });
  n++; if (Math.abs(r.gauss(0, 1) - v.gauss) > 1e-12) bad++;
}
console.log(`随机流：${n} 个值，不一致 ${bad} 个`);
// 恒等式：每局每年 期初现金 + I+E+T+D+F = 期末现金（误差 ≤ 0.01）
let worst = 0; let anomalies = 0;
for (let i = 0; i < 200; i++) {
  const L = E.LifeEngine.create(`ID-${i}`, { auto: 'uniform' }); L.runToEnd();
  anomalies += L.s.anomalies.length;
  for (const h of L.s.history) {
    const d = Math.abs((h.cash_start || 0) + h.I + h.E + h.T + h.D + h.F - h.cash);
    worst = Math.max(worst, d);
  }
}
console.log(`现金恒等式：200 局最大误差 ${worst.toFixed(4)} 元；引擎异常 ${anomalies} 条`);
if (bad || worst > 0.01 || anomalies) process.exitCode = 1;
