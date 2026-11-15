// 城市 2.5D 等距渲染。地块中心 (gx,gy) → 屏幕 ((gx-gy)*A, (gx+gy)*B)，按 gx+gy 从远到近绘制。
const { N, K, T_WATER, T_FOREST, T_SAND, idx, inb } = require('./sim.js');

const A = 16; const B = 8; // 半宽、半高（缩放 1 时）

function toScreen(cam, rect, gx, gy) {
  return [rect.x + cam.x + (gx - gy) * A * cam.z, rect.y + cam.y + (gx + gy) * B * cam.z];
}
function toGrid(cam, rect, sx, sy) {
  const dx = (sx - rect.x - cam.x) / (A * cam.z);
  const dy = (sy - rect.y - cam.y) / (B * cam.z);
  return [Math.round((dy + dx) / 2), Math.round((dy - dx) / 2)];
}
// 让地图中心对准画面中心
function centerOn(cam, rect, gx, gy) {
  cam.x = rect.w / 2 - (gx - gy) * A * cam.z;
  cam.y = rect.h / 2 - (gx + gy) * B * cam.z;
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255; let g = (n >> 8) & 255; let b = n & 255;
  if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

function diamond(ctx, cx, cy, a, b) {
  ctx.beginPath(); ctx.moveTo(cx, cy - b); ctx.lineTo(cx + a, cy); ctx.lineTo(cx, cy + b); ctx.lineTo(cx - a, cy); ctx.closePath();
}

// 等距方块：底面中心 (cx,cy)，占地比例 s，高度 h（像素）
function box(ctx, cx, cy, a, b, s, h, color) {
  const as = a * s; const bs = b * s;
  // 左面
  ctx.beginPath(); ctx.moveTo(cx - as, cy); ctx.lineTo(cx, cy + bs); ctx.lineTo(cx, cy + bs - h); ctx.lineTo(cx - as, cy - h); ctx.closePath();
  ctx.fillStyle = shade(color, -0.12); ctx.fill();
  // 右面
  ctx.beginPath(); ctx.moveTo(cx + as, cy); ctx.lineTo(cx, cy + bs); ctx.lineTo(cx, cy + bs - h); ctx.lineTo(cx + as, cy - h); ctx.closePath();
  ctx.fillStyle = shade(color, -0.3); ctx.fill();
  // 顶面
  diamond(ctx, cx, cy - h, as, bs); ctx.fillStyle = shade(color, 0.15); ctx.fill();
}
function windows(ctx, cx, cy, a, b, s, h, step, color) {
  const as = a * s; const bs = b * s;
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  for (let y = step; y < h - 2; y += step) {
    ctx.beginPath(); ctx.moveTo(cx - as + 2, cy - y + 1); ctx.lineTo(cx - 2, cy + bs - y - 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 2, cy + bs - y - 1); ctx.lineTo(cx + as - 2, cy - y + 1); ctx.stroke();
  }
}
function tree(ctx, x, y, z, c) {
  ctx.fillStyle = '#6b4f2a'; ctx.fillRect(x - 0.8 * z, y - 3 * z, 1.6 * z, 3 * z);
  ctx.beginPath(); ctx.arc(x, y - 5 * z, 3.6 * z, 0, Math.PI * 2); ctx.fillStyle = c || '#2f7d32'; ctx.fill();
  ctx.beginPath(); ctx.arc(x - 1 * z, y - 6 * z, 1.6 * z, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
}

const ZCOLOR = { [K.R]: '#22c55e', [K.C]: '#3b82f6', [K.I]: '#eab308' };

function drawBuilding(ctx, sim, i, cx, cy, a, b, z, t) {
  const s = sim.s; const k = s.kind[i]; const L = s.lv[i];
  const x = i % N; const y = (i - x) / N; const hh = hash(x, y);
  if (k === K.R) {
    if (L === 1) { box(ctx, cx, cy, a, b, 0.55, 6 * z, '#f5e6c8'); ctx.beginPath(); ctx.moveTo(cx - a * 0.6, cy - 6 * z); ctx.lineTo(cx, cy - 13 * z); ctx.lineTo(cx + a * 0.6, cy - 6 * z); ctx.lineTo(cx, cy + b * 0.55 - 6 * z); ctx.closePath(); ctx.fillStyle = hh % 2 ? '#c2410c' : '#b91c1c'; ctx.fill(); }
    if (L === 2) { box(ctx, cx, cy, a, b, 0.72, 15 * z, hh % 2 ? '#f1d9a8' : '#e7c9a0'); windows(ctx, cx, cy, a, b, 0.72, 15 * z, 5 * z, 'rgba(120,80,40,0.35)'); }
    if (L === 3) { box(ctx, cx, cy, a, b, 0.66, 32 * z, hh % 2 ? '#e2d3c1' : '#d6c4ad'); windows(ctx, cx, cy, a, b, 0.66, 32 * z, 4.5 * z, 'rgba(60,70,90,0.35)'); }
    if (L === 4) { box(ctx, cx, cy, a, b, 0.6, 60 * z, hh % 2 ? '#cbd5e1' : '#e2e8f0'); windows(ctx, cx, cy, a, b, 0.6, 60 * z, 4 * z, 'rgba(30,64,120,0.35)'); }
  } else if (k === K.C) {
    if (L === 1) { box(ctx, cx, cy, a, b, 0.72, 8 * z, '#dbeafe'); diamond(ctx, cx, cy - 8 * z, a * 0.72, b * 0.72); ctx.fillStyle = '#2563eb'; ctx.fill(); }
    if (L === 2) { box(ctx, cx, cy, a, b, 0.72, 22 * z, '#7dd3fc'); windows(ctx, cx, cy, a, b, 0.72, 22 * z, 4 * z, 'rgba(255,255,255,0.45)'); }
    if (L === 3) { box(ctx, cx, cy, a, b, 0.64, 44 * z, '#38bdf8'); windows(ctx, cx, cy, a, b, 0.64, 44 * z, 3.5 * z, 'rgba(255,255,255,0.45)'); }
    if (L === 4) {
      box(ctx, cx, cy, a, b, 0.58, 80 * z, hh % 2 ? '#0ea5e9' : '#3b82f6'); windows(ctx, cx, cy, a, b, 0.58, 80 * z, 3.5 * z, 'rgba(255,255,255,0.5)');
      box(ctx, cx, cy - 80 * z, a, b, 0.3, 8 * z, '#e0f2fe');
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx, cy - 88 * z); ctx.lineTo(cx, cy - 98 * z); ctx.stroke();
      if (Math.floor(t / 600) % 2) { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(cx, cy - 98 * z, 1.6 * z, 0, Math.PI * 2); ctx.fill(); }
    }
  } else if (k === K.I) {
    const smoke = (sx, sy) => { for (let p = 0; p < 3; p++) { const ph = ((t / 900 + p / 3 + hh % 7 / 7) % 1); ctx.beginPath(); ctx.arc(sx + ph * 5 * z, sy - ph * 14 * z, (1.5 + ph * 3) * z, 0, Math.PI * 2); ctx.fillStyle = `rgba(160,160,160,${0.5 * (1 - ph)})`; ctx.fill(); } };
    const col = s.cleanIndustry ? '#a3e635' : '#ca8a04';
    if (L >= 1) box(ctx, cx, cy, a, b, 0.82, (L === 1 ? 7 : L === 2 ? 11 : 15) * z, L === 1 ? '#d6b370' : col);
    if (L >= 2) { box(ctx, cx + a * 0.35, cy - b * 0.1, a, b, 0.14, (L === 2 ? 22 : 28) * z, '#9ca3af'); if (!s.cleanIndustry) smoke(cx + a * 0.35, cy - (L === 2 ? 24 : 30) * z); }
    if (L >= 3) { box(ctx, cx - a * 0.3, cy - b * 0.2, a, b, 0.14, 24 * z, '#9ca3af'); if (!s.cleanIndustry) smoke(cx - a * 0.3, cy - 26 * z); }
  } else if (k === K.POWER) {
    box(ctx, cx, cy, a, b, 0.85, 12 * z, '#9ca3af');
    ctx.beginPath(); ctx.moveTo(cx - 7 * z, cy - 8 * z); ctx.lineTo(cx - 5 * z, cy - 26 * z); ctx.lineTo(cx + 5 * z, cy - 26 * z); ctx.lineTo(cx + 7 * z, cy - 8 * z); ctx.closePath(); ctx.fillStyle = '#d1d5db'; ctx.fill();
    for (let p = 0; p < 3; p++) { const ph = ((t / 1100 + p / 3) % 1); ctx.beginPath(); ctx.arc(cx + ph * 4 * z, cy - 28 * z - ph * 12 * z, (2.5 + ph * 4) * z, 0, Math.PI * 2); ctx.fillStyle = `rgba(230,230,230,${0.7 * (1 - ph)})`; ctx.fill(); }
  } else if (k === K.WATER) {
    box(ctx, cx, cy, a, b, 0.85, 5 * z, '#bae6fd');
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(cx - 6 * z, cy - 18 * z, 12 * z, 13 * z);
    ctx.beginPath(); ctx.ellipse ? ctx.ellipse(cx, cy - 18 * z, 6 * z, 2.5 * z, 0, 0, Math.PI * 2) : ctx.arc(cx, cy - 18 * z, 6 * z, 0, Math.PI * 2); ctx.fillStyle = '#7dd3fc'; ctx.fill();
  } else if (k === K.FIRE) {
    box(ctx, cx, cy, a, b, 0.75, 12 * z, '#dc2626'); windows(ctx, cx, cy, a, b, 0.75, 12 * z, 6 * z, 'rgba(255,255,255,0.7)');
  } else if (k === K.POLICE) {
    box(ctx, cx, cy, a, b, 0.75, 12 * z, '#1d4ed8'); diamond(ctx, cx, cy - 12 * z, a * 0.3, b * 0.3); ctx.fillStyle = '#fbbf24'; ctx.fill();
  } else if (k === K.CLINIC) {
    box(ctx, cx, cy, a, b, 0.78, 16 * z, '#f8fafc');
    ctx.fillStyle = '#ef4444'; ctx.fillRect(cx - 1.5 * z, cy - 16 * z - 4 * z, 3 * z, 8 * z); ctx.fillRect(cx - 4 * z, cy - 16 * z - 1.5 * z, 8 * z, 3 * z);
  } else if (k === K.SCHOOL) {
    box(ctx, cx, cy, a, b, 0.8, 11 * z, '#fb923c'); windows(ctx, cx, cy, a, b, 0.8, 11 * z, 5 * z, 'rgba(255,255,255,0.6)');
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy - 11 * z); ctx.lineTo(cx, cy - 22 * z); ctx.stroke();
    ctx.fillStyle = '#ef4444'; ctx.fillRect(cx, cy - 22 * z, 5 * z, 3 * z);
  } else if (k === K.PARK) {
    diamond(ctx, cx, cy, a * 0.9, b * 0.9); ctx.fillStyle = '#4ade80'; ctx.fill();
    ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 1.5 * z; ctx.beginPath(); ctx.moveTo(cx - a * 0.5, cy); ctx.lineTo(cx + a * 0.5, cy); ctx.stroke();
    tree(ctx, cx - a * 0.35, cy - b * 0.2, z, '#16a34a'); tree(ctx, cx + a * 0.3, cy + b * 0.25, z, '#15803d');
  } else if (k === K.METRO) {
    box(ctx, cx, cy, a, b, 0.7, 6 * z, '#334155');
    ctx.fillStyle = '#ef4444'; ctx.fillRect(cx - 4 * z, cy - 16 * z, 8 * z, 8 * z);
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.max(6, 7 * z)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('M', cx, cy - 9.5 * z);
  }
}

