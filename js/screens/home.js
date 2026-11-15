// 首页：选行业、总部、公司名、种子
const T = require('../ui/theme.js');
const F = require('../game/format.js');
const { icon } = require('../ui/icons.js');
const { D } = require('../game/session.js');
const config = require('../config.js');

const HQS = ['US', 'CN', 'JP', 'DE', 'UK', 'IN', 'BR', 'MX', 'VN'];

function citySection(f, app) {
  const { SC, M } = require('../city/sim.js');
  const cs = app.citySetup;
  f.text('修路、划区、供水供电，把一片空地建成一座城', { size: 14, color: '#cbd5e1', align: 'center', lh: 1.6 });
  f.gap(8);
  const sv = app.savedCity;
  if (sv && !(sv.s.ended && !sv.s.freePlay)) {
    f.button(`继续存档：${sv.s.name} · ${sv.year} 年 · 人口 ${sv.st.pop}`, () => app.resumeCity(sv), { kind: 'dark', h: 46, size: 14, id: 'resume-city' });
  }
  f.text('历史剧本', { size: 15, weight: 700, color: '#fff', lh: 1.8 });
  SC.SCENARIOS.forEach((sc) => {
    f.card({ stripe: sc.color, pad: 14, after: 10, onTap: () => app.startCityScenario(sc.id), id: 'sc-' + sc.id }, (c) => {
      const y = c.y;
      c.push({ t: 'text', x: c.x, y: y + 18, s: sc.name, font: T.font(16, 800), color: T.c.ink });
      c.push({ t: 'text', x: c.x + c.w, y: y + 18, s: `${sc.end - sc.start} 年 · ${sc.goals.length} 个目标`, font: T.font(11, 600), color: T.c.muted, align: 'right' });
      c.y += 26;
      c.text(sc.tag, { size: 12, weight: 600, color: sc.color, lh: 1.5 });
      c.text(sc.blurb, { size: 12, color: T.c.body, lh: 1.55 });
    });
  });
  f.gap(6);
  f.text('自由建造', { size: 15, weight: 700, color: '#fff', lh: 1.8 });
  f.card({}, (c) => {
    c.text('地图', { size: 13, weight: 700, color: T.c.ink, lh: 1.6 });
    const ids = Object.keys(M.SANDBOX_MAPS);
    for (let r = 0; r < ids.length; r += 3) c.seg(ids.slice(r, r + 3).map((id) => ({ label: M.SANDBOX_MAPS[id].name, on: cs.map === id, onTap: () => { cs.map = id; app.refresh(); }, id: 'map-' + id })), { size: 13, after: 6 });
    c.text(M.SANDBOX_MAPS[cs.map].desc, { size: 12, color: T.c.muted, lh: 1.5 });
    c.gap(6);
    c.text('起步资金', { size: 13, weight: 700, color: T.c.ink, lh: 1.6 });
    c.seg(SC.MONEY_LEVELS.map((m) => ({ label: `${m.name} ¥${String(m.money / 1000)}k`, on: cs.money === m.id, onTap: () => { cs.money = m.id; app.refresh(); }, id: 'money-' + m.id })), { size: 12 });
    c.text('挑战卡（可多选，可叠加）', { size: 13, weight: 700, color: T.c.ink, lh: 1.6 });
    SC.CHALLENGES.forEach((ch) => {
      const on = cs.challenges.indexOf(ch.id) >= 0;
      const y = c.y; const h = 40;
      c.push({ t: 'rect', x: c.x, y, w: c.w, h, r: 10, fill: on ? '#fef3c7' : T.c.soft, stroke: on ? '#f59e0b' : null, lw: 1.5 });
      c.push({ t: 'rect', x: c.x + 10, y: y + 12, w: 16, h: 16, r: 4, fill: on ? '#f59e0b' : '#fff', stroke: on ? null : T.c.line });
      if (on) c.push({ t: 'poly', pts: [[c.x + 13, y + 20], [c.x + 17, y + 24], [c.x + 23, y + 15]], color: '#fff', lw: 2 });
      c.push({ t: 'text', x: c.x + 34, y: y + 18, s: ch.name, font: T.font(13, 700), color: T.c.ink });
      c.push({ t: 'text', x: c.x + 34, y: y + 33, s: ch.desc, font: T.font(11), color: T.c.muted });
      c.hit(c.x, y, c.w, h, () => app.toggleChallenge(ch.id), 'ch-' + ch.id, { r: 10 });
      c.y += h + 6;
    });
    c.gap(4);
    const y = c.y; const h = 44; const seed = app.citySeed;
    c.push({ t: 'rect', x: c.x, y, w: c.w, h, r: 10, fill: T.c.soft, stroke: T.c.line });
    c.push({ t: 'text', x: c.x + 12, y: y + 27, s: '种子', font: T.font(13), color: T.c.muted });
    c.push({ t: 'text', x: c.x + 56, y: y + 27, s: seed || '留空随机', font: T.font(15, seed ? 600 : 400), color: seed ? T.c.ink : T.c.faint });
    c.push({ t: 'text', x: c.x + c.w - 12, y: y + 27, s: '修改', font: T.font(13, 600), color: T.c.accent, align: 'right' });
    c.hit(c.x, y, c.w, h, () => app.editCitySeed(), 'city-seed');
    c.y += h + 10;
    c.button(`开始建造（${M.SANDBOX_MAPS[cs.map].name}${cs.challenges.length ? ` + ${cs.challenges.length} 张挑战卡` : ''}）`, () => app.startCitySandbox(), { id: 'start-sandbox', after: 0 });
  });
  f.text('原创城市建造玩法；历史事件按公开资料改写，数值为游戏示意。', { size: 11, color: T.c.onDarkMuted, align: 'center', lh: 1.6 });
}

