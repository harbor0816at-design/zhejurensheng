// 世界数据：9 个国家 × 3 个行业 × 1995–2024。
// GDP 为按公开数据取整的名义美元示意值（万亿美元），逐年线性插值；其余为游戏数值，不是统计数据。

const START_YEAR = 1995;
const END_YEAR = 2024;

const COUNTRIES = [
  { id: 'US', name: '美国', color: '#2563eb', region: 'americas',
    gdp: { 1995: 7.6, 2000: 10.3, 2007: 14.5, 2008: 14.8, 2009: 14.5, 2015: 18.2, 2019: 21.4, 2020: 21.1, 2024: 28.0 },
    cost: { 1995: 1.0, 2024: 1.05 }, risk: 0.02, blurb: '最大的单一市场，成本高、规则清楚。' },
  { id: 'CN', name: '中国', color: '#dc2626', region: 'asia',
    gdp: { 1995: 0.73, 2000: 1.21, 2005: 2.29, 2008: 4.6, 2010: 6.1, 2015: 11.1, 2019: 14.3, 2020: 14.7, 2024: 18.7 },
    cost: { 1995: 0.42, 2005: 0.5, 2012: 0.62, 2024: 0.78 }, risk: 0.05, blurb: '增长最快的大市场，制造配套全；外资准入随行业不同。' },
  { id: 'JP', name: '日本', color: '#be123c', region: 'asia',
    gdp: { 1995: 5.5, 2000: 4.9, 2007: 4.6, 2008: 5.1, 2012: 6.3, 2015: 4.4, 2020: 5.0, 2024: 4.1 },
    cost: { 1995: 1.08, 2024: 0.88 }, risk: 0.03, blurb: '大而成熟，消费者挑剔；经济长期低增长。' },
  { id: 'DE', name: '德国', color: '#ca8a04', region: 'europe',
    gdp: { 1995: 2.6, 2000: 1.95, 2008: 3.8, 2009: 3.4, 2015: 3.4, 2020: 3.9, 2024: 4.6 },
    cost: { 1995: 1.05, 2024: 1.02 }, risk: 0.02, blurb: '欧洲制造中心，工程能力强，进入欧盟的跳板。' },
  { id: 'UK', name: '英国', color: '#7c3aed', region: 'europe',
    gdp: { 1995: 1.3, 2000: 1.66, 2007: 3.1, 2009: 2.4, 2015: 2.9, 2020: 2.7, 2024: 3.6 },
    cost: { 1995: 0.95, 2024: 0.98 }, risk: 0.03, blurb: '金融与消费大国，英语市场；脱欧后与欧盟贸易有摩擦。' },
  { id: 'IN', name: '印度', color: '#ea580c', region: 'asia',
    gdp: { 1995: 0.36, 2000: 0.47, 2008: 1.2, 2015: 2.1, 2020: 2.7, 2024: 3.9 },
    cost: { 1995: 0.36, 2024: 0.5 }, risk: 0.06, blurb: '人口红利大，门槛和规则多，口味本地化要求高。' },
  { id: 'BR', name: '巴西', color: '#16a34a', region: 'americas',
    gdp: { 1995: 0.77, 1999: 0.6, 2002: 0.51, 2008: 1.7, 2011: 2.6, 2016: 1.8, 2020: 1.5, 2024: 2.2 },
    cost: { 1995: 0.7, 2024: 0.72 }, risk: 0.08, blurb: '拉美最大市场，跟着大宗商品大起大落，汇率波动大。' },
  { id: 'MX', name: '墨西哥', color: '#0d9488', region: 'americas',
    gdp: { 1995: 0.34, 2000: 0.74, 2008: 1.1, 2009: 0.9, 2015: 1.2, 2020: 1.1, 2024: 1.85 },
    cost: { 1995: 0.5, 2024: 0.6 }, risk: 0.05, blurb: '紧挨美国的制造基地，享受北美自贸待遇。' },
  { id: 'VN', name: '越南', color: '#b91c1c', region: 'asia',
    gdp: { 1995: 0.021, 2000: 0.031, 2008: 0.1, 2015: 0.24, 2020: 0.35, 2024: 0.43 },
    cost: { 1995: 0.3, 2024: 0.42 }, risk: 0.05, blurb: '市场小，但人工便宜，是新的制造基地。' }
];

