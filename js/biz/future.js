// 未来 50 年（2025–2074）的世界推演：开局时按种子生成，存进存档，同一种子永远是同一个未来。
// 三个“大势拨盘”（技术 / 地缘 / 气候）各有 3 种走向，组合出 27 种未来；再叠加随机的金融危机、疫情、灾害。
// 这是游戏推演，不是预测。
const FUTURE_START = 2025;
const FUTURE_END = 2074;

const DIALS = {
  tech: {
    name: '技术',
    opts: {
      ai_boom: { name: 'AI 大爆发', desc: '智能体和机器人在 2030 年代大规模替代人工，生产率飙升，赢家通吃。' },
      ai_steady: { name: 'AI 稳步渗透', desc: 'AI 像电力一样慢慢改变各行各业，没有奇迹也没有崩盘。' },
      ai_winter: { name: 'AI 泡沫破裂', desc: '2020 年代末 AI 投资泡沫破裂，科技寒冬持续数年，之后才缓慢复苏。' }
    }
  },
  geo: {
    name: '地缘',
    opts: {
      open: { name: '再全球化', desc: '大国关系缓和，关税回落，供应链重新连成一张网。' },
      blocs: { name: '阵营分裂', desc: '世界分成两大经济阵营，高关税、技术封锁、市场准入收紧。' },
      multi: { name: '多极摇摆', desc: '没有统一秩序，关税时高时低，区域协定此起彼伏。' }
    }
  },
  climate: {
    name: '气候',
    opts: {
      orderly: { name: '有序转型', desc: '碳价逐步提高，新能源平稳替代化石能源。' },
      disorderly: { name: '急刹车式转型', desc: '前期拖延，2030 年代中期突然出台严厉碳税和禁令，冲击剧烈。' },
      hothouse: { name: '转型失败', desc: '减排不力，2040 年代后极端天气频发，热带国家受灾最重。' }
    }
  }
};

// 名义美元 GDP 基础增速：2025 年 → 2074 年线性过渡（%）
const BASE_G = { US: [4.0, 3.0], CN: [5.0, 2.4], JP: [1.5, 0.9], DE: [3.0, 2.1], UK: [3.4, 2.5], IN: [9.5, 4.8], BR: [5.5, 3.8], MX: [5.5, 3.8], VN: [9.0, 4.6] };
// 人工成本指数的长期收敛目标
const COST_T = { US: 1.05, CN: 0.95, JP: 0.9, DE: 1.02, UK: 0.98, IN: 0.75, BR: 0.78, MX: 0.72, VN: 0.68 };
// 行业渗透率年增速（%），后面按拨盘修正
const PEN_G = { electronics: 0.5, beverage: 0, software: 4, auto: -0.3, apparel: 0, pharma: 1.5, energy: 4 };

const FILLER = [
  '全球经济温和增长，市场等待新的方向', '主要央行按兵不动，资本市场窄幅波动', '新兴市场中产继续扩大，消费升级',
  '各国加大基础设施投资', '大宗商品价格平稳，航运恢复常态', '企业并购活跃，行业集中度上升',
  '年轻一代消费习惯变化，品牌忠诚度下降', '全球人口突破新高，城市化继续推进', '跨境电商规则趋于统一',
  '劳动力短缺推高工资', '利率回到长期均值附近', '多国推出数字货币', '科技巨头面临更严格的反垄断审查',
  '全球旅游和服务消费创新高', '城市更新和老旧设施改造带动投资'
];

