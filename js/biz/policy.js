// 经营细节：产品 / 财务 / 组织 / 供应链 四类长期设置。随时可改，次年结算生效；
// 组织架构和企业文化改动有成本或冷却期。数值都是游戏化的示意。

const POLICIES = {
  product: [
    { key: 'lines', name: '产品档次', multi: true, opts: [
      { id: 'budget', name: '平价款', desc: '在收入低的国家最受欢迎，毛利低 5 个点' },
      { id: 'mid', name: '主流款', desc: '各国都能卖，毛利正常' },
      { id: 'premium', name: '高端款', desc: '发达国家买账，毛利高 6 个点，穷国卖不动' }
    ], tip: '可多选。每个国家的顾客会买最适合自己的那一档；每多一档，管理费用加收入的 0.6%。' },
    { key: 'price', name: '定价', opts: [
      { id: 'low', name: '渗透定价', desc: '价格 −12%，吸引力 +25%，品牌缓慢受损' },
      { id: 'mid', name: '随行就市', desc: '跟对手差不多' },
      { id: 'premium', name: '溢价', desc: '价格 +15%，吸引力 −20%，品牌缓慢提升' }
    ] },
    { key: 'rnd', name: '研发投入', opts: [
      { id: 'low', name: '少投', desc: '收入的 2%，产品力会下滑' },
      { id: 'mid', name: '正常', desc: '收入的 5%' },
      { id: 'high', name: '重投', desc: '收入的 10%，产品力快速提升' }
    ] },
    { key: 'focus', name: '研发方向', opts: [
      { id: 'cost', name: '降本', desc: '毛利 +2 点，产品力每年少涨 1 点' },
      { id: 'quality', name: '品质', desc: '产品力每年多涨 1.5 点' },
      { id: 'innovate', name: '颠覆创新', desc: '每年约 12% 机会出爆品：品牌和产品力大涨；平时多花收入的 1%' }
    ] }
  ],
  finance: [
    { key: 'hedge', name: '汇率对冲', opts: [
      { id: 'off', name: '不对冲', desc: '汇率涨跌全部体现在收入里' },
      { id: 'on', name: '对冲', desc: '花海外收入的 0.4%，汇率波动只剩三成' }
    ] },
    { key: 'payout', name: '分红政策', opts: [
      { id: 'none', name: '不分红', desc: '利润全部留在公司' },
      { id: 'some', name: '分三成', desc: '盈利年份把净利润的 30% 分给股东（你拿持股比例那份）' },
      { id: 'most', name: '分七成', desc: '盈利年份分掉 70%，个人财富涨得快，公司现金少' }
    ], tip: '分到你手里的钱计入“个人财富”，结局时也会展示。' }
  ],
  org: [
    { key: 'staff', name: '人员规模', opts: [
      { id: 'lean', name: '精简', desc: '固定费用 −15%，产品力每年少涨 1 点，品牌少涨 1 点' },
      { id: 'normal', name: '正常', desc: '' },
      { id: 'expand', name: '扩张', desc: '固定费用 +15%，产品力 +1/年，吸引力 +4%' }
    ] },
    { key: 'pay', name: '薪酬水平', opts: [
      { id: 'low', name: '低于市场', desc: '毛利 +1 点，产品力每年 −1，容易罢工、被挖人' },
      { id: 'market', name: '市场水平', desc: '' },
      { id: 'high', name: '高于市场', desc: '毛利 −1.2 点，产品力 +1/年，人才稳定' }
    ] },
    { key: 'ceo', name: '谁来当 CEO', opts: [
      { id: 'self', name: '创始人亲自上', desc: '不花钱' },
      { id: 'pro', name: '职业经理人', desc: '总部费用 +收入的 0.5%，收入过亿后每年多一个行动点' },
      { id: 'star', name: '明星 CEO', desc: '每年 200 万美元 +收入的 1.2%，多一个行动点，估值 +10%' }
    ] },
    { key: 'structure', name: '组织架构', cooldown: 2, opts: [
      { id: 'central', name: '总部集权', desc: '总部费用 −20%，海外吸引力 −6%' },
      { id: 'regional', name: '区域事业部', desc: '总部费用 +收入的 1%，海外吸引力 +8%' },
      { id: 'matrix', name: '矩阵式', desc: '总部费用 +收入的 0.6%，海外吸引力 +4%，产品力 +0.5/年' }
    ], tip: '调整架构要花一笔重组费（收入的 1%），之后 2 年内不能再改。' },
    { key: 'culture', name: '企业文化', cooldown: 3, opts: [
      { id: 'wolf', name: '狼性', desc: '吸引力 +5%，品牌每年 −0.5，丑闻风险高' },
      { id: 'engineer', name: '工程师文化', desc: '产品力 +1/年，吸引力 −2%' },
      { id: 'steady', name: '稳健', desc: '贷款利率低 0.5 个点，吸引力 −2%' },
      { id: 'mission', name: '使命驱动', desc: '品牌每年 +1，毛利 −0.5 点' }
    ], tip: '文化要慢慢养成，改完 3 年内不能再改。' }
  ],
  supply: [
    { key: 'supplier', name: '供应商', opts: [
      { id: 'single', name: '单一低价', desc: '成本 −4%，断供时损失加倍' },
      { id: 'multi', name: '多元备份', desc: '成本不变，断供损失减半' },
      { id: 'near', name: '近岸采购', desc: '成本 +4%，关税影响减半；服装吸引力 +5%' }
    ] },
    { key: 'inventory', name: '库存', opts: [
      { id: 'jit', name: '零库存', desc: '成本 −2%，断供时全额受影响' },
      { id: 'buffer', name: '安全库存', desc: '成本 +1%，断供损失减半' }
    ] },
    { key: 'channel', name: '销售渠道', opts: [
      { id: 'offline', name: '线下门店', desc: '老派可靠，2015 年后效果逐年变差' },
      { id: 'online', name: '电商', desc: '2000 年后越来越好用' },
      { id: 'social', name: '社交 / 直播', desc: '2015 年后威力大，之前没什么用' },
      { id: 'omni', name: '全渠道', desc: '销售费用 +收入的 2%，各时代都稳' },
      { id: 'agent', name: 'AI 代理', desc: '2030 年后解锁：让 AI 替顾客挑选下单，销售费用低' }
    ] },
    { key: 'local', name: '本地化', opts: [
      { id: 'global', name: '全球统一', desc: '成本 −3%，海外吸引力 −10%' },
      { id: 'moderate', name: '适度本地化', desc: '' },
      { id: 'deep', name: '深度本地化', desc: '海外固定费用 +15%，海外吸引力 +12%' }
    ] }
  ]
};

