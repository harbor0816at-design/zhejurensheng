// 当市长模式：地图页（等距地图 + 工具栏）、预算页、历史事件页、剧本结局页
const T = require('../ui/theme.js');
const { icon } = require('../ui/icons.js');
const { roundRect } = require('../ui/core.js');
const { N, K, SERVICES, ZONES, group, ROAD_COST, ZONE_COST } = require('../city/sim.js');
const R = require('../city/render.js');

const TOOLS = [
  { id: 'pan', label: '查看', icon: 'hand', color: '#64748b', hint: '拖动地图、双指缩放；点一下地块看详情' },
  { id: 'road', label: '道路', icon: 'road', color: '#475569', hint: `按住拖动画道路，每格 ¥${ROAD_COST}，过河修桥更贵` },
  { id: 'R', label: '住宅', icon: 'house', color: '#16a34a', hint: `拖出一块区域划住宅区，每格 ¥${ZONE_COST}；要在道路 2 格内` },
  { id: 'C', label: '商业', icon: 'shop', color: '#2563eb', hint: '划商业区：提供岗位，需要人口带动' },
  { id: 'I', label: '工业', icon: 'factory', color: '#ca8a04', hint: '划工业区：岗位多，但有污染，离住宅远一点' },
  { id: 'bulldoze', label: '拆除', icon: 'bulldoze', color: '#dc2626', hint: '拖出一块区域拆除，每格 ¥1' },
  { id: 'power', label: '电厂', icon: 'bolt', color: '#f59e0b' },
  { id: 'water', label: '水厂', icon: 'drop', color: '#0ea5e9' },
  { id: 'fire', label: '消防', icon: 'flame', color: '#ef4444' },
  { id: 'police', label: '警察', icon: 'shield', color: '#1d4ed8' },
  { id: 'clinic', label: '医院', icon: 'cross', color: '#e11d48' },
  { id: 'school', label: '学校', icon: 'cap', color: '#ea580c' },
  { id: 'park', label: '公园', icon: 'tree', color: '#16a34a' },
  { id: 'metro', label: '地铁', icon: 'metro', color: '#334155' }
];
const OVERLAYS = [null, 'land', 'pollution', 'power', 'water', 'service'];
const OVERLAY_NAME = { land: '地价', pollution: '污染', power: '电力', water: '供水', service: '公共服务覆盖' };

function svcOf(id) { for (const k of Object.keys(SERVICES)) if (SERVICES[k].id === id) return SERVICES[k]; return null; }
function money(v) { return `${v < 0 ? '−' : ''}¥${group(Math.abs(Math.round(v)))}`; }

function cellsFor(tool, a, b) {
  const out = [];
  if (tool === 'road') { // 先横后竖的 L 形
    const sx = Math.sign(b[0] - a[0]) || 1; const sy = Math.sign(b[1] - a[1]) || 1;
    for (let x = a[0]; x !== b[0] + sx; x += sx) out.push([x, a[1]]);
    for (let y = a[1] + sy; y !== b[1] + sy; y += sy) out.push([b[0], y]);
    if (a[1] === b[1]) return out.filter((c, i, arr) => arr.findIndex((d) => d[0] === c[0] && d[1] === c[1]) === i);
    return out;
  }
  if (tool === 'R' || tool === 'C' || tool === 'I' || tool === 'bulldoze') {
    const x0 = Math.min(a[0], b[0]); const x1 = Math.max(a[0], b[0]); const y0 = Math.min(a[1], b[1]); const y1 = Math.max(a[1], b[1]);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
    return out;
  }
  return [b];
}

