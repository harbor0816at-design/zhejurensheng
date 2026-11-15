// Canvas 界面内核：每帧由页面函数重新排版生成显示列表，再按滚动位置绘制。
// 页面写法类似即时模式：flow.text(...) / flow.button(...) / flow.card(...)。
const T = require('./theme.js');

// ---------------- 文字测量与换行 ----------------
const NO_LINE_START = '，。、；：！？）》」』”’%,.;:!?)]}…·～';
function tokenize(str) {
  const out = [];
  const re = /[\x21-\x7e]+|\s+|[\s\S]/g;
  let m;
  while ((m = re.exec(str))) out.push(m[0]);
  return out;
}

class Measurer {
  constructor(ctx) { this.ctx = ctx; this.cache = new Map(); this.wrapCache = new Map(); }
  width(s, font) {
    const k = font + '\u0001' + s;
    let v = this.cache.get(k);
    if (v === undefined) {
      this.ctx.font = font;
      v = this.ctx.measureText(s).width;
      if (this.cache.size > 20000) this.cache.clear();
      this.cache.set(k, v);
    }
    return v;
  }
  wrap(str, font, maxW) {
    const key = font + '\u0001' + maxW + '\u0001' + str;
    const hit = this.wrapCache.get(key);
    if (hit) return hit;
    const lines = [];
    for (const para of String(str).split('\n')) {
      let line = '';
      let lw = 0;
      for (let tok of tokenize(para)) {
        let tw = this.width(tok, font);
        if (lw + tw <= maxW || line === '' && tw <= maxW) { line += tok; lw += tw; continue; }
        if (/^\s+$/.test(tok)) { lines.push(line); line = ''; lw = 0; continue; }
        if (NO_LINE_START.indexOf(tok[0]) >= 0 && tok.length === 1) { line += tok; lw += tw; continue; }
        if (tw > maxW) { // 超长英文/数字串：按字符拆
          for (const ch of tok) {
            const cw = this.width(ch, font);
            if (lw + cw > maxW && line) { lines.push(line); line = ''; lw = 0; }
            line += ch; lw += cw;
          }
          continue;
        }
        lines.push(line.replace(/\s+$/, ''));
        line = tok.replace(/^\s+/, ''); lw = this.width(line, font);
      }
      lines.push(line);
    }
    if (this.wrapCache.size > 4000) this.wrapCache.clear();
    this.wrapCache.set(key, lines);
    return lines;
  }
}

// ---------------- 排版流 ----------------
class Flow {
  constructor(m, x, w, y) {
    this.m = m; this.x = x; this.w = w; this.y = y || 0;
    this.cmds = []; this.hits = [];
  }
  push(c) { this.cmds.push(c); return c; }
  gap(h) { this.y += h; return this; }

  // 文本段落
  text(s, o) {
    o = o || {};
    if (s === null || s === undefined || s === '') return this;
    const size = o.size || 15;
    const f = T.font(size, o.weight);
    const lh = Math.round(size * (o.lh || 1.55));
    const x = this.x + (o.indent || 0);
    const w = (o.w || this.w) - (o.indent || 0);
    let lines = this.m.wrap(String(s), f, w);
    if (o.maxLines && lines.length > o.maxLines) {
      lines = lines.slice(0, o.maxLines);
      lines[lines.length - 1] = lines[lines.length - 1].replace(/.$/, '…');
    }
    const align = o.align || 'left';
    const tx = align === 'center' ? x + w / 2 : align === 'right' ? x + w : x;
    for (const ln of lines) {
      this.push({ t: 'text', x: tx, y: this.y + Math.round(lh / 2 + size * 0.36), s: ln, font: f, color: o.color || T.c.body, align, cy0: this.y, cy1: this.y + lh });
      this.y += lh;
    }
    return this;
  }
  measureText(s, o) {
    o = o || {};
    const size = o.size || 15;
    const lines = this.m.wrap(String(s), T.font(size, o.weight), o.w || this.w);
    return lines.length * Math.round(size * (o.lh || 1.55));
  }

