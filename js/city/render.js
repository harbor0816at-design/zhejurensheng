// 城市俯视渲染（正上方视角）。地块 (gx,gy) 的左上角 → 屏幕 (gx*S, gy*S)。
// 高度用屋顶大小、屋顶细节和投向右下方的阴影表现。分四遍画：地面 → 阴影 → 建筑 → 浮层。
const { N, K, T_WATER, T_FOREST, T_SAND, T_ROCK, T_DESERT, idx, inb } = require('./sim.js');
const { icon } = require('../ui/icons.js');

const TILE = 24; // 缩放 1 时每格像素

function tileSize(cam) { return TILE * cam.z; }
function toScreen(cam, rect, gx, gy) { const S = tileSize(cam); return [rect.x + cam.x + gx * S, rect.y + cam.y + gy * S]; }
function toGrid(cam, rect, sx, sy) { const S = tileSize(cam); return [Math.floor((sx - rect.x - cam.x) / S), Math.floor((sy - rect.y - cam.y) / S)]; }
function centerOn(cam, rect, gx, gy) { const S = tileSize(cam); cam.x = rect.w / 2 - (gx + 0.5) * S; cam.y = rect.h / 2 - (gy + 0.5) * S; }

const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
const ZCOLOR = { [K.R]: '#22c55e', [K.C]: '#3b82f6', [K.I]: '#eab308' };
const SVC_STYLE = {
  [K.POWER]: { roof: '#9ca3af', icon: 'bolt', ic: '#facc15', h: 12 },
  [K.WATER]: { roof: '#7dd3fc', icon: 'drop', ic: '#0369a1', h: 6 },
  [K.FIRE]: { roof: '#dc2626', icon: 'flame', ic: '#fff7ed', h: 8 },
  [K.POLICE]: { roof: '#1d4ed8', icon: 'shield', ic: '#fde68a', h: 8 },
  [K.CLINIC]: { roof: '#f8fafc', icon: 'cross', ic: '#ef4444', h: 10 },
  [K.SCHOOL]: { roof: '#fb923c', icon: 'cap', ic: '#7c2d12', h: 7 },
  [K.METRO]: { roof: '#334155', icon: 'metro', ic: '#ef4444', h: 4 }
};

// 建筑外形：占地比例 f（0–1）、高度 h（像素，缩放 1）、屋顶色
function shapeOf(sim, i) {
  const s = sim.s; const k = s.kind[i]; const L = s.lv[i]; const x = i % N; const y = (i - x) / N; const hh = hash(x, y);
  if (k === K.R) return [null, { f: 0.62, h: 4, roof: hh % 2 ? '#c2410c' : '#b91c1c', gable: true }, { f: 0.78, h: 10, roof: hh % 2 ? '#e7c9a0' : '#d6b88c' }, { f: 0.72, h: 22, roof: hh % 2 ? '#e2d3c1' : '#cbbba5' }, { f: 0.66, h: 40, roof: hh % 2 ? '#cbd5e1' : '#e2e8f0' }][L];
  if (k === K.C) return [null, { f: 0.72, h: 5, roof: '#60a5fa', awning: true }, { f: 0.8, h: 14, roof: '#38bdf8' }, { f: 0.72, h: 28, roof: '#0ea5e9' }, { f: 0.66, h: 52, roof: hh % 2 ? '#2563eb' : '#0284c7', heli: true }][L];
  if (k === K.I) return [null, { f: 0.82, h: 5, roof: '#d6b370', saw: true }, { f: 0.88, h: 8, roof: sim.rules().pol < 1 ? '#a3e635' : '#ca8a04', saw: true, chim: 1 }, { f: 0.9, h: 11, roof: sim.rules().pol < 1 ? '#84cc16' : '#a16207', saw: true, chim: 2 }][L];
  if (SVC_STYLE[k]) return { f: 0.82, h: SVC_STYLE[k].h, roof: SVC_STYLE[k].roof, svc: SVC_STYLE[k] };
  return null;
}

