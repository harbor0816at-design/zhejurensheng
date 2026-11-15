// 首页：选行业、总部、公司名、种子
const T = require('../ui/theme.js');
const F = require('../game/format.js');
const { icon } = require('../ui/icons.js');
const { D } = require('../game/session.js');
const config = require('../config.js');

const HQS = ['US', 'CN', 'DE', 'JP', 'IN'];

function home(app) {
  const st = app.setup;
  return {
    body(f) {
      f.gap(18);
      f.text('这局人生', { size: 38, weight: 800, color: '#ffffff', align: 'center', lh: 1.3 });
      f.text('全球商业版 · 1995 → 2024', { size: 15, color: '#cbd5e1', align: 'center' });
      f.gap(14);
      // 小棋盘插画
      f.custom(118, (push, x, y, w) => {
        const order = ['US', 'UK', 'DE', 'MX', 'CN', 'JP', 'BR', 'IN', 'VN'];
        const lit = { US: 3, CN: 2, DE: 2, VN: 3, IN: 1, MX: 1 };
        const gw = Math.min(w, 300); const gx = x + (w - gw) / 2;
        const cw = (gw - 12) / 3; const ch = 34;
        order.forEach((id, i) => {
          const c = D.COUNTRIES.find((k) => k.id === id);
          const cx = gx + (i % 3) * (cw + 6); const cy = y + Math.floor(i / 3) * (ch + 6);
          const lv = lit[id] || 0;
          push({ t: 'rect', x: cx, y: cy, w: cw, h: ch, r: 9, fill: lv ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.07)' });
          push({ t: 'rect', x: cx + 8, y: cy + 10, w: 3, h: 14, r: 1.5, fill: c.color });
          push({ t: 'text', x: cx + 16, y: cy + 22, s: c.name, font: T.font(12, 700), color: lv ? T.c.ink : '#cbd5e1' });
          for (let k = 0; k < lv; k++) push({ t: 'rect', x: cx + cw - 12 - k * 9, y: cy + 13, w: 6, h: 8, r: 2, fill: c.color });
        });
      });
      f.gap(8);
      f.card({}, (c) => {
        c.text('经营一家公司，从 1995 年做到 2024 年', { size: 15, weight: 700, color: T.c.ink, lh: 1.5 });
        c.text('把出口、分公司、工厂拖到 9 个真实国家的棋盘上；经历亚洲金融危机、互联网泡沫、中国入世、金融海啸、疫情；在柯达、诺基亚、淘宝这些经典案例的十字路口替公司做选择。', { size: 13, color: T.c.body, lh: 1.65 });
      });
      f.card({}, (c) => {
        c.text('1. 选行业', { size: 14, weight: 700, color: T.c.ink, lh: 1.6 });
        c.gap(4);
        D.INDUSTRIES.forEach((ind) => {
          const on = st.industry === ind.id;
          c.card({ bg: on ? T.c.accentSoft : T.c.soft, stroke: on ? T.c.accent : null, lw: 2, pad: 12, after: 8, onTap: () => app.pickIndustry(ind.id), id: 'ind-' + ind.id }, (k) => {
            k.text(ind.name + (on ? '  ✓' : ''), { size: 15, weight: 700, color: on ? T.c.accentDark : T.c.ink, lh: 1.4 });
            k.text(ind.blurb, { size: 12, color: T.c.muted, lh: 1.5 });
          });
        });
        c.gap(4);
        c.text('2. 选总部', { size: 14, weight: 700, color: T.c.ink, lh: 1.6 });
        c.seg(HQS.map((id) => ({ label: D.COUNTRIES.find((k) => k.id === id).name, on: st.hq === id, onTap: () => app.pickHq(id), id: 'hq-' + id })));
        c.text(D.COUNTRIES.find((k) => k.id === st.hq).blurb, { size: 12, color: T.c.muted, lh: 1.5 });
        c.gap(6);
        c.text('3. 公司名和种子码', { size: 14, weight: 700, color: T.c.ink, lh: 1.6 });
        const field = (label, value, ph, onTap, id) => {
          const y = c.y; const h = 44;
          c.push({ t: 'rect', x: c.x, y, w: c.w, h, r: 10, fill: T.c.soft, stroke: T.c.line });
          c.push({ t: 'text', x: c.x + 12, y: y + 27, s: label, font: T.font(13), color: T.c.muted });
          c.push({ t: 'text', x: c.x + 70, y: y + 27, s: value || ph, font: T.font(15, value ? 600 : 400), color: value ? T.c.ink : T.c.faint });
          c.push({ t: 'text', x: c.x + c.w - 12, y: y + 27, s: '修改', font: T.font(13, 600), color: T.c.accent, align: 'right' });
          c.hit(c.x, y, c.w, h, onTap, id);
          c.y += h + 8;
        };
        field('公司', st.name, '', () => app.editName(), 'name-input');
        field('种子', st.seed, '留空随机，例如 BIZ-48291', () => app.editSeed(), 'seed-input');
        c.gap(4);
        c.button('开始经营', () => app.start(), { id: 'start' });
        const sv = app.saved;
        if (sv && !sv.s.ended) c.button(`继续存档（${sv.s.name} · ${sv.s.year} 年）`, () => app.resume(sv), { kind: 'secondary', id: 'resume' });
        if (sv) c.button('清除存档', () => app.clearSave(), { kind: 'link', h: 32, size: 13, after: 0 });
      });
      if (app.invite) {
        f.card({ bg: '#fef3c7', stripe: '#f59e0b' }, (c) => {
          c.text('好友邀请你挑战', { size: 13, weight: 700, color: '#92400e', lh: 1.5 });
          c.text(`同样的种子 ${app.invite.seed}、同样的行业和总部，看看你能不能把公司做得更大。设置已经帮你填好了。`, { size: 13, color: '#78350f', lh: 1.55 });
        });
      }
      f.text('历史事件按公开资料改写，市场数据为游戏示意值，不构成投资建议。\n离线运行，不收集个人数据。', { size: 11, color: T.c.onDarkMuted, align: 'center', lh: 1.6 });
      f.text(config.version, { size: 11, color: 'rgba(148,163,184,0.6)', align: 'center', lh: 1.6 });
    }
  };
}

module.exports = { home };