  eyebrow(s, color) {
    return this.text(s, { size: 12, weight: 600, color: color || T.c.accent, lh: 1.4 }).gap(2);
  }
  title(s, o) {
    o = o || {};
    return this.text(s, { size: o.size || 20, weight: 700, color: o.color || T.c.ink, lh: 1.35, align: o.align });
  }
  sectionTitle(s, note) {
    this.gap(6);
    const f = T.font(14, 600);
    const y = this.y;
    this.push({ t: 'text', x: this.x, y: y + 16, s, font: f, color: T.c.ink, cy0: y, cy1: y + 22 });
    if (note) {
      const tw = this.m.width(s, f) + 8;
      this.text(note, { size: 11, color: T.c.faint, indent: tw, lh: 2.0 });
      if (this.y < y + 22) this.y = y + 22;
    } else this.y += 22;
    return this.gap(6);
  }

  // 左右对齐一行：标签 + 数值
  row(label, value, o) {
    o = o || {};
    const size = o.size || 14;
    const h = o.h || Math.round(size * 1.9);
    const fy = this.y + Math.round(h / 2 + size * 0.36);
    this.push({ t: 'text', x: this.x, y: fy, s: label, font: T.font(size, o.labelWeight), color: o.labelColor || T.c.muted, cy0: this.y, cy1: this.y + h });
    let rx = this.x + this.w;
    if (o.button) {
      const bw = this.m.width(o.button.label, T.font(12, 600)) + 20;
      const bh = 26;
      const by = this.y + (h - bh) / 2;
      this.push({ t: 'rect', x: rx - bw, y: by, w: bw, h: bh, r: 8, fill: T.c.soft, stroke: T.c.line, cy0: by, cy1: by + bh });
      this.push({ t: 'text', x: rx - bw / 2, y: by + 17, s: o.button.label, font: T.font(12, 600), color: o.button.color || T.c.accent, align: 'center', cy0: by, cy1: by + bh });
      this.hits.push({ x: rx - bw - 4, y: by - 6, w: bw + 8, h: bh + 12, r: 8, onTap: o.button.onTap, id: o.button.id });
      rx -= bw + 10;
    }
    this.push({ t: 'text', x: rx, y: fy, s: value, font: T.font(o.valueSize || size, o.valueWeight || 600), color: o.valueColor || T.c.ink, align: 'right', cy0: this.y, cy1: this.y + h });
    this.y += h;
    if (o.line) this.divider(0);
    return this;
  }

  divider(margin) {
    const m = margin === undefined ? 6 : margin;
    this.y += m;
    this.push({ t: 'line', x1: this.x, y1: this.y + 0.5, x2: this.x + this.w, y2: this.y + 0.5, color: T.c.line, lw: 1, cy0: this.y, cy1: this.y + 1 });
    this.y += m + 1;
    return this;
  }

  // 小方块网格：[{k, v, color, bg}]
  tiles(items, cols, o) {
    o = o || {};
    cols = cols || 2;
    const gap = 8;
    const tw = (this.w - gap * (cols - 1)) / cols;
    const vs = o.valueSize || 16;
    const vlh = Math.round(vs * 1.35);
    const vf = T.font(vs, 700);
    for (let r = 0; r < items.length; r += cols) {
      const row = items.slice(r, r + cols).map((it) => Object.assign({ lines: this.m.wrap(String(it.v), vf, tw - 20) }, it));
      const h = 32 + Math.max.apply(null, row.map((it) => it.lines.length)) * vlh + 10;
      const y = this.y;
      row.forEach((it, col) => {
        const x = this.x + col * (tw + gap);
        this.push({ t: 'rect', x, y, w: tw, h, r: T.r.tile, fill: it.bg || T.c.soft, cy0: y, cy1: y + h });
        this.push({ t: 'text', x: x + 10, y: y + 22, s: it.k, font: T.font(12), color: T.c.muted, cy0: y, cy1: y + 30 });
        it.lines.forEach((ln, li) => {
          const ly = y + 30 + li * vlh;
          this.push({ t: 'text', x: x + 10, y: ly + Math.round(vs * 1.05), s: ln, font: vf, color: it.color || T.c.ink, cy0: ly, cy1: ly + vlh });
        });
      });
      this.y += h + (r + cols < items.length ? gap : 0);
    }
    this.y += o.after === undefined ? 8 : o.after;
    return this;
  }

