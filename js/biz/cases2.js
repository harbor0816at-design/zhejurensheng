// 扩展案例：汽车、服装零售两个新行业，以及更多通用的宏观十字路口。
// 写法同 cases.js：全部原创撰写，依据公开历史事实。
const physical = (s) => s.industry !== 'software';

const CASES2 = [
  // ---------------- 通用（扩展） ----------------
  {
    id: 'U_DOTCOM', years: [1999, 2000], title: '要不要做个“.com”？', era: '1999 互联网热潮',
    cond: physical,
    situation: '报纸上天天都是互联网公司上市暴富的新闻。投行建议你把网上商店单独拆出来，起个时髦的名字去融资，估值可能比你的老本行还高。',
    options: [
      { id: 'spin', text: '拆出网上业务，高调融资、猛砸广告', hint: '花大钱抢先',
        outcomes: [
          { p: 0.35, title: '赶在泡沫破之前上了岸', text: '融到的钱比花掉的多，网上渠道也搭起来了。', effects: [{ t: 'raise', v: 0.08 }, { t: 'brand', v: 4 }] },
          { p: 0.65, title: '泡沫破了', text: '广告费打了水漂，新公司半年后关门，只留下一套网站。', effects: [{ t: 'cash', v: -0.12, min: 2e6 }, { t: 'mod', attract: { '*': 1.04 }, years: 6, from: 3 }] }
        ] },
      { id: 'slow', text: '在自家官网上慢慢做线上销售', hint: '小投入',
        outcomes: [{ p: 1, title: '线上悄悄长大', text: '没人报道你，但几年后线上成了重要渠道。', effects: [{ t: 'cash', v: -0.02 }, { t: 'mod', attract: { '*': 1.05 }, years: 10, from: 2 }] }] },
      { id: 'skip', text: '看不懂，不碰', hint: '不花钱',
        outcomes: [{ p: 1, title: '躲过了泡沫', text: '也错过了早期的线上布局。', effects: [{ t: 'mod', attract: { '*': 0.97 }, years: 6, from: 4 }] }] }
    ],
    history: '1999 年前后，大量公司只要名字里带“.com”就能融到钱。宠物用品网站 Pets.com 花巨资做超级碗广告，2000 年 2 月上市，同年 11 月就关门清算；生鲜电商 Webvan 2001 年破产。同期默默做线上的传统零售商，十年后反而受益。',
    theory: { name: '技术炒作周期', text: '新技术常常经历“过高期望—幻灭—稳步爬升”的过程。技术本身可能是对的，但在热潮顶点重金押注，往往付出最贵的学费。' }
  },
  {
    id: 'U_OFFSHORE', years: [2004, 2007], title: '把后台搬到印度？', era: '2000 年代 服务外包浪潮',
    cond: (s) => s.hq !== 'IN' && s.hq !== 'VN',
    situation: '同行纷纷把财务、客服、软件开发搬到印度班加罗尔，那里的工程师英语好、工资只有本国的几分之一。你的总部员工听到风声，已经开始担心。',
    options: [
      { id: 'own', text: '在印度建自己的服务中心', hint: '一次性投入，长期省钱',
        outcomes: [
          { p: 0.75, title: '后台成本大降', text: '印度团队很快上手，还开始承担研发任务。', effects: [{ t: 'cash', v: -0.05, min: 1.5e6 }, { t: 'level', c: 'IN', v: 2 }, { t: 'mod', gm: 0.02, years: 12, from: 1 }] },
          { p: 0.25, title: '磨合期很长', text: '时差、流失率和沟通问题让前两年得不偿失。', effects: [{ t: 'cash', v: -0.07, min: 2e6 }, { t: 'level', c: 'IN', v: 2 }, { t: 'mod', gm: 0.015, years: 10, from: 3 }] }
        ] },
      { id: 'vendor', text: '外包给印度服务商', hint: '不用自己管，省得少一点',
        outcomes: [{ p: 1, title: '省了一笔钱', text: '服务商效率不错，只是核心能力还在外面。', effects: [{ t: 'mod', gm: 0.012, years: 8 }] }] },
      { id: 'stay', text: '留在本国，强调本地服务', hint: '员工满意，成本照旧',
        outcomes: [{ p: 1, title: '口碑不错', text: '客户喜欢本地客服，但成本比对手高。', effects: [{ t: 'brand', c: '{HQ}', v: 3 }] }] }
    ],
    ctx: (s) => ({ HQ: s.hq }),
    history: '通用电气 1990 年代末在印度设立后台服务中心，2005 年把它分拆为独立公司 Genpact。同一时期，印孚瑟斯、塔塔咨询等印度公司承接了大量欧美企业的软件和后台业务，班加罗尔被称为“印度硅谷”。',
    theory: { name: '价值链切片', text: '把一项业务拆成许多环节，每个环节放到最合适的地方去做，是全球化的核心逻辑。外包省成本，自建保留能力，取舍在于这个环节是不是你的核心竞争力。' }
  },
  {
    id: 'U_EURO_DEBT', years: [2010, 2012], title: '欧洲打折', era: '2010 欧债危机',
    cond: (s) => s.hq !== 'DE' && s.hq !== 'UK',
    situation: '希腊、意大利、西班牙接连告急，欧元风雨飘摇，欧洲公司股价跌到多年低点。一家有百年历史的德国同行因为母公司缺钱，愿意把品牌和工程团队一起卖给你。',
    options: [
      { id: 'buy', text: '买下这个百年品牌', hint: '大额支出，换来品牌和技术',
        outcomes: [
          { p: 0.65, title: '品牌焕发新生', text: '你保留了对方的管理团队，又给了它亚洲市场。', effects: [{ t: 'cash', v: -0.25, min: 5e6 }, { t: 'level', c: 'DE', v: 2 }, { t: 'brand', c: 'DE', v: 15 }, { t: 'quality', v: 6 }, { t: 'mod', attract: { DE: 1.15, UK: 1.08 }, years: 10 }] },
          { p: 0.35, title: '文化冲突', text: '双方团队互不服气，花了好几年才磨合好。', effects: [{ t: 'cash', v: -0.3, min: 6e6 }, { t: 'level', c: 'DE', v: 2 }, { t: 'brand', c: 'DE', v: 6 }, { t: 'quality', v: 3 }] }
        ] },
      { id: 'talent', text: '只挖对方的核心工程师', hint: '花小钱拿技术',
        outcomes: [{ p: 1, title: '技术进步', text: '几位老工程师带来了扎实的工艺。', effects: [{ t: 'cash', v: -0.03 }, { t: 'quality', v: 4 }] }] },
      { id: 'pass', text: '欧洲太乱，不碰', hint: '保住现金',
        outcomes: [{ p: 1, title: '按兵不动', text: '欧洲市场后来慢慢复苏了。', effects: [] }] }
    ],
    history: '2010 年，中国吉利汽车以约 18 亿美元从福特手中收购沃尔沃轿车，保留了瑞典总部和管理团队，沃尔沃此后销量和利润都创了新高。欧债危机期间，不少亚洲企业以较低价格收购了欧洲的品牌和技术。',
    theory: { name: '跨国并购整合', text: '收购的价值在买下之后才真正决定。买方如果尊重被收购方的品牌和团队，同时补上对方缺的市场和资金，就可能“一加一大于二”；反之，整合失败是并购最常见的结局。' }
  },
  {
    id: 'U_BREXIT', years: [2016, 2018], title: '英国要走了', era: '2016 英国脱欧公投',
    cond: (s) => s.countries.UK.level >= 2 && s.hq !== 'UK',
    situation: '英国公投决定离开欧盟。你的欧洲总部和仓库都在伦敦，今后货物进出欧洲大陆可能要过海关、交关税，员工签证也成了问题。',
    options: [
      { id: 'move', text: '把欧洲总部搬到德国', hint: '搬家要花钱，但确定性高',
        outcomes: [{ p: 1, title: '提前搬家', text: '欧洲大陆业务没受影响，英国本地生意少了一点。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'level', c: 'DE', v: 2 }, { t: 'mod', attract: { DE: 1.08, UK: 0.95 }, years: 6 }] }] },
      { id: 'wait', text: '等谈判结果，先不动', hint: '不花钱，但不确定',
        outcomes: [
          { p: 0.5, title: '最终协议还算温和', text: '等待没有吃大亏。', effects: [{ t: 'mod', attract: { UK: 0.95 }, years: 3, from: 3 }] },
          { p: 0.5, title: '过渡期一片混乱', text: '海关排长队、物流停摆，你只好匆忙搬家。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'mod', attract: { UK: 0.85, DE: 0.95 }, years: 3, from: 3 }] }
        ] },
      { id: 'double', text: '加码英国，抢走撤离对手的客户', hint: '逆向操作',
        outcomes: [{ p: 1, title: '英国份额提升', text: '对手撤了，你接下了他们的客户。', effects: [{ t: 'cash', v: -0.03 }, { t: 'brand', c: 'UK', v: 8 }, { t: 'mod', attract: { UK: 1.12, DE: 0.95 }, years: 6 }] }] }
    ],
    history: '2016 年 6 月英国公投脱欧，2020 年 1 月正式离开欧盟。此前，松下 2018 年把欧洲总部从伦敦搬到阿姆斯特丹，索尼也把欧洲总部注册地迁往荷兰；也有一些公司选择加码英国本地市场。',
    theory: { name: '政治风险管理', text: '面对结果未定的政治事件，可以“等待信息”，也可以“提前对冲”。等待保留了选择权，但如果事件来得又急又坏，最后被迫仓促应对的成本最高。' }
  },
  {
    id: 'U_CARBON', years: [2020, 2022], title: '碳中和承诺', era: '2020 气候与 ESG 浪潮',
    situation: '大客户和投资人纷纷要求供应商公布减排路线图，欧盟也在讨论对高碳进口商品征收“碳关税”。改造工厂、买绿电要花不少钱。',
    options: [
      { id: 'all', text: '公开承诺 2030 年碳中和，全面改造', hint: '花钱多，品牌加分',
        outcomes: [{ p: 1, title: '成了“绿色供应商”', text: '欧洲客户优先选择你，投资人也更愿意给高估值。', effects: [{ t: 'cash', v: -0.08, min: 2e6 }, { t: 'brand', v: 6 }, { t: 'mod', attract: { DE: 1.12, UK: 1.1, '*': 1.03 }, years: 8 }] }] },
      { id: 'some', text: '先从总部和新工厂做起', hint: '中庸',
        outcomes: [{ p: 1, title: '稳步推进', text: '没有大张旗鼓，也没掉队。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', attract: { DE: 1.04, UK: 1.04 }, years: 6 }] }] },
      { id: 'pr', text: '发个漂亮的宣传片就好', hint: '几乎不花钱',
        outcomes: [
          { p: 0.5, title: '没人深究', text: '宣传片效果不错。', effects: [{ t: 'brand', v: 2 }] },
          { p: 0.5, title: '被指“漂绿”', text: '环保组织拿出数据批评你言行不一，欧洲客户开始疏远。', effects: [{ t: 'brand', v: -6 }, { t: 'mod', attract: { DE: 0.9, UK: 0.9 }, years: 4 }] }
        ] }
    ],
    history: '微软 2020 年 1 月承诺到 2030 年实现“碳负排放”，苹果承诺 2030 年整个供应链碳中和。欧盟 2021 年提出碳边境调节机制（俗称碳关税）。与此同时，一些公司因为宣传和实际不符，被批评为“漂绿”。',
    theory: { name: '创造共享价值', text: '迈克尔·波特等人提出，企业可以在解决社会问题的同时创造商业价值。当客户、监管和资本都开始为“低碳”定价，环保就从成本变成了竞争力。' }
  },
  {
    id: 'U_AI', years: [2023, 2024], title: '大模型来了', era: '2023 生成式 AI',
    situation: '聊天机器人一夜爆红，竞争对手宣布用 AI 处理大部分客服和文案工作。员工有的兴奋，有的担心被替代。',
    options: [
      { id: 'all', text: '全公司推行 AI 改造', hint: '投入大，见效快慢难说',
        outcomes: [
          { p: 0.6, title: '效率明显提升', text: '客服、设计、编程都快了不少。', effects: [{ t: 'cash', v: -0.05, min: 1.5e6 }, { t: 'mod', gm: 0.025, years: 6 }, { t: 'quality', v: 4 }] },
          { p: 0.4, title: '投入多、产出慢', text: '工具买了一堆，流程没跟上，效果一般。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'mod', gm: 0.008, years: 4, from: 1 }] }
        ] },
      { id: 'pilot', text: '挑两个部门先试点', hint: '小步快跑',
        outcomes: [{ p: 1, title: '试点成功', text: '找到了几个真正能省时间的用法。', effects: [{ t: 'cash', v: -0.01 }, { t: 'mod', gm: 0.012, years: 6 }] }] },
      { id: 'wait', text: '等技术成熟再说', hint: '不花钱',
        outcomes: [{ p: 1, title: '暂时没差别', text: '对手的成本悄悄降了下来。', effects: [{ t: 'mod', attract: { '*': 0.97 }, years: 4, from: 1 }] }] }
    ],
    history: '2022 年 11 月 ChatGPT 发布，两个月用户破亿。2024 年初，瑞典支付公司 Klarna 公布，它的 AI 助手一个月就处理了约三分之二的客服对话。也有调查显示，不少企业的 AI 项目停留在试点阶段。',
    theory: { name: '通用目的技术', text: '电力、互联网、AI 这类通用技术，生产率提升往往要等流程和组织一起改造后才显现，短期甚至可能下降，经济学家称之为“生产率 J 曲线”。' }
  },

  // ---------------- 汽车 ----------------
  {
    id: 'A1_LEAN', years: [1996, 1999], industry: 'auto', title: '学丰田，学到什么程度？', era: '1990 年代 精益生产',
    situation: '你的工厂库存堆成山，返工率居高不下。顾问说日本车厂靠“准时化生产”和“发现问题就停线”把成本和缺陷都压到了最低。可要学，就得改掉整个工厂的习惯。',
    options: [
      { id: 'full', text: '全面导入精益生产，任何工人都能拉绳停线', hint: '前两年会很痛苦',
        outcomes: [
          { p: 0.7, title: '脱胎换骨', text: '头两年产量下滑，之后质量和成本都甩开了对手。', effects: [{ t: 'cash', v: -0.05, min: 1.5e6 }, { t: 'mod', attract: { '*': 0.93 }, years: 2 }, { t: 'quality', v: 10 }, { t: 'mod', gm: 0.03, years: 15, from: 2 }] },
          { p: 0.3, title: '老员工不买账', text: '改革推行得磕磕绊绊，只拿到一半效果。', effects: [{ t: 'cash', v: -0.06, min: 1.5e6 }, { t: 'quality', v: 4 }, { t: 'mod', gm: 0.012, years: 10, from: 2 }] }
        ] },
      { id: 'tools', text: '只引进看板、5S 这些工具', hint: '表面功夫，见效快',
        outcomes: [{ p: 1, title: '车间整洁了', text: '工具有用，但管理习惯没变，效果有限。', effects: [{ t: 'cash', v: -0.01 }, { t: 'quality', v: 2 }, { t: 'mod', gm: 0.005, years: 5 }] }] },
      { id: 'scale', text: '不学，靠扩大产量摊薄成本', hint: '把钱花在规模上',
        outcomes: [{ p: 1, title: '规模上去了', text: '单车成本降了一点，可缺陷率还是老样子。', effects: [{ t: 'mod', attract: { '*': 1.04 }, years: 4 }, { t: 'quality', v: -3 }] }] }
    ],
    history: '1984 年，通用和丰田在加州弗里蒙特合资成立 NUMMI 工厂，用丰田方式管理通用原来最差的工厂之一，质量很快接近日本水平。可通用花了很多年也没能把这套方法推广到自己的其他工厂——工具好学，文化难学。',
    theory: { name: '精益生产', text: '丰田生产方式的核心是消除浪费和“把问题暴露出来”：准时化让库存无处藏身，自働化让任何人发现缺陷都能停线。它是一套管理体系和文化，不是几件工具。' }
  },
  {
    id: 'A2_EV', years: [2012, 2016], industry: 'auto', title: '电动车是不是玩具？', era: '2012 电动化浪潮',
    situation: '一家硅谷新公司推出了一款纯电动豪华轿车，订单排到了明年；中国也在大力补贴新能源车。你的工程师说电池还太贵，经销商说客户只认发动机。',
    options: [
      { id: 'allin', text: '另起炉灶，建独立的电动车平台和团队', hint: '巨额投入，押注未来',
        outcomes: [
          { p: 0.6, title: '赶上了浪潮', text: '几年后电动车成了你增长最快的业务。', effects: [{ t: 'cash', v: -0.15, min: 4e6 }, { t: 'quality', v: 8 }, { t: 'mod', attract: { CN: 1.25, '*': 1.1 }, years: 12, from: 2 }, { t: 'flag', name: 'ev' }] },
          { p: 0.4, title: '起早了', text: '电池成本降得比预期慢，前几年一直亏钱，好在技术攒下了。', effects: [{ t: 'cash', v: -0.18, min: 5e6 }, { t: 'quality', v: 5 }, { t: 'mod', attract: { CN: 1.15, '*': 1.05 }, years: 10, from: 4 }, { t: 'flag', name: 'ev' }] }
        ] },
      { id: 'hybrid', text: '先做混合动力，两条腿走路', hint: '稳妥的过渡',
        outcomes: [{ p: 1, title: '油耗口碑好', text: '混动车卖得不错，但纯电市场被新玩家占了先。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'mod', attract: { '*': 1.05, CN: 0.95 }, years: 10, from: 1 }] }] },
      { id: 'wait', text: '电动车是小众玩具，继续做好燃油车', hint: '眼下最赚钱',
        outcomes: [{ p: 1, title: '眼前赚钱，后来被动', text: '十年后，电动车在中国的份额迅速上升，你只能高价追赶。', effects: [{ t: 'mod', gm: 0.01, years: 4 }, { t: 'mod', attract: { CN: 0.65, '*': 0.88 }, years: 8, from: 5 }] }] }
    ],
    history: '特斯拉 2012 年推出 Model S。丰田 1997 年就推出普锐斯混合动力车，长期押注混动；中国从 2009 年起补贴新能源车，比亚迪等本土品牌迅速崛起。到 2020 年代，中国新能源车渗透率快速提升，许多传统车企在这个市场被动追赶。',
    theory: { name: '创新者的窘境', text: '克莱顿·克里斯坦森指出，颠覆性技术刚出现时性能差、利润低，主流客户看不上，所以成熟企业“理性地”忽视它。等它成熟时，领先者往往已经来不及。常见的应对是成立独立团队，让新业务不受老业务的考核约束。' }
  },
  {
    id: 'A3_EMISSION', years: [2014, 2016], industry: 'auto', title: '排放测试过不了', era: '2015 柴油车排放门',
    situation: '新一代柴油发动机在实验室里怎么调都达不到美国的排放标准，发布会就在三个月后。一位工程师私下提议：写一段软件，识别出正在做检测就切换到低排放模式。',
    options: [
      { id: 'cheat', text: '先用软件过关，以后再改', hint: '按时发布，风险自己清楚',
        outcomes: [
          { p: 0.25, title: '暂时没人发现', text: '车按时上市了，但这颗雷一直埋在那里。', effects: [{ t: 'mod', attract: { '*': 1.05 }, years: 3 }, { t: 'flag', name: 'cheat' }] },
          { p: 0.75, title: '东窗事发', text: '美国监管机构公开了你的作弊软件：天价罚款、全球召回、高管辞职，品牌一落千丈。', effects: [{ t: 'cash', v: -0.3, min: 6e6 }, { t: 'brand', v: -20 }, { t: 'mod', attract: { US: 0.6, DE: 0.8, '*': 0.88 }, years: 6 }] }
        ] },
      { id: 'delay', text: '推迟发布，加装尾气处理装置', hint: '成本高、晚上市',
        outcomes: [{ p: 1, title: '晚了，但干净', text: '每辆车贵了一些，几年后同行丑闻爆发，你反而赢得了信任。', effects: [{ t: 'cash', v: -0.04 }, { t: 'mod', gm: -0.01, years: 4 }, { t: 'brand', v: 5 }] }] },
      { id: 'switch', text: '放弃柴油，转向汽油混动', hint: '重新规划产品线',
        outcomes: [{ p: 1, title: '换了赛道', text: '短期吃亏，后来正好赶上低排放潮流。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'mod', attract: { '*': 1.04 }, years: 8, from: 2 }] }] }
    ],
    history: '2015 年 9 月，美国环保署公开指出大众汽车在柴油车上装了识别检测的软件。涉事车辆全球约 1100 万辆，大众此后付出的罚款、赔偿和召回成本超过 300 亿美元，首席执行官辞职，多名高管被起诉。',
    theory: { name: '合规与组织文化', text: '丑闻很少是一个人的决定，往往源于“目标必须完成”的压力和不敢说坏消息的文化。短期绕过规则的收益很小，一旦暴露，损失的是几十年攒下的信任。' }
  },
  {
    id: 'A4_RECALL', years: [2009, 2011], industry: 'auto', title: '油门卡住了', era: '2009 大规模召回',
    situation: '美国媒体报道了几起你的车“突然加速”的事故。工程部初步判断是脚垫和油门踏板的问题，但还在调查。全面召回要花一大笔钱，还会坐实“质量不行”的印象。',
    options: [
      { id: 'all', text: '立刻全球召回，CEO 公开道歉', hint: '代价大，止损快',
        outcomes: [{ p: 1, title: '痛但止住了', text: '召回花了很多钱，但坦诚的态度让口碑一两年就恢复了。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'brand', v: -4 }, { t: 'quality', v: 5 }] }] },
      { id: 'part', text: '只在出事的国家召回相关车型', hint: '控制成本',
        outcomes: [
          { p: 0.5, title: '事情过去了', text: '风波没有继续扩大。', effects: [{ t: 'cash', v: -0.04 }, { t: 'brand', c: 'US', v: -5 }] },
          { p: 0.5, title: '越拖越大', text: '其他国家陆续出事，被批评“区别对待”，最后还是全面召回。', effects: [{ t: 'cash', v: -0.15, min: 3e6 }, { t: 'brand', v: -10 }, { t: 'mod', attract: { US: 0.85 }, years: 3 }] }
        ] },
      { id: 'deny', text: '等调查结论，暂不表态', hint: '不认错',
        outcomes: [{ p: 1, title: '信任崩塌', text: '国会听证、媒体围攻，销量一度大跌。', effects: [{ t: 'cash', v: -0.16, min: 4e6 }, { t: 'brand', v: -15 }, { t: 'mod', attract: { US: 0.75, '*': 0.92 }, years: 3 }] }] }
    ],
    history: '2009 至 2010 年，丰田因脚垫卡住和油门踏板问题在全球召回约 900 万辆车，社长丰田章男 2010 年到美国国会作证并道歉。丰田事后反思扩张太快导致质量管理跟不上，放慢了建厂速度，几年后重回全球销量第一。',
    theory: { name: '危机沟通', text: '危机中，公众对“态度”的反应常常比对“事实”更强烈。研究表明，迅速承担责任、公开透明的公司，品牌恢复得更快；拖延和推诿会把产品问题变成信任问题。' }
  },
  {
    id: 'A5_CHIPS', years: [2021, 2022], industry: 'auto', title: '一块芯片卡住整条线', era: '2021 全球缺芯',
    situation: '疫情后消费电子抢走了芯片产能，一辆车需要上千颗芯片，缺一颗就装不完。工厂停了一半，经销商的展厅空空荡荡。',
    options: [
      { id: 'pay', text: '高价现货抢芯片，优先保高端车型', hint: '花钱保产量',
        outcomes: [{ p: 1, title: '保住了利润车型', text: '芯片贵得离谱，但高端车卖得更贵。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'mod', gm: 0.01, years: 2 }] }] },
      { id: 'contract', text: '和芯片厂签长期协议，建安全库存', hint: '改掉零库存习惯',
        outcomes: [{ p: 1, title: '下一次不怕了', text: '短期还是缺，但两年后你的供应最稳。', effects: [{ t: 'cash', v: -0.04 }, { t: 'mod', attract: { '*': 0.95 }, years: 1 }, { t: 'mod', attract: { '*': 1.05 }, years: 4, from: 1 }] }] },
      { id: 'wait', text: '等产能恢复', hint: '不花钱',
        outcomes: [{ p: 1, title: '停产一整年', text: '客户等不及，去买了别家的车。', effects: [{ t: 'share', m: { '*': 0.88 } }] }] }
    ],
    history: '2021 年全球汽车业因缺芯减产数百万辆。丰田在 2011 年日本大地震后吸取教训，要求供应商为关键芯片储备数月库存，在这次缺芯中受影响比同行小得多。',
    theory: { name: '供应链韧性', text: '准时化和零库存让效率最高，但也让供应链很脆弱。对少数关键、难替代的零件保留缓冲，是在效率和韧性之间的折中。' }
  },

  // ---------------- 服装零售 ----------------
  {
    id: 'P1_FAST', years: [1997, 2001], industry: 'apparel', title: '两周还是六个月？', era: '1990 年代末 快时尚兴起',
    situation: '你的衣服在亚洲大批量代工，从设计到上架要六个月，常常是畅销款断货、滞销款打折。一位西班牙同行把一半的生产放在门店附近的小工厂，两三周就能把新款送进门店。',
    options: [
      { id: 'fast', text: '学快时尚：近岸小批量，每周上新', hint: '单件成本高，打折少',
        outcomes: [
          { p: 0.7, title: '顾客越来越常来', text: '每周都有新款，打折大幅减少，利润反而更高。', effects: [{ t: 'cash', v: -0.06, min: 1.5e6 }, { t: 'mod', gm: 0.04, years: 15, from: 1 }, { t: 'mod', attract: { '*': 1.08 }, years: 10, from: 1 }, { t: 'flag', name: 'fast' }] },
          { p: 0.3, title: '供应链跟不上', text: '小工厂产能有限，转型比预期慢。', effects: [{ t: 'cash', v: -0.07, min: 2e6 }, { t: 'mod', gm: 0.015, years: 10, from: 2 }] }
        ] },
      { id: 'cheap', text: '继续大批量远洋代工，把价格做到最低', hint: '规模经济',
        outcomes: [{ p: 1, title: '价格最低', text: '基本款卖得不错，但潮流款常常压货。', effects: [{ t: 'mod', attract: { '*': 1.05 }, years: 6 }, { t: 'mod', gm: -0.01, years: 6 }] }] },
      { id: 'brand', text: '做设计师品牌，一年两季、走高端', hint: '慢而贵',
        outcomes: [{ p: 1, title: '小众但有调性', text: '客单价高了，客流少了。', effects: [{ t: 'brand', v: 6 }, { t: 'mod', gm: 0.02, attract: { '*': 0.92 }, years: 10 }] }] }
    ],
    history: 'Zara 的母公司 Inditex 把大量生产留在西班牙、葡萄牙、摩洛哥等靠近总部的地方，新款从设计到上架只要两到三周，门店每周补货两次，打折比例远低于同行。Inditex 2001 年上市，创始人阿曼西奥·奥尔特加后来一度成为世界首富。',
    theory: { name: '敏捷供应链', text: '马歇尔·费希尔指出，需求稳定的“功能型产品”适合追求低成本的供应链，需求难测的“创新型产品”适合追求速度的供应链。时装属于后者：卖对比做得便宜更重要。' }
  },
  {
    id: 'P2_ENTRY', years: [2003, 2007], industry: 'apparel', title: '把成功模式原样复制？', era: '2000 年代 零售国际化',
    ctx: (s) => ({ C: s.hq === 'DE' ? 'JP' : 'DE' }),
    situation: '你在本国是零售冠军。{C}有一家连锁店愿意整体卖给你，团队想把本国的门店装修、促销方式和管理制度原封不动搬过去。',
    options: [
      { id: 'copy', text: '收购后全面推行本国模式', hint: '标准化，管理简单',
        outcomes: [{ p: 1, title: '水土不服', text: '当地顾客不吃你的那套促销，员工也不习惯你的制度。几年后你只能亏本卖掉。', effects: [{ t: 'cash', v: -0.18, min: 4e6 }, { t: 'level', c: '{C}', v: 2 }, { t: 'mod', attract: { '{C}': 0.55 }, years: 6 }, { t: 'brand', c: '{C}', v: -8 }] }] },
      { id: 'local', text: '收购后保留当地团队，只输出供应链', hint: '尊重本地',
        outcomes: [{ p: 1, title: '站稳了脚跟', text: '当地团队懂顾客，你的供应链让他们价格更有竞争力。', effects: [{ t: 'cash', v: -0.15, min: 4e6 }, { t: 'level', c: '{C}', v: 2 }, { t: 'mod', attract: { '{C}': 1.15 }, years: 8 }] }] },
      { id: 'flagship', text: '不收购，先在{C}开一家旗舰店试水', hint: '花小钱学习',
        outcomes: [{ p: 1, title: '摸清了门道', text: '旗舰店不赚钱，但你学到了很多。', effects: [{ t: 'cash', v: -0.03 }, { t: 'level', c: '{C}', v: 1 }, { t: 'brand', c: '{C}', v: 6 }] }] }
    ],
    history: '沃尔玛 1997 年通过收购进入德国，把美国式的门口迎宾、员工微笑等做法照搬过去，又与当地强势的工会和折扣店竞争失利，2006 年把 85 家门店卖给麦德龙退出德国，亏损约 10 亿美元。',
    theory: { name: 'CAGE 距离框架', text: '潘卡吉·盖马沃特提出，国家之间的距离不只是地理，还有文化、制度和经济上的差距。在本国成功的模式，越是依赖这些“软”因素，越难原样复制到远方。' }
  },
  {
    id: 'P3_FACTORY', years: [2012, 2014], industry: 'apparel', title: '供应商的工厂塌了', era: '2013 供应链责任',
    situation: '南亚一栋八层制衣厂大楼倒塌，死伤惨重。废墟里找到了好几个国际品牌的标签——其中一家工厂给你代工过。媒体和消费者都在追问：你们知道那里的安全状况吗？',
    options: [
      { id: 'accord', text: '加入行业安全协议，出钱整改所有供应商工厂', hint: '花钱、公开透明',
        outcomes: [{ p: 1, title: '赢回信任', text: '成本上去了一点，但你成了供应链透明的代表。', effects: [{ t: 'cash', v: -0.04, min: 1e6 }, { t: 'mod', gm: -0.008, years: 6 }, { t: 'brand', v: 6 }] }] },
      { id: 'cut', text: '悄悄换掉那个国家的所有供应商', hint: '撇清关系',
        outcomes: [
          { p: 0.5, title: '风头过去了', text: '公众很快转移了注意力。', effects: [{ t: 'mod', gm: -0.005, years: 2 }] },
          { p: 0.5, title: '被记者曝光', text: '报道说你“一走了之”，工人失去了工作，抵制声浪更大了。', effects: [{ t: 'brand', v: -10 }, { t: 'mod', attract: { UK: 0.85, DE: 0.85, US: 0.9 }, years: 3 }] }
        ] },
      { id: 'silent', text: '不回应，等风波过去', hint: '不花钱',
        outcomes: [{ p: 1, title: '抵制持续', text: '欧美消费者在社交媒体上发起抵制。', effects: [{ t: 'brand', v: -12 }, { t: 'mod', attract: { UK: 0.8, DE: 0.8, US: 0.88 }, years: 4 }] }] }
    ],
    history: '2013 年 4 月，孟加拉国萨瓦尔的拉纳广场大楼倒塌，造成一千一百多人死亡，楼里的几家制衣厂为多个国际品牌代工。事后两百多家品牌签署了《孟加拉消防与建筑安全协议》，出资检查和整改工厂。',
    theory: { name: '利益相关者理论', text: '企业不只对股东负责，也要对员工、供应商工人、社区负责。在全球外包的时代，消费者会把供应商的问题算在品牌头上：你可以外包生产，但外包不了责任。' }
  },
  {
    id: 'P4_ONLINE', years: [2015, 2018], industry: 'apparel', title: '门店还要不要？', era: '2010 年代 电商冲击',
    situation: '年轻人都在手机上买衣服，你的门店客流一年比一年少，商场租金却还在涨。有人建议大规模关店转做电商，也有人说门店是品牌的门面。',
    options: [
      { id: 'omni', text: '门店和线上打通：线上下单、门店发货和自提', hint: '改造系统，投入不小',
        outcomes: [{ p: 1, title: '全渠道成形', text: '门店变成了仓库和体验点，两边的生意都涨了。', effects: [{ t: 'cash', v: -0.07, min: 2e6 }, { t: 'mod', attract: { '*': 1.1 }, years: 8, from: 1 }, { t: 'mod', gm: 0.01, years: 8, from: 1 }] }] },
      { id: 'close', text: '关掉一半门店，全力做电商', hint: '省租金，冒品牌风险',
        outcomes: [
          { p: 0.5, title: '轻装上阵', text: '利润率提高了，线上增长很快。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', gm: 0.025, years: 6 }, { t: 'mod', attract: { '*': 0.95 }, years: 3 }] },
          { p: 0.5, title: '品牌存在感下降', text: '没了门店，新顾客越来越少。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', gm: 0.015, years: 4 }, { t: 'mod', attract: { '*': 0.85 }, years: 5 }] }
        ] },
      { id: 'keep', text: '坚守门店，靠体验取胜', hint: '不折腾',
        outcomes: [{ p: 1, title: '客流继续下滑', text: '租金吞掉了利润。', effects: [{ t: 'mod', gm: -0.02, years: 6 }, { t: 'mod', attract: { '*': 0.93 }, years: 6, from: 1 }] }] }
    ],
    history: '2017 年前后，美国数千家零售门店关闭，被称为“零售末日”。同期，Inditex 等公司把门店库存和线上订单打通，门店兼做发货点和自提点；后来崛起的 Shein 则完全不开店，靠数据和小批量快速反应在全球扩张。',
    theory: { name: '全渠道零售', text: '线上和线下不是谁取代谁，而是分工不同：线上方便、选择多，线下能试穿、建立信任。打通库存和会员体系，让顾客在任何渠道都能买到，是传统零售转型的主流做法。' }
  }
];

module.exports = { CASES2 };
