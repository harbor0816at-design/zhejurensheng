// 历史剧本与自由模式的挑战卡。事件按公开资料改写，游戏效果为示意。
// 目标类型：pop 人口、sky 摩天楼数、land 住宅平均地价、parks 公园数、cshare 商业岗位占比、money 财政、metro 地铁站数
// rules：waterCoast 水厂必须临水；waterCap {mult, until}；oil {from, to, amount}；rockRoad 隧道成本倍数；pol 污染倍数；
//        income 税收倍数；fire 火灾倍数；powerCap 电厂容量倍数；dem {R,C,I} 常驻需求修正；waterCost 水厂造价倍数

const SCENARIOS = [
  {
    id: 'shenzhen', name: '深圳 1980', place: '南海之滨的边陲渔村', start: 1980, end: 2020, money: 25000, color: '#ef4444',
    tag: '海岸 · 特区 · 外向型工业',
    blurb: '一个只有几条街的小渔村，被划为经济特区。工厂、高楼和人潮会接踵而至。',
    rules: {},
    events: [
      { year: 1980, title: '经济特区设立', text: '这座边陲渔村被划为经济特区，外资工厂开始进来。工业需求大涨，持续十年。', mods: { I: 0.5 }, years: 10 },
      { year: 1983, title: '建设热潮', text: '高楼以惊人的速度往上长，商业需求上升。', mods: { C: 0.25 }, years: 4 },
      { year: 1987, title: '第一次土地使用权拍卖', text: '城市第一次公开拍卖土地使用权，财政一下子宽裕了。', money: 20000 },
      { year: 1990, title: '证券交易所开业', text: '资本市场在这里起步，商业需求大增。', mods: { C: 0.35 }, years: 6 },
      { year: 1997, title: '亚洲金融危机', text: '外需骤降，出口工厂订单减少。', mods: { I: -0.35 }, years: 2 },
      { year: 2001, title: '中国加入世贸组织', text: '订单涌来，“世界工厂”开足马力。', mods: { I: 0.4 }, years: 5 },
      { year: 2004, title: '第一条地铁线开通', text: '地铁站解锁：站点周边地价大涨，摩天楼开始成片出现。', unlock: 'metro' },
      { year: 2008, title: '全球金融危机', text: '外需再次下滑，部分工厂外迁。', mods: { I: -0.4 }, years: 2 },
      { year: 2010, title: '产业升级', text: '加工厂外迁、科技企业兴起：工业污染减半，商业需求上升。', mods: { C: 0.2 }, years: 8, rule: { pol: 0.5 } },
      { year: 2015, title: '创新之城', text: '科技公司和年轻人涌入，住宅需求大涨。', mods: { R: 0.3 }, years: 5 },
      { year: 2020, title: '疫情冲击', text: '城市经历了特殊的一年。', mods: { C: -0.2 }, years: 1 }
    ],
    goals: [
      { by: 1985, type: 'pop', value: 600 }, { by: 1992, type: 'pop', value: 2000 }, { by: 2000, type: 'pop', value: 5000 },
      { by: 2015, type: 'sky', value: 3 }, { by: 2020, type: 'pop', value: 15000 }
    ]
  },
  {
    id: 'pudong', name: '浦东 1990', place: '大江东岸的农田与河网', start: 1990, end: 2020, money: 40000, color: '#6366f1',
    tag: '江岸 · 金融中心 · 天际线',
    blurb: '对岸是百年老城，这边还是农田。目标是在江东岸建起一条世界级的天际线。',
    rules: {}, prebuilt: 'oldtown',
    events: [
      { year: 1990, title: '浦东开发开放', text: '江东岸被确定为重点开发区域，商业和工业需求一起上升。', mods: { C: 0.3, I: 0.3 }, years: 10 },
      { year: 1991, title: '第一座跨江大桥通车', text: '老城的人口开始向东岸流动，住宅需求上升。', mods: { R: 0.25 }, years: 6 },
      { year: 1993, title: '金融贸易区成形', text: '银行和公司总部开始落户，商业需求大涨。', mods: { C: 0.3 }, years: 8 },
      { year: 1997, title: '亚洲金融危机', text: '外资放缓，工业需求下降。', mods: { I: -0.3 }, years: 2 },
      { year: 1999, title: '机场与过江地铁', text: '国际机场启用，地铁穿过大江：地铁站解锁。', unlock: 'metro', mods: { C: 0.2 }, years: 5 },
      { year: 2001, title: '加入世贸组织', text: '外贸订单大增。', mods: { I: 0.3 }, years: 5 },
      { year: 2008, title: '全球金融危机', text: '金融业受冲击，商业需求下降。', mods: { C: -0.25 }, years: 2 },
      { year: 2010, title: '世博会', text: '世博会带来大笔投资和游客，财政大增，住宅需求上升。', money: 30000, mods: { R: 0.2 }, years: 3 },
      { year: 2013, title: '自由贸易试验区', text: '新的开放政策吸引贸易和金融企业。', mods: { C: 0.3, I: 0.15 }, years: 6 },
      { year: 2020, title: '疫情冲击', text: '城市经历了特殊的一年。', mods: { C: -0.2 }, years: 1 }
    ],
    goals: [
      { by: 2000, type: 'pop', value: 3000 }, { by: 2008, type: 'sky', value: 3 }, { by: 2010, type: 'pop', value: 8000 },
      { by: 2015, type: 'sky', value: 10 }, { by: 2020, type: 'cshare', value: 0.45 }
    ]
  },
  {
    id: 'singapore', name: '新加坡 1965', place: '赤道上的小岛', start: 1965, end: 2015, money: 30000, color: '#ec4899',
    tag: '岛国 · 缺水 · 花园城市',
    blurb: '土地少、没有淡水资源、只有人和港口。水厂产能减半，要精打细算每一寸土地。',
    rules: { waterCap: { mult: 0.5, until: 2002 } },
    events: [
      { year: 1965, title: '独立建国', text: '小岛成为独立国家。没有腹地、缺乏淡水，水厂产能只有一半。', mods: { R: 0.1 }, years: 5 },
      { year: 1967, title: '“花园城市”构想', text: '政府提出把城市建成花园城市：公园的地价加成更高。', rule: { park: 1.5 } },
      { year: 1968, title: '工业区扩张与公共住房', text: '大规模建设工业区和公共住房，工业和住宅需求上升。', mods: { I: 0.35, R: 0.25 }, years: 10 },
      { year: 1981, title: '新机场启用', text: '航空枢纽带来商业和旅游，商业需求上升。', mods: { C: 0.25 }, years: 8 },
      { year: 1987, title: '地铁首段通车', text: '地铁站解锁。', unlock: 'metro' },
      { year: 1997, title: '亚洲金融危机', text: '区域经济震荡，商业和工业需求下降。', mods: { C: -0.2, I: -0.2 }, years: 2 },
      { year: 2003, title: '再生水投入使用', text: '污水再生技术成熟，水厂恢复满产能。', rule: { waterCapOff: true } },
      { year: 2008, title: '全球金融危机', text: '金融和贸易受冲击。', mods: { C: -0.2 }, years: 2 },
      { year: 2010, title: '滨海湾综合度假区开业', text: '旅游和会展大增，财政收入增加。', money: 20000, mods: { C: 0.3 }, years: 5 }
    ],
    goals: [
      { by: 1975, type: 'pop', value: 1500 }, { by: 1985, type: 'parks', value: 6 }, { by: 1995, type: 'pop', value: 6000 },
      { by: 2005, type: 'land', value: 50 }, { by: 2015, type: 'pop', value: 11000 }
    ]
  },
  {
    id: 'dubai', name: '迪拜 1971', place: '海湾边的沙漠小港', start: 1971, end: 2020, money: 30000, color: '#f59e0b',
    tag: '沙漠 · 石油 · 转型',
    blurb: '石油收入让财政起步轻松，但它会在 1995 年前枯竭。要趁早把城市变成贸易、旅游和金融中心。',
    rules: { waterCoast: true, waterCost: 1.5, oil: { from: 1971, to: 1995, amount: 1800 } },
    events: [
      { year: 1971, title: '联合酋长国成立', text: '石油收入开始流入财政（每月补贴，逐年减少，1995 年归零）。水只能靠海水淡化：水厂必须建在海边。' },
      { year: 1979, title: '深水港开港', text: '世界级集装箱港口建成，工业和贸易需求大涨。', mods: { I: 0.35 }, years: 10 },
      { year: 1985, title: '航空公司成立', text: '航空枢纽起步，商业需求上升。', mods: { C: 0.2 }, years: 10 },
      { year: 1999, title: '地标酒店开业', text: '豪华酒店把城市推上旅游地图，商业需求大涨。', mods: { C: 0.3 }, years: 8 },
      { year: 2001, title: '人工岛动工', text: '海上豪宅项目吸引海外买家，住宅需求大涨。', mods: { R: 0.3 }, years: 7 },
      { year: 2008, title: '金融危机与地产泡沫破裂', text: '楼市急冻，住宅和商业需求大降。', mods: { R: -0.4, C: -0.3 }, years: 2 },
      { year: 2009, title: '地铁开通', text: '沙漠里的无人驾驶地铁：地铁站解锁。', unlock: 'metro' },
      { year: 2010, title: '世界最高楼落成', text: '摩天楼成为城市名片，商业需求回升。', mods: { C: 0.25 }, years: 6 },
      { year: 2020, title: '疫情冲击', text: '旅游停摆，商业需求下降。', mods: { C: -0.3 }, years: 1 }
    ],
    goals: [
      { by: 1985, type: 'pop', value: 1500 }, { by: 1995, type: 'money', value: 0 }, { by: 2000, type: 'cshare', value: 0.45 },
      { by: 2012, type: 'sky', value: 4 }, { by: 2020, type: 'pop', value: 10000 }
    ]
  },
  {
    id: 'detroit', name: '底特律 1950', place: '河边的汽车之城', start: 1950, end: 2020, money: 8000, color: '#64748b',
    tag: '老工业城 · 衰退 · 复兴',
    blurb: '开局就是一座繁荣的工业城。接下来七十年，郊区化、石油危机、外国竞争会一次次掏空它。你能比历史做得更好吗？',
    rules: { dem: { I: 0.05 }, upkeep: 1.5, income: 0.9 }, prebuilt: 'motorcity',
    events: [
      { year: 1950, title: '汽车之城鼎盛', text: '工厂开足马力，到处都是工作机会。' , mods: { I: 0.3 }, years: 6 },
      { year: 1956, title: '州际公路法案', text: '高速公路让中产搬去郊区，市区住宅需求长期走低。', mods: { R: -0.4 }, decay: { R: 0.004 }, years: 20 },
      { year: 1973, title: '石油危机', text: '油价暴涨，大排量汽车卖不动，工厂开始关门。', mods: { I: -0.4 }, decay: { I: 0.006 }, years: 3 },
      { year: 1980, title: '外国汽车竞争', text: '省油的进口车抢走市场，工厂接连裁员。', mods: { I: -0.45, R: -0.15 }, decay: { I: 0.005, R: 0.002 }, years: 12 },
      { year: 1990, title: '产业外迁', text: '更多工厂迁往成本更低的地方。', mods: { I: -0.35 }, decay: { I: 0.004, R: 0.002 }, years: 15 },
      { year: 2008, title: '汽车业危机', text: '金融危机重创汽车业，工厂和商店大批关门。', mods: { I: -0.5, C: -0.2 }, decay: { I: 0.008, C: 0.004, R: 0.003 }, years: 3 },
      { year: 2013, title: '城市债务重组', text: '历史上城市在这一年申请破产保护。债务被重组：贷款清零，财政获得一笔重启资金。', rule: { clearLoans: true }, money: 30000 },
      { year: 2015, title: '市中心复兴', text: '科技公司和创业者回到市中心，商业和住宅需求回升。', mods: { C: 0.35, R: 0.25 }, years: 6 }
    ],
    goals: [
      { by: 1970, type: 'keep', value: 0.95 }, { by: 1990, type: 'cshare', value: 0.4 }, { by: 2000, type: 'keep', value: 0.9 },
      { by: 2012, type: 'money', value: 0 }, { by: 2020, type: 'keep', value: 1.15 }
    ]
  },
  {
    id: 'chongqing', name: '重庆 1997', place: '两江交汇的山城', start: 1997, end: 2020, money: 35000, color: '#14b8a6',
    tag: '山地 · 两江 · 立体城市',
    blurb: '城市挤在两条大江和几道山脊之间。修路要架桥打隧道，每一块平地都珍贵。',
    rules: { rockRoad: 3 },
    events: [
      { year: 1997, title: '设立直辖市', text: '城市升格，获得一笔建设资金，住宅需求上升。', money: 20000, mods: { R: 0.2 }, years: 5 },
      { year: 2000, title: '西部大开发', text: '内陆开放带来投资，工业需求上升。', mods: { I: 0.3 }, years: 10 },
      { year: 2005, title: '轨道交通通车', text: '穿楼而过的轻轨开通：地铁站解锁。', unlock: 'metro' },
      { year: 2008, title: '全球金融危机', text: '外需下滑，工业需求下降。', mods: { I: -0.3 }, years: 2 },
      { year: 2010, title: '国家级新区设立', text: '新区吸引企业落户，商业和工业需求上升。', mods: { C: 0.25, I: 0.25 }, years: 8 },
      { year: 2011, title: '中欧班列开通', text: '货运列车直达欧洲，内陆城市也能做外贸。', mods: { I: 0.35 }, years: 6 },
      { year: 2018, title: '网红山城', text: '魔幻的立体街景在网上走红，游客涌入，商业需求大涨。', mods: { C: 0.35 }, years: 3 },
      { year: 2020, title: '疫情冲击', text: '城市经历了特殊的一年。', mods: { C: -0.2 }, years: 1 }
    ],
    goals: [
      { by: 2002, type: 'pop', value: 1200 }, { by: 2008, type: 'pop', value: 3500 }, { by: 2012, type: 'metro', value: 2 },
      { by: 2016, type: 'pop', value: 7000 }, { by: 2020, type: 'cshare', value: 0.4 }
    ]
  }
];