  // 按钮：kind = primary / secondary / ghost / danger / option
  button(label, onTap, o) {
    o = o || {};
    const kind = o.kind || 'primary';
    const h = o.h || (o.big === false ? 40 : 48);
    const x = o.x !== undefined ? o.x : this.x;
    const w = o.w || this.w;
    const y = this.y;
    const dis = !!o.disabled;
    const styles = {
      primary: { fill: T.c.accent, color: '#ffffff' },
      secondary: { fill: '#ffffff', color: T.c.accentDark, stroke: '#bfdbfe' },
      ghost: { fill: T.c.soft, color: T.c.body },
      danger: { fill: '#ffffff', color: T.c.neg, stroke: '#fecaca' },
      dark: { fill: 'rgba(255,255,255,0.10)', color: '#ffffff', stroke: 'rgba(255,255,255,0.18)' },
      link: { fill: null, color: o.color || T.c.muted }
    };
    const st = styles[kind] || styles.primary;
    if (st.fill || st.stroke) {
      this.push({ t: 'rect', x, y, w, h, r: o.r || T.r.btn, fill: dis ? '#e2e8f0' : st.fill, stroke: dis ? null : st.stroke, cy0: y, cy1: y + h });
    }
    const size = o.size || (h >= 46 ? 16 : 14);
    const color = dis ? T.c.faint : st.color;
    if (o.sub) {
      this.push({ t: 'text', x: x + w / 2, y: y + h / 2 - 2, s: label, font: T.font(size, 600), color, align: 'center', cy0: y, cy1: y + h });
      this.push({ t: 'text', x: x + w / 2, y: y + h / 2 + 14, s: o.sub, font: T.font(11), color: dis ? T.c.faint : (kind === 'primary' ? '#dbeafe' : T.c.muted), align: 'center', cy0: y, cy1: y + h });
    } else {
      this.push({ t: 'text', x: x + w / 2, y: y + h / 2 + size * 0.36, s: label, font: T.font(size, 600), color, align: 'center', cy0: y, cy1: y + h });
    }
    if (!dis && onTap) this.hits.push({ x, y, w, h, r: o.r || T.r.btn, onTap, id: o.id });
    if (o.inline) return h;
    this.y += h + (o.after === undefined ? 10 : o.after);
    return this;
  }

  // 一行多个等宽按钮
  buttons(items, o) {
    o = o || {};
    const gap = 8;
    const n = items.length;
    const w = (this.w - gap * (n - 1)) / n;
    let h = 0;
    items.forEach((it, i) => {
      h = this.button(it.label, it.onTap, Object.assign({ kind: 'ghost', h: o.h || 38, size: o.size || 13 }, it, { x: this.x + i * (w + gap), w, inline: true }));
    });
    this.y += h + (o.after === undefined ? 8 : o.after);
    return this;
  }

  // 分段选择
  seg(items, o) {
    o = o || {};
    const h = o.h || 36;
    const y = this.y;
    this.push({ t: 'rect', x: this.x, y, w: this.w, h, r: 10, fill: T.c.soft, cy0: y, cy1: y + h });
    const n = items.length;
    const w = (this.w - 6) / n;
    items.forEach((it, i) => {
      const x = this.x + 3 + i * w;
      if (it.on) this.push({ t: 'rect', x, y: y + 3, w, h: h - 6, r: 8, fill: '#ffffff', stroke: T.c.line, cy0: y, cy1: y + h });
      this.push({ t: 'text', x: x + w / 2, y: y + h / 2 + 5, s: it.label, font: T.font(o.size || 13, it.on ? 700 : 500), color: it.on ? T.c.accentDark : T.c.muted, align: 'center', cy0: y, cy1: y + h });
      if (it.onTap && !it.on) this.hits.push({ x, y, w, h, r: 8, onTap: it.onTap, id: it.id });
    });
    this.y += h + (o.after === undefined ? 8 : o.after);
    return this;
  }

