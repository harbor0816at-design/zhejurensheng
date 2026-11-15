// 城市模拟引擎（当市长模式）：确定性、可复现、与界面无关。
// 一个 tick = 一个月。地图 N×N，每格一种地形 + 一种用途。
const VERSION = 'city-1.0.0';
const N = 32;

// 地形
const T_GRASS = 0; const T_WATER = 1; const T_FOREST = 2; const T_SAND = 3;
// 用途
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
const LV_CAP = (pop) => (pop >= 8000 ? 4 : pop >= 2500 ? 3 : 2); // 人口里程碑解锁更高楼层

// 深圳 1980 剧本：事件按公开历史改写；数值为游戏效果
const SHENZHEN = {
  start: 1980, end: 2020, money: 25000,
  events: [
    { year: 1980, title: '经济特区设立', text: '这座边陲渔村被划为经济特区，外资工厂开始进来。工业需求大涨，十年内企业税负减轻。', mods: { I: 0.5 }, years: 10 },
    { year: 1983, title: '“三天一层楼”', text: '建设热潮里，高楼以惊人的速度往上长。商业需求上升。', mods: { C: 0.25 }, years: 4 },
    { year: 1987, title: '第一次土地使用权拍卖', text: '城市第一次公开拍卖土地使用权，财政一下子宽裕了。', money: 20000 },
    { year: 1990, title: '证券交易所开业', text: '资本市场在这里起步，金融和商业需求大增。', mods: { C: 0.35 }, years: 6 },
    { year: 1997, title: '亚洲金融危机', text: '外需骤降，出口工厂订单减少。', mods: { I: -0.35 }, years: 2 },
    { year: 2001, title: '中国加入世贸组织', text: '订单涌来，“世界工厂”开足马力。', mods: { I: 0.4 }, years: 5 },
    { year: 2004, title: '第一条地铁线开通', text: '地铁站解锁：站点周边地价大涨，摩天楼开始成片出现。', unlock: K.METRO },
    { year: 2008, title: '全球金融危机', text: '外需再次下滑，部分工厂外迁。', mods: { I: -0.4 }, years: 2 },
    { year: 2010, title: '产业升级', text: '低端加工厂外迁，高科技企业兴起：工业污染减半，商业需求上升。', mods: { C: 0.2 }, years: 8, cleanIndustry: true },
    { year: 2015, title: '创新之城', text: '科技公司和年轻人涌入，住宅需求大涨。', mods: { R: 0.3 }, years: 5 },
    { year: 2020, title: '疫情冲击', text: '城市经历了特殊的一年。剧本结束，来看看你的城市。', mods: { C: -0.2 }, years: 1 }
  ],
  goals: [
    { by: 1985, pop: 600, text: '1985 年前人口达到 600' },
    { by: 1992, pop: 2000, text: '1992 年前人口达到 2,000' },
    { by: 2000, pop: 5000, text: '2000 年前人口达到 5,000' },
    { by: 2010, pop: 10000, text: '2010 年前人口达到 10,000' },
    { by: 2020, pop: 18000, text: '2020 年前人口达到 18,000' }
  ]
};

