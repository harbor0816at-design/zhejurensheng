// 策略卡：每年发一手（默认 5 张），花行动点打出。国家卡拖到棋盘上的国家，公司卡点一下打出。
// 很多卡有风险（会失败、会被罚、会反噬），也有“连击”：同一年里搭配打出效果更好。
// L 是 BizLife 实例；所有现金进出都走 L.pay / L.gain，保证现金恒等式。

const base = (L) => Math.max(L.s.lastRev, 5e6);
const cost = (L, pct, min) => Math.max(min, pct * base(L)) * (1 + 0.02 * Math.max(0, L.s.year - 1995));
const crev = (L, cid) => Math.max(L.s.countries[cid].rev, 1e6);
const need = (L, cid, lv) => (L.s.countries[cid].level < lv ? (lv === 1 ? '要先进入这个国家' : lv === 2 ? '要先有分公司' : '要先有工厂') : '');
const fmt = (v) => (v >= 1e8 ? (v / 1e8).toFixed(1) + ' 亿' : Math.round(v / 1e4) + ' 万') + '美元';

const CARDS = [
  // ---------------- 国家卡：营销与渠道 ----------------
  { id: 'price_war', name: '价格战', icon: 'flame', color: '#dc2626', target: 'country', tags: ['价格'],
    desc: '在该国全线降价两年：吸引力 +30%，当地对手失血，但你的毛利也要降 6 个点。有工厂的国家毛利只降一半。',
    cond: (L, c) => need(L, c, 1), cost: () => 0,
    play(L, c) {
      const fac = L.s.countries[c].level >= 3;
      L.addMod({ attract: { [c]: 1.3 }, gmC: { [c]: fac ? -0.03 : -0.06 }, years: 2 });
      L.hitRivals(c, 0.85, 2);
      return { title: '价格战打响', text: fac ? '有本地工厂撑腰，你的成本扛得住。' : '没有本地工厂，每卖一件都在流血。' };
    } },
  { id: 'celebrity', name: '明星代言', icon: 'campaign', color: '#ea580c', target: 'country', tags: ['营销'],
    desc: '请当地顶流明星代言：品牌 +15。同年在这里做过营销，再 +10。15% 概率明星塌房，品牌 −12。',
    cond: (L, c) => need(L, c, 1), cost: (L, c) => Math.max(5e5, 0.05 * crev(L, c)),
    play(L, c) {
      const cs = L.s.countries[c];
      if (L.rand('deck') < 0.15) { L.brand(c, -12); return { title: '明星塌房了', text: '代言人卷入丑闻，你的广告一夜之间成了笑话。' }; }
      const combo = cs.campaign; L.brand(c, combo ? 25 : 15);
      return { title: '代言火了', text: combo ? '连击：营销战役 + 明星代言，品牌大涨。' : '当地年轻人都认识你了。' };
    } },
  { id: 'viral', name: '社交爆款', icon: 'news', color: '#db2777', target: 'country', tags: ['营销'], years: [2008, 2074],
    desc: '赌一把社交媒体：一半概率爆红（品牌 +14，当年吸引力 +20%），一半概率石沉大海。',
    cond: (L, c) => need(L, c, 1), cost: (L, c) => Math.max(2e5, 0.015 * crev(L, c)),
    play(L, c) {
      const p = L.pol('channel') === 'social' ? 0.7 : 0.5;
      if (L.rand('deck') < p) { L.brand(c, 14); L.addMod({ attract: { [c]: 1.2 }, years: 1 }); return { title: '刷屏了', text: (p > 0.5 ? '连击：社交渠道让爆款概率更高。' : '') + '几条视频播放破亿。' }; }
      return { title: '没人看', text: '钱花了，热度没起来。' };
    } },
  { id: 'exclusive', name: '渠道独家协议', icon: 'hand', color: '#0891b2', target: 'country', tags: ['渠道'],
    desc: '和当地最大的渠道商签独家：三年吸引力 +20%，对手被挤出货架。份额超过 15% 时有 40% 概率被反垄断调查罚款。',
    cond: (L, c) => need(L, c, 1), cost: (L, c) => Math.max(5e5, 0.04 * crev(L, c)),
    play(L, c) {
      L.addMod({ attract: { [c]: 1.2 }, years: 3 }); L.hitRivals(c, 0.88, 3);
      if (L.s.countries[c].share > 0.15 && L.rand('deck') < 0.4) { L.pay(0.06 * crev(L, c) + 5e5); L.brand(c, -6); return { title: '反垄断罚单', text: '你的份额太大，独家协议被认定为排除竞争，罚款不轻。' }; }
      return { title: '货架是你的了', text: '对手的产品在主要渠道里消失了。' };
    } },
  { id: 'stores', name: '旗舰店扩张', icon: 'shop', color: '#2563eb', target: 'country', tags: ['渠道'],
    desc: '在当地核心商圈连开旗舰店：之后 8 年吸引力 +12%，品牌 +6，但租金让当地毛利降 1.5 个点。',
    cond: (L, c) => need(L, c, 2) || (L.s.industry === 'software' ? '软件公司没有门店' : ''), cost: (L, c) => Math.max(8e5, 0.08 * crev(L, c)),
    play(L, c) { L.addMod({ attract: { [c]: 1.12 }, gmC: { [c]: -0.015 }, years: 8 }); L.brand(c, 6); return { title: '旗舰店开业', text: '排队的人绕了好几圈。' + (L.pol('channel') === 'omni' ? '连击：全渠道让门店同时成了线上仓库，毛利损失减半。' : '') }; } },
  { id: 'local_product', name: '本地化新品', icon: 'bulb', color: '#7c3aed', target: 'country', tags: ['产品'],
    desc: '为该国专门开发一款产品：5 年吸引力 +15%。如果这里有本地研发中心，效果翻倍。30% 概率不合口味。',
    cond: (L, c) => need(L, c, 1), cost: (L, c) => Math.max(5e5, 0.06 * crev(L, c)),
    play(L, c) {
      const rd = L.s.flags['rd_' + c];
      if (!rd && L.rand('deck') < 0.3) return { title: '不合口味', text: '新品没摸准当地人的喜好，销量惨淡。' };
      L.addMod({ attract: { [c]: rd ? 1.3 : 1.15 }, years: 5 });
      return { title: '新品热卖', text: rd ? '连击：本地研发中心懂当地人，新品大获成功。' : '当地人觉得这才是“为我们做的”。' };
    } },
  { id: 'rd_center', name: '本地研发中心', icon: 'cap', color: '#4f46e5', target: 'country', tags: ['研发'],
    desc: '在该国建研发中心：产品力 +3，10 年吸引力 +8%；之后在这里推本地化新品必定成功、效果翻倍。',
    cond: (L, c) => need(L, c, 2) || (L.s.flags['rd_' + c] ? '这里已经有研发中心' : ''), cost: (L, c) => cost(L, 0.03, 1e6) * Math.max(0.5, L.costIdx(c, L.s.year)),
    play(L, c) { L.s.flags['rd_' + c] = L.s.year; L.quality(3); L.addMod({ attract: { [c]: 1.08 }, years: 10 }); return { title: '研发中心落成', text: '当地工程师带来了新想法。' }; } },
  { id: 'jv', name: '合资进入', icon: 'hand', color: '#0d9488', target: 'country', tags: ['进入'],
    desc: '和当地企业合资，直接拿到分公司，只花一半投入；但利润要分一部分（当地毛利 −3 个点，8 年），25% 概率几年后伙伴另起炉灶。',
    cond: (L, c) => (L.s.countries[c].level >= 2 ? '这里已经有分公司了' : ''), cost: (L, c) => 0.5 * L.capexFor(c, 2),
    play(L, c) {
      const cs = L.s.countries[c]; cs.level = 2; if (cs.brand < 10) cs.brand = 10;
      L.addMod({ gmC: { [c]: -0.03 }, years: 8 });
      if (L.rand('deck') < 0.25) L.addMod({ attract: { [c]: 0.75 }, years: 4, from: 3 });
      return { title: '合资公司成立', text: '伙伴管渠道和关系，你出品牌和技术。' };
    } },
  { id: 'franchise', name: '特许经营', icon: 'branch', color: '#0284c7', target: 'country', tags: ['进入'],
    desc: '授权当地老板用你的品牌开店：几乎不花钱就能进入（出口级），品牌 +8；但 20% 概率加盟商乱来，品牌 −10。',
    cond: (L, c) => (L.s.countries[c].level >= 1 ? '你已经在这里了' : ''), cost: () => 1e5,
    play(L, c) {
      const cs = L.s.countries[c]; cs.level = 1;
      if (L.rand('deck') < 0.2) { cs.brand = 0; return { title: '加盟商砸了招牌', text: '几家加盟店卫生和服务出了问题，上了当地新闻。' }; }
      cs.brand = Math.max(cs.brand, 8); return { title: '加盟店开起来了', text: '没花什么钱，你的招牌就挂满了大街。' };
    } },
  { id: 'lobby', name: '游说政府', icon: 'shield', color: '#475569', target: 'country', tags: ['政府'],
    desc: '找关系争取政策支持：4 年吸引力 +12%。20% 概率被曝光，品牌 −12，当地吸引力反降。',
    cond: (L, c) => need(L, c, 1), cost: (L, c) => Math.max(3e5, 0.03 * crev(L, c)),
    play(L, c) {
      if (L.rand('deck') < 0.2) { L.brand(c, -12); L.addMod({ attract: { [c]: 0.88 }, years: 3 }); return { title: '游说丑闻', text: '记者拿到了你和官员的往来记录。' }; }
      L.addMod({ attract: { [c]: 1.12 }, years: 4 }); return { title: '政策站在你这边', text: '新的行业标准对你很有利。' };
    } },
  { id: 'logistics', name: '物流中心', icon: 'road', color: '#65a30d', target: 'country', tags: ['供应链'],
    desc: '建区域物流中心：10 年当地毛利 +2 个点；用电商或全渠道时再 +1。',
    cond: (L, c) => need(L, c, 1) || (L.s.industry === 'software' ? '软件不需要物流中心' : ''), cost: (L, c) => cost(L, 0.02, 6e5) * Math.max(0.5, L.costIdx(c, L.s.year)),
    play(L, c) { const on = ['online', 'omni', 'agent'].indexOf(L.pol('channel')) >= 0; L.addMod({ gmC: { [c]: on ? 0.03 : 0.02 }, years: 10 }); return { title: '物流中心投用', text: on ? '连击：线上订单当天就能送到。' : '配送成本明显下降。' }; } },
  { id: 'antidump', name: '反倾销申诉', icon: 'shield', color: '#b91c1c', target: 'country', tags: ['政府'],
    desc: '只能在总部所在国打：申请对外国对手征反倾销税，4 年内对手在本国大幅削弱；30% 概率对方国家报复，海外吸引力 −8%。',
    cond: (L, c) => (c !== L.s.hq ? '只能在总部所在国申诉' : ''), cost: () => 5e5,
    play(L, c) {
      L.hitRivals(c, 0.7, 4, true);
      if (L.rand('deck') < 0.3) { const m = {}; for (const k of Object.keys(L.s.countries)) if (k !== c) m[k] = 0.92; L.addMod({ attract: m, years: 3 }); return { title: '遭到报复', text: '对手国家也对你的产品发起调查。' }; }
      return { title: '申诉成功', text: '外国对手的产品被征了重税。' };
    } },
  { id: 'poach', name: '挖对手团队', icon: 'cap', color: '#9333ea', target: 'country', tags: ['人才'],
    desc: '高薪挖走当地最强对手的核心团队：产品力 +3，对手在这里削弱。25% 概率吃官司赔钱。',
    cond: (L, c) => need(L, c, 1), cost: (L, c) => Math.max(4e5, 0.03 * crev(L, c)),
    play(L, c) {
      const r = L.hitRivals(c, 0.8, 99, false, true); L.quality(3);
      if (L.rand('deck') < 0.25) { L.pay(Math.max(5e5, 0.04 * crev(L, c))); return { title: '被告了', text: `${r ? r.name : '对手'}起诉你违反竞业协议，赔了一笔钱，但人留下了。` }; }
      return { title: '人挖来了', text: `${r ? r.name : '对手'}的骨干团队跳槽到了你这里。` };
    } },
  { id: 'local_brand', name: '收购本土品牌', icon: 'coin', color: '#be123c', target: 'country', tags: ['品牌', '资本'],
    desc: '买下一个当地老字号：品牌力直接拉到 55，没进入的话直接得到分公司。价格不便宜。',
    cond: () => '', cost: (L, c) => Math.max(2e6, 0.012 * L.market(c, L.s.year)),
    play(L, c) { const cs = L.s.countries[c]; cs.brand = Math.max(cs.brand, 55); if (cs.level < 2) cs.level = 2; return { title: '老字号到手', text: '当地人信这个牌子，你借上了几十年的口碑。' }; } },
  { id: 'local_ipo', name: '子公司当地上市', icon: 'coin', color: '#ca8a04', target: 'country', tags: ['资本'],
    desc: '把该国子公司拿到当地上市，套现约等于它一年的收入；以后当地利润要分给小股东（当地毛利 −4 个点，长期）。',
    cond: (L, c) => need(L, c, 2) || (c === L.s.hq ? '总部不能单独上市' : '') || (L.s.countries[c].rev < 3e7 ? '当地收入要超过 3000 万美元' : '') || (L.s.flags['ipo_' + c] ? '已经上市过' : ''), cost: () => 0,
    play(L, c) { L.s.flags['ipo_' + c] = L.s.year; L.gain(L.s.countries[c].rev); L.addMod({ gmC: { [c]: -0.04 }, years: 40 }); L.brand(c, 5); return { title: '敲钟了', text: '当地股民热情很高，子公司市值不错。' }; } },
  { id: 'clearance', name: '清仓大甩卖', icon: 'minus', color: '#64748b', target: 'country', tags: ['价格'],
    desc: '把积压库存打骨折卖掉：马上回笼一笔现金，但当地品牌 −8。',
    cond: (L, c) => need(L, c, 1) || (L.s.industry === 'software' ? '软件没有库存' : ''), cost: () => 0,
    play(L, c) { L.gain(0.04 * crev(L, c)); L.brand(c, -8); return { title: '清仓完毕', text: '现金回来了，顾客也学会了等打折。' }; } },
  { id: 'divest', name: '整体出售', icon: 'exit', color: '#334155', target: 'country', tags: ['收缩'],
    desc: '把该国业务整体卖给当地买家：回收六成投入（比撤出多一倍），从此退出这个国家。',
    cond: (L, c) => need(L, c, 1) || (c === L.s.hq ? '总部不能卖' : ''), cost: () => 0,
    play(L, c) {
      const cs = L.s.countries[c]; let v = 0;
      for (let lv = 1; lv <= cs.level; lv++) v += 0.6 * L.capexFor(c, lv);
      v += 0.5 * Math.max(0, cs.profit) * 5;
      L.gain(v); cs.level = 0; cs.share = 0; cs.brand *= 0.5;
      return { title: '卖掉了', text: `回收 ${fmt(v)}。` };
    } },

  // ---------------- 公司卡 ----------------
  { id: 'rd_project', name: '研发攻关', icon: 'bulb', color: '#6d28d9', target: 'company', tags: ['研发'],
    desc: '立项一个两年的攻关项目：两年后产品力 +12（30% 概率失败只 +2）。项目完成后打“新品发布会”效果翻倍。',
    cond: (L) => (L.s.projects.some((p) => !p.done) ? '已经有项目在攻关' : ''), cost: (L) => cost(L, 0.04, 1e6),
    play(L) { L.s.projects.push({ id: 'rd', start: L.s.year, done: false }); return { title: '项目立项', text: '研发团队进入封闭攻关，两年后见分晓。' }; } },
  { id: 'launch', name: '新品发布会', icon: 'bulb', color: '#2563eb', target: 'company', tags: ['产品', '营销'],
    desc: '全球同步发布新一代产品：两年吸引力 +12%。产品力 ≥ 75 或刚完成研发攻关时 +25%、品牌 +6；产品力低于 45 会翻车。',
    cond: () => '', cost: (L) => cost(L, 0.025, 6e5),
    play(L) {
      const fresh = L.s.projects.some((p) => p.done && L.s.year - p.done <= 2);
      if (L.s.quality < 45 && !fresh) { L.brand(null, -5); L.addMod({ attract: { '*': 0.92 }, years: 2 }); return { title: '发布会翻车', text: '评测一边倒地差评，产品力太弱了。' }; }
      const big = fresh || L.s.quality >= 75;
      L.addMod({ attract: { '*': big ? 1.25 : 1.12 }, years: 2 }); if (big) L.brand(null, 6);
      return { title: big ? '王炸发布' : '发布会顺利', text: fresh ? '连击：攻关成果 + 发布会，全网都在讨论你的新品。' : big ? '产品力过硬，口碑爆棚。' : '新品反响不错。' };
    } },
  { id: 'cost_cut', name: '降本增效', icon: 'minus', color: '#0f766e', target: 'company', tags: ['效率'],
    desc: '全公司精简流程：5 年毛利 +2 个点，产品力 −2。',
    cond: () => '', cost: (L) => cost(L, 0.005, 2e5),
    play(L) { L.addMod({ gm: 0.02, years: 5 }); L.quality(-2); return { title: '成本降下来了', text: '会少了，流程短了，但也砍掉了一些“看起来没用”的研发。' }; } },
  { id: 'layoff', name: '大裁员', icon: 'exit', color: '#7f1d1d', target: 'company', tags: ['效率'],
    desc: '裁掉两成员工：3 年毛利 +3 个点，但产品力 −5、本国品牌 −10。经济好的年份裁员更招骂。',
    cond: () => '', cost: (L) => cost(L, 0.01, 3e5),
    play(L) { L.addMod({ gm: 0.03, years: 3 }); L.quality(-5); const bad = L.sentiment(L.s.year) >= 1; L.brand(L.s.hq, bad ? -15 : -8); return { title: '裁员完成', text: bad ? '经济这么好还裁员，舆论炸了锅。' : '危机时期裁员，外界还算理解。' }; } },
  { id: 'rebrand', name: '品牌重塑', icon: 'campaign', color: '#c026d3', target: 'company', tags: ['营销'],
    desc: '换新标志、新口号：所有国家品牌 +6；25% 概率老顾客不买账，反而 −5。',
    cond: () => '', cost: (L) => cost(L, 0.02, 5e5),
    play(L) { if (L.rand('deck') < 0.25) { L.brand(null, -5); return { title: '新标志被吐槽', text: '网友说新标志“像个外卖软件”。' }; } L.brand(null, 6); return { title: '焕然一新', text: '年轻顾客觉得你变酷了。' }; } },
  { id: 'digital', name: '数字化转型', icon: 'bolt', color: '#0369a1', target: 'company', tags: ['效率'], years: [2005, 2074],
    desc: '把订单、库存、客服全面上云：8 年毛利 +1.5 个点，吸引力 +4%。',
    cond: (L) => (L.s.flags.digital ? '已经转型过了' : ''), cost: (L) => cost(L, 0.03, 8e5),
    play(L) { L.s.flags.digital = L.s.year; L.addMod({ gm: 0.015, attract: { '*': 1.04 }, years: 8 }); return { title: '系统上线', text: '决策从拍脑袋变成了看数据。' }; } },
  { id: 'ai_boost', name: 'AI 赋能', icon: 'bolt', color: '#7e22ce', target: 'company', tags: ['效率', '研发'], years: [2023, 2074],
    desc: '在研发、客服、营销里全面用 AI：毛利 +2 个点、产品力 +3（6 年）；30% 概率效果平平。',
    cond: () => '', cost: (L) => cost(L, 0.02, 6e5),
    play(L) { if (L.rand('deck') < 0.3) return { title: '效果平平', text: '工具买了，流程没变。' }; L.addMod({ gm: 0.02, years: 6 }); L.quality(3); return { title: 'AI 见效', text: '同样的人做了两倍的事。' }; } },
  { id: 'hostile', name: '恶意收购', icon: 'coin', color: '#991b1b', target: 'company', tags: ['资本', '对手'],
    desc: '收购最弱的对手：它从此消失，你的份额大涨。要花很多钱；40% 概率整合不顺，产品力 −4、两年毛利 −2 个点。',
    cond: (L) => (L.aliveRivals().length === 0 ? '没有对手可收购' : '') || (L.s.lastRev < 3e7 ? '公司太小，收购不起对手' : ''),
    cost: (L) => { const r = L.weakestRival(); return r ? L.rivalPrice(r) : 0; },
    play(L) {
      const r = L.weakestRival(); L.absorbRival(r);
      if (L.rand('deck') < 0.4) { L.quality(-4); L.addMod({ gm: -0.02, years: 2 }); return { title: `吞下了${r.name}，但消化不良`, text: '两家公司的系统和文化打架，花了好几年才理顺。' }; }
      return { title: `${r.name}被你收购了`, text: '它的客户和渠道都归你了。' };
    } },
  { id: 'patent_war', name: '专利战', icon: 'shield', color: '#1e3a8a', target: 'company', tags: ['法律', '对手'],
    desc: '起诉最强的对手侵权：55% 胜诉，它在全球削弱 3 年并赔你一笔钱；45% 败诉，你赔钱、吸引力 −6%。',
    cond: (L) => (L.aliveRivals().length === 0 ? '没有对手' : ''), cost: (L) => cost(L, 0.01, 4e5),
    play(L) {
      const r = L.strongestRival();
      const p = 0.55 + (L.s.quality > r.tech ? 0.15 : -0.1);
      if (L.rand('deck') < p) { L.hitRival(r, 0.78, 3); L.gain(cost(L, 0.02, 5e5)); return { title: `打赢了${r.name}`, text: '法院判对手侵权，禁售令让它损失惨重。' }; }
      L.pay(cost(L, 0.03, 8e5)); L.addMod({ attract: { '*': 0.94 }, years: 2 }); return { title: '专利战输了', text: `${r.name}反诉成功，你还要赔钱。` };
    } },
  { id: 'alliance', name: '战略联盟', icon: 'hand', color: '#0e7490', target: 'company', tags: ['对手'],
    desc: '和最强的对手结盟、共享技术和渠道：其他对手全球削弱 4 年，你产品力 +2；但联盟伙伴更强了，毛利让出 1 个点。',
    cond: (L) => (L.aliveRivals().length < 2 ? '至少要有两个对手' : ''), cost: () => 2e5,
    play(L) { const r = L.strongestRival(); for (const o of L.aliveRivals()) if (o !== r) L.hitRival(o, 0.85, 4); L.hitRival(r, 1.1, 4); L.quality(2); L.addMod({ gm: -0.01, years: 4 }); return { title: `和${r.name}结盟`, text: '两家联手，其他对手压力骤增。' }; } },
  { id: 'esop', name: '员工持股计划', icon: 'cap', color: '#15803d', target: 'company', tags: ['人才'],
    desc: '拿出 4% 股份给骨干：产品力 +4，之后 5 年每年多涨 0.5，员工不容易被挖。',
    cond: (L) => (L.s.ownership < 0.08 ? '你的股份太少了' : ''), cost: () => 0,
    play(L) { L.s.ownership *= 0.96; L.quality(4); L.s.flags.esop = L.s.year; return { title: '人心稳了', text: '骨干们成了股东，干劲十足。' }; } },
  { id: 'sponsor', name: '赞助全球大赛', icon: 'campaign', color: '#f59e0b', target: 'company', tags: ['营销'],
    desc: '只在奥运会或世界杯年份出现：所有国家品牌 +9。价格很贵。',
    cond: (L) => (L.s.year % 2 !== 0 ? '只有奥运会、世界杯年份才能赞助' : ''), cost: (L) => cost(L, 0.04, 2e6),
    play(L) { L.brand(null, 9); return { title: '全球亮相', text: '几十亿人看到了你的标志。' }; } },
  { id: 'esg', name: 'ESG 认证', icon: 'tree', color: '#16a34a', target: 'company', tags: ['品牌'], years: [2010, 2074],
    desc: '拿下权威可持续认证：欧洲品牌 +8，所有国家 +2；碳价越高越值钱。',
    cond: (L) => (L.s.flags.esg ? '已经认证过' : ''), cost: (L) => cost(L, 0.015, 4e5),
    play(L) { L.s.flags.esg = L.s.year; L.brand(null, 2); L.brand('DE', 6); L.brand('UK', 6); return { title: '认证通过', text: '欧洲客户把你列进了优先供应商名单。' }; } },
  { id: 'pr_team', name: '危机公关团队', icon: 'news', color: '#334155', target: 'company', tags: ['品牌'],
    desc: '常备一支危机公关团队：之后 8 年，所有品牌损失减半。',
    cond: (L) => (L.s.flags.pr && L.s.year - L.s.flags.pr < 8 ? '团队还在' : ''), cost: (L) => cost(L, 0.006, 2e5),
    play(L) { L.s.flags.pr = L.s.year; return { title: '公关团队就位', text: '下次出事，你会有准备。' }; } },
  { id: 'dual_source', name: '双供应商', icon: 'factory', color: '#57534e', target: 'company', tags: ['供应链'],
    desc: '关键零部件全部找第二家供应商：之后 10 年，断供和灾害对你的影响再减半。',
    cond: (L) => (L.s.industry === 'software' ? '软件没有供应链' : '') || (L.s.flags.dual && L.s.year - L.s.flags.dual < 10 ? '已经有备份了' : ''), cost: (L) => cost(L, 0.008, 3e5),
    play(L) { L.s.flags.dual = L.s.year; return { title: '供应链有了备胎', text: '多花一点钱，买个安心。' }; } },
  { id: 'incentive', name: '高管激励', icon: 'cap', color: '#a16207', target: 'company', tags: ['人才'],
    desc: '给管理层设对赌奖金：明年多 2 个行动点。',
    cond: () => '', cost: (L) => cost(L, 0.008, 3e5),
    play(L) { L.s.apBonusNext = (L.s.apBonusNext || 0) + 2; return { title: '管理层摩拳擦掌', text: '明年大家会更拼。' }; } },
  { id: 'foresight', name: '智库报告', icon: 'eye', color: '#4338ca', target: 'company', tags: ['情报'],
    desc: '花钱买一份宏观研判：看到未来 5 年会发生的大事。',
    cond: () => '', cost: (L) => cost(L, 0.003, 1e5),
    play(L) {
      const lines = [];
      for (let y = L.s.year + 1; y <= Math.min(L.s.year + 5, 2074); y++) { const h = L.headline(y); if (h) lines.push(`${y}：${h}`); }
      return { title: '未来五年', text: lines.join('\n') || '看不清。' };
    } },
  { id: 'crossover', name: '跨界联名', icon: 'hand', color: '#e11d48', target: 'company', tags: ['营销'],
    desc: '和别的行业的大牌出联名款：3 年吸引力 +7%、品牌 +4；30% 概率被说“割韭菜”。',
    cond: () => '', cost: (L) => cost(L, 0.012, 3e5),
    play(L) { if (L.rand('deck') < 0.3) { L.brand(null, -4); return { title: '被骂割韭菜', text: '联名款又贵又难看。' }; } L.addMod({ attract: { '*': 1.07 }, years: 3 }); L.brand(null, 4); return { title: '联名爆了', text: '黄牛都在抢。' }; } },
  { id: 'buy_distressed', name: '收购破产对手资产', icon: 'coin', color: '#b45309', target: 'company', tags: ['资本', '对手'], special: true,
    desc: '对手刚破产，它的工厂、渠道和客户在打折出售：份额大涨，价格只有平时的三成。',
    cond: (L) => (!L.s.distressed ? '最近没有对手破产' : ''), cost: (L) => (L.s.distressed ? L.s.distressed.price : 0),
    play(L) {
      const d = L.s.distressed; L.s.distressed = null;
      for (const c of Object.keys(L.s.countries)) { const cs = L.s.countries[c]; if (cs.level > 0) cs.share = Math.min(0.9, cs.share + (d.power[c] || 0) * 0.025); }
      return { title: `接手了${d.name}的家底`, text: '它的客户几乎原封不动地转到了你这里。' };
    } }
];

module.exports = { CARDS };