  // 行内小标签，自动换行：[{text, color, bg}]
  chips(items, o) {
    o = o || {};
    const f = T.font(o.size || 12, 500);
    const h = o.h || 24;
    let x = this.x;
    let y = this.y;
    items.filter(Boolean).forEach((it) => {
      const w = this.m.width(it.text, f) + 16;
      if (x + w > this.x + this.w && x > this.x) { x = this.x; y += h + 6; }
      this.push({ t: 'rect', x, y, w, h, r: T.r.chip, fill: it.bg || T.c.soft, cy0: y, cy1: y + h });
      this.push({ t: 'text', x: x + 8, y: y + h / 2 + 4.5, s: it.text, font: f, color: it.color || T.c.body, cy0: y, cy1: y + h });
      x += w + 6;
    });
    this.y = y + h + (o.after === undefined ? 8 : o.after);
    return this;
  }

  // 方块进度条（时间预算等）
  cells(label, used, total) {
    const y = this.y;
    const h = 22;
    this.push({ t: 'text', x: this.x, y: y + 15, s: label, font: T.font(12), color: T.c.muted, cy0: y, cy1: y + h });
    const vs = `${used}/${total}`;
    const vw = this.m.width(vs, T.font(12, 600));
    this.push({ t: 'text', x: this.x + this.w, y: y + 15, s: vs, font: T.font(12, 600), color: T.c.ink, align: 'right', cy0: y, cy1: y + h });
    const x0 = this.x + 36;
    const avail = this.w - 36 - vw - 10;
    const g = 3;
    const cw = Math.max(4, (avail - g * (total - 1)) / Math.max(1, total));
    for (let i = 0; i < total; i++) {
      this.push({ t: 'rect', x: x0 + i * (cw + g), y: y + 6, w: cw, h: 10, r: 3, fill: i < used ? T.c.accent : T.c.line, cy0: y, cy1: y + h });
    }
    this.y += h + 6;
    return this;
  }

  // 卡片容器
  card(o, fn) {
    if (typeof o === 'function') { fn = o; o = {}; }
    const pad = o.pad === undefined ? T.pad : o.pad;
    const sx = this.x; const sw = this.w; const sy = this.y;
    const bg = this.push({ t: 'rect', x: sx, y: sy, w: sw, h: 0, r: o.r || T.r.card, fill: o.bg || T.c.card, stroke: o.stroke || null, lw: o.lw || 1, cy0: sy, cy1: sy });
    let stripe = null;
    if (o.stripe) stripe = this.push({ t: 'rect', x: sx, y: sy, w: 4, h: 0, r: 2, fill: o.stripe, cy0: sy, cy1: sy });
    this.x += pad; this.w -= pad * 2; this.y += pad;
    fn(this);
    this.y += pad - (o.trim || 0);
    bg.h = this.y - sy; bg.cy1 = this.y;
    if (stripe) { stripe.y = sy + 12; stripe.h = bg.h - 24; stripe.cy1 = this.y; }
    if (o.onTap) this.hits.push({ x: sx, y: sy, w: sw, h: bg.h, r: o.r || T.r.card, onTap: o.onTap, id: o.id });
    this.x = sx; this.w = sw;
    this.y += o.after === undefined ? T.gap : o.after;
    return this;
  }

  // 自定义绘制区域：draw(push, x, y, w, h)
  custom(h, draw) {
    const y = this.y;
    draw((c) => { c.cy0 = y; c.cy1 = y + h; this.push(c); }, this.x, y, this.w, h);
    this.y += h;
    return this;
  }

  hit(x, y, w, h, onTap, id, extra) { this.hits.push(Object.assign({ x, y, w, h, r: 8, onTap, id }, extra || {})); }
}

