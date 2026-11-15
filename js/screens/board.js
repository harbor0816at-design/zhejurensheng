// 全球市场棋盘：3×3 国家格子 + 可拖拽的行动块
const T = require('../ui/theme.js');
const F = require('../game/format.js');
const { icon } = require('../ui/icons.js');
const { header, status, tokens } = require('./common.js');
const { D } = require('../game/session.js');

function heat(m) { // 市场规模 → 0..1（对数）
  return Math.max(0.04, Math.min(1, (Math.log10(Math.max(m, 1e7)) - 7) / 4.5));
}

function drawTile(f, life, cid, x, y, w, h, app) {
  const cv = life.countryView(cid);
  const entered = cv.level > 0;
  const push = (c) => f.push(Object.assign({ cy0: y, cy1: y + h }, c));
  push({ t: 'rect', x, y, w, h, r: 14, fill: entered ? '#ffffff' : 'rgba(255,255,255,0.06)', stroke: entered ? null : 'rgba(255,255,255,0.12)' });
  // 国家色条
  push({ t: 'rect', x: x + 10, y: y + 11, w: 4, h: 15, r: 2, fill: cv.color });
  push({ t: 'text', x: x + 19, y: y + 24, s: cv.name, font: T.font(14, 700), color: entered ? T.c.ink : '#e2e8f0' });
  if (cv.isHQ) icon(push, 'hq', x + w - 22, y + 10, 13, '#f59e0b');
  // 增长
  const g = cv.growth;
  const showG = life.s.year > (life.s.startYear || 1995);
  const gc = g >= 0.03 ? T.c.pos : g <= -0.01 ? T.c.neg : (entered ? T.c.muted : T.c.onDarkMuted);
  if (showG) push({ t: 'text', x: x + (cv.isHQ ? w - 26 : w - 10), y: y + 24, s: `${g >= 0 ? '▲' : '▼'}${Math.abs(g * 100).toFixed(0)}%`, font: T.font(11, 600), color: entered ? gc : (g >= 0.03 ? '#4ade80' : g <= -0.01 ? '#f87171' : T.c.onDarkMuted), align: 'right' });
  // 布局图标（三格）
  const icons = life.ind.physical ? ['export', 'branch', 'factory'] : ['online', 'branch', 'datacenter'];
  for (let i = 0; i < 3; i++) {
    const ix = x + 10 + i * 26; const iy = y + 34;
    const on = cv.level > i;
    push({ t: 'rect', x: ix, y: iy, w: 22, h: 22, r: 6, fill: on ? cv.color : (entered ? T.c.soft : 'rgba(255,255,255,0.08)') });
    icon(push, icons[i], ix + 4, iy + 4, 14, on ? '#ffffff' : (entered ? '#cbd5e1' : 'rgba(255,255,255,0.25)'));
  }
  if (cv.campaign) {
    push({ t: 'rect', x: x + w - 30, y: y + 34, w: 22, h: 22, r: 6, fill: '#fff7ed' });
    icon(push, 'campaign', x + w - 26, y + 38, 14, '#ea580c');
  }
  if (entered) {
    push({ t: 'text', x: x + 10, y: y + 76, s: cv.share < 0.00005 ? '刚进入' : `份额 ${F.pct(cv.share, cv.share < 0.01 ? 2 : 1)}`, font: T.font(12, 600), color: T.c.ink });
    if (cv.rev > 0) {
      push({ t: 'text', x: x + 10, y: y + 93, s: `收入 ${F.usd(cv.rev, { short: true })}`, font: T.font(11), color: T.c.muted });
      push({ t: 'text', x: x + 10, y: y + 109, s: `利润 ${F.usd(cv.profit, { short: true, sign: true })}`, font: T.font(11, 600), color: cv.profit < 0 ? T.c.neg : T.c.pos });
    } else push({ t: 'text', x: x + 10, y: y + 93, s: '年底开始有收入', font: T.font(11), color: T.c.muted });
  } else {
    push({ t: 'text', x: x + 10, y: y + 76, s: '未进入', font: T.font(12, 600), color: T.c.onDarkMuted });
    push({ t: 'text', x: x + 10, y: y + 93, s: `市场 ${F.usd(cv.market, { short: true })}`, font: T.font(11), color: T.c.onDarkMuted });
  }
  // 市场热度条
  push({ t: 'rect', x: x + 10, y: y + h - 13, w: w - 20, h: 4, r: 2, fill: entered ? T.c.soft : 'rgba(255,255,255,0.08)' });
  push({ t: 'rect', x: x + 10, y: y + h - 13, w: (w - 20) * heat(cv.market), h: 4, r: 2, fill: cv.color });

  f.hit(x, y, w, h, () => app.openCountry(cid), 'tile-' + cid, {
    r: 14,
    drop: (d) => app.dropToken(d.id, cid),
    accepts: (d) => {
      const chk = life.check(d.id, cid);
      if (!chk.ok) return chk;
      const verb = d.id === 'exit' ? `撤出 ${cv.name}，回收 ${F.usd(-chk.cost)}` : `${d.label} → ${cv.name}，花 ${F.usd(chk.cost)}`;
      return { ok: true, label: verb };
    }
  });
}

