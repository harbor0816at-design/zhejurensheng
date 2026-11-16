// 国家详情（点棋盘格子进入）与总部战略
const T = require('../ui/theme.js');
const F = require('../game/format.js');
const { icon } = require('../ui/icons.js');
const { header, status, tokens } = require('./common.js');

function countryPage(app) {
  const life = app.life;
  const cid = app.countryId;
  return {
    header: header(app),
    body(f) {
      const cv = life.countryView(cid);
      status(f, life);
      f.card({ stripe: cv.color }, (c) => {
        c.eyebrow(cv.isHQ ? '总部所在国' : '国家市场', cv.color);
        c.title(cv.name, { size: 24 });
        c.text(cv.blurb, { size: 13, color: T.c.muted, lh: 1.6 });
        c.gap(8);
        c.tiles([
          { k: `${life.ind.short}市场规模`, v: F.usd(cv.market) },
          { k: '今年增长', v: F.signedPct(cv.growth), color: cv.growth < 0 ? T.c.neg : T.c.pos },
          { k: '人工成本指数', v: cv.cost.toFixed(2) },
          { k: life.ind.physical ? '进口关税' : '外资准入', v: life.ind.physical ? F.pct(cv.tariff, 0) : `${Math.round(cv.access * 100)}%` }
        ], 2, { valueSize: 15 });
      });
      f.card({}, (c) => {
        c.sectionTitle('你在这里');
        c.row('布局', cv.levelName, { valueColor: cv.level ? T.c.ink : T.c.faint });
        if (cv.level > 0) {
          c.row('市场份额', F.pct(cv.share, cv.share < 0.01 ? 2 : 1));
          c.row('当地品牌力', String(Math.round(cv.brand)));
          c.row('去年收入', F.usd(cv.rev));
          c.row('去年利润', F.usd(cv.profit, { sign: true }), { valueColor: cv.profit < 0 ? T.c.neg : T.c.pos });
          if (life.ind.physical) c.row('供货来源', cv.source === '代工' ? '外包代工' : (life.countryView(cv.source).name + '工厂'));
          c.row('顾客买的档次', { budget: '平价款', mid: '主流款', premium: '高端款' }[cv.line] || '—');
        }
        c.row('收入水平', cv.income >= 2.6 ? '高' : cv.income >= 1.7 ? '中' : '低');
        c.gap(8);
        c.sectionTitle('行动', `今年还有 ${life.s.ap} 个行动点`);
        tokens(life).forEach((tk) => {
          const chk = life.check(tk.id, cid);
          const costTxt = chk.ok ? (tk.id === 'exit' ? `回收 ${F.usd(-chk.cost)}` : `花 ${F.usd(chk.cost)}${chk.run ? ` · 每年运营 ${F.usd(chk.run)}` : ''}`) : chk.reason;
          const y = c.y; const h = 54;
          c.push({ t: 'rect', x: c.x, y, w: c.w, h, r: 12, fill: chk.ok ? T.c.soft : '#f8fafc', stroke: chk.ok ? null : T.c.line });
          c.push({ t: 'rect', x: c.x + 10, y: y + 11, w: 32, h: 32, r: 9, fill: chk.ok ? tk.color : '#cbd5e1' });
          icon(c.push.bind(c), tk.icon, c.x + 16, y + 17, 20, '#fff');
          c.push({ t: 'text', x: c.x + 52, y: y + 23, s: tk.label, font: T.font(14, 700), color: chk.ok ? T.c.ink : T.c.faint });
          c.push({ t: 'text', x: c.x + 52, y: y + 42, s: costTxt, font: T.font(11), color: chk.ok ? T.c.muted : T.c.neg });
          if (chk.ok) c.hit(c.x, y, c.w, h, () => app.dropToken(tk.id, cid, true), 'act-' + tk.id, { r: 12 });
          c.y += h + 8;
        });
        // 收购当地对手
        const aq = cv.acquire;
        const y = c.y; const h = 54;
        c.push({ t: 'rect', x: c.x, y, w: c.w, h, r: 12, fill: aq.ok ? T.c.soft : '#f8fafc', stroke: aq.ok ? null : T.c.line });
        c.push({ t: 'rect', x: c.x + 10, y: y + 11, w: 32, h: 32, r: 9, fill: aq.ok ? '#be123c' : '#cbd5e1' });
        icon(c.push.bind(c), 'coin', c.x + 16, y + 17, 20, '#fff');
        c.push({ t: 'text', x: c.x + 52, y: y + 23, s: '收购当地对手', font: T.font(14, 700), color: aq.ok ? T.c.ink : T.c.faint });
        c.push({ t: 'text', x: c.x + 52, y: y + 42, s: aq.ok ? `花 ${F.usd(aq.cost)} · 份额 +5%，至少升到分公司；三成概率整合不顺` : aq.reason, font: T.font(11), color: aq.ok ? T.c.muted : T.c.neg });
        if (aq.ok) c.hit(c.x, y, c.w, h, () => app.acquire(cid), 'act-acquire', { r: 12 });
        c.y += h + 8;
      });
    },
    footer(f) { f.button('返回棋盘', () => app.go('board'), { kind: 'secondary', id: 'back', after: 0 }); }
  };
}