// ---------------- 渲染器 ----------------
function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCmds(ctx, cmds, viewTop, viewBottom) {
  for (const c of cmds) {
    if (c.cy1 !== undefined && c.cy0 !== undefined && (c.cy1 < viewTop || c.cy0 > viewBottom)) continue;
    switch (c.t) {
      case 'rect':
        roundRect(ctx, c.x, c.y, c.w, c.h, c.r);
        if (c.fill) { ctx.fillStyle = c.fill; ctx.fill(); }
        if (c.stroke) { ctx.strokeStyle = c.stroke; ctx.lineWidth = c.lw || 1; ctx.stroke(); }
        break;
      case 'text':
        ctx.font = c.font; ctx.fillStyle = c.color; ctx.textAlign = c.align || 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(c.s, c.x, c.y);
        break;
      case 'line':
        ctx.beginPath(); ctx.strokeStyle = c.color; ctx.lineWidth = c.lw || 1;
        if (c.dash && ctx.setLineDash) ctx.setLineDash(c.dash);
        ctx.moveTo(c.x1, c.y1); ctx.lineTo(c.x2, c.y2); ctx.stroke();
        if (c.dash && ctx.setLineDash) ctx.setLineDash([]);
        break;
      case 'circle':
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        if (c.fill) { ctx.fillStyle = c.fill; ctx.fill(); }
        if (c.stroke) { ctx.strokeStyle = c.stroke; ctx.lineWidth = c.lw || 1; ctx.stroke(); }
        break;
      case 'poly':
        if (!c.pts.length) break;
        ctx.beginPath(); ctx.moveTo(c.pts[0][0], c.pts[0][1]);
        for (let i = 1; i < c.pts.length; i++) ctx.lineTo(c.pts[i][0], c.pts[i][1]);
        if (c.fill) { ctx.closePath(); ctx.fillStyle = c.fill; ctx.fill(); }
        if (c.color) { ctx.strokeStyle = c.color; ctx.lineWidth = c.lw || 1.5; ctx.lineJoin = 'round'; ctx.stroke(); }
        break;
      default:
    }
  }
}

