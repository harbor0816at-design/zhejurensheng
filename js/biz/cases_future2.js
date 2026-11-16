// 各行业的未来案例（推演）。
const D_ = (s) => s.world.dials;

const CASES_F2 = [
  // ---------------- 消费电子 ----------------
  {
    id: 'FE1_GLASSES', years: [2031, 2040], industry: 'electronics', future: true, title: '下一块屏幕', era: '2030 年代 推演',
    situation: '增强现实眼镜正在取代手机，几家巨头在抢操作系统和应用商店。你可以自己做眼镜，也可以给别人的眼镜做零件。',
    options: [
      { id: 'own', text: '自己做眼镜和操作系统', hint: '争夺平台',
        outcomes: [
          { p: 0.4, title: '三大平台之一', text: '你的眼镜系统占据了一席之地，应用商店带来源源不断的收入。', effects: [{ t: 'cash', v: -0.15, min: 4e6 }, { t: 'quality', v: 10 }, { t: 'mod', attract: { '*': 1.15 }, gm: 0.02, years: 12, from: 2 }] },
          { p: 0.6, title: '生态做不起来', text: '眼镜不错，但开发者不愿意为一个小平台写应用。', effects: [{ t: 'cash', v: -0.15, min: 4e6 }, { t: 'quality', v: 4 }] }
        ] },
      { id: 'parts', text: '专做光学模组和微型显示屏，卖给所有品牌', hint: '卖铲子',
        outcomes: [{ p: 1, title: '隐形冠军', text: '不管谁家的眼镜卖得好，里面都有你的零件。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'mod', gm: 0.025, years: 12, from: 1 }] }] },
      { id: 'android', text: '加入开放平台，做性价比最高的眼镜', hint: '跟随者',
        outcomes: [{ p: 1, title: '销量冠军', text: '你的眼镜卖得最多，但利润很薄。', effects: [{ t: 'mod', attract: { '*': 1.1 }, gm: -0.01, years: 10 }] }] },
      { id: 'phone', text: '坚守手机，眼镜只是配件', hint: '守旧',
        outcomes: [{ p: 1, title: '手机时代落幕', text: '手机销量逐年下滑。', effects: [{ t: 'mod', attract: { '*': 0.85 }, years: 10, from: 3 }] }] }
    ],
    history: '推演依据：主要科技公司都在研发轻量化增强现实眼镜，分析机构普遍认为它可能在 2030 年代成为主流计算设备。',
    theory: { name: '平台与互补品', text: '平台的价值来自互补品（应用）的数量，而互补品又跟着用户走。这种正反馈让平台竞争常常只剩两三家。' }
  },
  {
    id: 'FE2_BCI', years: [2050, 2066], industry: 'electronics', future: true, title: '用意念打字', era: '2050 年代 推演',
    situation: '非侵入式脑机接口终于成熟：戴上一个头环就能用意念打字、控制设备。监管机构还没想好怎么保护“脑数据”。',
    options: [
      { id: 'launch', text: '抢先推出消费级脑机头环', hint: '第一个吃螃蟹',
        outcomes: [
          { p: 0.5, title: '开创新品类', text: '头环成了年轻人的新潮装备。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'quality', v: 8 }, { t: 'mod', attract: { '*': 1.12 }, years: 10 }] },
          { p: 0.5, title: '隐私风暴', text: '有人发现头环在收集用户的情绪数据，被多国调查。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'brand', v: -10 }] }
        ] },
      { id: 'medical', text: '先做医疗用途，帮瘫痪病人恢复交流', hint: '从医疗切入',
        outcomes: [{ p: 1, title: '有温度的技术', text: '医疗市场不大，但为你赢得了信任和数据。', effects: [{ t: 'cash', v: -0.05, min: 2e6 }, { t: 'brand', v: 8 }, { t: 'quality', v: 5 }] }] },
      { id: 'wait', text: '等监管规则明确再说', hint: '谨慎',
        outcomes: [{ p: 1, title: '让别人趟雷', text: '规则明确后你才进入，市场已被瓜分大半。', effects: [] }] }
    ],
    history: '推演依据：多家公司已在开展脑机接口人体试验，帮助瘫痪患者用意念控制电脑；智利等国已经在宪法或法律中提出“神经权利”。',
    theory: { name: '负责任的创新', text: '越是触及人身和隐私的技术，越需要在推出之前就设计好伦理和安全边界，否则一次丑闻可能毁掉整个品类。' }
  },
  // ---------------- 饮料 ----------------
  {
    id: 'FB1_GLP1', years: [2026, 2032], industry: 'beverage', future: true, title: '减肥针来了', era: '2020 年代末 推演',
    situation: '一类每周打一针就能大幅降低食欲的减肥药迅速普及，美国超过一成成年人在用。零食和含糖饮料的销量开始明显下滑。',
    options: [
      { id: 'protein', text: '推出高蛋白、小份量、功能型饮品，专门服务用药人群', hint: '顺势而为',
        outcomes: [{ p: 1, title: '新需求', text: '用药的人吃得少，但更在乎营养。你的新品卖得很好。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', attract: { US: 1.12, UK: 1.08, '*': 1.03 }, gm: 0.01, years: 8 }] }] },
      { id: 'emerging', text: '把增长重心转向药还没普及的新兴市场', hint: '换地方卖',
        outcomes: [{ p: 1, title: '东方不亮西方亮', text: '新兴市场需求还在增长。', effects: [{ t: 'mod', attract: { IN: 1.12, BR: 1.1, VN: 1.1, MX: 1.08, US: 0.92 }, years: 8 }] }] },
      { id: 'small', text: '缩小包装、提高单价', hint: '吃得少就卖贵一点',
        outcomes: [{ p: 1, title: '利润守住了', text: '销量降了，但每罐更赚钱。', effects: [{ t: 'mod', gm: 0.02, attract: { '*': 0.95 }, years: 6 }] }] },
      { id: 'ignore', text: '只是一阵风', hint: '不变',
        outcomes: [{ p: 1, title: '销量持续下滑', text: '这不是一阵风。', effects: [{ t: 'mod', attract: { US: 0.85, UK: 0.88, '*': 0.95 }, years: 8 }] }] }
    ],
    history: '推演依据：GLP-1 类减肥药在 2023–2024 年需求爆发，多家零售和食品公司表示观察到用药者购买的零食和饮料明显减少。',
    theory: { name: '替代品威胁', text: '五力模型中的“替代品”不一定来自同行。一种药就可能改变整个食品饮料行业的需求曲线。' }
  },
  {
    id: 'FB2_PERSONAL', years: [2040, 2055], industry: 'beverage', future: true, title: '每人一瓶专属配方', era: '2040 年代 推演',
    situation: '可穿戴设备实时监测每个人的血糖、电解质和情绪，饮料机可以当场按个人数据调配一杯“专属饮料”。',
    options: [
      { id: 'machine', text: '在全球铺设智能调配机，按订阅收费', hint: '从卖瓶子到卖服务',
        outcomes: [
          { p: 0.6, title: '订阅帝国', text: '数千万用户按月订阅，收入稳定。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'mod', gm: 0.03, attract: { '*': 1.08 }, years: 12, from: 1 }] },
          { p: 0.4, title: '机器维护是噩梦', text: '设备故障率高，用户流失快。', effects: [{ t: 'cash', v: -0.12, min: 3e6 }, { t: 'brand', v: -4 }] }
        ] },
      { id: 'data', text: '和健康数据平台合作，只做配方', hint: '轻资产',
        outcomes: [{ p: 1, title: '配方大脑', text: '你的配方算法装进了别人的机器里。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', gm: 0.015, years: 10 }] }] },
      { id: 'classic', text: '坚持经典口味，打“熟悉的味道”', hint: '怀旧',
        outcomes: [{ p: 1, title: '经典永流传', text: '一部分人就爱老味道。', effects: [{ t: 'brand', v: 4 }, { t: 'mod', attract: { '*': 0.95 }, years: 8 }] }] }
    ],
    history: '推演依据：连续血糖监测仪已经开始面向普通消费者销售；一些饮料公司在测试根据用户数据调配的个性化饮品。',
    theory: { name: '大规模定制', text: '数字技术让“为每个人定制”的成本接近大批量生产，商业模式也从卖产品转向卖订阅和服务。' }
  },
  // ---------------- 软件 ----------------
  {
    id: 'FS1_CODE', years: [2028, 2035], industry: 'software', future: true, title: 'AI 写完了所有代码', era: '2030 年代 推演',
    cond: (s) => D_(s).tech !== 'ai_winter',
    situation: 'AI 已经能根据一句话需求写出完整的软件。你的客户开始问：我为什么还要买你的软件，而不是让 AI 现写一个？',
    options: [
      { id: 'platform', text: '转型成“AI 生成软件”的平台，让客户自己生成', hint: '自我颠覆',
        outcomes: [
          { p: 0.55, title: '平台化成功', text: '客户在你的平台上生成了数百万个应用。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'mod', attract: { '*': 1.15 }, years: 10, from: 1 }] },
          { p: 0.45, title: '大模型公司抢了生意', text: '它们直接提供了同样的服务，价格更低。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'mod', attract: { '*': 0.95 }, years: 5 }] }
        ] },
      { id: 'data', text: '守住行业数据和客户关系，卖“结果”不卖软件', hint: '护城河在数据',
        outcomes: [{ p: 1, title: '数据护城河', text: 'AI 可以写代码，但写不出你积累了几十年的行业数据。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'mod', gm: 0.02, years: 10 }] }] },
      { id: 'cut', text: '用 AI 把成本砍到最低，打价格战', hint: '成本领先',
        outcomes: [{ p: 1, title: '价格屠夫', text: '价格只有原来的五分之一，份额上去了。', effects: [{ t: 'mod', attract: { '*': 1.1 }, gm: -0.05, years: 8 }] }] },
      { id: 'human', text: '主打人工定制和安全审计的高端服务', hint: '高端小众',
        outcomes: [{ p: 1, title: '小而美', text: '收入规模下降，但利润率很高。', effects: [{ t: 'mod', attract: { '*': 0.88 }, gm: 0.04, years: 10 }] }] }
    ],
    history: '推演依据：AI 编程助手已经能生成相当比例的代码，一些创业公司宣称可以用自然语言生成完整应用。软件行业的商业模式正在被重新讨论。',
    theory: { name: '护城河', text: '当产品本身可以被廉价复制，真正的护城河会转移到数据、网络效应、客户关系和品牌上。' }
  },
  {
    id: 'FS2_OPEN', years: [2034, 2050], industry: 'software', future: true, title: '开源模型免费了', era: '2030 年代 推演',
    situation: '一个性能顶尖的 AI 模型被完全开源，任何人都能免费使用和修改。靠卖 AI 接口赚钱的公司股价暴跌。',
    options: [
      { id: 'embrace', text: '基于开源模型做行业应用，把钱花在产品上', hint: '站在巨人肩上',
        outcomes: [{ p: 1, title: '成本骤降', text: '模型免费了，你的利润率大幅提升。', effects: [{ t: 'mod', gm: 0.04, years: 10 }] }] },
      { id: 'contribute', text: '加入开源社区，成为主要贡献者', hint: '影响标准',
        outcomes: [{ p: 1, title: '社区领袖', text: '你在开源社区有了话语权，人才也慕名而来。', effects: [{ t: 'cash', v: -0.03 }, { t: 'quality', v: 6 }, { t: 'brand', v: 5 }] }] },
      { id: 'closed', text: '坚持自研闭源模型，强调安全和服务', hint: '差异化',
        outcomes: [
          { p: 0.4, title: '企业客户买账', text: '大企业更信任有人负责的闭源服务。', effects: [{ t: 'mod', gm: 0.01, years: 8 }] },
          { p: 0.6, title: '越来越难卖', text: '免费的够用，客户不愿意多花钱。', effects: [{ t: 'mod', attract: { '*': 0.88 }, years: 6 }] }
        ] }
    ],
    history: '推演依据：Meta 的 Llama、DeepSeek 等开源或开放权重模型已经在部分任务上接近顶尖闭源模型，大幅降低了 AI 应用的成本。',
    theory: { name: '互补品商品化', text: '乔尔·斯波尔斯基提出：聪明的公司会努力让自己产品的互补品变得便宜甚至免费。模型免费，应用就更值钱。' }
  },
  // ---------------- 汽车 ----------------
  {
    id: 'FA1_ROBOTAXI', years: [2033, 2045], industry: 'auto', future: true, title: '没人买车了', era: '2030 年代 推演',
    situation: '无人驾驶出租车遍布大城市，打车比养车便宜得多。年轻人不再考驾照，私家车销量每年下降。',
    options: [
      { id: 'fleet', text: '自己运营无人出租车车队，卖出行服务', hint: '从卖车到卖里程',
        outcomes: [
          { p: 0.55, title: '出行巨头', text: '你的车队每天跑上亿公里，收入稳定增长。', effects: [{ t: 'cash', v: -0.15, min: 5e6 }, { t: 'mod', attract: { '*': 1.15 }, gm: 0.03, years: 15, from: 2 }] },
          { p: 0.45, title: '运营太烧钱', text: '车队维护和保险成本远超预期。', effects: [{ t: 'cash', v: -0.18, min: 5e6 }, { t: 'mod', gm: -0.01, years: 5 }] }
        ] },
      { id: 'supply', text: '专门给出行平台造车，大批量低价', hint: '做代工',
        outcomes: [{ p: 1, title: '平台的造车厂', text: '订单量大，但议价权在平台手里。', effects: [{ t: 'mod', attract: { '*': 1.1 }, gm: -0.03, years: 12 }] }] },
      { id: 'luxury', text: '转做“驾驶乐趣”的高端车', hint: '少而精',
        outcomes: [{ p: 1, title: '情怀生意', text: '销量小，但愿意自己开车的人肯花大钱。', effects: [{ t: 'mod', attract: { '*': 0.8 }, gm: 0.06, years: 15 }, { t: 'brand', v: 6 }] }] },
      { id: 'hold', text: '继续卖私家车', hint: '老路',
        outcomes: [{ p: 1, title: '市场萎缩', text: '销量一年比一年少。', effects: [{ t: 'mod', attract: { '*': 0.85 }, years: 10, from: 2 }] }] }
    ],
    history: '推演依据：Waymo、百度萝卜快跑等无人驾驶出租车已在多个城市商业运营；研究认为共享无人驾驶可能显著减少私家车保有量。',
    theory: { name: '产品即服务', text: '当使用比拥有更便宜，商业模式会从“卖产品”转向“卖服务”。制造商要么成为服务商，要么成为服务商的供应商。' }
  },
  {
    id: 'FA2_SKY', years: [2048, 2065], industry: 'auto', future: true, title: '车要飞了', era: '2050 年代 推演',
    situation: '电动垂直起降飞行器开始在城市间提供空中出租服务，几家航空公司和车企在抢这个新市场。',
    options: [
      { id: 'build', text: '研发自己的飞行汽车', hint: '新赛道',
        outcomes: [
          { p: 0.45, title: '空中霸主', text: '你的飞行器成了城市空中交通的主力。', effects: [{ t: 'cash', v: -0.15, min: 5e6 }, { t: 'quality', v: 10 }, { t: 'mod', attract: { '*': 1.12 }, years: 12, from: 2 }] },
          { p: 0.55, title: '认证太难', text: '航空认证一拖再拖，烧了很多钱。', effects: [{ t: 'cash', v: -0.15, min: 5e6 }, { t: 'quality', v: 3 }] }
        ] },
      { id: 'parts', text: '只做电机和电池，供应飞行器厂商', hint: '供应商',
        outcomes: [{ p: 1, title: '核心部件供应商', text: '稳定的新订单。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'mod', gm: 0.015, years: 10 }] }] },
      { id: 'ground', text: '专注地面', hint: '不分心',
        outcomes: [{ p: 1, title: '脚踏实地', text: '一切照旧。', effects: [] }] }
    ],
    history: '推演依据：多家公司研发的电动垂直起降飞行器已在进行适航认证，部分城市计划在 2030 年前后开通空中出租航线。',
    theory: { name: '相邻市场', text: '进入相邻市场可以复用已有能力（电池、电机、制造），但新市场的规则（航空认证）可能完全不同。' }
  },
  // ---------------- 服装 ----------------
  {
    id: 'FP1_MICRO', years: [2030, 2040], industry: 'apparel', future: true, title: '下单后再生产', era: '2030 年代 推演',
    situation: '3D 编织和自动缝纫让“先下单、后生产”成为可能：顾客在网上下单，城市里的微型工厂几小时就能做好送到家。不再需要库存。',
    options: [
      { id: 'micro', text: '在各大城市建微型工厂，全面按需生产', hint: '零库存',
        outcomes: [{ p: 1, title: '告别库存', text: '没有滞销、没有打折，利润率大幅提高。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'mod', gm: 0.05, attract: { '*': 1.05 }, years: 12, from: 1 }] }] },
      { id: 'custom', text: '主打“量体定制”，人人合身', hint: '个性化',
        outcomes: [
          { p: 0.6, title: '定制成了主流', text: '合身的衣服让退货率大降。', effects: [{ t: 'cash', v: -0.05, min: 2e6 }, { t: 'brand', v: 6 }, { t: 'mod', gm: 0.02, years: 10 }] },
          { p: 0.4, title: '量体数据不准', text: '很多顾客抱怨尺寸不对。', effects: [{ t: 'cash', v: -0.05, min: 2e6 }, { t: 'brand', v: -3 }] }
        ] },
      { id: 'mass', text: '继续大批量生产，把价格做到最低', hint: '规模',
        outcomes: [{ p: 1, title: '最便宜', text: '价格敏感的顾客还在，但库存问题依旧。', effects: [{ t: 'mod', attract: { IN: 1.05, VN: 1.05, BR: 1.05 }, gm: -0.01, years: 8 }] }] }
    ],
    history: '推演依据：一些运动品牌已在试验“快速工厂”和 3D 编织鞋面；服装行业每年约有三成产品最终未能按原价售出。',
    theory: { name: '延迟差异化', text: '把产品的个性化步骤尽可能推迟到接近顾客需求的时刻，可以大幅降低库存风险。' }
  },
  {
    id: 'FP2_CIRCULAR', years: [2027, 2034], industry: 'apparel', future: true, title: '旧衣服要你回收', era: '2020 年代末 推演',
    situation: '欧盟要求服装品牌为自己卖出的每一件衣服负责到底：承担回收和处理费用，禁止销毁卖不掉的库存。其他国家也在跟进。',
    options: [
      { id: 'resale', text: '建自己的二手和回收平台，旧衣翻新再卖', hint: '循环生意',
        outcomes: [{ p: 1, title: '二手也是生意', text: '回收的衣服翻新后再卖，多了一条收入线。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'brand', v: 6 }, { t: 'mod', attract: { DE: 1.1, UK: 1.1 }, years: 10 }] }] },
      { id: 'durable', text: '改做经久耐穿的衣服，少而精', hint: '慢时尚',
        outcomes: [{ p: 1, title: '慢时尚', text: '卖得少了，但每件更贵、回收费更低。', effects: [{ t: 'quality', v: 6 }, { t: 'mod', gm: 0.02, attract: { '*': 0.95 }, years: 10 }] }] },
      { id: 'pay', text: '交钱了事，商业模式不变', hint: '最省事',
        outcomes: [{ p: 1, title: '每年多一笔费用', text: '回收费吃掉了一部分利润。', effects: [{ t: 'mod', gm: -0.015, years: 10 }] }] },
      { id: 'exit', text: '退出规则严格的欧洲市场', hint: '避开',
        outcomes: [{ p: 1, title: '撤出欧洲', text: '欧洲生意没了。', effects: [{ t: 'share', m: { DE: 0.4, UK: 0.6 } }] }] }
    ],
    history: '推演依据：欧盟已立法禁止大型企业销毁未售出的服装和鞋类，并推动纺织品“生产者延伸责任”制度；二手服装市场增速远超一手市场。',
    theory: { name: '循环经济', text: '从“生产—使用—丢弃”的线性模式转向“设计—使用—回收—再造”，监管和消费者偏好都在推动企业把废弃物变成资源。' }
  },
  // ---------------- 医药 ----------------
  {
    id: 'FPH1_AIDRUG', years: [2030, 2042], industry: 'pharma', future: true, title: 'AI 找新药', era: '2030 年代 推演',
    cond: (s) => D_(s).tech !== 'ai_winter',
    situation: 'AI 能在几周内设计出候选药物，把新药研发从十年缩短到三四年。几家 AI 公司没有实验室，却开始和你抢新药。',
    options: [
      { id: 'build', text: '组建自己的 AI 药物发现团队', hint: '自主能力',
        outcomes: [
          { p: 0.6, title: '管线翻倍', text: '你的新药管线数量翻了一番。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'quality', v: 10 }, { t: 'mod', attract: { '*': 1.1 }, years: 10, from: 2 }] },
          { p: 0.4, title: '数据不够', text: 'AI 模型需要的高质量数据比想象中难获得。', effects: [{ t: 'cash', v: -0.1, min: 3e6 }, { t: 'quality', v: 3 }] }
        ] },
      { id: 'partner', text: '和 AI 公司合作：它们找分子，你做临床和销售', hint: '分工',
        outcomes: [{ p: 1, title: '强强联合', text: '你的临床和渠道是 AI 公司最缺的。', effects: [{ t: 'cash', v: -0.04, min: 1.5e6 }, { t: 'quality', v: 5 }, { t: 'mod', gm: -0.01, years: 6 }] }] },
      { id: 'buy', text: '直接收购一家 AI 制药公司', hint: '买能力',
        outcomes: [{ p: 1, title: '一步到位', text: '收购后技术和团队都到手了。', effects: [{ t: 'cash', v: -0.18, min: 5e6 }, { t: 'quality', v: 8 }] }] },
      { id: 'wait', text: 'AI 制药还没证明自己', hint: '观望',
        outcomes: [{ p: 1, title: '被追上了', text: '几年后 AI 设计的药开始大量上市。', effects: [{ t: 'quality', v: -5 }] }] }
    ],
    history: '推演依据：AlphaFold 预测了几乎所有已知蛋白质的结构，其开发者获得 2024 年诺贝尔化学奖；已有 AI 设计的候选药物进入临床试验。',
    theory: { name: '研发生产率', text: '新药研发的成本几十年来不断上升（“反摩尔定律”）。如果 AI 能扭转这一趋势，整个行业的竞争格局都会改变。' }
  },
  {
    id: 'FPH2_AGING', years: [2050, 2068], industry: 'pharma', future: true, title: '抗衰老药', era: '2050 年代 推演',
    situation: '你的实验室有一种药在临床试验中显著延缓了衰老。它可能是史上最畅销的药，也可能引发巨大的伦理和公平争议：只有富人用得起吗？',
    options: [
      { id: 'premium', text: '高价上市，先卖给富裕国家', hint: '利润最大化',
        outcomes: [
          { p: 0.5, title: '史上最赚钱的药', text: '富人排队购买。', effects: [{ t: 'cash', v: 0.2 }, { t: 'mod', attract: { US: 1.2, JP: 1.15, DE: 1.15, UK: 1.15 }, years: 10 }] },
          { p: 0.5, title: '“长寿不平等”', text: '舆论批评你只为富人服务，多国政府强制降价。', effects: [{ t: 'cash', v: 0.08 }, { t: 'brand', v: -10 }] }
        ] },
      { id: 'tier', text: '分级定价，和各国医保谈判', hint: '普惠',
        outcomes: [{ p: 1, title: '全世界的药', text: '利润没那么高，但覆盖了几十亿人。', effects: [{ t: 'cash', v: 0.08 }, { t: 'brand', v: 12 }, { t: 'mod', attract: { '*': 1.1 }, years: 12 }] }] },
      { id: 'license', text: '把专利授权给多家药厂生产', hint: '开放',
        outcomes: [{ p: 1, title: '授权费', text: '你成了全球抗衰老药的专利持有者。', effects: [{ t: 'cash', v: 0.06 }, { t: 'mod', gm: 0.02, years: 12 }] }] }
    ],
    history: '推演依据：二甲双胍、雷帕霉素等药物的抗衰老作用正在临床研究中，多家资金雄厚的公司专门投入延缓衰老的研发。',
    theory: { name: '分配正义', text: '突破性医疗技术的定价不只是商业问题，还关系到社会公平。企业的定价策略会影响它的长期合法性。' }
  },
  // ---------------- 新能源 ----------------
  {
    id: 'FEN1_HYDROGEN', years: [2030, 2042], industry: 'energy', future: true, title: '氢能还是电池', era: '2030 年代 推演',
    situation: '钢铁、航运、航空这些很难用电池的行业开始寻找替代燃料。绿氢的成本在快速下降，但基础设施几乎为零。',
    options: [
      { id: 'h2', text: '大举投资绿氢电解槽和加氢网络', hint: '押氢能',
        outcomes: [
          { p: 0.5, title: '重工业的新燃料', text: '钢厂和船公司成了你的长期客户。', effects: [{ t: 'cash', v: -0.15, min: 4e6 }, { t: 'mod', attract: { '*': 1.15 }, years: 12, from: 2 }] },
          { p: 0.5, title: '氢能来得太慢', text: '电池进步太快，氢能只在少数领域有用。', effects: [{ t: 'cash', v: -0.15, min: 4e6 }, { t: 'mod', attract: { '*': 1.03 }, years: 8, from: 3 }] }
        ] },
      { id: 'battery', text: '坚持电池路线，做更大的储能', hint: '押电池',
        outcomes: [{ p: 1, title: '电池更便宜了', text: '储能需求继续爆发。', effects: [{ t: 'cash', v: -0.05, min: 2e6 }, { t: 'mod', attract: { '*': 1.08 }, years: 10 }] }] },
      { id: 'both', text: '两条路都小规模试', hint: '对冲',
        outcomes: [{ p: 1, title: '两边都有经验', text: '哪条路赢了你都不会落后太多。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'mod', attract: { '*': 1.05 }, years: 10, from: 1 }] }] }
    ],
    history: '推演依据：欧盟、中国、日本都发布了氢能战略，绿氢成本在电解槽规模化后持续下降；但也有研究认为，大部分场景下直接用电比制氢更高效。',
    theory: { name: '技术路线之争', text: '在技术路线尚未确定时，过早押注可能全输，完全观望又可能错过。小规模多路径探索是常见的折中。' }
  },
  {
    id: 'FEN2_FUSION', years: [2055, 2070], industry: 'energy', future: true, title: '聚变来了', era: '2050 年代 推演',
    situation: '第一座商业聚变电站并网发电。如果它能大规模复制，你的光伏和储能业务可能会被一种更便宜、全天候的能源取代。',
    options: [
      { id: 'join', text: '投资聚变电站，成为运营商', hint: '跟上新浪潮',
        outcomes: [
          { p: 0.5, title: '新时代的能源巨头', text: '你成了最早的聚变电力运营商之一。', effects: [{ t: 'cash', v: -0.18, min: 5e6 }, { t: 'mod', attract: { '*': 1.15 }, years: 12, from: 3 }] },
          { p: 0.5, title: '聚变还要很多年', text: '复制速度很慢，投资迟迟没有回报。', effects: [{ t: 'cash', v: -0.18, min: 5e6 }] }
        ] },
      { id: 'niche', text: '光伏和储能转向离网、偏远和太空场景', hint: '找新阵地',
        outcomes: [{ p: 1, title: '离网之王', text: '聚变电站建不到的地方，还是你的天下。', effects: [{ t: 'mod', attract: { IN: 1.1, BR: 1.1, VN: 1.1 }, years: 12 }] }] },
      { id: 'cheap', text: '继续降本，和聚变拼价格', hint: '硬碰硬',
        outcomes: [{ p: 1, title: '价格战', text: '光伏还是最便宜的白天电力。', effects: [{ t: 'mod', gm: -0.02, years: 10 }] }] }
    ],
    history: '推演依据：多家私营聚变公司已融资数十亿美元，计划在 2030 年代建设示范电站；国际热核聚变实验堆（ITER）也在建设中。',
    theory: { name: '颠覆者也会被颠覆', text: '新能源曾经颠覆化石能源，它自己也可能被下一代技术颠覆。持续的技术侦察和组合投资是应对之道。' }
  }
];

module.exports = { CASES_F2 };