// ---------------- 随机 ----------------
function fnv(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i) & 0xff; h = Math.imul(h, 0x01000193) >>> 0; h ^= str.charCodeAt(i) >>> 8; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
function rnd(st) { let t = (st.r = (st.r + 0x6d2b79f5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const idx = (x, y) => y * N + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------- 地形 ----------------
function genSandbox(st) {
  const ter = new Array(N * N).fill(T_GRASS);
  // 一条蜿蜒的河
  let y = 6 + Math.floor(rnd(st) * (N - 12));
  for (let x = 0; x < N; x++) {
    for (let w = 0; w < 2; w++) if (inb(x, y + w)) ter[idx(x, y + w)] = T_WATER;
    if (rnd(st) < 0.45) y += rnd(st) < 0.5 ? -1 : 1;
    y = clamp(y, 3, N - 5);
  }
  // 一角是湖或海
  const cx = rnd(st) < 0.5 ? 0 : N - 1; const cy = rnd(st) < 0.5 ? 0 : N - 1; const R = 5 + rnd(st) * 4;
  for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) if (Math.hypot(xx - cx, yy - cy) < R + rnd(st) * 1.5) ter[idx(xx, yy)] = T_WATER;
  // 森林斑块
  for (let k = 0; k < 7; k++) {
    const fx = Math.floor(rnd(st) * N); const fy = Math.floor(rnd(st) * N); const fr = 2 + rnd(st) * 3;
    for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) if (ter[idx(xx, yy)] === T_GRASS && Math.hypot(xx - fx, yy - fy) < fr + rnd(st)) ter[idx(xx, yy)] = T_FOREST;
  }
  sandify(ter);
  return ter;
}
function genShenzhen(st) {
  const ter = new Array(N * N).fill(T_GRASS);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    // 东南是海，海岸线弯曲
    const coast = 44 + Math.sin(x * 0.45) * 2 + Math.cos(y * 0.35) * 2;
    if (x + y > coast) ter[idx(x, y)] = T_WATER;
    // 北边一条界河
    if (y <= 1 && x > 4) ter[idx(x, y)] = T_WATER;
  }
  // 西边丘陵森林
  for (let k = 0; k < 6; k++) {
    const fx = Math.floor(rnd(st) * 9); const fy = 4 + Math.floor(rnd(st) * (N - 8)); const fr = 2 + rnd(st) * 3;
    for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) if (ter[idx(xx, yy)] === T_GRASS && Math.hypot(xx - fx, yy - fy) < fr + rnd(st)) ter[idx(xx, yy)] = T_FOREST;
  }
  sandify(ter);
  return ter;
}
function sandify(ter) {
  const out = ter.slice();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (ter[idx(x, y)] !== T_GRASS) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inb(x + dx, y + dy) && ter[idx(x + dx, y + dy)] === T_WATER) { out[idx(x, y)] = T_SAND; break; }
  }
  for (let i = 0; i < ter.length; i++) ter[i] = out[i];
}

class CitySim {
  static create(o) {
    o = o || {};
    const mode = o.mode === 'shenzhen' ? 'shenzhen' : 'sandbox';
    const seed = String(o.seed || (mode === 'shenzhen' ? 'SZ-1980' : `CITY-${Math.floor(Math.random() * 9e4) + 1e4}`));
    const st = { r: fnv(`${seed}|${VERSION}|map`) };
    const s = {
      v: VERSION, mode, seed, name: o.name || (mode === 'shenzhen' ? '深圳' : '新城'),
      month: 0, startYear: mode === 'shenzhen' ? SHENZHEN.start : 2000,
      money: mode === 'shenzhen' ? SHENZHEN.money : 40000,
      tax: { R: 9, C: 9, I: 9 },
      ter: mode === 'shenzhen' ? genShenzhen(st) : genSandbox(st),
      kind: new Array(N * N).fill(0), lv: new Array(N * N).fill(0), bad: new Array(N * N).fill(0),
      rng: { r: fnv(`${seed}|${VERSION}|sim`) },
      mods: [], unlocked: [], cleanIndustry: false, firedEvents: [], goalsMet: [], goalsFailed: [],
      news: [], ended: false, maxPop: 0, milestone: 0, loans: 0,
      lastIncome: 0, lastExpense: 0, history: []
    };
    const sim = new CitySim(s);
    if (mode === 'shenzhen') sim.seedVillage();
    sim.recompute();
    if (mode === 'shenzhen') sim.fireEvents();
    return sim;
  }
  static fromJSON(j) { return new CitySim(typeof j === 'string' ? JSON.parse(j) : j); }
  constructor(s) { this.s = s; this.d = null; }
  toJSON() { return JSON.stringify(this.s); }

  get year() { return this.s.startYear + Math.floor(this.s.month / 12); }
  get monthOfYear() { return (this.s.month % 12) + 1; }