function cityPage(app) {
  const sim = app.city;
  const ui = app.cityUI;
  const st = sim.st; const s = sim.s;
  let btns = [];

  const surface = {
    draw(ctx, rect) {
      if (!ui.camInit) { ui.cam.z = rect.w < 500 ? 1.0 : 1.3; const f = s.focus || [N / 2, N / 2]; R.centerOn(ui.cam, rect, f[0], f[1]); ui.camInit = true; }
      ui.rect = rect;
      R.drawCity(ctx, sim, ui.cam, rect, { overlay: ui.overlay, preview: ui.preview, sel: ui.sel, t: Date.now() });
      btns = [];
      // 需求条 R C I
      const bx = rect.x + 10; const by = rect.y + 10;
      ctx.fillStyle = 'rgba(15,23,42,0.72)'; roundRect(ctx, bx, by, 76, 64, 10); ctx.fill();
      [['R', '#22c55e'], ['C', '#3b82f6'], ['I', '#eab308']].forEach(([k, c], n) => {
        const x = bx + 12 + n * 22; const mid = by + 30; const v = st.dem[k];
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x, by + 8, 10, 44);
        ctx.fillStyle = v >= 0 ? c : '#ef4444';
        const h = Math.abs(v) * 22; ctx.fillRect(x, v >= 0 ? mid - h : mid, 10, h);
        ctx.fillStyle = '#e2e8f0'; ctx.font = T.font(10, 700); ctx.textAlign = 'center'; ctx.fillText(k === 'R' ? '住' : k === 'C' ? '商' : '工', x + 5, by + 61);
      });
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(bx + 8, by + 30, 62, 1);
      // 右上：速度、视图、预算、缩放
      const items = [
        { id: 'speed0', icon: 'pause', on: app.citySpeed === 0 }, { id: 'speed1', icon: 'play', on: app.citySpeed === 1 }, { id: 'speed3', icon: 'ff', on: app.citySpeed === 3 },
        { id: 'view', icon: 'eye', on: !!ui.overlay }, { id: 'budget', icon: 'coin', on: false }, { id: 'zin', icon: 'plus' }, { id: 'zout', icon: 'minus' }
      ];
      const size = 36; const gap = 6;
      items.forEach((it, n) => {
        const col = n < 3 ? n : n - 3; const row = n < 3 ? 0 : 1;
        const x = rect.x + rect.w - 10 - (row === 0 ? 3 : 4) * (size + gap) + gap + col * (size + gap);
        const y = rect.y + 10 + row * (size + gap);
        ctx.fillStyle = it.on ? '#ffffff' : 'rgba(15,23,42,0.72)'; roundRect(ctx, x, y, size, size, 10); ctx.fill();
        const tmp = []; icon((c) => tmp.push(c), it.icon, x + 8, y + 8, 20, it.on ? '#0f172a' : '#e2e8f0');
        drawPrims(ctx, tmp);
        btns.push({ id: it.id, x, y, w: size, h: size });
      });
      if (ui.overlay) {
        const txt = `数据视图：${OVERLAY_NAME[ui.overlay]}（点眼睛切换）`;
        ctx.font = T.font(12, 600); const w = ctx.measureText(txt).width + 20;
        ctx.fillStyle = 'rgba(15,23,42,0.8)'; roundRect(ctx, rect.x + (rect.w - w) / 2, rect.y + rect.h - 40, w, 28, 14); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(txt, rect.x + rect.w / 2, rect.y + rect.h - 21);
      }
      // 剧本目标
      const g = sim.currentGoal();
      if (g) {
        const txt = `目标：${g.text}（现在 ${group(st.pop)}）`;
        ctx.font = T.font(12, 600); const w = Math.min(rect.w - 20, ctx.measureText(txt).width + 22);
        ctx.fillStyle = 'rgba(250,204,21,0.92)'; roundRect(ctx, rect.x + 10, rect.y + 82, w, 26, 13); ctx.fill();
        ctx.fillStyle = '#422006'; ctx.textAlign = 'left'; ctx.fillText(txt, rect.x + 21, rect.y + 99, w - 20);
      }
    },
    down(pts) {
      if (pts.length >= 2) {
        const [p, q] = pts;
        ui.g = { mode: 'pinch', d0: Math.hypot(p.x - q.x, p.y - q.y), z0: ui.cam.z, mx: (p.x + q.x) / 2, my: (p.y + q.y) / 2, cx: ui.cam.x, cy: ui.cam.y };
        ui.preview = null;
        return;
      }
      const p = pts[0];
      const b = btns.find((x) => p.x >= x.x && p.x <= x.x + x.w && p.y >= x.y && p.y <= x.y + x.h);
      if (b) { ui.g = { mode: 'button', id: b.id }; return; }
      const cell = R.toGrid(ui.cam, ui.rect, p.x, p.y);
      ui.g = { mode: ui.tool === 'pan' ? 'pan' : 'paint', x0: p.x, y0: p.y, cx: ui.cam.x, cy: ui.cam.y, cell, moved: false };
      if (ui.g.mode === 'paint') updatePreview(cell);
    },
    move(pts) {
      const g = ui.g; if (!g) return;
      if (pts.length >= 2 && g.mode !== 'pinch') { surface.down(pts); return; }
      if (g.mode === 'pinch' && pts.length >= 2) {
        const [p, q] = pts;
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        const z = Math.max(0.5, Math.min(2.6, g.z0 * d / Math.max(1, g.d0)));
        const mx = (p.x + q.x) / 2; const my = (p.y + q.y) / 2;
        const r = z / g.z0;
        ui.cam.z = z;
        ui.cam.x = mx - ui.rect.x - (g.mx - ui.rect.x - g.cx) * r;
        ui.cam.y = my - ui.rect.y - (g.my - ui.rect.y - g.cy) * r;
        return;
      }
      const p = pts[0];
      if (Math.abs(p.x - g.x0) + Math.abs(p.y - g.y0) > 6) g.moved = true;
      if (g.mode === 'pan') { ui.cam.x = g.cx + (p.x - g.x0); ui.cam.y = g.cy + (p.y - g.y0); clampCam(); }
      if (g.mode === 'paint') updatePreview(R.toGrid(ui.cam, ui.rect, p.x, p.y));
    },
    up(left) {
      const g = ui.g;
      if (!g) return;
      if (left.length) return; // 还有手指在屏幕上
      ui.g = null;
      if (g.mode === 'button') { app.cityButton(g.id); return; }
      if (g.mode === 'pan' && !g.moved) {
        const [x, y] = g.cell;
        ui.sel = x >= 0 && y >= 0 && x < N && y < N ? [x, y] : null;
        app.refresh();
        return;
      }
      if (g.mode === 'paint' && ui.preview) {
        const cells = ui.preview.raw;
        ui.preview = null;
        app.cityBuild(ui.tool, cells);
      }
    },
    wheel(dy, x, y) {
      const z0 = ui.cam.z; const z = Math.max(0.5, Math.min(2.6, z0 * (dy > 0 ? 0.9 : 1.1)));
      const r = z / z0;
      ui.cam.x = x - ui.rect.x - (x - ui.rect.x - ui.cam.x) * r;
      ui.cam.y = y - ui.rect.y - (y - ui.rect.y - ui.cam.y) * r;
      ui.cam.z = z;
    }
  };
  function clampCam() {
    const rc = ui.rect; const z = ui.cam.z;
    const minX = rc.w / 2 - N * R.A * z; const maxX = rc.w / 2 + N * R.A * z;
    const minY = rc.h / 2 - 2 * N * R.B * z; const maxY = rc.h / 2;
    ui.cam.x = Math.max(minX, Math.min(maxX, ui.cam.x)); ui.cam.y = Math.max(minY, Math.min(maxY, ui.cam.y));
  }
  function updatePreview(cell) {
    const raw = cellsFor(ui.tool, ui.g.cell, cell);
    const p = sim.plan(ui.tool, raw);
    ui.preview = { cells: p.cells && p.cells.length ? p.cells : raw.filter(([x, y]) => x >= 0 && y >= 0 && x < N && y < N), ok: p.ok, raw, cost: p.cost, reason: p.reason };
  }

  return {
    animate: true, animateMs: 90, toastTop: true,
    header(f, hdrH, sys) {
      const mb = sys.menu;
      const cy = mb && mb.top ? (mb.top + mb.bottom) / 2 : sys.statusBar + 22;
      const x = T.side;
      f.push({ t: 'rect', x, y: cy - 16, w: 32, h: 32, r: 16, fill: 'rgba(255,255,255,0.10)' });
      for (let i = -1; i <= 1; i++) f.push({ t: 'rect', x: x + 9, y: cy - 1 + i * 5, w: 14, h: 2, r: 1, fill: '#e2e8f0' });
      f.hit(x - 6, cy - 22, 44, 44, () => app.goHome(), 'nav-home');
      const net = st.income - st.upkeep;
      f.push({ t: 'text', x: x + 42, y: cy - 1, s: `${s.name} · ${sim.year}年${sim.monthOfYear}月 · ${st.title}`, font: T.font(15, 700), color: '#fff' });
      f.push({ t: 'text', x: x + 42, y: cy + 15, s: `人口 ${group(st.pop)}   ${money(s.money)}（${net >= 0 ? '+' : '−'}${group(Math.abs(net))}/月）`, font: T.font(12, 600), color: s.money < 0 ? '#fca5a5' : '#cbd5e1' });
    },
    surface,
    footer(f) {
      // 信息条：建造预览 / 地块详情 / 工具提示
      const y = f.y; const h = 40;
      f.push({ t: 'rect', x: f.x, y, w: f.w, h, r: 10, fill: 'rgba(255,255,255,0.07)' });
      let line1 = ''; let line2 = ''; let c2 = T.c.onDarkMuted;
      const tool = TOOLS.find((t) => t.id === ui.tool);
      if (ui.preview) {
        line1 = ui.preview.ok ? `${tool.label}：${ui.preview.cells.length} 格，花费 ${money(ui.preview.cost || 0)}` : `${tool.label}：${ui.preview.reason || '这里建不了'}`;
        line2 = ui.preview.ok ? '松手确认' : '换个位置试试'; c2 = ui.preview.ok ? '#86efac' : '#fca5a5';
      } else if (ui.tool === 'pan' && ui.sel) {
        const info = sim.inspect(ui.sel[0], ui.sel[1]);
        if (info) {
          line1 = `${info.title}${info.cap !== undefined && info.cap ? ` · ${info.capLabel} ${info.cap}` : ''} · 地价 ${info.land}${info.pol > 3 ? ` · 污染 ${info.pol}` : ''}`;
          line2 = info.issues && info.issues.length ? '⚠ ' + info.issues.join('；') : (info.desc || '一切正常'); c2 = info.issues && info.issues.length ? '#fcd34d' : '#86efac';
        }
      } else {
        const sv = svcOf(ui.tool);
        line1 = sv ? `${sv.name}：建造 ${money(sv.cost)}，每月维护 ${money(sv.upkeep)}` : tool.hint;
        line2 = sv ? `${sv.desc}${sv.radius ? `，覆盖半径 ${sv.radius} 格` : ''}；要紧挨道路，点一下放置` : (ui.tool === 'pan' ? `电 ${Math.round(st.powerUse)}/${st.powerCap} · 水 ${Math.round(st.waterUse)}/${st.waterCap} · 失业 ${group(st.unemployed)}` : '');
      }
      f.push({ t: 'text', x: f.x + 10, y: y + 17, s: line1, font: T.font(12, 600), color: '#fff' });
      f.push({ t: 'text', x: f.x + 10, y: y + 33, s: line2, font: T.font(11), color: c2 });
      f.y += h + 8;
      // 工具栏 2 行 × 7
      const cols = 7; const gap = 5;
      const w = (f.w - gap * (cols - 1)) / cols; const bh = 50;
      TOOLS.forEach((tl, n) => {
        const x = f.x + (n % cols) * (w + gap); const yy = f.y + Math.floor(n / cols) * (bh + gap);
        const lock = sim.unlockedTool(tl.id);
        const on = ui.tool === tl.id;
        f.push({ t: 'rect', x, y: yy, w, h: bh, r: 10, fill: on ? '#ffffff' : lock.ok ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.03)' });
        icon(f.push.bind(f), tl.icon, x + w / 2 - 10, yy + 7, 20, on ? tl.color : lock.ok ? '#e2e8f0' : 'rgba(226,232,240,0.25)');
        f.push({ t: 'text', x: x + w / 2, y: yy + 43, s: tl.label, font: T.font(10, 600), color: on ? T.c.ink : lock.ok ? '#cbd5e1' : 'rgba(203,213,225,0.35)', align: 'center' });
        f.hit(x, yy, w, bh, () => app.cityTool(tl.id), 'tool-' + tl.id, { r: 10 });
      });
      f.y += 2 * bh + gap;
    }
  };
}

