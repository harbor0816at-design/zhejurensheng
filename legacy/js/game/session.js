// 对局会话：创建 / 存档 / 读档，以及界面要用的派生数据（从本地版界面逻辑移植）。
const E = require('../engine/engine.js');
const config = require('../config.js');
const { subName } = require('./format.js');

const rules = E.ruleset;

function randomSeed() {
  return `LIFE-${Math.floor(Math.random() * 9e4) + 1e4}`;
}
function normalizeSeed(s) {
  return String(s || '').trim().slice(0, 40);
}

function create(seed) {
  return E.LifeEngine.create(normalizeSeed(seed) || randomSeed(), { auto: 'manual' }, rules);
}

function save(storage, life) {
  if (!life) return;
  storage.set(config.saveKey, life.toJSON());
}
function load(storage) {
  const raw = storage.get(config.saveKey);
  if (!raw) return null;
  try {
    const life = E.LifeEngine.fromJSON(raw, { auto: 'manual' }, rules);
    if (life.s.content_ver !== rules.content_ver) return null; // 内容版本变了，旧档作废
    return life;
  } catch (e) {
    return null;
  }
}
function clear(storage) { storage.remove(config.saveKey); }

const city = (id) => rules.economy.opening.city_econ_types.find((c) => c.id === id);
const era = (id) => rules.economy.opening.eras.find((e) => e.id === id);
const talent = (id) => rules.dev.talents.find((t) => t.id === id);

// 资产负债快照
function balance(life) {
  const s = life.s;
  const c = life.c;
  const info = E.runwayInfo(s, c);
  const liabilities = {};
  for (const l of s.loans) liabilities[l.kind] = (liabilities[l.kind] || 0) + l.principal;
  const mort = s.loans.find((l) => l.kind === 'mortgage');
  let mortgage = null;
  if (mort) {
    const p = E.loanPayment(mort);
    mortgage = { principal: mort.principal, rate: mort.rate, term_left: mort.term_left, annual: p.interest + p.principal };
  }
  return {
    cash: s.cash,
    assets: Object.assign({}, s.assets),
    venture_equity: s.venture && s.venture.active ? s.venture.equity_value : 0,
    liabilities,
    liabilities_total: E.totalDebt(s),
    net_worth: E.netWorth(s),
    liquid: Number(info.liquid),
    runway_months: Number(info.runway_months),
    debt_service_next: E.debtService(s),
    house_price: E.housePrice(s, c),
    min_down_payment: Number(info.min_down_payment),
    mortgage
  };
}

// 某一年的现金流水汇总
function yearLedger(s, age) {
  const map = new Map();
  const totals = { I: 0, E: 0, T: 0, D: 0, F: 0 };
  for (const e of s.ledger) {
    if (e.age !== age || e.signed === 0) continue;
    const k = e.account + '|' + e.sub;
    const it = map.get(k) || { account: e.account, sub: e.sub, name: subName(e.sub), signed: 0 };
    it.signed += e.signed;
    map.set(k, it);
    totals[e.account] += e.signed;
  }
  const order = ['I', 'E', 'T', 'D', 'F'];
  const lines = Array.from(map.values()).sort((a, b) => order.indexOf(a.account) - order.indexOf(b.account) || Math.abs(b.signed) - Math.abs(a.signed));
  return { lines, totals };
}

function curve(s) {
  return s.history.map((h) => ({ age: h.age, nw: h.net_worth, real: h.net_worth / (h.price_level || 1), crunch: h.crunch, bankrupt: h.bankrupt }));
}

function keyDecisions(s, n) {
  return s.decisions.filter((d) => d.counted !== false)
    .slice().sort((a, b) => Math.abs(b.result_delta.nw || 0) - Math.abs(a.result_delta.nw || 0))
    .slice(0, n || 3)
    .sort((a, b) => a.age - b.age)
    .map((d) => ({ age: d.age, title: d.title, option: d.option_text, outcome: d.outcome_title, nw_delta: d.result_delta.nw || 0 }));
}

function primaryTitle(s) {
  const p = (s.endings || []).find((e) => e.role === 'primary');
  return p ? p.name : '';
}

module.exports = { E, rules, create, save, load, clear, randomSeed, normalizeSeed, city, era, talent, balance, yearLedger, curve, keyDecisions, primaryTitle };
