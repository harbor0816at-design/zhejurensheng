// 金额、百分比和中文标签（与本地版界面一致）
function money(v, o) {
  o = o || {};
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : (o.sign && v > 0 ? '+' : '');
  if (a >= 1e8) return `${sign}${(a / 1e8).toFixed(2)} 亿`;
  if (a >= 1e7) return `${sign}${groupInt(Math.round(a / 1e4))} 万`;
  if (a >= 1e5) return `${sign}${(a / 1e4).toFixed(1)} 万`;
  if (a >= 1e4) return `${sign}${(a / 1e4).toFixed(2)} 万`;
  return `${sign}${groupInt(Math.round(a))} 元`;
}
function groupInt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
const pct = (v, d) => `${(v * 100).toFixed(d === undefined ? 1 : d)}%`;
const runway = (m) => (m >= 120 ? '10 年以上' : `${m.toFixed(1)} 个月`);

const L = {
  origin: { humble: '普通家庭', middle: '中产家庭', wealthy: '富裕家庭' },
  edu: { edu_vocational: '职校', edu_academic: '本科', edu_elite: '名校' },
  cycle: { boom: '繁荣', slowdown: '放缓', recession: '衰退', recovery: '复苏' },
  path: { public: '公务/事业', employee: '企业雇员', professional: '专业执业', freelance: '自由职业', trade: '技能工贸', founder: '创业者' },
  level: { entry: '初级', mid: '中级', senior: '资深', principal: '顶级' },
  lifestyle: { frugal: '节俭', decent: '体面', hedonic: '享乐' },
  mix: { cash_heavy: '保守', balanced: '均衡', aggressive: '进取' },
  product: { deposit: '存款', money_fund: '货币基金', index_fund: '指数基金', sector_fund: '行业基金', housing: '房产' },
  loan: { mortgage: '房贷', consumer: '消费贷', emergency: '应急借款', business_guarantee: '担保债务' },
  risk: { low: '低风险', medium: '中风险', high: '高风险' },
  industry: { manufacturing: '制造', export: '出口', finance: '金融', professional: '专业服务', consumer: '消费', logistics: '物流', local_service: '本地服务', resources: '资源', public: '公共服务', venture: '自有企业' },
  account: { I: '收入', E: '支出', T: '税', D: '还债', F: '资金往来' },
  accShort: { I: '收', E: '支', T: '税', D: '债', F: '资' },
  reveal: { hidden_risk: '隐藏风险', industry_outlook: '行业与周期展望', debt_roll_risk: '债务滚动风险', outcome_sigma: '把握程度' },
  strategy: { risk_management: '风险管理', cashflow_allocation: '现金流配置', information_judgment: '信息判断', opportunity_cost: '机会成本', planning_adaptability: '规划与应变' },
  result: { wealth_freedom: '财富自由', family_stability: '家庭稳定', career_achievement: '事业成就', healthy_life: '健康生活', balanced_growth: '均衡成长' },
  attr: { health: '健康', energy: '精力', family: '家庭', capability: '能力', network: '人脉', happiness: '幸福' }
};

const SUB = {
  salary_gross: '工资（税前）', guarantee_debt_interest: '担保债务利息', restructure_floor_retained: '重组保底留存', guarantee_debt_principal: '担保债务本金', owner_draw: '企业分红', partner_income: '配偶收入', severance: '经济补偿', side_income: '副业收入', unemployment_benefit: '失业金', inheritance: '继承', other_income: '其他收入', event_income: '意外收入', living_cost: '生活费', intel_fee: '情报费', medical: '医疗', education: '教育/培训', education_tuition: '学费', relocation: '搬家', moving: '搬家', wedding: '婚礼', repair: '房屋维修', fitness: '健身', fraud_loss: '被骗损失', bad_loan: '借出未还', exam_fee: '考试费', venture_loss: '创业亏损', closing_cost_sunk: '购房沉没费用', house_sale_costs: '卖房中介与折价', liquidation_haircut: '变现折价', event_expense: '其他支出', side_project_spend: '项目支出', social_insurance: '社保', income_tax: '个人所得税', transaction_tax_housing: '房产交易税', property_tax: '房产税', capital_gains_tax: '股权转让税', tax_exempt: '免税', mortgage_interest: '房贷利息', mortgage_principal: '房贷本金', consumer_loan_interest: '消费贷利息', consumer_loan_principal: '消费贷本金', emergency_loan_interest: '应急借款利息', emergency_loan_principal: '应急借款本金', guarantee_interest: '担保债务利息', guarantee_principal: '担保债务本金', asset_purchase_outflow: '买入资产', asset_sale_proceeds: '卖出资产', house_sale_proceeds: '卖房回款', new_mortgage: '房贷放款（直付卖方）', new_personal_loan: '借款到账', new_emergency_loan: '应急借款到账', venture_capital_in: '投入企业', venture_liquidation_proceeds: '清算回款', venture_sale_proceeds: '卖公司回款', loan_repayment: '提前还款'
};
function subName(sub) {
  if (SUB[sub]) return SUB[sub];
  const m = /^asset_(purchase|sale|sell|redeem|buy)_(.+)$/.exec(sub);
  if (m) return `${m[1] === 'purchase' || m[1] === 'buy' ? '买入' : '卖出'}${L.product[m[2]] || m[2]}`;
  return String(sub).replace(/_/g, ' ');
}

module.exports = { money, pct, runway, L, subName, groupInt };
