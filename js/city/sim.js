// 城市模拟引擎（当市长模式）：确定性、可复现、与界面无关。
// 一个 tick = 一个月。地图 N×N，每格一种地形 + 一种用途。
const M = require('./maps.js');
const SC = require('./scenarios.js');

const VERSION = 'city-2.0.0';
const N = M.N;
const T_GRASS = 0; const T_WATER = 1; const T_FOREST = 2; const T_SAND = 3; const T_ROCK = 4; const T_DESERT = 5;
const K = { NONE: 0, ROAD: 1, R: 2, C: 3, I: 4, POWER: 10, WATER: 11, FIRE: 12, POLICE: 13, CLINIC: 14, SCHOOL: 15, PARK: 16, METRO: 17 };
const ZONES = {
  [K.R]: { name: '住宅', cap: [0, 8, 24, 70, 160], maxLv: 4, power: 1, water: 1 },
  [K.C]: { name: '商业', cap: [0, 5, 14, 36, 90], maxLv: 4, power: 1.5, water: 1 },
  [K.I]: { name: '工业', cap: [0, 8, 18, 36, 36], maxLv: 3, power: 2, water: 1.5 }
};
const SERVICES = {
  [K.POWER]: { id: 'power', name: '燃煤电厂', cost: 6000, upkeep: 200, cap: 420, unlock: 0, desc: '供电 420 单位，有污染' },
  [K.WATER]: { id: 'water', name: '自来水厂', cost: 4000, upkeep: 150, cap: 420, unlock: 0, desc: '供水 420 单位' },
  [K.PARK]: { id: 'park', name: '公园', cost: 300, upkeep: 15, radius: 3, unlock: 0, desc: '周边地价 +15' },
  [K.FIRE]: { id: 'fire', name: '消防站', cost: 2500, upkeep: 250, radius: 7, unlock: 300, desc: '覆盖区火灾大幅减少' },
  [K.POLICE]: { id: 'police', name: '警察局', cost: 2500, upkeep: 250, radius: 7, unlock: 300, desc: '覆盖区治安好，地价 +8' },
  [K.CLINIC]: { id: 'clinic', name: '医院', cost: 3500, upkeep: 350, radius: 8, unlock: 1000, desc: '地价 +8，高楼需要' },
  [K.SCHOOL]: { id: 'school', name: '学校', cost: 4000, upkeep: 350, radius: 8, unlock: 1000, desc: '地价 +8，高楼需要' },
  [K.METRO]: { id: 'metro', name: '地铁站', cost: 8000, upkeep: 500, radius: 6, unlock: 10000, desc: '周边地价 +20，摩天楼需要' }
};
const ROAD_COST = 10; const BRIDGE_COST = 60; const ZONE_COST = 5; const ROAD_UPKEEP = 1;
const TITLES = [[0, '小村'], [500, '小镇'], [2000, '城镇'], [5000, '城市'], [15000, '大城市'], [40000, '都市'], [80000, '超级都市']];
const LV_CAP = (pop) => (pop >= 8000 ? 4 : pop >= 2500 ? 3 : 2);
const TER_NAME = ['草地', '水面', '树林', '沙滩', '山地', '沙漠'];