function drawCity(ctx, sim, cam, rect, opts) {
  opts = opts || {};
  const s = sim.s; const d = sim.d; const S = tileSize(cam); const t = opts.t || 0; const z = cam.z;
  ctx.save();
  ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  ctx.fillStyle = '#1e3a5f'; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // 可见范围
  const x0 = Math.max(0, Math.floor(-cam.x / S) - 1); const y0 = Math.max(0, Math.floor(-cam.y / S) - 1);
  const x1 = Math.min(N - 1, Math.ceil((rect.w - cam.x) / S) + 1); const y1 = Math.min(N - 1, Math.ceil((rect.h - cam.y) / S) + 1);
  const P = (gx, gy) => toScreen(cam, rect, gx, gy);
  const isRoad = (x, y) => inb(x, y) && s.kind[idx(x, y)] === K.ROAD;

  // ---------- 第 1 遍：地面 ----------
  for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
    const i = idx(gx, gy); const [px, py] = P(gx, gy); const ter = s.ter[i]; const k = s.kind[i]; const hh = hash(gx, gy);
    let base;
    if (ter === T_WATER) base = '#3b82c4';
    else if (ter === T_SAND) base = '#ead9a2';
    else if (ter === T_DESERT) base = ['#e6cf95', '#e9d39c', '#e2ca8d'][hh % 3];
    else if (ter === T_ROCK) base = ['#8c8f93', '#94979b', '#85888c'][hh % 3];
    else base = ['#7cb86a', '#78b565', '#82bd6f', '#76b062'][hh % 4];
    ctx.fillStyle = base; ctx.fillRect(px, py, S + 0.6, S + 0.6);
    if (ter === T_WATER) { // 波纹
      const ph = ((t / 1600) + (hh % 10) / 10) % 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = Math.max(0.6, z * 0.8);
      ctx.beginPath(); ctx.moveTo(px + S * 0.15, py + S * (0.3 + ph * 0.4)); ctx.lineTo(px + S * 0.45, py + S * (0.3 + ph * 0.4)); ctx.stroke();
    } else if (ter === T_ROCK && k === K.NONE) { // 山脊
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath(); ctx.moveTo(px + S * 0.15, py + S * 0.8); ctx.lineTo(px + S * 0.45, py + S * 0.25); ctx.lineTo(px + S * 0.75, py + S * 0.8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.moveTo(px + S * 0.45, py + S * 0.25); ctx.lineTo(px + S * 0.75, py + S * 0.8); ctx.lineTo(px + S * 0.55, py + S * 0.8); ctx.closePath(); ctx.fill();
    } else if (ter === T_DESERT && k === K.NONE && hh % 3 === 0) {
      ctx.strokeStyle = 'rgba(160,120,60,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px + S * 0.1, py + S * 0.6); ctx.quadraticCurveTo(px + S * 0.5, py + S * 0.35, px + S * 0.9, py + S * 0.6); ctx.stroke();
    }
    if (k === K.ROAD) {
      const bridge = ter === T_WATER; const tunnel = ter === T_ROCK;
      ctx.fillStyle = bridge ? '#a8a29e' : tunnel ? '#3f3f46' : '#4b5563';
      ctx.fillRect(px, py, S + 0.6, S + 0.6);
      // 人行道边
      ctx.fillStyle = bridge ? '#78716c' : 'rgba(203,213,225,0.55)';
      const e = Math.max(1, S * 0.08);
      if (!isRoad(gx, gy - 1)) ctx.fillRect(px, py, S, e);
      if (!isRoad(gx, gy + 1)) ctx.fillRect(px, py + S - e, S, e);
      if (!isRoad(gx - 1, gy)) ctx.fillRect(px, py, e, S);
      if (!isRoad(gx + 1, gy)) ctx.fillRect(px + S - e, py, e, S);
      // 车道中线
      ctx.strokeStyle = 'rgba(253,224,71,0.75)'; ctx.lineWidth = Math.max(0.6, z * 0.9);
      if (ctx.setLineDash) ctx.setLineDash([S * 0.18, S * 0.14]);
      const cx = px + S / 2; const cy = py + S / 2;
      const h = isRoad(gx - 1, gy) || isRoad(gx + 1, gy); const v = isRoad(gx, gy - 1) || isRoad(gx, gy + 1);
      if (h && !v) { ctx.beginPath(); ctx.moveTo(px, cy); ctx.lineTo(px + S, cy); ctx.stroke(); }
      if (v && !h) { ctx.beginPath(); ctx.moveTo(cx, py); ctx.lineTo(cx, py + S); ctx.stroke(); }
      if (ctx.setLineDash) ctx.setLineDash([]);
    } else if (ZCOLOR[k] && s.lv[i] === 0) {
      ctx.fillStyle = ZCOLOR[k] + '44'; ctx.fillRect(px + 1, py + 1, S - 2, S - 2);
      ctx.strokeStyle = ZCOLOR[k]; ctx.lineWidth = 1;
      if (ctx.setLineDash) ctx.setLineDash([3, 2]);
      ctx.strokeRect(px + 2, py + 2, S - 4, S - 4);
      if (ctx.setLineDash) ctx.setLineDash([]);
    } else if ((ZCOLOR[k] || SVC_STYLE[k]) && k !== K.ROAD) {
      ctx.fillStyle = k === K.I ? '#a8a29e' : '#d4d4d8'; ctx.fillRect(px + 0.5, py + 0.5, S - 1, S - 1); // 地块铺装
    } else if (k === K.PARK) {
      ctx.fillStyle = '#4ade80'; ctx.fillRect(px + 0.5, py + 0.5, S - 1, S - 1);
      ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = Math.max(1, S * 0.08);
      ctx.beginPath(); ctx.moveTo(px, py + S * 0.5); ctx.quadraticCurveTo(px + S * 0.5, py + S * 0.2, px + S, py + S * 0.55); ctx.stroke();
    }
  }

  // ---------- 第 2 遍：阴影 ----------
  ctx.fillStyle = 'rgba(15,23,42,0.28)';
  for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
    const i = idx(gx, gy); const k = s.kind[i];
    const sh = (k >= K.R && k <= K.I && s.lv[i]) || SVC_STYLE[k] ? shapeOf(sim, i) : null;
    const [px, py] = P(gx, gy);
    if (sh) {
      const w = S * sh.f; const o = (S - w) / 2; const off = Math.min(S * 1.4, sh.h * z * 0.45);
      ctx.beginPath();
      ctx.moveTo(px + o + w, py + o); ctx.lineTo(px + o + w + off, py + o + off); ctx.lineTo(px + o + w + off, py + o + w + off); ctx.lineTo(px + o + off, py + o + w + off); ctx.lineTo(px + o, py + o + w); ctx.lineTo(px + o + w, py + o + w); ctx.closePath();
      ctx.fill();
    }
    if ((s.ter[i] === T_FOREST && k === K.NONE) || k === K.PARK) {
      for (const [tx, ty, r] of treesOf(gx, gy, k === K.PARK)) { ctx.beginPath(); ctx.arc(px + tx * S + r * S * 0.35, py + ty * S + r * S * 0.35, r * S, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  // ---------- 第 3 遍：建筑与树 ----------
  for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
    const i = idx(gx, gy); const k = s.kind[i]; const [px, py] = P(gx, gy);
    if ((s.ter[i] === T_FOREST && k === K.NONE) || k === K.PARK) {
      const hh = hash(gx, gy);
      for (const [tx, ty, r] of treesOf(gx, gy, k === K.PARK)) {
        ctx.beginPath(); ctx.arc(px + tx * S, py + ty * S, r * S, 0, Math.PI * 2); ctx.fillStyle = hh % 2 ? '#2f7d32' : '#3a8a3c'; ctx.fill();
        ctx.beginPath(); ctx.arc(px + tx * S - r * S * 0.3, py + ty * S - r * S * 0.3, r * S * 0.45, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
      }
      continue;
    }
    const sh = (k >= K.R && k <= K.I && s.lv[i]) || SVC_STYLE[k] ? shapeOf(sim, i) : null;
    if (!sh) continue;
    const w = S * sh.f; const o = (S - w) / 2; const bx = px + o; const by = py + o;
    // 屋顶
    ctx.fillStyle = sh.roof; ctx.fillRect(bx, by, w, w);
    // 受光边 / 背光边
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(bx, by, w, Math.max(1, w * 0.07)); ctx.fillRect(bx, by, Math.max(1, w * 0.07), w);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(bx, by + w - Math.max(1, w * 0.07), w, Math.max(1, w * 0.07)); ctx.fillRect(bx + w - Math.max(1, w * 0.07), by, Math.max(1, w * 0.07), w);
    if (sh.gable) { // 坡屋顶：屋脊线 + 一半深色
      ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(bx, by + w / 2, w, w / 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx, by + w / 2); ctx.lineTo(bx + w, by + w / 2); ctx.stroke();
    }
    if (sh.awning) { ctx.fillStyle = '#fff'; for (let a = 0; a < 4; a++) if (a % 2 === 0) ctx.fillRect(bx + a * w / 4, by + w * 0.82, w / 4, w * 0.18); }
    if (sh.saw) { ctx.fillStyle = 'rgba(0,0,0,0.14)'; for (let a = 0; a < 4; a++) ctx.fillRect(bx, by + a * w / 4, w, w / 8); }
    if (sh.h >= 10 && !sh.saw && !sh.svc) { // 楼顶设备：空调机组、水箱
      ctx.fillStyle = 'rgba(71,85,105,0.55)';
      const u = w * 0.16; ctx.fillRect(bx + w * 0.18, by + w * 0.2, u, u); ctx.fillRect(bx + w * 0.55, by + w * 0.58, u * 1.3, u);
      if (sh.h >= 22) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(bx + w * 0.12, by + w * 0.12, w * 0.76, w * 0.76); }
    }
    if (sh.heli) { // 直升机坪
      ctx.beginPath(); ctx.arc(bx + w / 2, by + w / 2, w * 0.28, 0, Math.PI * 2); ctx.fillStyle = '#1e293b'; ctx.fill();
      ctx.fillStyle = '#facc15'; ctx.font = `700 ${Math.max(6, w * 0.32)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('H', bx + w / 2, by + w / 2 + w * 0.11);
      if (Math.floor(t / 600) % 2) { ctx.beginPath(); ctx.arc(bx + w * 0.9, by + w * 0.1, Math.max(1.2, w * 0.05), 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill(); }
    }
    if (sh.chim) { // 烟囱 + 烟
      for (let c = 0; c < sh.chim; c++) {
        const cx = bx + w * (c ? 0.25 : 0.75); const cy = by + w * 0.3;
        ctx.beginPath(); ctx.arc(cx, cy, w * 0.11, 0, Math.PI * 2); ctx.fillStyle = '#6b7280'; ctx.fill();
        if (sim.rules().pol >= 1) for (let p = 0; p < 3; p++) { const ph = ((t / 1000 + p / 3 + c * 0.17) % 1); ctx.beginPath(); ctx.arc(cx + ph * S * 0.5, cy - ph * S * 0.35, (0.08 + ph * 0.14) * S, 0, Math.PI * 2); ctx.fillStyle = `rgba(200,200,200,${0.55 * (1 - ph)})`; ctx.fill(); }
      }
    }
    if (sh.svc) { // 公共设施屋顶图标
      const sz = w * 0.7; const list = [];
      icon((c) => list.push(c), sh.svc.icon, bx + (w - sz) / 2, by + (w - sz) / 2, sz, sh.svc.ic);
      prims(ctx, list);
      if (k === K.POWER && sim.rules().pol >= 1) for (let p = 0; p < 3; p++) { const ph = ((t / 1100 + p / 3) % 1); ctx.beginPath(); ctx.arc(bx + w * 0.85 + ph * S * 0.5, by + w * 0.1 - ph * S * 0.4, (0.1 + ph * 0.18) * S, 0, Math.PI * 2); ctx.fillStyle = `rgba(230,230,230,${0.6 * (1 - ph)})`; ctx.fill(); }
    }
  }

  // ---------- 第 4 遍：数据视图、预览、提示 ----------
  const prev = new Map();
  if (opts.preview) for (const [x, y] of opts.preview.cells) prev.set(idx(x, y), opts.preview.ok);
  for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
    const i = idx(gx, gy); const k = s.kind[i]; const [px, py] = P(gx, gy); const ter = s.ter[i];
    if (opts.overlay && ter !== T_WATER) {
      let col = null;
      if (opts.overlay === 'land') { const v = d.land[i] / 100; col = `rgba(${Math.round(255 * (1 - v))},${Math.round(200 * v)},60,0.5)`; }
      if (opts.overlay === 'pollution' && d.pol[i] > 1) col = `rgba(120,72,20,${Math.min(0.75, d.pol[i] / 45)})`;
      if (opts.overlay === 'power' && k !== K.NONE && k !== K.ROAD) col = d.power[i] ? 'rgba(250,204,21,0.55)' : 'rgba(239,68,68,0.65)';
      if (opts.overlay === 'water' && k !== K.NONE && k !== K.ROAD) col = d.water[i] ? 'rgba(56,189,248,0.6)' : 'rgba(239,68,68,0.65)';
      if (opts.overlay === 'service') { let c = 0; for (const kk of [K.FIRE, K.POLICE, K.CLINIC, K.SCHOOL]) c += d.cov[kk][i]; if (c) col = `rgba(99,102,241,${0.12 * c + 0.1})`; }
      if (col) { ctx.fillStyle = col; ctx.fillRect(px, py, S + 0.5, S + 0.5); }
    }
    if (prev.has(i)) { ctx.fillStyle = prev.get(i) ? 'rgba(74,222,128,0.55)' : 'rgba(248,113,113,0.6)'; ctx.fillRect(px + 1, py + 1, S - 2, S - 2); }
    if (k >= K.R && k <= K.I && s.lv[i] > 0 && (!d.power[i] || !d.water[i]) && Math.floor(t / 500) % 2) {
      const r = Math.max(4, S * 0.22);
      ctx.beginPath(); ctx.arc(px + S / 2, py + S / 2, r, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(r * 1.4)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('!', px + S / 2, py + S / 2 + r * 0.5);
    }
    if (opts.sel && opts.sel[0] === gx && opts.sel[1] === gy) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, S - 2, S - 2); }
  }
  // 网格线（放大时）
  if (S >= 30) {
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let gx = x0; gx <= x1 + 1; gx++) { const [px] = P(gx, 0); ctx.moveTo(px, rect.y); ctx.lineTo(px, rect.y + rect.h); }
    for (let gy = y0; gy <= y1 + 1; gy++) { const [, py] = P(0, gy); ctx.moveTo(rect.x, py); ctx.lineTo(rect.x + rect.w, py); }
    ctx.stroke();
  }
  ctx.restore();
}

function treesOf(gx, gy, park) {
  const h = hash(gx, gy);
  if (park) return [[0.28, 0.3, 0.16], [0.72, 0.72, 0.14]];
  const out = [[0.3 + (h % 5) * 0.02, 0.32, 0.2], [0.7, 0.62 + (h % 3) * 0.03, 0.18]];
  if (h % 3 === 0) out.push([0.68, 0.22, 0.13]);
  if (h % 4 === 1) out.push([0.25, 0.75, 0.14]);
  return out;
}

function prims(ctx, list) {
  for (const c of list) {
    if (c.t === 'rect') { const r = Math.min(c.r || 0, c.w / 2, c.h / 2); ctx.beginPath(); ctx.moveTo(c.x + r, c.y); ctx.arcTo(c.x + c.w, c.y, c.x + c.w, c.y + c.h, r); ctx.arcTo(c.x + c.w, c.y + c.h, c.x, c.y + c.h, r); ctx.arcTo(c.x, c.y + c.h, c.x, c.y, r); ctx.arcTo(c.x, c.y, c.x + c.w, c.y, r); ctx.closePath(); ctx.fillStyle = c.fill; ctx.fill(); }
    if (c.t === 'circle') { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); if (c.fill) { ctx.fillStyle = c.fill; ctx.fill(); } if (c.stroke) { ctx.strokeStyle = c.stroke; ctx.lineWidth = c.lw || 1; ctx.stroke(); } }
    if (c.t === 'poly') { ctx.beginPath(); ctx.moveTo(c.pts[0][0], c.pts[0][1]); for (let k = 1; k < c.pts.length; k++) ctx.lineTo(c.pts[k][0], c.pts[k][1]); if (c.fill) { ctx.closePath(); ctx.fillStyle = c.fill; ctx.fill(); } if (c.color) { ctx.strokeStyle = c.color; ctx.lineWidth = c.lw || 1.5; ctx.stroke(); } }
  }
}

module.exports = { drawCity, toScreen, toGrid, centerOn, tileSize, TILE, prims };
