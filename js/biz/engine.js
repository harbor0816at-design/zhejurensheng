// 全球商业版引擎：确定性、可复现、与界面无关。
// 一回合 = 一年：beginYear（新闻、案例）→ 玩家行动（place / 战略 / 融资）→ endYear（结算、年报）。
const D = require('./data.js');
const { CASES } = require('./cases.js');

const VERSION = '2.0.0';
const LEVELS = ['未进入', '出口', '分公司', '工厂'];
const LEVELS_SW = ['未进入', '线上销售', '分公司', '数据中心'];
const PW = [0, 0.35, 1.0, 1.25];                // 布局等级对吸引力的权重
const SELL_COST = [0, 0.12, 0.07, 0.07];        // 渠道 / 销售费用占收入
const FIXED = [0, 0.15e6, 1.5e6, 5.0e6];         // 每国固定费用（按当地成本指数）
const CAPEX = [0, 0.4e6, 2.5e6, 12e6];          // 升级到该等级的一次性投入
const RND = { low: { pct: 0.02, min: 0.3e6, dq: -1 }, mid: { pct: 0.05, min: 1.0e6, dq: 2 }, high: { pct: 0.1, min: 2.5e6, dq: 5 } };
const PRICE = { low: { attract: 1.25, mult: 0.88, brand: -0.5 }, mid: { attract: 1, mult: 1, brand: 0 }, premium: { attract: 0.8, mult: 1.15, brand: 1 } };
const DRIFT = { electronics: 2.5, beverage: 0.6, software: 2.0 };
const PS = { electronics: 0.3, beverage: 0.6, software: 1.0 };
const TAX = 0.22;

// ---------------- 随机 ----------------
function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c > 0x7f) { // 简单 UTF-16 → 字节：足够区分中文种子
      h ^= c >>> 8; h = Math.imul(h, 0x01000193) >>> 0;
      c &= 0xff;
    }
    h ^= c; h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
