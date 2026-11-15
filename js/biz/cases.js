// 经典案例卡：情景 → 选项（概率结果）→ 揭晓（真实历史 + 理论视角）。
// 全部为原创撰写，依据公开历史事实；不引用任何案例原文。
// 效果写法见 engine.js applyEffect：
//   {t:'cash', v:比例(按上年收入), min:最少美元}  {t:'brand', v, c?}  {t:'quality', v}
//   {t:'mod', attract:{国家|'*':乘数}, gm:毛利增减, years, from:几年后生效}
//   {t:'share', m:{国家|'*':乘数}}  {t:'level', c, v}  {t:'debt', v:比例}  {t:'raise', v:估值比例}  {t:'flag', name}

const physical = (s) => s.industry !== 'software';

const CASES = [
  // ---------------- 通用 ----------------
  {
    id: 'U1_ASIA_CRISIS', years: [1997, 1998], title: '危机里的便宜货', era: '1997 亚洲金融危机',
    ctx: (s) => ({ C: s.hq === 'VN' ? 'IN' : 'VN' }),
    situation: '亚洲金融危机，泰铢、越南盾大幅贬值，当地企业资不抵债。一家{C}同行愿意以三折的价格把工厂和销售渠道卖给你。董事会有人说这是十年一遇的机会，也有人担心危机还会更深。',
    options: [
      { id: 'buy', text: '抄底收购，接下工厂和渠道', hint: '花掉不少现金，换来一个低成本基地',
        outcomes: [
          { p: 0.7, title: '低价买到了好资产', text: '危机过后，这里成了你成本最低的基地。', effects: [{ t: 'cash', v: -0.2, min: 3e6 }, { t: 'level', c: '{C}', v: 3, sw: 2 }, { t: 'mod', attract: { '{C}': 1.15 }, years: 8 }] },
          { p: 0.3, title: '整合比想象中难', text: '管理层流失、账目混乱，额外花了一大笔钱才理顺。', effects: [{ t: 'cash', v: -0.28, min: 4e6 }, { t: 'level', c: '{C}', v: 3, sw: 2 }] }
        ] },
      { id: 'probe', text: '只租用对方部分产能，小步试探', hint: '花钱少，进退自如',
        outcomes: [{ p: 1, title: '小步进入', text: '你在当地有了据点，但没拿到渠道。', effects: [{ t: 'cash', v: -0.04, min: 8e5 }, { t: 'level', c: '{C}', v: 1 }] }] },
      { id: 'hold', text: '收缩防守，保住现金', hint: '什么也不做',
        outcomes: [{ p: 1, title: '安稳度过', text: '现金没少，机会也错过了。', effects: [] }] }
    ],
    history: '危机期间，不少欧美日企业趁亚洲资产价格暴跌收购当地企业，例如法国雷诺在 2000 年拿下三星汽车的控股权；也有一些收购因为整合不力而亏损收场。',
    theory: { name: '逆周期投资', text: '危机中资产价格常常低于长期价值，现金充裕的公司可以低价买到能力和渠道。前提有两个：自己扛得住危机继续恶化，并且有能力整合买来的东西。' }
  },
  {
    id: 'U2_WTO', years: [2001, 2002], title: '中国入世：怎么进去？', era: '2001 中国加入世贸组织',
    cond: (s) => s.hq !== 'CN',
    situation: '中国即将加入世界贸易组织，关税下调、外资限制逐步放开。这是全球增长最快的大市场，但渠道、规则和消费者你都不熟。',
    options: [
      { id: 'jv', text: '找本地伙伴合资', hint: '借对方的渠道和关系，利润要分',
        outcomes: [{ p: 1, title: '合资公司成立', text: '伙伴的渠道让你很快铺开。', effects: [{ t: 'cash', v: -0.05, min: 1e6 }, { t: 'level', c: 'CN', v: 2 }, { t: 'mod', attract: { CN: 1.15 }, years: 6 }, { t: 'flag', name: 'jv_cn' }] }] },
      { id: 'wfoe', text: '独资设厂、自建团队', hint: '投入大、起步慢，控制权全在自己手里',
        outcomes: [{ p: 1, title: '独资起步', text: '前几年辛苦，之后越走越顺。', effects: [{ t: 'cash', v: -0.12, min: 4e6 }, { t: 'level', c: 'CN', v: 3, sw: 2 }, { t: 'mod', attract: { CN: 0.9 }, years: 2 }, { t: 'mod', attract: { CN: 1.18 }, years: 8, from: 2 }] }] },
      { id: 'export', text: '先做出口，观望两年', hint: '几乎不花钱',
        outcomes: [{ p: 1, title: '出口试水', text: '你在中国卖了一些货，但被先进去的对手抢了位置。', effects: [{ t: 'level', c: 'CN', v: 1 }, { t: 'mod', attract: { CN: 0.85 }, years: 5 }] }] }
    ],
    history: '入世后外资大量涌入中国。汽车等行业被要求合资，消费品和电子行业的不少公司则从合资逐步转为独资；苹果把大部分组装交给富士康等代工厂，中国成为“世界工厂”。',
    theory: { name: '国际市场进入模式', text: '出口、授权、合资、独资，投入越大控制越强、风险也越高。乌普萨拉模型指出，企业通常随着对一个市场的了解加深，一步步加大投入。' }
  },
  {
    id: 'U2_WTO_CN', years: [2001, 2002], title: '巨头进门了', era: '2001 中国加入世贸组织',
    cond: (s) => s.hq === 'CN',
    situation: '中国入世，跨国巨头带着技术、品牌和资金涌入你的主场。有外资想和你合资，也有人劝你趁早出海。',
    options: [
      { id: 'jv', text: '和外资巨头合资，借技术', hint: '产品力提升，利润要分',
        outcomes: [{ p: 1, title: '技术上了台阶', text: '合资带来了管理和技术，但品牌主导权在对方手里。', effects: [{ t: 'quality', v: 8 }, { t: 'mod', gm: -0.02, years: 6 }] }] },
      { id: 'home', text: '坚持自主品牌，深耕国内渠道', hint: '守住主场',
        outcomes: [{ p: 1, title: '主场更稳了', text: '你的渠道铺到了县城，外资一时追不上。', effects: [{ t: 'brand', c: 'CN', v: 8 }, { t: 'mod', attract: { CN: 1.15 }, years: 8 }] }] },
      { id: 'abroad', text: '先难后易：直接去美国设厂开公司', hint: '花钱多，学到的最多',
        outcomes: [
          { p: 0.6, title: '在美国站住了脚', text: '“本地制造”让你在美国赢得了渠道商的信任。', effects: [{ t: 'cash', v: -0.15, min: 4e6 }, { t: 'level', c: 'US', v: 3, sw: 2 }, { t: 'mod', attract: { US: 1.12 }, years: 8 }, { t: 'brand', c: 'US', v: 5 }] },
          { p: 0.4, title: '水土不服', text: '工厂成本远超预算，好在品牌在美国露了脸。', effects: [{ t: 'cash', v: -0.22, min: 5e6 }, { t: 'level', c: 'US', v: 2 }] }
        ] }
    ],
    history: '入世后，海尔、联想等中国企业一边守住国内市场，一边走出去：海尔 1999 年就在美国南卡罗来纳州建厂，采取“先难后易”的策略；联想 2005 年收购了 IBM 的个人电脑业务。',
    theory: { name: '后发企业的国际化', text: '后发企业可以先在成熟市场接受最挑剔客户的检验（先难后易），也可以先在相近市场积累经验（先易后难）。前者学习快但代价高，后者稳但可能错过窗口。' }
  },
  {
    id: 'U3_GFC', years: [2008, 2009], title: '金融海啸里的董事会', era: '2008 全球金融危机',
    situation: '雷曼兄弟倒闭，订单骤减，银行收紧贷款。董事会要求你本周拿出应对方案。',
    options: [
      { id: 'cut', text: '大幅裁员、砍掉研发和营销，先保现金', hint: '现金立刻改善',
        outcomes: [{ p: 1, title: '活下来了，但伤了元气', text: '现金表好看了，复苏时你的产品和品牌却落后了。', effects: [{ t: 'cash', v: 0.08 }, { t: 'quality', v: -6 }, { t: 'brand', v: -3 }, { t: 'mod', attract: { '*': 0.92 }, years: 4 }] }] },
      { id: 'balanced', text: '精打细算降本，同时有选择地投资研发和营销', hint: '攻守兼备',
        outcomes: [{ p: 1, title: '危机后跑在前面', text: '对手收缩的时候，你的新产品抢到了份额。', effects: [{ t: 'cash', v: -0.04 }, { t: 'quality', v: 6 }, { t: 'mod', attract: { '*': 1.12 }, years: 6, from: 1 }] }] },
      { id: 'expand', text: '全面扩张，趁对手收缩抢地盘', hint: '赌一把',
        outcomes: [
          { p: 0.5, title: '赌赢了', text: '你用很低的价格抢到了渠道和人才。', effects: [{ t: 'cash', v: -0.15 }, { t: 'mod', attract: { '*': 1.2 }, years: 6 }] },
          { p: 0.5, title: '现金差点断了', text: '危机比预想更长，你只好借了一大笔高息贷款。', effects: [{ t: 'cash', v: -0.15 }, { t: 'debt', v: 0.15 }, { t: 'mod', attract: { '*': 1.05 }, years: 4 }] }
        ] }
    ],
    history: '兰杰·古拉蒂等学者 2010 年研究了几千家上市公司在三次经济衰退中的表现，发现只顾削减成本或只顾扩张的公司，衰退后都不如“靠提高效率降本、同时有选择地投资营销、研发和新资产”的公司。',
    theory: { name: '衰退期战略', text: '衰退中，防守（降本、保现金）和进攻（投资未来）不是二选一。最好的组合是：用运营效率降本，而不是简单裁员；把省下的资源投到复苏后能领先的地方。' }
  },
  {
    id: 'U4_TRADE', years: [2018, 2019], title: '关税来了', era: '2018 中美贸易摩擦',
    cond: (s) => physical(s),
    situation: '美国宣布对中国制造的商品加征 25% 关税，而且可能继续扩大。{factory}',
    ctx: (s) => ({ factory: s.countries.CN.level >= 3 ? '你在中国有工厂，卖到美国的货马上要多交关税。' : '你还没在中国生产，但你的代工厂大多在中国。' }),
    options: [
      { id: 'plus1', text: '在越南加建一座工厂（中国 + 1）', hint: '多一个产地，分散风险',
        outcomes: [{ p: 1, title: '供应链多了一条腿', text: '新工厂投产后，卖到美国的货可以从越南出。', effects: [{ t: 'cash', v: -0.08, min: 4e6 }, { t: 'level', c: 'VN', v: 3 }] }] },
      { id: 'pass', text: '继续在中国生产，把关税转嫁给美国客户', hint: '不用花钱，但美国售价更高',
        outcomes: [{ p: 1, title: '美国份额被蚕食', text: '涨价后，在美国的份额被别人抢走了一部分。', effects: [{ t: 'mod', attract: { US: 0.85 }, years: 6 }] }] },
      { id: 'reshore', text: '把产能搬回美国', hint: '最贵，但彻底避开关税',
        outcomes: [{ p: 1, title: '美国制造', text: '成本高了不少，但美国客户很买账。', effects: [{ t: 'cash', v: -0.15, min: 8e6 }, { t: 'level', c: 'US', v: 3 }, { t: 'brand', c: 'US', v: 6 }] }] }
    ],
    history: '2018 年起，美国对大批中国商品加征关税。很多电子和消费品企业把部分产能转到越南、墨西哥、印度等地，形成“中国 + 1”的布局。三星更早在 2009 年就在越南北宁建了大型手机工厂。',
    theory: { name: '供应链韧性', text: '只追求最低成本、只用一个产地的供应链，在地缘政治和突发冲击面前很脆弱。多产地布局牺牲一点效率，换来抗风险能力。' }
  },
  {
    id: 'U4_DATA', years: [2018, 2019], title: '数据新规', era: '2018 欧盟《通用数据保护条例》生效',
    cond: (s) => !physical(s),
    situation: '欧盟《通用数据保护条例》（GDPR）生效，违规罚款最高可达全球营业额的 4%；印度等国也在讨论数据本地化。你的产品存着大量用户数据。',
    options: [
      { id: 'full', text: '全面合规，在欧洲和印度建本地数据中心', hint: '花钱多，换来信任',
        outcomes: [{ p: 1, title: '合规成了卖点', text: '大企业客户更愿意选你。', effects: [{ t: 'cash', v: -0.06, min: 2e6 }, { t: 'mod', attract: { DE: 1.12, UK: 1.1, IN: 1.06 }, years: 8 }] }] },
      { id: 'eu', text: '只在欧盟做到合规', hint: '花钱少',
        outcomes: [{ p: 1, title: '守住欧洲', text: '欧洲业务没受影响。', effects: [{ t: 'cash', v: -0.02, min: 8e5 }] }] },
      { id: 'wait', text: '先观望，等监管执法再说', hint: '不花钱',
        outcomes: [
          { p: 0.5, title: '侥幸过关', text: '监管还没查到你。', effects: [] },
          { p: 0.5, title: '收到罚单', text: '监管机构开出巨额罚单，欧洲客户纷纷观望。', effects: [{ t: 'cash', v: -0.04 }, { t: 'mod', attract: { DE: 0.7, UK: 0.75 }, years: 3 }, { t: 'brand', v: -4 }] }
        ] }
    ],
    history: 'GDPR 于 2018 年 5 月生效。2019 年，法国监管机构以违反透明度和同意规则为由对谷歌罚款 5000 万欧元，此后对大型科技公司的罚单越来越大。',
    theory: { name: '制度距离（CAGE 框架）', text: '潘卡吉·盖马沃特把国家间的差异分成文化、行政（制度）、地理、经济四种距离。法规和监管属于行政距离，常常比关税更深刻地影响跨国经营。' }
  },
  {
    id: 'U5_COVID', years: [2020, 2020], title: '停摆的世界', era: '2020 新冠疫情',
    situation: '疫情暴发，门店和工厂停摆，线上需求暴涨，没人知道这会持续多久。',
    options: [
      { id: 'cash', text: '立刻借一笔长期贷款，暂停非必要支出', hint: '先保证有子弹',
        outcomes: [{ p: 1, title: '弹药充足', text: '你比对手多了一年的现金跑道。', effects: [{ t: 'debt', v: 0.2 }] }] },
      { id: 'digital', text: '快速转向线上和直营，加大数字化投入', hint: '把危机变成转型机会',
        outcomes: [{ p: 1, title: '线上业务起飞', text: '线上收入占比翻了一番。', effects: [{ t: 'cash', v: -0.06 }, { t: 'mod', attract: { '*': 1.1 }, years: 5 }] }] },
      { id: 'wait', text: '维持原计划，相信很快会过去', hint: '不变',
        outcomes: [
          { p: 0.4, title: '运气不错', text: '你的市场比预想恢复得快。', effects: [] },
          { p: 0.6, title: '被甩在后面', text: '疫情拖得比预想长，份额被反应快的对手拿走。', effects: [{ t: 'share', m: { '*': 0.9 } }] }
        ] }
    ],
    history: '疫情初期，许多公司迅速发债、提取信贷额度储备现金；也有零售和餐饮企业借机把线上和外卖做成了新的增长点。',
    theory: { name: '情景规划', text: '壳牌石油在 1970 年代用情景规划提前推演“油价暴涨”这类极端情形，1973 年石油危机来临时应对得比同行快。面对高度不确定，准备几套方案、留足弹药，比押注单一预测更稳。' }
  },
  {
    id: 'U6_INFLATION', years: [2022, 2023], title: '涨不涨价', era: '2022 全球高通胀',
    situation: '原材料和工资大涨，通胀创几十年新高。你的成本上涨了一成多，要不要涨价？',
    options: [
      { id: 'raise', text: '跟随通胀全面涨价', hint: '品牌够强，客户就留得住',
        outcomes: [{ p: 1, title: '__PRICING__', text: '', effects: [{ t: 'pricing' }] }] },
      { id: 'shrink', text: '价格不变，悄悄减少分量 / 规格', hint: '“缩水式通胀”',
        outcomes: [
          { p: 0.5, title: '没人注意', text: '利润守住了。', effects: [{ t: 'mod', gm: 0.02, years: 2 }] },
          { p: 0.5, title: '被网友扒出来了', text: '“缩水”上了热搜，品牌受损。', effects: [{ t: 'mod', gm: 0.02, years: 2 }, { t: 'brand', v: -6 }] }
        ] },
      { id: 'absorb', text: '价格不变，自己吃下成本保份额', hint: '牺牲利润换份额',
        outcomes: [{ p: 1, title: '份额涨了，利润薄了', text: '对手涨价时，你抢到了客户。', effects: [{ t: 'mod', gm: -0.05, years: 2 }, { t: 'mod', attract: { '*': 1.06 }, years: 4 }] }] }
    ],
    history: '2022 年，许多消费品巨头连续提价，靠品牌力销量下降不多，利润反而上升；也出现了价格不变、分量变小的“缩水式通胀”，引来消费者不满。',
    theory: { name: '定价权', text: '沃伦·巴菲特说过，评估一家企业最重要的一点是它的定价权：涨价而不流失客户的能力。定价权来自品牌、差异化和客户的转换成本。' }
  },

  // ---------------- 消费电子 ----------------
  {
    id: 'E1_DIGITAL', years: [1998, 2000], industry: 'electronics', title: '要不要革自己的命', era: '1990 年代末 数码浪潮',
    situation: '你最赚钱的是一条传统相机产品线和配套耗材，毛利很高。研发部做出了数码样机：画质还不如老产品，但每年都在飞快进步。全力投入，就会亲手冲击自己的现金牛。',
    options: [
      { id: 'all_in', text: '全力转向数码，主动替代老产品', hint: '短期利润下降',
        outcomes: [
          { p: 0.7, title: '转型成功', text: '数码浪潮来时，你已经站在浪头上。', effects: [{ t: 'mod', gm: -0.05, years: 3 }, { t: 'quality', v: 10 }, { t: 'mod', attract: { '*': 1.18 }, years: 10, from: 2 }] },
          { p: 0.3, title: '转得太早', text: '市场还没准备好，你在数码上亏了好几年。', effects: [{ t: 'mod', gm: -0.06, years: 3 }, { t: 'cash', v: -0.1 }, { t: 'mod', attract: { '*': 1.06 }, years: 8, from: 3 }] }
        ] },
      { id: 'spinout', text: '数码另立品牌，交给一支独立的小团队', hint: '不和老业务抢资源',
        outcomes: [
          { p: 0.75, title: '小团队跑出来了', text: '新品牌长成了主力。', effects: [{ t: 'cash', v: -0.05 }, { t: 'quality', v: 6 }, { t: 'mod', attract: { '*': 1.12 }, years: 10, from: 2 }] },
          { p: 0.25, title: '被老业务边缘化', text: '内部争资源，数码项目被一再削减预算。', effects: [{ t: 'cash', v: -0.05 }, { t: 'mod', attract: { '*': 0.92 }, years: 6, from: 3 }] }
        ] },
      { id: 'protect', text: '守住老产品，数码以后再说', hint: '利润最好看',
        outcomes: [{ p: 1, title: '眼前很舒服', text: '接下来三年利润创新高……', effects: [{ t: 'mod', gm: 0.04, years: 3 }, { t: 'mod', attract: { '*': 0.72 }, years: 10, from: 4 }] }] }
    ],
    history: '1975 年，柯达工程师史蒂夫·萨森做出了世界上第一台数码相机原型。柯达担心冲击胶片利润，迟迟没有全力投入，2012 年申请破产保护。富士胶片则把胶片里的化学和薄膜技术用到医疗、化妆品等新领域，活了下来。',
    theory: { name: '颠覆式创新', text: '克莱顿·克里斯坦森在《创新者的窘境》（1997）里指出：新技术起初性能差、利润低，主流客户看不上，龙头公司按“理性”决策会一再推迟投入；等新技术变得够好，就反过来吃掉老市场。他的建议之一是让独立的小团队去做颠覆性业务。' }
  },
  {
    id: 'E3_BLUE_OCEAN', years: [2004, 2006], industry: 'electronics', title: '性能竞赛还要跟吗', era: '2000 年代 游戏机大战',
    situation: '你的游戏机业务正和两家巨头比芯片性能和画面，每一代的研发费用都在翻倍，利润越来越薄。',
    options: [
      { id: 'race', text: '跟进性能竞赛，做最强的机器', hint: '花大钱',
        outcomes: [
          { p: 0.4, title: '性能领先', text: '硬核玩家买账。', effects: [{ t: 'cash', v: -0.1 }, { t: 'quality', v: 10 }, { t: 'mod', attract: { '*': 1.08 }, years: 5 }] },
          { p: 0.6, title: '烧钱跟跑', text: '花了很多钱，只做到和对手差不多。', effects: [{ t: 'cash', v: -0.1 }, { t: 'quality', v: 5 }, { t: 'mod', gm: -0.04, years: 4 }] }
        ] },
      { id: 'blue', text: '换赛道：简单好玩、价格亲民，面向全家和不玩游戏的人', hint: '蓝海',
        outcomes: [
          { p: 0.65, title: '全家都在玩', text: '爷爷奶奶也排队买你的机器。', effects: [{ t: 'brand', v: 8 }, { t: 'mod', attract: { '*': 1.28 }, years: 5 }, { t: 'mod', gm: 0.03, years: 5 }] },
          { p: 0.35, title: '被当成玩具', text: '新玩法叫好不叫座。', effects: [{ t: 'brand', v: 2 }] }
        ] },
      { id: 'exit', text: '退出主机，专做配件和代工', hint: '稳但天花板低',
        outcomes: [{ p: 1, title: '安稳的配角', text: '利润率上去了，规模下来了。', effects: [{ t: 'cash', v: 0.05 }, { t: 'mod', gm: 0.03, years: 6 }, { t: 'mod', attract: { '*': 0.85 }, years: 6 }] }] }
    ],
    history: '2006 年，任天堂推出 Wii。它的性能远不如索尼 PS3 和微软 Xbox 360，但靠体感操作吸引了家庭、老人等原本不玩游戏的人，成为那一代销量最高的主机之一。',
    theory: { name: '蓝海战略', text: 'W. 钱·金和勒妮·莫博涅（2005）主张：与其在现有市场里和对手硬拼（红海），不如重新定义客户和价值。具体做法是去掉、减少行业里大家默认要比拼的要素，再增加、创造新的要素。' }
  },
  {
    id: 'E2_SMARTPHONE', years: [2007, 2009], industry: 'electronics', title: '一台没有键盘的手机', era: '2007 智能手机革命',
    situation: '一家对手发布了全触屏、靠应用商店的智能手机，业内不少人觉得它太贵、电池不耐用。你的功能机全球出货量很大，自研的操作系统已经老旧。',
    options: [
      { id: 'own', text: '推倒重来，自研全触屏系统和应用商店', hint: '最难，成了就是自己的生态',
        outcomes: [
          { p: 0.4, title: '自家生态成形', text: '开发者陆续来了。', effects: [{ t: 'cash', v: -0.12 }, { t: 'quality', v: 8 }, { t: 'mod', attract: { '*': 1.22 }, years: 8, from: 1 }] },
          { p: 0.6, title: '系统难产', text: '新系统延误了两年，等你上市，市场格局已定。', effects: [{ t: 'cash', v: -0.12 }, { t: 'mod', attract: { '*': 0.8 }, years: 3 }, { t: 'mod', attract: { '*': 1.02 }, years: 5, from: 3 }] }
        ] },
      { id: 'open', text: '加入开放的第三方操作系统阵营', hint: '快，但和很多厂商同质化',
        outcomes: [
          { p: 0.8, title: '赶上了浪潮', text: '你成了这个阵营里出货最多的厂商之一。', effects: [{ t: 'quality', v: 6 }, { t: 'mod', attract: { '*': 1.15 }, years: 8 }, { t: 'mod', gm: -0.02, years: 8 }] },
          { p: 0.2, title: '陷入价格战', text: '大家用同一个系统，只能拼价格。', effects: [{ t: 'mod', attract: { '*': 1.05 }, years: 6 }, { t: 'mod', gm: -0.06, years: 4 }] }
        ] },
      { id: 'feature', text: '继续做功能机，主打性价比和新兴市场', hint: '眼下最赚钱',
        outcomes: [{ p: 1, title: '新兴市场还在，主流市场没了', text: '印度、巴西还在买你的功能机，发达国家的客户一个个转走了。', effects: [{ t: 'mod', attract: { IN: 1.15, BR: 1.15, VN: 1.1, MX: 1.1 }, years: 4 }, { t: 'mod', attract: { US: 0.6, JP: 0.6, DE: 0.65, UK: 0.65, CN: 0.7 }, years: 12, from: 2 }] }] }
    ],
    history: '2007 年苹果发布 iPhone，2008 年谷歌安卓手机面世。诺基亚当时是全球最大的手机厂商，坚持自家塞班系统，2011 年转投微软 Windows Phone，2013 年把手机业务卖给了微软。三星等厂商押注安卓，抓住了这一波。',
    theory: { name: '平台与网络效应', text: '智能手机的竞争从“硬件”变成了“平台”：开发者越多，应用越多，用户越多，又吸引更多开发者。这种正反馈让领先平台越来越强，后来者很难追上。' }
  },
  {
    id: 'E4_RECALL', years: [2014, 2017], industry: 'electronics', title: '起火的旗舰机', era: '2010 年代 产品安全危机',
    situation: '你的旗舰新机上市刚一个月，全球陆续出现电池起火的报道，原因还没完全查清，社交媒体上的视频越传越广。',
    options: [
      { id: 'recall', text: '全球全面召回，停产这款机型', hint: '代价巨大，但干脆',
        outcomes: [
          { p: 0.85, title: '信任赢回来了', text: '你公开了调查报告和新的电池安全流程，下一代旗舰卖得很好。', effects: [{ t: 'cash', v: -0.08 }, { t: 'brand', v: -3 }, { t: 'mod', attract: { '*': 1.08 }, years: 5, from: 1 }] },
          { p: 0.15, title: '伤得不轻', text: '召回做得干脆，但品牌还是元气大伤。', effects: [{ t: 'cash', v: -0.08 }, { t: 'brand', v: -8 }] }
        ] },
      { id: 'partial', text: '只召回确认有问题的批次，换电池继续卖', hint: '损失小',
        outcomes: [
          { p: 0.5, title: '风波平息', text: '换货后没再出事。', effects: [{ t: 'cash', v: -0.02 }] },
          { p: 0.5, title: '换货后又起火', text: '第二轮起火彻底引爆舆论，最后还是全面停产。', effects: [{ t: 'cash', v: -0.12 }, { t: 'brand', v: -15 }, { t: 'mod', attract: { '*': 0.8 }, years: 3 }] }
        ] },
      { id: 'deny', text: '先否认，等调查结果出来再说', hint: '不花钱',
        outcomes: [
          { p: 0.3, title: '侥幸过关', text: '后来查明是个别用户使用不当。', effects: [] },
          { p: 0.7, title: '监管强制召回', text: '“捂盖子”成了新闻头条。', effects: [{ t: 'cash', v: -0.1 }, { t: 'brand', v: -20 }, { t: 'mod', attract: { '*': 0.75 }, years: 4 }] }
        ] }
    ],
    history: '2016 年，三星 Galaxy Note7 因电池起火两次召回，最终全球停产，损失巨大；次年三星公布了新的电池安全检测流程，口碑逐渐恢复。更早的经典是 1982 年的泰诺投毒事件：强生在全美撤下全部胶囊、推出防拆封包装，消费者信任反而更强了。',
    theory: { name: '危机管理', text: '危机中做到快、透明、把消费者安全放在利润前面的公司，往往比捂盖子的公司恢复得快。拖延和否认会把产品问题变成信任问题。' }
  },

  // ---------------- 饮料快消 ----------------
  {
    id: 'B1_LOCAL', years: [1996, 1999], industry: 'beverage', title: '同一个配方卖全世界？', era: '1990 年代 进入新兴市场',
    ctx: (s) => ({ C: s.hq === 'IN' ? 'BR' : 'IN' }),
    situation: '你决定进入{C}。总部的招牌饮料在本国卖了二十年，口味统一。可{C}有好几个本土强势品牌，当地人口味偏甜、偏香料。',
    options: [
      { id: 'standard', text: '全球统一配方和品牌', hint: '省成本，靠全球品牌力',
        outcomes: [{ p: 1, title: '叫好不叫座', text: '品牌很响，但口味没打动当地人。', effects: [{ t: 'level', c: '{C}', v: 1 }, { t: 'mod', gm: 0.01, years: 5 }, { t: 'mod', attract: { '{C}': 0.8 }, years: 8 }] }] },
      { id: 'acquire', text: '收购一个当地强势品牌，保留并发扬它', hint: '花钱多，见效快',
        outcomes: [{ p: 1, title: '本土品牌成了主力', text: '你买来的本土品牌比自家招牌卖得还好。', effects: [{ t: 'cash', v: -0.15, min: 3e6 }, { t: 'level', c: '{C}', v: 2 }, { t: 'brand', c: '{C}', v: 20 }, { t: 'mod', attract: { '{C}': 1.35 }, years: 10 }] }] },
      { id: 'localize', text: '为当地单独开发本土口味', hint: '中间路线',
        outcomes: [
          { p: 0.7, title: '本地口味走红', text: '你学到了怎么做本地化，后面进别的国家也更快。', effects: [{ t: 'cash', v: -0.05, min: 1e6 }, { t: 'level', c: '{C}', v: 1 }, { t: 'mod', attract: { '{C}': 1.2, '*': 1.03 }, years: 10 }] },
          { p: 0.3, title: '两头不讨好', text: '新口味不够“本地”，又丢了“进口”的光环。', effects: [{ t: 'cash', v: -0.05, min: 1e6 }, { t: 'level', c: '{C}', v: 1 }] }
        ] }
    ],
    history: '可口可乐 1977 年退出印度，1993 年重返时收购了本土可乐品牌 Thums Up，后来发现它比自家可乐还受欢迎，于是继续大力推广。麦当劳 1996 年进入印度，菜单里没有牛肉，推出了鸡肉版的“大君麦克”。',
    theory: { name: '全球化与本地化', text: '西奥多·莱维特 1983 年提出“市场全球化”，主张全球统一产品、靠规模取胜。潘卡吉·盖马沃特的 CAGE 框架则提醒：国家之间的文化、制度、地理、经济距离往往比想象的大，需要在标准化和本地化之间找平衡。' }
  },
  {
    id: 'B2_JV', years: [2005, 2008], industry: 'beverage', title: '合作伙伴另起炉灶', era: '2000 年代 合资纠纷',
    ctx: (s) => ({ C: s.hq === 'CN' ? 'IN' : 'CN' }),
    situation: '你在{C}和一家本土企业合资：对方管渠道和工厂，你出品牌和配方。合资公司一直很赚钱，可你刚发现，合作方用自己控制的其他公司在卖几乎一样的产品。',
    options: [
      { id: 'sue', text: '打官司，坚决维权', hint: '要么拿回控制权，要么两败俱伤',
        outcomes: [
          { p: 0.4, title: '胜诉，拿回了控制权', text: '代价是两年的官司和一部分渠道。', effects: [{ t: 'level', c: '{C}', v: 2 }, { t: 'cash', v: -0.03 }, { t: 'mod', attract: { '{C}': 1.1 }, years: 6 }] },
          { p: 0.6, title: '旷日持久，低价退出', text: '几十场官司打下来，你卖掉股份离场，渠道几乎全部丢了。', effects: [{ t: 'level', c: '{C}', v: 1, force: true }, { t: 'cash', v: 0.04 }, { t: 'mod', attract: { '{C}': 0.75 }, years: 5 }] }
        ] },
      { id: 'merge', text: '谈判：把对方的业务并进合资公司，让对方多持股', hint: '让利换和平',
        outcomes: [{ p: 1, title: '握手言和', text: '你让出了一部分利润，但保住了市场。', effects: [{ t: 'level', c: '{C}', v: 2 }, { t: 'mod', attract: { '{C}': 1.05 }, years: 6 }, { t: 'mod', gm: -0.02, years: 6 }] }] },
      { id: 'exit', text: '体面分手，转成独资、从头建渠道', hint: '慢，但以后全在自己手里',
        outcomes: [{ p: 1, title: '独资重来', text: '头三年很苦，之后渠道完全掌握在自己手里。', effects: [{ t: 'cash', v: -0.1, min: 2e6 }, { t: 'level', c: '{C}', v: 2 }, { t: 'mod', attract: { '{C}': 0.8 }, years: 3 }, { t: 'mod', attract: { '{C}': 1.15 }, years: 8, from: 3 }] }] }
    ],
    history: '法国达能 1996 年与杭州娃哈哈合资。2007 年，达能指控娃哈哈在合资体系之外另设公司销售同类产品，双方在多个国家打了几十场官司，2009 年达能出售股份退出。',
    theory: { name: '合资治理', text: '合资能借到本地伙伴的渠道和关系；但如果渠道、商标使用、人事这些关键资源掌握在对方手里，一旦利益分歧就很难收场。控制权和退出条款要在一开始写清楚。' }
  },
  {
    id: 'B3_CATEGORY', years: [2010, 2013], industry: 'beverage', title: '不跟巨头抢可乐', era: '2010 年代 新品类',
    situation: '货架被几家巨头的可乐和果汁占满。团队提出做一种全新的功能饮料：小罐、高价、主打提神，赞助极限运动，不和可乐正面竞争。',
    options: [
      { id: 'launch', text: '全力推出新品类，营销先行', hint: '要么开创品类，要么白花钱',
        outcomes: [
          { p: 0.6, title: '开创了一个品类', text: '“提神就喝它”成了很多人的第一反应。', effects: [{ t: 'cash', v: -0.08 }, { t: 'brand', v: 8 }, { t: 'mod', attract: { '*': 1.18 }, years: 8 }, { t: 'mod', gm: 0.03, years: 8 }] },
          { p: 0.4, title: '没有火起来', text: '消费者看不懂这是什么饮料。', effects: [{ t: 'cash', v: -0.08 }, { t: 'brand', v: 2 }] }
        ] },
      { id: 'pilot', text: '先在一个国家试点，跑通再推广', hint: '稳妥',
        outcomes: [
          { p: 0.7, title: '试点成功', text: '复制到其他国家时，速度慢了些。', effects: [{ t: 'cash', v: -0.02 }, { t: 'mod', attract: { '*': 1.08 }, years: 8, from: 1 }] },
          { p: 0.3, title: '试点平平', text: '数据不够好，项目搁置了。', effects: [{ t: 'cash', v: -0.02 }] }
        ] },
      { id: 'follow', text: '不做新品类，在主流品类里打价格战', hint: '份额换利润',
        outcomes: [{ p: 1, title: '份额涨了一点，利润薄了', text: '巨头一降价，你的优势就没了。', effects: [{ t: 'mod', attract: { '*': 1.04 }, years: 5 }, { t: 'mod', gm: -0.04, years: 5 }] }] }
    ],
    history: '奥地利人迪特里希·马特舒茨在泰国发现了当地的功能饮料，1987 年在奥地利推出红牛，用小罐、高价和极限运动营销开创了“能量饮料”这个品类，避开了和可口可乐、百事的正面竞争。',
    theory: { name: '定位理论', text: '艾·里斯和杰克·特劳特认为，竞争发生在顾客的心智里。与其在别人占据的品类里做第二，不如开创一个新品类并成为它的代名词。' }
  },
  {
    id: 'B4_SUGAR', years: [2015, 2017], industry: 'beverage', title: '糖税要来了', era: '2010 年代 健康风潮',
    situation: '墨西哥已开征含糖饮料税，英国也宣布要征“糖税”，健康风潮兴起。你的招牌饮料含糖量很高，很多老顾客就爱这个味道。',
    options: [
      { id: 'reformulate', text: '直接给招牌产品降糖改配方', hint: '一步到位',
        outcomes: [
          { p: 0.4, title: '顾客接受了', text: '新配方口碑不错，还避开了糖税。', effects: [{ t: 'mod', attract: { '*': 1.05 }, years: 6 }] },
          { p: 0.6, title: '老顾客抗议', text: '“还我原来的味道！”销量明显下滑。', effects: [{ t: 'brand', v: -6 }, { t: 'mod', attract: { '*': 0.86 }, years: 3 }] }
        ] },
      { id: 'newline', text: '保留原味，另推无糖、低糖产品线', hint: '两条腿走路',
        outcomes: [{ p: 1, title: '新老顾客都留住了', text: '无糖系列增长很快。', effects: [{ t: 'cash', v: -0.03 }, { t: 'mod', attract: { '*': 1.08 }, years: 8 }] }] },
      { id: 'wait', text: '先不动，等政策落地再说', hint: '不花钱',
        outcomes: [{ p: 1, title: '糖税落地', text: '征税国家的售价涨了，销量被健康产品抢走。', effects: [{ t: 'mod', attract: { UK: 0.85, MX: 0.85, '*': 0.95 }, years: 6, from: 1 }] }] }
    ],
    history: '1985 年，可口可乐把经典配方换成“新可乐”，遭到消费者强烈抗议，79 天后恢复原配方，以“经典可乐”的名义重新上市。墨西哥 2014 年开征含糖饮料税；英国 2016 年宣布、2018 年开征软饮料糖税，许多厂商提前降糖。',
    theory: { name: '品牌资产', text: '凯文·莱恩·凯勒的品牌资产模型认为，成熟品牌的价值有很大一部分来自情感和习惯。动核心产品要格外小心，用新产品线去承接新需求，通常更稳。' }
  },

  // ---------------- 软件互联网 ----------------
  {
    id: 'S1_BUBBLE', years: [1999, 2000], industry: 'software', title: '投资人在门口排队', era: '1999 互联网泡沫',
    situation: '纳斯达克一路狂飙，投资人排队要投你，估值是去年的好几倍，可你的公司还在亏钱。',
    options: [
      { id: 'big', text: '趁高位大额融资，把现金存足', hint: '股份稀释较多',
        outcomes: [{ p: 1, title: '囤了一大笔现金', text: '融资完成后不久，泡沫破了。', effects: [{ t: 'raise', v: 0.18 }] }] },
      { id: 'some', text: '拿适量的钱，照原计划扩张', hint: '中庸',
        outcomes: [{ p: 1, title: '拿到了一些钱', text: '够用一阵子。', effects: [{ t: 'raise', v: 0.06 }] }] },
      { id: 'none', text: '不融资，靠收入慢慢长', hint: '股份不稀释',
        outcomes: [{ p: 1, title: '保住了股份', text: '你专心打磨产品。', effects: [{ t: 'quality', v: 3 }] }] }
    ],
    history: '2000 年 2 月，亚马逊在泡沫顶点前向欧洲投资者发行了约 6.7 亿美元可转换债券。一个月后纳斯达克见顶暴跌，大批没融到钱的“.com”公司倒闭，亚马逊靠这笔现金熬过了寒冬。',
    theory: { name: '融资窗口', text: '资本市场的情绪周期往往比公司基本面的波动大得多。钱便宜的时候多储备“过冬粮”，危机中就有别人没有的选择权；代价是股权稀释。' }
  },
  {
    id: 'S2_FREE', years: [2003, 2005], industry: 'software', title: '对手宣布：全部免费', era: '2003 本土平台崛起',
    ctx: (s) => ({ C: s.hq === 'CN' ? 'IN' : 'CN' }),
    situation: '你的在线交易平台在{C}领先，按交易收佣金。一家本土新对手宣布：开店、交易全部免费，还提供当地人习惯的即时聊天和担保支付。',
    options: [
      { id: 'keep', text: '坚持收费，用全球统一的产品和品牌', hint: '保住利润率',
        outcomes: [{ p: 1, title: '用户一点点流走', text: '卖家都搬去了免费平台，买家也跟着走了。', effects: [{ t: 'level', c: '{C}', v: 1 }, { t: 'mod', attract: { '{C}': 0.45 }, years: 10 }] }] },
      { id: 'free', text: '跟进免费，靠广告和增值服务挣钱', hint: '烧钱打仗',
        outcomes: [
          { p: 0.5, title: '守住了阵地', text: '烧了不少钱，但双方打成平手。', effects: [{ t: 'level', c: '{C}', v: 2 }, { t: 'cash', v: -0.08 }, { t: 'mod', attract: { '{C}': 1.1 }, years: 8 }] },
          { p: 0.5, title: '免费也没打过', text: '对手更懂本地用户，免费只是让你亏得更多。', effects: [{ t: 'level', c: '{C}', v: 2 }, { t: 'cash', v: -0.1 }, { t: 'mod', attract: { '{C}': 0.7 }, years: 8 }] }
        ] },
      { id: 'local', text: '当地业务交给本地团队全权负责，按本地习惯重做产品', hint: '放权',
        outcomes: [{ p: 1, title: '本地团队打了胜仗', text: '决策快了，产品也更合当地人胃口。', effects: [{ t: 'level', c: '{C}', v: 2 }, { t: 'cash', v: -0.04 }, { t: 'mod', attract: { '{C}': 1.25 }, years: 8 }] }] }
    ],
    history: 'eBay 2003 年收购中国的易趣网，一度占据大半个市场。同年阿里巴巴推出淘宝：开店免费，配上即时聊天工具“旺旺”和担保支付“支付宝”。eBay 坚持收费和全球统一平台，2006 年把中国业务并入一家本地公司，基本退出了中国。',
    theory: { name: '网络效应与本土竞争', text: '交易平台的价值取决于买卖双方的数量，免费是最快聚拢双边用户的方式。跨国平台如果决策远在总部、产品不贴合本地，常常输给更懂本地的对手。' }
  },
  {
    id: 'S3_PLATFORM', years: [2006, 2008], industry: 'software', title: '把家底卖给别人？', era: '2006 云计算兴起',
    situation: '为了撑起自己的业务，你们建了一套很强的服务器集群和开发工具。有工程师提议：把它做成产品，按用量卖给其他公司——包括竞争对手。',
    options: [
      { id: 'cloud', text: '做成对外的云服务平台', hint: '新业务，前期要投入',
        outcomes: [
          { p: 0.6, title: '第二增长曲线', text: '云业务几年后成了利润最高的板块。', effects: [{ t: 'cash', v: -0.1 }, { t: 'quality', v: 6 }, { t: 'mod', attract: { '*': 1.15 }, years: 12, from: 1 }, { t: 'mod', gm: 0.03, years: 12, from: 2 }] },
          { p: 0.4, title: '叫好不叫座', text: '客户还不放心把数据放在别人家。', effects: [{ t: 'cash', v: -0.1 }, { t: 'quality', v: 3 }] }
        ] },
      { id: 'partners', text: '只开放给合作伙伴', hint: '小步',
        outcomes: [{ p: 1, title: '生态略有扩大', text: '合作伙伴带来了一些新客户。', effects: [{ t: 'mod', attract: { '*': 1.05 }, years: 6 }] }] },
      { id: 'focus', text: '不做，专注主业', hint: '不分心',
        outcomes: [{ p: 1, title: '主业更精', text: '运营效率提高了一点。', effects: [{ t: 'mod', gm: 0.01, years: 3 }] }] }
    ],
    history: '亚马逊 2006 年推出 AWS，把内部基础设施变成对外按量收费的服务，后来成为亚马逊最赚钱的业务之一。',
    theory: { name: '核心能力', text: 'C. K. 普拉哈拉德和加里·哈默尔（1990）认为，公司真正的优势是一组能迁移到多个市场的能力，而不只是某个具体产品。把核心能力变成平台，就可能长出第二条增长曲线。' }
  },
  {
    id: 'S4_SPLIT', years: [2011, 2013], industry: 'software', title: '拆不拆老业务', era: '2010 年代 业务转型',
    situation: '你的老业务还在赚钱但在萎缩，新业务增长很快却在亏钱。管理层提议：拆成两家公司、两个品牌，分别收费——对老用户来说相当于涨价。',
    options: [
      { id: 'split', text: '立刻拆分，同时调价', hint: '快刀斩乱麻',
        outcomes: [
          { p: 0.2, title: '用户理解了', text: '拆分后两块业务都更聚焦。', effects: [{ t: 'mod', attract: { '*': 1.1 }, years: 6 }] },
          { p: 0.8, title: '用户大量流失', text: '用户觉得被“割韭菜”，一个季度流失了一大批，你很快撤回了拆分。', effects: [{ t: 'share', m: { '*': 0.85 } }, { t: 'brand', v: -8 }, { t: 'mod', attract: { '*': 1.08 }, years: 6, from: 2 }] }
        ] },
      { id: 'migrate', text: '不拆品牌，把用户逐步迁到新业务，分步调价', hint: '慢一点，稳一点',
        outcomes: [{ p: 1, title: '平稳过渡', text: '老用户大多跟着你迁了过去。', effects: [{ t: 'mod', attract: { '*': 1.08 }, years: 8 }] }] },
      { id: 'keep', text: '维持现状，老业务能赚一年是一年', hint: '不折腾',
        outcomes: [{ p: 1, title: '慢慢被超越', text: '新玩家抢走了新业务的风口。', effects: [{ t: 'mod', attract: { '*': 0.88 }, years: 6, from: 1 }] }] }
    ],
    history: '2011 年，Netflix 宣布把 DVD 邮寄租赁拆成新品牌 Qwikster，同时套餐涨价约六成。一个季度流失了约 80 万用户，股价暴跌，几周后就取消了拆分。但它坚持押注流媒体，后来成为全球最大的流媒体平台之一。',
    theory: { name: '自我颠覆的节奏', text: '主动颠覆自己的方向可能是对的，但节奏和沟通同样重要。让老客户感到被抛弃，会让转型付出不必要的代价。' }
  }
];

module.exports = { CASES };
