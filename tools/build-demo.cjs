// 生成单文件网页 demo：dist/demo.html（wx 模拟层 + 游戏代码内联）
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
require('child_process').execSync('node tools/bundle.cjs', { cwd: root, stdio: 'inherit' });
const shim = fs.readFileSync(path.join(root, 'preview/wx-shim.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'preview/game.bundle.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<title>这局人生 · 试玩（全球商业 + 当市长）</title>
<style>html,body{margin:0;padding:0;height:100%;background:#020617;overflow:hidden;overscroll-behavior:none}canvas{display:block}</style>
</head>
<body>
<script>window.__DEMO = true;</script>
<script>${shim}</script>
<script>${game}</script>
</body>
</html>
`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/demo.html'), html);
console.log('dist/demo.html', html.length, 'bytes');
