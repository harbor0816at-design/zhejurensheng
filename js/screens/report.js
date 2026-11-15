// 年报：关键数字、利润瀑布图、各国收入；结局页
const T = require('../ui/theme.js');
const F = require('../game/format.js');
const { header, status } = require('./common.js');
const { D } = require('../game/session.js');

function waterfall(c, r) {
  const steps = [
    { k: '收入', v: r.revenue, total: true },
    { k: '成本', v: -r.cogs },
    { k: '渠道', v: -r.sell },
    { k: '运营', v: -r.fixed },
    { k: '研发', v: -r.rnd },
    { k: '总部', v: -r.hq },
    { k: '营销', v: -r.campaign },
    { k: '利息', v: -r.interest },
    { k: '税', v: -r.tax },
    { k: '净利', v: r.net, total: true }
  ].filter((s) => s.total || Math.abs(s.v) > Math.max(1, r.revenue * 0.002));
  const H = 150;
  c.custom(H + 34, (push, x, y, w) => {
    let run = 0; let lo = 0; let hi = r.revenue;
    steps.forEach((s) => { if (!s.total) { run += s.v; lo = Math.min(lo, r.revenue + run); } });
    lo = Math.min(lo, r.net, 0); hi = Math.max(hi, 1);
    const Y = (v) => y + 8 + (hi - v) / (hi - lo) * H;
    const n = steps.length;
    const bw = (w - (n - 1) * 4) / n;
    let level = 0;
    push({ t: 'line', x1: x, y1: Y(0), x2: x + w, y2: Y(0), color: '#cbd5e1', lw: 1 });
    steps.forEach((s, i) => {
      const bx = x + i * (bw + 4);
      let a; let b; let color;
      if (s.total) { a = 0; b = s.v; color = s.k === '收入' ? T.c.accent : (s.v >= 0 ? T.c.pos : T.c.neg); level = s.k === '收入' ? s.v : level; } else { a = level; b = level + s.v; level = b; color = '#f87171'; }
      const top = Y(Math.max(a, b)); const bot = Y(Math.min(a, b));
      push({ t: 'rect', x: bx, y: top, w: bw, h: Math.max(2, bot - top), r: 3, fill: color });
      push({ t: 'text', x: bx + bw / 2, y: y + H + 28, s: s.k, font: T.font(10), color: T.c.muted, align: 'center' });
    });
  });
}

function reportPage(app) {
  const life = app.life;
  const r = life.s.report;
  const prev = life.s.history[life.s.history.length - 2];
  return {
    header: header(app),
    body(f) {
      status(f, life, { noAp: true, year: r.year });
      f.card({}, (c) => {
        c.eyebrow(`${r.year} 年报`);
        c.title(r.net >= 0 ? `赚了 ${F.usd(r.net)}` : `亏了 ${F.usd(-r.net)}`, { size: 22, color: r.net >= 0 ? T.c.pos : T.c.neg });
        if (r.headline) c.text(r.headline, { size: 12, color: T.c.muted, lh: 1.55 });
        c.gap(8);
        const dv = prev ? r.valuation - prev.valuation : 0;
        c.tiles([
          { k: '收入', v: F.usd(r.revenue) },
          { k: '净利润', v: F.usd(r.net, { sign: true }), color: r.net < 0 ? T.c.neg : T.c.pos },
          { k: '年末现金', v: F.usd(r.cashEnd), color: r.cashEnd < 1e6 ? T.c.warn : T.c.ink },
          { k: '估值', v: `${F.usd(r.valuation)}${prev ? (dv >= 0 ? ' ▲' : ' ▼') : ''}`, color: dv < 0 ? T.c.neg : T.c.ink }
        ], 2, { valueSize: 15 });
        if (r.revenue > 0) { c.sectionTitle('钱是怎么花掉的'); waterfall(c, r); }
        if (r.restructured) {
          c.gap(8);
          c.card({ bg: T.c.negSoft, pad: 12, after: 0 }, (k) => {
            k.text('现金断了，公司进入重组', { size: 14, weight: 700, color: T.c.neg, lh: 1.5 });
            const sold = r.restructured.sold.map((id) => life.countryView(id).name).join('、');
            k.text(`${sold ? `收缩了${sold}的业务；` : ''}新股东注资 ${F.usd(r.restructured.injected)}，债权人减免 ${F.usd(r.restructured.haircut)}。你的持股被稀释，但公司还在。`, { size: 12, color: T.c.body, lh: 1.55 });
          });
        }
      });
      // 各国收入
      const rows = D.COUNTRIES.map((cc) => ({ id: cc.id, name: cc.name, color: cc.color, ...r.rows[cc.id] })).filter((x) => x.rev > 0).sort((a, b) => b.rev - a.rev);
      if (rows.length) {
        f.card({}, (c) => {
          c.sectionTitle('各国收入与利润');
          const max = rows[0].rev;
          rows.forEach((x) => {
            const y = c.y;
            c.push({ t: 'text', x: c.x, y: y + 15, s: x.name, font: T.font(13, 600), color: T.c.ink });
            c.push({ t: 'rect', x: c.x + 52, y: y + 6, w: Math.max(3, (c.w - 150) * x.rev / max), h: 12, r: 4, fill: x.color });
            c.push({ t: 'text', x: c.x + c.w - 54, y: y + 16, s: F.usd(x.rev, { short: true }), font: T.font(12), color: T.c.body, align: 'right' });
            c.push({ t: 'text', x: c.x + c.w, y: y + 16, s: F.usd(x.profit, { short: true, sign: true }), font: T.font(12, 600), color: x.profit < 0 ? T.c.neg : T.c.pos, align: 'right' });
            c.y += 24;
          });
        });
      }
    },
    footer(f) {
      f.button(life.s.ended ? '看结局 →' : `进入 ${life.s.year} 年 →`, () => app.closeReport(), { id: 'report-next', after: 0 });
    }
  };
}

