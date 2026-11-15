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
        }
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
      });
    },
    footer(f) { f.button('返回棋盘', () => app.go('board'), { kind: 'secondary', id: 'back', after: 0 }); }
  };
}

function strategyPage(app) {
  const life = app.life;
  return {
    header: header(app),
    body(f) {
      const s = life.s;
      status(f, life);
      f.card({}, (c) => {
        c.eyebrow('总部战略');
        c.title('研发投入', { size: 18 });
        c.seg(['low', 'mid', 'high'].map((k) => ({ label: F.L.rnd[k], on: s.rnd === k, onTap: () => { life.setRnd(k); app.save(); app.refresh(); }, id: 'rnd-' + k })));
        c.text(F.L.rndHint[s.rnd], { size: 12, color: T.c.muted, lh: 1.5 });
        c.gap(4);
        const q = Math.round(s.quality);
        c.custom(26, (push, x, y, w) => {
          push({ t: 'text', x, y: y + 16, s: '产品力', font: T.font(12), color: T.c.muted });
          push({ t: 'rect', x: x + 52, y: y + 8, w: w - 92, h: 10, r: 5, fill: T.c.soft });
          push({ t: 'rect', x: x + 52, y: y + 8, w: (w - 92) * q / 100, h: 10, r: 5, fill: T.c.accent });
          push({ t: 'text', x: x + w, y: y + 17, s: String(q), font: T.font(13, 700), color: T.c.ink, align: 'right' });
        });
        c.gap(10);
        c.title('定价策略', { size: 18 });
        c.seg(['low', 'mid', 'premium'].map((k) => ({ label: F.L.price[k], on: s.price === k, onTap: () => { life.setPrice(k); app.save(); app.refresh(); }, id: 'price-' + k })));
        c.text(F.L.priceHint[s.price], { size: 12, color: T.c.muted, lh: 1.5 });
      });
      f.card({}, (c) => {
        c.title('融资', { size: 18 });
        const limit = life.creditLimit();
        c.row('负债', F.usd(s.debt), { valueColor: s.debt > 0 ? T.c.neg : T.c.ink });
        c.row('信用额度', F.usd(limit));
        c.row('贷款利率', F.pct(life.loanRate()));
        c.gap(4);
        const room = Math.max(0, limit - s.debt);
        const step = Math.max(1e6, Math.round(Math.max(s.lastRev, 1e7) * 0.1 / 1e6) * 1e6);
        c.buttons([
          { label: `借 ${F.usd(step, { short: true })}`, disabled: room < 1, onTap: () => app.finance('borrow', step), id: 'borrow' },
          { label: '还 ' + F.usd(step, { short: true }), disabled: s.debt <= 0 || s.cash <= 0, onTap: () => app.finance('repay', step), id: 'repay' },
          { label: '全部还清', disabled: s.debt <= 0 || s.cash <= 0, onTap: () => app.finance('repay', s.debt), id: 'repay-all' }
        ], { size: 13 });
        c.text('现金不够时会自动动用信用额度；额度也用完，就要重组：卖掉部分海外业务、引入新股东，但公司继续经营。', { size: 11, color: T.c.muted, lh: 1.55 });
      });
      f.card({}, (c) => {
        c.title('公司概况', { size: 18 });
        const act = Object.values(s.countries).filter((x) => x.level > 0);
        c.row('进入国家', `${act.length} 个`);
        c.row('平均品牌力', String(Math.round(act.reduce((a, x) => a + x.brand, 0) / Math.max(1, act.length))));
        c.row('你的持股', F.pct(s.ownership, 0));
        c.row('经历重组', `${s.restructures} 次`);
        c.row('已遇到案例', `${s.caseLog.length} 个`);
      });
    },
    footer(f) { f.button('返回棋盘', () => app.go('board'), { kind: 'secondary', id: 'back', after: 0 }); }
  };
}

module.exports = { countryPage, strategyPage };