const DEFAULT_POLICY = {
  lines: ['mid'], price: 'mid', rnd: 'mid', focus: 'quality',
  hedge: 'off', payout: 'none',
  staff: 'normal', pay: 'market', ceo: 'self', structure: 'central', culture: 'steady',
  supplier: 'multi', inventory: 'jit', channel: 'offline', local: 'moderate'
};

const LINE_FIT = { budget: [1.25, 1.0, 0.6], mid: [0.75, 1.0, 1.0], premium: [0.4, 0.8, 1.25] }; // 收入档 1/2/3
const LINE_GM = { budget: -0.05, mid: 0, premium: 0.06 };

function interpTier(t, line) { // t ∈ [1,3]
  const f = LINE_FIT[line];
  if (t <= 2) return f[0] + (f[1] - f[0]) * (t - 1);
  return f[1] + (f[2] - f[1]) * (t - 2);
}

// 渠道在某一年的效果
function channelEff(ch, year) {
  const k = (a, b) => Math.max(0, Math.min(1, (year - a) / (b - a)));
  switch (ch) {
    case 'offline': return 1.02 - 0.12 * k(2015, 2035);
    case 'online': return 0.9 + 0.18 * k(2000, 2020);
    case 'social': return year < 2012 ? 0.85 : 0.85 + 0.3 * k(2012, 2018);
    case 'omni': return 1.04 + 0.02 * k(2010, 2025);
    case 'agent': return year < 2030 ? 0.6 : 1.0 + 0.16 * k(2030, 2045);
    default: return 1;
  }
}

module.exports = { POLICIES, DEFAULT_POLICY, LINE_GM, interpTier, channelEff };