function fnv(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i) & 0xff; h = Math.imul(h, 0x01000193) >>> 0; h ^= str.charCodeAt(i) >>> 8; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
function rnd(st) { let t = (st.r = (st.r + 0x6d2b79f5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const idx = (x, y) => y * N + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function group(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
const scenarioOf = (id) => SC.SCENARIOS.find((x) => x.id === id);

function mergeRules(list) {
  const r = { dem: { R: 0, C: 0, I: 0 }, pol: 1, income: 1, fire: 1, powerCap: 1, upkeep: 1, park: 1, rockRoad: 4, waterCost: 1, disaster: 0 };
  for (const x of list) {
    if (!x) continue;
    for (const k of Object.keys(x)) {
      if (k === 'dem') for (const d of Object.keys(x.dem)) r.dem[d] += x.dem[d];
      else if (['pol', 'income', 'fire', 'powerCap', 'upkeep', 'park', 'waterCost'].indexOf(k) >= 0) r[k] *= x[k];
      else r[k] = x[k];
    }
  }
  return r;
}

class CitySim {
  // o: { mode:'scenario', scenario } 或 { mode:'sandbox', map, money, challenges:[], seed }
  static create(o) {
    o = o || {};
    const mode = o.mode === 'scenario' ? 'scenario' : 'sandbox';
    const sc = mode === 'scenario' ? scenarioOf(o.scenario) || SC.SCENARIOS[0] : null;
    const seed = String(o.seed || (sc ? `${sc.id.toUpperCase()}-${sc.start}` : `CITY-${Math.floor(Math.random() * 9e4) + 1e4}`));
    const st = { r: fnv(`${seed}|${VERSION}|map`) };
    const r = () => rnd(st);
    const mapId = o.map && M.SANDBOX_MAPS[o.map] ? o.map : 'river';
    const ter = sc ? M.SCENARIO_MAPS[sc.id](r) : M.SANDBOX_MAPS[mapId].gen(r);
    const ml = SC.MONEY_LEVELS.find((x) => x.id === o.money) || SC.MONEY_LEVELS[1];
    const challenges = mode === 'sandbox' ? (o.challenges || []).filter((c) => SC.CHALLENGES.some((x) => x.id === c)) : [];
    const s = {
      v: VERSION, mode, scenario: sc ? sc.id : null, map: sc ? null : mapId, challenges, seed,
      name: sc ? sc.name.replace(/ \d+$/, '') : M.SANDBOX_MAPS[mapId].name + '新城',
      month: 0, startYear: sc ? sc.start : 2000, endYear: sc ? sc.end : null,
      money: sc ? sc.money : ml.money, tax: { R: 9, C: 9, I: 9 }, ter,
      kind: new Array(N * N).fill(0), lv: new Array(N * N).fill(0), bad: new Array(N * N).fill(0),
      rng: { r: fnv(`${seed}|${VERSION}|sim`) },
      mods: [], ruleAdds: [], unlocked: [], firedEvents: [], goals: [], news: [], ended: false, freePlay: false,
      maxPop: 0, loans: 0, lastIncome: 0, lastExpense: 0, history: [], startPop: 0, focus: null, pendingEvent: null
    };
    const sim = new CitySim(s);
    if (sc && sc.prebuilt) sim.prebuild(sc.prebuilt, r);
    if (sc && sc.id === 'shenzhen') sim.seedVillage();
    sim.recompute();
    s.startPop = sim.st.pop; s.maxPop = sim.st.pop;
    if (sc) s.goals = sc.goals.map((g) => Object.assign({}, g, { done: null })).sort((a, b) => a.by - b.by);
    if (!s.focus) s.focus = sim.findFocus();
    if (sc) sim.fireEvents();
    return sim;
  }
  static fromJSON(j) { return new CitySim(typeof j === 'string' ? JSON.parse(j) : j); }
  constructor(s) { this.s = s; this.d = null; }
  toJSON() { return JSON.stringify(this.s); }

  get year() { return this.s.startYear + Math.floor(this.s.month / 12); }
  get monthOfYear() { return (this.s.month % 12) + 1; }
  get scenario() { return this.s.scenario ? scenarioOf(this.s.scenario) : null; }
  rules() {
    const sc = this.scenario;
    const list = [sc ? sc.rules : null].concat(this.s.challenges.map((c) => (SC.CHALLENGES.find((x) => x.id === c) || {}).rules), this.s.ruleAdds);
    const r = mergeRules(list);
    r.waterCapMult = r.waterCap && !r.waterCapOff && this.year <= r.waterCap.until ? r.waterCap.mult : 1;
    return r;
  }

  findFocus() {
    const s = this.s; let best = [N / 2, N / 2]; let bs = -1;
    for (let y = 6; y < N - 6; y += 2) for (let x = 6; x < N - 6; x += 2) {
      let sc = 0; for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { const t = s.ter[idx(x + dx, y + dy)]; if (t === T_GRASS || t === T_DESERT || t === T_SAND) sc++; }
      if (sc > bs) { bs = sc; best = [x, y]; }
    }
    return best;
  }

  // ---------------- 剧本开局 ----------------
  seedVillage() {
    const s = this.s; let vx = 0; let vy = 0;
    for (let y = N - 1; y >= 0 && !vx; y--) for (let x = N - 1; x >= 0; x--) if (s.ter[idx(x, y)] === T_GRASS && x + y < 40 && x + y > 36 && x > 10 && y > 10) { vx = x; vy = y; break; }
    if (!vx) { vx = 18; vy = 18; }
    for (let k = -3; k <= 3; k++) this.setRoad(vx + k, vy - 2);
    for (let k = -2; k <= 2; k++) { const x = vx + k; const y = vy - 3; if (inb(x, y) && s.ter[idx(x, y)] !== T_WATER) { s.kind[idx(x, y)] = K.R; s.lv[idx(x, y)] = k % 2 ? 1 : 0; s.ter[idx(x, y)] = T_GRASS; } }
    if (inb(vx, vy - 1)) { s.kind[idx(vx, vy - 1)] = K.C; s.lv[idx(vx, vy - 1)] = 1; s.ter[idx(vx, vy - 1)] = T_GRASS; }
    s.focus = [vx, vy - 2];
  }
  prebuild(kind) {
    const s = this.s;
    const put = (x, y, k, l) => { if (!inb(x, y)) return; const i = idx(x, y); if (k !== K.ROAD && (s.ter[i] === T_WATER || s.ter[i] === T_ROCK)) return; if (s.ter[i] === T_FOREST) s.ter[i] = T_GRASS; s.kind[i] = k; s.lv[i] = l; };
    if (kind === 'oldtown') { // 江西岸的老城：密、低矮、混合
      for (let y = 1; y < N - 1; y++) for (let x = 0; x < N; x++) {
        if (s.ter[idx(x, y)] === T_WATER) break;
        if (y % 4 === 0 || x % 3 === 0) put(x, y, K.ROAD, 0);
        else put(x, y, (x + y) % 5 === 0 ? K.C : K.R, (x * y) % 3 === 0 ? 2 : 1);
      }
      put(1, 2, K.POWER, 1); put(1, 6, K.WATER, 1);
      let x = 0; while (x < N && s.ter[idx(x, 16)] !== T_WATER) x++;
      while (x < N && s.ter[idx(x, 16)] === T_WATER) { put(x, 16, K.ROAD, 0); x++; } // 一座跨江桥
      for (let k = 0; k < 3 && x < N; k++, x++) put(x, 16, K.ROAD, 0);
      s.focus = [11, 16];
    }
    if (kind === 'motorcity') { // 汽车城：大片工业 + 工人住宅
      for (let y = 4; y < N - 7; y++) for (let x = 3; x < N - 3; x++) {
        if (y % 5 === 4 || x % 5 === 3) { put(x, y, K.ROAD, 0); continue; }
        const ind = y > 17 || x > 23;
        put(x, y, ind ? K.I : (x + y) % 6 === 0 ? K.C : K.R, ind ? 2 + (x % 2) : 1 + ((x + y) % 3 === 0 ? 1 : 0));
      }
      for (const y of [9, 14, 19, 24]) { put(2, y, K.ROAD, 0); }
      put(1, 9, K.POWER, 1); put(1, 14, K.POWER, 1); put(1, 19, K.WATER, 1); put(1, 24, K.WATER, 1);
      put(12, 10, K.FIRE, 1); put(7, 7, K.POLICE, 1); put(17, 12, K.SCHOOL, 1); put(12, 15, K.CLINIC, 1);
      s.focus = [15, 14];
      s.unlocked.push(K.FIRE, K.POLICE, K.CLINIC, K.SCHOOL);
    }
  }
  setRoad(x, y) { if (!inb(x, y)) return; const i = idx(x, y); this.s.kind[i] = K.ROAD; this.s.lv[i] = 0; if (this.s.ter[i] === T_FOREST) this.s.ter[i] = T_GRASS; }

  // ---------------- 建造 ----------------
  toolInfo(tool) {
    const map = { road: { k: K.ROAD, name: '道路' }, R: { k: K.R, name: '住宅区' }, C: { k: K.C, name: '商业区' }, I: { k: K.I, name: '工业区' }, bulldoze: { k: -1, name: '推土机' } };
    if (map[tool]) return map[tool];
    for (const k of Object.keys(SERVICES)) if (SERVICES[k].id === tool) return { k: +k, name: SERVICES[k].name, svc: SERVICES[k] };
    return null;
  }
  metroEvent() { const sc = this.scenario; return sc ? sc.events.find((e) => e.unlock === 'metro') : null; }
  metroGated() { return !!this.metroEvent() && this.s.unlocked.indexOf(K.METRO) < 0; }
  unlockedTool(tool) {
    const t = this.toolInfo(tool);
    if (!t || !t.svc) return { ok: true };
    const s = this.s;
    if (s.unlocked.indexOf(t.k) >= 0) return { ok: true };
    if (t.k === K.METRO && this.metroGated()) { const e = this.metroEvent(); return { ok: false, reason: `${e.year} 年「${e.title}」后解锁` }; }
    if (s.maxPop < t.svc.unlock) return { ok: false, reason: `人口达到 ${group(t.svc.unlock)} 解锁` };
    return { ok: true };
  }
  serviceCost(k) { return Math.round(SERVICES[k].cost * (k === K.WATER ? this.rules().waterCost : 1)); }
  plan(tool, cells) {
    const s = this.s;
    const t = this.toolInfo(tool);
    if (!t) return { ok: false, reason: '未知工具' };
    const u = this.unlockedTool(tool);
    if (!u.ok) return { ok: false, reason: u.reason };
    const rules = this.rules();
    let cost = 0; const valid = []; let lastReason = '';
    for (const [x, y] of cells) {
      if (!inb(x, y)) continue;
      const i = idx(x, y); const k = s.kind[i]; const ter = s.ter[i];
      const emptyZone = k >= K.R && k <= K.I && s.lv[i] === 0;
      if (t.k === -1) { if (k !== K.NONE || ter === T_FOREST) { valid.push([x, y]); cost += 1; } continue; }
      if (t.k === K.ROAD) {
        if (k === K.ROAD) continue;
        if (k !== K.NONE && !emptyZone) continue;
        valid.push([x, y]); cost += ter === T_WATER ? BRIDGE_COST : ter === T_ROCK ? ROAD_COST * rules.rockRoad : ROAD_COST; continue;
      }
      if (ter === T_WATER) { lastReason = '水面上只能修桥'; continue; }
      if (ter === T_ROCK) { lastReason = '山地上只能修路（隧道）'; continue; }
      if (t.k >= K.R && t.k <= K.I) {
        if (k === t.k) continue;
        if (k !== K.NONE && !emptyZone) continue;
        valid.push([x, y]); cost += ZONE_COST; continue;
      }
      if (k !== K.NONE && !emptyZone) return { ok: false, reason: '这里已经有东西了' };
      if (!this.adjRoad(x, y, 1)) return { ok: false, reason: '要紧挨着道路' };
      if (t.k === K.WATER && rules.waterCoast && !this.nearTer(x, y, T_WATER, 1)) return { ok: false, reason: '只能靠海水淡化：水厂要建在水边' };
      valid.push([x, y]); cost += this.serviceCost(t.k);
      break;
    }
    if (!valid.length) return { ok: false, reason: lastReason || (t.k === -1 ? '这里没东西可拆' : '这里建不了') };
    if (cost > s.money) return { ok: false, cost, cells: valid, reason: `要 ¥${group(cost)}，钱不够` };
    return { ok: true, cost, cells: valid };
  }
  build(tool, cells) {
    const p = this.plan(tool, cells);
    if (!p.ok) return p;
    const s = this.s; const t = this.toolInfo(tool);
    for (const [x, y] of p.cells) {
      const i = idx(x, y);
      if (t.k === -1) { s.kind[i] = K.NONE; s.lv[i] = 0; s.bad[i] = 0; if (s.ter[i] === T_FOREST) s.ter[i] = T_GRASS; continue; }
      if (s.ter[i] === T_FOREST) s.ter[i] = T_GRASS;
      s.kind[i] = t.k; s.lv[i] = t.svc ? 1 : 0; s.bad[i] = 0;
    }
    s.money -= p.cost;
    this.recompute();
    return p;
  }
  adjRoad(x, y, dist) {
    const s = this.s;
    for (let dy = -dist; dy <= dist; dy++) for (let dx = -dist; dx <= dist; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > dist || (!dx && !dy)) continue;
      const xx = x + dx; const yy = y + dy;
      if (inb(xx, yy) && s.kind[idx(xx, yy)] === K.ROAD) return idx(xx, yy) + 1;
    }
    return 0;
  }
  nearTer(x, y, t, d) { for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (inb(x + dx, y + dy) && this.s.ter[idx(x + dx, y + dy)] === t) return true; return false; }
  setTax(k, v) { this.s.tax[k] = clamp(Math.round(v), 0, 20); }
  borrow() { if (this.s.loans >= 3) return { ok: false, reason: '最多借 3 笔' }; this.s.loans += 1; this.s.money += 20000; return { ok: true }; }
  repay() { if (!this.s.loans) return { ok: false, reason: '没有贷款' }; if (this.s.money < 20000) return { ok: false, reason: '钱不够还' }; this.s.loans -= 1; this.s.money -= 20000; return { ok: true }; }

  // ---------------- 派生数据 ----------------
  recompute() {
    const s = this.s; const NN = N * N; const rules = this.rules();
    const comp = new Array(NN).fill(-1); let nc = 0;
    for (let i = 0; i < NN; i++) {
      if (s.kind[i] !== K.ROAD || comp[i] >= 0) continue;
      const q = [i]; comp[i] = nc;
      while (q.length) {
        const c = q.pop(); const x = c % N; const y = (c - x) / N;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx; const yy = y + dy; if (!inb(xx, yy)) continue; const j = idx(xx, yy); if (s.kind[j] === K.ROAD && comp[j] < 0) { comp[j] = nc; q.push(j); } }
      }
      nc++;
    }
    const att = new Array(NN).fill(-1);
    for (let i = 0; i < NN; i++) { const k = s.kind[i]; if (k === K.NONE || k === K.ROAD) continue; const x = i % N; const y = (i - x) / N; const rr = this.adjRoad(x, y, k >= K.R && k <= K.I ? 2 : 1); if (rr) att[i] = comp[rr - 1]; }
    const capP = new Array(nc).fill(0); const capW = new Array(nc).fill(0); const useP = new Array(nc).fill(0); const useW = new Array(nc).fill(0);
    for (let i = 0; i < NN; i++) { if (att[i] < 0) continue; if (s.kind[i] === K.POWER) capP[att[i]] += SERVICES[K.POWER].cap * rules.powerCap; if (s.kind[i] === K.WATER) capW[att[i]] += SERVICES[K.WATER].cap * rules.waterCapMult; }
    const power = new Array(NN).fill(0); const water = new Array(NN).fill(0);
    for (let i = 0; i < NN; i++) {
      const k = s.kind[i]; const a = att[i]; if (a < 0) continue;
      if (k >= K.POWER) { power[i] = capP[a] > 0 ? 1 : 0; water[i] = capW[a] > 0 ? 1 : 0; continue; }
      const z = ZONES[k]; if (!z) continue;
      const L = Math.max(1, s.lv[i]); const p = z.power * L; const w = z.water * L;
      if (useP[a] + p <= capP[a]) { useP[a] += p; power[i] = 1; }
      if (useW[a] + w <= capW[a]) { useW[a] += w; water[i] = 1; }
    }
    const cov = {}; for (const k of [K.FIRE, K.POLICE, K.CLINIC, K.SCHOOL, K.PARK, K.METRO]) cov[k] = new Array(NN).fill(0);
    const pol = new Array(NN).fill(0);
    for (let i = 0; i < NN; i++) {
      const k = s.kind[i]; const x = i % N; const y = (i - x) / N;
      if (cov[k] && att[i] >= 0) { const R = SERVICES[k].radius; for (let yy = Math.max(0, y - R); yy <= Math.min(N - 1, y + R); yy++) for (let xx = Math.max(0, x - R); xx <= Math.min(N - 1, x + R); xx++) if (Math.hypot(xx - x, yy - y) <= R) cov[k][idx(xx, yy)] = 1; }
      let src = 0; let R = 0;
      if (k === K.I && s.lv[i] > 0) { src = 9 * s.lv[i] * rules.pol; R = 2 + s.lv[i]; }
      if (k === K.POWER) { src = 35; R = 5; }
      if (src) for (let yy = Math.max(0, y - R); yy <= Math.min(N - 1, y + R); yy++) for (let xx = Math.max(0, x - R); xx <= Math.min(N - 1, x + R); xx++) { const dd = Math.hypot(xx - x, yy - y); if (dd <= R) pol[idx(xx, yy)] += src * (1 - dd / (R + 1)); }
    }
    const land = new Array(NN).fill(0);
    let pop = 0; for (let i = 0; i < NN; i++) if (s.kind[i] === K.R) pop += ZONES[K.R].cap[s.lv[i]];
    for (let i = 0; i < NN; i++) {
      const x = i % N; const y = (i - x) / N;
      let v = s.ter[i] === T_DESERT ? 29 : 35;
      let nearWater = false; let nearForest = false;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx; const yy = y + dy; if (!inb(xx, yy)) continue; const t = s.ter[idx(xx, yy)]; if (t === T_WATER) nearWater = true; if (t === T_FOREST || t === T_ROCK) nearForest = true; }
      if (nearWater) v += 12; if (nearForest) v += 5;
      if (cov[K.PARK][i]) v += 15 * rules.park;
      if (cov[K.POLICE][i]) v += 8; else if (pop > 500) v -= 12;
      if (cov[K.FIRE][i]) v += 5; if (cov[K.CLINIC][i]) v += 8; if (cov[K.SCHOOL][i]) v += 8; if (cov[K.METRO][i]) v += 20;
      v -= pol[i] * 1.1;
      land[i] = clamp(Math.round(v), 0, 100);
    }
    this.d = { comp, att, power, water, cov, pol, land, capP, capW, useP, useW };
    this.stats();
  }

  stats() {
    const s = this.s; const d = this.d; const rules = this.rules();
    let pop = 0; let jobsC = 0; let jobsI = 0; let landSum = 0; let landN = 0; let sky = 0; let parks = 0; let metro = 0;
    for (let i = 0; i < N * N; i++) {
      const k = s.kind[i]; const L = s.lv[i];
      if (k === K.R) { pop += ZONES[k].cap[L]; if (L) { landSum += d.land[i]; landN++; } }
      if (k === K.C) jobsC += ZONES[k].cap[L];
      if (k === K.I) jobsI += ZONES[k].cap[L];
      if ((k === K.R || k === K.C) && L === 4) sky++;
      if (k === K.PARK) parks++;
      if (k === K.METRO) metro++;
    }
    const workers = pop * 0.5; const jobs = jobsC + jobsI;
    const mod = { R: rules.dem.R, C: rules.dem.C, I: rules.dem.I };
    for (const m of s.mods) if (this.year >= m.from && this.year <= m.to) for (const k of Object.keys(m.mods)) mod[k] += m.mods[k];
    const taxEff = (k) => (s.tax[k] - 9) * 0.06;
    const happy = landN ? landSum / landN : 40;
    const dem = {
      R: clamp((jobs - workers + 40) / (workers * 0.5 + 60) + (happy - 40) / 150 + Math.max(0, 0.45 * (1 - pop / 1500)) - taxEff('R') + mod.R, -1, 1),
      C: clamp((pop * 0.24 - jobsC + 10) / (jobsC * 0.5 + 30) - taxEff('C') + mod.C, -1, 1),
      I: clamp((pop * 0.36 + 30 - jobsI) / (jobsI * 0.5 + 30) - taxEff('I') + mod.I, -1, 1)
    };
    let upkeep = 0;
    for (let i = 0; i < N * N; i++) { const k = s.kind[i]; if (k === K.ROAD) upkeep += ROAD_UPKEEP; if (SERVICES[k]) upkeep += SERVICES[k].upkeep; }
    upkeep = Math.round(upkeep * rules.upkeep) + s.loans * 300;
    const tax = Math.round((pop * s.tax.R / 100 * 24 + jobsC * s.tax.C / 100 * 21 + jobsI * s.tax.I / 100 * 19) * rules.income);
    let oil = 0;
    if (rules.oil && this.year >= rules.oil.from && this.year < rules.oil.to) oil = Math.round(rules.oil.amount * (1 - (this.year - rules.oil.from) / (rules.oil.to - rules.oil.from)));
    let title = TITLES[0][1]; for (const [p, t] of TITLES) if (s.maxPop >= p) title = t;
    this.st = { pop, jobsC, jobsI, jobs, workers, dem, tax, oil, income: tax + oil, upkeep, happy: Math.round(happy), title, sky, parks, metro,
      cshare: jobs ? jobsC / jobs : 0, unemployed: Math.max(0, Math.round(workers - jobs)),
      powerUse: d.useP.reduce((a, b) => a + b, 0), powerCap: Math.round(d.capP.reduce((a, b) => a + b, 0)), waterUse: d.useW.reduce((a, b) => a + b, 0), waterCap: Math.round(d.capW.reduce((a, b) => a + b, 0)) };
    return this.st;
  }

  // ---------------- 一个月 ----------------
  step() {
    const s = this.s; if (s.ended && !s.freePlay) return [];
    const news = []; const st = this.st; const d = this.d; const rules = this.rules();
    const lvCap = LV_CAP(s.maxPop);
    const zones = []; for (let i = 0; i < N * N; i++) if (s.kind[i] >= K.R && s.kind[i] <= K.I) zones.push(i);
    const tries = Math.min(zones.length, 30 + Math.floor(st.pop / 60));
    for (let t = 0; t < tries; t++) {
      const i = zones[Math.floor(rnd(s.rng) * zones.length)];
      const k = s.kind[i]; const L = s.lv[i]; const z = ZONES[k];
      const dm = st.dem[k === K.R ? 'R' : k === K.C ? 'C' : 'I'];
      if (d.att[i] < 0) continue;
      if (L === 0) { const room = d.capP[d.att[i]] - d.useP[d.att[i]] >= z.power; if (dm > 0 && room && rnd(s.rng) < dm * (0.35 + d.land[i] / 150)) { s.lv[i] = 1; s.bad[i] = 0; } continue; }
      if (!d.power[i] || !d.water[i]) { s.bad[i]++; if (s.bad[i] > 6) { s.lv[i] = L - 1; s.bad[i] = 0; } continue; }
      s.bad[i] = 0;
      const svcOk = L < 2 || (d.cov[K.SCHOOL][i] || d.cov[K.CLINIC][i]);
      const svcOk4 = L < 3 || (d.cov[K.SCHOOL][i] && d.cov[K.CLINIC][i] && (d.cov[K.METRO][i] || (!this.metroEvent() && d.land[i] >= 80)));
      const th = [0, 22, 38, 55][L] || 99;
      if (L < Math.min(z.maxLv, lvCap) && dm > 0.05 && d.land[i] >= th && svcOk && svcOk4 && rnd(s.rng) < 0.18 * dm) s.lv[i] = L + 1;
      else if (dm < -0.5 && rnd(s.rng) < 0.04) s.lv[i] = L - 1;
    }
    for (let i = 0; i < N * N; i++) {
      const k = s.kind[i]; const L = s.lv[i];
      if (k < K.R || k > K.I || !L) continue;
      if (rnd(s.rng) < (d.cov[K.FIRE][i] ? 0.00015 : 0.0012) * L * rules.fire) {
        s.lv[i] = 0; const x = i % N; const y = (i - x) / N;
        news.push({ type: 'fire', text: `火灾！一栋${ZONES[k].name}建筑烧毁了${d.cov[K.FIRE][i] ? '' : '（这里没有消防覆盖）'}`, x, y });
      }
    }
    if (rules.disaster && this.monthOfYear === 7 && rnd(s.rng) < rules.disaster) news.push(this.disaster());
    // 衰退：人口和工厂外流，建筑逐步降级空置（地价高、服务好的地方流失少）
    const decay = { R: 0, C: 0, I: 0 };
    for (const m of s.mods) if (m.decay && this.year >= m.from && this.year <= m.to) for (const k of Object.keys(m.decay)) decay[k] += m.decay[k];
    if (decay.R || decay.C || decay.I) {
      for (let i = 0; i < N * N; i++) {
        const k = s.kind[i]; if (k < K.R || k > K.I || !s.lv[i]) continue;
        const p = decay[k === K.R ? 'R' : k === K.C ? 'C' : 'I'] * (1.4 - d.land[i] / 100);
        if (p > 0 && rnd(s.rng) < p) s.lv[i] -= 1;
      }
    }
    this.recompute();
    const st2 = this.st;
    s.money += st2.income - st2.upkeep;
    s.lastIncome = st2.income; s.lastExpense = st2.upkeep;
    if (s.money < -20000 && s.loans < 3) { s.loans += 1; s.money += 20000; news.push({ type: 'money', text: '财政赤字，自动借了一笔 ¥20,000 的贷款' }); }
    if (st2.pop > s.maxPop) {
      const oldTitle = st2.title; s.maxPop = st2.pop; const st3 = this.stats();
      if (st3.title !== oldTitle) news.push({ type: 'milestone', text: `里程碑：${s.name}升级为「${st3.title}」！` });
      for (const k of Object.keys(SERVICES)) { const sv = SERVICES[k]; if (sv.unlock && s.maxPop >= sv.unlock && s.unlocked.indexOf(+k) < 0 && !(+k === K.METRO && this.metroEvent())) { s.unlocked.push(+k); news.push({ type: 'unlock', text: `解锁新建筑：${sv.name}` }); } }
      const cap = LV_CAP(s.maxPop);
      if (cap > lvCap) news.push({ type: 'unlock', text: cap === 3 ? '人口过 2,500：可以建中高层了（需要学校或医院覆盖）' : '人口过 8,000：摩天楼解锁（需要学校、医院和地铁覆盖）' });
    }
    s.month += 1;
    if (s.month % 12 === 0) {
      s.history.push({ year: this.year - 1, pop: st2.pop, money: Math.round(s.money) });
      if (s.scenario && !s.freePlay) { news.push(...this.checkGoals()); if (this.year > s.endYear) s.ended = true; else news.push(...this.fireEvents()); }
    }
    s.news = news.concat(s.news).slice(0, 30);
    return news;
  }

  disaster() {
    const s = this.s;
    const flood = rnd(s.rng) < 0.5;
    let cx = Math.floor(rnd(s.rng) * N); let cy = Math.floor(rnd(s.rng) * N);
    if (flood) for (let k = 0; k < 60; k++) { const x = Math.floor(rnd(s.rng) * N); const y = Math.floor(rnd(s.rng) * N); if (s.ter[idx(x, y)] !== T_WATER && this.nearTer(x, y, T_WATER, 1)) { cx = x; cy = y; break; } }
    let n = 0;
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) {
      if (!inb(x, y)) continue; const i = idx(x, y);
      if (s.kind[i] >= K.R && s.kind[i] <= K.I && s.lv[i] > 0 && rnd(s.rng) < (flood ? 0.6 : 0.45)) { s.lv[i] = Math.max(0, s.lv[i] - 2); n++; }
    }
    return { type: 'fire', text: flood ? `洪水来袭，${n} 栋建筑受损` : `发生地震，${n} 栋建筑受损`, x: cx, y: cy };
  }

  fireEvents() {
    const s = this.s; const sc = this.scenario; const out = [];
    if (!sc) return out;
    for (const e of sc.events) {
      if (e.year !== this.year || s.firedEvents.indexOf(e.year) >= 0) continue;
      s.firedEvents.push(e.year);
      if (e.mods || e.decay) s.mods.push({ mods: e.mods || {}, decay: e.decay || null, from: e.year, to: e.year + (e.years || 1) - 1 });
      if (e.money) s.money += e.money;
      if (e.unlock === 'metro') s.unlocked.push(K.METRO);
      if (e.rule) {
        if (e.rule.clearLoans) s.loans = 0;
        const rr = Object.assign({}, e.rule); delete rr.clearLoans;
        if (Object.keys(rr).length) s.ruleAdds.push(rr);
      }
      out.push({ type: 'event', year: e.year, title: e.title, text: e.text });
      s.pendingEvent = { year: e.year, title: e.title, text: e.text };
    }
    if (out.length) this.recompute();
    return out;
  }
  goalValue(g) {
    const st = this.st; const s = this.s;
    switch (g.type) {
      case 'pop': return st.pop;
      case 'sky': return st.sky;
      case 'land': return st.happy;
      case 'parks': return st.parks;
      case 'cshare': return st.cshare;
      case 'metro': return st.metro;
      case 'money': return s.money >= 0 && s.loans === 0 ? 1 : 0;
      case 'keep': return s.startPop ? st.pop / s.startPop : 1;
      default: return 0;
    }
  }
  goalMet(g) { const v = this.goalValue(g); return g.type === 'money' ? v >= 1 : v >= g.value; }
  goalText(g) {
    const body = SC.GOAL_TEXT[g.type](g);
    return g.type === 'keep' || g.type === 'money' ? `${g.by} 年时${body}` : `${g.by} 年前${body}`;
  }
  goalProgress(g) {
    const v = this.goalValue(g);
    if (g.type === 'cshare' || g.type === 'keep') return `${Math.round(v * 100)}%`;
    if (g.type === 'money') return v ? '目前没有欠债' : '目前有欠债';
    return group(v);
  }
  // 达成就记；“保持/财政”类只在截止年判定
  checkGoals() {
    const s = this.s; const out = []; const y = this.year - 1;
    for (const g of s.goals) {
      if (g.done !== null) continue;
      const atDeadline = y >= g.by;
      const instant = g.type !== 'keep' && g.type !== 'money';
      if ((instant || atDeadline) && this.goalMet(g)) { g.done = true; out.push({ type: 'goal', text: `目标达成：${this.goalText(g)}` }); } else if (atDeadline) { g.done = false; out.push({ type: 'goal', text: `目标未达成：${this.goalText(g)}` }); }
    }
    return out;
  }
  currentGoal() { return this.s.scenario && !this.s.freePlay ? this.s.goals.find((g) => g.done === null) || null : null; }

  inspect(x, y) {
    if (!inb(x, y)) return null;
    const s = this.s; const d = this.d; const i = idx(x, y); const k = s.kind[i];
    const out = { x, y, ter: TER_NAME[s.ter[i]], kind: k, land: d.land[i], pol: Math.round(d.pol[i]) };
    if (k === K.ROAD) out.title = s.ter[i] === T_WATER ? '桥' : s.ter[i] === T_ROCK ? '隧道' : '道路';
    else if (ZONES[k]) {
      const z = ZONES[k]; const L = s.lv[i];
      out.title = L ? `${z.name} · ${['', '低层', '多层', '高层', '摩天楼'][L]}` : `${z.name}区（空地）`;
      out.cap = z.cap[L]; out.capLabel = k === K.R ? '居民' : '岗位';
      const issues = [];
      if (d.att[i] < 0) issues.push('离道路太远（要在道路 2 格内）');
      else { if (!d.power[i] && L) issues.push('没电'); if (!d.water[i] && L) issues.push('没水'); if (!L && d.capP[d.att[i]] <= d.useP[d.att[i]]) issues.push('路网里没有富余电力'); }
      if (d.pol[i] > 15 && k === K.R) issues.push('污染重');
      if (L >= 2 && !(d.cov[K.SCHOOL][i] || d.cov[K.CLINIC][i])) issues.push('再往上长需要学校或医院覆盖');
      out.issues = issues;
    } else if (SERVICES[k]) { out.title = SERVICES[k].name; out.desc = SERVICES[k].desc; out.issues = d.att[i] < 0 ? ['没有接上道路，不起作用'] : []; } else out.title = out.ter;
    return out;
  }

  result() {
    const s = this.s; const st = this.st;
    const goals = s.goals.map((g) => ({ text: this.goalText(g), met: g.done === true }));
    return { pop: st.pop, maxPop: s.maxPop, title: st.title, stars: goals.filter((g) => g.met).length, total: goals.length, goals, money: s.money, happy: st.happy, sky: st.sky };
  }
}

module.exports = { CitySim, N, K, ZONES, SERVICES, T_GRASS, T_WATER, T_FOREST, T_SAND, T_ROCK, T_DESERT, VERSION, idx, inb, group, ROAD_COST, ZONE_COST, BRIDGE_COST, SC, M };
