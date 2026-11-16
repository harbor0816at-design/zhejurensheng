// 未来案例（2025–2074）：基于今天已经出现的趋势做的推演，不是预测。
// cond 可以读 s.world.dials（技术 / 地缘 / 气候三个大势），让每局的未来各不相同。
// history 字段在未来案例里写“推演依据”。
const D_ = (s) => s.world.dials;
const physical = (s) => s.industry !== 'software';

const CASES_F = [
  {
    id: 'F_AGENTS', years: [2027, 2032], future: true, title: 'AI 员工', era: '2020 年代末 推演',
    cond: (s) => D_(s).tech !== 'ai_winter',
    situation: 'AI 智能体已经能独立完成财务、客服、设计甚至一部分管理工作，成本只有人工的十分之一。对手宣布裁掉一半白领。你的员工在等你表态。',
    options: [
      { id: 'replace', text: '大规模用 AI 替代白领岗位', hint: '成本骤降，人心浮动',
        outcomes: [
          { p: 0.65, title: '效率翻倍', text: '成本大降，剩下的员工也习惯了和 AI 一起工作。', effects: [{ t: 'mod', gm: 0.04, years: 10 }, { t: 'brand', c: '{HQ}', v: -6 }] },
          { p: 0.35, title: 'AI 出了大错', text: '一个无人监督的 AI 系统给客户发错了上万份合同，损失惨重。', effects: [{ t: 'cash', v: -0.05, min: 1e6 }, { t: 'mod', gm: 0.02, years: 6 }, { t: 'brand', v: -8 }] }
        ] },
      { id: 'retrain', text: '不裁员，出钱培训每个人成为“AI 指挥官”', hint: '慢一点，稳一点',
        outcomes: [{ p: 1, title: '人机协作', text: '转型花了三年，团队士气高，产品创新多。', effects: [{ t: 'cash', v: -0.04, min: 1e6 }, { t: 'mod', gm: 0.02, years: 10, from: 1 }, { t: 'quality', v: 5 }, { t: 'brand', v: 4 }] }] },
      { id: 'sell', text: '把自家的 AI 工具包装成产品卖给同行', hint: '从用户变卖家',
        outcomes: [
          { p: 0.5, title: '多了一门生意', text: '同行争相采购你的行业 AI 方案。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', gm: 0.02, attract: { '*': 1.04 }, years: 8 }] },
          { p: 0.5, title: '竞争不过大模型公司', text: '通用 AI 公司推出了更便宜的方案。', effects: [{ t: 'cash', v: -0.03 }] }
        ] },
      { id: 'human', text: '打出“真人服务”招牌，做高端差异化', hint: '反其道而行',
        outcomes: [{ p: 1, title: '真人成了奢侈品', text: '有钱的客户愿意为真人服务多付钱。', effects: [{ t: 'brand', v: 6 }, { t: 'mod', gm: -0.01, attract: { US: 1.06, JP: 1.06, DE: 1.06, UK: 1.06 }, years: 10 }] }] }
    ],
    ctx: (s) => ({ HQ: s.hq }),
    history: '推演依据：2024 年起，多家公司公开表示用 AI 替代部分客服、翻译和编程工作；咨询机构估计生成式 AI 可能影响全球数亿个岗位。',
    theory: { name: '技术性失业与再培训', text: '历次技术革命都会消灭一些岗位、创造另一些岗位。转型期的速度和公平，决定了企业能否赢得员工和社会的支持。' }
  },
  {
    id: 'F_AI_CRASH', years: [2027, 2031], future: true, title: 'AI 泡沫破了', era: '2020 年代末 推演',
    cond: (s) => D_(s).tech === 'ai_winter' && s.year >= s.world.milestones.crash,
    situation: '过去几年你跟风在 AI 上投了不少钱。现在 AI 股票腰斩，很多项目被证明只是“演示好看”，董事会要求重新评估。',
    options: [
      { id: 'cut', text: '砍掉所有 AI 项目，回归主业', hint: '止损',
        outcomes: [{ p: 1, title: '止住了出血', text: '省下了钱，但也丢掉了几个后来证明有用的项目。', effects: [{ t: 'cash', v: 0.02 }, { t: 'quality', v: -3 }] }] },
      { id: 'keep', text: '只保留真正省钱的两三个项目', hint: '去伪存真',
        outcomes: [{ p: 1, title: '留下了精华', text: '几个务实的项目持续降低成本。', effects: [{ t: 'mod', gm: 0.012, years: 8 }] }] },
      { id: 'buy', text: '趁低价收购倒闭的 AI 公司和人才', hint: '寒冬抄底',
        outcomes: [
          { p: 0.6, title: '寒冬里囤了粮', text: '几年后技术复苏，你手里的人才和专利价值翻倍。', effects: [{ t: 'cash', v: -0.05, min: 1.5e6 }, { t: 'quality', v: 6 }, { t: 'mod', attract: { '*': 1.06 }, years: 8, from: 3 }] },
          { p: 0.4, title: '寒冬比预想的长', text: '收来的团队一直在烧钱。', effects: [{ t: 'cash', v: -0.07, min: 2e6 }] }
        ] }
    ],
    history: '推演依据：历史上每一轮技术热潮都伴随过度投资，比如 2000 年互联网泡沫和 2017 年加密货币泡沫。技术本身往往在泡沫破裂后才真正成熟。',
    theory: { name: '炒作周期', text: '泡沫破裂淘汰的是不务实的项目，不是技术本身。寒冬里保持投入的公司，常常在复苏时领跑。' }
  },
  {
    id: 'F_CAMP', years: [2026, 2031], future: true, title: '选边站', era: '2020 年代末 推演',
    cond: (s) => D_(s).geo === 'blocs',
    situation: '两大经济阵营正式成形：芯片、支付、数据标准都分成两套。双方政府都在暗示，企业最好只选一边。你在两边都有生意。',
    options: [
      { id: 'west', text: '站美国一边，退出中国市场', hint: '保住欧美',
        outcomes: [{ p: 1, title: '西方阵营的一员', text: '欧美客户和政府更信任你，中国市场归零。', effects: [{ t: 'level', c: 'CN', v: 0, force: true }, { t: 'mod', attract: { US: 1.12, DE: 1.08, UK: 1.08, JP: 1.08 }, years: 12 }] }] },
      { id: 'east', text: '站中国一边，退出美国市场', hint: '保住中国和全球南方',
        outcomes: [{ p: 1, title: '东方阵营的一员', text: '中国和不少新兴市场把你当自己人，美国市场归零。', effects: [{ t: 'level', c: 'US', v: 0, force: true }, { t: 'mod', attract: { CN: 1.15, BR: 1.08, VN: 1.06, IN: 1.04 }, years: 12 }] }] },
      { id: 'split', text: '拆成两家独立公司，各在一边', hint: '一分为二',
        outcomes: [{ p: 1, title: '一家变两家', text: '两边生意都保住了，但规模效应没了，管理成本翻倍。', effects: [{ t: 'cash', v: -0.05, min: 2e6 }, { t: 'mod', gm: -0.025, years: 12 }] }] },
      { id: 'neutral', text: '把重心移到印度、越南、墨西哥、巴西这些“中间地带”', hint: '不站队',
        outcomes: [
          { p: 0.6, title: '中间地带的赢家', text: '两大阵营都要跟中间国家做生意，你成了桥梁。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'mod', attract: { IN: 1.15, VN: 1.15, MX: 1.15, BR: 1.15, US: 0.92, CN: 0.92 }, years: 12 }] },
          { p: 0.4, title: '两边都不讨好', text: '两边都对你有疑虑，中间市场又不够大。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'mod', attract: { US: 0.88, CN: 0.88, IN: 1.08, VN: 1.08 }, years: 8 }] }
        ] }
    ],
    history: '推演依据：2018 年后的贸易摩擦、芯片出口管制和数据安全审查，已经让一些跨国公司把业务拆成“中国区”和“非中国区”两套体系。',
    theory: { name: '地缘政治风险', text: '当政治边界变成经济边界，企业的全球化就要重新设计：选边、拆分还是做桥梁，各有代价。' }
  },
  {
    id: 'F_CHIP_RISK', years: [2038, 2046], future: true, title: '断供预警', era: '2040 年代 推演',
    cond: (s) => D_(s).geo === 'blocs' && s.industry !== 'beverage',
    situation: '情报机构警告，地区局势紧张，全球最先进的芯片工厂可能被迫停产。你的产品离不开这些芯片。',
    options: [
      { id: 'stock', text: '囤三年的芯片库存', hint: '占用大量现金',
        outcomes: [{ p: 1, title: '有备无患', text: '真出事时你还能照常生产。', effects: [{ t: 'cash', v: -0.08, min: 2e6 }, { t: 'mod', attract: { '*': 1.05 }, years: 4, from: 2 }] }] },
      { id: 'redesign', text: '改设计，换成落后两代但多地能产的芯片', hint: '性能换安全',
        outcomes: [{ p: 1, title: '安全但平庸', text: '供应稳了，产品力略有下降。', effects: [{ t: 'quality', v: -3 }, { t: 'mod', attract: { '*': 1.02 }, years: 6, from: 2 }] }] },
      { id: 'invest', text: '入股一家在本国新建的芯片厂', hint: '长期押注',
        outcomes: [{ p: 1, title: '有了自己的芯片来源', text: '五年后新厂投产，你优先拿货。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'mod', gm: 0.01, attract: { '*': 1.04 }, years: 15, from: 3 }] }] },
      { id: 'ignore', text: '这种预警年年都有，不理会', hint: '不花钱',
        outcomes: [
          { p: 0.5, title: '虚惊一场', text: '局势缓和了。', effects: [] },
          { p: 0.5, title: '真的断了', text: '生产停了大半年。', effects: [{ t: 'share', m: { '*': 0.8 } }] }
        ] }
    ],
    history: '推演依据：今天全球九成以上的最先进制程芯片集中在少数几个地区生产，各国都在推动芯片制造本土化。',
    theory: { name: '集中度风险', text: '一个行业的关键产能越集中，地缘风险就越像“灰犀牛”：概率不高，影响巨大。' }
  },
  {
    id: 'F_MEGA_FTA', years: [2029, 2036], future: true, title: '全球大市场', era: '2030 年代 推演',
    cond: (s) => D_(s).geo === 'open',
    situation: '大国达成全面贸易协定，关税降到历史低点，跨境投资和数据流动也放开了。对手们正抢着在各国开店建厂。',
    options: [
      { id: 'blitz', text: '五年内进入所有大市场', hint: '闪电扩张',
        outcomes: [
          { p: 0.6, title: '抢到了先机', text: '你在好几个国家都比对手早一步。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'level', c: 'IN', v: 1 }, { t: 'level', c: 'BR', v: 1 }, { t: 'level', c: 'VN', v: 1 }, { t: 'mod', attract: { '*': 1.08 }, years: 8 }] },
          { p: 0.4, title: '摊子铺太大', text: '管理跟不上，好几个国家都在亏钱。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'level', c: 'IN', v: 1 }, { t: 'level', c: 'BR', v: 1 }, { t: 'mod', gm: -0.015, years: 4 }] }
        ] },
      { id: 'hub', text: '在成本最低的国家建一个超级工厂供应全球', hint: '规模经济',
        outcomes: [{ p: 1, title: '世界工厂', text: '关税低了，一个超级工厂就能供应全世界。', effects: [{ t: 'cash', v: -0.08, min: 3e6 }, { t: 'level', c: 'VN', v: 3, sw: 2 }, { t: 'mod', gm: 0.02, years: 10 }] }] },
      { id: 'brand', text: '把钱花在全球品牌上', hint: '品牌出海',
        outcomes: [{ p: 1, title: '全球知名', text: '你的品牌在新市场迅速被认识。', effects: [{ t: 'cash', v: -0.05, min: 2e6 }, { t: 'brand', v: 8 }] }] },
      { id: 'defend', text: '守好主场，防外国对手进来', hint: '防守',
        outcomes: [{ p: 1, title: '主场守住了', text: '但外国对手还是拿走了一些份额。', effects: [{ t: 'brand', c: '{HQ}', v: 6 }, { t: 'mod', attract: { '{HQ}': 0.96 }, years: 6 }] }] }
    ],
    ctx: (s) => ({ HQ: s.hq }),
    history: '推演依据：《区域全面经济伙伴关系协定》（RCEP）和《全面与进步跨太平洋伙伴关系协定》（CPTPP）已经覆盖全球大部分贸易，进一步合并在理论上是可能的。',
    theory: { name: '先发优势', text: '市场突然开放时，先进入者能抢到渠道、人才和品牌认知；但扩张太快也会稀释管理能力。' }
  },
  {
    id: 'F_CARBON_PRICE', years: [2028, 2036], future: true, title: '碳价每吨 150 美元', era: '2030 年代 推演',
    cond: (s) => D_(s).climate !== 'hothouse' && physical(s),
    situation: '主要经济体统一碳价，每吨二氧化碳 150 美元，而且每年还要涨。你的工厂排放不低，按现在的排放算，碳成本会吃掉一大块利润。',
    options: [
      { id: 'green', text: '工厂全面电气化，买绿电', hint: '大投资',
        outcomes: [{ p: 1, title: '零碳工厂', text: '前期投入大，几年后碳成本几乎归零。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'mod', gm: 0.02, years: 15, from: 2 }, { t: 'brand', v: 4 }] }] },
      { id: 'offset', text: '买碳汇抵消', hint: '花钱买指标',
        outcomes: [{ p: 1, title: '每年一笔碳汇费', text: '不用改造，但碳汇越来越贵。', effects: [{ t: 'mod', gm: -0.015, years: 10 }] }] },
      { id: 'move', text: '把高排放工序搬到碳价低的国家', hint: '碳泄漏',
        outcomes: [
          { p: 0.5, title: '暂时省了钱', text: '那些国家还没跟进。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'mod', gm: 0.005, years: 4 }] },
          { p: 0.5, title: '碳关税追上来了', text: '出口回来要交碳关税，白搬了。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'mod', gm: -0.01, years: 6 }] }
        ] },
      { id: 'pass', text: '把碳成本加进价格里', hint: '让顾客买单',
        outcomes: [{ p: 1, title: '价格上去了', text: '对手的绿色产品更便宜，你丢了一些份额。', effects: [{ t: 'mod', attract: { '*': 0.92 }, years: 5 }] }] }
    ],
    history: '推演依据：欧盟碳价已在每吨 60–100 欧元间波动，欧盟碳边境调节机制 2026 年起正式征费；国际能源署的净零情景假设发达经济体 2030 年碳价达到约 140 美元。',
    theory: { name: '外部性定价', text: '碳价把污染的社会成本变成企业成本。越早转型，越能把碳价从负担变成竞争优势。' }
  },
  {
    id: 'F_CARBON_SHOCK', years: [2033, 2038], future: true, title: '急刹车', era: '2030 年代 推演',
    cond: (s) => D_(s).climate === 'disorderly' && s.year >= s.world.milestones.shock,
    situation: '拖延了十年之后，各国突然一起出台严厉的碳税和高碳产品禁令。你的工厂和产品线里，有一半明年就可能不合规。',
    options: [
      { id: 'crash', text: '紧急停掉不合规的产品线，全力转型', hint: '壮士断腕',
        outcomes: [{ p: 1, title: '痛苦但活下来了', text: '收入掉了三成，两年后新产品线接上。', effects: [{ t: 'share', m: { '*': 0.8 } }, { t: 'cash', v: -0.06, min: 2e6 }, { t: 'mod', attract: { '*': 1.12 }, years: 8, from: 2 }] }] },
      { id: 'lobby', text: '联合同行游说，争取过渡期', hint: '拖时间',
        outcomes: [
          { p: 0.5, title: '争取到三年', text: '你有了更从容的转型时间。', effects: [{ t: 'cash', v: -0.02 }, { t: 'mod', attract: { '*': 1.02 }, years: 3 }] },
          { p: 0.5, title: '游说失败', text: '还被贴上了“气候拖后腿”的标签。', effects: [{ t: 'cash', v: -0.02 }, { t: 'brand', v: -8 }, { t: 'share', m: { '*': 0.85 } }] }
        ] },
      { id: 'buy', text: '收购一家早就转型的绿色对手', hint: '买转型',
        outcomes: [{ p: 1, title: '一步到位', text: '花了大价钱，但第二天就有合规产品可卖。', effects: [{ t: 'cash', v: -0.2, min: 5e6 }, { t: 'quality', v: 4 }, { t: 'mod', attract: { '*': 1.1 }, years: 8 }] }] }
    ],
    history: '推演依据：气候政策研究机构（如央行与监管机构绿色金融网络 NGFS）把“延迟后突然收紧”列为主要情景之一，这种情景下资产搁浅和经济冲击最大。',
    theory: { name: '搁浅资产', text: '政策突变时，原本值钱的工厂和设备会一夜之间变得不合规、不值钱。提前布局的企业损失最小。' }
  },
  {
    id: 'F_HEAT', years: [2044, 2060], future: true, title: '热到停工', era: '2040 年代 推演',
    cond: (s) => D_(s).climate === 'hothouse' && s.year >= s.world.milestones.hot,
    situation: '夏天的极端高温让南亚和东南亚的工厂每年停工一两个月，洪水还冲毁过两次港口。保险公司把热带地区的保费提高了三倍。',
    options: [
      { id: 'cool', text: '给工厂装大规模制冷，改造防洪设施', hint: '就地适应',
        outcomes: [{ p: 1, title: '扛住了', text: '成本上去了，但生产稳定。', effects: [{ t: 'cash', v: -0.07, min: 2e6 }, { t: 'mod', gm: -0.01, years: 10 }] }] },
      { id: 'north', text: '把工厂搬到气候温和的国家', hint: '躲开',
        outcomes: [{ p: 1, title: '北迁', text: '人工贵了，但不用再停工。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'level', c: 'MX', v: 3, sw: 2 }, { t: 'mod', gm: -0.005, years: 10 }] }] },
      { id: 'product', text: '开发适应高温的产品，比如降温、节水、防灾', hint: '把灾难变成需求',
        outcomes: [{ p: 1, title: '气候适应生意', text: '高温地区的顾客急需这些东西。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'mod', attract: { IN: 1.15, VN: 1.15, BR: 1.1, MX: 1.1 }, years: 10 }] }] },
      { id: 'insure', text: '买足保险，其他照旧', hint: '转移风险',
        outcomes: [{ p: 1, title: '保险越来越贵', text: '每年的保费都在涨。', effects: [{ t: 'mod', gm: -0.015, years: 10 }] }] }
    ],
    history: '推演依据：研究表明，高温已经在降低南亚和东南亚的劳动生产率；2011 年泰国大洪水曾让全球硬盘和汽车零件供应中断数月。',
    theory: { name: '气候适应', text: '减缓（减排）和适应（防灾）是应对气候变化的两条腿。在升温已成定局的情景里，适应能力本身就是竞争力。' }
  },
  {
    id: 'F_AGING', years: [2028, 2040], future: true, title: '没人干活了', era: '2030 年代 推演',
    situation: '中国、日本、德国的劳动年龄人口每年减少上百万，工厂招不到年轻人，退休的人越来越多。与此同时，老年人成了消费主力。',
    options: [
      { id: 'robot', text: '全面上机器人和自动化', hint: '机器换人',
        outcomes: [{ p: 1, title: '无人工厂', text: '前期投入大，之后不再为招工发愁。', effects: [{ t: 'cash', v: -0.08, min: 2e6 }, { t: 'mod', gm: 0.02, years: 15, from: 1 }] }] },
      { id: 'silver', text: '开发面向老年人的产品', hint: '银发经济',
        outcomes: [{ p: 1, title: '银发市场', text: '老年顾客忠诚度高、购买力强。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', attract: { JP: 1.15, DE: 1.12, CN: 1.1 }, years: 15 }] }] },
      { id: 'young', text: '把工厂和团队搬到印度、越南这些年轻国家', hint: '跟着年轻人走',
        outcomes: [{ p: 1, title: '年轻的团队', text: '人才充足，但管理和配套还要磨合。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'level', c: 'IN', v: 2 }, { t: 'mod', gm: 0.01, years: 10, from: 2 }] }] },
      { id: 'elder', text: '返聘退休老员工，弹性工作制', hint: '用好老人',
        outcomes: [{ p: 1, title: '经验回来了', text: '老员工带来了经验，也带来了更高的稳定性。', effects: [{ t: 'quality', v: 3 }, { t: 'mod', gm: -0.005, years: 8 }] }] }
    ],
    history: '推演依据：联合国人口预测显示，中国劳动年龄人口将在 2050 年前减少约两亿；日本 65 岁以上人口已接近三成。',
    theory: { name: '人口结构', text: '人口结构变化缓慢但几乎确定，是少数可以提前几十年布局的大趋势。' }
  },
  {
    id: 'F_INDIA', years: [2030, 2042], future: true, title: '印度时刻', era: '2030 年代 推演',
    cond: (s) => s.hq !== 'IN',
    situation: '印度经济规模冲向世界第三，十几亿人口里有几亿人正在进入中产阶层。印度政府推出新一轮开放政策，欢迎外资建厂。',
    options: [
      { id: 'big', text: '在印度建工厂和研发中心，当成第二个主场', hint: '重注',
        outcomes: [
          { p: 0.65, title: '第二主场', text: '印度成了你增长最快的市场。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'level', c: 'IN', v: 3, sw: 3 }, { t: 'brand', c: 'IN', v: 15 }, { t: 'mod', attract: { IN: 1.2 }, years: 12 }] },
          { p: 0.35, title: '规则太复杂', text: '各邦政策不一，土地和审批拖了好几年。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'level', c: 'IN', v: 2 }] }
        ] },
      { id: 'jv', text: '和印度大财团合资', hint: '借力',
        outcomes: [{ p: 1, title: '有了靠山', text: '合资伙伴搞定了渠道和关系，利润一人一半。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'level', c: 'IN', v: 2 }, { t: 'brand', c: 'IN', v: 10 }, { t: 'mod', gm: -0.005, years: 8 }] }] },
      { id: 'cheap', text: '专门为印度推出超低价产品', hint: '金字塔底层',
        outcomes: [{ p: 1, title: '走量', text: '销量巨大，利润微薄。', effects: [{ t: 'level', c: 'IN', v: 1 }, { t: 'mod', attract: { IN: 1.25 }, gm: -0.005, years: 10 }] }] },
      { id: 'skip', text: '印度太难做，不去', hint: '专注现有市场',
        outcomes: [{ p: 1, title: '错过了', text: '对手在印度长成了巨头。', effects: [] }] }
    ],
    history: '推演依据：国际货币基金组织预测印度将在 2020 年代末成为世界第三大经济体；苹果已把相当一部分 iPhone 产能转移到印度。',
    theory: { name: '金字塔底层的财富', text: '普拉哈拉德提出，为数十亿低收入人群设计负担得起的产品，本身就是巨大的商业机会，但需要完全不同的成本结构和渠道。' }
  },
  {
    id: 'F_SPACE', years: [2042, 2062], future: true, title: '去太空开工厂', era: '2040 年代 推演',
    cond: (s) => s.lastRev >= 5e8,
    situation: '火箭发射成本降到了二十年前的百分之一，月球基地开始商业运营。几家公司邀请你一起投资太空工厂：在失重环境里能做出地球上做不出的材料和药品。',
    options: [
      { id: 'invest', text: '投一大笔钱，做太空工厂的领投方', hint: '登月级的赌注',
        outcomes: [
          { p: 0.35, title: '太空红利', text: '太空工厂做出的新材料让你的产品领先一代。', effects: [{ t: 'cash', v: -0.15, min: 5e6 }, { t: 'quality', v: 12 }, { t: 'brand', v: 10 }] },
          { p: 0.65, title: '时间比想象的长', text: '技术可行，但十年内还赚不到钱。', effects: [{ t: 'cash', v: -0.15, min: 5e6 }, { t: 'brand', v: 4 }] }
        ] },
      { id: 'small', text: '小额参股，买一张门票', hint: '保留选择权',
        outcomes: [{ p: 1, title: '有了席位', text: '花钱不多，以后可以优先合作。', effects: [{ t: 'cash', v: -0.02 }, { t: 'quality', v: 2 }] }] },
      { id: 'brand', text: '赞助一次登月任务做品牌营销', hint: '只要名气',
        outcomes: [{ p: 1, title: '全世界都看到了', text: '你的标志出现在月球上。', effects: [{ t: 'cash', v: -0.03, min: 1e6 }, { t: 'brand', v: 8 }] }] },
      { id: 'no', text: '地球上的生意还没做完', hint: '不花钱',
        outcomes: [{ p: 1, title: '脚踏实地', text: '一切照旧。', effects: [] }] }
    ],
    history: '推演依据：可回收火箭已把近地轨道发射成本降低了一个数量级；国际空间站上已有在微重力下生长晶体和制造光纤的实验。',
    theory: { name: '实物期权', text: '面对高度不确定的新领域，小额投资“买一张门票”保留了未来加码的权利，常常比孤注一掷或完全观望更合理。' }
  },
  {
    id: 'F_QUANTUM', years: [2038, 2062], future: true, title: '密码失效', era: '2040 年代 推演',
    cond: (s) => s.year >= s.world.milestones.quantum,
    situation: '实用量子计算机问世，今天广泛使用的加密算法理论上几小时就能破解。你的客户数据、交易记录、设计图纸都用旧算法加密着。',
    options: [
      { id: 'upgrade', text: '立刻全面升级到抗量子加密', hint: '花大钱求安全',
        outcomes: [{ p: 1, title: '安全升级', text: '系统改造花了不少钱，客户更放心了。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'brand', v: 4 }] }] },
      { id: 'core', text: '只升级最核心的系统', hint: '抓重点',
        outcomes: [
          { p: 0.7, title: '够用了', text: '核心数据安全，次要系统慢慢换。', effects: [{ t: 'cash', v: -0.015, min: 5e5 }] },
          { p: 0.3, title: '边缘系统被攻破', text: '黑客从一个老系统偷走了客户资料。', effects: [{ t: 'cash', v: -0.03, min: 1e6 }, { t: 'brand', v: -8 }] }
        ] },
      { id: 'sell', text: '开发量子安全服务卖给别人', hint: '新生意',
        outcomes: [{ p: 1, title: '安全成了产品', text: '同行排队买你的方案。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', gm: 0.012, years: 8 }] }] },
      { id: 'wait', text: '量子计算机还很贵，黑客用不起', hint: '不花钱',
        outcomes: [
          { p: 0.4, title: '暂时没事', text: '量子算力还很稀缺。', effects: [] },
          { p: 0.6, title: '数据大泄露', text: '多年积累的加密数据被批量解开。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'brand', v: -14 }] }
        ] }
    ],
    history: '推演依据：美国国家标准与技术研究院 2024 年发布了首批抗量子密码标准，并建议机构尽早迁移；“先存储、后解密”的攻击已被视为现实威胁。',
    theory: { name: '技术债', text: '今天省下的升级成本，会以“技术债”的形式在未来连本带利地偿还。' }
  },
  {
    id: 'F_CBDC', years: [2028, 2040], future: true, title: '钱也换了', era: '2030 年代 推演',
    situation: '主要国家推出央行数字货币，跨境支付几秒到账、手续费接近零。可数字货币也让政府能实时看到每一笔交易。',
    options: [
      { id: 'adopt', text: '全面接入数字货币，跨境结算全部切换', hint: '省钱提速',
        outcomes: [{ p: 1, title: '结算成本大降', text: '每年省下大笔手续费和汇兑损失。', effects: [{ t: 'cash', v: -0.01 }, { t: 'mod', gm: 0.008, years: 12 }] }] },
      { id: 'own', text: '发行自己的会员积分币，打通全球会员', hint: '建自己的生态',
        outcomes: [
          { p: 0.5, title: '会员黏性大增', text: '全球会员用积分币消费，复购率上升。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', attract: { '*': 1.05 }, years: 8 }] },
          { p: 0.5, title: '监管叫停', text: '多国认定你的积分币违规。', effects: [{ t: 'cash', v: -0.04, min: 1e6 }, { t: 'brand', v: -4 }] }
        ] },
      { id: 'wait', text: '等标准统一再说', hint: '观望',
        outcomes: [{ p: 1, title: '慢半拍', text: '对手的结算成本比你低。', effects: [] }] }
    ],
    history: '推演依据：中国的数字人民币已在多个城市试点，国际清算银行的多边央行数字货币桥项目在测试跨境结算；超过一百个国家在研究央行数字货币。',
    theory: { name: '交易成本', text: '科斯指出，交易成本决定了企业和市场的边界。支付成本的大幅下降，会让跨境小额贸易变得更容易。' }
  },
  {
    id: 'F_VALUES', years: [2026, 2036], future: true, title: '年轻人用钱投票', era: '2020 年代末 推演',
    situation: '新一代消费者在社交平台上发起抵制，要求品牌公开表态：碳排放、工人待遇、数据隐私……一次表态失误就可能被全网抵制，可不表态也会被批评“冷漠”。',
    options: [
      { id: 'radical', text: '彻底透明：公开所有供应链、碳排放和薪酬数据', hint: '把自己摊开',
        outcomes: [
          { p: 0.65, title: '年轻人的偶像品牌', text: '透明带来了信任，年轻顾客成了你的忠实粉丝。', effects: [{ t: 'cash', v: -0.02 }, { t: 'brand', v: 10 }] },
          { p: 0.35, title: '被扒出问题', text: '公开的数据里有几处不好看的地方，被放大批评。', effects: [{ t: 'cash', v: -0.02 }, { t: 'brand', v: -4 }] }
        ] },
      { id: 'local', text: '各国分别处理，按当地价值观表态', hint: '入乡随俗',
        outcomes: [
          { p: 0.6, title: '各地都满意', text: '本地化公关效果不错。', effects: [{ t: 'brand', v: 3 }] },
          { p: 0.4, title: '被指“双标”', text: '有人把你在不同国家的表态放在一起对比。', effects: [{ t: 'brand', v: -9 }] }
        ] },
      { id: 'quiet', text: '只谈产品，不碰社会议题', hint: '低调',
        outcomes: [{ p: 1, title: '平淡', text: '没有大风波，也没有新粉丝。', effects: [{ t: 'brand', v: -1 }] }] }
    ],
    history: '推演依据：调查显示 Z 世代更愿意为价值观契合的品牌付费，也更容易发起线上抵制；欧盟《企业可持续发展报告指令》要求大公司披露大量环境和社会数据。',
    theory: { name: '品牌与价值观', text: '当信息完全透明，品牌说什么和做什么的差距会被迅速发现。一致性比表态本身更重要。' }
  },
  {
    id: 'F_AR', years: [2032, 2042], future: true, title: '手机消失了', era: '2030 年代 推演',
    situation: '轻便的增强现实眼镜取代了手机：人们看一眼货架就能比价，商品信息直接浮在眼前。谁能出现在眼镜的“视野”里，谁就有生意。',
    options: [
      { id: 'native', text: '为眼镜重新设计所有产品展示和购买流程', hint: '全面拥抱',
        outcomes: [{ p: 1, title: '眼镜原生品牌', text: '你的产品在眼镜里最好看、最好买。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'mod', attract: { '*': 1.08 }, years: 10 }] }] },
      { id: 'pay', text: '花钱买眼镜平台的推荐位', hint: '买流量',
        outcomes: [{ p: 1, title: '曝光很高，成本也高', text: '流量费每年都在涨。', effects: [{ t: 'mod', attract: { '*': 1.06 }, gm: -0.012, years: 6 }] }] },
      { id: 'physical', text: '反其道而行：做“看得见摸得着”的线下体验', hint: '回归真实',
        outcomes: [{ p: 1, title: '真实成了卖点', text: '一部分人厌倦了虚拟世界，愿意来店里。', effects: [{ t: 'brand', v: 5 }, { t: 'mod', attract: { '*': 0.98 }, years: 6 }] }] }
    ],
    history: '推演依据：苹果、Meta、谷歌等公司都在投入轻量化增强现实眼镜，业界普遍认为它有可能成为继手机之后的下一个计算平台。',
    theory: { name: '平台迁移', text: '每一次计算平台的迁移（电脑→手机→眼镜）都会重新分配流量和渠道权力，早期适配的品牌能占到便宜。' }
  },
  {
    id: 'F_FUSION', years: [2052, 2070], future: true, title: '能源几乎免费', era: '2050 年代 推演',
    cond: (s) => D_(s).climate !== 'hothouse' && s.industry !== 'energy',
    situation: '第一座商业聚变电站并网，专家预测十年后电价会降到今天的十分之一。高耗能的生产方式突然变得便宜了。',
    options: [
      { id: 'reshore', text: '把工厂搬回本国：人工不再是主要成本，电便宜就行', hint: '再工业化',
        outcomes: [{ p: 1, title: '工厂回家', text: '离市场更近，交货更快。', effects: [{ t: 'cash', v: -0.08, min: 3e6 }, { t: 'level', c: '{HQ}', v: 3 }, { t: 'mod', attract: { '{HQ}': 1.08 }, gm: 0.01, years: 10 }] }] },
      { id: 'new', text: '开发以前因为太耗电做不了的新产品', hint: '新可能',
        outcomes: [
          { p: 0.6, title: '新品类诞生', text: '便宜的电让你的新产品成为可能。', effects: [{ t: 'cash', v: -0.05, min: 2e6 }, { t: 'quality', v: 8 }, { t: 'mod', attract: { '*': 1.08 }, years: 10 }] },
          { p: 0.4, title: '对手也想到了', text: '新品类很快挤满了竞争者。', effects: [{ t: 'cash', v: -0.05, min: 2e6 }, { t: 'quality', v: 3 }] }
        ] },
      { id: 'wait', text: '等电价真的降下来再说', hint: '谨慎',
        outcomes: [{ p: 1, title: '跟着大家一起受益', text: '电价下降让所有人都省了钱。', effects: [{ t: 'mod', gm: 0.008, years: 10, from: 3 }] }] }
    ],
    ctx: (s) => ({ HQ: s.hq }),
    history: '推演依据：2022 年美国国家点火装置首次实现聚变“净能量增益”，多家私营聚变公司计划在 2030 年代建设示范电站。',
    theory: { name: '要素价格革命', text: '当一种关键生产要素（能源、算力、运输）的价格骤降，产业布局和产品形态都会被重新洗牌。' }
  },
  {
    id: 'F_SUCCESSION', years: [2040, 2060], future: true, title: '谁来接班', era: '传承 推演',
    cond: (s) => (s.startYear || 1995) <= 2015 && s.year - (s.startYear || 1995) >= 30,
    situation: '你已经掌舵三十多年，身体和精力都不如从前。董事会请你在两年内确定接班方案。',
    options: [
      { id: 'family', text: '交给子女', hint: '家族传承',
        outcomes: [
          { p: 0.5, title: '青出于蓝', text: '下一代带来了新思路。', effects: [{ t: 'quality', v: 4 }, { t: 'brand', c: '{HQ}', v: 4 }] },
          { p: 0.5, title: '家族内斗', text: '兄弟姐妹争权，公司停滞了好几年。', effects: [{ t: 'mod', attract: { '*': 0.9 }, years: 4 }, { t: 'brand', v: -6 }] }
        ] },
      { id: 'pro', text: '从外面请一位顶级职业经理人', hint: '专业治理',
        outcomes: [{ p: 1, title: '平稳过渡', text: '新 CEO 带来了规范的管理，也带走了一些创业的冲劲。', effects: [{ t: 'mod', gm: 0.01, attract: { '*': 0.97 }, years: 8 }] }] },
      { id: 'inside', text: '提拔一位跟了你二十年的老部下', hint: '内部培养',
        outcomes: [{ p: 1, title: '文化延续', text: '团队稳定，战略连贯。', effects: [{ t: 'brand', v: 2 }] }] },
      { id: 'ai', text: '让 AI 系统担任 CEO，董事会监督', hint: '前所未有',
        outcomes: [
          { p: 0.5, title: '史上第一位 AI CEO', text: '决策又快又准，全世界都在关注你。', effects: [{ t: 'mod', gm: 0.02, years: 10 }, { t: 'brand', v: 6 }] },
          { p: 0.5, title: '员工和客户不买账', text: '人们不愿意为一台机器工作。', effects: [{ t: 'brand', v: -8 }, { t: 'mod', attract: { '*': 0.93 }, years: 4 }] }
        ] }
    ],
    ctx: (s) => ({ HQ: s.hq }),
    history: '推演依据：研究显示，能顺利传到第三代的家族企业不到一成；也有公司已在尝试让 AI 参与董事会决策。',
    theory: { name: '继任规划', text: '创始人离开是企业最大的风险之一。好的继任规划要提前很多年开始，并把“人”和“制度”都交接好。' }
  },
  {
    id: 'F_ROBOT_TAX', years: [2036, 2048], future: true, title: '机器人税', era: '2040 年代 推演',
    cond: (s) => D_(s).tech === 'ai_boom' && s.year >= s.world.milestones.robots,
    situation: '机器人和 AI 替代了大量工作岗位，多国政府提议对“每一个被机器替代的岗位”征税，用来资助失业者和全民基本收入。',
    options: [
      { id: 'comply', text: '接受机器人税，并公开支持全民基本收入', hint: '顺应民意',
        outcomes: [{ p: 1, title: '赢得社会认可', text: '多交了税，但政府和公众把你当成负责任的企业。', effects: [{ t: 'mod', gm: -0.015, years: 10 }, { t: 'brand', v: 8 }] }] },
      { id: 'move', text: '把自动化工厂搬到不征税的国家', hint: '避税',
        outcomes: [{ p: 1, title: '省了税，丢了名声', text: '本国舆论骂你“只要机器不要人”。', effects: [{ t: 'cash', v: -0.05, min: 2e6 }, { t: 'brand', c: '{HQ}', v: -10 }, { t: 'mod', gm: 0.01, years: 8 }] }] },
      { id: 'hybrid', text: '保留一部分人工岗位，转做服务和创意工作', hint: '人机混合',
        outcomes: [{ p: 1, title: '平衡之道', text: '税交得少一些，员工也稳定。', effects: [{ t: 'mod', gm: -0.005, years: 8 }, { t: 'quality', v: 3 }] }] },
      { id: 'lobby', text: '联合行业游说反对', hint: '对抗',
        outcomes: [
          { p: 0.4, title: '法案被搁置', text: '你们赢了，暂时。', effects: [{ t: 'cash', v: -0.01 }] },
          { p: 0.6, title: '民意反弹', text: '法案通过，而且税率更高。', effects: [{ t: 'cash', v: -0.01 }, { t: 'mod', gm: -0.02, years: 10 }, { t: 'brand', v: -5 }] }
        ] }
    ],
    ctx: (s) => ({ HQ: s.hq }),
    history: '推演依据：比尔·盖茨等人曾公开提出征收“机器人税”；芬兰、美国多个城市做过全民基本收入的小规模试验。',
    theory: { name: '自动化的分配问题', text: '技术带来的生产率提升如果只归资本所有者，会加剧不平等并引发政治反弹。企业的“社会许可”也是一种资产。' }
  },
  {
    id: 'F_LONGEVITY', years: [2048, 2068], future: true, title: '人人活到一百岁', era: '2050 年代 推演',
    situation: '抗衰老疗法普及，发达国家的平均寿命接近一百岁。人们工作到八十岁、六十岁再创业，消费习惯也彻底改变了。',
    options: [
      { id: 'design', text: '重新设计产品，照顾不同年龄段的需求', hint: '全年龄',
        outcomes: [{ p: 1, title: '全年龄品牌', text: '从二十岁到一百岁，人人都用得上。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', attract: { '*': 1.06 }, years: 12 }] }] },
      { id: 'hire', text: '大量招聘七八十岁的“超级老员工”', hint: '经验红利',
        outcomes: [{ p: 1, title: '经验丰富的团队', text: '老员工经验足，流失率低。', effects: [{ t: 'quality', v: 4 }, { t: 'mod', gm: -0.005, years: 8 }] }] },
      { id: 'youth', text: '专攻年轻人：在老龄社会里做最年轻的品牌', hint: '逆势',
        outcomes: [{ p: 1, title: '小众但鲜明', text: '年轻人越来越少，但他们非常认你。', effects: [{ t: 'brand', v: 5 }, { t: 'mod', attract: { IN: 1.08, VN: 1.08, '*': 0.97 }, years: 10 }] }] }
    ],
    history: '推演依据：全球人均寿命在过去一百年里几乎翻了一番，多家公司在研究延缓衰老的药物和基因疗法。',
    theory: { name: '百岁人生', text: '林达·格拉顿等人认为，长寿会把“学习—工作—退休”的三段式人生变成多段式，消费和就业都会随之重构。' }
  },
  {
    id: 'F_DATA_WALL', years: [2030, 2040], future: true, title: '数据不能出境', era: '2030 年代 推演',
    cond: (s) => s.industry === 'software' || s.industry === 'electronics' || D_(s).geo !== 'open',
    situation: '越来越多国家要求本国用户的数据必须存在本国、由本国公司管理，违者重罚甚至封禁。',
    options: [
      { id: 'local', text: '在每个市场建本地数据中心，交给本地团队', hint: '最合规',
        outcomes: [{ p: 1, title: '处处合规', text: '成本高了，但没有一个国家找你麻烦。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'mod', gm: -0.01, years: 10 }, { t: 'mod', attract: { '*': 1.04 }, years: 10 }] }] },
      { id: 'partner', text: '和各国本土公司合作，由它们托管数据', hint: '借本地公司',
        outcomes: [{ p: 1, title: '本地伙伴网络', text: '合规成本低，但数据价值要和伙伴分享。', effects: [{ t: 'mod', gm: -0.008, years: 10 }] }] },
      { id: 'core', text: '只做数据规则宽松的大市场', hint: '收缩',
        outcomes: [{ p: 1, title: '版图缩小', text: '退出了几个严格的国家。', effects: [{ t: 'share', m: { CN: 0.7, IN: 0.8 } }] }] }
    ],
    history: '推演依据：中国《数据安全法》、印度《数字个人数据保护法》、欧盟 GDPR 都对数据跨境作出限制，“数据本地化”要求在全球持续增加。',
    theory: { name: '数字主权', text: '数据被视为国家战略资源后，全球统一的数字服务会被迫“本地化”，规模经济让位于合规能力。' }
  },
  {
    id: 'F_AFRICA', years: [2045, 2070], future: true, title: '下一个十亿人', era: '2050 年代 推演',
    cond: (s) => s.lastRev >= 2e8,
    situation: '非洲人口超过二十五亿，是全世界最年轻的大陆。几个非洲大国的经济增速连续十年超过 6%，各国企业开始抢滩。',
    options: [
      { id: 'go', text: '在非洲建区域总部和工厂', hint: '开拓新大陆',
        outcomes: [
          { p: 0.6, title: '新大陆的先行者', text: '非洲业务快速成长，成了新的增长引擎。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'mod', attract: { '*': 1.06 }, gm: 0.005, years: 15, from: 2 }] },
          { p: 0.4, title: '基础设施拖后腿', text: '电力、物流都不稳定，前几年一直亏钱。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'mod', attract: { '*': 1.02 }, years: 10, from: 4 }] }
        ] },
      { id: 'export', text: '先通过当地经销商出口', hint: '小步试探',
        outcomes: [{ p: 1, title: '有了据点', text: '销量不大，但积累了经验。', effects: [{ t: 'cash', v: -0.02 }, { t: 'mod', attract: { '*': 1.02 }, years: 10 }] }] },
      { id: 'no', text: '暂不考虑', hint: '专注现有市场',
        outcomes: [{ p: 1, title: '按兵不动', text: '对手在非洲站稳了脚跟。', effects: [] }] }
    ],
    history: '推演依据：联合国预测非洲人口将在 2050 年前后达到约 25 亿，占全球四分之一，届时全球每四个年轻人中就有一个是非洲人。',
    theory: { name: '前沿市场', text: '前沿市场风险高、基础设施弱，但竞争少、增长快。早进入的企业可以塑造当地的消费习惯和行业标准。' }
  },
  {
    id: 'F_WATER', years: [2050, 2068], future: true, title: '缺水', era: '2050 年代 推演',
    cond: (s) => D_(s).climate === 'hothouse' && physical(s),
    situation: '干旱让多个地区实行工业用水配额，水价涨了五倍。你的生产离不开大量用水。',
    options: [
      { id: 'recycle', text: '建循环水系统，用水量减少八成', hint: '一次性投入',
        outcomes: [{ p: 1, title: '节水工厂', text: '不再受配额限制。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'mod', gm: 0.01, years: 12, from: 1 }] }] },
      { id: 'move', text: '把工厂搬到水资源丰富的地区', hint: '跟着水走',
        outcomes: [{ p: 1, title: '搬迁完成', text: '离市场远了一些，但水不再是问题。', effects: [{ t: 'cash', v: -0.08, min: 3e6 }] }] },
      { id: 'pay', text: '高价买水，维持生产', hint: '硬扛',
        outcomes: [{ p: 1, title: '成本飙升', text: '每年的水费都在涨。', effects: [{ t: 'mod', gm: -0.02, years: 10 }] }] }
    ],
    history: '推演依据：世界资源研究所估计，全球四分之一人口生活在极度缺水地区；美国西部和印度部分地区已在实行严格的用水限制。',
    theory: { name: '资源约束', text: '当一种曾经免费的资源变得稀缺，节约它的技术就会成为新的竞争优势。' }
  },
  {
    id: 'F_4DAY', years: [2030, 2045], future: true, title: '每周上四天班', era: '2030 年代 推演',
    situation: 'AI 让生产率大幅提高，多国开始推行每周四天工作制。年轻人找工作时，第一个问题就是“你们上几天班”。',
    options: [
      { id: 'adopt', text: '全公司实行四天工作制，工资不变', hint: '吸引人才',
        outcomes: [
          { p: 0.65, title: '人才抢着来', text: '员工效率不降反升，招聘变得容易。', effects: [{ t: 'quality', v: 4 }, { t: 'brand', v: 4 }] },
          { p: 0.35, title: '交付变慢', text: '部分团队适应不了，客户抱怨响应慢。', effects: [{ t: 'quality', v: 1 }, { t: 'mod', attract: { '*': 0.97 }, years: 2 }] }
        ] },
      { id: 'flex', text: '让各团队自己决定', hint: '灵活',
        outcomes: [{ p: 1, title: '各取所需', text: '没有大变化，员工满意度略升。', effects: [{ t: 'quality', v: 1 }] }] },
      { id: 'no', text: '坚持五天，多付加班费留人', hint: '传统',
        outcomes: [{ p: 1, title: '人才流失', text: '年轻人去了上四天班的对手那里。', effects: [{ t: 'quality', v: -3 }, { t: 'mod', gm: -0.005, years: 4 }] }] }
    ],
    history: '推演依据：英国、冰岛等地的四天工作制试点显示，多数参与企业生产率没有下降，员工流失率明显降低。',
    theory: { name: '效率工资', text: '给员工高于市场的待遇，可以换来更高的努力程度和更低的流失率，从而抵消成本。' }
  },
  {
    id: 'F_AI_CEO', years: [2050, 2068], future: true, title: '让 AI 做决策', era: '2050 年代 推演',
    cond: (s) => D_(s).tech === 'ai_boom' && s.year >= (s.world.milestones.agi || 2050),
    situation: '通用人工智能已经能比任何人类高管更准确地预测市场。几家对手宣布把战略决策交给 AI，人类只负责监督和价值观。',
    options: [
      { id: 'full', text: '把日常经营全部交给 AI', hint: '彻底交棒',
        outcomes: [
          { p: 0.6, title: '前所未有的效率', text: 'AI 的决策又快又准。', effects: [{ t: 'mod', gm: 0.03, attract: { '*': 1.06 }, years: 10 }] },
          { p: 0.4, title: '黑天鹅', text: 'AI 没见过的情况出现时，它犯了人类不会犯的错。', effects: [{ t: 'cash', v: -0.08, min: 3e6 }, { t: 'brand', v: -8 }] }
        ] },
      { id: 'advisor', text: 'AI 当顾问，人类拍板', hint: '人机协作',
        outcomes: [{ p: 1, title: '最好的组合', text: 'AI 提供分析，人类判断价值和风险。', effects: [{ t: 'mod', gm: 0.015, years: 10 }] }] },
      { id: 'human', text: '坚持人类决策，打“人性化企业”牌', hint: '差异化',
        outcomes: [{ p: 1, title: '有温度的公司', text: '效率不如对手，但有一群忠实的顾客和员工。', effects: [{ t: 'brand', v: 6 }, { t: 'mod', attract: { '*': 0.97 }, years: 6 }] }] }
    ],
    history: '推演依据：已有企业让 AI 参与投资决策和董事会讨论；学界在讨论 AI 能否以及应否承担法律意义上的管理责任。',
    theory: { name: '委托—代理问题', text: '把决策交给 AI，就像把公司交给职业经理人：效率可能更高，但如何确保它的目标和股东、社会一致，是新的治理难题。' }
  },
  {
    id: 'F_DEGLOBAL_OPEN', years: [2045, 2060], future: true, title: '贸易摩擦又来了', era: '2040 年代 推演',
    cond: (s) => D_(s).geo === 'multi',
    situation: '全球贸易规则四分五裂，美欧之间也互加关税。今天的盟友明天就可能变成对手，企业很难做长期规划。',
    options: [
      { id: 'everywhere', text: '在每个大市场都建本地工厂，“在哪卖就在哪造”', hint: '最抗关税',
        outcomes: [{ p: 1, title: '本地化堡垒', text: '关税影响降到最低，但规模效应也没了。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'mod', gm: -0.01, attract: { '*': 1.06 }, years: 12 }] }] },
      { id: 'flex', text: '保持多个产地，根据关税随时切换', hint: '灵活供应链',
        outcomes: [{ p: 1, title: '见招拆招', text: '供应链管理成本高，但总能找到最便宜的路线。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', gm: 0.008, years: 10 }] }] },
      { id: 'home', text: '收缩回本国和周边市场', hint: '区域化',
        outcomes: [{ p: 1, title: '区域化经营', text: '风险小了，增长也慢了。', effects: [{ t: 'mod', attract: { '{HQ}': 1.08, '*': 0.95 }, years: 10 }] }] }
    ],
    ctx: (s) => ({ HQ: s.hq }),
    history: '推演依据：世界贸易组织争端解决机制自 2019 年起陷入停摆，区域和双边协定数量持续增加，“贸易碎片化”成为国际组织频繁讨论的风险。',
    theory: { name: '供应链的“韧性—效率”权衡', text: '规则越不稳定，冗余和灵活性就越值钱。最优的供应链不再是最便宜的那条，而是“足够便宜又不容易断”的那几条。' }
  }
];

module.exports = { CASES_F };