class Renderer {
  constructor(platform) {
    this.p = platform;
    this.sys = platform.systemInfo();
    const { w, h, dpr } = this.sys;
    this.canvas = platform.createCanvas();
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx = this.canvas.getContext('2d');
    this.W = w; this.H = h; this.dpr = dpr;
    this.m = new Measurer(this.ctx);
    this.scrollY = 0; this.maxScroll = 0;
    this.page = null;          // { header(flow), body(flow), footer(flow) }
    this.dirty = true;
    this.vel = 0; this.anim = false;
    this.touch = null;
    this.toast = null;
    this.fade = 1;
    this.layoutCache = null;
    this.bindTouch();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize(w, h) {
    if (!w || !h || (w === this.W && h === this.H)) return;
    this.W = w; this.H = h; this.sys.w = w; this.sys.h = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.m.wrapCache.clear();
    this.invalidate();
  }

  setPage(page, opts) {
    this.page = page;
    if (!opts || !opts.keepScroll) this.scrollY = 0;
    this.vel = 0;
    this.fade = opts && opts.noFade ? 1 : 0;
    if (!opts || !opts.keepScroll) this.toast = null; // 换页时清掉旧提示
    this.invalidate();
  }
  invalidate() { this.dirty = true; }
  showToast(msg, ms) { this.toast = { msg, until: Date.now() + (ms || 1800) }; this.invalidate(); }
  scrollTo(y) { this.scrollY = Math.max(0, Math.min(this.maxScroll, y)); this.invalidate(); }

  // 顶栏高度：避开状态栏和右上角胶囊
  headerHeight() {
    const mb = this.sys.menu;
    return mb && mb.bottom ? mb.bottom + 8 : this.sys.statusBar + 44;
  }

  layout() {
    const side = T.side;
    const page = this.page || {};
    const hdrH = page.header ? this.headerHeight() : this.sys.statusBar + 8;
    let footer = null;
    if (page.footer) {
      footer = new Flow(this.m, side, this.W - side * 2, 10);
      page.footer(footer);
      footer.y += 10 + Math.max(this.sys.safeBottom, 8);
    }
    const footH = footer ? footer.y : 0;
    const body = new Flow(this.m, side, this.W - side * 2, hdrH + 10);
    if (page.body && !page.surface) page.body(body);
    this.surfaceRect = page.surface ? { x: 0, y: hdrH, w: this.W, h: this.H - hdrH - footH } : null;
    const contentBottom = body.y + (footer ? 4 : Math.max(this.sys.safeBottom, 16) + 8);
    let header = null;
    if (page.header) {
      header = new Flow(this.m, side, this.W - side * 2, 0);
      page.header(header, hdrH, this.sys);
    }
    this.maxScroll = page.surface ? 0 : Math.max(0, contentBottom - (this.H - footH));
    if (this.scrollY > this.maxScroll) this.scrollY = this.maxScroll;
    this.layoutCache = { body, footer, header, hdrH, footH };
  }

  draw() {
    const ctx = this.ctx;
    const { body, footer, header, hdrH, footH } = this.layoutCache;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, this.H);
    g.addColorStop(0, T.c.bgTop); g.addColorStop(1, T.c.bgBottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, this.W, this.H);
    ctx.globalAlpha = this.fade;

    // 正文
    ctx.save();
    ctx.beginPath(); ctx.rect(0, header ? hdrH : 0, this.W, this.H - footH - (header ? hdrH : 0)); ctx.clip();
    ctx.translate(0, -this.scrollY);
    drawCmds(ctx, body.cmds, this.scrollY, this.scrollY + this.H);
    this.drawPressed(ctx, body.hits, 'body');
    ctx.restore();

    if (this.page && this.page.surface && this.surfaceRect) {
      ctx.save(); ctx.globalAlpha = 1;
      try { this.page.surface.draw(ctx, this.surfaceRect); } catch (e) { console.error(e); }
      ctx.restore(); ctx.globalAlpha = this.fade;
    }
    // 顶栏
    if (header) {
      ctx.fillStyle = 'rgba(15,23,42,0.96)'; ctx.fillRect(0, 0, this.W, hdrH);
      if (this.scrollY > 2) { ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, hdrH - 1, this.W, 1); }
      drawCmds(ctx, header.cmds, -1e9, 1e9);
      this.drawPressed(ctx, header.hits, 'header');
    }
    // 底栏
    if (footer) {
      ctx.save(); ctx.translate(0, this.H - footH);
      const fg = ctx.createLinearGradient(0, 0, 0, 14);
      fg.addColorStop(0, 'rgba(30,41,59,0)'); fg.addColorStop(1, 'rgba(30,41,59,0.97)');
      ctx.fillStyle = fg; ctx.fillRect(0, -14, this.W, 14);
      ctx.fillStyle = 'rgba(30,41,59,0.97)'; ctx.fillRect(0, 0, this.W, footH);
      drawCmds(ctx, footer.cmds, -1e9, 1e9);
      this.drawPressed(ctx, footer.hits, 'footer');
      ctx.restore();
    }
    // 滚动条
    if (this.maxScroll > 0 && (this.touch || this.anim)) {
      const vh = this.H - footH - hdrH;
      const bh = Math.max(30, vh * vh / (vh + this.maxScroll));
      const by = hdrH + (vh - bh) * (this.scrollY / this.maxScroll);
      ctx.fillStyle = 'rgba(148,163,184,0.5)';
      roundRect(ctx, this.W - 4, by, 3, bh, 1.5); ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.drawDrag(ctx);
    // 提示
    if (this.toast) {
      if (Date.now() > this.toast.until) this.toast = null;
      else {
        const f = T.font(14, 500);
        const lines = this.m.wrap(this.toast.msg, f, this.W - 100);
        const tw = Math.min(this.W - 60, Math.max(...lines.map((l) => this.m.width(l, f))) + 32);
        const th = lines.length * 21 + 20;
        const tx = (this.W - tw) / 2; const ty = this.page && this.page.toastTop && this.surfaceRect ? this.surfaceRect.y + this.surfaceRect.h - th - 14 : this.H * 0.42;
        ctx.fillStyle = 'rgba(15,23,42,0.92)'; roundRect(ctx, tx, ty, tw, th, 12); ctx.fill();
        ctx.font = f; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        lines.forEach((l, i) => ctx.fillText(l, this.W / 2, ty + 25 + i * 21));
      }
    }
  }

  drawPressed(ctx, hits, layer) {
    const t = this.touch;
    if (!t || t.moved || t.dragging || !t.hit || t.layer !== layer) return;
    const h = hits.find((x) => (t.hit.id ? x.id === t.hit.id : Math.abs(x.x - t.hit.x) < 1 && Math.abs(x.y - t.hit.y) < 1)) || t.hit;
    ctx.fillStyle = 'rgba(15,23,42,0.10)';
    roundRect(ctx, h.x, h.y, h.w, h.h, h.r || 8); ctx.fill();
  }

