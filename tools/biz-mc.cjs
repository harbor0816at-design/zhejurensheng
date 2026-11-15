// 全球商业版蒙特卡洛：多种自动策略打 N 局，看估值、重组率、结局分布、现金恒等式。
// 用法：node tools/biz-mc.cjs [局数]
const path = require('path');
const { BizLife, D } = require(path.resolve(__dirname, '../js/biz/engine.js'));
const N = +process.argv[2] || 600;

const POLICIES = {
  // 稳扎稳打：先做强本土，再进大市场，低成本国建厂
  steady(L, rnd) {
    const s = L.s;
    L.setRnd('mid'); L.setPrice('mid');
    const tries = [];
    const byMarket = D.COUNTRIES.map((c) => c.id).sort((a, b) => L.market(b, s.year) * L.access(b, s.year) - L.market(a, s.year) * L.access(a, s.year));
    for (const c of byMarket) tries.push(['export', c], ['branch', c]);
    if (L.ind.physical) for (const c of ['VN', 'CN', 'MX', 'IN']) tries.push(['factory', c]);
    for (const [t, c] of tries) { if (s.ap <= 0) break; if (s.cash > L.check(t, c).cost * 1.5) L.place(t, c); }
  },
  // 激进扩张：能升级就升级，高研发，大量营销
  aggressive(L, rnd) {
    const s = L.s;
    L.setRnd('high'); L.setPrice(rnd() < 0.5 ? 'low' : 'mid');
    const ids = D.COUNTRIES.map((c) => c.id).sort(() => rnd() - 0.5);
    for (const c of ids) { if (s.ap <= 0) break; for (const t of ['factory', 'branch', 'export', 'campaign']) if (L.check(t, c).ok) { L.place(t, c); break; } }
    if (s.ap > 0) L.borrow(5e6);
  },
  // 随机玩家
  random(L, rnd) {
    const s = L.s;
    L.setRnd(['low', 'mid', 'high'][Math.floor(rnd() * 3)]); L.setPrice(['low', 'mid', 'premium'][Math.floor(rnd() * 3)]);
    for (let k = 0; k < 6 && s.ap > 0; k++) {
      const t = ['export', 'branch', 'factory', 'campaign', 'exit'][Math.floor(rnd() * (k < 5 ? 4 : 5))];
      const c = D.COUNTRIES[Math.floor(rnd() * 9)].id;
      if (L.check(t, c).ok) L.place(t, c);
    }
  },
  // 只守本土
  passive(L) { L.setRnd('mid'); }
};

function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const res = {};
let worst = 0;
for (const pol of Object.keys(POLICIES)) {
  const vals = []; let restr = 0; const ends = {}; let cases = 0;
  const byInd = {}; const byFd = {}; const byY = {}; let evs = 0;
  for (let i = 0; i < N; i++) {
    const rnd = mulberry(i * 7919 + pol.length);
    const ind = D.INDUSTRIES[i % D.INDUSTRIES.length].id;
    const hq = D.COUNTRIES[Math.floor(i / 5) % 9].id;
    const founder = D.FOUNDERS[Math.floor(i / 45) % D.FOUNDERS.length].id;
    const startYear = D.START_YEARS[Math.floor(i / 7) % 3].year;
    const L = BizLife.create(`MC-${pol}-${i}`, { industry: ind, hq, founder, startYear });
    let guard = 0;
    while (!L.s.ended && guard++ < 60) {
      if (L.s.caseId) { const v = L.caseView(); L.chooseCase(v.options[Math.floor(rnd() * v.options.length)].id); }
      POLICIES[pol](L, rnd);
      L.endYear();
      worst = Math.max(worst, Math.abs(L.s.report.check));
    }
    vals.push(L.s.valuation); if (L.s.restructures) restr++;
    cases += L.s.caseLog.length; evs += L.s.caseLog.filter((c) => c.event).length;
    (byFd[founder] = byFd[founder] || []).push(L.s.valuation); (byY[startYear] = byY[startYear] || []).push(L.s.valuation);
    const p = L.s.endings[0].name; ends[p] = (ends[p] || 0) + 1;
    (byInd[ind] = byInd[ind] || []).push(L.s.valuation);
  }
  const q = (a, p) => { const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(p * b.length))]; };
  const fmt = (v) => (v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : (v / 1e6).toFixed(0) + 'M');
  console.log(`\n== ${pol}  估值 P10/P50/P90/max = ${fmt(q(vals, 0.1))} / ${fmt(q(vals, 0.5))} / ${fmt(q(vals, 0.9))} / ${fmt(Math.max(...vals))}  重组 ${(restr / N * 100).toFixed(1)}%  每局案例 ${(cases / N).toFixed(1)}`);
  console.log(`   每局随机事件 ${(evs / N).toFixed(1)}`);
  console.log('   分出身 P50：' + Object.entries(byFd).map(([k, v]) => `${k} ${fmt(q(v, 0.5))}`).join('  '));
  console.log('   分年代 P50：' + Object.entries(byY).map(([k, v]) => `${k} ${fmt(q(v, 0.5))}`).join('  '));
  console.log('   分行业 P50：' + Object.entries(byInd).map(([k, v]) => `${k} ${fmt(q(v, 0.5))}`).join('  '));
  console.log('   结局：' + Object.entries(ends).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / N * 100).toFixed(0)}%`).join(' | '));
}
console.log(`\n现金恒等式最大误差：${worst.toFixed(4)} 美元`);