function rngNext(st, key) { // mulberry32，状态存在 st[key]
  let t = (st[key] = (st[key] + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const country = (id) => D.COUNTRIES.find((c) => c.id === id);
const industry = (id) => D.INDUSTRIES.find((i) => i.id === id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r2 = (v) => Math.round(v * 100) / 100;

function eventOf(year) { return D.EVENTS.find((e) => e.year === year) || { year, headline: '' }; }
function pick(map, key) { if (!map) return 1; return (map[key] !== undefined ? map[key] : 1) * (key !== '*' && map['*'] !== undefined ? map['*'] : 1); }

class BizLife {
  static create(seed, opts) {
    opts = opts || {};
    const ind = industry(opts.industry || 'electronics');
    const hq = opts.hq || 'US';
    const s = {
      v: VERSION, seed: String(seed), industry: ind.id, hq,
      name: opts.name || ind.names[0],
      year: D.START_YEAR, cash: 5e6, debt: 0, quality: 45, rnd: 'mid', price: 'mid',
      ownership: 1, lossCarry: 0, restructures: 0, ended: false,
      countries: {}, mods: [], flags: {}, fx: {},
      ap: 0, apMax: 3, actions: [], flows: null,
      caseId: null, caseCtx: null, caseResult: null, caseLog: [], lastCaseYear: 0,
      history: [], report: null, endings: [], valuation: 5e6, lastNI: 0, lastRev: 0, lastEBITDA: 0,
      rng: {}
    };
    for (const k of ['macro', 'market', 'case', 'event']) s.rng[k] = fnv1a32(`${s.seed}|${VERSION}|${k}`);
    // 每国每年的小幅需求噪声（宏观流，开局一次性生成）
    s.noise = {};
    for (const c of D.COUNTRIES) {
      s.noise[c.id] = [];
      for (let y = D.START_YEAR; y <= D.END_YEAR; y++) s.noise[c.id].push(r2(0.96 + rngNext(s.rng, 'macro') * 0.08));
      s.countries[c.id] = { level: 0, share: 0, brand: 0, rev: 0, profit: 0, campaign: false };
      s.fx[c.id] = 1;
    }
    const home = s.countries[hq];
    home.level = 2; home.brand = 15; home.share = 0;
    const life = new BizLife(s);
    const A0 = life.attract(hq, s.year);
    home.share = 0.6 * A0 / (A0 + ind.comp);
    life.beginYear();
    return life;
  }
  static fromJSON(json) { return new BizLife(typeof json === 'string' ? JSON.parse(json) : json); }
  constructor(s) { this.s = s; }
  toJSON() { return JSON.stringify(this.s); }

  get ind() { return industry(this.s.industry); }
  levelName(lv) { return (this.ind.physical ? LEVELS : LEVELS_SW)[lv]; }
  rand(k) { return rngNext(this.s.rng, k); }

  // ---------------- 世界查询 ----------------
  market(cid, year) {
    const ind = this.ind;
    const c = country(cid);
    const ev = eventOf(year);
    const gdp = D.interp(c.gdp, year) * 1e12;
    const noise = this.s.noise[cid][year - D.START_YEAR] || 1;
    return gdp * ind.gdpShare * D.interp(ind.pen, year) * pick(ev.demand, cid) * pick(ev.sector, ind.id) * noise;
  }
  costIdx(cid, year) { return D.interp(country(cid).cost, year); }
  access(cid, year) { if (cid === this.s.hq) return 1; const a = D.ACCESS[this.s.industry][cid]; return a === undefined ? 1 : D.interp(a, year); } // 本国公司不受外资准入限制
  tariff(from, to, year) {
    if (from === to) return 0;
    let t = D.interp(D.TARIFF[to], year);
    for (const [f, tt, a, b, v] of D.SPECIAL_TARIFF) if (f === from && tt === to && year >= a && year <= b) t += v;
    return Math.max(0, t);
  }
  growth(cid, year) {
    const a = this.market(cid, year - 1 < D.START_YEAR ? year : year - 1);
    return this.market(cid, year) / a - 1;
  }
  sentiment(year) { const ev = eventOf(year); return pick(ev.sentiment, this.s.industry); }
  headline(year) { return eventOf(year || this.s.year).headline; }
  baseRate(year) { return D.interp(D.BASE_RATE, year); }
  loanRate() { return this.baseRate(this.s.year) + 0.035; }
  creditLimit() { return Math.max(4e6, 2.5 * Math.max(0, this.s.lastEBITDA)); }

  modMult(cid, year) {
    let m = 1;
    for (const md of this.s.mods) if (year >= md.from && year <= md.to && md.attract) m *= pick(md.attract, cid);
    return m;
  }
  gmAdj(year) {
    let g = 0;
    for (const md of this.s.mods) if (year >= md.from && year <= md.to && md.gm) g += md.gm;
    return g;
  }

  // 实物行业：给某国供货的最低单位成本系数（相对行业基准）及来源
  sourcing(cid, year) {
    const ind = this.ind;
    const ev = eventOf(year);
    if (!ind.physical) return { cost: this.s.countries[cid].level >= 3 ? 0.92 : 1, from: null };
    const ref = ind.id === 'electronics' ? 0.7 : 0.8;
    let best = null;
    for (const f of D.COUNTRIES) {
      if (this.s.countries[f.id].level < 3) continue;
      const cost = this.costIdx(f.id, year) * pick(ev.cost, f.id) * (1 + this.tariff(f.id, cid, year)) + (f.id === cid ? 0 : ind.importCost);
      if (!best || cost < best.cost) best = { cost, from: f.id };
    }
    // 没有自有工厂可用：代工
    let contract;
    if (ind.id === 'electronics') contract = { cost: (0.55 + 0.25 * this.costIdx('CN', year)) * pick(ev.cost, 'CN') * (1 + this.tariff('CN', cid, year)) + ind.importCost, from: '代工' };
    else contract = { cost: 1.08 * (0.5 + 0.5 * this.costIdx(cid, year)) * pick(ev.cost, cid), from: '代工' };
    if (!best || contract.cost < best.cost) best = contract;
    return { cost: best.cost / ref, from: best.from };
  }

  attract(cid, year) {
    const s = this.s; const cs = s.countries[cid];
    if (cs.level === 0) return 0;
    let a = PW[cs.level] * (0.35 + cs.brand / 100) * (0.45 + s.quality / 100) * PRICE[s.price].attract * this.access(cid, year) * this.modMult(cid, year);
    if (cid === s.hq) a *= 2.2; // 本土优势：熟悉渠道、客户和规则
    if (this.s.industry === 'software') a *= 1 + 6 * cs.share;
    if (this.s.industry === 'beverage' && cs.level >= 3) a *= 1.1;
    if (cs.campaign) a *= 1.12;
    return a;
  }

  // ---------------- 回合 ----------------
  beginYear() {
    const s = this.s;
    s.actions = [];
    s.flows = { capex: 0, caseCash: 0, financing: 0, refunds: 0, cashStart: s.cash, debtStart: s.debt };
    for (const c of D.COUNTRIES) s.countries[c.id].campaign = false;
    s.apMax = 3 + (s.lastRev >= 1e9 ? 1 : 0) + (s.lastRev >= 1e10 ? 1 : 0);
    s.ap = s.apMax;
    s.caseResult = null;
    this.triggerCase();
  }

  triggerCase() {
    const s = this.s; const y = s.year;
    const done = new Set(s.caseLog.map((c) => c.id));
    const elig = CASES.filter((c) => !done.has(c.id) && y >= c.years[0] && y <= c.years[1] && (!c.industry || c.industry === s.industry) && (!c.cond || c.cond(s)));
    if (!elig.length) return;
    elig.sort((a, b) => a.years[1] - b.years[1]);
    const forced = elig.find((c) => c.years[1] === y);
    let chosen = forced || null;
    if (!chosen && y - s.lastCaseYear >= 2 && this.rand('case') < 0.55) chosen = elig[0];
    if (!chosen) return;
    s.caseId = chosen.id;
    s.caseCtx = chosen.ctx ? chosen.ctx(s) : {};
    s.lastCaseYear = y;
  }

  caseView() {
    const s = this.s;
    if (!s.caseId) return null;
    const c = CASES.find((x) => x.id === s.caseId);
    const fill = (t) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => {
      const v = s.caseCtx && s.caseCtx[k];
      if (v === undefined) return k === 'company' ? s.name : m;
      const cc = country(v); return cc ? cc.name : v;
    });
    return { id: c.id, title: c.title, era: c.era, situation: fill(c.situation), options: c.options.map((o) => ({ id: o.id, text: fill(o.text), hint: fill(o.hint) })), theoryName: c.theory.name };
  }

  chooseCase(optId) {
    const s = this.s;
    if (!s.caseId) return null;
    const c = CASES.find((x) => x.id === s.caseId);
    const opt = c.options.find((o) => o.id === optId);
    if (!opt) return null;
    let r = this.rand('case'); let out = opt.outcomes[opt.outcomes.length - 1];
    for (const o of opt.outcomes) { if (r < o.p) { out = o; break; } r -= o.p; }
    const before = { cash: s.cash, valuation: s.valuation };
    let title = out.title; let text = out.text;
    for (const e of out.effects) {
      const res = this.applyEffect(e, s.caseCtx || {});
      if (res && res.title) { title = res.title; text = res.text; }
    }
    const view = this.caseView();
    const entry = {
      id: c.id, year: s.year, title: c.title, era: c.era, option: view.options.find((o) => o.id === optId).text,
      outcome: title, outcomeText: text, history: c.history, theory: c.theory, cashDelta: s.cash - before.cash
    };
    s.caseLog.push(entry);
    s.caseResult = entry;
    s.caseId = null; s.caseCtx = null;
    return entry;
  }

  applyEffect(e, ctx) {
    const s = this.s;
    const sub = (k) => (typeof k === 'string' ? k.replace(/\{(\w+)\}/g, (m, n) => (ctx[n] !== undefined ? ctx[n] : m)) : k);
    const subMap = (m) => { const o = {}; for (const k of Object.keys(m || {})) o[sub(k)] = m[k]; return o; };
    const base = Math.max(s.lastRev, 5e6);
    switch (e.t) {
      case 'cash': {
        const minEff = Math.min(e.min || 0, 0.35 * Math.max(s.cash, 2e6)); // 最低花费不超过现金的 35%
        const amt = e.v < 0 ? -Math.max(minEff, -e.v * base) : e.v * s.lastRev;
        s.cash += amt; s.flows.caseCash += amt;
        if (s.cash < 0) this.spend(0); // 现金不够时自动动用信用额度
        return null;
      }
      case 'brand':
        if (e.c) { const cs = s.countries[sub(e.c)]; cs.brand = clamp(cs.brand + e.v, 0, 100); } else for (const c of D.COUNTRIES) { const cs = s.countries[c.id]; if (cs.level > 0 || e.v < 0) cs.brand = clamp(cs.brand + e.v, 0, 100); }
        return null;
      case 'quality': s.quality = clamp(s.quality + e.v, 0, 100); return null;
      case 'mod': {
        const from = s.year + (e.from || 0);
        s.mods.push({ attract: e.attract ? subMap(e.attract) : null, gm: e.gm || 0, from, to: from + (e.years || 1) - 1 });
        return null;
      }
      case 'share': { const m = subMap(e.m); for (const c of D.COUNTRIES) s.countries[c.id].share *= pick(m, c.id); return null; }
      case 'level': {
        const cid = sub(e.c); const cs = s.countries[cid];
        const v = !this.ind.physical && e.sw !== undefined ? e.sw : e.v;
        cs.level = e.force ? v : Math.max(cs.level, v);
        if (cs.level > 0 && cs.brand < 5) cs.brand = 5;
        return null;
      }
      case 'debt': { const amt = e.v * base; s.debt += amt; s.cash += amt; s.flows.financing += amt; return null; }
      case 'raise': {
        const amt = Math.max(2e6, e.v * s.valuation);
        s.ownership *= s.valuation / (s.valuation + amt);
        s.cash += amt; s.flows.financing += amt; return null;
      }
      case 'flag': s.flags[e.name] = s.year; return null;
      case 'pricing': {
        const act = D.COUNTRIES.filter((c) => s.countries[c.id].level > 0);
        const avg = act.reduce((a, c) => a + s.countries[c.id].brand, 0) / Math.max(1, act.length);
        if (avg >= 40) {
          s.mods.push({ gm: 0.03, attract: { '*': 0.97 }, from: s.year, to: s.year + 1 });
          return { title: '品牌撑住了涨价', text: `你的平均品牌力 ${Math.round(avg)}，客户大多接受了新价格，利润率反而提高。` };
        }
        s.mods.push({ attract: { '*': 0.85 }, from: s.year, to: s.year + 2 });
        return { title: '客户转向了便宜的对手', text: `你的平均品牌力只有 ${Math.round(avg)}，涨价后客户流向了更便宜的牌子。` };
      }
      default: return null;
    }
  }

  // ---------------- 玩家行动 ----------------
  capexFor(cid, level) {
    const base = !this.ind.physical && level === 3 ? 6e6 : CAPEX[level];
    return base * Math.max(0.5, this.costIdx(cid, this.s.year)) * (1 + 0.02 * (this.s.year - D.START_YEAR));
  }
  campaignCost(cid) {
    return Math.max(1e6, 0.1 * (this.s.countries[cid].rev || 0)) * Math.max(0.5, this.costIdx(cid, this.s.year));
  }
  // token: export | branch | factory | campaign | exit
  check(token, cid) {
    const s = this.s; const cs = s.countries[cid];
    if (s.ended) return { ok: false, reason: '本局已结束' };
    if (s.caseId) return { ok: false, reason: '先处理案例' };
    if (s.ap <= 0) return { ok: false, reason: '今年的行动点用完了' };
    const target = { export: 1, branch: 2, factory: 3 }[token];
    let cost = 0;
    if (target) {
      if (cs.level >= target) return { ok: false, reason: `这里已经有${this.levelName(cs.level)}了` };
      if (cs.level < target - 1) return { ok: false, reason: `要先有${this.levelName(target - 1)}` };
      if (s.actions.some((a) => a.c === cid && a.token !== 'campaign')) return { ok: false, reason: '一个国家一年只能升级一次' };
      cost = this.capexFor(cid, target);
    } else if (token === 'campaign') {
      if (cs.level === 0) return { ok: false, reason: '还没进入这个国家' };
      if (cs.campaign) return { ok: false, reason: '今年已经在这里做过营销' };
      cost = this.campaignCost(cid);
    } else if (token === 'exit') {
      if (cs.level === 0) return { ok: false, reason: '还没进入这个国家' };
      if (cid === s.hq && cs.level <= 1) return { ok: false, reason: '总部所在国不能完全撤出' };
      return { ok: true, cost: -0.3 * this.capexFor(cid, cs.level) };
    } else return { ok: false, reason: '未知行动' };
    const avail = s.cash + Math.max(0, this.creditLimit() - s.debt);
    if (cost > avail) return { ok: false, reason: `需要 ${Math.round(cost / 1e4)} 万美元，现金和信用额度不够` };
    if (target) {
      const run = FIXED[target] * Math.max(0.4, this.costIdx(cid, s.year)) * (1 + 0.03 * (s.year - D.START_YEAR));
      if (cost + run > avail) return { ok: false, reason: `投入 ${Math.round(cost / 1e4)} 万美元后，撑不起这里一年 ${Math.round(run / 1e4)} 万美元的运营费` };
      return { ok: true, cost, run };
    }
    return { ok: true, cost };
  }
  place(token, cid) {
    const s = this.s;
    const chk = this.check(token, cid);
    if (!chk.ok) return chk;
    const cs = s.countries[cid];
    if (token === 'exit') {
      s.cash -= chk.cost; s.flows.refunds -= chk.cost;
      cs.level -= 1; cs.brand *= 0.7;
      if (cs.level === 0) cs.share = 0; else cs.share *= 0.6;
    } else {
      this.spend(chk.cost);
      if (token === 'campaign') { cs.campaign = true; s.flows.campaign = (s.flows.campaign || 0) + chk.cost; } else {
        s.flows.capex += chk.cost;
        cs.level = { export: 1, branch: 2, factory: 3 }[token];
        if (cs.brand < 5) cs.brand = 5;
      }
    }
    s.ap -= 1;
    s.actions.push({ token, c: cid, cost: chk.cost });
    return { ok: true, cost: chk.cost };
  }
  // 付钱：现金不够时自动动用信用额度
  spend(amt) {
    const s = this.s;
    s.cash -= amt;
    if (s.cash < 0) {
      const draw = Math.min(-s.cash, Math.max(0, this.creditLimit() - s.debt));
      s.debt += draw; s.cash += draw; s.flows.financing += draw;
    }
  }
  setRnd(v) { if (RND[v]) this.s.rnd = v; }
  setPrice(v) { if (PRICE[v]) this.s.price = v; }
  borrow(amt) {
    const s = this.s; const room = Math.max(0, this.creditLimit() - s.debt);
    const a = Math.min(room, amt);
    if (a <= 0) return { ok: false, reason: '信用额度用完了' };
    s.debt += a; s.cash += a; s.flows.financing += a;
    return { ok: true, amount: a };
  }
  repay(amt) {
    const s = this.s; const a = Math.min(amt, s.debt, Math.max(0, s.cash));
    if (a <= 0) return { ok: false, reason: s.debt <= 0 ? '没有负债' : '现金不够' };
    s.debt -= a; s.cash -= a; s.flows.financing -= a;
    return { ok: true, amount: a };
  }

  // ---------------- 年度结算 ----------------
  endYear() {
    const s = this.s;
    if (s.ended || s.caseId) return false;
    const y = s.year; const ind = this.ind; const ev = eventOf(y);
    const rows = {};
    let revenue = 0; let cogs = 0; let sell = 0; let fixed = 0; let gmAdj = this.gmAdj(y);
    for (const c of D.COUNTRIES) {
      const cs = s.countries[c.id];
      const M = this.market(c.id, y);
      const A = this.attract(c.id, y);
      const K = ind.comp;
      const target = A / (A + K);
      if (cs.level === 0) cs.share *= 0.3; else cs.share += (target - cs.share) * 0.45;
      const src = this.sourcing(c.id, y);
      let supply = 1;
      if (ind.physical && ev.supply) supply = pick(ev.supply, src.from && src.from !== '代工' ? src.from : 'CN');
      s.fx[c.id] = 1 + (s.fx[c.id] * pick(ev.fx, c.id) - 1) * 0.85;
      const units = M * cs.share * supply;
      const rev = units * PRICE[s.price].mult * Math.sqrt(s.fx[c.id]);
      const unitCost = Math.max(0.05, 1 - ind.gm - gmAdj);
      const cg = units * unitCost * src.cost;
      const sl = rev * SELL_COST[cs.level] * (ind.id === 'software' ? 2.2 : 1);
      const fx = FIXED[cs.level] * Math.max(0.4, this.costIdx(c.id, y)) * (1 + 0.03 * (y - D.START_YEAR));
      revenue += rev; cogs += cg; sell += sl; fixed += fx;
      rows[c.id] = { market: M, share: cs.share, rev, cogs: cg, sell: sl, fixed: fx, profit: rev - cg - sl - fx, source: src.from, level: cs.level };
      cs.rev = rev; cs.profit = rows[c.id].profit;
    }
    const small = clamp(revenue / 3e7, 0.25, 1); // 小公司的研发底线和总部费用按规模缩放
    const rnd = Math.max(RND[s.rnd].min * small, RND[s.rnd].pct * revenue * (s.industry === 'software' ? 1.4 : 1));
    const hq = 0.5e6 * small + 0.03 * revenue;
    const campaign = s.flows.campaign || 0;
    const interest = s.debt * this.loanRate();
    const interestIncome = Math.max(0, s.cash) * this.baseRate(y) * 0.5;
    const ebitda = revenue - cogs - sell - fixed - rnd - hq - campaign;
    const ebt = ebitda - interest + interestIncome;
    let taxable = ebt;
    if (taxable > 0 && s.lossCarry > 0) { const use = Math.min(taxable, s.lossCarry); taxable -= use; s.lossCarry -= use; }
    if (ebt < 0) s.lossCarry += -ebt;
    const tax = taxable > 0 ? taxable * TAX : 0;
    const net = ebt - tax;
    s.cash += net + campaign; // 营销费在投放时已付现，这里只把其余利润计入现金

    // 现金不够：动用信用额度；还不够就重组（不结束游戏）
    let restructured = null;
    if (s.cash < 0) {
      const draw = Math.min(-s.cash, Math.max(0, Math.max(4e6, 2.5 * Math.max(0, ebitda)) - s.debt));
      s.debt += draw; s.cash += draw; s.flows.financing += draw;
    }
    if (s.cash < 0) restructured = this.restructure(revenue);

    // 品牌与产品力
    const act = D.COUNTRIES.filter((c) => s.countries[c.id].level > 0);
    const avgBrand = act.reduce((a, c) => a + s.countries[c.id].brand, 0) / Math.max(1, act.length);
    for (const c of D.COUNTRIES) {
      const cs = s.countries[c.id];
      if (cs.level === 0) { cs.brand *= 0.85; continue; }
      const gain = [0, 1.5, 4, 4][cs.level] + (cs.campaign ? 12 : 0) + PRICE[s.price].brand + 0.06 * (avgBrand - cs.brand);
      cs.brand = clamp(cs.brand * 0.95 + gain, 0, 100);
    }
    const dq = RND[s.rnd].dq - DRIFT[s.industry] + 1;
    s.quality = clamp(s.quality + (dq > 0 ? dq * (1 - s.quality / 110) : dq), 0, 100);

    // 估值
    const ni2 = (net + s.lastNI) / 2;
    const sent = this.sentiment(y);
    s.valuation = Math.max(0, Math.max(0, ni2) * ind.pe * sent + revenue * PS[s.industry] * sent + s.cash - s.debt);
    s.lastNI = net; s.lastRev = revenue; s.lastEBITDA = ebitda;

    const f = s.flows;
    const report = {
      year: y, headline: ev.headline, revenue, cogs, sell, fixed, rnd, hq, campaign, interest: interest - interestIncome, tax, net, ebitda,
      capex: f.capex, caseCash: f.caseCash, refunds: f.refunds, financing: f.financing, cashStart: f.cashStart, cashEnd: s.cash, debt: s.debt,
      valuation: s.valuation, sentiment: sent, rows, restructured, actions: s.actions.slice()
    };
    // 恒等式：期末现金 = 期初 − 资本开支 + 案例现金 + 撤出回收 + 净融资 + 净利润 + 重组注入
    report.check = f.cashStart - f.capex + f.caseCash + f.refunds + f.financing + net + (restructured ? restructured.cashIn : 0) - s.cash;
    s.report = report;
    s.history.push({ year: y, revenue, net, cash: s.cash, debt: s.debt, valuation: s.valuation, restructured: !!restructured, countries: Object.fromEntries(D.COUNTRIES.map((c) => [c.id, { rev: rows[c.id].rev, level: rows[c.id].level, share: rows[c.id].share }])) });
    s.mods = s.mods.filter((m) => m.to >= y + 1);

    if (y >= D.END_YEAR) { s.ended = true; s.endings = this.endings(); s.ap = 0; return true; }
    s.year = y + 1;
    this.beginYear();
    return true;
  }

  restructure(revenue) {
    const s = this.s;
    const sold = [];
    let cashIn = 0;
    // 卖掉利润最差的海外布局，直到补上缺口或卖完
    const order = D.COUNTRIES.filter((c) => c.id !== s.hq && s.countries[c.id].level > 0).sort((a, b) => s.countries[a.id].profit - s.countries[b.id].profit);
    for (const c of order) {
      if (s.cash + cashIn >= 0) break;
      const cs = s.countries[c.id];
      const refund = 0.3 * this.capexFor(c.id, cs.level);
      cashIn += refund; sold.push(c.id);
      cs.level = Math.max(0, cs.level - 1); cs.share *= 0.5; cs.brand *= 0.7;
    }
    // 投资人注资 + 债权人打折
    const need = Math.max(0, -(s.cash + cashIn)) + Math.max(3e6, 0.2 * revenue);
    const before = s.cash;
    s.cash = s.cash + cashIn + need;
    s.ownership *= 0.6;
    const haircut = s.debt * 0.5;
    s.debt -= haircut;
    s.restructures += 1;
    for (const c of D.COUNTRIES) s.countries[c.id].brand = Math.max(0, s.countries[c.id].brand - 5);
    return { sold, injected: need, haircut, cashIn: cashIn + need, cashBefore: before };
  }

  // ---------------- 结局 ----------------
  endings() {
    const s = this.s;
    const last = s.history[s.history.length - 1];
    const V = s.valuation;
    const rev = last ? last.revenue : 0;
    const by = (ids) => ids.reduce((a, id) => a + (last ? last.countries[id].rev : 0), 0) / Math.max(1, rev);
    const regions = { americas: [], asia: [], europe: [] };
    for (const c of D.COUNTRIES) regions[c.region].push(c.id);
    const maxRegion = Math.max(...Object.values(regions).map(by));
    const wide = D.COUNTRIES.filter((c) => s.countries[c.id].level >= 2).length;
    const home = by([s.hq]);
    const emerging = by(['CN', 'IN', 'BR', 'MX', 'VN'].filter((x) => x !== s.hq));
    const E = [
      { id: 'GIANT', name: '全球巨头', ok: V >= 5e10 && wide >= 6, text: '你的公司遍布全球，跻身世界级企业之列。' },
      { id: 'PHOENIX', name: '浴火重生', ok: s.restructures > 0 && V >= 1e9, text: '经历过重组，又重新站上了十亿美元。' },
      { id: 'GLOBAL', name: '全球玩家', ok: wide >= 6 && home < 0.5 && V >= 1e9, text: '六个以上国家有你的分公司或工厂，一半以上的收入来自海外。' },
      { id: 'REGIONAL', name: '区域霸主', ok: V >= 5e9 && maxRegion >= 0.6 && home < 0.75, text: '你在一个大区里称王。' },
      { id: 'HOME_KING', name: '本土之王', ok: home >= 0.75 && V >= 5e8, text: '主场就是你的城堡。' },
      { id: 'CHAMPION', name: '隐形冠军', ok: V >= 5e8 && V < 5e10 && s.quality >= 70, text: '规模不算最大，产品力却是一流。' },
      { id: 'EMERGING', name: '新兴市场先锋', ok: emerging >= 0.5, text: '一半以上的收入来自新兴市场。' },
      { id: 'STEADY', name: '稳健经营者', ok: s.restructures === 0 && s.debt < 0.5 * rev && V >= 2e8, text: '没有大起大落，一步一个脚印。' }
    ].filter((e) => e.ok);
    if (!E.length) E.push({ id: 'UNFINISHED', name: '创业未竟', text: '三十年过去，故事还没讲完。' });
    return E.slice(0, 3).map((e, i) => ({ id: e.id, name: e.name, text: e.text, role: i === 0 ? 'primary' : 'secondary' }));
  }

  // ---------------- 视图辅助 ----------------
  countryView(cid) {
    const s = this.s; const y = s.year; const cs = s.countries[cid]; const c = country(cid);
    const src = this.sourcing(cid, y);
    return {
      id: cid, name: c.name, color: c.color, blurb: c.blurb, level: cs.level, levelName: this.levelName(cs.level),
      share: cs.share, brand: cs.brand, rev: cs.rev, profit: cs.profit, campaign: cs.campaign,
      market: this.market(cid, y), growth: this.growth(cid, y), cost: this.costIdx(cid, y), access: this.access(cid, y),
      tariff: D.interp(D.TARIFF[cid], y), source: src.from, sourceCost: src.cost, risk: c.risk,
      isHQ: cid === s.hq
    };
  }
}

module.exports = { BizLife, VERSION, D, CASES, LEVELS, LEVELS_SW, fnv1a32, country, industry };
