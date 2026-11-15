// 共用：顶栏、状态条、行动块定义
const T = require('../ui/theme.js');
const F = require('../game/format.js');

function header(app, title) {
  return (flow, hdrH, sys) => {
    const mb = sys.menu;
    const cy = mb && mb.top ? (mb.top + mb.bottom) / 2 : sys.statusBar + 22;
    const x = T.side;
    flow.push({ t: 'rect', x, y: cy - 16, w: 32, h: 32, r: 16, fill: 'rgba(255,255,255,0.10)' });
    for (let i = -1; i <= 1; i++) flow.push({ t: 'rect', x: x + 9, y: cy - 1 + i * 5, w: 14, h: 2, r: 1, fill: '#e2e8f0' });
    flow.hit(x - 6, cy - 22, 44, 44, () => app.goHome(), 'nav-home');
    const life = app.life;
    flow.push({ t: 'text', x: x + 42, y: cy - 1, s: title || (life ? life.s.name : '这局人生'), font: T.font(16, 700), color: '#ffffff' });
    if (life) flow.push({ t: 'text', x: x + 42, y: cy + 14, s: `${life.ind.name} · 种子 ${life.s.seed}`, font: T.font(11), color: T.c.onDarkMuted });
  };
}

// 状态条：年份 / 现金 / 估值 / 负债 / 行动点
function status(flow, life, o) {
  o = o || {};
  const s = life.s;
  const h = 60;
  const y = flow.y; const x = flow.x; const w = flow.w;
  flow.push({ t: 'rect', x, y, w, h, r: 14, fill: 'rgba(255,255,255,0.07)', stroke: 'rgba(255,255,255,0.10)' });
  const yr = String(o.year || s.year);
  flow.push({ t: 'text', x: x + 12, y: y + 30, s: yr, font: T.font(24, 800), color: '#ffffff' });
  const yw = flow.m.width(yr, T.font(24, 800));
  // 行动点
  if (!o.noAp) {
    for (let i = 0; i < s.apMax; i++) flow.push({ t: 'circle', x: x + 16 + i * 13, y: y + 46, r: 4.5, fill: i < s.ap ? '#fbbf24' : 'rgba(255,255,255,0.18)' });
  }
  const cells = [
    { k: '现金', v: F.usd(s.cash, { short: true }), c: s.cash < 1e6 ? '#fcd34d' : '#fff' },
    { k: '估值', v: F.usd(s.valuation, { short: true }), c: '#fff' },
    { k: '负债', v: s.debt > 0 ? F.usd(s.debt, { short: true }) : '0', c: s.debt > 0 ? '#fca5a5' : '#fff' }
  ];
  const x0 = x + Math.max(yw, 3 * 13 + 8) + 22;
  const cw = (x + w - 8 - x0) / cells.length;
  cells.forEach((c, i) => {
    const cx = x0 + i * cw;
    flow.push({ t: 'text', x: cx, y: y + 24, s: c.k, font: T.font(11), color: T.c.onDarkMuted });
    flow.push({ t: 'text', x: cx, y: y + 45, s: c.v, font: T.font(14, 700), color: c.c });
  });
  flow.y += h + 10;
}

// 行动块
function tokens(life) {
  const sw = !life.ind.physical;
  return [
    { id: 'export', label: sw ? '线上销售' : '出口', icon: sw ? 'online' : 'export', color: '#0ea5e9', desc: '进入一个新国家' },
    { id: 'branch', label: '分公司', icon: 'branch', color: '#2563eb', desc: '本地团队，份额和品牌涨得快' },
    { id: 'factory', label: sw ? '数据中心' : '工厂', icon: sw ? 'datacenter' : 'factory', color: '#7c3aed', desc: sw ? '本地数据，合规加分' : '本地生产，省关税和人工' },
    { id: 'campaign', label: '营销', icon: 'campaign', color: '#ea580c', desc: '当年品牌和吸引力大涨' },
    { id: 'exit', label: '撤出', icon: 'exit', color: '#475569', desc: '降一级，回收三成投入' }
  ];
}

module.exports = { header, status, tokens };