function curve(c, life) {
  const h = life.s.history;
  if (h.length < 2) return;
  c.custom(150, (push, x, y, w, H) => {
    const vals = h.map((p) => p.valuation);
    const hi = Math.max(...vals, 1);
    const X = (i) => x + 8 + i / (h.length - 1) * (w - 16);
    const Y = (v) => y + H - 24 - v / hi * (H - 44);
    push({ t: 'rect', x, y, w, h: H, r: 10, fill: T.c.soft });
    const pts = h.map((p, i) => [X(i), Y(p.valuation)]);
    push({ t: 'poly', pts: [[X(0), Y(0)]].concat(pts, [[X(h.length - 1), Y(0)]]), fill: 'rgba(37,99,235,0.12)' });
    push({ t: 'poly', pts, color: T.c.accent, lw: 2 });
    h.forEach((p, i) => { if (p.restructured) push({ t: 'circle', x: X(i), y: Y(p.valuation), r: 4, fill: T.c.neg }); });
    life.s.caseLog.forEach((cs) => { const i = cs.year - h[0].year; if (i >= 0 && i < h.length) push({ t: 'circle', x: X(i), y: Y(h[i].valuation), r: 3.5, fill: '#f59e0b' }); });
    push({ t: 'text', x: x + 8, y: y + 16, s: F.usd(hi, { short: true }), font: T.font(10), color: T.c.muted });
    push({ t: 'text', x: x + 8, y: y + H - 6, s: String(h[0].year), font: T.font(10), color: T.c.muted });
    push({ t: 'text', x: x + w - 8, y: y + H - 6, s: String(h[h.length - 1].year), font: T.font(10), color: T.c.muted, align: 'right' });
  });
  c.gap(8);
}

function endingPage(app) {
  const life = app.life;
  const s = life.s;
  const primary = s.endings.find((e) => e.role === 'primary');
  const secondary = s.endings.filter((e) => e.role === 'secondary');
  return {
    header: header(app),
    body(f) {
      f.card({ pad: 20 }, (c) => {
        c.text(`${s.name} · ${s.startYear || 1995}–2024`, { size: 12, weight: 600, color: T.c.accent, align: 'center', lh: 1.6 });
        c.text(primary.name, { size: 34, weight: 800, color: '#1e1b4b', align: 'center', lh: 1.35 });
        if (secondary.length) c.text(secondary.map((e) => e.name).join(' · '), { size: 15, weight: 600, color: T.c.violet, align: 'center', lh: 1.6 });
        c.text(primary.text, { size: 14, color: T.c.body, align: 'center', lh: 1.6 });
        c.gap(10);
        const last = s.history[s.history.length - 1];
        c.tiles([
          { k: '企业估值', v: F.usd(s.valuation) },
          { k: '你的持股价值', v: F.usd(s.valuation * s.ownership) },
          { k: '2024 年收入', v: F.usd(last.revenue) },
          { k: '进入国家', v: `${Object.values(s.countries).filter((x) => x.level > 0).length} 个` }
        ], 2, { after: 0 });
      });
      f.card({}, (c) => {
        c.sectionTitle(`${2025 - (s.startYear || 1995)} 年估值曲线`, '橙点 = 案例时刻，红点 = 重组');
        curve(c, life);
        c.sectionTitle('最终布局');
        const lv = life.ind.physical ? ['—', '出口', '分公司', '工厂'] : ['—', '线上', '分公司', '数据中心'];
        c.tiles(D.COUNTRIES.map((cc) => ({ k: cc.name, v: lv[s.countries[cc.id].level], color: s.countries[cc.id].level ? cc.color : T.c.faint })), 3, { valueSize: 13, after: 0 });
      });
      f.card({}, (c) => {
        c.sectionTitle('案例复盘', '你的选择和历史对照');
        s.caseLog.forEach((cs) => {
          c.text(`${cs.year} · ${cs.title}`, { size: 14, weight: 700, color: T.c.ink, lh: 1.5 });
          c.text(`你：${cs.option} → ${cs.outcome}`, { size: 12, color: T.c.body, lh: 1.5 });
          if (cs.theory) c.text(`${cs.event ? '突发事件 · ' : '理论：'}${cs.theory.name}`, { size: 12, color: T.c.violet, lh: 1.5 });
          else if (cs.event) c.text('突发事件', { size: 12, color: T.c.muted, lh: 1.5 });
          c.divider(5);
        });
      });
      f.card({}, (c) => {
        c.button('分享给好友，用同一个种子比一比', () => app.share(), { id: 'share' });
        c.buttons([
          { label: '同种子再来', kind: 'secondary', onTap: () => app.restart(true), id: 'restart-same' },
          { label: '换个种子', kind: 'secondary', onTap: () => app.restart(false), id: 'restart-new' }
        ], { h: 44, size: 14 });
        c.button('回到首页', () => app.goHome(), { kind: 'link', h: 34, size: 13, after: 0, id: 'home' });
      });
      f.text('历史事件按公开资料改写；市场数据为游戏示意值，不构成投资建议。', { size: 11, color: T.c.onDarkMuted, align: 'center', lh: 1.6 });
    }
  };
}

module.exports = { reportPage, endingPage };
