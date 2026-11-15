// 城市模式走查：在浏览器预览里用模拟触摸修路、划区、建设施，快进若干年，截图。
// 用法：node tools/bundle.cjs && node tools/play-city.cjs <截图目录> [sandbox|shenzhen] [宽x高]
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const [out = '/tmp/city', mode = 'sandbox', size = '390x844'] = process.argv.slice(2);
  const [vw, vh] = size.split('x').map(Number);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack || e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../preview/index.html'));
  await page.evaluate(() => { localStorage.clear(); window.__wxHooks.prompt = () => 'TEST-CITY'; window.__wxHooks.confirm = () => true; });
  await page.waitForTimeout(300);
  const loc = (id) => page.evaluate((i) => window.__locate(i), id);
  const tap = async (id) => { const p = await loc(id); if (!p) throw new Error('找不到 ' + id + '：' + (await page.evaluate(() => window.__ids().join(',')))); await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.waitForTimeout(90); await page.mouse.up(); await page.waitForTimeout(100); };
  const cellXY = (x, y) => page.evaluate(([x, y]) => { const ui = window.__app.cityUI; const r = ui.rect; return { x: r.x + ui.cam.x + (x - y) * 16 * ui.cam.z, y: r.y + ui.cam.y + (x + y) * 8 * ui.cam.z }; }, [x, y]);
  const dragCells = async (a, b) => {
    const p = await cellXY(a[0], a[1]); const q = await cellXY(b[0], b[1]);
    await page.mouse.move(p.x, p.y); await page.mouse.down();
    for (let k = 1; k <= 8; k++) { await page.mouse.move(p.x + (q.x - p.x) * k / 8, p.y + (q.y - p.y) * k / 8); await page.waitForTimeout(15); }
    await page.waitForTimeout(60); await page.mouse.up(); await page.waitForTimeout(120);
  };
  const tapCell = async (c) => { const p = await cellXY(c[0], c[1]); await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.waitForTimeout(80); await page.mouse.up(); await page.waitForTimeout(120); };
  const spot = (tool, near) => page.evaluate(([tool, near]) => {
    const c = window.__app.city; const N = 32;
    for (let r = 1; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = near[0] + dx; const y = near[1] + dy;
      if (x < 0 || y < 0 || x >= N || y >= N) continue;
      if (c.plan(tool, [[x, y]]).ok) return [x, y];
    }
    return null;
  }, [tool, near]);
  const placeNear = async (tool, near) => { const p = await spot(tool, near); if (p) { await tap('tool-' + tool); await tapCell(p); } return p; };
  const shot = async (n) => { await page.waitForTimeout(200); await page.screenshot({ path: `${out}/${n}.png` }); };

  await tap('mode-city');
  await shot('01-home-city');
  await tap(mode === 'shenzhen' ? 'start-shenzhen' : 'start-sandbox');
  if (await page.evaluate(() => !!window.__app.city.s.pendingEvent)) { await shot('02a-event'); await tap('event-next'); }
  await page.evaluate(() => window.__app.cityButton('speed0')); // 暂停，按自己的节奏建
  await shot('02-start');
  // 找一块空地作为中心
  const center = await page.evaluate(() => {
    const c = window.__app.city; const s = c.s; const N = 32;
    if (s.focus) return s.focus;
    let best = [16, 16]; let bestScore = -1;
    for (let y = 8; y < 24; y++) for (let x = 8; x < 24; x++) { let sc = 0; for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const i = (y + dy) * N + x + dx; if (s.ter[i] !== 1) sc++; } if (sc > bestScore) { bestScore = sc; best = [x, y]; } }
    return best;
  });
  const [cx, cy] = center;
  await page.evaluate(([cx, cy]) => { const ui = window.__app.cityUI; ui.cam.z = 0.85; ui.cam.x = ui.rect.w / 2 - (cx - cy) * 16 * ui.cam.z; ui.cam.y = ui.rect.h / 2 - (cx + cy) * 8 * ui.cam.z; window.__app.refresh(); }, [cx, cy]);
  await page.waitForTimeout(150);
  await tap('tool-road');
  await dragCells([cx - 6, cy], [cx + 6, cy]);
  await dragCells([cx, cy - 6], [cx, cy + 6]);
  await dragCells([cx - 6, cy - 4], [cx + 6, cy - 4]);
  await dragCells([cx - 6, cy + 4], [cx + 6, cy + 4]);
  await shot('03-roads');
  await tap('tool-R'); await dragCells([cx - 5, cy - 3], [cx - 1, cy - 1]); await dragCells([cx + 1, cy - 3], [cx + 5, cy - 1]);
  await tap('tool-C'); await dragCells([cx - 5, cy + 1], [cx - 1, cy + 2]);
  await tap('tool-I'); await dragCells([cx + 1, cy + 1], [cx + 5, cy + 3]);
  await placeNear('power', [cx + 6, cy + 5]);
  await placeNear('water', [cx - 6, cy + 5]);
  await placeNear('park', [cx - 2, cy - 5]);
  await shot('04-zoned');
  const st0 = await page.evaluate(() => ({ money: window.__app.city.s.money, roads: window.__app.city.s.kind.filter((k) => k === 1).length, zones: window.__app.city.s.kind.filter((k) => k >= 2 && k <= 4).length, svc: window.__app.city.s.kind.filter((k) => k >= 10).length }));
  // 快进：直接推进模拟（每月），期间按需补设施
  const run = async (months) => page.evaluate((m) => {
    const a = window.__app; const c = a.city;
    for (let i = 0; i < m; i++) { a.cityTick(); if (c.s.pendingEvent) { c.s.pendingEvent = null; } }
    a.refresh();
    return { year: c.year, pop: c.st.pop, money: Math.round(c.s.money), title: c.st.title };
  }, months);
  const r1 = await run(36);
  await shot('05-year3');
  // 扩建：更多区和服务
  await tap('tool-road'); await dragCells([cx - 6, cy - 8], [cx + 6, cy - 8]); await dragCells([cx - 6, cy + 8], [cx + 6, cy + 8]); await dragCells([cx - 6, cy - 8], [cx - 6, cy + 8]); await dragCells([cx + 6, cy - 8], [cx + 6, cy + 8]);
  await tap('tool-R'); await dragCells([cx - 5, cy - 7], [cx + 5, cy - 5]);
  await tap('tool-I'); await dragCells([cx + 1, cy + 5], [cx + 5, cy + 7]);
  await tap('tool-C'); await dragCells([cx - 5, cy + 5], [cx - 1, cy + 7]);
  await placeNear('power', [cx + 7, cy + 6]);
  await placeNear('water', [cx - 7, cy + 6]);
  const r2 = await run(60);
  for (const t of ['fire', 'police', 'clinic', 'school', 'metro']) {
    const ok = await page.evaluate((t) => window.__app.city.unlockedTool(t).ok, t);
    if (ok) await placeNear(t, [cx, cy - 2]);
  }
  const r3 = await run(120);
  await tap('tool-pan');
  await shot('06-grown');
  // 缩放、数据视图、点选
  await page.evaluate(() => window.__app.cityButton('zin'));
  await shot('07-zoomed');
  await page.evaluate(() => window.__app.cityButton('view'));
  await shot('08-overlay-land');
  await page.evaluate(() => { window.__app.cityButton('view'); window.__app.cityButton('view'); });
  await shot('09-overlay-power');
  await page.evaluate(() => { for (let i = 0; i < 3; i++) window.__app.cityButton('view'); });
  await tapCell([cx - 3, cy - 2]);
  await shot('10-inspect');
  await page.evaluate(() => window.__app.cityButton('budget'));
  await shot('11-budget');
  console.log(JSON.stringify({ st0, r1, r2, r3, errors }, null, 2));
  await browser.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