// 把 icon() 产生的显示命令直接画到 ctx（地图浮层用）
function drawPrims(ctx, list) {
  for (const c of list) {
    if (c.t === 'rect') { roundRect(ctx, c.x, c.y, c.w, c.h, c.r || 0); ctx.fillStyle = c.fill; ctx.fill(); }
    if (c.t === 'circle') { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); if (c.fill) { ctx.fillStyle = c.fill; ctx.fill(); } if (c.stroke) { ctx.strokeStyle = c.stroke; ctx.lineWidth = c.lw || 1; ctx.stroke(); } }
    if (c.t === 'poly') { ctx.beginPath(); ctx.moveTo(c.pts[0][0], c.pts[0][1]); for (let i = 1; i < c.pts.length; i++) ctx.lineTo(c.pts[i][0], c.pts[i][1]); if (c.fill) { ctx.closePath(); ctx.fillStyle = c.fill; ctx.fill(); } if (c.color) { ctx.strokeStyle = c.color; ctx.lineWidth = c.lw || 1.5; ctx.stroke(); } }
  }
}

function cityHeader(app) {
  return (f, hdrH, sys) => {
    const mb = sys.menu; const cy = mb && mb.top ? (mb.top + mb.bottom) / 2 : sys.statusBar + 22;
    f.push({ t: 'text', x: T.side, y: cy + 5, s: `${app.city.s.name} · ${app.city.year}年`, font: T.font(16, 700), color: '#fff' });
  };
}