const TABS = [['product', '产品'], ['capital', '资本'], ['org', '组织'], ['supply', '供应链'], ['overview', '概况']];

function policyBlock(c, app, life, d) {
  const cur = life.pol(d.key);
  const lock = life.policyLock(d.key);
  c.text(d.name + (lock > 0 ? `（${lock} 年后可调整）` : ''), { size: 14, weight: 700, color: T.c.ink, lh: 1.7 });
  const opts = d.opts;
  const per = opts.length === 4 ? 2 : 3;
  for (let i = 0; i < opts.length; i += per) {
    c.seg(opts.slice(i, i + per).map((o) => {
      const on = d.multi ? cur.indexOf(o.id) >= 0 : cur === o.id;
      return { label: (d.multi ? (on ? '✓ ' : '') : '') + o.name, on, onTap: () => app.setPolicy(d.key, o.id), id: `pol-${d.key}-${o.id}` };
    }), { size: 13, after: 6 });
  }
  const show = d.multi ? opts.filter((o) => cur.indexOf(o.id) >= 0) : opts.filter((o) => o.id === cur);
  show.forEach((o) => { if (o.desc) c.text(`${o.name}：${o.desc}`, { size: 12, color: T.c.muted, lh: 1.5 }); });
  if (d.tip) c.text(d.tip, { size: 11, color: T.c.faint, lh: 1.5 });
  c.gap(8);
}