  loop() {
    const now = Date.now();
    if (this.fade < 1) { this.fade = Math.min(1, this.fade + 0.16); this.dirty = true; }
    if (this.anim) {
      const dt = Math.min(48, now - (this.lastT || now));
      this.scrollY += this.vel * dt;
      this.vel *= Math.pow(0.94, dt / 16);
      if (this.scrollY < 0) { this.scrollY = 0; this.vel = 0; }
      if (this.scrollY > this.maxScroll) { this.scrollY = this.maxScroll; this.vel = 0; }
      if (Math.abs(this.vel) < 0.02) { this.anim = false; }
      this.dirty = true;
    }
    if (this.toast) this.dirty = true;
    if (this.page && this.page.animate && now - (this.lastAnim || 0) > (this.page.animateMs || 66)) { this.dirty = true; this.lastAnim = now; }
    this.lastT = now;
    if (this.dirty) {
      this.dirty = false;
      try { this.layout(); this.draw(); } catch (e) { console.error(e); }
    }
    requestAnimationFrame(this.loop);
  }

  findHit(x, y) {
    const L = this.layoutCache;
    if (!L) return null;
    const inside = (h, px, py) => px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h;
    if (L.footer && y >= this.H - L.footH) {
      const py = y - (this.H - L.footH);
      for (let i = L.footer.hits.length - 1; i >= 0; i--) if (inside(L.footer.hits[i], x, py)) return { hit: L.footer.hits[i], layer: 'footer' };
      return null;
    }
    if (L.header && y < L.hdrH) {
      for (let i = L.header.hits.length - 1; i >= 0; i--) if (inside(L.header.hits[i], x, y)) return { hit: L.header.hits[i], layer: 'header' };
      return null;
    }
    const py = y + this.scrollY;
    for (let i = L.body.hits.length - 1; i >= 0; i--) if (inside(L.body.hits[i], x, py)) return { hit: L.body.hits[i], layer: 'body' };
    return null;
  }

  // 拖拽落点：正文里带 drop 的区域
  findDrop(x, y) {
    const L = this.layoutCache;
    if (!L || y < L.hdrH || y > this.H - L.footH) return null;
    const py = y + this.scrollY;
    for (let i = L.body.hits.length - 1; i >= 0; i--) {
      const h = L.body.hits[i];
      if (h.drop && x >= h.x && x <= h.x + h.w && py >= h.y && py <= h.y + h.h) return h;
    }
    return null;
  }