function budgetPage(app) {
  const sim = app.city; const s = sim.s;
  return {
    header: cityHeader(app),
    body(f) {
      const st = sim.st;
      f.card({}, (c) => {
        c.eyebrow('市财政');
        c.title(money(s.money), { size: 26, color: s.money < 0 ? T.c.neg : T.c.ink });
        c.row('每月税收', money(st.income), { valueColor: T.c.pos });
        c.row('每月维护', '−' + money(st.upkeep), { valueColor: T.c.neg });
        c.row('每月结余', money(st.income - st.upkeep), { valueColor: st.income >= st.upkeep ? T.c.pos : T.c.neg, valueWeight: 800 });
      });
      f.card({}, (c) => {
        c.sectionTitle('税率', '税越高，收入越多，但需求越低');
        [['R', '住宅'], ['C', '商业'], ['I', '工业']].forEach(([k, n]) => {
          const y = c.y; const h = 44;
          c.push({ t: 'text', x: c.x, y: y + 28, s: `${n}税`, font: T.font(15, 600), color: T.c.ink });
          c.push({ t: 'text', x: c.x + c.w - 70, y: y + 28, s: `${s.tax[k]}%`, font: T.font(17, 800), color: T.c.ink, align: 'center' });
          c.button('−', () => app.cityTax(k, -1), { kind: 'ghost', x: c.x + c.w - 130, w: 40, h: 36, size: 18, inline: true, id: `tax-${k}-down` });
          c.button('+', () => app.cityTax(k, 1), { kind: 'ghost', x: c.x + c.w - 40, w: 40, h: 36, size: 18, inline: true, id: `tax-${k}-up` });
          c.y += h;
        });
      });
      f.card({}, (c) => {
        c.sectionTitle('城市概况');
        c.row('人口', group(st.pop));
        c.row('岗位（商业 / 工业）', `${group(st.jobsC)} / ${group(st.jobsI)}`);
        c.row('失业', group(st.unemployed));
        c.row('电力', `${Math.round(st.powerUse)} / ${st.powerCap}`, { valueColor: st.powerUse > st.powerCap * 0.9 ? T.c.warn : T.c.ink });
        c.row('供水', `${Math.round(st.waterUse)} / ${st.waterCap}`, { valueColor: st.waterUse > st.waterCap * 0.9 ? T.c.warn : T.c.ink });
        c.row('住宅平均地价', String(st.happy));
        c.row('贷款', `${s.loans} 笔（每笔 ¥20,000，月息 ¥300）`);
        c.gap(4);
        c.buttons([
          { label: '借 ¥20,000', disabled: s.loans >= 3, onTap: () => app.cityLoan('borrow'), id: 'loan-borrow' },
          { label: '还一笔', disabled: !s.loans || s.money < 20000, onTap: () => app.cityLoan('repay'), id: 'loan-repay' }
        ], { size: 13 });
      });
      if (s.news.length) {
        f.card({}, (c) => {
          c.sectionTitle('城市快讯');
          s.news.slice(0, 8).forEach((n) => c.text('· ' + (n.title ? `${n.year} ${n.title}：${n.text}` : n.text), { size: 12, color: T.c.body, lh: 1.55 }));
        });
      }
    },
    footer(f) { f.button('回到地图', () => app.setCityView('map'), { id: 'back', after: 0 }); }
  };
}

