// 自动化走查：在浏览器预览里用模拟触摸打完一整局，按页面类型截图，汇总报错。
// 用法：node tools/bundle.cjs && node tools/play.cjs <截图目录> [种子] [宽x高]
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const out = process.argv[2] || '/tmp/play';
  const seed = process.argv[3] || 'LIFE-48291';
  const [vw, vh] = (process.argv[4] || '390x844').split('x').map(Number);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack || e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../preview/index.html'));
  await page.evaluate((s) => { localStorage.clear(); window.__wxHooks.prompt = () => s; window.__wxHooks.confirm = () => true; }, seed);
  await page.waitForTimeout(300);

  const tap = async (id) => {
    const p = await page.evaluate((i) => window.__locate(i), id);
    if (!p) throw new Error('找不到可点区域 ' + id + '；当前：' + (await page.evaluate(() => window.__ids().join(','))));
    await page.waitForTimeout(30);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(60);
  };
  const kind = () => page.evaluate(() => {
    const a = window.__app;
    if (a.screen !== 'play') return a.screen;
    const s = a.life.s;
    if (a.resultIdx !== null) return 'result';
    if (s.ended) return 'ending';
    if (s.pending.length) return 'decision';
    return 'year';
  });
  const shots = {};
  const shot = async (name, scrolls) => {
    await page.waitForTimeout(260);
    await page.screenshot({ path: `${out}/${name}.png` });
    for (let i = 1; i <= (scrolls || 0); i++) {
      const more = await page.evaluate((k) => { const r = window.__app.r; if (r.maxScroll <= 0) return false; r.scrollTo(r.H * 0.75 * k); r.layout(); r.draw(); return r.scrollY < r.maxScroll || k === 1; }, i);
      await page.waitForTimeout(80);
      await page.screenshot({ path: `${out}/${name}-${i}.png` });
      if (!more) break;
    }
    await page.evaluate(() => window.__app.r.scrollTo(0));
  };

  await tap('seed-input');
  await page.waitForTimeout(100);
  await tap('start');
  await shot('02-opening');
  await tap('go');

  let steps = 0; let decisions = 0; let intelBought = 0; let actions = 0;
  while (steps++ < 600) {
    const k = await kind();
    if (k === 'ending') break;
    if (k === 'decision') {
      const v = await page.evaluate(() => window.__app.life.view());
      if (!shots.decision) { shots.decision = 1; await shot('03-decision', 2); }
      const intel = v.intel.find((x) => !x.bought && x.affordable);
      if (intel && decisions % 3 === 0) {
        await tap('buy-intel-' + intel.id); intelBought++;
        if (!shots.intel) { shots.intel = 1; await shot('04-decision-intel', 2); }
        continue;
      }
      if (v.crisis && !shots.crisis) { shots.crisis = 1; await shot('09-crisis'); }
      const opts = v.options.filter((o) => o.enabled);
      const pick = opts[(decisions * 7 + steps) % opts.length];
      await tap('opt-' + pick.id); decisions++;
      continue;
    }
    if (k === 'result') {
      if (!shots.result) { shots.result = 1; await shot('05-result'); }
      await tap('result-next');
      continue;
    }
    if (k === 'year') {
      const age = await page.evaluate(() => window.__app.life.s.age);
      if (!shots.year && age >= 20) { shots.year = 1; await shot('06-year', 3); }
      if (age === 24) {
        await tap('toggle-ledger'); await tap('toggle-money');
        const ids0 = await page.evaluate(() => window.__ids());
        if (ids0.includes('prod-index_fund')) await tap('prod-index_fund');
        const ids = await page.evaluate(() => window.__ids());
        const buy = ids.find((i) => /^buy-index_fund-10000$/.test(i));
        if (buy) { await tap(buy); actions++; }
        await tap('mix-aggressive'); actions++;
        await shot('07-year-money', 4);
        await tap('toggle-money');
      }
      const hasVenture = await page.evaluate(() => !!(window.__app.life.s.venture && window.__app.life.s.venture.active));
      if (hasVenture && !shots.venture) {
        shots.venture = 1;
        await tap('v-hire'); actions++;
        await shot('08-venture');
      }
      if (!shots.house && age >= 30) {
        const can = await page.evaluate(() => window.__app.life.canBuyHouse().ok && !(window.__app.life.s.assets.housing_market_value > 0));
        if (can) {
          shots.house = 1;
          await tap('toggle-money'); await tap('buy-house'); await page.waitForTimeout(150);
          const owned = await page.evaluate(() => window.__app.life.s.assets.housing_market_value > 0);
          if (!owned) throw new Error('买房确认后没有生效');
          actions++; await shot('14-after-house', 2); await tap('toggle-money');
        }
      }
      await tap('advance');
      continue;
    }
    throw new Error('未知页面 ' + k);
  }
  await shot('10-ending', 6);
  // 解锁完整复盘 + 分享
  await tap('unlock-review');
  await shot('11-ending-review', 3);
  await tap('share');
  const summary = await page.evaluate(() => {
    const s = window.__app.life.s;
    return { seed: s.seed, age: s.age, endings: s.endings.map((e) => e.name), decisions: window.__app.life.decisionCounts(), nw: Math.round(s.net_worth), anomalies: s.anomalies, shared: window.__wxHooks.shared.map((x) => ({ title: x.title, query: x.query, img: !!x.imageUrl })) };
  });
  // 分享卡图片
  const img = await page.evaluate(() => (window.__wxHooks.shared[0] || {}).imageUrl || '');
  if (img.startsWith('data:image/png')) fs.writeFileSync(`${out}/12-sharecard.png`, Buffer.from(img.split(',')[1], 'base64'));
  // 回首页：应出现「继续存档」以外的状态（本局已结束），再测分享进入
  await tap('home');
  await shot('13-home-after');
  console.log(JSON.stringify({ steps, decisions, intelBought, actions, summary, errors }, null, 2));
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