  drawDrag(ctx) {
    const t = this.touch;
    if (!t || !t.dragging || t.px === undefined) return;
    const L = this.layoutCache;
    const d = t.dragging;
    // 当前停留的落点
    if (t.over) {
      const h = t.over;
      const verdict = h.accepts ? h.accepts(d) : { ok: true };
      ctx.save();
      ctx.beginPath(); ctx.rect(0, L.hdrH, this.W, this.H - L.footH - L.hdrH); ctx.clip();
      ctx.translate(0, -this.scrollY);
      roundRect(ctx, h.x - 2, h.y - 2, h.w + 4, h.h + 4, (h.r || 12) + 2);
      ctx.lineWidth = 3; ctx.strokeStyle = verdict.ok ? '#22c55e' : '#f87171'; ctx.stroke();
      ctx.fillStyle = verdict.ok ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)'; ctx.fill();
      ctx.restore();
      // 提示条
      const msg = verdict.ok ? (verdict.label || '松手放下') : (verdict.reason || '这里放不了');
      const f = T.font(13, 600);
      const tw = Math.min(this.W - 24, this.m.width(msg, f) + 24);
      const tx = (this.W - tw) / 2; const ty = L.hdrH + 8;
      ctx.fillStyle = verdict.ok ? 'rgba(21,128,61,0.95)' : 'rgba(185,28,28,0.95)';
      roundRect(ctx, tx, ty, tw, 30, 15); ctx.fill();
      ctx.font = f; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.fillText(msg, this.W / 2, ty + 20, tw - 16);
    }
    // 跟手的行动块
    const gw = 76; const gh = 40;
    const gx = t.px - gw / 2; const gy = t.py - gh - 18;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
    ctx.fillStyle = d.color || T.c.accent; roundRect(ctx, gx, gy, gw, gh, 12); ctx.fill();
    ctx.restore();
    ctx.font = T.font(14, 700); ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(d.label || '', t.px, gy + 25);
  }

  bindTouch() {
    const pt = (e) => {
      const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]) || e;
      return { x: t.clientX !== undefined ? t.clientX : t.pageX, y: t.clientY !== undefined ? t.clientY : t.pageY };
    };
    const pts = (list) => Array.prototype.map.call(list || [], (t) => ({ x: t.clientX !== undefined ? t.clientX : t.pageX, y: t.clientY !== undefined ? t.clientY : t.pageY, id: t.identifier }));
    this.p.onTouchStart((e) => {
      const p = pt(e);
      const L = this.layoutCache;
      const sf = this.page && this.page.surface; const R = this.surfaceRect;
      if (this.surfaceTouch || (sf && R && p.y >= R.y && p.y <= R.y + R.h && !(L && L.footer && p.y >= this.H - L.footH))) {
        this.surfaceTouch = true; this.touch = null;
        try { sf.down(pts(e.touches && e.touches.length ? e.touches : e.changedTouches)); } catch (err) { console.error(err); }
        this.invalidate();
        return;
      }
      const f = this.findHit(p.x, p.y);
      this.anim = false;
      this.touch = { sx: p.x, sy: p.y, ly: p.y, lt: Date.now(), st: Date.now(), s0: this.scrollY, moved: false, hit: f && f.hit, layer: f && f.layer, vel: 0 };
      this.invalidate();
    });
    this.p.onTouchMove((e) => {
      if (this.surfaceTouch) {
        const sf = this.page && this.page.surface;
        try { if (sf) sf.move(pts(e.touches && e.touches.length ? e.touches : e.changedTouches)); } catch (err) { console.error(err); }
        this.invalidate();
        return;
      }
      const t = this.touch; if (!t) return;
      const p = pt(e);
      const dy = p.y - t.sy;
      if (!t.moved && (Math.abs(dy) > 8 || Math.abs(p.x - t.sx) > 8)) {
        t.moved = true;
        if (t.hit && t.hit.drag) t.dragging = t.hit.drag;
      }
      if (t.dragging) {
        t.px = p.x; t.py = p.y;
        t.over = this.findDrop(p.x, p.y);
        this.invalidate();
        return;
      }
      if (t.moved && t.layer !== 'footer' && t.layer !== 'header') {
        const now = Date.now();
        const dt = Math.max(1, now - t.lt);
        t.vel = 0.8 * ((t.ly - p.y) / dt) + 0.2 * t.vel;
        t.ly = p.y; t.lt = now;
        this.scrollY = Math.max(0, Math.min(this.maxScroll, t.s0 - dy));
      }
      this.invalidate();
    });
    const end = (e, cancel) => {
      if (this.surfaceTouch) {
        const sf = this.page && this.page.surface;
        const left = pts(e.touches);
        try { if (sf) sf.up(left, pts(e.changedTouches), cancel); } catch (err) { console.error(err); }
        if (!left.length) this.surfaceTouch = false;
        this.invalidate();
        return;
      }
      const t = this.touch; this.touch = null;
      if (!t) return;
      if (t.dragging) {
        const p = pt(e);
        const target = cancel ? null : this.findDrop(p.x, p.y);
        if (target && target.drop) {
          try { target.drop(t.dragging); } catch (err) { console.error(err); this.showToast('出错了：' + (err && err.message)); }
        }
        this.invalidate();
        return;
      }
      if (!cancel && !t.moved && t.hit && t.hit.onTap) {
        const p = pt(e);
        const f = this.findHit(p.x, p.y);
        // 按下后界面会重排，命中对象会重新生成：按 id 或位置判断是不是同一个按钮
        const same = (a, b) => (a.id && b.id ? a.id === b.id : Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.w - b.w) < 1 && Math.abs(a.h - b.h) < 1);
        if (f && f.layer === t.layer && same(f.hit, t.hit) && f.hit.onTap) {
          try { f.hit.onTap(); } catch (err) { console.error(err); this.showToast('出错了：' + (err && err.message)); }
        }
      } else if (t.moved && Date.now() - t.lt < 80 && Math.abs(t.vel) > 0.1) {
        this.vel = t.vel; this.anim = true; this.lastT = Date.now();
      }
      this.invalidate();
    };
    this.p.onTouchEnd((e) => end(e, false));
    this.p.onTouchCancel((e) => end(e, true));
  }
}

module.exports = { Renderer, Flow, Measurer, roundRect };
