// 首页 + 开局卡
const T = require('../ui/theme.js');
const F = require('../game/format.js');
const S = require('../game/session.js');
const config = require('../config.js');
const { footnote } = require('./common.js');

function home(app) {
  return {
    body(f) {
      f.gap(28);
      // 标题
      f.text('这局人生', { size: 40, weight: 800, color: '#ffffff', align: 'center', lh: 1.3 });
      f.text('18 岁到 65 岁 · 一年一张卡', { size: 15, color: '#cbd5e1', align: 'center' });
      f.gap(18);
      // 小插画：一条起伏的人生曲线
      f.custom(100, (push, x, y, w, h) => {
        // 起伏的人生曲线：上升 → 跌落（重组）→ 翻盘
        const key = [[0, 0.12], [0.16, 0.26], [0.32, 0.46], [0.44, 0.58], [0.52, 0.22], [0.6, 0.3], [0.74, 0.55], [0.88, 0.72], [1, 0.9]];
        const P = (i) => key[Math.max(0, Math.min(key.length - 1, i))];
        const pts = [];
        for (let i = 0; i < key.length - 1; i++) {
          for (let k = 0; k < 10; k++) {
            const t = k / 10; const p0 = P(i - 1); const p1 = P(i); const p2 = P(i + 1); const p3 = P(i + 2);
            const cr = (a0, a1, a2, a3) => 0.5 * (2 * a1 + (-a0 + a2) * t + (2 * a0 - 5 * a1 + 4 * a2 - a3) * t * t + (-a0 + 3 * a1 - 3 * a2 + a3) * t * t * t);
            pts.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
          }
        }
        pts.push(key[key.length - 1]);
        const X = (t) => x + 16 + t * (w - 32);
        const Y = (v) => y + h - 26 - v * (h - 40);
        push({ t: 'line', x1: x + 16, y1: y + h - 20, x2: x + w - 16, y2: y + h - 20, color: 'rgba(255,255,255,0.14)', lw: 1 });
        push({ t: 'poly', pts: pts.map((p) => [X(p[0]), Y(p[1])]), color: '#60a5fa', lw: 3 });
        push({ t: 'circle', x: X(0.52), y: Y(0.22), r: 5.5, fill: '#f87171' });
        push({ t: 'circle', x: X(1), y: Y(0.9), r: 6.5, fill: '#fbbf24' });
        push({ t: 'text', x: x + 16, y: y + h - 4, s: '18 岁', font: T.font(11), color: T.c.onDarkMuted });
        push({ t: 'text', x: X(0.52), y: y + h - 4, s: '跌倒', font: T.font(11), color: '#fca5a5', align: 'center' });
        push({ t: 'text', x: x + w - 16, y: y + h - 4, s: '65 岁', font: T.font(11), color: T.c.onDarkMuted, align: 'right' });
      });
      f.gap(14);
      if (app.invite) {
        f.card({ bg: '#fef3c7', stripe: '#f59e0b' }, (c) => {
          c.text('好友邀请你挑战', { size: 13, weight: 700, color: '#92400e', lh: 1.5 });
          c.text(`种子码 ${app.invite}：同一个开局、同一份命运底稿，看看你能不能活得比 TA 好。`, { size: 13, color: '#78350f', lh: 1.55 });
          c.gap(6);
          c.button('用这个种子开始', () => app.start(app.invite), { id: 'start-invite', after: 0 });
        });
      }
      f.card({}, (c) => {
        const pts = [
          ['每局约 12–18 个关键决策，10–15 分钟', T.c.accent],
          ['现金流、经济周期、机会和意外，都记在账上', T.c.pos],
          ['可以花钱买情报，但情报不改变真实概率', T.c.warn],
          ['破产可以重组，摔倒了还能爬起来', T.c.violet]
        ];
        pts.forEach(([t, color]) => {
          const y = c.y;
          c.push({ t: 'circle', x: c.x + 5, y: y + 12, r: 3.5, fill: color });
          c.text(t, { size: 14, color: T.c.body, indent: 16, lh: 1.6 });
          c.gap(2);
        });
      });
      // 种子
      f.card({}, (c) => {
        c.text('种子码', { size: 13, weight: 600, color: T.c.ink, lh: 1.4 });
        c.text('同一个种子 = 同一个开局和同一份命运底稿，可以和朋友比谁活得更好。', { size: 12, color: T.c.muted, lh: 1.5 });
        c.gap(8);
        const y = c.y;
        const h = 44;
        const seed = app.seedInput;
        c.push({ t: 'rect', x: c.x, y, w: c.w, h, r: 10, fill: T.c.soft, stroke: T.c.line });
        c.push({ t: 'text', x: c.x + 12, y: y + 27, s: seed || '留空随机，例如 LIFE-48291', font: T.font(15, seed ? 600 : 400), color: seed ? T.c.ink : T.c.faint });
        c.push({ t: 'text', x: c.x + c.w - 12, y: y + 27, s: seed ? '修改' : '输入', font: T.font(13, 600), color: T.c.accent, align: 'right' });
        c.hit(c.x, y, c.w, h, () => app.editSeed(), 'seed-input');
        c.y += h + 12;
        c.button('开始新的一局', () => app.start(app.seedInput), { id: 'start' });
        const sv = app.saved;
        if (sv && !sv.s.ended) {
          c.button(`继续存档（${sv.s.seed} · ${sv.s.age} 岁）`, () => app.resume(sv), { kind: 'secondary', id: 'resume' });
        }
        if (sv) c.button('清除存档', () => app.clearSave(), { kind: 'link', h: 32, size: 13, after: 0 });
      });
      footnote(f, '游戏虚拟数值，不构成投资建议。\n离线运行，不收集个人数据。');
      footnote(f, `规则 ${S.rules.economy.config_ver} · 内容 ${(S.rules.endings && S.rules.endings.config_ver) || '0.1.0'} · ${config.version}`);
    }
  };
}

function opening(app) {
  const life = app.life;
  const s = life.s;
  const city = S.city(s.city);
  const era = S.era(s.era);
  const tal = S.talent(s.talent);
  return {
    header: require('./common.js').header(app),
    body(f) {
      f.card({}, (c) => {
        c.eyebrow('开局 · 18 岁');
        c.title('你的起点', { size: 24 });
        c.gap(10);
        c.tiles([
          { k: '出身', v: F.L.origin[s.origin] },
          { k: '起始现金', v: F.money(s.cash) },
          { k: '城市', v: city ? city.name : s.city },
          { k: '时代', v: era ? era.name : s.era },
          { k: '学历', v: F.L.edu[s.edu] },
          { k: '天赋', v: tal ? tal.name : s.talent }
        ], 2);
        if (city && city.blurb) c.text(`${city.name}：${city.blurb}`, { size: 13, color: T.c.muted });
        if (tal) c.text(`天赋「${tal.name}」：${tal.desc}`, { size: 13, color: T.c.muted });
        c.gap(8);
        c.chips(['health', 'capability', 'network', 'family'].map((k) => ({ text: `${F.L.attr[k]} ${Math.round(s.attrs[k])}` })), { size: 13, h: 28 });
        c.text(`种子码 ${s.seed}：同一个种子会得到同样的开局和同样的随机底稿。`, { size: 12, color: T.c.faint });
      });
    },
    footer(f) {
      f.button('进入 18 岁', () => app.go('play'), { id: 'go', after: 0 });
    }
  };
}

module.exports = { home, opening };
