// 自动化走查（全球商业版）：模拟触摸打完一整局（含拖拽、慢点击），按页面截图，汇总报错。
// 用法：node tools/bundle.cjs && node tools/play.cjs <截图目录> [种子] [行业] [总部] [宽x高]
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const [out = '/tmp/play', seed = 'BIZ-48291', ind = 'electronics', hq = 'US', size = '390x844'] = process.argv.slice(2);
  const [vw, vh] = size.split('x').map(Number);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack || e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../preview/index.html'));
  await page.evaluate((s) => { localStorage.clear(); window.__wxHooks.prompt = (o) => (o.title === '种子码' ? s : null); window.__wxHooks.confirm = () => true; }, seed);
  await page.waitForTimeout(300);
  const loc = (id) => page.evaluate((i) => window.__locate(i), id);
  const tap = async (id) => {
    const p = await loc(id);
    if (!p) throw new Error('找不到 ' + id + '；当前：' + (await page.evaluate(() => window.__ids().join(','))));
    await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.waitForTimeout(90); await page.mouse.up();
    await page.waitForTimeout(80);
  };
  const drag = async (from, to) => {
    const a = await loc(from); const b = await loc(to);
    if (!a || !b) throw new Error('拖拽找不到 ' + from + ' / ' + to);
    await page.mouse.move(a.x, a.y); await page.mouse.down();
    for (let k = 1; k <= 8; k++) { await page.mouse.move(a.x + (b.x - a.x) * k / 8, a.y + (b.y - a.y) * k / 8); await page.waitForTimeout(16); }
    await page.waitForTimeout(60); await page.mouse.up(); await page.waitForTimeout(80);
  };
  const state = () => page.evaluate(() => {
    const a = window.__app; if (a.screen !== 'play') return { k: a.screen };
    const s = a.life.s;
    const k = a.view === 'report' ? 'report' : a.view === 'reveal' && s.caseResult ? 'reveal' : s.caseId ? 'case' : s.ended ? 'ending' : a.view;
    return { k, year: s.year, ap: s.ap };
  });
  const shots = {};
  const shot = async (name, scrolls) => {
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${out}/${name}.png` });
    for (let i = 1; i <= (scrolls || 0); i++) {
      const more = await page.evaluate((k) => { const r = window.__app.r; if (r.maxScroll <= 0) return false; r.scrollTo(r.H * 0.7 * k); r.layout(); r.draw(); return true; }, i);
      if (!more) break;
      await page.waitForTimeout(60);
      await page.screenshot({ path: `${out}/${name}-${i}.png` });
    }
    await page.evaluate(() => window.__app.r.scrollTo(0));
  };

  await shot('01-home', 2);
  const tapIf = async (id) => { if ((await page.evaluate(() => window.__ids())).includes(id)) await tap(id); };
  await tapIf('ind-' + ind); await tapIf('hq-' + hq); await tap('seed-input'); await page.waitForTimeout(100);
  await tap('start');
  let cardsPlayed = 0; let steps = 0; let drags = 0; let cases = 0; let caseIdx = 0;
  const plan = { 1995: [['export', 'UK'], ['export', 'DE']], 1996: [['branch', 'UK']], 1997: [['campaign', hq]], 1998: [['export', 'CN'], ['export', 'JP']], 2000: [['factory', 'VN']], 2002: [['branch', 'CN']], 2004: [['export', 'IN'], ['branch', 'DE']], 2006: [['export', 'BR'], ['export', 'MX']], 2009: [['branch', 'JP']], 2012: [['branch', 'IN']], 2016: [['factory', 'MX']] };
  while (steps++ < 1500) {
    const st = await state();
    if (st.k === 'ending') break;
    if (st.k === 'board') {
      if (!shots.board) { shots.board = 1; await shot('02-board', 1); }
      for (const [t, c] of plan[st.year] || []) {
        const ok = await page.evaluate(([t, c]) => window.__app.life.check(t, c).ok, [t, c]);
        if (ok) {
          const before = await page.evaluate(() => window.__app.life.s.ap);
          await drag('token-' + t, 'tile-' + c); drags++;
          const after = await page.evaluate(() => window.__app.life.s.ap);
          if (after !== before - 1) throw new Error(`拖拽 ${t}→${c} 没生效`);
        }
      }
      if (st.year === 1996 && !shots.country) { shots.country = 1; await tap('tile-UK'); await shot('03-country', 2); await tap('back'); }
      if (st.year === 1999 && !shots.strategy) {
        shots.strategy = 1; await tap('strategy'); await tapIf('pol-rnd-high'); await tapIf('pol-lines-premium'); await shot('04-strategy', 2);
        await tap('tab-capital'); await shot('04b-capital', 2); await tap('tab-org'); await tapIf('pol-ceo-pro'); await shot('04c-org', 2);
        await tap('tab-supply'); await tapIf('pol-channel-online'); await tap('tab-overview'); await shot('04d-overview', 1); await tap('back');
      }
      if (st.year === 2006 && !shots.acq) { shots.acq = 1; await tap('tile-UK'); await tapIf('act-acquire'); await shot('03b-country-acq', 2); await tap('back'); }
      if (st.year === 2030 && !shots.future) { shots.future = 1; await shot('05b-board-2030'); }
      if (st.year === 2001) await shot('05-board-2001');
      // 打牌：先拖一张国家卡，再点一张公司卡
      const hand = await page.evaluate(() => window.__app.life.cardsView().map((c) => ({ id: c.id, t: c.target })));
      const cc = hand.find((h) => h.t === 'country');
      if (cc && (await page.evaluate(() => window.__app.life.s.ap)) > 0) {
        const tgt = await page.evaluate((id) => { const L = window.__app.life; return ['US', 'UK', 'DE', 'CN', 'JP', 'IN', 'BR', 'MX', 'VN'].find((c) => L.cardCheck(id, c).ok) || null; }, cc.id);
        if (tgt) { await drag('card-' + cc.id, 'tile-' + tgt); cardsPlayed++; if (!shots.cardres) { shots.cardres = 1; await shot('05c-card-result', 1); } await tapIf('card-ok'); }
      }
      const co = hand.find((h) => h.t === 'company');
      if (co && (await page.evaluate((id) => window.__app.life.cardCheck(id, null).ok, co.id))) {
        await tap('card-' + co.id); if (!shots.card) { shots.card = 1; await shot('05d-card', 1); }
        await tap('play-card'); cardsPlayed++; await tapIf('card-ok');
      }
      await tap('end-year');
      if ((await state()).k === 'board') await tap('end-year'); // 有剩余行动点时需要确认第二次
      continue;
    }
    if (st.k === 'case') {
      if (!shots.case) { shots.case = 1; await tap('meta-consult'); await shot('06-case', 2); }
      if (st.year > 2024 && !shots.fcase) { shots.fcase = 1; await tap('meta-partner'); await shot('06b-future-case', 2); }
      const opts = await page.evaluate(() => window.__app.life.caseView().options.map((o) => o.id));
      await tap('case-' + opts[caseIdx++ % opts.length]); cases++;
      continue;
    }
    if (st.k === 'reveal') { if (!shots.reveal) { shots.reveal = 1; await shot('07-reveal', 2); } await tap('reveal-next'); continue; }
    if (st.k === 'report') { if (!shots.report && st.year >= 1999) { shots.report = 1; await shot('08-report', 2); } await tap('report-next'); continue; }
    if (st.k === 'country' || st.k === 'strategy') { await tap('back'); continue; }
    throw new Error('未知页面 ' + JSON.stringify(st));
  }
  await shot('09-ending', 6);
  await tap('share');
  const img = await page.evaluate(() => (window.__wxHooks.shared[0] || {}).imageUrl || '');
  if (img.startsWith('data:image/png')) fs.writeFileSync(`${out}/10-sharecard.png`, Buffer.from(img.split(',')[1], 'base64'));
  const summary = await page.evaluate(() => { const s = window.__app.life.s; return { name: s.name, valuation: Math.round(s.valuation), endings: s.endings.map((e) => e.name), cases: s.caseLog.length, restructures: s.restructures, shared: window.__wxHooks.shared.map((x) => ({ t: x.title, q: x.query })) }; });
  console.log(JSON.stringify({ steps, drags, cardsPlayed, cases, summary, errors }, null, 2));
  await browser.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