const INDUSTRIES = [
  { id: 'electronics', name: '消费电子', short: '电子', physical: true,
    gdpShare: 0.006, pen: { 1995: 0.6, 2003: 0.9, 2008: 1.15, 2012: 1.45, 2016: 1.4, 2024: 1.25 },
    gm: 0.30, comp: 260, pe: 14, tradeable: true, importCost: 0.04,
    blurb: '手机、相机、游戏机。技术换代快，毛利薄，供应链和关税决定成本。',
    names: ['星火电子', '远航科技', '启明数码', '北辰电器'] },
  { id: 'beverage', name: '饮料快消', short: '饮料', physical: true,
    gdpShare: 0.003, pen: { 1995: 1.0, 2024: 1.05 },
    gm: 0.5, comp: 420, pe: 20, tradeable: false, importCost: 0.28,
    blurb: '饮料和零食。需求稳定，品牌和渠道是护城河，各国口味差异大。',
    names: ['清泉饮品', '金橙食品', '晨露饮料', '好味道'] },
  { id: 'software', name: '软件互联网', short: '软件', physical: false,
    gdpShare: 0.0015, pen: { 1995: 0.6, 1999: 1.6, 2001: 1.3, 2003: 1.6, 2008: 2.8, 2012: 4.2, 2016: 6.0, 2020: 8.5, 2024: 10.5 },
    gm: 0.78, comp: 460, pe: 24, tradeable: true, importCost: 0.0,
    blurb: '软件和网络服务。边际成本低、网络效应强，赢家通吃，也最受泡沫影响。',
    names: ['云帆软件', '织网科技', '星图互联', '万象数据'] }
];

// 各国对各行业外资的准入 / 适配度（0–1.2），按年份插值
const ACCESS = {
  electronics: { US: 1, CN: { 1995: 0.7, 2002: 0.95 }, JP: 0.8, DE: 1, UK: 1, IN: { 1995: 0.6, 2010: 0.9 }, BR: 0.75, MX: 0.95, VN: { 1995: 0.6, 2007: 0.95 } },
  beverage: { US: 1, CN: { 1995: 0.75, 2002: 0.95 }, JP: 0.8, DE: 0.9, UK: 1, IN: { 1995: 0.7, 2005: 0.85 }, BR: 0.95, MX: 1.05, VN: { 1995: 0.7, 2007: 0.95 } },
  software: { US: 1.05, CN: 0.35, JP: 0.7, DE: 0.85, UK: 1, IN: { 1995: 0.5, 2008: 0.9 }, BR: 0.8, MX: 0.85, VN: 0.6 }
};

// 进口关税（实物商品，按销售国），按年份插值
const TARIFF = {
  US: 0.03, JP: 0.03, DE: 0.03, UK: 0.03,
  CN: { 1995: 0.2, 2001: 0.15, 2002: 0.09, 2024: 0.07 },
  IN: { 1995: 0.35, 2005: 0.15, 2024: 0.12 },
  BR: 0.18, MX: { 1995: 0.1, 2024: 0.08 }, VN: { 1995: 0.15, 2007: 0.08, 2024: 0.05 }
};

// 双边特殊关税：[生产国, 销售国, 起始年, 结束年, 税率]
const SPECIAL_TARIFF = [
  ['CN', 'US', 2018, 2024, 0.25],
  ['MX', 'US', 1995, 2024, -0.03],   // 北美自贸：相当于免关税
  ['US', 'MX', 1995, 2024, -0.08],
  ['UK', 'DE', 2021, 2024, 0.04],    // 脱欧后的贸易摩擦
  ['DE', 'UK', 2021, 2024, 0.04]
];