function board(app) {
  const life = app.life;
  return {
    header: header(app),
    animate: false,
    body(f) {
      const s = life.s;
      status(f, life);
      // 新闻快讯
      const hl = life.headline();
      if (hl) {
        const y = f.y;
        const lines = f.m.wrap(hl, T.font(13, 500), f.w - 66);
        const h = 16 + Math.min(2, lines.length) * 19;
        f.push({ t: 'rect', x: f.x, y, w: f.w, h, r: 12, fill: 'rgba(250,204,21,0.12)', stroke: 'rgba(250,204,21,0.35)' });
        f.push({ t: 'rect', x: f.x + 8, y: y + 8, w: 38, h: 19, r: 5, fill: '#dc2626' });
        f.push({ t: 'text', x: f.x + 27, y: y + 22, s: String(s.year), font: T.font(11, 700), color: '#fff', align: 'center' });
        lines.slice(0, 2).forEach((ln, i) => f.push({ t: 'text', x: f.x + 54, y: y + 23 + i * 19, s: ln, font: T.font(13, 500), color: '#fef3c7' }));
        f.y += h + 10;
      }
      // 棋盘
      const gap = 8;
      const tw = (f.w - gap * 2) / 3;
      const th = 128;
      const order = ['US', 'UK', 'DE', 'MX', 'CN', 'JP', 'BR', 'IN', 'VN'];
      order.forEach((cid, i) => {
        const col = i % 3; const row = Math.floor(i / 3);
        drawTile(f, life, cid, f.x + col * (tw + gap), f.y + row * (th + gap), tw, th, app);
      });
      f.y += 3 * th + 2 * gap + 10;
      f.text('把下方的行动块拖到国家上；点国家看详情和成本。★ 是总部。', { size: 11, color: T.c.onDarkMuted, align: 'center', lh: 1.6 });
    },
    footer(f) {
      const ts = tokens(life);
      const gap = 6;
      const w = (f.w - gap * (ts.length - 1)) / ts.length;
      const y = f.y; const h = 58;
      ts.forEach((tk, i) => {
        const x = f.x + i * (w + gap);
        const dis = life.s.ap <= 0;
        f.push({ t: 'rect', x, y, w, h, r: 12, fill: dis ? 'rgba(255,255,255,0.06)' : tk.color });
        icon(f.push.bind(f), tk.icon, x + w / 2 - 10, y + 8, 20, dis ? 'rgba(255,255,255,0.3)' : '#ffffff');
        f.push({ t: 'text', x: x + w / 2, y: y + 47, s: tk.label, font: T.font(11, 600), color: dis ? 'rgba(255,255,255,0.35)' : '#fff', align: 'center' });
        f.hit(x, y, w, h, () => app.toast(dis ? '今年的行动点用完了，结束这一年吧' : `按住「${tk.label}」拖到国家上：${tk.desc}`), 'token-' + tk.id, dis ? {} : { r: 12, drag: { id: tk.id, label: tk.label, color: tk.color } });
      });
      f.y += h + 10;
      const bw = (f.w - 8) * 0.36;
      f.button('总部战略', () => app.go('strategy'), { kind: 'dark', w: bw, h: 46, size: 14, inline: true, id: 'strategy' });
      f.button(`结束 ${life.s.year} 年 →`, () => app.endYear(), { x: f.x + bw + 8, w: f.w - bw - 8, h: 46, size: 15, inline: true, id: 'end-year' });
      f.y += 46;
    }
  };
}

module.exports = { board };
