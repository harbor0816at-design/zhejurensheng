// 地图生成：自由模式 6 种地形 + 6 个历史剧本的地图。全部用种子随机，可复现。
const N = 32;
const T = { GRASS: 0, WATER: 1, FOREST: 2, SAND: 3, ROCK: 4, DESERT: 5 };
const idx = (x, y) => y * N + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function blob(ter, r, cx, cy, rad, t, only) {
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (only !== undefined && ter[idx(x, y)] !== only) continue;
    if (Math.hypot(x - cx, y - cy) < rad + r() * 1.4) ter[idx(x, y)] = t;
  }
}
function river(ter, r, horizontal, width, start) {
  let p = start !== undefined ? start : 6 + Math.floor(r() * (N - 12));
  for (let q = 0; q < N; q++) {
    for (let w = 0; w < width; w++) { const x = horizontal ? q : p + w; const y = horizontal ? p + w : q; if (inb(x, y)) ter[idx(x, y)] = T.WATER; }
    if (r() < 0.45) p += r() < 0.5 ? -1 : 1;
    p = clamp(p, 2, N - 3 - width);
  }
}
function ridge(ter, r, len) {
  let x = Math.floor(r() * N); let y = Math.floor(r() * N);
  const dx = r() < 0.5 ? 1 : -1; const dy = r() < 0.5 ? 1 : -1;
  for (let k = 0; k < len; k++) {
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if (inb(x + a, y + b) && ter[idx(x + a, y + b)] !== T.WATER) ter[idx(x + a, y + b)] = T.ROCK;
    if (r() < 0.6) x += dx; else y += dy;
    if (r() < 0.2) x -= dx;
    if (!inb(x, y)) break;
  }
}
function forests(ter, r, n, base) {
  for (let k = 0; k < n; k++) blob(ter, r, Math.floor(r() * N), Math.floor(r() * N), 2 + r() * 3, T.FOREST, base === undefined ? T.GRASS : base);
}
function beaches(ter, onto) {
  const out = ter.slice();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const t = ter[idx(x, y)];
    if (t !== T.GRASS && t !== (onto === undefined ? -1 : onto)) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inb(x + dx, y + dy) && ter[idx(x + dx, y + dy)] === T.WATER) { out[idx(x, y)] = T.SAND; break; }
  }
  for (let i = 0; i < ter.length; i++) ter[i] = out[i];
}
function coastSide(ter, r, side, depth) {
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = side === 0 ? y : side === 1 ? N - 1 - x : side === 2 ? N - 1 - y : x;
    const q = side % 2 === 0 ? x : y;
    if (d < depth + Math.sin(q * 0.5 + side) * 1.6 + Math.cos(q * 0.23) * 1.2) ter[idx(x, y)] = T.WATER;
  }
}

const SANDBOX_MAPS = {
  river: { name: '河谷平原', desc: '一条大河穿过平原，一角有湖。最均衡。', gen(r) {
    const t = new Array(N * N).fill(T.GRASS); river(t, r, true, 2); blob(t, r, r() < 0.5 ? 0 : N - 1, r() < 0.5 ? 0 : N - 1, 5 + r() * 3, T.WATER); forests(t, r, 7); beaches(t); return t; } },
  coast: { name: '海滨', desc: '一边是大海，河流入海。海景地价高。', gen(r) {
    const t = new Array(N * N).fill(T.GRASS); const side = Math.floor(r() * 4); coastSide(t, r, side, 6 + r() * 3); river(t, r, side % 2 === 1, 2); forests(t, r, 6); beaches(t); return t; } },
  islands: { name: '群岛', desc: '几座岛屿被海峡隔开，要修很多桥。', gen(r) {
    const t = new Array(N * N).fill(T.WATER);
    for (let k = 0; k < 4; k++) blob(t, r, 6 + r() * 20, 6 + r() * 20, 5 + r() * 3, T.GRASS);
    forests(t, r, 5); beaches(t); return t; } },
  desert: { name: '沙漠绿洲', desc: '黄沙遍地，只有一片绿洲和一段海岸。地价低，水贵。', gen(r) {
    const t = new Array(N * N).fill(T.DESERT); coastSide(t, r, Math.floor(r() * 4), 4 + r() * 2);
    blob(t, r, 10 + r() * 12, 10 + r() * 12, 2.5, T.WATER); blob(t, r, 10 + r() * 12, 10 + r() * 12, 3.5, T.GRASS, T.DESERT);
    for (let k = 0; k < 3; k++) ridge(t, r, 6); beaches(t, T.DESERT); return t; } },
  mountains: { name: '山地', desc: '山脊纵横，只能在河谷里建城，修路要打隧道。', gen(r) {
    const t = new Array(N * N).fill(T.GRASS); river(t, r, r() < 0.5, 2); for (let k = 0; k < 7; k++) ridge(t, r, 14); forests(t, r, 8); beaches(t); return t; } },
  lakes: { name: '千湖', desc: '湖泊星罗棋布，森林茂密，风景好但地块零碎。', gen(r) {
    const t = new Array(N * N).fill(T.GRASS); for (let k = 0; k < 7; k++) blob(t, r, r() * N, r() * N, 2 + r() * 3, T.WATER); forests(t, r, 10); beaches(t); return t; } }
};