// 年度宏观大事：headline 进新闻条；effects 为游戏效果
// demand: {国家或 '*': 乘数}；cost: 生产成本乘数；sentiment: 估值情绪；supply: 供给受限
const EVENTS = [
  { year: 1995, headline: '墨西哥比索危机余波未平，北美自贸协定生效第二年', demand: { MX: 0.88 } },
  { year: 1996, headline: '互联网开始走进家庭，全球个人电脑销量创新高', sector: { software: 1.08, electronics: 1.04 } },
  { year: 1997, headline: '泰铢贬值引爆亚洲金融危机，日本大型券商倒闭', demand: { VN: 0.82, JP: 0.95, CN: 0.97 }, fx: { VN: 0.85 } },
  { year: 1998, headline: '危机蔓延到俄罗斯和拉美，美国对冲基金长期资本管理公司濒临倒闭', demand: { BR: 0.92 } },
  { year: 1999, headline: '欧元诞生；纳斯达克狂飙，“.com”公司估值冲天；巴西雷亚尔大幅贬值', sentiment: { software: 2.4, electronics: 1.3 }, fx: { BR: 0.7 } },
  { year: 2000, headline: '纳斯达克三月见顶后暴跌，互联网泡沫开始破裂', sentiment: { software: 1.5 } },
  { year: 2001, headline: '美国经济衰退；中国 12 月加入世界贸易组织', sentiment: { software: 0.45, electronics: 0.8 }, demand: { US: 0.97 }, sector: { software: 0.85 } },
  { year: 2002, headline: '泡沫破裂后的寒冬，科技股继续低迷；欧元现钞开始流通', sentiment: { software: 0.55, electronics: 0.85 } },
  { year: 2003, headline: '非典冲击中国和东南亚消费；大宗商品开始一轮长周期上涨', demand: { CN: 0.94, VN: 0.92 }, sector: { beverage: 0.98 } },
  { year: 2004, headline: '中国经济高速增长，全球工厂开始向长三角、珠三角集中' },
  { year: 2005, headline: '油价突破 60 美元；印度软件外包规模快速扩大', demand: { IN: 1.04 } },
  { year: 2006, headline: '全球房地产和信贷繁荣；美国房价开始见顶' },
  { year: 2007, headline: '苹果发布 iPhone；美国次贷问题浮现；越南加入世界贸易组织', sector: { electronics: 1.05 } },
  { year: 2008, headline: '雷曼兄弟破产，全球金融危机爆发', demand: { '*': 0.93, US: 0.94, UK: 0.92 }, sentiment: { '*': 0.55 } },
  { year: 2009, headline: '全球衰退；中国推出大规模刺激计划，基建和消费拉动增长', demand: { '*': 0.95, CN: 1.06 }, sentiment: { '*': 0.7 } },
  { year: 2010, headline: '欧债危机爆发，希腊求援；新兴市场强劲复苏', demand: { DE: 0.97, UK: 0.97, BR: 1.04, IN: 1.03 } },
  { year: 2011, headline: '东日本大地震，汽车和电子供应链中断；巴西大宗商品繁荣见顶', demand: { JP: 0.93 }, supply: { JP: 0.6 } },
  { year: 2012, headline: '欧洲央行承诺“不惜一切代价”稳定欧元；智能手机普及加速', sector: { electronics: 1.04 } },
  { year: 2013, headline: '日本“安倍经济学”推动日元走弱；美联储暗示退出宽松，新兴市场震荡', fx: { JP: 0.82, BR: 0.9, IN: 0.9 } },
  { year: 2014, headline: '油价腰斩；移动互联网全面爆发', sector: { software: 1.06 } },
  { year: 2015, headline: '巴西陷入深度衰退；中国股市剧烈波动；大众柴油车排放丑闻', demand: { BR: 0.88, CN: 0.98 }, fx: { BR: 0.7 } },
  { year: 2016, headline: '英国公投脱欧，英镑大跌；印度突然废除大面额钞票', demand: { UK: 0.97, IN: 0.94 }, fx: { UK: 0.85 } },
  { year: 2017, headline: '印度推行全国统一商品服务税；全球经济同步复苏' },
  { year: 2018, headline: '中美贸易摩擦升级，美国对中国商品加征关税；“中国 + 1”供应链转移开始', demand: { VN: 1.05, MX: 1.03 } },
  { year: 2019, headline: '全球制造业放缓，贸易谈判反复' },
  { year: 2020, headline: '新冠疫情席卷全球，线下消费停摆，线上服务暴涨', demand: { '*': 0.92 }, sector: { software: 1.22, beverage: 0.92, electronics: 0.97 }, sentiment: { software: 1.6 } },
  { year: 2021, headline: '全球芯片短缺、海运运价暴涨；英国正式脱欧后的第一年', supply: { '*': 0.85 }, cost: { '*': 1.08 }, sentiment: { software: 1.4 } },
  { year: 2022, headline: '通胀创四十年新高，美联储激进加息；欧洲能源价格暴涨', cost: { '*': 1.06, DE: 1.2 }, sentiment: { software: 0.6, '*': 0.85 } },
  { year: 2023, headline: '生成式 AI 热潮掀起新一轮科技投资；“近岸外包”带火墨西哥制造', demand: { MX: 1.05 }, sentiment: { software: 1.35 } },
  { year: 2024, headline: '全球利率在高位徘徊，AI 投资继续扩张，供应链加速多元化', sentiment: { software: 1.2 } }
];

// 基准利率（全球简化）
const BASE_RATE = { 1995: 0.055, 2000: 0.06, 2002: 0.02, 2006: 0.05, 2008: 0.02, 2009: 0.005, 2016: 0.005, 2018: 0.02, 2020: 0.002, 2022: 0.03, 2023: 0.05, 2024: 0.05 };

function interp(table, year) {
  if (typeof table === 'number') return table;
  const ys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (year <= ys[0]) return table[ys[0]];
  if (year >= ys[ys.length - 1]) return table[ys[ys.length - 1]];
  for (let i = 0; i < ys.length - 1; i++) {
    const a = ys[i]; const b = ys[i + 1];
    if (year >= a && year <= b) return table[a] + (table[b] - table[a]) * (year - a) / (b - a);
  }
  return table[ys[0]];
}

module.exports = { START_YEAR, END_YEAR, COUNTRIES, INDUSTRIES, ACCESS, TARIFF, SPECIAL_TARIFF, EVENTS, BASE_RATE, interp };