function generate(rand, industry) {
  const pickOne = (keys) => keys[Math.floor(rand() * keys.length) % keys.length];
  const dials = {
    tech: pickOne(['ai_boom', 'ai_steady', 'ai_winter']),
    geo: pickOne(['open', 'blocs', 'multi']),
    climate: pickOne(['orderly', 'disorderly', 'hothouse'])
  };
  const N = FUTURE_END - FUTURE_START + 1;
  const ys = []; for (let y = FUTURE_START; y <= FUTURE_END; y++) ys.push(y);
  const ev = {}; // year -> event
  const add = (y, e) => {
    if (y < FUTURE_START || y > FUTURE_END) return;
    const o = ev[y] || (ev[y] = { year: y, headline: '', future: true });
    o.headline = o.headline ? o.headline + '；' + e.headline : e.headline;
    for (const k of ['demand', 'sector', 'sentiment', 'fx', 'supply', 'cost']) {
      if (!e[k]) continue;
      o[k] = o[k] || {};
      for (const kk of Object.keys(e[k])) o[k][kk] = (o[k][kk] || 1) * e[k][kk];
    }
    if (e.g) o.g = (o.g || 0) + e.g; // 当年全球增速冲击（百分点）
    if (e.gc) { o.gc = o.gc || {}; for (const kk of Object.keys(e.gc)) o.gc[kk] = (o.gc[kk] || 0) + e.gc[kk]; }
  };
  const rint = (a, b) => a + Math.floor(rand() * (b - a + 1));

  // ---- 技术 ----
  const tk = {};
  if (dials.tech === 'ai_boom') {
    tk.agents = rint(2027, 2030); tk.robots = rint(2034, 2040); tk.agi = rint(2045, 2055);
    add(tk.agents, { headline: 'AI 智能体开始替代大量白领工作，科技股狂飙', sentiment: { software: 1.5, '*': 1.1 }, sector: { software: 1.08 } });
    add(tk.robots, { headline: '人形机器人量产，工厂和仓库进入“无人化”时代', sector: { electronics: 1.1, auto: 0.96 }, sentiment: { electronics: 1.3 } });
    add(tk.agi, { headline: '通用人工智能宣告实现，各国紧急讨论“机器人税”和全民基本收入', sentiment: { '*': 1.25, software: 1.4 }, demand: { IN: 0.95, VN: 0.96 } });
  } else if (dials.tech === 'ai_steady') {
    tk.agents = rint(2029, 2034); tk.robots = rint(2042, 2050);
    add(tk.agents, { headline: 'AI 助手成为每个岗位的标配，生产率稳步提升', sentiment: { software: 1.15 } });
    add(tk.robots, { headline: '服务机器人进入家庭，老龄化社会迎来新帮手', sector: { electronics: 1.05 } });
  } else {
    tk.crash = rint(2027, 2029); tk.thaw = tk.crash + rint(5, 8);
    add(tk.crash, { headline: 'AI 投资泡沫破裂，芯片和云计算公司股价腰斩', sentiment: { software: 0.4, electronics: 0.7, '*': 0.85 }, sector: { software: 0.9 }, g: -1.2 });
    add(tk.crash + 1, { headline: '科技寒冬持续，创业公司大批倒闭', sentiment: { software: 0.6 } });
    add(tk.thaw, { headline: '第二代 AI 技术成熟，科技行业走出寒冬', sentiment: { software: 1.3 } });
  }
  tk.quantum = rint(2038, 2060);
  add(tk.quantum, { headline: '实用量子计算机问世，现有加密体系面临重建', sentiment: { software: 1.15 } });
  tk.space = rint(2040, 2065);
  add(tk.space, { headline: '月球基地开始商业运营，太空经济规模突破万亿美元', sentiment: { '*': 1.08 } });
  tk.bio = rint(2032, 2050);
  add(tk.bio, { headline: '基因疗法和 AI 新药大量上市，人均寿命明显延长', sector: { pharma: 1.12 }, sentiment: { pharma: 1.3 } });

  // ---- 地缘 ----
  const tariffs = []; const access = [];
  if (dials.geo === 'blocs') {
    const y0 = rint(2025, 2028);
    add(y0, { headline: '大国全面脱钩：美国把对华关税提高到 35%，中方对等反制', demand: { CN: 0.96, US: 0.98 }, fx: { CN: 0.92 }, g: -0.4 });
    tariffs.push(['CN', 'US', 2025, FUTURE_END, 0.35], ['US', 'CN', y0, FUTURE_END, 0.25], ['CN', 'DE', y0 + 2, FUTURE_END, 0.12], ['CN', 'UK', y0 + 2, FUTURE_END, 0.12], ['CN', 'JP', y0 + 3, FUTURE_END, 0.1]);
    access.push({ c: 'CN', from: y0 + 1, mult: 0.7, notHq: 'CN' }, { c: 'US', from: y0 + 1, mult: 0.7, onlyHq: 'CN' }, { c: 'DE', from: y0 + 3, mult: 0.85, onlyHq: 'CN' });
    add(y0 + 4, { headline: '两大阵营各自建立芯片、支付和数据标准，“一个世界两套系统”', supply: { '*': 0.92 }, cost: { '*': 1.04 } });
    add(rint(2040, 2050), { headline: '台海局势紧张，全球芯片供应一度中断', supply: { '*': 0.75 }, sector: { electronics: 0.9, auto: 0.92 }, sentiment: { '*': 0.75 }, g: -1.0 });
    add(rint(2036, 2044), { headline: '“友岸外包”成熟：越南、墨西哥、印度成为新的世界工厂', demand: { VN: 1.06, MX: 1.05, IN: 1.04 } });
  } else if (dials.geo === 'open') {
    const y0 = rint(2027, 2031);
    tariffs.push(['CN', 'US', 2025, y0, 0.15]);
    add(y0, { headline: '大国达成全面贸易协定，关税大幅下调', sentiment: { '*': 1.15 }, demand: { CN: 1.03, US: 1.02 }, g: 0.4 });
    add(rint(2035, 2045), { headline: '覆盖全球七成 GDP 的超级自贸区成立，数字服务跨境免税', sector: { software: 1.06 }, g: 0.3 });
    access.push({ c: 'CN', from: y0 + 2, mult: 1.15, notHq: 'CN' }, { c: 'IN', from: y0 + 6, mult: 1.15, notHq: 'IN' });
  } else {
    const y0 = rint(2025, 2027); const y1 = rint(2034, 2040);
    tariffs.push(['CN', 'US', 2025, y1, 0.25], ['CN', 'US', y1 + 1, FUTURE_END, 0.1]);
    add(y0, { headline: '关税战反反复复，企业纷纷采取“中国 + 1”策略', demand: { VN: 1.04, MX: 1.03 } });
    add(y1, { headline: '多国组成区域联盟，各自签订双边协定，全球贸易规则碎片化', cost: { '*': 1.02 } });
    const y2 = rint(2045, 2060);
    tariffs.push(['DE', 'US', y2, y2 + 6, 0.12], ['JP', 'US', y2, y2 + 6, 0.1]);
    add(y2, { headline: '美欧贸易摩擦升级，互加关税', demand: { DE: 0.97 } });
  }
  // 印度市场开放
  const yIn = rint(2030, 2042);
  add(yIn, { headline: '印度推出新一轮大开放，降低关税和外资门槛', demand: { IN: 1.05 } });
  access.push({ c: 'IN', from: yIn, mult: 1.12, notHq: 'IN' });

  // ---- 气候 ----
  const cl = {};
  if (dials.climate === 'orderly') {
    cl.carbon = rint(2027, 2031);
    add(cl.carbon, { headline: '主要经济体统一碳价，高碳产品成本上升', cost: { '*': 1.02 }, sector: { energy: 1.1 } });
    add(rint(2035, 2040), { headline: '燃油车在多国停售，电动车和储能全面普及', sector: { energy: 1.12, auto: 1.04 } });
    add(rint(2050, 2056), { headline: '全球电力基本实现清洁化，能源价格长期下降', cost: { '*': 0.96 } });
  } else if (dials.climate === 'disorderly') {
    cl.shock = rint(2033, 2037);
    add(cl.shock - 3, { headline: '减排进度严重落后，科学家警告临界点临近' });
    add(cl.shock, { headline: '各国突然出台严厉碳税和高碳产品禁令，工厂成本暴涨', cost: { '*': 1.12, CN: 1.15, IN: 1.15, VN: 1.12 }, sector: { energy: 1.25, auto: 0.9 }, sentiment: { '*': 0.8 }, g: -1.0 });
    add(cl.shock + 1, { headline: '碳关税全面实施，高碳进口商品加征重税', cost: { '*': 1.05 } });
    tariffs.push(['CN', 'DE', cl.shock + 1, FUTURE_END, 0.06], ['IN', 'DE', cl.shock + 1, FUTURE_END, 0.06], ['VN', 'DE', cl.shock + 1, FUTURE_END, 0.05], ['CN', 'UK', cl.shock + 1, FUTURE_END, 0.05]);
  } else {
    cl.hot = rint(2042, 2048);
    add(cl.hot, { headline: '全球升温突破 2 度，极端高温和洪水成为常态', demand: { VN: 0.9, IN: 0.92, BR: 0.94 }, supply: { VN: 0.8, IN: 0.85 }, gc: { VN: -2, IN: -1.5, BR: -1 } });
    for (let k = 0; k < 4; k++) {
      const y = rint(cl.hot + 1, FUTURE_END);
      const c = pickOne(['VN', 'IN', 'BR', 'MX', 'CN', 'US']);
      const name = { VN: '越南', IN: '印度', BR: '巴西', MX: '墨西哥', CN: '中国', US: '美国' }[c];
      add(y, { headline: `${name}遭遇特大气候灾害，工厂停产、港口关闭`, demand: { [c]: 0.9 }, supply: { [c]: 0.6 }, gc: { [c]: -1.5 } });
    }
  }

  // ---- 随机冲击：金融危机、疫情 ----
  let y = FUTURE_START + rint(3, 8);
  while (y <= FUTURE_END) {
    const kind = pickOne(['debt', 'property', 'bank']);
    const head = { debt: '全球债务危机爆发，多国国债遭抛售', property: '房地产泡沫破裂引发全球衰退', bank: '大型金融机构倒闭，信贷冻结，全球陷入衰退' }[kind];
    add(y, { headline: head, demand: { '*': 0.93 }, sentiment: { '*': 0.6 }, g: -3 });
    add(y + 1, { headline: '各国央行大幅降息救市，经济缓慢复苏', sentiment: { '*': 0.8 }, g: -0.8 });
    y += rint(8, 13);
  }
  if (rand() < 0.35) {
    const yp = rint(2032, 2068);
    add(yp, { headline: '新型流感大流行，各国再次封锁边境', demand: { '*': 0.9 }, sector: { software: 1.12, pharma: 1.2, beverage: 0.92, apparel: 0.88 }, g: -2.5 });
  }
  // 人口与老龄化
  add(rint(2028, 2034), { headline: '中国、日本、德国劳动年龄人口加速下降，养老和医疗需求激增', sector: { pharma: 1.05 } });
  add(rint(2040, 2050), { headline: '印度人口红利达到顶峰，成为全球第三大经济体', demand: { IN: 1.04 } });

  // ---- GDP、成本、渗透率路径 ----
  const gdp = {};
  for (const c of Object.keys(BASE_G)) gdp[c] = [];
  const m = {}; for (const c of Object.keys(BASE_G)) m[c] = 1;
  for (let i = 0; i < N; i++) {
    const yr = FUTURE_START + i; const t = i / (N - 1);
    const e = ev[yr] || {};
    for (const c of Object.keys(BASE_G)) {
      let g = BASE_G[c][0] + (BASE_G[c][1] - BASE_G[c][0]) * t;
      if (dials.tech === 'ai_boom' && yr >= (tk.agents || 2030)) g += (c === 'US' || c === 'CN') ? 0.7 : (c === 'IN' ? -0.3 : 0.35);
      if (dials.tech === 'ai_winter' && yr >= tk.crash && yr < tk.thaw) g -= (c === 'US' || c === 'CN' ? 0.6 : 0.3);
      if (dials.geo === 'blocs') g += ({ CN: -0.8, US: -0.3, VN: 0.4, MX: 0.4, IN: 0.3 }[c] || -0.2);
      if (dials.geo === 'open') g += 0.3;
      if (dials.climate === 'hothouse' && yr >= (cl.hot || 2045)) g -= ({ VN: 1.0, IN: 0.8, BR: 0.7, MX: 0.5 }[c] || 0.2);
      if (dials.climate === 'disorderly' && yr >= cl.shock && yr < cl.shock + 3) g -= 0.6;
      g += (e.g || 0) + ((e.gc && e.gc[c]) || 0) + (rand() - 0.5) * 1.6;
      m[c] *= 1 + g / 100;
      gdp[c].push(Math.round(m[c] * 10000) / 10000);
    }
  }
  const auto = dials.tech === 'ai_boom' ? (tk.robots || 2040) : (dials.tech === 'ai_steady' ? (tk.robots || 2046) : 2060);
  // 本行业渗透率
  const pen = [];
  let p = 1;
  for (let i = 0; i < N; i++) {
    const yr = FUTURE_START + i;
    let g = PEN_G[industry] || 0;
    if (industry === 'software') { if (yr > 2040) g = 2; if (dials.tech === 'ai_boom') g += 2; if (dials.tech === 'ai_winter' && yr >= tk.crash && yr < tk.thaw) g = -3; }
    if (industry === 'electronics' && dials.tech === 'ai_boom' && yr >= tk.robots) g += 1.5;
    if (industry === 'auto' && yr >= auto) g -= 1.2; // 无人驾驶共享出行减少私家车
    if (industry === 'pharma' && dials.tech !== 'ai_winter' && yr >= tk.bio) g += 0.8;
    if (industry === 'energy') {
      if (dials.climate === 'orderly') g = yr < 2050 ? 5 : 1;
      else if (dials.climate === 'disorderly') g = yr < cl.shock ? 1.5 : (yr < cl.shock + 12 ? 7 : 1);
      else g = 1.5;
    }
    p *= 1 + g / 100;
    pen.push(Math.round(p * 10000) / 10000);
  }
  // 利率
  const rate = [];
  for (let i = 0; i < N; i++) {
    const e = ev[FUTURE_START + i] || {};
    let r = dials.tech === 'ai_boom' ? 0.04 : 0.035;
    if ((e.g || 0) <= -2) r = 0.01; else if ((e.g || 0) < 0) r = 0.025;
    rate.push(r);
  }
  // 平静年份的新闻
  for (const yr of ys) if (!ev[yr]) ev[yr] = { year: yr, headline: FILLER[Math.floor(rand() * FILLER.length) % FILLER.length], future: true };

  return { dials, gdp, pen, rate, events: ev, tariffs, access, autoYear: auto, milestones: Object.assign({}, tk, cl) };
}

function dialView(dials) {
  return Object.keys(DIALS).map((k) => ({ key: k, name: DIALS[k].name, value: dials[k], label: DIALS[k].opts[dials[k]].name, desc: DIALS[k].opts[dials[k]].desc }));
}

module.exports = { FUTURE_START, FUTURE_END, DIALS, COST_T, generate, dialView };
