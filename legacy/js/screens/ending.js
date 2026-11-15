// 结局页：称号、净资产曲线、关键决策、转折点、策略分 / 结果分、完整复盘、分享
const T = require('../ui/theme.js');
const F = require('../game/format.js');
const S = require('../game/session.js');
const { header } = require('./common.js');

function drawCurve(c, s) {
  const pts = S.curve(s);
  if (pts.length < 2) return;
  c.custom(150, (push, x, y, w, h) => {
    const pad = 8;
    const vals = pts.map((p) => p.real);
    const lo = Math.min(0, ...vals);
    const hi = Math.max(1, ...vals);
    const X = (i) => x + pad + (i / (pts.length - 1)) * (w - pad * 2);
    const Y = (v) => y + h - 22 - ((v - lo) / (hi - lo)) * (h - 44);
    push({ t: 'rect', x, y, w, h, r: 10, fill: T.c.soft });
    push({ t: 'line', x1: x + pad, y1: Y(0), x2: x + w - pad, y2: Y(0), color: '#cbd5e1', lw: 1, dash: [3, 3] });
    const line = pts.map((p, i) => [X(i), Y(p.real)]);
    push({ t: 'poly', pts: [[X(0), Y(lo)]].concat(line, [[X(pts.length - 1), Y(lo)]]), fill: 'rgba(37,99,235,0.10)' });
    push({ t: 'poly', pts: line, color: T.c.accent, lw: 2 });
    pts.forEach((p, i) => {
      if (p.bankrupt) push({ t: 'circle', x: X(i), y: Y(p.real), r: 4, fill: T.c.neg });
      else if (p.crunch) push({ t: 'circle', x: X(i), y: Y(p.real), r: 3, fill: T.c.warn });
    });
    push({ t: 'text', x: x + pad, y: y + 16, s: F.money(hi), font: T.font(10), color: T.c.muted });
    push({ t: 'text', x: x + pad, y: y + h - 6, s: `${pts[0].age} 岁`, font: T.font(10), color: T.c.muted });
    push({ t: 'text', x: x + w - pad, y: y + h - 6, s: `${pts[pts.length - 1].age} 岁`, font: T.font(10), color: T.c.muted, align: 'right' });
  });
  c.gap(8);
}

