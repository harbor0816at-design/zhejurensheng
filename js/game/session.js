// 对局会话：创建 / 存档 / 读档
const { BizLife, VERSION, D } = require('../biz/engine.js');
const config = require('../config.js');

function randomSeed() { return `BIZ-${Math.floor(Math.random() * 9e4) + 1e4}`; }
function normalizeSeed(s) { return String(s || '').trim().slice(0, 40); }

function create(setup) {
  return BizLife.create(normalizeSeed(setup.seed) || randomSeed(), { industry: setup.industry, hq: setup.hq, name: setup.name, startYear: setup.startYear, founder: setup.founder });
}
function save(storage, life) { if (life) storage.set(config.saveKey, life.toJSON()); }
function load(storage) {
  const raw = storage.get(config.saveKey);
  if (!raw) return null;
  try {
    const life = BizLife.fromJSON(raw);
    if (!life.s || life.s.v !== VERSION) return null;
    return life;
  } catch (e) { return null; }
}
function clear(storage) { storage.remove(config.saveKey); }

module.exports = { BizLife, D, create, save, load, clear, randomSeed, normalizeSeed };
