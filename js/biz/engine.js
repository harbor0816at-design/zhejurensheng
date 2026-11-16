// 全球商业版引擎：确定性、可复现、与界面无关。
// 一回合 = 一年：beginYear（新闻、案例）→ 玩家行动（place / 战略 / 融资）→ endYear（结算、年报）。
const D = require('./data.js');
const F = require('./future.js');
const P = require('./policy.js');
const { CASES: CASES1 } = require('./cases.js');
const { CASES2 } = require('./cases2.js');
const { CASES3 } = require('./cases3.js');
const { CASES_F } = require('./cases_future.js');
const { CASES_F2 } = require('./cases_future2.js');
const { EXTRA } = require('./options_extra.js');
const { BIZ_EVENTS } = require('./events.js');
const { CARDS } = require('./cards.js');
const CASES = CASES1.concat(CASES2, CASES3, CASES_F, CASES_F2);
for (const c of CASES) if (EXTRA[c.id] && !c.options.some((o) => o.id === 'x')) c.options.push(EXTRA[c.id]);
const findCard = (id) => CASES.find((c) => c.id === id) || BIZ_EVENTS.find((c) => c.id === id);

const VERSION = '3.1.0';
const NEG = 1.6; // 坏结果放大：错误决策要真疼
const LEVELS = ['未进入', '出口', '分公司', '工厂'];
const LEVELS_SW = ['未进入', '线上销售', '分公司', '数据中心'];
const PW = [0, 0.35, 1.0, 1.25];                // 布局等级对吸引力的权重
const SELL_COST = [0, 0.12, 0.07, 0.07];        // 渠道 / 销售费用占收入
const FIXED = [0, 0.15e6, 1.5e6, 5.0e6];         // 每国固定费用（按当地成本指数）
const CAPEX = [0, 0.4e6, 2.5e6, 12e6];          // 升级到该等级的一次性投入
const RND = { low: { pct: 0.02, min: 0.3e6, dq: -1 }, mid: { pct: 0.05, min: 1.0e6, dq: 2 }, high: { pct: 0.1, min: 2.5e6, dq: 5 } };
const PRICE = { low: { attract: 1.25, mult: 0.88, brand: -0.5 }, mid: { attract: 1, mult: 1, brand: 0 }, premium: { attract: 0.8, mult: 1.15, brand: 1 } };
const DRIFT = { electronics: 2.5, beverage: 0.6, software: 2.0, auto: 1.6, apparel: 1.2, pharma: 1.4, energy: 2.2 };
const PS = { electronics: 0.3, beverage: 0.6, software: 1.0, auto: 0.3, apparel: 0.7, pharma: 0.9, energy: 0.5 };
const TAX = 0.22;
// 对手公司名：前 3 个是开局就在的老对手，后 3 个是之后可能杀进来的新玩家
const RIVAL_NAMES = {
  electronics: ['巨鲸电子', '银河科技', '极光数码', '闪电智能', '米粒科技', '未来视界'],
  beverage: ['海浪饮品', '红山食品', '冰川集团', '元气工坊', '果然鲜', '绿洲饮料'],
  software: ['蜂巢网络', '天穹云', '零点软件', '深度求索者', '光年智能', '星火开源'],
  auto: ['铁骑汽车', '疾风动力', '大地汽车', '电驰新能源', '无人智行', '飞马出行'],
  apparel: ['潮汐服饰', '白鹭时装', '锦绣集团', '快衣', '极简库', '新织'],
  pharma: ['长青制药', '曙光生物', '磐石医药', '基因方舟', 'AI 药研', '百岁生物'],
  energy: ['烈日能源', '蓝海储能', '山风新能', '氢动未来', '聚变星', '光墙科技']
};

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

function pick(map, key) { if (!map) return 1; return (map[key] !== undefined ? map[key] : 1) * (key !== '*' && map['*'] !== undefined ? map['*'] : 1); }

class BizLife {
  static create(seed, opts) {
    opts = opts || {};
    const ind = industry(opts.industry || 'electronics');
    const hq = opts.hq || 'US';
    const startYear = D.START_YEARS.some((x) => x.year === opts.startYear) ? opts.startYear : D.START_YEAR;
    const fd = D.FOUNDERS.find((x) => x.id === opts.founder) || D.FOUNDERS[0];
    const tr = D.TRAITS.find((x) => x.id === opts.trait) || D.TRAITS[0];
    const scale = 1 + 0.06 * (startYear - D.START_YEAR); // 晚开局的起步资金按经济规模放大
    const s = {
      v: VERSION, seed: String(seed), industry: ind.id, hq, startYear, founder: fd.id, trait: tr.id,
      name: opts.name || ind.names[0],
      year: startYear, cash: 5e6 * fd.cash * scale, debt: (fd.debt || 0) * scale, quality: fd.quality, rnd: fd.rnd || 'mid', price: 'mid',
      ownership: fd.ownership || 1, lossCarry: 0, restructures: 0, ended: false, bankrupt: null,
      policy: Object.assign({}, P.DEFAULT_POLICY, { lines: P.DEFAULT_POLICY.lines.slice() }), policyAt: {},
      wealth: 0, bonds: [], ipo: 0, yearOps: {}, deferred: null, eventSeen: {}, caseConsult: false, casePartner: false,
      rivals: [], rmods: [], news: [], hand: [], played: [], projects: [], distressed: null, mood: 0, apBonusNext: 0,
      countries: {}, mods: [], flags: {}, fx: {},
      ap: 0, apMax: 3, actions: [], flows: null,
      caseId: null, caseCtx: null, caseResult: null, caseLog: [], lastCaseYear: 0,
      history: [], report: null, endings: [], valuation: 5e6, lastNI: 0, lastRev: 0, lastEBITDA: 0,
      rng: {}
    };
    for (const k of ['macro', 'market', 'case', 'event', 'future', 'deck', 'rival']) s.rng[k] = fnv1a32(`${s.seed}|${VERSION}|${k}`);
    s.world = F.generate(() => rngNext(s.rng, 'future'), ind.id);
    // 每国每年的小幅需求噪声（宏观流，开局一次性生成）
    s.noise = {};
    for (const c of D.COUNTRIES) {
      s.noise[c.id] = [];
      for (let y = D.START_YEAR; y <= D.END_YEAR; y++) s.noise[c.id].push(r2(0.96 + rngNext(s.rng, 'macro') * 0.08));
      s.countries[c.id] = { level: 0, share: 0, brand: 0, rev: 0, profit: 0, campaign: false };
      s.fx[c.id] = 1;
    }
    // 三个老对手
    const homes = ['US', 'CN', 'JP', 'DE', 'UK', 'IN'];
    RIVAL_NAMES[ind.id].slice(0, 3).forEach((name, i) => {
      const rh = homes[Math.floor(rngNext(s.rng, 'rival') * homes.length) % homes.length];
      const power = {};
      for (const c of D.COUNTRIES) power[c.id] = c.id === rh ? 1.6 : r2(0.6 + 0.6 * rngNext(s.rng, 'rival'));
      s.rivals.push({ name, home: rh, power, tech: 48 + Math.round(rngNext(s.rng, 'rival') * 8), aggr: r2(0.3 + 0.35 * rngNext(s.rng, 'rival')), rate: 0.03, cap: 2.4, alive: true, since: startYear });
    });
    const home = s.countries[hq];
    home.level = fd.homeLevel || 2; home.brand = fd.brand; home.share = 0;
    if (fd.foreign) { // 海归 / 外企分拆：开局就有海外据点
      const pool = ['US', 'UK', 'DE', 'JP', 'CN'].filter((c) => c !== hq);
      for (let i = 0; i < fd.foreign; i++) { const cs = s.countries[pool[i]]; cs.level = fd.foreignLevel || 1; cs.brand = fd.foreignBrand || 10; }
    }
    const life = new BizLife(s);
    const A0 = life.attract(hq, s.year);
    home.share = 0.6 * A0 / (A0 + life.compK(hq, s.year));
    for (const c of D.COUNTRIES) if (c.id !== hq && s.countries[c.id].level > 0) { const A = life.attract(c.id, s.year); s.countries[c.id].share = 0.4 * A / (A + life.compK(c.id, s.year)); }
    life.beginYear();
    return life;
  }
  static fromJSON(json) { return new BizLife(typeof json === 'string' ? JSON.parse(json) : json); }
  constructor(s) { this.s = s; }
  toJSON() { return JSON.stringify(this.s); }