function ending(app) {
  const life = app.life;
  const s = life.s;
  const primary = s.endings.find((e) => e.role === 'primary');
  const secondary = s.endings.filter((e) => e.role === 'secondary');
  const early = s.flags.early_tag;
  const strat = s.strategy || {};
  const res = s.result || {};
  const common = (S.rules.endings && S.rules.endings.card_common) || {};

  return {
    header: header(app),
    body(f) {
      // 称号卡
      f.card({ pad: 20 }, (c) => {
        if (early) c.card({ bg: T.c.warnSoft, pad: 10, after: 10 }, (k) => k.text(`${early.name} · ${early.comment}`, { size: 12, color: '#92400e', lh: 1.5 }));
        c.text('这一局的称号', { size: 12, weight: 600, color: T.c.accent, align: 'center', lh: 1.6 });
        c.text(primary ? primary.name : '', { size: 34, weight: 800, color: '#1e1b4b', align: 'center', lh: 1.35 });
        if (secondary.length) c.text(secondary.map((e) => e.name).join(' · '), { size: 15, weight: 600, color: T.c.violet, align: 'center', lh: 1.6 });
        c.gap(10);
        c.card({ bg: T.c.violetSoft, pad: 12, after: 12 }, (k) => k.text(s.ending_comment, { size: 15, color: T.c.body, lh: 1.7 }));
        c.tiles([
          { k: '种子码', v: s.seed },
          { k: '结束年龄', v: `${s.age} 岁` },
          { k: '最终净资产', v: F.money(s.net_worth), color: s.net_worth < 0 ? T.c.neg : T.c.ink },
          { k: '按 18 岁物价', v: F.money(s.net_worth / s.macro.price_level) }
        ], 2, { after: 0 });
      });

      f.card({}, (c) => {
        c.sectionTitle('一生净资产曲线', '按 18 岁物价；红点=重组，橙点=现金告急');
        drawCurve(c, s);
        c.sectionTitle('关键决策');
        S.keyDecisions(s, 3).forEach((d, i) => {
          c.text(`${i + 1}. ${d.age} 岁 · ${d.title}`, { size: 14, weight: 700, color: T.c.ink, lh: 1.5 });
          c.text(`${d.option} → ${d.outcome}（净资产 ${F.money(d.nw_delta, { sign: true })}）`, { size: 13, color: T.c.body, lh: 1.55 });
          c.gap(4);
        });
      });

      f.card({}, (c) => {
        c.sectionTitle('转折点');
        s.turning_points.slice(0, 10).forEach((p) => {
          const y = c.y;
          c.push({ t: 'text', x: c.x, y: y + 15, s: String(p.age), font: T.font(13, 700), color: T.c.accent });
          c.text(p.text, { size: 13, color: T.c.body, indent: 30, lh: 1.6 });
        });
        c.sectionTitle('策略分', '只看决策时已知的信息，不看事后输赢');
        c.tiles([{ k: '总分', v: strat.total !== undefined ? String(strat.total) : '—', bg: T.c.accentSoft }]
          .concat(Object.entries(F.L.strategy).map(([k, n]) => ({ k: n, v: strat[k] !== undefined ? String(strat[k]) : '—' }))), 3, { valueSize: 18 });
        c.sectionTitle('结果维度');
        c.tiles(Object.entries(F.L.result).map(([k, n]) => ({ k: n, v: res[k] !== undefined ? String(res[k]) : '—' })), 3, { valueSize: 18, after: 0 });
      });

      // 完整复盘（激励视频解锁；没配广告时直接展开）
      f.card({}, (c) => {
        c.sectionTitle('完整复盘', '每一个决策和它的结果');
        if (!app.reviewUnlocked) {
          c.text(`本局共 ${s.decisions.filter((d) => d.counted !== false).length} 个关键决策。逐条看当时的选项、结果和对净资产的影响。`, { size: 13, color: T.c.muted, lh: 1.6 });
          c.gap(4);
          c.button(app.adsOn ? '看一段视频，解锁完整复盘' : '展开完整复盘', () => app.unlockReview(), { kind: 'secondary', h: 42, size: 14, after: 0, id: 'unlock-review' });
          return;
        }
        s.decisions.forEach((d) => {
          const cnt = d.counted !== false;
          c.text(`${d.age} 岁 · ${d.title}${cnt ? '' : '（事件）'}`, { size: 13, weight: 700, color: T.c.ink, lh: 1.5 });
          c.text(`${d.option_text} → ${d.outcome_title}`, { size: 12, color: T.c.body, lh: 1.5 });
          c.text(`现金 ${F.money(d.result_delta.cash, { sign: true })} · 净资产 ${F.money(d.result_delta.nw, { sign: true })}${d.intel_bought && d.intel_bought.length ? ` · 买了 ${d.intel_bought.length} 份情报` : ''}`, { size: 11, color: (d.result_delta.nw || 0) < 0 ? T.c.neg : T.c.pos, lh: 1.5 });
          c.divider(4);
        });
      });

      f.card({}, (c) => {
        const line = String(common.share_line || '').replace('{main_title}', primary ? primary.name : '').replace('{seed}', s.seed);
        if (line) c.text(line, { size: 13, color: T.c.body, lh: 1.6 });
        c.gap(6);
        c.button('分享给好友，用同一个种子挑战', () => app.share(), { id: 'share' });
        c.buttons([
          { label: '同种子再来', kind: 'secondary', onTap: () => app.restart(true), id: 'restart-same' },
          { label: '新种子再来', kind: 'secondary', onTap: () => app.restart(false), id: 'restart-new' }
        ], { h: 44, size: 14 });
        c.button('回到首页', () => app.goHome(), { kind: 'link', h: 34, size: 13, after: 0, id: 'home' });
      });
      f.text(common.disclaimer || '游戏虚拟数值，不构成投资建议。', { size: 11, color: T.c.onDarkMuted, align: 'center', lh: 1.6 });
    }
  };
}

module.exports = { ending };
