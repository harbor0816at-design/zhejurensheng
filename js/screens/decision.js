// 决策卡（五段式：识别 / 搜集信息 / 评估 / 选择）和结果卡（复盘）
const T = require('../ui/theme.js');
const F = require('../game/format.js');
const { header, status } = require('./common.js');

function decision(app) {
  const life = app.life;
  return {
    header: header(app),
    body(f) {
      const v = life.view();
      if (!v) return;
      status(f, life);
      f.card({ stripe: v.crisis ? T.c.neg : (v.counts ? T.c.accent : T.c.faint) }, (c) => {
        const tag = v.crisis ? '⚠ 危机处理' : v.counts ? '关键决策' : '事件';
        c.eyebrow(v.pending_count > 1 ? `${tag} · 本年还有 ${v.pending_count - 1} 个` : tag, v.crisis ? T.c.neg : T.c.accent);
        c.title(v.title, { size: 20 });
        c.gap(4);
        c.text(v.body, { size: 15, color: T.c.body, lh: 1.65 });
        c.gap(6);
        c.row('现金跑道', F.runway(v.runway_months), { size: 13, valueColor: v.runway_months < 6 ? T.c.warn : T.c.ink });
        c.cells('时间', v.time_used, v.time_budget);
      });

      // 搜集信息：付费情报
      if (v.intel.length) {
        f.card({ bg: '#f8fafc' }, (c) => {
          c.sectionTitle('付费情报', '只改变你看到的信息，不改变真实概率');
          v.intel.forEach((it) => {
            c.card({ bg: '#ffffff', stroke: it.bought ? '#bbf7d0' : T.c.line, pad: 12, after: 8 }, (k) => {
              const y = k.y;
              k.push({ t: 'text', x: k.x, y: y + 16, s: it.title, font: T.font(14, 700), color: T.c.ink });
              k.push({ t: 'text', x: k.x + k.w, y: y + 16, s: F.money(it.fee), font: T.font(13, 600), color: T.c.warn, align: 'right' });
              k.y += 24;
              if (it.hint) k.text(it.hint, { size: 12, color: T.c.muted, lh: 1.5 });
              if (it.preview && !it.bought) k.text(it.preview, { size: 12, color: T.c.muted, lh: 1.5 });
              k.gap(4);
              k.button(it.bought ? '已购买' : it.affordable ? `花 ${F.money(it.fee)} 买情报` : '钱不够', () => app.buyIntel(it.id),
                { kind: 'secondary', h: 36, size: 13, disabled: it.bought || !it.affordable, after: 0, id: 'buy-intel-' + it.id });
            });
          });
          const rev = Object.entries(v.revealed).filter(([, t]) => t);
          rev.forEach(([k, t]) => {
            c.card({ bg: T.c.posSoft, pad: 12, after: 8 }, (q) => {
              q.text(F.L.reveal[k] || k, { size: 12, weight: 700, color: T.c.pos, lh: 1.4 });
              q.text(t, { size: 13, color: T.c.body, lh: 1.55 });
            });
          });
          if (v.options.some((o) => o.outcomes_revealed)) c.text('选项下方的概率区间是情报给出的估计（±10 个百分点，取整到 5%）。', { size: 11, color: T.c.muted, lh: 1.5 });
        });
      }

      // 评估 + 选择
      f.text('你的选择', { size: 13, weight: 600, color: T.c.onDarkMuted, lh: 1.8 });
      v.options.forEach((o) => {
        f.card({ stroke: o.enabled ? null : T.c.line, bg: o.enabled ? '#ffffff' : '#f8fafc', stripe: T.c.risk[o.risk] || T.c.faint, onTap: o.enabled ? () => app.choose(o.id) : null, id: 'opt-' + o.id, after: 10 }, (c) => {
          c.text(o.text, { size: 16, weight: 700, color: o.enabled ? T.c.ink : T.c.faint, lh: 1.45 });
          if (o.evaluate_text) { c.gap(2); c.text(o.evaluate_text, { size: 13, color: o.enabled ? T.c.body : T.c.faint, lh: 1.55 }); }
          c.gap(6);
          const chips = [{ text: F.L.risk[o.risk] || o.risk, color: T.c.risk[o.risk] || T.c.body, bg: T.c.soft }];
          if (o.cost.cash) chips.push({ text: `花费 ${F.money(o.cost.cash)}` });
          if (o.cost.time) chips.push({ text: `时间 ${o.cost.time} 格` });
          if (o.cost.energy) chips.push({ text: `精力 −${o.cost.energy}` });
          if (o.cost.health) chips.push({ text: `健康 −${o.cost.health}` });
          c.chips(chips, { after: 0 });
          if (o.outcomes_revealed) {
            c.gap(8);
            c.chips(o.outcomes_revealed.map((r) => ({ text: `${r.title} ${Math.round(r.band[0] * 100)}–${Math.round(r.band[1] * 100)}%`, color: T.c.accentDark, bg: T.c.accentSoft })), { after: 0 });
          }
          if (!o.enabled && o.disabled_reason) { c.gap(6); c.text('✕ ' + o.disabled_reason, { size: 12, color: T.c.neg, lh: 1.5 }); }
        });
      });
      f.gap(6);
    }
  };
}

function result(app) {
  const life = app.life;
  const d = life.s.decisions[app.resultIdx];
  return {
    header: header(app),
    body(f) {
      status(f, life);
      f.card({}, (c) => {
        c.eyebrow(`结果 · ${d.age} 岁`);
        c.title(d.title, { size: 19 });
        c.text(`你选择了：${d.option_text}`, { size: 13, color: T.c.muted, lh: 1.6 });
        c.gap(8);
        c.card({ bg: T.c.accentSoft, pad: 14, after: 10 }, (k) => {
          k.text(d.outcome_title, { size: 18, weight: 800, color: T.c.accentDark, lh: 1.4 });
        });
        if (d.review_text) c.text(d.review_text, { size: 15, color: T.c.body, lh: 1.65 });
        c.gap(8);
        c.tiles([
          { k: '现金变化', v: F.money(d.result_delta.cash, { sign: true }), color: d.result_delta.cash < 0 ? T.c.neg : T.c.pos },
          { k: '净资产变化', v: F.money(d.result_delta.nw, { sign: true }), color: d.result_delta.nw < 0 ? T.c.neg : T.c.pos }
        ], 2);
        if (d.intel_bought && d.intel_bought.length) {
          c.text(`本次买了 ${d.intel_bought.length} 份情报，合计 ${F.money(d.intel_bought.reduce((a, x) => a + x.fee, 0))}（已记入支出）。`, { size: 12, color: T.c.muted, lh: 1.5 });
        }
        const notes = (life.s.flags.year_notes || []).slice(-3);
        if (notes.length) { c.gap(4); notes.forEach((n) => c.text('· ' + n, { size: 13, color: T.c.body, lh: 1.5 })); }
      });
    },
    footer(f) {
      f.button('继续', () => app.closeResult(), { id: 'result-next', after: 0 });
    }
  };
}

module.exports = { decision, result };