function home(app) {
  const st = app.setup;
  return {
    body(f) {
      f.gap(18);
      f.text('这局人生', { size: 38, weight: 800, color: '#ffffff', align: 'center', lh: 1.3 });
      f.gap(6);
      f.seg([{ label: '全球商业', on: app.mode === 'biz', onTap: () => app.pickMode('biz'), id: 'mode-biz' }, { label: '当市长', on: app.mode === 'city', onTap: () => app.pickMode('city'), id: 'mode-city' }], { h: 42, size: 15, after: 14 });
      if (app.mode === 'city') { citySection(f, app); return; }
      f.text('5 个行业 × 9 个总部 × 3 个年代 × 5 种出身', { size: 14, color: '#cbd5e1', align: 'center' });
      f.gap(12);
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
        c.text('经营一家全球公司，一路做到 2024 年', { size: 15, weight: 700, color: T.c.ink, lh: 1.5 });
        c.text('把出口、分公司、工厂拖到 9 个真实国家的棋盘上；经历亚洲金融危机、中国入世、金融海啸、脱欧、疫情；在诺基亚、丰田召回、Zara 快时尚、柴油门这些经典案例的十字路口做选择，还会碰上挖角、罢工、专利官司等随机事件。', { size: 13, color: T.c.body, lh: 1.65 });
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
        for (let i = 0; i < HQS.length; i += 3) c.seg(HQS.slice(i, i + 3).map((id) => ({ label: D.COUNTRIES.find((k) => k.id === id).name, on: st.hq === id, onTap: () => app.pickHq(id), id: 'hq-' + id })), { after: 6 });
        c.text(D.COUNTRIES.find((k) => k.id === st.hq).blurb, { size: 12, color: T.c.muted, lh: 1.5 });
        c.gap(6);
        c.text('3. 开局年份', { size: 14, weight: 700, color: T.c.ink, lh: 1.6 });
        c.seg(D.START_YEARS.map((y) => ({ label: String(y.year), on: st.startYear === y.year, onTap: () => app.pickStart(y.year), id: 'start-' + y.year })));
        c.text((D.START_YEARS.find((y) => y.year === st.startYear) || D.START_YEARS[0]).desc, { size: 12, color: T.c.muted, lh: 1.5 });
        c.gap(6);
        c.text('4. 创始背景', { size: 14, weight: 700, color: T.c.ink, lh: 1.6 });
        const fds = D.FOUNDERS;
        for (let i = 0; i < fds.length; i += 3) c.seg(fds.slice(i, i + 3).map((fd) => ({ label: fd.name, on: st.founder === fd.id, onTap: () => app.pickFounder(fd.id), id: 'founder-' + fd.id })), { size: 13, after: 6 });
        c.text((fds.find((x) => x.id === st.founder) || fds[0]).desc, { size: 12, color: T.c.muted, lh: 1.5 });
        c.gap(6);
        c.text('5. 公司名和种子码', { size: 14, weight: 700, color: T.c.ink, lh: 1.6 });
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
        c.buttons([{ label: '随机组合', kind: 'secondary', onTap: () => app.randomSetup(), id: 'random-setup' }, { label: '开始经营', kind: 'primary', onTap: () => app.start(), id: 'start' }], { h: 48, size: 15 });
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
