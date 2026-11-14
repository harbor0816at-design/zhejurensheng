// 把小游戏的 CommonJS 模块打成一个文件，供浏览器预览（preview/index.html）使用。
// 用法：node tools/bundle.cjs   → 生成 preview/game.bundle.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const entry = path.join(root, 'game.js');
const modules = new Map();

function load(file) {
  if (modules.has(file)) return;
  const src = fs.readFileSync(file, 'utf8');
  modules.set(file, null);
  const deps = {};
  const re = /require\((['"])(\.{1,2}\/[^'"]+)\1\)/g;
  let m;
  while ((m = re.exec(src))) {
    let dep = path.resolve(path.dirname(file), m[2]);
    if (!dep.endsWith('.js')) dep += '.js';
    deps[m[2]] = path.relative(root, dep);
    load(dep);
  }
  modules.set(file, { id: path.relative(root, file), src, deps });
}
load(entry);

let out = '(function(){\nvar __defs = {}, __cache = {};\n';
out += 'function __req(id){ if(__cache[id]) return __cache[id].exports; var m = __cache[id] = { exports: {} }; __defs[id](m, m.exports); return m.exports; }\n';
for (const mod of modules.values()) {
  out += `__defs[${JSON.stringify(mod.id)}] = function(module, exports){\n`;
  out += `var require = function(p){ var map = ${JSON.stringify(mod.deps)}; return __req(map[p]); };\n`;
  out += mod.src + '\n};\n';
}
out += `window.__app = __req(${JSON.stringify(path.relative(root, entry))});\n`;
out += 'window.__app = __req("js/main.js");\n})();\n';
fs.writeFileSync(path.join(root, 'preview', 'game.bundle.js'), out);
console.log('bundled', modules.size, 'modules,', out.length, 'bytes');
