// 案例时刻：情景与抉择 → 揭晓（你的结果 / 真实历史 / 理论视角）
const T = require('../ui/theme.js');
const F = require('../game/format.js');
const { icon } = require('../ui/icons.js');
const { header, status } = require('./common.js');

function folder(f, eyebrow, title, era) {
  // 档案袋式标题卡
  let y = f.y; const x = f.x; const w = f.w;
  const lines = f.m.wrap(title, T.font(22, 800), w - 40);
  const h = 74 + lines.length * 30;
  f.push({ t: 'rect', x, y: y + 20, w, h, r: 16, fill: '#fef3c7' });
  f.push({ t: 'rect', x: x + 14, y: y, w: 92, h: 30, r: 9, fill: '#fde68a' });
  f.push({ t: 'text', x: x + 60, y: y + 19, s: eyebrow, font: T.font(12, 700), color: '#78350f', align: 'center' });
  y += 6;
  f.push({ t: 'rect', x: x + 20, y: y + 32, w: 4, h: lines.length * 30 + 4, r: 2, fill: '#d97706' });
  lines.forEach((ln, i) => f.push({ t: 'text', x: x + 34, y: y + 56 + i * 30, s: ln, font: T.font(22, 800), color: '#451a03' }));
  f.push({ t: 'text', x: x + 34, y: y + 56 + lines.length * 30 + 4, s: era, font: T.font(12, 600), color: '#92400e' });
  f.y += h + 20 + 6 + 12;
}

function casePage(app) {
  const life = app.life;
  return {
    header: header(app),
    body(f) {
      const v = life.caseView();
      if (!v) return;
      status(f, life, { noAp: true });
      folder(f, v.event ? '突发事件' : (v.future ? '未来推演' : '案例时刻'), v.title, v.era);
      f.card({}, (c) => {
        c.text(v.situation, { size: 15, color: T.c.body, lh: 1.7 });
      });
      // 解决方式：咨询 / 合作 / 推迟
      f.text('先想想怎么解决：', { size: 13, weight: 600, color: T.c.onDarkMuted, lh: 1.8 });
      f.seg([
        { label: v.consulted ? '已咨询 ✓' : `请咨询公司 ${F.usd(v.consultCost, { short: true })}`, on: v.consulted, onTap: () => app.caseMeta('consult'), id: 'meta-consult' },
        { label: v.partnered ? '找伙伴 ✓' : '找伙伴分担', on: v.partnered, onTap: () => app.caseMeta('partner'), id: 'meta-partner' },
        { label: '推迟一年', on: false, onTap: () => (v.canDefer ? app.caseMeta('defer') : app.toast('这件事拖不了，必须现在决定')), id: 'meta-defer' }
      ], { size: 12 });
      f.text(v.partnered ? '和伙伴合作：花费和收获都打五五折，适合没把握的时候。' : '咨询公司会告诉你每个选项各种结果的概率；找伙伴能分摊风险；推迟会让市场观望一年。', { size: 11, color: T.c.onDarkMuted, lh: 1.55 });
      f.gap(4);
      f.text('你怎么选？', { size: 13, weight: 600, color: T.c.onDarkMuted, lh: 1.8 });
      v.options.forEach((o, i) => {
        f.card({ stripe: ['#2563eb', '#7c3aed', '#0d9488', '#ea580c'][i % 4], onTap: () => app.chooseCase(o.id), id: 'case-' + o.id, after: 10 }, (c) => {
          c.text(o.text, { size: 16, weight: 700, color: T.c.ink, lh: 1.45 });
          if (o.hint) c.text(o.hint, { size: 12, color: T.c.muted, lh: 1.5 });
          if (o.odds) c.text(o.odds.map((x) => `${Math.round(x.p * 100)}%「${x.title}」`).join('　'), { size: 12, weight: 600, color: T.c.violet, lh: 1.5 });
        });
      });
    }
  };
}

function revealPage(app) {
  const life = app.life;
  const r = life.s.caseResult;
  return {
    header: header(app),
    body(f) {
      status(f, life, { noAp: true });
      f.card({}, (c) => {
        c.eyebrow(`${r.year} · ${r.title}`);
        c.text(`你选择了：${r.option}`, { size: 13, color: T.c.muted, lh: 1.6 });
        c.gap(6);
        c.card({ bg: T.c.accentSoft, pad: 14, after: 10 }, (k) => {
          k.text(r.outcome, { size: 19, weight: 800, color: T.c.accentDark, lh: 1.4 });
          if (r.outcomeText) k.text(r.outcomeText, { size: 14, color: T.c.body, lh: 1.6 });
        });
        if (Math.abs(r.cashDelta) >= 1) c.row('这次抉择的现金变化', F.usd(r.cashDelta, { sign: true }), { valueColor: r.cashDelta < 0 ? T.c.neg : T.c.pos, size: 13 });
        c.text('部分影响会在之后几年慢慢体现在份额和利润上。', { size: 11, color: T.c.faint, lh: 1.6 });
      });
      if (r.history) f.card({ bg: '#fffbeb' }, (c) => {
        const y = c.y;
        icon(c.push.bind(c), 'book', c.x, y + 1, 18, '#b45309');
        c.text(r.future ? '推演依据' : '真实历史', { size: 14, weight: 700, color: '#92400e', indent: 26, lh: 1.5 });
        c.gap(4);
        c.text(r.history, { size: 14, color: '#451a03', lh: 1.7 });
      });
      if (r.theory) f.card({ bg: '#f5f3ff' }, (c) => {
        const y = c.y;
        icon(c.push.bind(c), 'bulb', c.x, y + 1, 18, '#6d28d9');
        c.text(`理论视角 · ${r.theory.name}`, { size: 14, weight: 700, color: '#5b21b6', indent: 26, lh: 1.5 });
        c.gap(4);
        c.text(r.theory.text, { size: 14, color: '#2e1065', lh: 1.7 });
      });
    },
    footer(f) { f.button('回到棋盘', () => app.closeReveal(), { id: 'reveal-next', after: 0 }); }
  };
}

module.exports = { casePage, revealPage };
