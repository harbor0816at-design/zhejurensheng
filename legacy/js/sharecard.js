// 分享卡图片（5:4，微信分享卡推荐比例）。画在离屏 canvas 上，导出临时文件路径。
const T = require('./theme.js');
const F = require('../game/format.js');
const { roundRect } = require('./core.js');

let cache = { key: '', path: '' };

function make(life) {
  const s = life.s;
  const primary = (s.endings || []).find((e) => e.role === 'primary');
  const secondary = (s.endings || []).filter((e) => e.role === 'secondary').map((e) => e.name);
  const key = `${s.life_id}|${s.age}|${primary && primary.id}`;
  if (cache.key === key && cache.path) return cache.path;
  try {
    const W = 500; const H = 400;
    const cv = wx.createCanvas();
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, T.c.bgTop); g.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 曲线装饰
    const pts = s.history.map((h) => h.net_worth / (h.price_level || 1));
    if (pts.length > 1) {
      const lo = Math.min(0, ...pts); const hi = Math.max(1, ...pts);
      ctx.beginPath();
      pts.forEach((v, i) => {
        const x = 30 + (i / (pts.length - 1)) * (W - 60);
        const y = H - 40 - ((v - lo) / (hi - lo)) * 110;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.strokeStyle = 'rgba(96,165,250,0.55)'; ctx.lineWidth = 4; ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#93c5fd'; ctx.font = T.font(22, 600);
    ctx.fillText('这局人生 · 我的称号', W / 2, 64);
    ctx.fillStyle = '#ffffff'; ctx.font = T.font(64, 800);
    ctx.fillText(primary ? primary.name : '人生一局', W / 2, 150);
    if (secondary.length) { ctx.fillStyle = '#c4b5fd'; ctx.font = T.font(24, 600); ctx.fillText(secondary.join(' · '), W / 2, 196); }
    const info = `种子 ${s.seed} · 净资产 ${F.money(s.net_worth / s.macro.price_level)}`;
    let fs = 24;
    ctx.font = T.font(fs, 600);
    while (fs > 14 && ctx.measureText(info).width > W - 120) { fs -= 1; ctx.font = T.font(fs, 600); }
    const bw = Math.min(W - 60, ctx.measureText(info).width + 48);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(ctx, (W - bw) / 2, 214, bw, 60, 14); ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(info, W / 2, 242);
    ctx.fillStyle = '#94a3b8'; ctx.font = T.font(14);
    ctx.fillText('净资产按 18 岁物价折算', W / 2, 264);
    ctx.fillStyle = '#fbbf24'; ctx.font = T.font(22, 700);
    ctx.fillText('同一个种子，你能活成什么样？', W / 2, H - 18);
    const path = cv.toTempFilePathSync({ x: 0, y: 0, width: W, height: H, destWidth: W, destHeight: H, fileType: 'png' });
    cache = { key, path };
    return path;
  } catch (e) {
    return '';
  }
}

module.exports = { make };