  // 剧本开局：海边一个小渔村
  seedVillage() {
    const s = this.s;
    let vx = 0; let vy = 0;
    for (let y = N - 1; y >= 0 && !vx; y--) for (let x = N - 1; x >= 0; x--) {
      if (s.ter[idx(x, y)] === T_GRASS && x + y < 40 && x + y > 36 && x > 10 && y > 10) { vx = x; vy = y; break; }
    }
    if (!vx) { vx = 18; vy = 18; }
    for (let k = -3; k <= 3; k++) this.setRoad(vx + k, vy - 2);
    for (let k = -2; k <= 2; k += 1) {
      const x = vx + k; const y = vy - 3;
      if (inb(x, y) && s.ter[idx(x, y)] !== T_WATER) { s.kind[idx(x, y)] = K.R; s.lv[idx(x, y)] = k % 2 ? 1 : 0; s.ter[idx(x, y)] = T_GRASS; }
    }
    if (inb(vx, vy - 1)) { s.kind[idx(vx, vy - 1)] = K.C; s.lv[idx(vx, vy - 1)] = 1; s.ter[idx(vx, vy - 1)] = T_GRASS; }
    s.focus = [vx, vy - 2];
  }
  setRoad(x, y) { if (!inb(x, y)) return; const i = idx(x, y); this.s.kind[i] = K.ROAD; this.s.lv[i] = 0; if (this.s.ter[i] === T_FOREST) this.s.ter[i] = T_GRASS; }