const SCENARIO_MAPS = {
  shenzhen(r) {
    const t = new Array(N * N).fill(T.GRASS);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (x + y > 44 + Math.sin(x * 0.45) * 2 + Math.cos(y * 0.35) * 2) t[idx(x, y)] = T.WATER;
      if (y <= 1 && x > 4) t[idx(x, y)] = T.WATER;
    }
    for (let k = 0; k < 6; k++) blob(t, r, r() * 9, 4 + r() * (N - 8), 2 + r() * 3, T.FOREST, T.GRASS);
    for (let k = 0; k < 2; k++) ridge(t, r, 6);
    beaches(t); return t;
  },
  pudong(r) { // 西侧一条大江，江西是老城，东北角是入海口
    const t = new Array(N * N).fill(T.GRASS);
    let p = 7;
    for (let y = 0; y < N; y++) { for (let w = 0; w < 3; w++) t[idx(p + w, y)] = T.WATER; if (r() < 0.35) p += r() < 0.5 ? -1 : 1; p = clamp(p, 5, 9); }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (x - y > 22 + Math.sin(x * 0.4) * 1.5) t[idx(x, y)] = T.WATER;
    // 河网
    for (let k = 0; k < 2; k++) { const y0 = 10 + Math.floor(r() * 14); for (let x = 12; x < N; x++) if (t[idx(x, y0)] === T.GRASS && r() < 0.95) t[idx(x, y0)] = T.WATER; }
    beaches(t); return t;
  },
  singapore(r) { // 一座岛，中间是集水区森林
    const t = new Array(N * N).fill(T.WATER);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (((x - 16) / 13) ** 2 + ((y - 16) / 9.5) ** 2 < 1 + (r() - 0.5) * 0.12) t[idx(x, y)] = T.GRASS;
    blob(t, r, 15, 14, 3, T.FOREST, T.GRASS);
    blob(t, r, 25, 27, 1.5, T.GRASS); blob(t, r, 5, 4, 1.2, T.GRASS);
    beaches(t); return t;
  },
  dubai(r) { // 西北是海湾，一条海湾小河伸进沙漠
    const t = new Array(N * N).fill(T.DESERT);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (x + y < 12 + Math.sin(x * 0.6) * 1.5) t[idx(x, y)] = T.WATER;
    let x = 6; let y = 6;
    for (let k = 0; k < 16; k++) { t[idx(x, y)] = T.WATER; if (inb(x + 1, y)) t[idx(x + 1, y)] = T.WATER; x += 1; y += r() < 0.6 ? 1 : 0; if (!inb(x + 1, y)) break; }
    for (let k = 0; k < 3; k++) ridge(t, r, 5);
    beaches(t, T.DESERT); return t;
  },
  detroit(r) { // 南边一条河，平坦
    const t = new Array(N * N).fill(T.GRASS);
    river(t, r, true, 3, N - 5);
    forests(t, r, 3);
    beaches(t); return t;
  },
  chongqing(r) { // 两江交汇，中间是半岛，两侧是山
    const t = new Array(N * N).fill(T.GRASS);
    let p = 20;
    for (let x = 0; x < N; x++) { for (let w = 0; w < 3; w++) if (inb(x, p + w)) t[idx(x, p + w)] = T.WATER; if (r() < 0.4) p += r() < 0.5 ? -1 : 1; p = clamp(p, 17, 23); }
    let q = 14; let y = 0;
    for (; y < 21; y++) { for (let w = 0; w < 2; w++) t[idx(q + w, y)] = T.WATER; if (r() < 0.4) q += y < 10 ? 1 : -1; q = clamp(q, 10, 20); }
    for (let k = 0; k < 4; k++) ridge(t, r, 12);
    forests(t, r, 6);
    beaches(t); return t;
  }
};

module.exports = { N, T, SANDBOX_MAPS, SCENARIO_MAPS, idx, inb };