function strategyPage(app) {
  const life = app.life;
  const P = life.constructor.P || require('../biz/policy.js');
  return {
    header: header(app),
    body(f) {
      const s = life.s;
      status(f, life);
      const tab = app.stratTab || 'product';
      for (let i = 0; i < TABS.length; i += 5) f.seg(TABS.slice(i, i + 5).map(([k, n]) => ({ label: n, on: tab === k, onTap: () => { app.stratTab = k; app.refresh(); }, id: 'tab-' + k })), { size: 13 });
      f.gap(4);
      if (tab === 'product') {
        f.card({}, (c) => {
          c.eyebrow('产品与研发');
          P.POLICIES.product.forEach((d) => policyBlock(c, app, life, d));
          const q = Math.round(s.quality);
          c.custom(26, (push, x, y, w) => {
            push({ t: 'text', x, y: y + 16, s: '产品力', font: T.font(12), color: T.c.muted });
            push({ t: 'rect', x: x + 52, y: y + 8, w: w - 92, h: 10, r: 5, fill: T.c.soft });
            push({ t: 'rect', x: x + 52, y: y + 8, w: (w - 92) * q / 100, h: 10, r: 5, fill: T.c.accent });
            push({ t: 'text', x: x + w, y: y + 17, s: String(q), font: T.font(13, 700), color: T.c.ink, align: 'right' });
          });
        });
      }
      if (tab === 'capital') {
        f.card({}, (c) => {
          c.eyebrow('借贷');
          const limit = life.creditLimit();
          c.row('银行贷款', F.usd(life.loans()), { valueColor: life.loans() > 0 ? T.c.neg : T.c.ink });
          c.row('债券', F.usd(life.bondTotal()));
          c.row('信用额度', F.usd(limit));
          c.row('贷款利率', F.pct(life.loanRate()));
          c.gap(4);
          const room = life.creditRoom();
          const step = Math.max(1e6, Math.round(Math.max(s.lastRev, 1e7) * 0.1 / 1e6) * 1e6);
          c.buttons([
            { label: `借 ${F.usd(step, { short: true })}`, disabled: room < 1, onTap: () => app.finance('borrow', step), id: 'borrow' },
            { label: '还 ' + F.usd(step, { short: true }), disabled: life.loans() <= 0 || s.cash <= 0, onTap: () => app.finance('repay', step), id: 'repay' },
            { label: '还清贷款', disabled: life.loans() <= 0 || s.cash <= 0, onTap: () => app.finance('repay', life.loans()), id: 'repay-all' }
          ], { size: 13 });
          c.text(`现金不够时自动动用信用额度；额度用完就要重组（卖海外业务、引入新股东）。你的出身最多能重组 ${life.maxRestructure()} 次，已用 ${s.restructures} 次，再撑不住就会破产，游戏结束。`, { size: 11, color: T.c.muted, lh: 1.55 });
        });
        const cv = life.capitalView();
        f.card({}, (c) => {
          c.eyebrow('资本运作', T.c.violet);
          const opRow = (label, desc, v, fn, id) => {
            const y = c.y; const h = 58;
            c.push({ t: 'rect', x: c.x, y, w: c.w, h, r: 12, fill: v.ok ? T.c.soft : '#f8fafc', stroke: v.ok ? null : T.c.line });
            c.push({ t: 'text', x: c.x + 12, y: y + 23, s: label, font: T.font(14, 700), color: v.ok ? T.c.ink : T.c.faint });
            c.push({ t: 'text', x: c.x + 12, y: y + 43, s: v.ok ? desc : v.reason, font: T.font(11), color: v.ok ? T.c.muted : T.c.neg });
            if (v.ok) c.hit(c.x, y, c.w, h, fn, id, { r: 12 });
            c.y += h + 8;
          };
          opRow('发行债券', `融资 ${F.usd(cv.bond.amount)}，年利率 ${F.pct(cv.bond.rate)}，7 年后一次还本`, cv.bond, () => app.capital('issueBond'), 'cap-bond');
          opRow('增发新股', `出让 15% 股份，融资约 ${F.usd(cv.equity.amount)}`, cv.equity, () => app.capital('raiseEquity'), 'cap-equity');
          opRow('回购股份', `花 ${F.usd(cv.buyback.amount)} 买回约 5% 股份`, cv.buyback, () => app.capital('buyback'), 'cap-buyback');
          opRow(cv.listed ? `已上市（${cv.listed}）` : '上市（IPO）', `公开发行 15% 股份，融资约 ${F.usd(cv.ipo.amount)}；上市后估值溢价 15%，每年多一笔上市费用`, cv.ipo, () => app.capital('goPublic'), 'cap-ipo');
          c.text('每种操作每年最多一次。收购当地对手在国家详情页里，要花一个行动点。', { size: 11, color: T.c.faint, lh: 1.5 });
        });
        f.card({}, (c) => {
          c.eyebrow('财务政策');
          P.POLICIES.finance.forEach((d) => policyBlock(c, app, life, d));
          c.row('你的持股', F.pct(s.ownership, 1));
          c.row('个人财富（累计分红）', F.usd(s.wealth));
        });
      }
      if (tab === 'org') f.card({}, (c) => { c.eyebrow('人与组织'); P.POLICIES.org.forEach((d) => policyBlock(c, app, life, d)); });
      if (tab === 'supply') f.card({}, (c) => { c.eyebrow('供应链与营销'); P.POLICIES.supply.forEach((d) => policyBlock(c, app, life, d)); });
      if (tab === 'overview') {
        f.card({}, (c) => {
          c.eyebrow('公司概况');
          const act = Object.values(s.countries).filter((x) => x.level > 0);
          const fd = life.fd; const tr = life.constructor.D.TRAITS.find((x) => x.id === s.trait) || {};
          c.row('出身', fd.name);
          c.row('创始人特长', tr.name || '—');
          c.row('进入国家', `${act.length} 个`);
          c.row('平均品牌力', String(Math.round(act.reduce((a, x) => a + x.brand, 0) / Math.max(1, act.length))));
          c.row('你的持股', F.pct(s.ownership, 0));
          c.row('经历重组', `${s.restructures} / ${life.maxRestructure()} 次`);
          c.row('已遇到案例和事件', `${s.caseLog.length} 个`);
        });
        f.card({}, (c) => {
          c.eyebrow('未来大势（本局）', T.c.violet);
          c.text(s.year > 2024 ? '这一局的未来已经展开：' : '2025 年以后的世界按种子推演，这一局的大势是：', { size: 12, color: T.c.muted, lh: 1.6 });
          life.constructor.F.dialView(s.world.dials).forEach((d) => {
            c.text(`${d.name} · ${d.label}`, { size: 14, weight: 700, color: T.c.ink, lh: 1.6 });
            c.text(d.desc, { size: 12, color: T.c.muted, lh: 1.5 });
          });
          c.text('这是游戏推演，不是预测。', { size: 11, color: T.c.faint, lh: 1.6 });
        });
      }
    },
    footer(f) { f.button('返回棋盘', () => app.go('board'), { kind: 'secondary', id: 'back', after: 0 }); }
  };
}

module.exports = { countryPage, strategyPage };