  // ---------------- 建造 ----------------
  toolInfo(tool) {
    const map = { road: { k: K.ROAD, name: '道路' }, R: { k: K.R, name: '住宅区' }, C: { k: K.C, name: '商业区' }, I: { k: K.I, name: '工业区' }, bulldoze: { k: -1, name: '推土机' } };
    if (map[tool]) return map[tool];
    for (const k of Object.keys(SERVICES)) if (SERVICES[k].id === tool) return { k: +k, name: SERVICES[k].name, svc: SERVICES[k] };
    return null;
  }
  unlockedTool(tool) {
    const t = this.toolInfo(tool);
    if (!t || !t.svc) return { ok: true };
    if (t.k === K.METRO && this.s.mode === 'shenzhen' && this.s.unlocked.indexOf(K.METRO) < 0) return { ok: false, reason: '2004 年地铁开通后解锁' };
    if (this.s.maxPop < t.svc.unlock && this.s.unlocked.indexOf(t.k) < 0) return { ok: false, reason: `人口达到 ${t.svc.unlock} 解锁` };
    return { ok: true };
  }
  // 预估一组格子的花费；返回 { ok, cost, cells, reason }
  plan(tool, cells) {
    const s = this.s;
    const t = this.toolInfo(tool);
    if (!t) return { ok: false, reason: '未知工具' };
    const u = this.unlockedTool(tool);
    if (!u.ok) return { ok: false, reason: u.reason };
    let cost = 0; const valid = [];
    for (const [x, y] of cells) {
      if (!inb(x, y)) continue;
      const i = idx(x, y); const k = s.kind[i]; const ter = s.ter[i];
      if (t.k === -1) { if (k !== K.NONE || ter === T_FOREST) { valid.push([x, y]); cost += 1; } continue; }
      if (t.k === K.ROAD) {
        if (k === K.ROAD) continue;
        if (k !== K.NONE && !(k >= K.R && k <= K.I && s.lv[i] === 0)) continue;
        valid.push([x, y]); cost += ter === T_WATER ? BRIDGE_COST : ROAD_COST; continue;
      }
      if (ter === T_WATER) continue;
      if (t.k >= K.R && t.k <= K.I) {
        if (k === t.k) continue;
        if (k !== K.NONE && !(k >= K.R && k <= K.I && s.lv[i] === 0)) continue;
        valid.push([x, y]); cost += ZONE_COST; continue;
      }
      // 服务建筑：单格，要挨着路
      if (k !== K.NONE && !(k >= K.R && k <= K.I && s.lv[i] === 0)) return { ok: false, reason: '这里已经有东西了' };
      if (!this.adjRoad(x, y, 1)) return { ok: false, reason: '要紧挨着道路' };
      valid.push([x, y]); cost += t.svc.cost;
      break;
    }
    if (!valid.length) return { ok: false, reason: t.k === -1 ? '这里没东西可拆' : '这里建不了' };
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
  setTax(k, v) { this.s.tax[k] = clamp(Math.round(v), 0, 20); }
  borrow() { if (this.s.loans >= 3) return { ok: false, reason: '最多借 3 笔' }; this.s.loans += 1; this.s.money += 20000; return { ok: true }; }
  repay() { if (!this.s.loans) return { ok: false, reason: '没有贷款' }; if (this.s.money < 20000) return { ok: false, reason: '钱不够还' }; this.s.loans -= 1; this.s.money -= 20000; return { ok: true }; }

  // ---------------- 派生数据 ----------------
  recompute() {
    const s = this.s; const NN = N * N;
    const comp = new Array(NN).fill(-1);
    let nc = 0;
    for (let i = 0; i < NN; i++) {
      if (s.kind[i] !== K.ROAD || comp[i] >= 0) continue;
      const q = [i]; comp[i] = nc;
      while (q.length) {
        const c = q.pop(); const x = c % N; const y = (c - x) / N;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const xx = x + dx; const yy = y + dy; if (!inb(xx, yy)) continue;
          const j = idx(xx, yy); if (s.kind[j] === K.ROAD && comp[j] < 0) { comp[j] = nc; q.push(j); }
        }
      }
      nc++;
    }
    // 每个建筑接到哪个路网
    const att = new Array(NN).fill(-1);
    for (let i = 0; i < NN; i++) {
      const k = s.kind[i]; if (k === K.NONE || k === K.ROAD) continue;
      const x = i % N; const y = (i - x) / N;
      const r = this.adjRoad(x, y, k >= K.R && k <= K.I ? 2 : 1);
      if (r) att[i] = comp[r - 1];
    }
    // 水电：按路网分配
    const capP = new Array(nc).fill(0); const capW = new Array(nc).fill(0);
    const useP = new Array(nc).fill(0); const useW = new Array(nc).fill(0);
    for (let i = 0; i < NN; i++) {
      if (att[i] < 0) continue;
      if (s.kind[i] === K.POWER) capP[att[i]] += SERVICES[K.POWER].cap;
      if (s.kind[i] === K.WATER) capW[att[i]] += SERVICES[K.WATER].cap;
    }
    const power = new Array(NN).fill(0); const water = new Array(NN).fill(0);
    for (let i = 0; i < NN; i++) {
      const k = s.kind[i]; const a = att[i];
      if (a < 0) continue;
      if (k >= K.POWER) { power[i] = capP[a] > 0 ? 1 : 0; water[i] = capW[a] > 0 ? 1 : 0; continue; }
      const z = ZONES[k]; if (!z) continue;
      const L = Math.max(1, s.lv[i]);
      const p = z.power * L; const w = z.water * L;
      if (useP[a] + p <= capP[a]) { useP[a] += p; power[i] = 1; }
      if (useW[a] + w <= capW[a]) { useW[a] += w; water[i] = 1; }
    }
    // 覆盖与污染
    const cov = {}; for (const k of [K.FIRE, K.POLICE, K.CLINIC, K.SCHOOL, K.PARK, K.METRO]) cov[k] = new Array(NN).fill(0);
    const pol = new Array(NN).fill(0);
    for (let i = 0; i < NN; i++) {
      const k = s.kind[i]; const x = i % N; const y = (i - x) / N;
      if (cov[k] && att[i] >= 0) {
        const R = SERVICES[k].radius;
        for (let yy = Math.max(0, y - R); yy <= Math.min(N - 1, y + R); yy++) for (let xx = Math.max(0, x - R); xx <= Math.min(N - 1, x + R); xx++) if (Math.hypot(xx - x, yy - y) <= R) cov[k][idx(xx, yy)] = 1;
      }
      let src = 0; let R = 0;
      if (k === K.I && s.lv[i] > 0) { src = 9 * s.lv[i] * (s.cleanIndustry ? 0.5 : 1); R = 2 + s.lv[i]; }
      if (k === K.POWER) { src = 35; R = 5; }
      if (src) for (let yy = Math.max(0, y - R); yy <= Math.min(N - 1, y + R); yy++) for (let xx = Math.max(0, x - R); xx <= Math.min(N - 1, x + R); xx++) {
        const dd = Math.hypot(xx - x, yy - y); if (dd <= R) pol[idx(xx, yy)] += src * (1 - dd / (R + 1));
      }
    }
    // 地价
    const land = new Array(NN).fill(0);
    let pop = 0;
    for (let i = 0; i < NN; i++) if (s.kind[i] === K.R) pop += ZONES[K.R].cap[s.lv[i]];
    for (let i = 0; i < NN; i++) {
      const x = i % N; const y = (i - x) / N;
      let v = 35;
      let nearWater = false; let nearForest = false;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx; const yy = y + dy; if (!inb(xx, yy)) continue; const t = s.ter[idx(xx, yy)]; if (t === T_WATER) nearWater = true; if (t === T_FOREST) nearForest = true; }
      if (nearWater) v += 12; if (nearForest) v += 5;
      if (cov[K.PARK][i]) v += 15;
      if (cov[K.POLICE][i]) v += 8; else if (pop > 500) v -= 12;
      if (cov[K.FIRE][i]) v += 5;
      if (cov[K.CLINIC][i]) v += 8;
      if (cov[K.SCHOOL][i]) v += 8;
      if (cov[K.METRO][i]) v += 20;
      v -= pol[i] * 1.1;
      land[i] = clamp(Math.round(v), 0, 100);
    }
    this.d = { comp, att, power, water, cov, pol, land, capP, capW, useP, useW };
    this.stats();
  }

  stats() {
    const s = this.s; const d = this.d;
    let pop = 0; let jobsC = 0; let jobsI = 0; let landSum = 0; let landN = 0;
    for (let i = 0; i < N * N; i++) {
      const k = s.kind[i]; const L = s.lv[i];
      if (k === K.R) { pop += ZONES[k].cap[L]; if (L) { landSum += d.land[i]; landN++; } }
      if (k === K.C) jobsC += ZONES[k].cap[L];
      if (k === K.I) jobsI += ZONES[k].cap[L];
    }
    const workers = pop * 0.5;
    const jobs = jobsC + jobsI;
    const mod = { R: 0, C: 0, I: 0 };
    for (const m of s.mods) if (this.year >= m.from && this.year <= m.to) for (const k of Object.keys(m.mods)) mod[k] += m.mods[k];
    const taxEff = (k) => (s.tax[k] - 9) * 0.06;
    const happy = landN ? landSum / landN : 40;
    const dem = {
      R: clamp((jobs - workers + 40) / (workers * 0.5 + 60) + (happy - 40) / 150 + Math.max(0, 0.45 * (1 - pop / 1500)) - taxEff('R') + mod.R, -1, 1), // 小城镇有基础吸引力
      C: clamp((pop * 0.24 - jobsC + 10) / (jobsC * 0.5 + 30) - taxEff('C') + mod.C, -1, 1),
      I: clamp((pop * 0.36 + 30 - jobsI) / (jobsI * 0.5 + 30) - taxEff('I') + mod.I, -1, 1)
    };
    let upkeep = 0;
    for (let i = 0; i < N * N; i++) {
      const k = s.kind[i];
      if (k === K.ROAD) upkeep += ROAD_UPKEEP;
      if (SERVICES[k]) upkeep += SERVICES[k].upkeep;
    }
    upkeep += s.loans * 300;
    const income = Math.round(pop * s.tax.R / 100 * 20 + jobsC * s.tax.C / 100 * 18 + jobsI * s.tax.I / 100 * 16);
    let title = TITLES[0][1]; for (const [p, t] of TITLES) if (s.maxPop >= p) title = t;
    this.st = { pop, jobsC, jobsI, jobs, workers, dem, income, upkeep, happy: Math.round(happy), title,
      unemployed: Math.max(0, Math.round(workers - jobs)), powerUse: d.useP.reduce((a, b) => a + b, 0), powerCap: d.capP.reduce((a, b) => a + b, 0), waterUse: d.useW.reduce((a, b) => a + b, 0), waterCap: d.capW.reduce((a, b) => a + b, 0) };
    return this.st;
  }

  // ---------------- 一个月 ----------------
  step() {
    const s = this.s; if (s.ended) return [];
    const news = [];
    const st = this.st; const d = this.d;
    const lvCap = LV_CAP(s.maxPop);
    // 生长
    const zones = [];
    for (let i = 0; i < N * N; i++) if (s.kind[i] >= K.R && s.kind[i] <= K.I) zones.push(i);
    const tries = Math.min(zones.length, 30 + Math.floor(st.pop / 60));
    for (let t = 0; t < tries; t++) {
      const i = zones[Math.floor(rnd(s.rng) * zones.length)];
      const k = s.kind[i]; const L = s.lv[i]; const z = ZONES[k];
      const dm = st.dem[k === K.R ? 'R' : k === K.C ? 'C' : 'I'];
      const ok = d.att[i] >= 0;
      if (!ok) continue;
      if (L === 0) {
        const room = d.capP[d.att[i]] - d.useP[d.att[i]] >= z.power;
        if (dm > 0 && room && rnd(s.rng) < dm * (0.35 + d.land[i] / 150)) { s.lv[i] = 1; s.bad[i] = 0; }
        continue;
      }
      if (!d.power[i] || !d.water[i]) {
        s.bad[i]++;
        if (s.bad[i] > 6) { s.lv[i] = L - 1; s.bad[i] = 0; }
        continue;
      }
      s.bad[i] = 0;
      const svcOk = L < 2 || (d.cov[K.SCHOOL][i] || d.cov[K.CLINIC][i]);
      const svcOk4 = L < 3 || (d.cov[K.SCHOOL][i] && d.cov[K.CLINIC][i] && (d.cov[K.METRO][i] || s.mode === 'sandbox' && d.land[i] >= 80));
      const th = [0, 22, 38, 55][L] || 99;
      if (L < Math.min(z.maxLv, lvCap) && dm > 0.05 && d.land[i] >= th && svcOk && svcOk4 && rnd(s.rng) < 0.18 * dm) s.lv[i] = L + 1;
      else if (dm < -0.5 && rnd(s.rng) < 0.04) s.lv[i] = L - 1;
    }
    // 火灾
    for (let i = 0; i < N * N; i++) {
      const k = s.kind[i]; const L = s.lv[i];
      if (k < K.R || k > K.I || !L) continue;
      const p = (d.cov[K.FIRE][i] ? 0.00015 : 0.0012) * L;
      if (rnd(s.rng) < p) {
        s.lv[i] = 0;
        const x = i % N; const y = (i - x) / N;
        news.push({ type: 'fire', text: `火灾！一栋${ZONES[k].name}建筑烧毁了${d.cov[K.FIRE][i] ? '' : '（这里没有消防覆盖）'}`, x, y });
      }
    }
    this.recompute();
    const st2 = this.st;
    // 财政
    const net = st2.income - st2.upkeep;
    s.money += net;
    s.lastIncome = st2.income; s.lastExpense = st2.upkeep;
    if (s.money < -20000 && s.loans < 3) { s.loans += 1; s.money += 20000; news.push({ type: 'money', text: '财政赤字，自动借了一笔 ¥20,000 的贷款' }); }
    // 里程碑
    if (st2.pop > s.maxPop) {
      const oldTitle = st2.title;
      s.maxPop = st2.pop;
      const st3 = this.stats();
      if (st3.title !== oldTitle) news.push({ type: 'milestone', text: `里程碑：${s.name}升级为「${st3.title}」！` });
      for (const k of Object.keys(SERVICES)) { const sv = SERVICES[k]; if (sv.unlock && s.maxPop >= sv.unlock && s.unlocked.indexOf(+k) < 0 && !(+k === K.METRO && s.mode === 'shenzhen')) { s.unlocked.push(+k); news.push({ type: 'unlock', text: `解锁新建筑：${sv.name}` }); } }
      const cap = LV_CAP(s.maxPop);
      if (cap > lvCap) news.push({ type: 'unlock', text: cap === 3 ? '人口过 2,500：可以建中高层了（需要学校或医院覆盖）' : '人口过 8,000：摩天楼解锁（需要学校、医院和地铁覆盖）' });
    }
    s.month += 1;
    if (s.month % 12 === 0) {
      s.history.push({ year: this.year - 1, pop: st2.pop, money: s.money });
      if (s.mode === 'shenzhen') news.push(...this.fireEvents(), ...this.checkGoals());
    }
    s.news = news.concat(s.news).slice(0, 30);
    return news;
  }

  fireEvents() {
    const s = this.s; const out = [];
    for (const e of SHENZHEN.events) {
      if (e.year !== this.year || s.firedEvents.indexOf(e.year) >= 0) continue;
      s.firedEvents.push(e.year);
      if (e.mods) s.mods.push({ mods: e.mods, from: e.year, to: e.year + (e.years || 1) - 1 });
      if (e.money) s.money += e.money;
      if (e.unlock) s.unlocked.push(e.unlock);
      if (e.cleanIndustry) s.cleanIndustry = true;
      out.push({ type: 'event', year: e.year, title: e.title, text: e.text });
      s.pendingEvent = { year: e.year, title: e.title, text: e.text };
    }
    return out;
  }
  checkGoals() {
    const s = this.s; const out = [];
    const pop = this.st.pop;
    for (const g of SHENZHEN.goals) {
      if (s.goalsMet.indexOf(g.by) >= 0 || s.goalsFailed.indexOf(g.by) >= 0) continue;
      if (pop >= g.pop) { s.goalsMet.push(g.by); out.push({ type: 'goal', text: `目标达成：${g.text}` }); } else if (this.year > g.by) { s.goalsFailed.push(g.by); out.push({ type: 'goal', text: `目标未达成：${g.text}` }); }
    }
    if (this.year > SHENZHEN.end) s.ended = true;
    return out;
  }
  currentGoal() {
    if (this.s.mode !== 'shenzhen') return null;
    const g = SHENZHEN.goals.find((x) => this.s.goalsMet.indexOf(x.by) < 0 && this.s.goalsFailed.indexOf(x.by) < 0);
    return g || null;
  }

  inspect(x, y) {
    if (!inb(x, y)) return null;
    const s = this.s; const d = this.d; const i = idx(x, y); const k = s.kind[i];
    const out = { x, y, ter: ['草地', '水面', '树林', '沙滩'][s.ter[i]], kind: k, land: d.land[i], pol: Math.round(d.pol[i]) };
    if (k === K.ROAD) out.title = s.ter[i] === T_WATER ? '桥' : '道路';
    else if (ZONES[k]) {
      const z = ZONES[k]; const L = s.lv[i];
      out.title = L ? `${z.name} · ${['', '低层', '多层', '高层', '摩天楼'][L]}` : `${z.name}区（空地）`;
      out.cap = z.cap[L]; out.capLabel = k === K.R ? '居民' : '岗位';
      const issues = [];
      if (d.att[i] < 0) issues.push('离道路太远（要在道路 2 格内）');
      else {
        if (!d.power[i] && L) issues.push('没电');
        if (!d.water[i] && L) issues.push('没水');
        if (!L && d.capP[d.att[i]] <= d.useP[d.att[i]]) issues.push('路网里没有富余电力');
      }
      if (d.pol[i] > 15 && k === K.R) issues.push('污染重');
      if (L >= 2 && !(d.cov[K.SCHOOL][i] || d.cov[K.CLINIC][i])) issues.push('再往上长需要学校或医院覆盖');
      out.issues = issues;
    } else if (SERVICES[k]) {
      out.title = SERVICES[k].name; out.desc = SERVICES[k].desc;
      out.issues = d.att[i] < 0 ? ['没有接上道路，不起作用'] : [];
    } else out.title = out.ter;
    return out;
  }

  result() {
    const s = this.s; const st = this.st;
    const met = s.goalsMet.length;
    return { pop: st.pop, maxPop: s.maxPop, title: st.title, stars: s.mode === 'shenzhen' ? met : null, goals: SHENZHEN.goals.map((g) => ({ text: g.text, met: s.goalsMet.indexOf(g.by) >= 0 })), money: s.money, happy: st.happy };
  }
}
function group(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

module.exports = { CitySim, N, K, ZONES, SERVICES, T_GRASS, T_WATER, T_FOREST, T_SAND, SHENZHEN, VERSION, idx, inb, group, ROAD_COST, ZONE_COST, BRIDGE_COST };