  get ind() { return industry(this.s.industry); }
  levelName(lv) { return (this.ind.physical ? LEVELS : LEVELS_SW)[lv]; }
  rand(k) { return rngNext(this.s.rng, k); }
  get fd() { return D.FOUNDERS.find((x) => x.id === this.s.founder) || D.FOUNDERS[0]; }
  pol(k) { const s = this.s; if (k === 'rnd') return s.rnd; if (k === 'price') return s.price; return s.policy[k]; }
  isFuture(year) { return (year || this.s.year) > D.HIST_END; }
  ev(year) {
    if (year > D.HIST_END) return (this.s.world.events[year]) || { year, headline: '', future: true };
    return D.EVENTS.find((e) => e.year === year) || { year, headline: '' };
  }
  fi(year) { return Math.max(0, Math.min(F.FUTURE_END - F.FUTURE_START, year - F.FUTURE_START)); }
  gdp(cid, year) {
    const c = country(cid);
    if (year <= D.HIST_END) return D.interp(c.gdp, year);
    return D.interp(c.gdp, D.HIST_END) * this.s.world.gdp[cid][this.fi(year)];
  }
  pen(year) {
    if (year <= D.HIST_END) return D.interp(this.ind.pen, year);
    return D.interp(this.ind.pen, D.HIST_END) * this.s.world.pen[this.fi(year)];
  }
  income(cid, year) { return D.interp(D.INCOME[cid], year); }

