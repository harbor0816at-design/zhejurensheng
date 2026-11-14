// 浏览器预览截图：node tools/shot.cjs <输出目录> [脚本]
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp/shots';
  require('fs').mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../preview/index.html') + (process.argv[3] || ''));
  await page.waitForTimeout(600);
  await page.screenshot({ path: out + '/01-home.png' });
  console.log('ids:', await page.evaluate(() => window.__ids()));
  console.log('errors:', errors);
  await browser.close();
})();
