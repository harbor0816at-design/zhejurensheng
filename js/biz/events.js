// 随机经营事件：不是历史案例，而是每家公司都可能碰上的日常难题。
// 没有固定年份，按种子随机出现；每局每个事件最多一次。结构同案例卡，history / theory 可省略。
// ctx(s, rnd) 可用 rnd() 随机挑国家。
const physical = (s) => s.industry !== 'software';
const entered = (s) => Object.keys(s.countries).filter((c) => s.countries[c].level > 0);
const pickOf = (arr, rnd) => arr[Math.floor(rnd() * arr.length) % arr.length];

const BIZ_EVENTS = [
  {
    id: 'X_POACH', years: [1995, 2074], title: '对手来挖人', era: '经营事件',
    situation: '你的研发负责人收到了竞争对手翻倍的薪水邀请，还想带走半个团队。',
    options: [
      { id: 'match', text: '加薪挽留，再给股权激励', hint: '花钱留人',
        outcomes: [{ p: 1, title: '团队留下了', text: '大家干劲更足了。', effects: [{ t: 'cash', v: -0.02, min: 4e5 }, { t: 'quality', v: 2 }] }] },
      { id: 'promote', text: '让他走，提拔年轻人顶上', hint: '不花钱，有风险',
        outcomes: [
          { p: 0.5, title: '新人挑起了大梁', text: '年轻团队冲劲十足。', effects: [{ t: 'quality', v: 1 }] },
          { p: 0.5, title: '研发断档', text: '新产品推迟了大半年。', effects: [{ t: 'quality', v: -5 }] }
        ] },
      { id: 'sue', text: '用竞业协议起诉对手', hint: '打官司',
        outcomes: [{ p: 1, title: '赢了官司，伤了和气', text: '人留住了，但行业里都说你不好惹。', effects: [{ t: 'cash', v: -0.01, min: 3e5 }] }] }
    ],
    theory: { name: '人力资本', text: '知识型公司的核心资产每天晚上都会走出大门。股权激励把员工的利益和公司长期价值绑在一起。' }
  },
  {
    id: 'X_VIRAL', years: [2010, 2074], title: '突然火了', era: '经营事件',
    ctx: (s, rnd) => ({ C: pickOf(entered(s), rnd) }),
    situation: '一位{C}的网红随手发了一条用你产品的视频，播放量破了千万，门店和网店被挤爆。',
    options: [
      { id: 'ride', text: '连夜加产、加投广告，趁热打铁', hint: '花钱放大热度',
        outcomes: [
          { p: 0.65, title: '热度变成了销量', text: '新顾客里有不少留了下来。', effects: [{ t: 'cash', v: -0.02, min: 5e5 }, { t: 'brand', c: '{C}', v: 12 }, { t: 'mod', attract: { '{C}': 1.1 }, years: 3 }] },
          { p: 0.35, title: '热度来得快去得快', text: '加产的货压在了仓库里。', effects: [{ t: 'cash', v: -0.04, min: 8e5 }, { t: 'brand', c: '{C}', v: 5 }] }
        ] },
      { id: 'collab', text: '请这位网红做长期合作', hint: '稳定曝光',
        outcomes: [{ p: 1, title: '有了固定的代言人', text: '曝光稳定了不少。', effects: [{ t: 'cash', v: -0.01, min: 3e5 }, { t: 'brand', c: '{C}', v: 8 }] }] },
      { id: 'calm', text: '不追热点，按计划来', hint: '不花钱',
        outcomes: [{ p: 1, title: '热度自然消退', text: '还是带来了一些新顾客。', effects: [{ t: 'brand', c: '{C}', v: 3 }] }] }
    ]
  },
  {
    id: 'X_PATENT', years: [1998, 2074], title: '专利官司', era: '经营事件',
    situation: '一家只靠打官司赚钱的专利公司起诉你，说你的核心产品侵犯了它的专利，索赔一大笔钱。',
    options: [
      { id: 'settle', text: '花钱和解', hint: '破财消灾',
        outcomes: [{ p: 1, title: '和解了', text: '花了钱，省了心。', effects: [{ t: 'cash', v: -0.025, min: 6e5 }] }] },
      { id: 'fight', text: '应诉到底，申请宣告专利无效', hint: '赢了一劳永逸，输了赔更多',
        outcomes: [
          { p: 0.55, title: '专利被宣告无效', text: '以后再没人敢来找麻烦。', effects: [{ t: 'cash', v: -0.008, min: 2e5 }, { t: 'brand', v: 2 }] },
          { p: 0.45, title: '一审败诉', text: '赔偿金额比和解还高。', effects: [{ t: 'cash', v: -0.05, min: 1e6 }] }
        ] },
      { id: 'redesign', text: '改设计绕开专利', hint: '拖慢产品',
        outcomes: [{ p: 1, title: '绕过去了', text: '新设计花了半年，产品力略受影响。', effects: [{ t: 'quality', v: -2 }] }] }
    ]
  },
  {
    id: 'X_FIRE', years: [1995, 2074], title: '工厂失火', era: '经营事件',
    cond: (s) => physical(s) && Object.keys(s.countries).some((c) => s.countries[c].level >= 3),
    ctx: (s, rnd) => ({ C: pickOf(Object.keys(s.countries).filter((c) => s.countries[c].level >= 3), rnd) }),
    situation: '{C}工厂的一条生产线深夜起火，无人伤亡，但设备烧毁，旺季订单眼看要交不了货。',
    options: [
      { id: 'rebuild', text: '加急重建，空运零件', hint: '花钱保交付',
        outcomes: [{ p: 1, title: '一个月恢复生产', text: '客户几乎没感觉到。', effects: [{ t: 'cash', v: -0.03, min: 8e5 }] }] },
      { id: 'oem', text: '临时交给代工厂生产', hint: '成本高一点，质量难控',
        outcomes: [{ p: 1, title: '订单交上了', text: '这一年利润薄了一些。', effects: [{ t: 'mod', gm: -0.02, years: 1 }, { t: 'quality', v: -1 }] }] },
      { id: 'delay', text: '和客户协商延期', hint: '不花钱，伤信誉',
        outcomes: [{ p: 1, title: '客户不太高兴', text: '有几个客户转去了对手那里。', effects: [{ t: 'share', m: { '{C}': 0.9 } }, { t: 'brand', c: '{C}', v: -4 }] }] }
    ]
  },
  {
    id: 'X_LEAK', years: [2006, 2074], title: '用户数据泄露', era: '经营事件',
    situation: '安全团队发现黑客入侵了会员系统，几百万条用户资料可能已经流出。目前外界还不知道。',
    options: [
      { id: 'disclose', text: '立即公开，通知用户并免费提供保护服务', hint: '主动认错',
        outcomes: [{ p: 1, title: '坦诚赢得谅解', text: '虽然挨了批评，但用户觉得你靠得住。', effects: [{ t: 'cash', v: -0.015, min: 4e5 }, { t: 'brand', v: -2 }] }] },
      { id: 'hide', text: '悄悄修补，不对外说', hint: '赌没人发现',
        outcomes: [
          { p: 0.4, title: '真没人发现', text: '但你心里一直不踏实。', effects: [] },
          { p: 0.6, title: '一年后被曝光', text: '“隐瞒”比“泄露”更让人愤怒：罚款、诉讼接踵而来。', effects: [{ t: 'cash', v: -0.05, min: 1.5e6 }, { t: 'brand', v: -12 }] }
        ] }
    ],
    theory: { name: '信息披露', text: '许多国家的法律要求企业在发现数据泄露后限期通报。研究和案例都表明，隐瞒被发现后的代价远高于主动披露。' }
  },
  {
    id: 'X_STRIKE', years: [1995, 2074], title: '工人要求加薪', era: '经营事件',
    cond: physical,
    ctx: (s, rnd) => ({ C: pickOf(entered(s), rnd) }),
    situation: '{C}的员工因为物价上涨要求加薪 15%，工会威胁下周开始罢工。',
    options: [
      { id: 'raise', text: '同意加薪', hint: '成本上升，士气提高',
        outcomes: [{ p: 1, title: '皆大欢喜', text: '员工流失率明显下降。', effects: [{ t: 'mod', gm: -0.008, years: 5 }, { t: 'quality', v: 2 }] }] },
      { id: 'half', text: '谈判，加一半，再加培训和福利', hint: '折中',
        outcomes: [{ p: 1, title: '达成协议', text: '双方各退一步。', effects: [{ t: 'mod', gm: -0.004, years: 4 }] }] },
      { id: 'hard', text: '强硬拒绝', hint: '不涨成本',
        outcomes: [
          { p: 0.5, title: '工人让步了', text: '可怨气还在。', effects: [{ t: 'quality', v: -2 }] },
          { p: 0.5, title: '罢工两个月', text: '生产停摆，最后还是加了薪。', effects: [{ t: 'share', m: { '{C}': 0.88 } }, { t: 'mod', gm: -0.006, years: 4 }, { t: 'brand', c: '{C}', v: -5 }] }
        ] }
    ]
  },
  {
    id: 'X_BIGCLIENT', years: [1995, 2074], title: '大客户压价', era: '经营事件',
    cond: (s) => s.industry !== 'apparel',
    situation: '全国最大的连锁渠道愿意把你的产品放进所有门店，条件是价格再降 15%，而且三年内不许卖给它的对手。',
    options: [
      { id: 'accept', text: '接受：量大就是硬道理', hint: '份额上升，利润变薄',
        outcomes: [{ p: 1, title: '销量大涨', text: '可利润率被压得很低，议价权也在别人手里。', effects: [{ t: 'mod', attract: { '{HQ}': 1.15 }, gm: -0.015, years: 3 }] }] },
      { id: 'counter', text: '只降 5%，拒绝独家', hint: '讨价还价',
        outcomes: [
          { p: 0.5, title: '对方接受了', text: '你守住了底线。', effects: [{ t: 'mod', attract: { '{HQ}': 1.06 }, years: 3 }] },
          { p: 0.5, title: '谈崩了', text: '对方转头扶持了你的对手。', effects: [{ t: 'mod', attract: { '{HQ}': 0.95 }, years: 2 }] }
        ] },
      { id: 'refuse', text: '拒绝，自建渠道', hint: '慢，但自己说了算',
        outcomes: [{ p: 1, title: '渠道握在自己手里', text: '增长慢一点，但利润稳。', effects: [{ t: 'cash', v: -0.015, min: 4e5 }, { t: 'mod', gm: 0.005, years: 5 }] }] }
    ],
    ctx: (s) => ({ HQ: s.hq }),
    theory: { name: '五力模型 · 买方议价力', text: '迈克尔·波特的五力模型里，买方越集中、对你越重要，你的议价能力就越弱。依赖单一大客户会让利润被一点点挤掉。' }
  },
  {
    id: 'X_SUBSIDY', years: [1997, 2074], title: '招商引资', era: '经营事件',
    cond: (s) => physical(s) && ['VN', 'IN', 'MX', 'BR', 'CN'].some((c) => s.countries[c].level < 3 && c !== s.hq),
    ctx: (s, rnd) => { const l = ['VN', 'IN', 'MX', 'BR', 'CN'].filter((c) => s.countries[c].level < 3 && c !== s.hq); return { C: l.length ? pickOf(l, rnd) : 'VN' }; },
    situation: '{C}的一个工业园区找上门：免费土地、五年免税，只要你在那里建一座工厂。',
    options: [
      { id: 'build', text: '签约建厂', hint: '优惠很大，仍要自己出设备钱',
        outcomes: [
          { p: 0.75, title: '新基地投产', text: '园区说到做到，你多了一个低成本工厂。', effects: [{ t: 'cash', v: -0.06, min: 2.5e6 }, { t: 'level', c: '{C}', v: 3 }] },
          { p: 0.25, title: '换了领导，政策打了折扣', text: '工厂建起来了，但承诺的优惠只兑现了一半。', effects: [{ t: 'cash', v: -0.1, min: 4e6 }, { t: 'level', c: '{C}', v: 3 }] }
        ] },
      { id: 'branch', text: '先设一个销售分公司', hint: '小投入',
        outcomes: [{ p: 1, title: '有了据点', text: '园区有点失望，但关系还在。', effects: [{ t: 'cash', v: -0.01, min: 3e5 }, { t: 'level', c: '{C}', v: 2 }] }] },
      { id: 'no', text: '婉拒', hint: '不花钱',
        outcomes: [{ p: 1, title: '机会给了别人', text: '你的对手接下了这块地。', effects: [] }] }
    ]
  },
  {
    id: 'X_FAKE', years: [1998, 2018], title: '满街山寨货', era: '经营事件',
    cond: physical,
    ctx: (s, rnd) => ({ C: pickOf(['CN', 'IN', 'VN', 'BR', 'MX'].filter((c) => c !== s.hq), rnd) }),
    situation: '{C}的小商品市场里出现了大量仿冒你的产品，价格只有正品的三分之一，有些质量很差，顾客还以为是你的问题。',
    options: [
      { id: 'legal', text: '请律师、联合当地执法打假', hint: '持久战',
        outcomes: [{ p: 1, title: '山寨少了一些', text: '打不干净，但品牌形象保住了。', effects: [{ t: 'cash', v: -0.01, min: 3e5 }, { t: 'brand', c: '{C}', v: 3 }] }] },
      { id: 'cheap', text: '推出平价副线，和山寨抢顾客', hint: '以快打快',
        outcomes: [{ p: 1, title: '平价线卖得不错', text: '可主品牌被拉低了一点。', effects: [{ t: 'mod', attract: { '{C}': 1.12 }, years: 4 }, { t: 'brand', v: -2 }] }] },
      { id: 'ignore', text: '不管，山寨说明我们有名', hint: '不花钱',
        outcomes: [{ p: 1, title: '口碑受损', text: '买到劣质仿品的顾客把账算在了你头上。', effects: [{ t: 'brand', c: '{C}', v: -8 }] }] }
    ]
  },
  {
    id: 'X_SCANDAL', years: [1995, 2074], title: '高管失言', era: '经营事件',
    situation: '一位高管在私人聚会上的冒犯性言论被人录下来，在网上疯传，话题冲上热搜。',
    options: [
      { id: 'fire', text: '当天解职，公开道歉', hint: '果断切割',
        outcomes: [{ p: 1, title: '风波很快平息', text: '大家觉得你处理得体。', effects: [{ t: 'brand', v: -1 }] }] },
      { id: 'protect', text: '他能力很强，内部处分就好', hint: '保人',
        outcomes: [
          { p: 0.4, title: '慢慢没人提了', text: '他继续为公司创造价值。', effects: [{ t: 'brand', v: -2 }] },
          { p: 0.6, title: '舆论持续发酵', text: '有人发起抵制，最后他还是走了。', effects: [{ t: 'brand', v: -8 }] }
        ] }
    ]
  },
  {
    id: 'X_INVESTOR', years: [2000, 2074], title: '战略投资人上门', era: '经营事件',
    situation: '一家行业巨头想入股你的公司，愿意按比市价高两成的估值投一大笔钱，条件是给它一个董事席位。',
    options: [
      { id: 'yes', text: '接受投资', hint: '现金大增，股份稀释',
        outcomes: [{ p: 1, title: '弹药充足', text: '巨头还帮你打开了一些渠道。', effects: [{ t: 'raise', v: 0.15 }, { t: 'mod', attract: { '*': 1.03 }, years: 4 }] }] },
      { id: 'small', text: '只让它投一小部分，不给董事席位', hint: '讨价还价',
        outcomes: [
          { p: 0.5, title: '对方同意了', text: '拿到了钱，控制权也没丢。', effects: [{ t: 'raise', v: 0.06 }] },
          { p: 0.5, title: '对方转身投了你的对手', text: '你的对手突然有钱了。', effects: [{ t: 'mod', attract: { '*': 0.96 }, years: 3 }] }
        ] },
      { id: 'no', text: '婉拒，保持独立', hint: '不稀释',
        outcomes: [{ p: 1, title: '保持独立', text: '一切照旧。', effects: [] }] }
    ]
  },
  {
    id: 'X_PRICEWAR', years: [1995, 2074], title: '价格战', era: '经营事件',
    ctx: (s, rnd) => ({ C: pickOf(entered(s), rnd) }),
    situation: '{C}市场的头号对手突然全线降价 25%，摆明了要抢份额。',
    options: [
      { id: 'match', text: '跟着降', hint: '保份额，伤利润',
        outcomes: [{ p: 1, title: '份额保住了', text: '这一年谁都没赚钱。', effects: [{ t: 'mod', gm: -0.02, years: 2 }] }] },
      { id: 'value', text: '不降价，加赠服务和延保', hint: '拼价值',
        outcomes: [
          { p: 0.6, title: '老顾客留下了', text: '只丢了一些价格敏感的客户。', effects: [{ t: 'cash', v: -0.01, min: 3e5 }, { t: 'share', m: { '{C}': 0.96 } }] },
          { p: 0.4, title: '顾客跑了不少', text: '在价格面前，服务没那么重要。', effects: [{ t: 'share', m: { '{C}': 0.85 } }] }
        ] },
      { id: 'fighter', text: '推出低价“战斗品牌”专门迎战', hint: '主品牌不降价',
        outcomes: [{ p: 1, title: '以子之矛', text: '新品牌拖住了对手，主品牌的价格没动。', effects: [{ t: 'cash', v: -0.015, min: 4e5 }, { t: 'mod', attract: { '{C}': 1.04 }, years: 2 }] }] }
    ]
  },
  {
    id: 'X_TALENT', years: [1995, 2074], title: '一支明星团队想加入', era: '经营事件',
    situation: '一家倒闭创业公司的技术团队找到你，他们做出过很厉害的东西，但开价不低，而且习惯自由散漫。',
    options: [
      { id: 'hire', text: '整体收编，单独成立创新实验室', hint: '花钱买人才',
        outcomes: [
          { p: 0.6, title: '实验室出成果了', text: '他们做的新功能成了卖点。', effects: [{ t: 'cash', v: -0.02, min: 6e5 }, { t: 'quality', v: 6 }] },
          { p: 0.4, title: '水土不服', text: '一年后团队走了一大半。', effects: [{ t: 'cash', v: -0.02, min: 6e5 }, { t: 'quality', v: 1 }] }
        ] },
      { id: 'few', text: '只要两个核心成员', hint: '小成本',
        outcomes: [{ p: 1, title: '补上了短板', text: '两位新人很快融入。', effects: [{ t: 'cash', v: -0.005, min: 2e5 }, { t: 'quality', v: 2 }] }] },
      { id: 'no', text: '不要', hint: '不花钱',
        outcomes: [{ p: 1, title: '团队去了对手那里', text: '希望他们别做出太厉害的东西。', effects: [] }] }
    ]
  },
  {
    id: 'X_FX', years: [1995, 2074], title: '汇率大跳水', era: '经营事件',
    cond: (s) => entered(s).length >= 3,
    ctx: (s, rnd) => ({ C: pickOf(entered(s).filter((c) => c !== s.hq).concat(['BR']), rnd) }),
    situation: '{C}货币一个月贬值三成，你在那里的收入换回本币缩水了一大截。财务总监问要不要做汇率对冲。',
    options: [
      { id: 'hedge', text: '买汇率对冲合约', hint: '花点钱买保险',
        outcomes: [{ p: 1, title: '损失锁住了', text: '后面又跌了一轮，你没受影响。', effects: [{ t: 'cash', v: -0.008, min: 2e5 }] }] },
      { id: 'price', text: '在当地涨价', hint: '保利润，丢客户',
        outcomes: [{ p: 1, title: '利润保住，销量下滑', text: '当地顾客买不起了。', effects: [{ t: 'share', m: { '{C}': 0.9 } }] }] },
      { id: 'local', text: '加大当地采购，让成本也用当地货币', hint: '自然对冲',
        outcomes: [{ p: 1, title: '自然对冲', text: '当地成本也便宜了，长期更稳。', effects: [{ t: 'mod', attract: { '{C}': 1.05 }, years: 4 }] }] }
    ],
    theory: { name: '汇率风险', text: '跨国公司面对交易风险、折算风险和经济风险。金融对冲管短期，把生产和采购放到销售地（“自然对冲”）管长期。' }
  },
  {
    id: 'X_DEEPFAKE', years: [2026, 2074], title: '假的 CEO', era: '经营事件',
    situation: '网上流传一段视频：“你”在宣布公司要大裁员、产品有安全隐患。视频是 AI 伪造的，但已经有几百万人看过，股价开始下跌。',
    options: [
      { id: 'live', text: '马上亲自直播辟谣，公布技术鉴定', hint: '正面回应',
        outcomes: [{ p: 1, title: '谣言止住了', text: '大部分人相信了你的澄清。', effects: [{ t: 'brand', v: -1 }] }] },
      { id: 'legal', text: '起诉平台和造假者', hint: '法律途径',
        outcomes: [{ p: 1, title: '赢了官司，慢了一步', text: '判决下来时，谣言已经传遍全网。', effects: [{ t: 'cash', v: -0.005, min: 2e5 }, { t: 'brand', v: -4 }] }] },
      { id: 'tech', text: '给所有官方视频加上防伪水印，以后一律以此为准', hint: '一劳永逸',
        outcomes: [{ p: 1, title: '有了防伪体系', text: '这次损失了一点，以后再没人能冒充你。', effects: [{ t: 'cash', v: -0.005, min: 2e5 }, { t: 'brand', v: -2 }] }] }
    ]
  },
  {
    id: 'X_DRONE', years: [2030, 2074], title: '无人机送货出事故', era: '经营事件',
    cond: (s) => s.industry !== 'software',
    situation: '你家的一架送货无人机在居民区坠落，砸坏了一辆车，好在没有伤人。视频在网上疯传，监管部门要求说明情况。',
    options: [
      { id: 'pause', text: '全城暂停无人机配送，彻查原因', hint: '安全第一',
        outcomes: [{ p: 1, title: '负责任', text: '配送慢了一个月，但信任保住了。', effects: [{ t: 'mod', attract: { '*': 0.98 }, years: 1 }, { t: 'brand', v: 1 }] }] },
      { id: 'pay', text: '赔偿车主，配送照常', hint: '个案处理',
        outcomes: [
          { p: 0.7, title: '小插曲', text: '风波很快过去。', effects: [{ t: 'cash', v: -0.002, min: 5e4 }] },
          { p: 0.3, title: '又掉了一架', text: '监管部门直接吊销了你的飞行许可。', effects: [{ t: 'cash', v: -0.01, min: 3e5 }, { t: 'brand', v: -6 }] }
        ] }
    ]
  },
  {
    id: 'X_CLIMATE_SUIT', years: [2028, 2074], title: '气候诉讼', era: '经营事件',
    cond: (s) => s.industry !== 'software',
    situation: '一群年轻人起诉你的公司，要求为历史碳排放造成的气候损害赔偿。类似的诉讼在多个国家都有原告胜诉。',
    options: [
      { id: 'settle', text: '和解，出资建立气候适应基金', hint: '花钱平息',
        outcomes: [{ p: 1, title: '和解了', text: '花了一笔钱，换来了不错的口碑。', effects: [{ t: 'cash', v: -0.015, min: 5e5 }, { t: 'brand', v: 3 }] }] },
      { id: 'fight', text: '应诉，证明自己已经尽到减排义务', hint: '据理力争',
        outcomes: [
          { p: 0.55, title: '胜诉', text: '法院认为你的减排努力足够。', effects: [{ t: 'cash', v: -0.005, min: 2e5 }] },
          { p: 0.45, title: '败诉', text: '赔偿金额不小，还要公开道歉。', effects: [{ t: 'cash', v: -0.04, min: 1e6 }, { t: 'brand', v: -6 }] }
        ] }
    ]
  },
  {
    id: 'X_AI_GENIUS', years: [2026, 2074], title: '天才研究员', era: '经营事件',
    situation: '一位全球顶尖的 AI 研究员愿意加入你，开价是一年 5000 万美元外加大量股权。她说能让你的产品领先对手好几年。',
    options: [
      { id: 'hire', text: '答应她的条件', hint: '天价人才',
        outcomes: [
          { p: 0.6, title: '物超所值', text: '她带来的技术让产品脱胎换骨。', effects: [{ t: 'cash', v: -0.01, min: 5e5 }, { t: 'quality', v: 7 }] },
          { p: 0.4, title: '水土不服', text: '一年后她被另一家公司以更高价挖走。', effects: [{ t: 'cash', v: -0.01, min: 5e5 }, { t: 'quality', v: 1 }] }
        ] },
      { id: 'lab', text: '为她单独建一个独立实验室，按成果分红', hint: '风险共担',
        outcomes: [{ p: 1, title: '独立实验室', text: '她很满意，成果稳步产出。', effects: [{ t: 'cash', v: -0.006, min: 3e5 }, { t: 'quality', v: 4 }] }] },
      { id: 'no', text: '太贵了，婉拒', hint: '不花钱',
        outcomes: [{ p: 1, title: '她去了对手那里', text: '希望她做不出太厉害的东西。', effects: [] }] }
    ]
  },
  {
    id: 'X_HEATWAVE', years: [2030, 2074], title: '热浪停电', era: '经营事件',
    cond: (s) => s.industry !== 'software' && s.world.dials.climate !== 'orderly',
    ctx: (s, rnd) => { const l = Object.keys(s.countries).filter((c) => s.countries[c].level >= 2); return { C: l.length ? l[Math.floor(rnd() * l.length) % l.length] : s.hq }; },
    situation: '{C}遭遇创纪录的热浪，电网限电，你在当地的运营每天只能开工几个小时。',
    options: [
      { id: 'gen', text: '租用柴油发电机和储能，保证生产', hint: '花钱保产',
        outcomes: [{ p: 1, title: '没停工', text: '电费贵了，订单没耽误。', effects: [{ t: 'cash', v: -0.006, min: 2e5 }] }] },
      { id: 'night', text: '改成夜班生产', hint: '错峰',
        outcomes: [{ p: 1, title: '错峰生产', text: '产量少了一点，员工有些怨言。', effects: [{ t: 'share', m: { '{C}': 0.96 } }] }] },
      { id: 'stop', text: '停工等热浪过去', hint: '不花钱',
        outcomes: [{ p: 1, title: '停了一个月', text: '当地客户等不及了。', effects: [{ t: 'share', m: { '{C}': 0.9 } }] }] }
    ]
  },
  {
    id: 'X_SUPPLIER_AI', years: [2030, 2074], title: '供应商的 AI 在压价', era: '经营事件',
    situation: '你的主要供应商换上了 AI 谈判系统，它能精确算出你的底线，每次谈判都让你多付一点。',
    options: [
      { id: 'ai', text: '也上 AI 谈判系统，以 AI 对 AI', hint: '技术对抗',
        outcomes: [{ p: 1, title: '势均力敌', text: '采购成本稳住了。', effects: [{ t: 'cash', v: -0.004, min: 2e5 }, { t: 'mod', gm: 0.005, years: 5 }] }] },
      { id: 'more', text: '多找几家供应商，让它们互相竞争', hint: '分散采购',
        outcomes: [{ p: 1, title: '议价权回来了', text: '供应商不敢再狮子大开口。', effects: [{ t: 'mod', gm: 0.004, years: 5 }] }] },
      { id: 'accept', text: '接受，维护关系', hint: '息事宁人',
        outcomes: [{ p: 1, title: '成本悄悄上涨', text: '每年多付一点。', effects: [{ t: 'mod', gm: -0.008, years: 5 }] }] }
    ]
  }
];

module.exports = { BIZ_EVENTS };
