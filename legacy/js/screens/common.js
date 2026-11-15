// 各页面共用的组件：顶栏、状态条
const T = require('../ui/theme.js');
const F = require('../game/format.js');
const S = require('../game/session.js');

// 顶栏：左侧回首页按钮 + 标题；右侧留给微信胶囊
function header(app) {
  return (flow, hdrH, sys) => {
    const mb = sys.menu;
    const cy = mb && mb.top ? (mb.top + mb.bottom) / 2 : sys.statusBar + 22;
    const x = T.side;
    // 回首页按钮
    flow.push({ t: 'rect', x, y: cy - 16, w: 32, h: 32, r: 16, fill: 'rgba(255,255,255,0.10)' });
    for (let i = -1; i <= 1; i++) flow.push({ t: 'rect', x: x + 9, y: cy - 1 + i * 5, w: 14, h: 2, r: 1, fill: '#e2e8f0' });
    flow.hit(x - 6, cy - 22, 44, 44, () => app.goHome(), 'nav-home');
    flow.push({ t: 'text', x: x + 42, y: cy - 1, s: '这局人生', font: T.font(16, 700), color: '#ffffff' });
    const life = app.life;
    if (life) {
      const counts = life.decisionCounts();
      flow.push({ t: 'text', x: x + 42, y: cy + 14, s: `${life.s.seed} · 关键决策 ${counts.optional}`, font: T.font(11), color: T.c.onDarkMuted });
    }
  };
}

// 状态条：年龄 / 现金 / 净资产 / 周期 / 现金跑道
function status(flow, life) {
  const s = life.s;
  const b = S.balance(life);
  const h = 58;
  const y = flow.y;
  const x = flow.x;
  const w = flow.w;
  flow.push({ t: 'rect', x, y, w, h, r: 14, fill: 'rgba(255,255,255,0.07)', stroke: 'rgba(255,255,255,0.10)' });
  flow.push({ t: 'text', x: x + 14, y: y + 37, s: String(s.age), font: T.font(28, 800), color: '#ffffff' });
  const ageW = flow.m.width(String(s.age), T.font(28, 800));
  flow.push({ t: 'text', x: x + 16 + ageW, y: y + 37, s: '岁', font: T.font(12), color: T.c.onDarkMuted });
  const cells = [
    { k: '现金', v: F.money(b.cash), c: b.cash < 0 ? '#fca5a5' : '#ffffff' },
    { k: '净资产', v: F.money(b.net_worth), c: b.net_worth < 0 ? '#fca5a5' : '#ffffff' },
    { k: '周期', v: F.L.cycle[s.macro.cycle], c: '#ffffff', dot: T.c.cycle[s.macro.cycle] },
    { k: '跑道', v: F.runway(b.runway_months).replace(' 个月', '月').replace('10 年以上', '10年+'), c: b.runway_months < 6 ? '#fcd34d' : '#ffffff' }
  ];
  const x0 = x + 30 + ageW + 4;
  const cw = (x + w - 8 - x0) / cells.length;
  cells.forEach((c, i) => {
    const cx = x0 + i * cw;
    flow.push({ t: 'text', x: cx, y: y + 23, s: c.k, font: T.font(11), color: T.c.onDarkMuted });
    let vx = cx;
    if (c.dot) { flow.push({ t: 'circle', x: cx + 4, y: y + 39, r: 4, fill: c.dot }); vx += 12; }
    flow.push({ t: 'text', x: vx, y: y + 44, s: c.v, font: T.font(13, 700), color: c.c });
  });
  flow.y += h + 12;
}

function footnote(flow, text) {
  flow.text(text, { size: 11, color: T.c.onDarkMuted, align: 'center', lh: 1.6 });
}

module.exports = { header, status, footnote };
