// 金额（美元）与百分比格式
function group(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function usd(v, o) {
  o = o || {};
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : (o.sign && v > 0 ? '+' : '');
  const unit = o.short ? '' : '美元';
  let s;
  if (a >= 1e10) s = `${group(Math.round(a / 1e8))} 亿`;
  else if (a >= 1e8) s = `${(a / 1e8).toFixed(1)} 亿`;
  else if (a >= 1e6) s = `${group(Math.round(a / 1e4))} 万`;
  else if (a >= 1e4) s = `${(a / 1e4).toFixed(1)} 万`;
  else s = `${Math.round(a)} `;
  return `${sign}${s}${unit}`.replace(/ $/, '');
}
function pct(v, d) {
  if (!Number.isFinite(v)) return '—';
  const digits = d !== undefined ? d : (Math.abs(v) < 0.01 ? 2 : 1);
  return `${(v * 100).toFixed(digits)}%`;
}
function signedPct(v, d) { return `${v > 0 ? '+' : v < 0 ? '−' : ''}${pct(Math.abs(v), d)}`; }

const L = {
  rnd: { low: '低', mid: '中', high: '高' },
  rndHint: { low: '收入的 2%，产品力会慢慢落后', mid: '收入的 5%，大致跟上行业', high: '收入的 10%，产品力领先' },
  price: { low: '低价', mid: '平价', premium: '溢价' },
  priceHint: { low: '份额涨得快，利润薄', mid: '均衡', premium: '份额涨得慢，利润厚，品牌加分' }
};

module.exports = { group, usd, pct, signedPct, L };
