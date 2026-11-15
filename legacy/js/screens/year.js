// 年度卡：宏观、当年账本、工作与生活、资产负债与操作、企业
const T = require('../ui/theme.js');
const F = require('../game/format.js');
const S = require('../game/session.js');
const { header, status } = require('./common.js');

function year(app) {
  const life = app.life;
  const ui = app.ui;
  const act = (name, payload) => app.act(name, payload);

  return {
    header: header(app),
    body(f) {
      const s = life.s;
      const b = S.balance(life);
      const mac = s.macro;
      const fc = mac.forecast;
      const last = s.history.at(-1);
      status(f, life);

      // ---- 年度卡 ----
      f.card({}, (c) => {
        c.eyebrow('年度卡');
        c.title(`${s.age} 岁 · ${F.L.cycle[mac.cycle]}期（第 ${mac.years_in_cycle} 年）`, { size: 19 });
        c.gap(8);
        c.tiles([
          { k: '通胀', v: F.pct(mac.inflation) },
          { k: '利率', v: F.pct(mac.interest) },
          { k: '失业率', v: F.pct(mac.unemployment) },
          { k: '物价指数', v: mac.price_level.toFixed(2) }
        ], 4, { valueSize: 14 });
        if (fc) {
          c.sectionTitle('明年展望', '不确定，仅供参考');
          const probs = Object.entries(fc.next_cycle_probs).filter(([, p]) => p > 0.005);
          probs.forEach(([k, p]) => {
            const y = c.y;
            const lw = 40;
            c.push({ t: 'text', x: c.x, y: y + 14, s: F.L.cycle[k], font: T.font(12), color: T.c.body });
            c.push({ t: 'rect', x: c.x + lw, y: y + 5, w: c.w - lw - 44, h: 10, r: 5, fill: T.c.soft });
            c.push({ t: 'rect', x: c.x + lw, y: y + 5, w: Math.max(4, (c.w - lw - 44) * p), h: 10, r: 5, fill: T.c.cycle[k] });
            c.push({ t: 'text', x: c.x + c.w, y: y + 14, s: `${Math.round(p * 100)}%`, font: T.font(12, 600), color: T.c.ink, align: 'right' });
            c.y += 20;
          });
          c.text(`通胀 ${F.pct(fc.inflation[0])}–${F.pct(fc.inflation[1])} · 利率 ${F.pct(fc.interest[0])}–${F.pct(fc.interest[1])} · 失业 ${F.pct(fc.unemployment[0])}–${F.pct(fc.unemployment[1])}`, { size: 11, color: T.c.muted, lh: 1.5 });
        }
        const notices = s.flags.year_notices || [];
        notices.forEach((n) => {
          c.gap(8);
          c.card({ bg: T.c.warnSoft, pad: 12, after: 0 }, (k) => {
            k.text(`${n.title}：${n.outcome}`, { size: 14, weight: 700, color: '#92400e', lh: 1.45 });
            if (n.body) k.text(n.body, { size: 12, color: '#78350f', lh: 1.5 });
            if (n.review) k.text(n.review, { size: 12, color: T.c.body, lh: 1.5 });
            if (Math.abs(n.cash_delta) > 0.5) k.text(`现金 ${F.money(n.cash_delta, { sign: true })}`, { size: 13, weight: 600, color: n.cash_delta < 0 ? T.c.neg : T.c.pos, lh: 1.5 });
          });
        });
        const notes = (s.flags.year_notes || []).filter((n) => !notices.some((x) => n.startsWith(x.title)));
        if (notes.length) { c.gap(6); notes.forEach((n) => c.text('· ' + n, { size: 13, color: T.c.body, lh: 1.5 })); }
      });

      // ---- 去年账本（可折叠）----
      if (last) {
        const led = S.yearLedger(s, last.age);
        const open = !!ui.ledgerOpen;
        f.card({}, (c) => {
          const y = c.y;
          c.sectionTitle(`${last.age} 岁这一年的钱`);
          c.push({ t: 'text', x: c.x + c.w, y: y + 22, s: open ? '收起' : '展开明细', font: T.font(12, 600), color: T.c.accent, align: 'right' });
          c.hit(c.x, y, c.w, 34, () => { ui.ledgerOpen = !open; app.refresh(); }, 'toggle-ledger');
          const net = last.cash - (last.cash_start || 0);
          c.chips(['I', 'E', 'T', 'D', 'F'].filter((k) => Math.abs(led.totals[k]) > 0.5).map((k) => ({
            text: `${F.L.account[k]} ${F.money(led.totals[k], { sign: true })}`, color: T.c.acc[k], bg: T.c.soft
          })), { after: 6 });
          c.row('现金净变化', F.money(net, { sign: true }), { valueColor: net < 0 ? T.c.neg : T.c.pos, size: 13 });
          if (open) {
            c.divider(4);
            led.lines.forEach((ln) => {
              const yy = c.y;
              c.push({ t: 'rect', x: c.x, y: yy + 5, w: 22, h: 20, r: 5, fill: T.c.soft });
              c.push({ t: 'text', x: c.x + 11, y: yy + 19, s: F.L.accShort[ln.account], font: T.font(11, 700), color: T.c.acc[ln.account], align: 'center' });
              c.push({ t: 'text', x: c.x + 30, y: yy + 19, s: ln.name, font: T.font(13), color: T.c.body });
              c.push({ t: 'text', x: c.x + c.w, y: yy + 19, s: F.money(ln.signed, { sign: true }), font: T.font(13, 600), color: ln.signed < 0 ? T.c.neg : T.c.pos, align: 'right' });
              c.y += 28;
            });
            c.gap(4);
            const parts = ['I', 'E', 'T', 'D', 'F'].map((k) => `${led.totals[k] < 0 ? '−' : '+'} ${F.L.account[k]} ${F.money(Math.abs(led.totals[k]))}`).join(' ');
            c.text(`期初 ${F.money(last.cash_start || 0)} ${parts} = 期末 ${F.money(last.cash)}`, { size: 11, color: T.c.muted, lh: 1.5 });
            if (last.notes && last.notes.length) last.notes.forEach((n) => c.text('· ' + n, { size: 12, color: T.c.body, lh: 1.5 }));
          }
        });
      }

      // ---- 工作与生活 ----
      f.card({}, (c) => {
        c.sectionTitle('工作与生活');
        const occ = s.occupation;
        const job = occ.path ? `${F.L.path[occ.path]} · ${F.L.level[occ.level]}${occ.industry ? ' · ' + (F.L.industry[occ.industry] || occ.industry) : ''}` : '还没有工作';
        c.text(job, { size: 15, weight: 600, color: T.c.ink, lh: 1.5 });
        const pills = [];
        if (occ.jobless) pills.push({ text: '失业中', color: '#92400e', bg: T.c.warnSoft });
        if (occ.side_venture) pills.push({ text: '副业', color: T.c.accentDark, bg: T.c.accentSoft });
        if (pills.length) c.chips(pills);
        c.gap(4);
        c.cells('时间', s.time.used, s.time.annual);
        c.chips(['health', 'energy', 'family', 'capability', 'happiness'].map((k) => {
          const v = Math.round(s.attrs[k]);
          return { text: `${F.L.attr[k]} ${v}`, color: v < 30 ? T.c.neg : T.c.body, bg: v < 30 ? T.c.negSoft : T.c.soft };
        }));
        c.text('生活方式', { size: 12, color: T.c.muted, lh: 1.6 });
        c.seg(['frugal', 'decent', 'hedonic'].map((k) => ({ label: F.L.lifestyle[k], on: s.lifestyle === k, onTap: () => act('set_lifestyle', { lifestyle: k }), id: 'life-' + k })));
        c.text(`去年生活费 ${F.money((last && last.living) || 0)}。生活方式影响开销、健康和幸福。`, { size: 11, color: T.c.muted, lh: 1.5 });
      });

      // ---- 资产与负债 ----
      f.card({}, (c) => {
        c.sectionTitle('资产与负债');
        c.row('现金', F.money(b.cash));
        ['deposit', 'money_fund', 'index_fund', 'sector_fund'].forEach((k) => {
          if (b.assets[k] > 0.5) c.row(F.L.product[k], F.money(b.assets[k]), { button: { label: '卖出', onTap: () => act('asset_sell', { product: k, amount: 'all' }), id: 'sell-' + k } });
        });
        if (b.assets.housing_market_value > 0) c.row('房产市值', F.money(b.assets.housing_market_value));
        if (b.venture_equity > 0) c.row('企业权益（估）', F.money(b.venture_equity));
        Object.entries(b.liabilities).forEach(([k, v]) => {
          c.row(F.L.loan[k] || k, '−' + F.money(v), {
            valueColor: T.c.neg,
            button: k === 'consumer' ? { label: '还清', onTap: () => act('loan_repay', { kind: 'consumer', amount: 'all' }), id: 'repay-consumer' } : null
          });
        });
        c.divider(2);
        c.row('净资产', F.money(b.net_worth), { labelColor: T.c.ink, labelWeight: 700, valueWeight: 800, valueColor: b.net_worth < 0 ? T.c.neg : T.c.ink, size: 15 });
        if (b.mortgage) c.text(`房贷剩余 ${F.money(b.mortgage.principal)}，年供约 ${F.money(b.mortgage.annual)}（利率 ${F.pct(b.mortgage.rate)}，剩 ${b.mortgage.term_left} 年）`, { size: 11, color: T.c.muted, lh: 1.5 });
        c.text(`明年固定还款约 ${F.money(b.debt_service_next)}；可动用资金 ${F.money(b.liquid)}，够撑 ${F.runway(b.runway_months)}。`, { size: 11, color: T.c.muted, lh: 1.5 });
        c.gap(6);

        const open = !!ui.moneyOpen;
        c.button(open ? '收起理财与买房' : '理财、借贷与买房', () => { ui.moneyOpen = !open; app.refresh(); }, { kind: 'ghost', h: 38, size: 14, id: 'toggle-money', after: open ? 10 : 0 });
        if (!open) return;

        // 手动买入
        c.text('手动买入（从现金里拿）', { size: 13, weight: 600, color: T.c.ink, lh: 1.6 });
        const prod = ui.buyProduct || 'index_fund';
        c.seg(['deposit', 'money_fund', 'index_fund', 'sector_fund'].map((k) => ({ label: F.L.product[k].replace('基金', ''), on: prod === k, onTap: () => { ui.buyProduct = k; app.refresh(); }, id: 'prod-' + k })), { size: 12 });
        const cash = Math.floor(s.cash);
        const amounts = [10000, 50000, 200000];
        c.buttons(amounts.map((a) => ({ label: `${a / 1e4} 万`, disabled: a > cash, onTap: () => act('asset_buy', { product: prod, amount: a }), id: `buy-${prod}-${a}` }))
          .concat([{ label: '全部', disabled: cash <= 0, onTap: () => act('asset_buy', { product: prod, amount: cash }), id: `buy-${prod}-all` }]), { size: 12 });
        c.text('基金会波动，卖出有折价；存款最稳但跑不赢通胀太多。', { size: 11, color: T.c.muted, lh: 1.5 });
        c.gap(6);
        // 借贷
        c.button(`借消费贷 1 万（3 年，利率 ${F.pct(life.rate(life.c.dev.consumer_rate_spread))}）`, () => act('loan_open', { kind: 'consumer', principal: 1e4, term_years: 3 }), { kind: 'ghost', h: 38, size: 13, id: 'loan-10k' });
        // 理财方式
        c.text('年末自动理财（保留 6 个月开销，其余按此配置）', { size: 13, weight: 600, color: T.c.ink, lh: 1.6 });
        const autoOn = !s.flags.auto_invest_off;
        c.seg([{ label: '关闭', on: !autoOn, onTap: () => act('set_auto_invest', { on: false }), id: 'auto-off' }]
          .concat(['cash_heavy', 'balanced', 'aggressive'].map((k) => ({
            label: F.L.mix[k], on: autoOn && s.invest_mix === k, id: 'mix-' + k,
            onTap: () => { if (!autoOn) act('set_auto_invest', { on: true }); act('set_invest_mix', { mix: k }); }
          }))));
        // 房子
        c.text('房子', { size: 13, weight: 600, color: T.c.ink, lh: 1.6 });
        if (b.assets.housing_market_value > 0) {
          c.button('卖掉房子', () => app.confirmAct('卖掉房子？', '会扣中介、折价与交易税，并先还清房贷。', 'asset_sell', { product: 'housing' }), { kind: 'danger', h: 40, size: 14, id: 'sell-house' });
        } else {
          const can = life.canBuyHouse();
          c.button('按揭买房', () => app.confirmAct('按揭买房？', `房价约 ${F.money(b.house_price)}，首付加税约 ${F.money(b.min_down_payment)}，房贷 25 年等额本息。`, 'asset_buy', { product: 'housing' }),
            { kind: 'secondary', h: 46, size: 14, disabled: !can.ok, sub: `房价约 ${F.money(b.house_price)} · 首付加税约 ${F.money(b.min_down_payment)}`, id: 'buy-house' });
          if (!can.ok) c.text('✕ ' + can.reason, { size: 12, color: T.c.neg, lh: 1.5 });
        }
        c.text('投资与税务为游戏简化模型，不构成建议。', { size: 11, color: T.c.faint, lh: 1.6 });
      });

      // ---- 企业 ----
      const v = s.venture;
      if (v && v.active) {
        f.card({ stripe: T.c.violet }, (c) => {
          c.sectionTitle(`我的企业 · ${F.L.industry[v.industry] || v.industry || ''} · 第 ${s.age - v.founded_age + 1} 年${v.side ? ' · 副业' : ''}`);
          c.tiles([
            { k: '去年营收', v: F.money(v.revenue) },
            { k: '去年利润', v: F.money(v.profit, { sign: true }), color: v.profit < 0 ? T.c.neg : T.c.pos },
            { k: '企业现金', v: F.money(v.cash_reserve), color: v.cash_reserve < 0 ? T.c.neg : T.c.ink },
            { k: '企业负债', v: F.money(v.debt) },
            { k: '员工', v: `${v.headcount} 人` },
            { k: '定价', v: `×${v.price.toFixed(2)}` }
          ], 3, { valueSize: 14 });
          c.buttons([
            { label: '降价 5%', onTap: () => act('venture_set_price', { price: Math.round((v.price - 0.05) * 100) / 100 }), id: 'v-price-down' },
            { label: '提价 5%', onTap: () => act('venture_set_price', { price: Math.round((v.price + 0.05) * 100) / 100 }), id: 'v-price-up' },
            { label: '招 1 人', onTap: () => act('venture_hire', { n: 1 }), id: 'v-hire' },
            { label: '减 1 人', disabled: v.headcount <= 0, onTap: () => act('venture_fire', { n: 1 }), id: 'v-fire' }
          ], { size: 12 });
          c.text('现金储备比例', { size: 12, color: T.c.muted, lh: 1.6 });
          c.seg([0.1, 0.2, 0.4].map((r) => ({ label: `${Math.round(r * 100)}%`, on: Math.abs(v.reserve_ratio - r) < 0.01, onTap: () => act('venture_set_reserve', { ratio: r }), id: 'v-res-' + r })));
          c.buttons([
            { label: '自动分红', onTap: () => act('venture_draw', { amount: 'auto' }), id: 'v-draw-auto' },
            { label: '暂停分红', onTap: () => act('venture_draw', { amount: 0 }), id: 'v-draw-0' }
          ], { size: 12 });
          c.buttons([
            { label: '出售企业', kind: 'secondary', onTap: () => app.confirmAct('出售企业？', '按当前估值打折出售，回款进个人账。', 'venture_sell', {}), id: 'v-sell' },
            { label: '关停清算', kind: 'danger', onTap: () => app.confirmAct('关停清算？', '企业停业，剩余资产清算后回到个人账。', 'venture_shutdown', {}), id: 'v-shutdown' }
          ], { size: 12 });
          c.text('企业账和个人账分开；给自己的分红才进个人收入。', { size: 11, color: T.c.muted, lh: 1.5 });
        });
      }
    },
    footer(f) {
      f.button('过完这一年 →', () => app.advance(), { id: 'advance', after: 0 });
    }
  };
}

module.exports = { year };
