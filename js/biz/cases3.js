// 扩展历史案例（1995–2024）：医药、新能源两个新行业，以及更多通用和行业案例。原创撰写，依据公开史实。
const physical = (s) => s.industry !== 'software';

const CASES3 = [
  // ---------------- 通用 ----------------
  {
    id: 'U_SARS', years: [2003, 2003], title: '非典来了', era: '2003 非典疫情',
    cond: (s) => ['CN', 'VN'].some((c) => s.countries[c].level >= 1),
    situation: '一种新型肺炎在中国南方和香港暴发，商场冷清、工厂请假，外国客户取消了来华行程。有人说几个月就会过去，也有人担心会像历史上的大瘟疫一样漫长。',
    options: [
      { id: 'stay', text: '留在中国，给员工发防护用品，照常运营', hint: '和当地共进退',
        outcomes: [{ p: 1, title: '共渡难关', text: '疫情半年后过去，员工和客户都记住了你没走。', effects: [{ t: 'cash', v: -0.01 }, { t: 'brand', c: 'CN', v: 8 }] }] },
      { id: 'online', text: '趁机推出网上订购和送货上门', hint: '危机里的新习惯',
        outcomes: [{ p: 1, title: '线上种子发芽', text: '很多人第一次在网上买东西，有些人从此再没回去。', effects: [{ t: 'cash', v: -0.02 }, { t: 'mod', attract: { CN: 1.06 }, years: 6, from: 1 }] }] },
      { id: 'pull', text: '暂停中国业务，外派人员全部撤回', hint: '安全第一',
        outcomes: [{ p: 1, title: '躲开了风险', text: '可回来时发现，对手已经接走了你的客户。', effects: [{ t: 'share', m: { CN: 0.85, VN: 0.9 } }] }] },
      { id: 'buy', text: '逆势招人，挖走那些裁员公司的骨干', hint: '人才抄底',
        outcomes: [{ p: 1, title: '团队更强了', text: '疫情过后，你的团队比对手整齐得多。', effects: [{ t: 'cash', v: -0.02 }, { t: 'quality', v: 4 }] }] }
    ],
    history: '2003 年春天，非典在中国内地、香港和东南亚暴发，持续约半年。很多人因为不敢出门第一次尝试网购，当年成立的淘宝网和后来的京东转型都与这段经历有关。',
    theory: { name: '危机中的机会', text: '突发危机会在短时间内改变消费习惯。那些坚持服务客户、同时抓住新习惯的公司，往往在危机后获得超常增长。' }
  },
  {
    id: 'U_QUAKE', years: [2011, 2011], title: '一个零件停掉全世界', era: '2011 东日本大地震',
    cond: physical,
    situation: '日本东北发生 9 级地震和海啸，一家生产关键芯片和特种材料的工厂被淹。你的产品里有一个零件只有这家工厂能做，库存只够撑三周。',
    options: [
      { id: 'airlift', text: '派工程师去日本帮对方抢修，承担部分费用', hint: '帮供应商就是帮自己',
        outcomes: [{ p: 1, title: '提前复产', text: '工厂比预期早两个月恢复，你拿到了第一批货。', effects: [{ t: 'cash', v: -0.02 }, { t: 'brand', c: 'JP', v: 8 }] }] },
      { id: 'second', text: '紧急认证第二家供应商，以后永远至少两家', hint: '多元化',
        outcomes: [{ p: 1, title: '有了备胎', text: '短期还是缺货，但以后再不会被一家卡住。', effects: [{ t: 'mod', attract: { '*': 0.94 }, years: 1 }, { t: 'mod', gm: -0.005, years: 3 }] }] },
      { id: 'redesign', text: '修改设计，换成市面上常见的零件', hint: '工程师加班',
        outcomes: [
          { p: 0.6, title: '设计绕过去了', text: '新设计甚至更便宜。', effects: [{ t: 'quality', v: 2 }, { t: 'mod', gm: 0.005, years: 4 }] },
          { p: 0.4, title: '性能打了折扣', text: '产品勉强能用，口碑受了点影响。', effects: [{ t: 'quality', v: -4 }] }
        ] },
      { id: 'wait', text: '停产等货', hint: '不花钱',
        outcomes: [{ p: 1, title: '停产三个月', text: '客户转去了别家。', effects: [{ t: 'share', m: { '*': 0.9 } }] }] }
    ],
    history: '2011 年 3 月东日本大地震后，瑞萨电子的那珂工厂停产，全球汽车厂因为缺少它生产的车用芯片而减产。此后，丰田等企业建立了覆盖上万个零件的供应链数据库，要求关键零件多地生产。',
    theory: { name: '单点故障', text: '供应链里只有一家能做的零件就是“单点故障”。平时它最便宜，出事时它能让整条生产线停摆。韧性来自冗余和透明。' }
  },
  {
    id: 'U_MOBILE', years: [2011, 2013], title: '大家都在低头看手机', era: '2010 年代初 移动互联网',
    situation: '智能手机几年内普及到了每个人手里。你的客户越来越少逛门店、上电脑网站，而是在手机应用里买东西、看推荐、晒评价。',
    options: [
      { id: 'app', text: '自己开发手机应用，把会员和订单都搬上去', hint: '投入大，掌握用户',
        outcomes: [{ p: 1, title: '有了自己的流量', text: '应用下载量稳步上升，你能直接和顾客对话。', effects: [{ t: 'cash', v: -0.04, min: 1e6 }, { t: 'mod', attract: { '*': 1.07 }, years: 10, from: 1 }] }] },
      { id: 'platform', text: '入驻大平台，用平台的流量卖货', hint: '省事，但抽成高',
        outcomes: [{ p: 1, title: '销量大涨，利润变薄', text: '平台带来了很多新顾客，也拿走了一大块利润。', effects: [{ t: 'mod', attract: { '*': 1.08 }, gm: -0.015, years: 8 }] }] },
      { id: 'social', text: '请网红和用户在社交媒体上帮你说话', hint: '口碑营销',
        outcomes: [
          { p: 0.6, title: '年轻人都知道你了', text: '几条视频火了，品牌年轻了一大截。', effects: [{ t: 'cash', v: -0.02 }, { t: 'brand', v: 7 }] },
          { p: 0.4, title: '翻车了', text: '一位合作网红出了丑闻，连累了你。', effects: [{ t: 'cash', v: -0.02 }, { t: 'brand', v: -4 }] }
        ] },
      { id: 'ignore', text: '手机只是一个屏幕，渠道还是老样子', hint: '不折腾',
        outcomes: [{ p: 1, title: '慢慢被遗忘', text: '年轻顾客越来越少。', effects: [{ t: 'mod', attract: { '*': 0.93 }, years: 8, from: 1 }] }] }
    ],
    history: '2010 年代初，智能手机快速普及。微信 2011 年上线，Instagram 2010 年上线，移动支付和应用商店改变了零售和广告。一些传统品牌因为迟迟没有转型而失去年轻顾客。',
    theory: { name: '渠道迁移', text: '顾客在哪里，生意就要去哪里。自建渠道掌握数据但投入大，借用平台起量快但受制于人，多数公司最终两者兼用。' }
  },
  {
    id: 'U_DEMONETIZE', years: [2016, 2016], title: '一夜之间现金作废', era: '2016 印度废钞',
    cond: (s) => s.countries.IN.level >= 1,
    situation: '印度政府突然宣布，500 和 1000 卢比大钞午夜起作废，这两种面额占流通现金的八成多。小店、批发商纷纷停摆，你在印度的经销商说货卖不出去了。',
    options: [
      { id: 'digital', text: '马上接入手机支付，给经销商发扫码设备', hint: '顺势推动数字化',
        outcomes: [{ p: 1, title: '提前完成数字化', text: '几个月后，你的经销网络成了印度最早用上数字支付的一批。', effects: [{ t: 'cash', v: -0.01 }, { t: 'mod', attract: { IN: 1.1 }, years: 6, from: 1 }] }] },
      { id: 'credit', text: '给经销商赊账三个月，帮他们渡过难关', hint: '雪中送炭',
        outcomes: [
          { p: 0.7, title: '经销商记住了你', text: '危机过后，他们优先进你的货。', effects: [{ t: 'cash', v: -0.02 }, { t: 'brand', c: 'IN', v: 10 }] },
          { p: 0.3, title: '坏账', text: '有些小经销商再没回来。', effects: [{ t: 'cash', v: -0.04, min: 5e5 }] }
        ] },
      { id: 'wait', text: '暂停发货，等现金恢复', hint: '控制风险',
        outcomes: [{ p: 1, title: '销量断崖', text: '这个季度在印度几乎没有收入。', effects: [{ t: 'share', m: { IN: 0.88 } }] }] }
    ],
    history: '2016 年 11 月 8 日，印度总理莫迪宣布废除 500 和 1000 卢比纸币，约占流通现金的 86%。短期内现金短缺让很多小生意停摆，但手机支付 Paytm 和后来的统一支付接口 UPI 用户量暴增。',
    theory: { name: '制度冲击', text: '新兴市场的政策变化常常突然而剧烈。能把冲击变成推动转型的机会，比单纯规避风险更有价值。' }
  },
  {
    id: 'U_OIL', years: [2014, 2016], title: '油价腰斩', era: '2014 油价暴跌',
    cond: (s) => ['BR', 'MX'].some((c) => s.countries[c].level >= 1),
    situation: '页岩油革命让美国产量大增，石油输出国组织又拒绝减产，国际油价一年内从 100 多美元跌到 30 多美元。巴西、墨西哥这些依赖石油和大宗商品的经济体货币大跌、消费萎缩。',
    options: [
      { id: 'hold', text: '坚守拉美，用本地货币定价保住份额', hint: '扛过低谷',
        outcomes: [{ p: 1, title: '熬过来了', text: '几年后经济复苏，你的份额比对手高。', effects: [{ t: 'mod', gm: -0.01, years: 2 }, { t: 'brand', c: 'BR', v: 6 }, { t: 'brand', c: 'MX', v: 4 }] }] },
      { id: 'cut', text: '收缩拉美业务，把资源转到亚洲', hint: '止损',
        outcomes: [{ p: 1, title: '及时止损', text: '省下的钱在亚洲带来了更快的增长。', effects: [{ t: 'share', m: { BR: 0.85, MX: 0.9 } }, { t: 'mod', attract: { IN: 1.05, VN: 1.05, CN: 1.03 }, years: 4 }] }] },
      { id: 'buy', text: '趁当地资产便宜，收购一家巴西公司', hint: '逆周期抄底',
        outcomes: [
          { p: 0.55, title: '抄到了底', text: '经济复苏后，这笔收购价值翻倍。', effects: [{ t: 'cash', v: -0.08, min: 2e6 }, { t: 'level', c: 'BR', v: 2 }, { t: 'brand', c: 'BR', v: 12 }, { t: 'mod', attract: { BR: 1.15 }, years: 8, from: 1 }] },
          { p: 0.45, title: '底下还有底', text: '巴西陷入两年深度衰退，收购的公司一直亏钱。', effects: [{ t: 'cash', v: -0.1, min: 2e6 }, { t: 'level', c: 'BR', v: 2 }] }
        ] }
    ],
    history: '2014 年下半年起国际油价暴跌，2016 年初跌破 30 美元。巴西随后陷入 2015–2016 年的深度衰退，雷亚尔大幅贬值。同一时期，一些外资企业撤出巴西，也有企业趁低价收购当地资产。',
    theory: { name: '逆周期投资', text: '在别人恐慌时买入，需要充足的现金和判断“底在哪里”的能力。买早了，可能要承受更长的亏损。' }
  },
  {
    id: 'U_CHINA_COST', years: [2010, 2013], title: '中国工资涨了', era: '2010 年代初 中国人工成本上升',
    cond: (s) => physical(s) && s.countries.CN.level >= 3 && s.hq !== 'CN',
    situation: '中国沿海的工资几年里翻了一番，工厂招工越来越难，年轻人不愿意进流水线。越南、印度的人工只有中国的一半。',
    options: [
      { id: 'move', text: '把劳动密集的工序搬去越南', hint: '跟着低成本走',
        outcomes: [{ p: 1, title: '越南工厂起步', text: '成本降了，但配套还不全，有些零件仍要从中国运过去。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'level', c: 'VN', v: 3 }] }] },
      { id: 'automate', text: '留在中国，上自动化设备', hint: '机器换人',
        outcomes: [{ p: 1, title: '工厂升级', text: '人少了一半，质量反而更稳定。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'quality', v: 4 }, { t: 'mod', gm: 0.015, years: 10, from: 1 }] }] },
      { id: 'sell', text: '把工厂变成面向中国市场的基地，就地卖给中国人', hint: '从出口转内销',
        outcomes: [{ p: 1, title: '转向中国市场', text: '中国中产快速壮大，内销增长很快。', effects: [{ t: 'mod', attract: { CN: 1.12 }, years: 8 }, { t: 'brand', c: 'CN', v: 6 }] }] },
      { id: 'inland', text: '把工厂搬到中国内陆城市', hint: '工资低一些，配套还在',
        outcomes: [{ p: 1, title: '内陆新厂', text: '工资低了三成，物流慢了一点。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'mod', gm: 0.01, years: 8, from: 1 }] }] }
    ],
    history: '2010 年前后，中国沿海制造业工资快速上涨，“招工难”成为普遍现象。耐克等品牌把鞋服生产大量转移到越南；富士康则一边在河南、四川建厂，一边推进“百万机器人”计划。',
    theory: { name: '刘易斯拐点', text: '经济学家刘易斯指出，当农村剩余劳动力被吸收完，工资会快速上涨，低成本优势随之消失。企业只能选择迁移、升级或转向内需。' }
  },

  // ---------------- 饮料 / 软件 / 电子补充 ----------------
  {
    id: 'B5_DAIRY', years: [2008, 2009], industry: 'beverage', title: '供应商出事了', era: '2008 食品安全危机',
    situation: '媒体曝光，有奶源供应商往原料里掺有害化学物质来提高检测指标，多家知名品牌的产品被查出问题，消费者恐慌。你的一款含奶饮料也用过其中一家的原料。',
    options: [
      { id: 'recall', text: '全部下架，公布检测结果，自建奶源基地', hint: '最贵，最彻底',
        outcomes: [{ p: 1, title: '成了“放心品牌”', text: '短期损失很大，但信任危机过后，你的份额反而上升了。', effects: [{ t: 'cash', v: -0.1, min: 2e6 }, { t: 'brand', v: 8 }, { t: 'quality', v: 4 }] }] },
      { id: 'test', text: '只下架问题批次，加强检测', hint: '控制损失',
        outcomes: [
          { p: 0.6, title: '风波过去了', text: '你的问题批次很少，没被重点报道。', effects: [{ t: 'cash', v: -0.03 }] },
          { p: 0.4, title: '又查出一批', text: '第二轮检测又有问题，你被列进了黑名单报道。', effects: [{ t: 'cash', v: -0.05, min: 1e6 }, { t: 'brand', v: -12 }] }
        ] },
      { id: 'import', text: '改用进口奶源，大打“海外原料”广告', hint: '借势营销',
        outcomes: [{ p: 1, title: '进口概念走红', text: '成本上去了，但很多家长愿意多付钱。', effects: [{ t: 'mod', gm: -0.01, attract: { CN: 1.1 }, years: 6 }, { t: 'brand', c: 'CN', v: 4 }] }] },
      { id: 'quiet', text: '低调处理，不主动声明', hint: '不引火上身',
        outcomes: [{ p: 1, title: '被当成同伙', text: '媒体追问你为什么沉默，口碑一落千丈。', effects: [{ t: 'brand', v: -15 }, { t: 'share', m: { CN: 0.8 } }] }] }
    ],
    history: '2008 年，中国三鹿等多家乳企的婴幼儿奶粉被检出三聚氰胺，造成大量婴儿患病。三鹿集团随后破产，事件让国产奶粉信任多年难以恢复，进口奶粉需求激增。',
    theory: { name: '供应链质量责任', text: '品牌对整条供应链的质量负责。“我们也是受害者”在消费者那里很少被接受，主动、彻底的处理才能止损。' }
  },
  {
    id: 'S5_ANTITRUST', years: [2020, 2022], industry: 'software', title: '反垄断来了', era: '2020 平台反垄断',
    cond: (s) => s.countries[s.hq].share >= 0.05 || s.lastRev >= 1e9,
    situation: '你的平台在国内市场份额很高。监管机构开始调查“二选一”、大数据杀熟、收购初创公司等行为，美国和欧洲也在讨论拆分科技巨头。',
    options: [
      { id: 'comply', text: '主动整改：取消独家条款，开放接口给对手', hint: '低头配合',
        outcomes: [{ p: 1, title: '平稳过关', text: '罚款不多，但增长放慢了。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', attract: { '{HQ}': 0.92 }, years: 4 }] }] },
      { id: 'fight', text: '请顶级律师抗辩到底', hint: '据理力争',
        outcomes: [
          { p: 0.4, title: '赢了官司', text: '监管撤回了大部分指控。', effects: [{ t: 'cash', v: -0.02 }] },
          { p: 0.6, title: '天价罚单', text: '罚款按全年收入的一定比例计算，股价大跌。', effects: [{ t: 'cash', v: -0.1, min: 2e6 }, { t: 'mod', attract: { '{HQ}': 0.88 }, years: 4 }, { t: 'brand', v: -5 }] }
        ] },
      { id: 'spin', text: '主动把业务拆成几家独立公司', hint: '自断一臂',
        outcomes: [{ p: 1, title: '拆分后更灵活', text: '各个业务独立发展，有的反而跑得更快。', effects: [{ t: 'raise', v: 0.05 }, { t: 'mod', attract: { '{HQ}': 0.95, '*': 1.04 }, years: 6 }] }] },
      { id: 'abroad', text: '把增长重心转向海外市场', hint: '东方不亮西方亮',
        outcomes: [{ p: 1, title: '出海求增长', text: '国内放慢，海外开始贡献收入。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', attract: { '*': 1.08, '{HQ}': 0.95 }, years: 6 }] }] }
    ],
    ctx: (s) => ({ HQ: s.hq }),
    history: '2021 年，中国市场监管总局因“二选一”行为对阿里巴巴罚款 182.28 亿元。同期，美国联邦贸易委员会起诉 Meta，欧盟通过《数字市场法》约束“守门人”平台。',
    theory: { name: '平台垄断与监管', text: '网络效应让平台容易赢家通吃，也让它们成为反垄断的重点对象。规模越大，越要把监管风险当作战略变量。' }
  },
  {
    id: 'E5_CHIPBAN', years: [2019, 2020], industry: 'electronics', title: '断供', era: '2019 技术出口管制',
    cond: (s) => s.hq === 'CN' || s.countries.CN.level >= 2,
    situation: '美国把一批中国科技企业列入出口管制“实体清单”，美国的芯片、操作系统和设计软件都不能再卖给它们。你的产品也用了不少美国技术，供应链随时可能被切断。',
    options: [
      { id: 'self', text: '投入巨资自研芯片和系统，建“备胎”', hint: '最贵，最自主',
        outcomes: [
          { p: 0.6, title: '备胎转正', text: '几年后你用上了自己的芯片和系统。', effects: [{ t: 'cash', v: -0.15, min: 4e6 }, { t: 'quality', v: 6 }, { t: 'mod', attract: { CN: 1.12 }, years: 10, from: 2 }] },
          { p: 0.4, title: '追赶艰难', text: '性能差距一时难以弥补，海外销量下滑。', effects: [{ t: 'cash', v: -0.15, min: 4e6 }, { t: 'mod', attract: { '*': 0.9, CN: 1.05 }, years: 5 }] }
        ] },
      { id: 'stock', text: '提前囤积两年用量的芯片', hint: '争取时间',
        outcomes: [{ p: 1, title: '库存撑了两年', text: '占用了大量现金，但没有断货。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }] }] },
      { id: 'split', text: '分成两套供应链：海外用一套、国内用一套', hint: '一个公司两套系统',
        outcomes: [{ p: 1, title: '两条腿走路', text: '成本高了，但两边市场都保住了。', effects: [{ t: 'mod', gm: -0.015, years: 6 }] }] },
      { id: 'wait', text: '相信很快会谈妥，先不动', hint: '不花钱',
        outcomes: [{ p: 1, title: '真的断了', text: '关键芯片断供，旗舰产品停产了大半年。', effects: [{ t: 'share', m: { '*': 0.8 } }, { t: 'quality', v: -5 }] }] }
    ],
    history: '2019 年 5 月，美国商务部把华为列入实体清单，随后限制其获得先进芯片和谷歌移动服务。华为启用了自研的海思芯片和鸿蒙系统，海外手机业务大幅萎缩，国内市场则在几年后逐步回升。',
    theory: { name: '技术依赖与供应链安全', text: '全球分工让每家公司都依赖别人的关键技术。当技术变成地缘政治工具，“够用的自主”可能比“最好的外购”更重要。' }
  },

  // ---------------- 医药 ----------------
  {
    id: 'PH1_ACCESS', years: [2001, 2004], industry: 'pharma', title: '穷国买不起救命药', era: '2001 艾滋病药物之争',
    situation: '你的一款抗艾滋病毒药物每人每年要一万多美元，非洲、巴西、印度的病人根本买不起。印度药厂说能用不到一千美元仿制出来，巴西政府威胁要“强制许可”——不经你同意就让本国药厂生产。',
    options: [
      { id: 'tier', text: '分级定价：穷国按成本价卖，富国价格不变', hint: '两头兼顾',
        outcomes: [{ p: 1, title: '口碑大涨', text: '发展中国家的病人用上了药，你在新兴市场的形象和渠道都打开了。', effects: [{ t: 'brand', v: 8 }, { t: 'mod', attract: { IN: 1.15, BR: 1.15, VN: 1.1 }, years: 10 }, { t: 'mod', gm: -0.008, years: 4 }] }] },
      { id: 'sue', text: '起诉仿制药厂和相关政府，捍卫专利', hint: '保护研发回报',
        outcomes: [{ p: 1, title: '赢了法理，输了人心', text: '舆论一边倒地批评你，最后你还是撤诉了。', effects: [{ t: 'cash', v: -0.02 }, { t: 'brand', v: -10 }, { t: 'mod', attract: { BR: 0.85, IN: 0.85 }, years: 5 }] }] },
      { id: 'license', text: '自愿授权印度药厂仿制，收少量专利费', hint: '借别人的产能',
        outcomes: [{ p: 1, title: '双赢', text: '仿制药大量供应穷国，你每年收一点授权费。', effects: [{ t: 'cash', v: 0.01 }, { t: 'brand', v: 5 }, { t: 'level', c: 'IN', v: 1 }] }] },
      { id: 'donate', text: '向非洲捐赠药品，宣传企业责任', hint: '慈善',
        outcomes: [{ p: 1, title: '杯水车薪', text: '捐赠受到欢迎，但没有解决价格问题。', effects: [{ t: 'cash', v: -0.02 }, { t: 'brand', v: 3 }] }] }
    ],
    history: '2001 年，39 家跨国药企起诉南非政府允许进口仿制药，在国际舆论压力下撤诉。同年印度仿制药厂西普拉宣布以每人每年不到 400 美元提供艾滋病鸡尾酒疗法。2007 年巴西对一种抗艾滋病药物实施强制许可。',
    theory: { name: '专利与可及性', text: '专利让药企能收回巨额研发成本，但也让救命药变得昂贵。分级定价、自愿授权等做法，试图在激励创新和保障可及之间找平衡。' }
  },
  {
    id: 'PH2_CLIFF', years: [2010, 2013], industry: 'pharma', title: '专利悬崖', era: '2011 重磅药专利到期',
    situation: '你最赚钱的一款降血脂药明年专利到期，它贡献了四成利润。仿制药一上市，价格会在一年内跌掉八成。研发管线里的新药还要好几年才能上市。',
    options: [
      { id: 'merge', text: '花大价钱收购一家有新药管线的公司', hint: '买未来',
        outcomes: [
          { p: 0.6, title: '续上了', text: '收购来的新药填补了大半缺口。', effects: [{ t: 'cash', v: -0.25, min: 5e6 }, { t: 'quality', v: 6 }, { t: 'mod', attract: { '*': 1.08 }, years: 8, from: 1 }] },
          { p: 0.4, title: '新药临床失败', text: '最被看好的药在三期临床里失败了。', effects: [{ t: 'cash', v: -0.25, min: 5e6 }, { t: 'quality', v: 1 }] }
        ] },
      { id: 'generic', text: '自己推出“授权仿制药”，和仿制药厂抢份额', hint: '自己革自己的命',
        outcomes: [{ p: 1, title: '保住了一部分', text: '价格降了，但份额大多留在了自己手里。', effects: [{ t: 'mod', gm: -0.03, years: 3 }, { t: 'mod', attract: { '*': 1.05 }, years: 3 }] }] },
      { id: 'evergreen', text: '改个剂型申请新专利，再起诉仿制药厂拖延上市', hint: '常青策略',
        outcomes: [
          { p: 0.5, title: '多撑了两年', text: '法院判你的新专利有效。', effects: [{ t: 'cash', v: -0.01 }, { t: 'mod', gm: 0.02, years: 2 }] },
          { p: 0.5, title: '被判滥用专利', text: '监管罚款，媒体批评你“专利流氓”。', effects: [{ t: 'cash', v: -0.04, min: 1e6 }, { t: 'brand', v: -8 }] }
        ] },
      { id: 'cut', text: '大幅削减成本，裁掉一部分研发', hint: '先保利润',
        outcomes: [{ p: 1, title: '利润好看了，后劲没了', text: '短期利润稳住，几年后管线空空。', effects: [{ t: 'mod', gm: 0.02, years: 3 }, { t: 'quality', v: -8 }] }] }
    ],
    history: '辉瑞的降脂药立普妥年销售额曾超过 120 亿美元，2011 年 11 月美国专利到期后销量迅速下滑。辉瑞此前已经斥巨资收购惠氏，并推出授权仿制药来减缓冲击。“专利悬崖”是大药企的周期性难题。',
    theory: { name: '产品生命周期', text: '每个产品都会经历导入、成长、成熟和衰退。专利药的衰退来得又快又确定，药企必须提前用研发和并购接续增长曲线。' }
  },
  {
    id: 'PH3_PRICE', years: [2015, 2017], industry: 'pharma', title: '老药涨价', era: '2015 药价争议',
    situation: '你手上有一款几十年前的老药，专利早就过期，但市场上只有你一家在生产。财务部算过：价格涨十倍，病人和医院也只能接受，利润能翻好几倍。',
    options: [
      { id: 'hike', text: '涨价十倍', hint: '利润最大化',
        outcomes: [
          { p: 0.3, title: '没人注意', text: '利润翻了几倍。', effects: [{ t: 'cash', v: 0.04 }, { t: 'mod', gm: 0.04, years: 3 }] },
          { p: 0.7, title: '全国公敌', text: '国会听证、媒体围攻，CEO 被叫成“最可恨的人”，监管还鼓励对手进来仿制。', effects: [{ t: 'brand', v: -18 }, { t: 'mod', attract: { US: 0.8, '*': 0.92 }, years: 4 }] }
        ] },
      { id: 'small', text: '只按通胀小幅调价', hint: '细水长流',
        outcomes: [{ p: 1, title: '平平稳稳', text: '没人在意，利润稳定。', effects: [{ t: 'mod', gm: 0.005, years: 4 }] }] },
      { id: 'cheap', text: '公开承诺这款药永不大幅涨价', hint: '赢得医生信任',
        outcomes: [{ p: 1, title: '医生更信任你', text: '你的新药也更容易进医院。', effects: [{ t: 'brand', v: 6 }] }] },
      { id: 'sell', text: '把这款药卖给一家投资基金', hint: '让别人去涨价',
        outcomes: [{ p: 1, title: '套现离场', text: '卖了个好价钱，后来买家涨价被骂，但和你无关了。', effects: [{ t: 'cash', v: 0.05 }, { t: 'mod', attract: { '*': 0.97 }, years: 3 }] }] }
    ],
    history: '2015 年，图灵制药收购一种有 60 多年历史的抗寄生虫药后，把价格从每片 13.5 美元提高到 750 美元，引发全美愤怒。其 CEO 后来因证券欺诈入狱，药价问题成为美国大选话题。',
    theory: { name: '定价权与社会许可', text: '企业有定价自由，但在医药这类关乎生命的行业，过度利用垄断地位会失去“社会许可”，引来监管和舆论的双重反噬。' }
  },
  {
    id: 'PH4_VACCINE', years: [2020, 2020], industry: 'pharma', title: '疫苗竞赛', era: '2020 新冠疫苗',
    situation: '新冠疫情席卷全球，各国政府愿意花大价钱提前订购疫苗。你的研究团队有一种新技术平台，从没用于上市产品，但理论上几个月就能做出疫苗。',
    options: [
      { id: 'allin', text: '全力投入，自己做临床、自己建产能', hint: '赌上全部',
        outcomes: [
          { p: 0.45, title: '一战成名', text: '疫苗成功上市，订单来自全世界。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'cash', v: 0.35 }, { t: 'brand', v: 15 }, { t: 'quality', v: 10 }] },
          { p: 0.55, title: '晚了一步', text: '疫苗有效，但比对手晚半年，订单寥寥。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'quality', v: 5 }] }
        ] },
      { id: 'partner', text: '和一家大药企合作：你出技术，他们出临床和产能', hint: '分享收益',
        outcomes: [{ p: 1, title: '合作成功', text: '疫苗以创纪录的速度上市，利润一人一半。', effects: [{ t: 'cash', v: 0.15 }, { t: 'brand', v: 8 }, { t: 'quality', v: 6 }] }] },
      { id: 'cdmo', text: '不做疫苗，把工厂改成给别人代工', hint: '稳赚代工费',
        outcomes: [{ p: 1, title: '代工赚钱', text: '订单排到了明年。', effects: [{ t: 'cash', v: 0.06 }] }] },
      { id: 'skip', text: '专注原有业务', hint: '不冒险',
        outcomes: [{ p: 1, title: '错过了时代', text: '原有业务受疫情影响，表现平平。', effects: [] }] }
    ],
    history: '2020 年，德国小公司 BioNTech 与辉瑞合作，用 mRNA 技术在不到一年内完成新冠疫苗研发并获批，Moderna 则独立完成。mRNA 疫苗后来获得 2023 年诺贝尔生理学或医学奖。',
    theory: { name: '平台技术', text: '一项能反复应用的“平台技术”在危机中可能突然证明价值。小公司常常需要大公司的临床、生产和渠道，才能把技术变成产品。' }
  },

  // ---------------- 新能源 ----------------
  {
    id: 'EN1_FIT', years: [2000, 2004], industry: 'energy', title: '德国给太阳能发补贴', era: '2000 德国可再生能源法',
    situation: '德国通过法律，承诺 20 年里以高于市价好几倍的价格收购屋顶光伏发的电。德国市场一夜之间成了全球最大的光伏市场，可这项补贴能维持多久没人知道。',
    options: [
      { id: 'germany', text: '在德国建厂、设分公司，全力抢这块市场', hint: '跟着补贴走',
        outcomes: [{ p: 1, title: '赶上了第一波', text: '德国订单源源不断，你的规模快速扩大。', effects: [{ t: 'cash', v: -0.08, min: 2e6 }, { t: 'level', c: 'DE', v: 2 }, { t: 'mod', attract: { DE: 1.3 }, years: 8 }] }] },
      { id: 'export', text: '在低成本国家生产，出口到德国', hint: '成本取胜',
        outcomes: [{ p: 1, title: '价格最有竞争力', text: '你的组件比德国本土便宜三成。', effects: [{ t: 'level', c: 'DE', v: 1 }, { t: 'mod', attract: { DE: 1.15 }, years: 8 }] }] },
      { id: 'tech', text: '不追补贴，专心把转换效率做上去', hint: '练内功',
        outcomes: [{ p: 1, title: '技术领先', text: '补贴退坡时，你的产品依然有竞争力。', effects: [{ t: 'quality', v: 8 }] }] }
    ],
    history: '德国 2000 年通过《可再生能源法》，以固定上网电价收购可再生能源电力，催生了全球最大的光伏市场。2000 年代中期，德国 Q-Cells 一度是全球最大的电池片厂商，后来在价格战中破产。',
    theory: { name: '政策驱动市场', text: '补贴能创造需求，但也会吸引大量产能涌入。依赖补贴的企业要准备好补贴退坡的那一天，真正的护城河是成本和技术。' }
  },
  {
    id: 'EN2_GLUT', years: [2011, 2013], industry: 'energy', title: '价格雪崩', era: '2012 光伏产能过剩',
    situation: '全球光伏产能远超需求，组件价格两年跌了六成，美国一家明星光伏公司拿了政府贷款后破产。美国和欧盟开始对中国光伏产品征收反倾销税。',
    options: [
      { id: 'cost', text: '降价扩产，把对手熬死', hint: '拼成本',
        outcomes: [
          { p: 0.55, title: '活到了最后', text: '一大批对手破产，你的份额翻了一番。', effects: [{ t: 'cash', v: -0.08, min: 2e6 }, { t: 'mod', gm: -0.03, years: 2 }, { t: 'mod', attract: { '*': 1.15 }, years: 8, from: 2 }] },
          { p: 0.45, title: '一起失血', text: '价格战比预想的长，你也伤了元气。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'mod', gm: -0.03, years: 3 }] }
        ] },
      { id: 'downstream', text: '往下游走：自己建电站、卖电', hint: '换个赚钱方式',
        outcomes: [{ p: 1, title: '有了稳定现金流', text: '电站每年稳定卖电，熨平了组件价格的波动。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'mod', gm: 0.015, years: 15, from: 1 }] }] },
      { id: 'local', text: '在美国、越南设厂绕开反倾销税', hint: '产地多元化',
        outcomes: [{ p: 1, title: '绕开了关税', text: '海外工厂成本高一点，但能卖进欧美市场。', effects: [{ t: 'cash', v: -0.08, min: 2e6 }, { t: 'level', c: 'VN', v: 3 }] }] },
      { id: 'shrink', text: '收缩产能，等行业洗牌结束', hint: '保存实力',
        outcomes: [{ p: 1, title: '保住了现金', text: '份额丢了一些，但没有失血。', effects: [{ t: 'share', m: { '*': 0.85 } }] }] }
    ],
    history: '2011 年，获得美国政府 5.35 亿美元贷款担保的 Solyndra 破产。2012 年美国、2013 年欧盟对中国光伏产品采取反倾销措施。此后光伏行业经历大洗牌，幸存的中国企业凭借成本优势占据全球大部分产能。',
    theory: { name: '产能周期', text: '新兴行业常常在高增长预期下过度投资，随后价格崩盘、大批企业出局。能熬过寒冬的，往往是成本最低、现金最多的那几家。' }
  },
  {
    id: 'EN3_STORAGE', years: [2015, 2018], industry: 'energy', title: '储能是不是下一个风口', era: '2015 储能起步',
    situation: '电动车带动锂电池成本快速下降，一家电动车公司推出了家用储能电池。你的工程师认为，光伏加储能能让家庭和工厂几乎脱离电网，可现在价格还很贵。',
    options: [
      { id: 'build', text: '建电池工厂，进入储能市场', hint: '大投入押未来',
        outcomes: [
          { p: 0.65, title: '第二条增长曲线', text: '几年后储能需求爆发，你的电池业务成了主力。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'quality', v: 5 }, { t: 'mod', attract: { '*': 1.12 }, years: 10, from: 2 }] },
          { p: 0.35, title: '起早了', text: '前几年一直亏损，后来才慢慢回本。', effects: [{ t: 'cash', v: -0.14, min: 3e6 }, { t: 'mod', attract: { '*': 1.05 }, years: 8, from: 4 }] }
        ] },
      { id: 'buy', text: '采购别人的电池，做系统集成', hint: '轻资产',
        outcomes: [{ p: 1, title: '赚集成的钱', text: '利润不高，但不用压重资产。', effects: [{ t: 'cash', v: -0.02 }, { t: 'mod', attract: { '*': 1.05 }, years: 8, from: 1 }] }] },
      { id: 'wait', text: '再等等，等电池更便宜', hint: '观望',
        outcomes: [{ p: 1, title: '风口来了，你不在', text: '储能市场几年后爆发，你只能高价追赶。', effects: [{ t: 'mod', attract: { '*': 0.94 }, years: 6, from: 3 }] }] }
    ],
    history: '特斯拉 2015 年发布家用储能电池 Powerwall。此后十年锂电池成本下降约八成，宁德时代等电池企业从电动车扩展到储能，大型电网储能项目在美国、中国、澳大利亚快速增长。',
    theory: { name: '学习曲线', text: '产量每翻一番，单位成本下降一个固定比例。光伏和锂电池都遵循陡峭的学习曲线，早期进入者靠规模和经验积累成本优势。' }
  },
  {
    id: 'EN4_IRA', years: [2022, 2023], industry: 'energy', title: '美国给本土制造发补贴', era: '2022 美国通胀削减法案',
    cond: (s) => s.hq !== 'US',
    situation: '美国通过新法案，十年内为清洁能源提供数千亿美元补贴，但条件是：要在美国本土或自贸伙伴国生产，还限制使用“受关注国家”的零部件。',
    options: [
      { id: 'us', text: '在美国建厂，拿补贴', hint: '重投入，拿补贴',
        outcomes: [{ p: 1, title: '美国工厂开工', text: '成本比亚洲高，但补贴覆盖了大部分差距。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'level', c: 'US', v: 3 }, { t: 'mod', attract: { US: 1.25 }, years: 10 }] }] },
      { id: 'mx', text: '在墨西哥建厂，借自贸协定进入美国', hint: '近岸',
        outcomes: [{ p: 1, title: '墨西哥基地', text: '成本适中，部分产品也能享受补贴。', effects: [{ t: 'cash', v: -0.07, min: 2e6 }, { t: 'level', c: 'MX', v: 3 }, { t: 'mod', attract: { US: 1.1 }, years: 10 }] }] },
      { id: 'license', text: '把技术授权给美国企业，收授权费', hint: '轻资产进入',
        outcomes: [{ p: 1, title: '技术出海', text: '不用建厂，每年收一笔授权费。', effects: [{ t: 'cash', v: 0.02 }, { t: 'mod', gm: 0.01, years: 8 }] }] },
      { id: 'skip', text: '放弃美国，专注欧洲和新兴市场', hint: '不赌政策',
        outcomes: [{ p: 1, title: '避开美国', text: '欧洲和新兴市场需求依然旺盛。', effects: [{ t: 'mod', attract: { US: 0.8, DE: 1.06, IN: 1.06, BR: 1.06 }, years: 8 }] }] }
    ],
    history: '2022 年 8 月，美国通过《通胀削减法案》，为清洁能源和电动车提供大规模税收抵免，并设置本土制造和供应链来源要求。此后多家日韩和欧洲电池、光伏企业宣布在美国建厂，欧盟也推出了自己的产业补贴计划。',
    theory: { name: '产业政策', text: '当各国用补贴争夺战略产业，企业的选址不再只看成本，还要看补贴、关税和地缘风险的组合。' }
  }
];

module.exports = { CASES3 };