// opts: { overlay, preview:{cells, ok}, sel:[x,y], t }
function drawCity(ctx, sim, cam, rect, opts) {
  opts = opts || {};
  const s = sim.s; const d = sim.d; const z = cam.z;
  const a = A * z; const b = B * z;
  const t = opts.t || 0;
  ctx.save();
  ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  // 远处的海/天背景
  ctx.fillStyle = '#1e3a5f'; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const prev = new Map();
  if (opts.preview) for (const [x, y] of opts.preview.cells) prev.set(idx(x, y), opts.preview.ok);
  for (let sum = 0; sum <= 2 * N - 2; sum++) {
    for (let gx = Math.max(0, sum - N + 1); gx <= Math.min(sum, N - 1); gx++) {
      const gy = sum - gx;
      const [cx, cy] = toScreen(cam, rect, gx, gy);
      if (cx < rect.x - a * 2 || cx > rect.x + rect.w + a * 2 || cy < rect.y - b * 2 || cy > rect.y + rect.h + 110 * z) continue;
      const i = idx(gx, gy); const ter = s.ter[i]; const k = s.kind[i]; const hh = hash(gx, gy);
      // 地面
      diamond(ctx, cx, cy, a + 0.5, b + 0.5);
      if (ter === T_WATER) ctx.fillStyle = (hh + Math.floor(t / 700)) % 9 === 0 ? '#4a93cf' : '#3b82c4';
      else if (ter === T_SAND) ctx.fillStyle = '#e8d9a0';
      else ctx.fillStyle = ['#7cb86a', '#78b565', '#82bd6f', '#76b062'][hh % 4];
      ctx.fill();
      if (k === K.ROAD) {
        diamond(ctx, cx, cy, a * 0.98, b * 0.98); ctx.fillStyle = ter === T_WATER ? '#a8a29e' : '#4b5563'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(0.6, 0.8 * z);
        for (const [dx, dy, ex, ey] of [[1, 0, a / 2, b / 2], [-1, 0, -a / 2, -b / 2], [0, 1, -a / 2, b / 2], [0, -1, a / 2, -b / 2]]) {
          if (inb(gx + dx, gy + dy) && s.kind[idx(gx + dx, gy + dy)] === K.ROAD) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + ex, cy + ey); ctx.stroke(); }
        }
      } else if (ZCOLOR[k] && s.lv[i] === 0) {
        diamond(ctx, cx, cy, a * 0.86, b * 0.86); ctx.fillStyle = ZCOLOR[k] + '55'; ctx.fill();
        ctx.strokeStyle = ZCOLOR[k]; ctx.lineWidth = 1; ctx.stroke();
      } else if (ZCOLOR[k]) {
        diamond(ctx, cx, cy, a * 0.95, b * 0.95); ctx.fillStyle = k === K.I ? '#a8a29e' : '#cbd5e1'; ctx.fill();
      }
      // 数据视图
      if (opts.overlay && ter !== T_WATER) {
        let col = null;
        if (opts.overlay === 'land') { const v = d.land[i] / 100; col = `rgba(${Math.round(255 * (1 - v))},${Math.round(200 * v)},60,0.45)`; }
        if (opts.overlay === 'pollution' && d.pol[i] > 1) col = `rgba(120,72,20,${Math.min(0.7, d.pol[i] / 50)})`;
        if ((opts.overlay === 'power' || opts.overlay === 'water') && k !== K.NONE && k !== K.ROAD) col = (opts.overlay === 'power' ? d.power[i] : d.water[i]) ? 'rgba(250,204,21,0.55)' : 'rgba(239,68,68,0.65)';
        if (opts.overlay === 'water' && col && d.water[i]) col = 'rgba(56,189,248,0.6)';
        if (opts.overlay === 'service') { let c = 0; for (const kk of [K.FIRE, K.POLICE, K.CLINIC, K.SCHOOL]) c += d.cov[kk][i]; if (c) col = `rgba(99,102,241,${0.12 * c + 0.1})`; }
        if (col) { diamond(ctx, cx, cy, a, b); ctx.fillStyle = col; ctx.fill(); }
      }
      if (prev.has(i)) { diamond(ctx, cx, cy, a * 0.92, b * 0.92); ctx.fillStyle = prev.get(i) ? 'rgba(74,222,128,0.55)' : 'rgba(248,113,113,0.6)'; ctx.fill(); }
      // 地面上的东西
      if (ter === T_FOREST && k === K.NONE) { tree(ctx, cx - a * 0.3, cy - b * 0.1, z, hh % 2 ? '#2f7d32' : '#3a8a3c'); tree(ctx, cx + a * 0.25, cy + b * 0.25, z, '#2e6b2f'); if (hh % 3 === 0) tree(ctx, cx + a * 0.1, cy - b * 0.45, z, '#357f37'); }
      if (k >= K.R && (k > K.I || s.lv[i] > 0)) drawBuilding(ctx, sim, i, cx, cy, a, b, z, t);
      // 缺水缺电提示
      if (k >= K.R && k <= K.I && s.lv[i] > 0 && (!d.power[i] || !d.water[i]) && Math.floor(t / 500) % 2) {
        ctx.beginPath(); ctx.arc(cx, cy - 20 * z, 4 * z, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.max(6, 6 * z)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('!', cx, cy - 18 * z);
      }
      if (opts.sel && opts.sel[0] === gx && opts.sel[1] === gy) { diamond(ctx, cx, cy, a, b); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke(); }
    }
  }
  ctx.restore();
}

module.exports = { drawCity, toScreen, toGrid, centerOn, A, B };
