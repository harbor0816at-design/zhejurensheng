// 自动建城：用一个简单的“网格规划”策略玩城市模式，检查人口增长和财政是否合理。
// 用法：node tools/city-auto.cjs [sandbox|shenzhen] [种子]
const path = require('path');
const { CitySim, N, K, idx } = require(path.resolve(__dirname, '../js/city/sim.js'));
const arg = process.argv[2] || 'river';
const { SC, M } = require(path.resolve(__dirname, '../js/city/sim.js'));
const isSc = SC.SCENARIOS.some((x) => x.id === arg);
const mode = isSc ? 'shenzhen' : 'sandbox';
const sim = isSc ? CitySim.create({ mode: 'scenario', scenario: arg }) : CitySim.create({ mode: 'sandbox', map: arg, seed: process.argv[3] || 'AUTO-1', challenges: (process.argv[4] || '').split(',').filter(Boolean) });
const s = sim.s;
const free = (x, y) => x >= 0 && y >= 0 && x < N && y < N && s.kind[idx(x, y)] === K.NONE && s.ter[idx(x, y)] !== 1 && s.ter[idx(x, y)] !== 4;
// 规划：每 5 格一条路的网格，逐步向外扩
const cx = s.focus ? s.focus[0] : 16; const cy = s.focus ? s.focus[1] : 16;
let ring = 0;
function expand() {
  ring++;
  const r = ring * 5;
  const cells = [];
  for (let k = -r; k <= r; k++) for (const [x, y] of [[cx + k, cy - r], [cx + k, cy + r], [cx - r, cy + k], [cx + r, cy + k]]) cells.push([x, y]);
  for (let g = -r; g <= r; g += 5) for (let k = -r; k <= r; k++) { cells.push([cx + g, cy + k]); cells.push([cx + k, cy + g]); }
  sim.build('road', cells.filter(([x, y]) => x >= 0 && y >= 0 && x < N && y < N));
  // 分区：离中心近住宅/商业，外圈工业
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    if (!free(x, y) || !sim.adjRoad(x, y, 2)) continue;
    const dd = Math.max(Math.abs(x - cx), Math.abs(y - cy));
    const side = Math.abs(x - cx) > r - 3 && (y - cy) > -2; // 两侧下方划工业，和住宅隔开
    const z = side ? 'I' : ((x * 7 + y * 3) % 5 === 0 ? 'C' : 'R');
    if (s.money > 3000) sim.build(z, [[x, y]]);
  }
}
function placeSvc(tool, far) {
  const order = []; for (let r = 1; r < N; r++) order.push(r); if (far) order.reverse();
  for (const r of order) for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) !== r) continue;
    const i = x >= 0 && y >= 0 && x < N && y < N ? idx(x, y) : -1;
    if (i < 0) continue;
    if ((s.kind[i] === K.NONE || (s.kind[i] >= K.R && s.kind[i] <= K.I && s.lv[i] === 0)) && s.ter[i] !== 1 && sim.adjRoad(x, y, 1)) { const res = sim.build(tool, [[x, y]]); if (res.ok) return true; }
  }
  return false;
}
expand(); placeSvc('power', true); placeSvc('water', true);
const years = isSc ? (sim.s.endYear - sim.s.startYear + 1) : 30;
for (let m = 0; m < years * 12 && !s.ended; m++) {
  const st = sim.st;
  if (st.powerUse > st.powerCap * 0.8 && s.money > 7000) placeSvc('power', true);
  if (st.waterUse > st.waterCap * 0.8 && s.money > 5000) placeSvc('water', true);
  if (m % 12 === 0) {
    // 只在住宅还没被覆盖时才盖对应设施
    const KMAP = { fire: K.FIRE, police: K.POLICE, clinic: K.CLINIC, school: K.SCHOOL, park: K.PARK, metro: K.METRO };
    for (const t of ['fire', 'police', 'clinic', 'school', 'park', 'metro']) {
      if (!sim.unlockedTool(t).ok || s.money < 8000) continue;
      let unc = 0; let tot = 0;
      for (let i = 0; i < N * N; i++) if (s.kind[i] === K.R && s.lv[i] > 0) { tot++; if (!sim.d.cov[KMAP[t]][i]) unc++; }
      if (tot && unc / tot > 0.35) placeSvc(t);
    }
    const zones = s.kind.filter((k) => k >= K.R && k <= K.I).length;
    const empty = s.kind.filter((k, i) => k >= K.R && k <= K.I && s.lv[i] === 0).length;
    if (empty < zones * 0.2 && s.money > 6000 && ring < (process.env.RINGS ? +process.env.RINGS : 4)) expand();
  }
  sim.step(); if (s.pendingEvent) s.pendingEvent = null;
  if (m % 24 === 23 || s.ended) {
    const st2 = sim.st;
    console.log(`${sim.year}  人口 ${st2.pop}  岗位 C${st2.jobsC}/I${st2.jobsI}  钱 ${Math.round(s.money)}  收 ${st2.income} 支 ${st2.upkeep}  需求 R${st2.dem.R.toFixed(2)} C${st2.dem.C.toFixed(2)} I${st2.dem.I.toFixed(2)}  ${st2.title}  贷款${s.loans}  地价${st2.happy}`);
  }
}
if (isSc) { const r = sim.result(); console.log('目标', r.stars + '/' + r.total, JSON.stringify(r.goals.map((g) => g.text + (g.met ? ' ✓' : ' ✗')))); }
const lv = [0, 0, 0, 0, 0]; s.lv.forEach((l, i) => { if (s.kind[i] >= K.R && s.kind[i] <= K.I) lv[l]++; });
console.log('楼层分布 0-4：', lv.join(' / '));
