// 分享卡图片（5:4）
const T = require('./theme.js');
const F = require('../game/format.js');
const { roundRect } = require('./core.js');

let cache = { key: '', path: '' };

function make(life) {
  const s = life.s;
  const primary = (s.endings || []).find((e) => e.role === 'primary');
  const key = `${s.seed}|${s.year}|${s.valuation}`;
  if (cache.key === key && cache.path) return cache.path;
  try {
    const W = 500; const H = 400;
    const cv = wx.createCanvas();
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, T.c.bgTop); g.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 估值曲线
    const h = s.history.map((x) => x.valuation);
    if (h.length > 1) {
      const hi = Math.max(...h, 1);
      ctx.beginPath();
      h.forEach((v, i) => { const x = 30 + i / (h.length - 1) * (W - 60); const y = H - 46 - v / hi * 120; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.strokeStyle = 'rgba(96,165,250,0.6)'; ctx.lineWidth = 4; ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#93c5fd'; ctx.font = T.font(22, 600);
    ctx.fillText(`${s.name} · ${life.ind.name} · 1995–2024`, W / 2, 58);
    ctx.fillStyle = '#ffffff'; ctx.font = T.font(62, 800);
    ctx.fillText(primary ? primary.name : '还在经营中', W / 2, 140);
    const info = `估值 ${F.usd(s.valuation)} · 种子 ${s.seed}`;
    let fs = 24; ctx.font = T.font(fs, 600);
    while (fs > 14 && ctx.measureText(info).width > W - 110) { fs -= 1; ctx.font = T.font(fs, 600); }
    const bw = Math.min(W - 50, ctx.measureText(info).width + 44);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(ctx, (W - bw) / 2, 170, bw, 50, 14); ctx.fill();
    ctx.fillStyle = '#e2e8f0'; ctx.fillText(info, W / 2, 203);
    ctx.fillStyle = '#fbbf24'; ctx.font = T.font(22, 700);
    ctx.fillText('同一个种子，你能把公司做多大？', W / 2, H - 18);
    const path = cv.toTempFilePathSync({ x: 0, y: 0, width: W, height: H, destWidth: W, destHeight: H, fileType: 'png' });
    cache = { key, path };
    return path;
  } catch (e) { return ''; }
}

module.exports = { make };