const CHALLENGES = [
  { id: 'fire', name: '火灾频发', desc: '建筑起火的概率是平时的 2.5 倍', rules: { fire: 2.5 } },
  { id: 'smog', name: '重工业遗产', desc: '工业需求更高，但污染多 50%', rules: { pol: 1.5, dem: { I: 0.2 } } },
  { id: 'blackout', name: '能源紧张', desc: '电厂容量只有六成', rules: { powerCap: 0.6 } },
  { id: 'migrants', name: '移民潮', desc: '住宅需求一直很高，但公共服务压力大（维护费 +20%）', rules: { dem: { R: 0.35 }, upkeep: 1.2 } },
  { id: 'austerity', name: '财政紧缩', desc: '税收只有八成', rules: { income: 0.8 } },
  { id: 'green', name: '环保法规', desc: '工业污染减少 40%，但工业需求降低', rules: { pol: 0.6, dem: { I: -0.15 } } },
  { id: 'disaster', name: '自然灾害', desc: '每年都可能遭遇洪水或地震，毁掉一片建筑', rules: { disaster: 0.3 } }
];
const MONEY_LEVELS = [
  { id: 'rich', name: '宽裕', money: 70000 }, { id: 'normal', name: '普通', money: 40000 }, { id: 'tight', name: '紧张', money: 18000 }
];
const GOAL_TEXT = {
  pop: (g) => `人口达到 ${group(g.value)}`,
  sky: (g) => `建成 ${g.value} 座摩天楼`,
  land: (g) => `住宅平均地价达到 ${g.value}`,
  parks: (g) => `建成 ${g.value} 座公园`,
  cshare: (g) => `商业岗位占比达到 ${Math.round(g.value * 100)}%`,
  money: () => '财政不欠债（余额 ≥ 0 且没有贷款）',
  metro: (g) => `建成 ${g.value} 座地铁站`,
  keep: (g) => `人口保持在开局的 ${Math.round(g.value * 100)}% 以上`
};
function group(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

module.exports = { SCENARIOS, CHALLENGES, MONEY_LEVELS, GOAL_TEXT };