function eventPage(app) {
  const ev = app.city.s.pendingEvent;
  return {
    header: cityHeader(app),
    body(f) {
      f.gap(30);
      f.card({ pad: 22 }, (c) => {
        c.text(String(ev.year), { size: 40, weight: 800, color: T.c.accent, align: 'center', lh: 1.3 });
        c.text(ev.title, { size: 22, weight: 800, color: T.c.ink, align: 'center', lh: 1.4 });
        c.gap(10);
        c.text(ev.text, { size: 15, color: T.c.body, lh: 1.7 });
        c.gap(6);
        c.text('历史事件按公开资料改写，游戏效果为示意。', { size: 11, color: T.c.faint, align: 'center', lh: 1.6 });
      });
    },
    footer(f) { f.button('继续建设', () => app.cityCloseEvent(), { id: 'event-next', after: 0 }); }
  };
}

function endPage(app) {
  const sim = app.city; const r = sim.result();
  return {
    header: cityHeader(app),
    body(f) {
      f.card({ pad: 20 }, (c) => {
        c.text(`${sim.s.name} · 1980 → 2020`, { size: 12, weight: 600, color: T.c.accent, align: 'center', lh: 1.6 });
        c.text('★'.repeat(r.stars) + '☆'.repeat(5 - r.stars), { size: 34, weight: 800, color: '#f59e0b', align: 'center', lh: 1.4 });
        c.text(`你把渔村建成了「${r.title}」`, { size: 18, weight: 700, color: T.c.ink, align: 'center', lh: 1.5 });
        c.gap(8);
        c.tiles([{ k: '人口', v: group(r.pop) }, { k: '最高人口', v: group(r.maxPop) }, { k: '财政', v: money(r.money) }, { k: '住宅平均地价', v: String(r.happy) }], 2, { after: 0 });
      });
      f.card({}, (c) => {
        c.sectionTitle('剧本目标');
        r.goals.forEach((g) => c.text(`${g.met ? '✓' : '✗'} ${g.text}`, { size: 14, color: g.met ? T.c.pos : T.c.neg, lh: 1.7 }));
      });
      f.card({}, (c) => {
        c.button('继续自由建设这座城市', () => app.cityFreePlay(), { id: 'free-play' });
        c.button('重新开始剧本', () => app.startCity('shenzhen'), { kind: 'secondary', id: 'restart-city' });
        c.button('回到首页', () => app.goHome(), { kind: 'link', h: 34, size: 13, after: 0, id: 'home' });
      });
    }
  };
}

module.exports = { cityPage, budgetPage, eventPage, endPage, TOOLS, OVERLAYS };
