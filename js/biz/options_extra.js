// 给已有案例补上第四种解法：多数是“不按常理出牌”的思路。引擎加载时合并进各案例的选项。
const EXTRA = {
  U1_ASIA_CRISIS: { id: 'x', text: '借钱给{C}同行渡过难关，换取它的长期独家供货', hint: '不买资产，买关系',
    outcomes: [
      { p: 0.6, title: '患难见真情', text: '对方挺过危机后成了你最便宜、最忠诚的供应商。', effects: [{ t: 'cash', v: -0.04, min: 8e5 }, { t: 'mod', gm: 0.015, years: 8, from: 1 }, { t: 'brand', c: '{C}', v: 6 }] },
      { p: 0.4, title: '对方还是倒了', text: '借出去的钱只收回一小部分。', effects: [{ t: 'cash', v: -0.05, min: 1e6 }] }
    ] },
  U2_WTO: { id: 'x', text: '收购一家中国本土品牌，借它的渠道进入', hint: '买现成的渠道',
    outcomes: [
      { p: 0.6, title: '渠道到手', text: '本土品牌保留原名，背后换上了你的技术。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'level', c: 'CN', v: 2 }, { t: 'brand', c: 'CN', v: 18 }] },
      { p: 0.4, title: '买到一个空壳', text: '尽职调查漏掉了不少问题，渠道比想象中弱。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'level', c: 'CN', v: 2 }, { t: 'brand', c: 'CN', v: 5 }] }
    ] },
  U2_WTO_CN: { id: 'x', text: '去下沉市场：巨头看不上的县城和乡镇，先占下来', hint: '农村包围城市',
    outcomes: [{ p: 1, title: '在巨头够不着的地方长大', text: '县城市场又大又没人管，你的份额稳步上升。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', attract: { CN: 1.15 }, years: 10 }, { t: 'brand', c: 'CN', v: 6 }] }] },
  U3_GFC: { id: 'x', text: '趁低价收购一家陷入困境的对手', hint: '危机里抄底',
    outcomes: [
      { p: 0.55, title: '一口吃下', text: '你用很低的价格接下了对手的客户和技术。', effects: [{ t: 'cash', v: -0.15, min: 3e6 }, { t: 'mod', attract: { '*': 1.1 }, years: 5, from: 1 }, { t: 'quality', v: 3 }] },
      { p: 0.45, title: '消化不良', text: '危机比预想的长，收来的业务一直亏钱。', effects: [{ t: 'cash', v: -0.2, min: 4e6 }, { t: 'mod', gm: -0.01, years: 3 }] }
    ] },
  U4_TRADE: { id: 'x', text: '在墨西哥建厂，借北美自贸协定零关税进美国', hint: '近岸外包',
    outcomes: [{ p: 1, title: '墨西哥基地投产', text: '离美国客户只有几天车程，关税也绕开了。', effects: [{ t: 'cash', v: -0.08, min: 3e6 }, { t: 'level', c: 'MX', v: 3, sw: 2 }] }] },
  U4_DATA: { id: 'x', text: '把“隐私保护”做成卖点，推出加密版高价产品', hint: '化合规为优势',
    outcomes: [
      { p: 0.6, title: '隐私成了招牌', text: '欧洲用户愿意为“不被追踪”多付钱。', effects: [{ t: 'cash', v: -0.04, min: 1e6 }, { t: 'brand', c: 'DE', v: 10 }, { t: 'brand', c: 'UK', v: 8 }, { t: 'mod', gm: 0.01, years: 6 }] },
      { p: 0.4, title: '叫好不叫座', text: '大多数用户嘴上说在乎隐私，掏钱时还是选便宜的。', effects: [{ t: 'cash', v: -0.04, min: 1e6 }, { t: 'brand', v: 2 }] }
    ] },
  U5_COVID: { id: 'x', text: '把生产线临时改造成生产口罩和防护用品', hint: '危中寻机',
    outcomes: [{ p: 1, title: '一时的救命钱', text: '防疫物资卖得很好，还赢得了政府和公众的好感。', effects: [{ t: 'cash', v: 0.04 }, { t: 'brand', v: 5 }] }] },
  U6_INFLATION: { id: 'x', text: '推出更便宜的副线，把价格敏感的顾客留住', hint: '高低两条腿',
    outcomes: [{ p: 1, title: '两头都没丢', text: '主品牌照常涨价，副线接住了想省钱的顾客。', effects: [{ t: 'cash', v: -0.02 }, { t: 'mod', gm: 0.01, attract: { '*': 1.03 }, years: 3 }] }] },
  E1_DIGITAL: { id: 'x', text: '把数码技术卖给别人收专利费，自己继续做老产品', hint: '做技术供应商',
    outcomes: [{ p: 1, title: '专利费源源不断', text: '对手用你的专利造数码相机，你坐收专利费，可自己的品牌渐渐老化。', effects: [{ t: 'cash', v: 0.04 }, { t: 'mod', attract: { '*': 0.9 }, years: 8, from: 3 }] }] },
  E3_BLUE_OCEAN: { id: 'x', text: '做手机游戏平台，让别人的手机来玩你的游戏', hint: '轻资产转型',
    outcomes: [
      { p: 0.5, title: '提前赶上移动游戏', text: '你的游戏在几亿部手机上运行。', effects: [{ t: 'cash', v: -0.04 }, { t: 'mod', attract: { '*': 1.08 }, gm: 0.02, years: 8, from: 2 }] },
      { p: 0.5, title: '太早了', text: '那时的手机还带不动像样的游戏。', effects: [{ t: 'cash', v: -0.05, min: 1e6 }] }
    ] },
  E2_SMARTPHONE: { id: 'x', text: '放弃整机，专做手机里的关键零部件', hint: '卖铲子',
    outcomes: [{ p: 1, title: '成了幕后供应商', text: '整机品牌在你手里消失了，但每一台智能手机里都有你的零件。', effects: [{ t: 'brand', v: -10 }, { t: 'mod', gm: 0.03, years: 12 }, { t: 'quality', v: 5 }] }] },
  E4_RECALL: { id: 'x', text: '召回之外，公开全部调查数据，邀请第三方专家监督', hint: '比召回更透明',
    outcomes: [{ p: 1, title: '信任重建', text: '透明的态度让下一代产品卖得比出事前还好。', effects: [{ t: 'cash', v: -0.09, min: 2e6 }, { t: 'brand', v: 2 }, { t: 'quality', v: 6 }] }] },
  B1_LOCAL: { id: 'x', text: '和{C}本土巨头合作，用它的瓶装厂和渠道卖你的饮料', hint: '借船出海',
    outcomes: [{ p: 1, title: '快速铺货', text: '一年就进了上万家小店，但大头利润被伙伴拿走。', effects: [{ t: 'level', c: '{C}', v: 2 }, { t: 'brand', c: '{C}', v: 10 }, { t: 'mod', gm: -0.01, years: 5 }] }] },
  B2_JV: { id: 'x', text: '把合资股份卖给对方，套现走人', hint: '见好就收',
    outcomes: [{ p: 1, title: '落袋为安', text: '卖了个好价钱，但你在{C}的生意也就此结束。', effects: [{ t: 'cash', v: 0.08 }, { t: 'level', c: '{C}', v: 1, force: true }, { t: 'brand', c: '{C}', v: -10 }] }] },
  B3_CATEGORY: { id: 'x', text: '收购一家已经在做新品类的小公司', hint: '买下创新',
    outcomes: [
      { p: 0.6, title: '收购物超所值', text: '小公司有了你的渠道，销量翻了几番。', effects: [{ t: 'cash', v: -0.08, min: 2e6 }, { t: 'mod', attract: { '*': 1.08 }, gm: 0.02, years: 8 }] },
      { p: 0.4, title: '创始团队走了', text: '品牌留下了，灵魂没了。', effects: [{ t: 'cash', v: -0.08, min: 2e6 }, { t: 'mod', attract: { '*': 1.02 }, years: 4 }] }
    ] },
  B4_SUGAR: { id: 'x', text: '游说政府推迟征税，同时资助“运动比少吃糖更重要”的研究', hint: '对抗政策',
    outcomes: [
      { p: 0.35, title: '政策推迟了', text: '你多赚了几年老配方的钱。', effects: [{ t: 'cash', v: -0.02 }, { t: 'mod', gm: 0.01, years: 3 }] },
      { p: 0.65, title: '被媒体揭穿', text: '报道说你资助的研究有利益冲突，品牌口碑大跌。', effects: [{ t: 'cash', v: -0.02 }, { t: 'brand', v: -10 }, { t: 'mod', attract: { UK: 0.85, MX: 0.88 }, years: 4 }] }
    ] },
  S1_BUBBLE: { id: 'x', text: '用高估值的股票去收购那些没钱的好公司', hint: '股票当钱花',
    outcomes: [
      { p: 0.5, title: '用纸换了金子', text: '泡沫破之前，你已经用股票换来几家真正赚钱的公司。', effects: [{ t: 'raise', v: 0.05 }, { t: 'quality', v: 6 }, { t: 'mod', attract: { '*': 1.08 }, years: 6 }] },
      { p: 0.5, title: '整合一团乱', text: '收来的公司文化各异，管理层精疲力尽。', effects: [{ t: 'raise', v: 0.05 }, { t: 'mod', gm: -0.02, years: 3 }] }
    ] },
  S2_FREE: { id: 'x', text: '退出{C}，把资源投向别的国家', hint: '不打消耗战',
    outcomes: [{ p: 1, title: '战略撤退', text: '你把{C}市场让了出去，省下的钱用在了更有把握的地方。', effects: [{ t: 'level', c: '{C}', v: 1, force: true }, { t: 'cash', v: 0.02 }, { t: 'mod', attract: { '*': 1.04 }, years: 4 }] }] },
  S3_PLATFORM: { id: 'x', text: '把这套技术开源，靠服务和认证赚钱', hint: '开放生态',
    outcomes: [
      { p: 0.55, title: '成了行业标准', text: '全世界的开发者都在用你的开源工具。', effects: [{ t: 'brand', v: 8 }, { t: 'quality', v: 5 }, { t: 'mod', attract: { '*': 1.06 }, years: 10 }] },
      { p: 0.45, title: '为他人作嫁衣', text: '大公司拿你的代码做了收费服务。', effects: [{ t: 'brand', v: 3 }] }
    ] },
  S4_SPLIT: { id: 'x', text: '把老业务卖给一家私募基金，专心做新业务', hint: '断臂求生',
    outcomes: [{ p: 1, title: '轻装上阵', text: '卖老业务拿到一大笔现金，新业务终于可以全速前进。', effects: [{ t: 'cash', v: 0.12 }, { t: 'mod', attract: { '*': 0.9 }, years: 2 }, { t: 'mod', attract: { '*': 1.1 }, years: 8, from: 2 }] }] },
  U_DOTCOM: { id: 'x', text: '投资几家互联网创业公司当小股东', hint: '分散下注',
    outcomes: [
      { p: 0.3, title: '押中了一家', text: '其中一家后来成了巨头，你的小股份翻了上百倍。', effects: [{ t: 'cash', v: 0.1 }] },
      { p: 0.7, title: '全军覆没', text: '泡沫破裂，几家公司都关门了。', effects: [{ t: 'cash', v: -0.03, min: 8e5 }] }
    ] },
  U_OFFSHORE: { id: 'x', text: '去越南建服务中心，成本更低、竞争更少', hint: '另辟蹊径',
    outcomes: [{ p: 1, title: '越南团队起步', text: '规模不大，但成本更低、流失率也低。', effects: [{ t: 'cash', v: -0.03 }, { t: 'level', c: 'VN', v: 2 }, { t: 'mod', gm: 0.012, years: 10, from: 1 }] }] },
  U_EURO_DEBT: { id: 'x', text: '只买它在亚洲的业务和品牌使用权', hint: '买一半',
    outcomes: [{ p: 1, title: '借来一块金字招牌', text: '在亚洲用上了百年欧洲品牌，价格不贵。', effects: [{ t: 'cash', v: -0.08, min: 2e6 }, { t: 'brand', c: 'CN', v: 10 }, { t: 'brand', c: 'JP', v: 8 }, { t: 'mod', attract: { CN: 1.08, JP: 1.06 }, years: 8 }] }] },
  U_BREXIT: { id: 'x', text: '英国和德国各留一套班子，两边都不放弃', hint: '花钱买确定性',
    outcomes: [{ p: 1, title: '双总部运转', text: '成本高了不少，但不管谈判结果如何，生意都不受影响。', effects: [{ t: 'cash', v: -0.05, min: 2e6 }, { t: 'level', c: 'DE', v: 2 }, { t: 'mod', gm: -0.005, years: 5 }] }] },
  U_CARBON: { id: 'x', text: '自建光伏电站和储能，顺便对外卖电', hint: '把减排做成生意',
    outcomes: [{ p: 1, title: '多了一门生意', text: '电费省了，多余的电还能卖钱。', effects: [{ t: 'cash', v: -0.07, min: 2e6 }, { t: 'mod', gm: 0.015, years: 15, from: 1 }, { t: 'brand', v: 3 }] }] },
  U_AI: { id: 'x', text: '收购一家 AI 创业公司，把团队整体并进来', hint: '买人才',
    outcomes: [
      { p: 0.6, title: '有了自己的 AI 团队', text: '他们帮你把 AI 用到了产品里。', effects: [{ t: 'cash', v: -0.08, min: 2e6 }, { t: 'quality', v: 7 }, { t: 'mod', gm: 0.015, years: 6 }] },
      { p: 0.4, title: '人才被大厂挖走', text: '收购后一年，核心工程师陆续跳槽。', effects: [{ t: 'cash', v: -0.08, min: 2e6 }, { t: 'quality', v: 2 }] }
    ] },
  A1_LEAN: { id: 'x', text: '直接和日本车厂合资建厂，让他们来管', hint: '请老师进门',
    outcomes: [{ p: 1, title: '近距离学习', text: '合资工厂成了样板，你的管理层轮流去学。', effects: [{ t: 'cash', v: -0.05, min: 2e6 }, { t: 'quality', v: 7 }, { t: 'mod', gm: 0.015, years: 10, from: 1 }, { t: 'brand', c: 'JP', v: 5 }] }] },
  A2_EV: { id: 'x', text: '只做电池和电驱，卖给所有车厂', hint: '做电动车的“心脏”',
    outcomes: [
      { p: 0.6, title: '成了电池巨头', text: '不管谁家的电动车卖得好，都要用你的电池。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'mod', gm: 0.025, years: 12, from: 2 }, { t: 'flag', name: 'ev' }] },
      { p: 0.4, title: '价格战太惨', text: '电池产能过剩，利润被压得很薄。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'mod', gm: 0.005, years: 8, from: 2 }] }
    ] },
  A3_EMISSION: { id: 'x', text: '主动向监管机构报告技术难题，申请延期', hint: '坦白',
    outcomes: [{ p: 1, title: '监管给了时间', text: '你晚了一年上市，却赢得了监管和公众的尊重。', effects: [{ t: 'cash', v: -0.02 }, { t: 'mod', attract: { US: 0.95 }, years: 1 }, { t: 'brand', v: 6 }] }] },
  A4_RECALL: { id: 'x', text: '召回的同时，给所有车主免费延长保修五年', hint: '加倍补偿',
    outcomes: [{ p: 1, title: '车主反而更忠诚', text: '花了很多钱，但口碑甚至比出事前更好。', effects: [{ t: 'cash', v: -0.16, min: 4e6 }, { t: 'brand', v: 3 }, { t: 'quality', v: 6 }] }] },
  A5_CHIPS: { id: 'x', text: '自己设计芯片，找代工厂专门生产', hint: '一劳永逸',
    outcomes: [
      { p: 0.55, title: '芯片自主', text: '三年后你用上了自己的芯片，成本和供应都握在手里。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'quality', v: 6 }, { t: 'mod', gm: 0.012, years: 10, from: 2 }] },
      { p: 0.45, title: '研发远比想象难', text: '钱花了不少，进度一拖再拖。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'quality', v: 2 }] }
    ] },
  P1_FAST: { id: 'x', text: '只卖基本款：几十种百搭单品，每年改进面料', hint: '不追潮流',
    outcomes: [{ p: 1, title: '基本款之王', text: '不追潮流、不打折，靠面料和价格赢得全世界的回头客。', effects: [{ t: 'quality', v: 6 }, { t: 'mod', gm: 0.02, attract: { '*': 1.05 }, years: 12, from: 1 }] }] },
  P2_ENTRY: { id: 'x', text: '在{C}只开线上店，用数据摸清顾客口味再说', hint: '轻量试探',
    outcomes: [{ p: 1, title: '数据说话', text: '网店投入小，你很快知道了当地人喜欢什么。', effects: [{ t: 'cash', v: -0.01 }, { t: 'level', c: '{C}', v: 1 }, { t: 'mod', attract: { '{C}': 1.1 }, years: 6, from: 1 }] }] },
  P3_FACTORY: { id: 'x', text: '公开所有供应商工厂名单和审核报告', hint: '彻底透明',
    outcomes: [{ p: 1, title: '透明领跑者', text: '你成了第一个公开全部供应链的大品牌，年轻顾客很买账。', effects: [{ t: 'cash', v: -0.02 }, { t: 'brand', v: 8 }, { t: 'mod', gm: -0.005, years: 4 }] }] },
  P4_ONLINE: { id: 'x', text: '门店改成“会员体验店”：试衣、改衣、喝咖啡，不靠卖货赚钱', hint: '重新定义门店',
    outcomes: [
      { p: 0.6, title: '门店成了社区', text: '会员来店里试穿，回家在网上下单。', effects: [{ t: 'cash', v: -0.05, min: 1.5e6 }, { t: 'brand', v: 7 }, { t: 'mod', attract: { '*': 1.07 }, years: 8, from: 1 }] },
      { p: 0.4, title: '叫好不叫座', text: '体验很好，但成本收不回来。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'brand', v: 4 }] }
    ] }
};

module.exports = { EXTRA };