  // ---------------- 世界查询 ----------------
  market(cid, year) {
    const ind = this.ind;
    const c = country(cid);
    const ev = this.ev(year);
    const gdp = this.gdp(cid, year) * 1e12;
    const noise = this.s.noise[cid][year - D.START_YEAR] || 1;
    return gdp * ind.gdpShare * this.pen(year) * pick(ev.demand, cid) * pick(ev.sector, ind.id) * noise;
  }
  costIdx(cid, year) {
    const c = country(cid);
    if (year <= D.HIST_END) return D.interp(c.cost, year);
    const c0 = D.interp(c.cost, D.HIST_END);
    let v = c0 + (F.COST_T[cid] - c0) * (1 - Math.exp(-(year - D.HIST_END) / 25));
    const ay = this.s.world.autoYear || 2060; // 机器人普及后，各国人工成本差距缩小
    if (year > ay) v = 0.82 + (v - 0.82) * (1 - 0.4 * Math.min(1, (year - ay) / 20));
    return v;
  }
  access(cid, year) { // 本国公司不受外资准入限制
    const s = this.s;
    if (cid === s.hq) return 1;
    const a = D.ACCESS[s.industry][cid];
    let v = a === undefined ? 1 : D.interp(a, year);
    if (year > D.HIST_END) for (const r of s.world.access) {
      if (r.c !== cid || year < r.from) continue;
      if (r.notHq && s.hq === r.notHq) continue;
      if (r.onlyHq && s.hq !== r.onlyHq) continue;
      v *= r.mult;
    }
    if (s.trait === 'diplomat') v += 0.1;
    return clamp(v, 0.1, 1.3);
  }
  tariff(from, to, year) {
    if (from === to) return 0;
    let t = D.interp(D.TARIFF[to], year); let sp = 0;
    for (const [f, tt, a, b, v] of D.SPECIAL_TARIFF) if (f === from && tt === to && year >= a && year <= b) sp += v;
    if (year > D.HIST_END) for (const [f, tt, a, b, v] of this.s.world.tariffs) if (f === from && tt === to && year >= a && year <= b) sp += v;
    if (this.s.trait === 'diplomat' && sp > 0) sp *= 0.6;
    return Math.max(0, t + sp);
  }
  growth(cid, year) {
    const a = this.market(cid, year - 1 < D.START_YEAR ? year : year - 1);
    return this.market(cid, year) / a - 1;
  }
  sentiment(year) { const ev = this.ev(year); return pick(ev.sentiment, this.s.industry); }
  headline(year) { return this.ev(year || this.s.year).headline; }
  baseRate(year) { return year > D.HIST_END ? this.s.world.rate[this.fi(year)] : D.interp(D.BASE_RATE, year); }
  loanRate() {
    const s = this.s;
    return Math.max(0.005, this.baseRate(s.year) + 0.035 + (s.trait === 'financier' ? -0.01 : 0) + (s.trait === 'gambler' ? 0.01 : 0) + (s.policy.culture === 'steady' ? -0.005 : 0));
  }
  bondTotal() { return this.s.bonds.reduce((a, b) => a + b.amt, 0); }
  loans() { return Math.max(0, this.s.debt - this.bondTotal()); }
  creditMult() { return (this.fd.credit || 1) * (this.s.trait === 'financier' ? 1.3 : 1); }
  creditLimit() { return this.creditMult() * Math.max(4e6, 2.5 * Math.max(0, this.s.lastEBITDA)); }
  creditRoom() { return Math.max(0, this.creditLimit() - this.loans()); }
  maxRestructure() { return this.fd.maxRestructure !== undefined ? this.fd.maxRestructure : 2; }
  // 某国顾客会买哪一档产品
  bestLine(cid, year) {
    const t = this.income(cid, year);
    let best = null; let fit = 0;
    for (const l of this.s.policy.lines) { const f = P.interpTier(t, l); if (f > fit) { fit = f; best = l; } }
    return { line: best || 'mid', fit: (fit || 1) + 0.05 * (this.s.policy.lines.length - 1) };
  }

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
    const ev = this.ev(year);
    const tm = this.s.policy.supplier === 'near' ? 0.5 : 1;
    if (!ind.physical) return { cost: this.s.countries[cid].level >= 3 ? 0.92 : 1, from: null };
    const ref = ind.id === 'electronics' || ind.id === 'apparel' ? 0.7 : 0.8;
    let best = null;
    for (const f of D.COUNTRIES) {
      if (this.s.countries[f.id].level < 3) continue;
      const cost = this.costIdx(f.id, year) * pick(ev.cost, f.id) * (1 + tm * this.tariff(f.id, cid, year)) + (f.id === cid ? 0 : ind.importCost);
      if (!best || cost < best.cost) best = { cost, from: f.id };
    }
    // 没有自有工厂可用：代工
    let contract;
    if (ind.id === 'electronics') {
      for (const x of year > D.HIST_END ? ['CN', 'VN', 'MX'] : ['CN']) {
        const cc = (0.55 + 0.25 * this.costIdx(x, year)) * pick(ev.cost, x) * (1 + tm * this.tariff(x, cid, year)) + ind.importCost;
        if (!contract || cc < contract.cost) contract = { cost: cc, from: '代工' };
      }
    }
    else if (ind.id === 'apparel') {
      for (const x of ['CN', 'VN', 'IN']) {
        const cc = (0.5 + 0.3 * this.costIdx(x, year)) * pick(ev.cost, x) * (1 + tm * this.tariff(x, cid, year)) + ind.importCost;
        if (!contract || cc < contract.cost) contract = { cost: cc, from: '代工' };
      }
    } else {
      // 其他行业：在本地或几个制造大国里找最便宜的代工厂
      const prem = ind.id === 'auto' ? 1.06 : 1;
      for (const x of ind.tradeable ? [cid, 'CN', 'MX', 'VN'] : [cid]) {
        const cc = prem * (0.6 + 0.3 * this.costIdx(x, year)) * pick(ev.cost, x) * (1 + tm * this.tariff(x, cid, year)) + (x === cid ? 0 : ind.importCost);
        if (!contract || cc < contract.cost) contract = { cost: cc, from: '代工' };
      }
    }
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
    // 经营设置
    const po = s.policy;
    a *= this.bestLine(cid, year).fit * P.channelEff(po.channel, year);
    if (cid !== s.hq) {
      a *= { central: 0.94, regional: 1.08, matrix: 1.04 }[po.structure] || 1;
      a *= po.local === 'global' ? (s.industry === 'beverage' ? 0.85 : 0.9) : po.local === 'deep' ? 1.12 : 1;
    }
    if (po.staff === 'expand') a *= 1.04;
    a *= { wolf: 1.05, engineer: 0.98, steady: 0.98 }[po.culture] || 1;
    if (po.supplier === 'near' && s.industry === 'apparel') a *= 1.05;
    return a;
  }

  // ---------------- 回合 ----------------
  beginYear() {
    const s = this.s;
    s.actions = [];
    s.flows = { capex: 0, caseCash: 0, financing: 0, refunds: 0, cashStart: s.cash, debtStart: s.debt };
    for (const c of D.COUNTRIES) s.countries[c.id].campaign = false;
    s.apMax = 3 + (s.lastRev >= 1e9 ? 1 : 0) + (s.lastRev >= 1e10 ? 1 : 0);
    const fd = this.fd; const sy = s.startYear || D.START_YEAR;
    if (fd.apPenalty && s.year < sy + fd.apPenalty) s.apMax -= 1;
    if (fd.apBonus && s.year < sy + fd.apBonus) s.apMax += 1;
    if (s.trait === 'gambler') s.apMax += 1;
    if (s.policy.ceo === 'star' || (s.policy.ceo === 'pro' && s.lastRev >= 1e8)) s.apMax += 1;
    s.apMax += s.apBonusNext || 0; s.apBonusNext = 0;
    s.ap = s.apMax;
    s.yearOps = {}; s.news = []; s.played = [];
    s.rmods = (s.rmods || []).filter((m) => m.to >= s.year);
    if (s.year > sy) this.rivalsStep();
    for (const p of s.projects) if (!p.done && s.year - p.start >= 2) {
      p.done = s.year;
      if (this.rand('deck') < 0.7) { this.quality(12); s.news.push('研发攻关成功：产品力 +12。今年打“新品发布会”效果翻倍。'); } else { this.quality(2); s.news.push('研发攻关没达到预期，只拿到一点小成果。'); }
    }
    this.drawHand();
    s.caseResult = null; s.caseConsult = false; s.casePartner = false;
    this.triggerCase();
  }

  triggerCase() {
    const s = this.s; const y = s.year;
    const done = new Set(s.caseLog.map((c) => c.id));
    if (s.deferred) { // 去年推迟的案例优先
      const d = findCard(s.deferred); s.deferred = null;
      if (d && !done.has(d.id) && y <= d.years[1] + 1) { s.caseId = d.id; s.caseCtx = s.deferredCtx || {}; s.lastCaseYear = y; return; }
    }
    const elig = CASES.filter((c) => !done.has(c.id) && y >= c.years[0] && y <= c.years[1] && (!c.industry || c.industry === s.industry) && (!c.cond || c.cond(s)));
    if (!elig.length) return;
    elig.sort((a, b) => a.years[1] - b.years[1]);
    const forced = elig.find((c) => c.years[1] === y);
    let chosen = forced || null;
    if (!chosen && y - s.lastCaseYear >= 2 && this.rand('case') < 0.55) chosen = elig[0];
    if (!chosen) { this.triggerEvent(done); return; }
    s.caseId = chosen.id;
    s.caseCtx = chosen.ctx ? chosen.ctx(s, () => this.rand('event')) : {};
    s.lastCaseYear = y;
  }

  // 没有历史案例的年份，按种子随机抛出一张经营事件卡（每局每张最多一次）
  triggerEvent(done) {
    const s = this.s; const y = s.year;
    if (y === (s.startYear || D.START_YEAR) || this.rand('event') >= 0.35) return;
    const seen = s.eventSeen || {};
    const elig = BIZ_EVENTS.filter((c) => !(seen[c.id] && y - seen[c.id] < 15) && y >= c.years[0] && y <= c.years[1] && (!c.industry || c.industry === s.industry) && (!c.cond || c.cond(s)));
    if (!elig.length) return;
    const chosen = elig[Math.floor(this.rand('event') * elig.length) % elig.length];
    seen[chosen.id] = y; s.eventSeen = seen;
    s.caseId = chosen.id;
    s.caseCtx = chosen.ctx ? chosen.ctx(s, () => this.rand('event')) : {};
  }

  caseView() {
    const s = this.s;
    if (!s.caseId) return null;
    const c = findCard(s.caseId);
    const fill = (t) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => {
      const v = s.caseCtx && s.caseCtx[k];
      if (v === undefined) return k === 'company' ? s.name : m;
      const cc = country(v); return cc ? cc.name : v;
    });
    const odds = (o) => (s.caseConsult ? o.outcomes.map((x) => ({ p: x.p, title: fill(x.title) })) : null);
    return {
      id: c.id, title: c.title, era: c.era, event: c.id.startsWith('X_'), future: !!c.future || s.year > D.HIST_END,
      situation: fill(c.situation), options: c.options.map((o) => ({ id: o.id, text: fill(o.text), hint: fill(o.hint), odds: odds(o) })),
      theoryName: c.theory ? c.theory.name : '',
      consulted: s.caseConsult, partnered: s.casePartner, consultCost: this.consultCost(),
      canDefer: !c.id.startsWith('X_') && c.years[1] >= s.year && s.year < D.END_YEAR
    };
  }
  consultCost() { return Math.max(3e5, 0.01 * this.s.lastRev); }
  // 解决方式：请咨询公司（看清每个选项的概率）
  consultCase() {
    const s = this.s;
    if (!s.caseId || s.caseConsult) return { ok: false, reason: '已经咨询过了' };
    const cost = this.consultCost();
    if (cost > s.cash + this.creditRoom()) return { ok: false, reason: '钱不够请咨询公司' };
    this.spend(cost); s.flows.caseCash -= cost; s.caseConsult = true;
    return { ok: true, cost };
  }
  // 解决方式：找伙伴合作（成本和收益都减半）
  partnerCase() { const s = this.s; if (!s.caseId) return { ok: false }; s.casePartner = !s.casePartner; return { ok: true, on: s.casePartner }; }
  // 解决方式：推迟一年（犹豫会让市场略受影响）
  deferCase() {
    const s = this.s; const v = this.caseView();
    if (!v || !v.canDefer) return { ok: false, reason: '这件事拖不了' };
    s.deferred = s.caseId; s.deferredCtx = s.caseCtx; s.caseId = null; s.caseCtx = null;
    s.mods.push({ attract: { '*': 0.98 }, gm: 0, from: s.year, to: s.year });
    s.caseLog.push({ id: 'DEFER_' + v.id, year: s.year, title: v.title, era: v.era, option: '推迟一年再定', outcome: '暂时搁置', outcomeText: '犹豫让团队和客户有些观望。', history: '', theory: null, event: true, cashDelta: 0, deferred: true });
    return { ok: true };
  }

  chooseCase(optId) {
    const s = this.s;
    if (!s.caseId) return null;
    const c = findCard(s.caseId);
    const opt = c.options.find((o) => o.id === optId);
    if (!opt) return null;
    let r = this.rand('case'); let out = opt.outcomes[opt.outcomes.length - 1];
    for (const o of opt.outcomes) { if (r < o.p) { out = o; break; } r -= o.p; }
    const before = { cash: s.cash, valuation: s.valuation };
    let title = out.title; let text = out.text;
    const scale = s.casePartner ? 0.55 : 1;
    if (s.casePartner) text += '（与伙伴合作，代价和收获都打了折扣。）';
    for (const e0 of out.effects) {
      const e = scale === 1 ? e0 : this.scaleEffect(e0, scale);
      const res = this.applyEffect(e, s.caseCtx || {});
      if (res && res.title) { title = res.title; text = res.text; }
    }
    const view = this.caseView();
    const entry = {
      id: c.id, year: s.year, title: c.title, era: c.era, option: view.options.find((o) => o.id === optId).text + (s.casePartner ? '（与伙伴合作）' : ''), future: view.future,
      outcome: title, outcomeText: text, history: c.history || '', theory: c.theory || null, event: c.id.startsWith('X_'), cashDelta: s.cash - before.cash
    };
    s.caseLog.push(entry);
    s.caseResult = entry;
    s.caseId = null; s.caseCtx = null;
    return entry;
  }

  scaleEffect(e, k) {
    const sm = (m) => { const o = {}; for (const kk of Object.keys(m)) o[kk] = 1 + (m[kk] - 1) * k; return o; };
    switch (e.t) {
      case 'cash': return Object.assign({}, e, { v: e.v * k, min: (e.min || 0) * k });
      case 'brand': case 'quality': return Object.assign({}, e, { v: e.v * k });
      case 'mod': return Object.assign({}, e, { attract: e.attract ? sm(e.attract) : null, gm: (e.gm || 0) * k });
      case 'share': return Object.assign({}, e, { m: sm(e.m) });
      case 'raise': case 'debt': return Object.assign({}, e, { v: e.v * k });
      default: return e;
    }
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
      case 'brand': this.brand(e.c ? sub(e.c) : null, e.v < 0 ? e.v * NEG : e.v); return null;
      case 'quality': this.quality(e.v < 0 ? e.v * NEG : e.v); return null;
      case 'mod': {
        const from = s.year + (e.from || 0);
        const harsh = (m) => { const o = {}; for (const k of Object.keys(m)) o[k] = m[k] < 1 ? Math.max(0.2, 1 - (1 - m[k]) * NEG) : m[k]; return o; };
        s.mods.push({ attract: e.attract ? harsh(subMap(e.attract)) : null, gm: (e.gm || 0) < 0 ? e.gm * NEG : (e.gm || 0), gmC: e.gmC ? subMap(e.gmC) : null, from, to: from + (e.years || 1) - 1 });
        return null;
      }
      case 'share': { const m = subMap(e.m); for (const c of D.COUNTRIES) { const v = pick(m, c.id); s.countries[c.id].share *= v < 1 ? Math.max(0.2, 1 - (1 - v) * NEG) : v; } return null; }
      case 'level': {
        const cid = sub(e.c); const cs = s.countries[cid];
        const v = !this.ind.physical && e.sw !== undefined ? e.sw : e.v;
        cs.level = e.force ? v : Math.max(cs.level, v);
        if (cid === s.hq && cs.level < 2) cs.level = 2; // 总部所在国至少保留分公司
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

  // ---------------- 通用小工具（案例、策略卡共用） ----------------
  pay(amt) { if (amt <= 0) return; this.spend(amt); this.s.flows.capex += amt; }
  gain(amt) { if (amt <= 0) return; this.s.cash += amt; this.s.flows.refunds += amt; }
  addMod(e) { const s = this.s; const from = s.year + (e.from || 0); s.mods.push({ attract: e.attract || null, gm: e.gm || 0, gmC: e.gmC || null, from, to: from + (e.years || 1) - 1 }); }
  gmC(cid, year) { let g = 0; for (const md of this.s.mods) if (year >= md.from && year <= md.to && md.gmC && md.gmC[cid]) g += md.gmC[cid]; return g; }
  brand(cid, v) {
    const s = this.s;
    if (v < 0 && s.flags.pr && s.year - s.flags.pr < 8) v *= 0.5;
    const list = cid ? [cid] : D.COUNTRIES.map((c) => c.id).filter((c) => s.countries[c].level > 0 || v < 0);
    for (const c of list) s.countries[c].brand = clamp(s.countries[c].brand + v, 0, 100);
  }
  quality(v) { this.s.quality = clamp(this.s.quality + v, 0, 100); }

  // ---------------- 对手 ----------------
  aliveRivals() { return this.s.rivals.filter((r) => r.alive); }
  rivalTotal(r) { return Object.values(r.power).reduce((a, b) => a + b, 0); }
  strongestRival() { return this.aliveRivals().sort((a, b) => this.rivalTotal(b) - this.rivalTotal(a))[0]; }
  weakestRival() { return this.aliveRivals().sort((a, b) => this.rivalTotal(a) - this.rivalTotal(b))[0]; }
  rivalPower(r, cid, year) {
    const i = this.s.rivals.indexOf(r);
    let p = r.power[cid] || 0;
    for (const m of this.s.rmods || []) if (m.r === i && (m.c === null || m.c === cid) && year <= m.to) p *= m.mult;
    return p;
  }
  compK(cid, year) {
    const rs = this.aliveRivals();
    let sum = 0; let tech = 50;
    for (const r of rs) { sum += this.rivalPower(r, cid, year); tech = Math.max(tech, r.tech); }
    const tf = clamp(1 + (tech - this.s.quality) / 90, 0.75, 1.5);
    return this.ind.comp * (0.4 + 0.2 * sum) * tf;
  }
  rivalRev(r) { let v = 0; for (const c of D.COUNTRIES) v += this.market(c.id, this.s.year) * 0.08 * Math.min(1.5, (r.power[c.id] || 0) / 2); return v; }
  rivalPrice(r) { return 1.1 * this.rivalRev(r); }
  hitRival(r, mult, years) { const s = this.s; s.rmods.push({ r: s.rivals.indexOf(r), c: null, mult, to: s.year + years - 1 }); }
  // 打击某国的对手；foreignOnly 只打外国对手；single 只打当地最强的一个（永久削弱）
  hitRivals(cid, mult, years, foreignOnly, single) {
    const s = this.s; const y = s.year;
    let rs = this.aliveRivals().filter((r) => !foreignOnly || r.home !== cid);
    if (single) { const r = rs.sort((a, b) => this.rivalPower(b, cid, y) - this.rivalPower(a, cid, y))[0]; if (r) r.power[cid] *= mult; return r; }
    for (const r of rs) s.rmods.push({ r: s.rivals.indexOf(r), c: cid, mult, to: y + years - 1 });
    return rs[0];
  }
  absorbRival(r) {
    const s = this.s;
    r.alive = false; r.died = s.year; r.fate = '被你收购';
    for (const c of D.COUNTRIES) { const cs = s.countries[c.id]; if (cs.level > 0) cs.share = Math.min(0.9, cs.share + 0.035 * (r.power[c.id] || 0)); }
    s.news.push(`你收购了${r.name}。`);
  }
  rivalsStep() {
    const s = this.s; const y = s.year; const rnd = () => this.rand('rival');
    const cids = D.COUNTRIES.map((c) => c.id);
    const top = cids.slice().sort((a, b) => s.countries[b].rev - s.countries[a].rev)[0];
    for (const r of this.aliveRivals()) {
      for (const c of cids) r.power[c] = r2(r.power[c] + r.rate * (r.cap - r.power[c]) * (0.3 + rnd()));
      r.tech = r2(50 + (r.tech - 50) * 0.92 + (rnd() - 0.5) * 4);
      if (rnd() >= r.aggr) continue;
      const k = rnd();
      const c = rnd() < 0.6 && s.countries[top].level > 0 ? top : cids[Math.floor(rnd() * cids.length) % cids.length];
      const cn = country(c).name;
      if (k < 0.3) {
        s.rmods.push({ r: s.rivals.indexOf(r), c, mult: 1.35, to: y + 1 });
        if (s.countries[c].level > 0) { this.addMod({ gmC: { [c]: -0.02 }, years: 2 }); s.news.push(`${r.name}在${cn}发动价格战，你在当地的利润被压缩。`); } else s.news.push(`${r.name}在${cn}大幅降价抢市场。`);
      } else if (k < 0.55) { r.power[c] = r2(Math.min(3.5, r.power[c] + 0.5)); s.news.push(`${r.name}在${cn}大举扩张，新开工厂和门店。`); }
      else if (k < 0.75) { r.tech = r2(r.tech + 12); s.news.push(`${r.name}推出新一代产品，技术明显领先。${s.quality < r.tech ? '你的产品显得落后了。' : ''}`); }
      else if (k < 0.9) { s.rmods.push({ r: s.rivals.indexOf(r), c, mult: 1.25, to: y + 1 }); s.news.push(`${r.name}在${cn}砸重金打广告。`); }
      else if (!(s.flags.esop && y - s.flags.esop < 5) && s.policy.pay !== 'high') { this.quality(-3); s.news.push(`${r.name}高薪挖走了你的一批工程师（产品力 −3）。`); }
    }
    // 危机年份：最弱的对手可能倒下
    const alive = this.aliveRivals();
    if (this.sentiment(y) < 0.8 && alive.length && rnd() < 0.4) {
      const w = this.weakestRival();
      w.alive = false; w.died = y; w.fate = '破产';
      s.distressed = { name: w.name, power: Object.assign({}, w.power), price: 0.3 * this.rivalPrice(w), year: y };
      s.news.push(`${w.name}撑不住，宣布破产！它的资产在打折出售（看看手里有没有“收购破产对手资产”卡）。`);
    }
    if (s.distressed && y - s.distressed.year > 1) s.distressed = null;
    // 新玩家杀入
    const names = RIVAL_NAMES[this.ind.id];
    const used = new Set(s.rivals.map((r) => r.name));
    if (this.aliveRivals().length < 3 && rnd() < 0.18) {
      const nm = names.find((n) => !used.has(n));
      if (nm) {
        const power = {}; for (const c of cids) power[c] = 0.3;
        const rh = cids[Math.floor(rnd() * cids.length) % cids.length]; power[rh] = 0.8;
        s.rivals.push({ name: nm, home: rh, power, tech: 60 + Math.round(rnd() * 8), aggr: 0.6, rate: 0.12, cap: 2.8, alive: true, since: y });
        s.news.push(`新玩家${nm}杀入市场，技术新、打法凶。`);
      }
    }
    // 对手合并
    const al = this.aliveRivals();
    if (al.length >= 3 && rnd() < 0.03) {
      const srt = al.sort((a, b) => this.rivalTotal(a) - this.rivalTotal(b));
      const [a, b] = srt;
      for (const c of cids) b.power[c] = r2(Math.min(3.5, (a.power[c] + b.power[c]) * 0.8));
      a.alive = false; a.died = y; a.fate = `并入${b.name}`;
      s.news.push(`${b.name}合并了${a.name}，成了更难缠的对手。`);
    }
  }
  rivalsView() {
    const y = this.s.year;
    return this.s.rivals.map((r) => ({ name: r.name, home: country(r.home).name, alive: r.alive, fate: r.fate, tech: Math.round(r.tech), strength: this.rivalTotal(r) / D.COUNTRIES.length, power: Object.fromEntries(D.COUNTRIES.map((c) => [c.id, this.rivalPower(r, c.id, y)])) }));
  }

  // ---------------- 策略卡 ----------------
  card(id) { return CARDS.find((c) => c.id === id); }
  drawHand() {
    const s = this.s; const y = s.year;
    const pool = CARDS.filter((c) => !c.special && (!c.years || (y >= c.years[0] && y <= c.years[1])) && (c.target === 'country' || !c.cond(this)));
    const hand = [];
    if (s.distressed) hand.push('buy_distressed');
    const n = 5 + (s.trait === 'gambler' ? 1 : 0);
    const left = pool.slice();
    while (hand.length < n && left.length) { const i = Math.floor(this.rand('deck') * left.length) % left.length; hand.push(left[i].id); left.splice(i, 1); }
    s.hand = hand;
  }
  redraw() {
    const s = this.s;
    if (s.yearOps.redraw) return { ok: false, reason: '今年已经换过一次牌' };
    if (s.ap <= 0) return { ok: false, reason: '换牌要花一个行动点' };
    s.ap -= 1; s.yearOps.redraw = true; this.drawHand();
    return { ok: true };
  }
  cardCheck(id, cid) {
    const s = this.s; const c = this.card(id);
    if (!c || s.hand.indexOf(id) < 0) return { ok: false, reason: '手里没有这张牌' };
    if (s.ended) return { ok: false, reason: '本局已结束' };
    if (s.caseId) return { ok: false, reason: '先处理案例' };
    if (s.ap <= 0) return { ok: false, reason: '今年的行动点用完了' };
    if (c.target === 'country' && !cid) return { ok: false, reason: '把这张牌拖到一个国家上' };
    const why = c.cond(this, cid);
    if (why) return { ok: false, reason: why };
    const cost = c.cost(this, cid) || 0;
    if (cost > s.cash + this.creditRoom()) return { ok: false, reason: `要 ${Math.round(cost / 1e4)} 万美元，钱不够` };
    return { ok: true, cost };
  }
  playCard(id, cid) {
    const s = this.s; const chk = this.cardCheck(id, cid);
    if (!chk.ok) return chk;
    const c = this.card(id);
    this.pay(chk.cost);
    const res = c.play(this, cid) || {};
    s.hand.splice(s.hand.indexOf(id), 1);
    s.ap -= 1;
    s.played.push({ id, c: cid || null });
    s.actions.push({ token: 'card', card: id, name: c.name, c: cid || null, cost: chk.cost });
    return { ok: true, cost: chk.cost, title: res.title || c.name, text: res.text || '' };
  }
  cardsView() {
    return this.s.hand.map((id) => { const c = this.card(id); return { id, name: c.name, icon: c.icon, color: c.color, target: c.target, desc: c.desc, tags: c.tags }; });
  }

  // ---------------- 玩家行动 ----------------
  capexFor(cid, level) {
    const base = !this.ind.physical && level === 3 ? 6e6 : CAPEX[level] * (level === 3 && this.ind.factoryMult ? this.ind.factoryMult : 1);
    return base * Math.max(0.5, this.costIdx(cid, this.s.year)) * (1 + 0.02 * (this.s.year - D.START_YEAR));
  }
  campaignCost(cid) {
    const m = (this.fd.campaignMult || 1) * (this.s.trait === 'marketer' ? 0.6 : 1);
    return m * Math.max(1e6, 0.1 * (this.s.countries[cid].rev || 0)) * Math.max(0.5, this.costIdx(cid, this.s.year)) * (1 + 0.01 * Math.max(0, this.s.year - 2024));
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
    const avail = s.cash + this.creditRoom();
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
      const draw = Math.min(-s.cash, this.creditRoom());
      s.debt += draw; s.cash += draw; s.flows.financing += draw;
    }
  }
  setRnd(v) { if (RND[v]) this.s.rnd = v; }
  setPrice(v) { if (PRICE[v]) this.s.price = v; }
  // 经营设置：返回 {ok, cost?, reason?}
  policyInfo(key) {
    for (const g of Object.keys(P.POLICIES)) { const d = P.POLICIES[g].find((x) => x.key === key); if (d) return d; }
    return null;
  }
  policyLock(key) {
    const d = this.policyInfo(key); const s = this.s;
    if (!d || !d.cooldown || !s.policyAt[key]) return 0;
    return Math.max(0, s.policyAt[key] + d.cooldown - s.year);
  }
  setPolicy(key, val) {
    const s = this.s; const d = this.policyInfo(key);
    if (!d || s.ended) return { ok: false, reason: '无效设置' };
    if (key === 'rnd') { this.setRnd(val); return { ok: true }; }
    if (key === 'price') { this.setPrice(val); return { ok: true }; }
    if (!d.opts.some((o) => o.id === val)) return { ok: false, reason: '无效选项' };
    if (d.multi) {
      const cur = s.policy[key]; const i = cur.indexOf(val);
      if (i >= 0) { if (cur.length <= 1) return { ok: false, reason: '至少保留一档产品' }; cur.splice(i, 1); } else cur.push(val);
      return { ok: true };
    }
    if (s.policy[key] === val) return { ok: true };
    if (key === 'channel' && val === 'agent' && s.year < 2030) return { ok: false, reason: 'AI 代理渠道 2030 年后才成熟' };
    const lock = this.policyLock(key);
    if (lock > 0) return { ok: false, reason: `刚调整过，还要等 ${lock} 年` };
    let cost = 0;
    if (key === 'structure') {
      cost = Math.max(2e5, 0.01 * s.lastRev);
      if (cost > s.cash + this.creditRoom()) return { ok: false, reason: '付不起重组费' };
      this.spend(cost); s.flows.capex += cost;
    }
    s.policy[key] = val;
    if (d.cooldown) s.policyAt[key] = s.year;
    return { ok: true, cost };
  }

  // ---------------- 资本运作（每年每种最多一次） ----------------
  capitalView() {
    const s = this.s; const V = s.valuation;
    const bondAmt = clamp(0.4 * s.lastRev, 5e6, 5e6 + 3 * Math.max(0, s.lastEBITDA));
    return {
      bond: { ok: s.lastRev >= 5e7 && !s.yearOps.bond, amount: bondAmt, rate: this.baseRate(s.year) + 0.02 + (s.trait === 'financier' ? -0.005 : 0), reason: s.lastRev < 5e7 ? '年收入 5000 万美元以上才能发债' : '今年已经发过债' },
      equity: { ok: V >= 2e7 && !s.yearOps.equity, amount: 0.15 * V / 0.85 * 0.9, reason: V < 2e7 ? '估值 2000 万美元以上才有人投' : '今年已经融过资' },
      buyback: { ok: !s.yearOps.buyback && s.ownership < 0.995 && s.cash >= 0.05 * V * 1.05 && V > 0, amount: 0.05 * V * 1.05, reason: s.ownership >= 0.995 ? '你已经持有全部股份' : '现金不够回购 5% 股份' },
      ipo: { ok: !s.ipo && s.lastRev >= 1e8 && s.lastNI > 0, amount: 0.18 * V, reason: s.ipo ? `已于 ${s.ipo} 年上市` : '年收入过亿且盈利才能上市' },
      listed: s.ipo
    };
  }
  issueBond() {
    const s = this.s; const v = this.capitalView().bond;
    if (!v.ok) return { ok: false, reason: v.reason };
    s.bonds.push({ amt: v.amount, year: s.year, rate: v.rate });
    s.debt += v.amount; s.cash += v.amount; s.flows.financing += v.amount; s.yearOps.bond = true;
    s.actions.push({ token: 'bond', cost: -v.amount });
    return { ok: true, amount: v.amount };
  }
  raiseEquity() {
    const s = this.s; const v = this.capitalView().equity;
    if (!v.ok) return { ok: false, reason: v.reason };
    s.ownership *= 0.85; s.cash += v.amount; s.flows.financing += v.amount; s.yearOps.equity = true;
    s.actions.push({ token: 'equity', cost: -v.amount });
    return { ok: true, amount: v.amount };
  }
  buyback() {
    const s = this.s; const v = this.capitalView().buyback;
    if (!v.ok) return { ok: false, reason: v.reason };
    s.ownership = Math.min(1, s.ownership / 0.95); s.cash -= v.amount; s.flows.financing -= v.amount; s.yearOps.buyback = true;
    s.actions.push({ token: 'buyback', cost: v.amount });
    return { ok: true, amount: v.amount };
  }
  goPublic() {
    const s = this.s; const v = this.capitalView().ipo;
    if (!v.ok) return { ok: false, reason: v.reason };
    s.ownership *= 0.85; s.cash += v.amount; s.flows.financing += v.amount; s.ipo = s.year;
    s.actions.push({ token: 'ipo', cost: -v.amount });
    return { ok: true, amount: v.amount };
  }
  acquireCost(cid) { return 0.035 * this.market(cid, this.s.year) * (1 + 0.5 * this.s.countries[cid].share); }
  acquireCheck(cid) {
    const s = this.s; const cs = s.countries[cid];
    if (s.ended) return { ok: false, reason: '本局已结束' };
    if (s.caseId) return { ok: false, reason: '先处理案例' };
    if (s.ap <= 0) return { ok: false, reason: '今年的行动点用完了' };
    if (cs.level === 0) return { ok: false, reason: '先进入这个国家，才能收购当地对手' };
    if (s.yearOps['acq' + cid]) return { ok: false, reason: '今年已经在这里收购过' };
    if (this.access(cid, s.year) < 0.6) return { ok: false, reason: '当地监管不批准外资收购' };
    const cost = this.acquireCost(cid);
    if (cost > s.cash + this.creditRoom()) return { ok: false, reason: `收购要 ${Math.round(cost / 1e4)} 万美元，钱不够` };
    return { ok: true, cost };
  }
  acquire(cid) {
    const s = this.s; const chk = this.acquireCheck(cid);
    if (!chk.ok) return chk;
    const cs = s.countries[cid];
    this.spend(chk.cost); s.flows.capex += chk.cost;
    cs.share = Math.min(0.9, cs.share + 0.05 * (1 - cs.share));
    cs.brand = clamp(cs.brand + 4, 0, 100);
    if (cs.level < 2) cs.level = 2;
    s.ap -= 1; s.yearOps['acq' + cid] = true;
    let msg = '收购顺利，份额和渠道都到手了。';
    if (this.rand('market') < 0.3) { s.quality = clamp(s.quality - 3, 0, 100); msg = '收购完成，但整合不顺，产品力下滑了一些。'; }
    s.actions.push({ token: 'acquire', c: cid, cost: chk.cost });
    return { ok: true, cost: chk.cost, msg };
  }

  borrow(amt) {
    const s = this.s; const room = this.creditRoom();
    const a = Math.min(room, amt);
    if (a <= 0) return { ok: false, reason: '信用额度用完了' };
    s.debt += a; s.cash += a; s.flows.financing += a;
    return { ok: true, amount: a };
  }
  repay(amt) {
    const s = this.s; const a = Math.min(amt, this.loans(), Math.max(0, s.cash));
    if (a <= 0) return { ok: false, reason: s.debt <= 0 ? '没有负债' : '现金不够' };
    s.debt -= a; s.cash -= a; s.flows.financing -= a;
    return { ok: true, amount: a };
  }

  // ---------------- 年度结算 ----------------
  endYear() {
    const s = this.s;
    if (s.ended || s.caseId) return false;
    const y = s.year; const ind = this.ind; const ev = this.ev(y); const po = s.policy;
    const rows = {};
    let revenue = 0; let cogs = 0; let sell = 0; let fixed = 0; let foreignRev = 0;
    const gmBase = this.gmAdj(y) + (po.focus === 'cost' ? 0.02 : 0) + ({ low: 0.01, high: -0.012 }[po.pay] || 0) + (po.culture === 'mission' ? -0.005 : 0);
    const costMult = ({ single: 0.96, near: 1.04 }[po.supplier] || 1) * (po.inventory === 'jit' ? 0.98 : 1.01) * (po.local === 'global' ? 0.97 : 1) * (s.trait === 'operator' ? 0.96 : 1);
    const shockK = ({ single: 2, multi: 0.5, near: 1 }[po.supplier] || 1) * (po.inventory === 'buffer' ? 0.5 : 1) * (s.flags.dual && y - s.flags.dual < 10 ? 0.5 : 1);
    const fxK = po.hedge === 'on' ? 0.3 : 1;
    const sellAdj = po.channel === 'omni' ? 0.02 : (po.channel === 'agent' && y >= 2030 ? -0.02 : 0);
    const fixedMult = { lean: 0.85, expand: 1.15 }[po.staff] || 1;
    const infl = (yy) => 1 + 0.03 * (yy - D.START_YEAR);
    for (const c of D.COUNTRIES) {
      const cs = s.countries[c.id];
      const M = this.market(c.id, y);
      const A = this.attract(c.id, y);
      const K = this.compK(c.id, y);
      const target = A / (A + K);
      if (cs.level === 0) cs.share *= 0.3; else cs.share += (target - cs.share) * 0.45;
      const src = this.sourcing(c.id, y);
      let supply = 1;
      if (ind.physical && ev.supply) supply = clamp(1 - (1 - pick(ev.supply, src.from && src.from !== '代工' ? src.from : 'CN')) * shockK, 0.3, 1);
      s.fx[c.id] = 1 + (s.fx[c.id] * pick(ev.fx, c.id) - 1) * 0.85;
      const units = M * cs.share * supply;
      const fxEff = 1 + (Math.sqrt(s.fx[c.id]) - 1) * (c.id === s.hq ? 1 : fxK);
      const rev = units * PRICE[s.price].mult * fxEff;
      const line = cs.level > 0 ? this.bestLine(c.id, y).line : 'mid';
      const unitCost = Math.max(0.05, 1 - ind.gm - gmBase - P.LINE_GM[line] - this.gmC(c.id, y));
      const cg = units * unitCost * src.cost * costMult;
      const sl = rev * Math.max(0.01, SELL_COST[cs.level] * (ind.id === 'software' ? 2.2 : 1) + (cs.level > 0 ? sellAdj : 0));
      const fx = FIXED[cs.level] * Math.max(0.4, this.costIdx(c.id, y)) * infl(y) * fixedMult * (c.id !== s.hq && po.local === 'deep' ? 1.15 : 1);
      revenue += rev; cogs += cg; sell += sl; fixed += fx;
      if (c.id !== s.hq) foreignRev += rev;
      rows[c.id] = { market: M, share: cs.share, rev, cogs: cg, sell: sl, fixed: fx, profit: rev - cg - sl - fx, source: src.from, level: cs.level, line: cs.level > 0 ? line : null };
      cs.rev = rev; cs.profit = rows[c.id].profit;
    }
    const small = clamp(revenue / 3e7, 0.25, 1); // 小公司的研发底线和总部费用按规模缩放
    const rnd = Math.max(RND[s.rnd].min * small, RND[s.rnd].pct * revenue * (s.industry === 'software' || s.industry === 'pharma' ? 1.4 : 1)) + (po.focus === 'innovate' ? 0.01 * revenue : 0);
    let hq = (0.5e6 * small + 0.03 * revenue) * (po.structure === 'central' ? 0.8 : 1);
    hq += revenue * (({ regional: 0.01, matrix: 0.006 }[po.structure] || 0) + (po.ceo === 'pro' ? 0.005 : 0) + (po.ceo === 'star' ? 0.012 : 0) + 0.006 * (po.lines.length - 1));
    if (po.ceo === 'star') hq += 2e6 * (1 + 0.02 * (y - D.START_YEAR));
    if (po.hedge === 'on') hq += 0.004 * foreignRev;
    if (s.ipo) hq += 1e6 * small;
    const campaign = s.flows.campaign || 0;
    const bondT = this.bondTotal();
    const interest = this.loans() * this.loanRate() + s.bonds.reduce((a2, b2) => a2 + b2.amt * b2.rate, 0);
    const interestIncome = Math.max(0, s.cash) * this.baseRate(y) * 0.5;
    const ebitda = revenue - cogs - sell - fixed - rnd - hq - campaign;
    const ebt = ebitda - interest + interestIncome;
    let taxable = ebt;
    if (taxable > 0 && s.lossCarry > 0) { const use = Math.min(taxable, s.lossCarry); taxable -= use; s.lossCarry -= use; }
    if (ebt < 0) s.lossCarry += -ebt;
    const tax = taxable > 0 ? taxable * TAX : 0;
    const net = ebt - tax;
    s.cash += net + campaign; // 营销费在投放时已付现，这里只把其余利润计入现金

    // 分红
    let dividend = 0;
    if (net > 0 && po.payout !== 'none' && s.cash > 0) {
      dividend = Math.min(s.cash * 0.8, net * (po.payout === 'most' ? 0.7 : 0.3));
      s.cash -= dividend; s.wealth += dividend * s.ownership;
    }
    // 到期债券
    let bondRepaid = 0;
    const due = s.bonds.filter((b2) => y - b2.year >= 7);
    if (due.length) {
      for (const b2 of due) bondRepaid += b2.amt;
      s.bonds = s.bonds.filter((b2) => y - b2.year < 7);
      s.cash -= bondRepaid; s.debt -= bondRepaid;
    }

    // 现金不够：动用信用额度；还不够就重组；重组次数用完就破产
    let restructured = null; let bankrupt = null;
    if (s.cash < 0) {
      const draw = Math.min(-s.cash, Math.max(0, this.creditMult() * Math.max(4e6, 2.5 * Math.max(0, ebitda)) - this.loans()));
      s.debt += draw; s.cash += draw; s.flows.financing += draw;
    }
    if (s.cash < 0) {
      if (s.restructures < this.maxRestructure() && revenue > 1e6) restructured = this.restructure(revenue);
      else bankrupt = { year: y, cash: s.cash, debt: s.debt, revenue, why: revenue <= 1e6 ? '收入几乎归零，没有投资人愿意接手' : `已经重组过 ${s.restructures} 次，债权人和投资人不再给机会` };
    }

    // 品牌与产品力
    const act = D.COUNTRIES.filter((c) => s.countries[c.id].level > 0);
    const avgBrand = act.reduce((a2, c) => a2 + s.countries[c.id].brand, 0) / Math.max(1, act.length);
    const bAdj = (s.trait === 'marketer' ? 1 : 0) + (po.staff === 'lean' ? -1 : 0) + ({ wolf: -0.5, mission: 1 }[po.culture] || 0);
    for (const c of D.COUNTRIES) {
      const cs = s.countries[c.id];
      if (cs.level === 0) { cs.brand *= 0.85; continue; }
      const gain = [0, 1.5, 4, 4][cs.level] + (cs.campaign ? 12 : 0) + PRICE[s.price].brand + 0.06 * (avgBrand - cs.brand) + bAdj;
      cs.brand = clamp(cs.brand * 0.95 + gain, 0, 100);
    }
    const dqAdj = ({ quality: 1.5, cost: -1 }[po.focus] || 0) + ({ lean: -1, expand: 1 }[po.staff] || 0) + ({ low: -1, high: 1 }[po.pay] || 0)
      + (po.structure === 'matrix' ? 0.5 : 0) + (po.culture === 'engineer' ? 1 : 0) + (s.trait === 'engineer' ? 0.8 : 0) + (this.fd.dqBonus || 0) + (s.flags.esop && y - s.flags.esop < 5 ? 0.5 : 0);
    const dq = RND[s.rnd].dq - DRIFT[s.industry] + 1 + dqAdj;
    s.quality = clamp(s.quality + (dq > 0 ? dq * (1 - s.quality / 110) : dq), 0, 100);
    let breakthrough = false;
    if (po.focus === 'innovate' && !bankrupt && this.rand('market') < 0.12) {
      breakthrough = true; s.quality = clamp(s.quality + 8, 0, 100);
      for (const c of act) s.countries[c.id].brand = clamp(s.countries[c.id].brand + 5, 0, 100);
    }

    // 估值
    const ni2 = (net + s.lastNI) / 2;
    const sent = this.sentiment(y) * (po.ceo === 'star' ? 1.1 : 1) * (s.ipo ? 1.15 : 1);
    // 市场情绪随机游走 + 增长溢价：收入下滑时估值会被狠狠打折
    const ga = this.rand('market'); const gb = this.rand('market');
    const gauss = Math.sqrt(-2 * Math.log(Math.max(1e-9, ga))) * Math.cos(2 * Math.PI * gb);
    s.mood = clamp(0.55 * (s.mood || 0) + 0.2 * gauss, -0.9, 0.9);
    const growth = s.lastRev > 0 ? revenue / s.lastRev - 1 : 0;
    const gMult = clamp(1 + 2.2 * growth, 0.45, 2.0);
    s.valuation = bankrupt ? 0 : Math.max(0, Math.max(0, Math.max(0, ni2) * ind.pe + revenue * PS[s.industry]) * sent * gMult * Math.exp(s.mood) + s.cash - s.debt);
    s.lastNI = net; s.lastRev = revenue; s.lastEBITDA = ebitda;

    const f = s.flows;
    const report = {
      year: y, headline: ev.headline, future: !!ev.future, revenue, cogs, sell, fixed, rnd, hq, campaign, interest: interest - interestIncome, tax, net, ebitda,
      capex: f.capex, caseCash: f.caseCash, refunds: f.refunds, financing: f.financing, dividend, bondRepaid, cashStart: f.cashStart, cashEnd: s.cash, debt: s.debt,
      valuation: s.valuation, sentiment: sent, mood: s.mood, growth, rows, restructured, bankrupt, breakthrough, actions: s.actions.slice(), news: s.news.slice()
    };
    // 恒等式：期末现金 = 期初 − 资本开支 + 案例现金 + 撤出回收 + 净融资 + 净利润 − 分红 − 还债券 + 重组注入
    report.check = f.cashStart - f.capex + f.caseCash + f.refunds + f.financing + net - dividend - bondRepaid + (restructured ? restructured.cashIn : 0) - s.cash;
    s.report = report;
    s.history.push({ year: y, revenue, net, cash: s.cash, debt: s.debt, valuation: s.valuation, restructured: !!restructured, bankrupt: !!bankrupt, wealth: s.wealth, countries: Object.fromEntries(D.COUNTRIES.map((c) => [c.id, { rev: rows[c.id].rev, level: rows[c.id].level, share: rows[c.id].share }])) });
    s.mods = s.mods.filter((m) => m.to >= y + 1);

    if (bankrupt) { s.bankrupt = bankrupt; s.ended = true; s.endings = this.endings(); s.ap = 0; return true; }
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
    // 投资人注资 + 债权人打折（债券一并打折）
    const need = Math.max(0, -(s.cash + cashIn)) + Math.max(3e6, 0.2 * revenue);
    const before = s.cash;
    s.cash = s.cash + cashIn + need;
    s.ownership *= 0.6;
    const haircut = s.debt * 0.5;
    s.debt -= haircut;
    for (const b of s.bonds) b.amt *= 0.5;
    s.restructures += 1;
    for (const c of D.COUNTRIES) s.countries[c.id].brand = Math.max(0, s.countries[c.id].brand - 5);
    return { sold, injected: need, haircut, cashIn: cashIn + need, cashBefore: before, left: this.maxRestructure() - s.restructures };
  }

  // ---------------- 结局 ----------------
  endings() {
    const s = this.s;
    const last = s.history[s.history.length - 1];
    if (s.bankrupt) {
      const E = [{ id: 'BANKRUPT', name: '破产清算', text: `${s.bankrupt.year} 年，${s.bankrupt.why}。公司走到了尽头。` }];
      if (s.wealth >= 1e8) E.push({ id: 'GOLDEN', name: '公司没了钱还在', text: '好在这些年分红落袋，你个人还算体面。' });
      const peak = Math.max(...s.history.map((h) => h.valuation));
      if (peak >= 1e9) E.push({ id: 'ICARUS', name: '伊卡洛斯', text: '飞得最高的时候估值超过十亿美元，最后还是坠落了。' });
      return E.slice(0, 3).map((e, i) => ({ id: e.id, name: e.name, text: e.text, role: i === 0 ? 'primary' : 'secondary' }));
    }
    const V = s.valuation;
    // 金额门槛按名义经济规模放大：2074 年的十亿美元不如 2024 年值钱
    const W = (yy) => D.COUNTRIES.reduce((acc, c) => acc + this.gdp(c.id, yy), 0);
    const G = Math.max(1, W(s.year) / W(Math.min(s.year, D.HIST_END)));
    const rev = last ? last.revenue : 0;
    const by = (ids) => ids.reduce((acc, id) => acc + (last ? last.countries[id].rev : 0), 0) / Math.max(1, rev);
    const regions = { americas: [], asia: [], europe: [] };
    for (const c of D.COUNTRIES) regions[c.region].push(c.id);
    const maxRegion = Math.max(...Object.values(regions).map(by));
    const wide = D.COUNTRIES.filter((c) => s.countries[c.id].level >= 2).length;
    const home = by([s.hq]);
    const emerging = by(['CN', 'IN', 'BR', 'MX', 'VN'].filter((x) => x !== s.hq));
    const sy = s.startYear || D.START_YEAR;
    const yrs = s.year - sy + 1;
    const lowCostFactories = ['CN', 'VN', 'IN', 'MX'].filter((c) => c !== s.hq && s.countries[c].level >= 3).length;
    const peakV = Math.max(...s.history.map((h) => h.valuation));
    const cheated = s.caseLog.some((c) => c.id === 'A3_EMISSION' && c.outcome === '东窗事发');
    const fut = s.caseLog.filter((c) => c.future).length;
    const E = [
      { id: 'EMPIRE', name: '百年帝国', ok: V >= 2e11 * G && wide >= 7, text: '你的公司横跨大半个世纪，成了全世界最有价值的企业之一。' },
      { id: 'CENTURY', name: '穿越周期', ok: sy <= 2005 && V >= 4e10 * G && s.restructures === 0, text: '从上个世纪一路走到 2070 年代，熬过了每一次危机。' },
      { id: 'UNICORN', name: '超级独角兽', ok: s.founder === 'vc' && V >= 2.5e10 * G, text: '投资人的钱没有白花，你把公司做成了巨头。' },
      { id: 'DYNASTY', name: '百年老店', ok: s.founder === 'family' && s.ownership >= 0.99 && s.restructures === 0 && V >= 5e9 * G, text: '股份一直握在家族手里，公司已经传了好几代。' },
      { id: 'SOE_REBORN', name: '老树新花', ok: s.founder === 'soe' && V >= 1.5e10 * G, text: '从笨重的国企车间起步，变成了一家有活力的现代企业。' },
      { id: 'COOP', name: '共同富裕', ok: s.founder === 'coop' && V >= 5e9 * G, text: '公司属于每一位员工，大家一起把它做大了。' },
      { id: 'WEALTH', name: '富可敌国', ok: s.wealth >= 4e9 * G, text: '这些年分到你手里的钱，已经够买下一座城市。' },
      { id: 'FUTURIST', name: '未来已来', ok: sy >= 2025 && V >= 1e10 * G, text: '在没人能看清的五十年里，你押对了方向。' },
      { id: 'LATECOMER', name: '后发先至', ok: sy === 2015 && V >= 1e10 * G, text: '起步晚了二十年，却追上了老前辈。' },
      { id: 'GIANT', name: '全球巨头', ok: V >= 5e10 * G && wide >= 6, text: '你的公司遍布全球，跻身世界级企业之列。' },
      { id: 'PHOENIX', name: '浴火重生', ok: s.restructures > 0 && V >= 1e9 * G, text: '经历过重组，又重新站了起来。' },
      { id: 'GLOBAL', name: '全球玩家', ok: wide >= 6 && home < 0.5 && V >= 1e9 * G, text: '六个以上国家有你的分公司或工厂，一半以上的收入来自海外。' },
      { id: 'REGIONAL', name: '区域霸主', ok: V >= 5e9 * G && maxRegion >= 0.6 && home < 0.75, text: '你在一个大区里称王。' },
      { id: 'HOME_KING', name: '本土之王', ok: home >= 0.75 && V >= 5e8 * G, text: '主场就是你的城堡。' },
      { id: 'TECH', name: '技术信仰', ok: s.quality >= 97 && V >= 5e9 * G, text: '你始终相信产品力，市场最终给了回报。' },
      { id: 'CHAMPION', name: '隐形冠军', ok: V >= 5e8 * G && V < 5e10 * G && s.quality >= 70, text: '规模不算最大，产品力却是一流。' },
      { id: 'EMERGING', name: '新兴市场先锋', ok: emerging >= 0.5, text: '一半以上的收入来自新兴市场。' },
      { id: 'FACTORY', name: '世界工厂主', ok: this.ind.physical && lowCostFactories >= 2 && V >= 2e9 * G, text: '你在多个低成本国家建起了工厂，把全球供应链握在手里。' },
      { id: 'PUBLIC', name: '敲钟上市', ok: !!s.ipo && V >= 1e9 * G, text: `${s.ipo} 年敲钟上市，之后一直是资本市场的宠儿。` },
      { id: 'SEER', name: '先知', ok: fut >= 12 && V >= 3e9 * G, text: '未来的每一个十字路口，你都做了自己的判断。' },
      { id: 'SURVIVOR', name: '屡败屡战', ok: s.restructures >= 2, text: '重组了不止一次，可你始终没有放弃。' },
      { id: 'FALLEN', name: '盛极而衰', ok: peakV >= 4 * Math.max(V, 1) && peakV >= 2e9, text: '巅峰时估值是现在的好几倍，没能守住。' },
      { id: 'SCANDAL', name: '丑闻缠身', ok: cheated, text: '一次侥幸，代价是几十年的信任。' },
      { id: 'STEADY', name: '稳健经营者', ok: s.restructures === 0 && s.debt < 0.5 * rev && V >= 2e8 * G, text: '没有大起大落，一步一个脚印。' }
    ].filter((e) => e.ok);
    if (!E.length) E.push({ id: 'UNFINISHED', name: '创业未竟', text: `${yrs} 年过去，故事还没讲完。` });
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
      isHQ: cid === s.hq, income: this.income(cid, y), line: cs.level > 0 ? this.bestLine(cid, y).line : null,
      acquire: this.acquireCheck(cid), acquireCost: this.acquireCost(cid)
    };
  }
}

BizLife.D = D; BizLife.F = F; BizLife.P = P;

module.exports = { BizLife, VERSION, D, F, P, CASES, BIZ_EVENTS, LEVELS, LEVELS_SW, fnv1a32, country, industry };
