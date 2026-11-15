// 浏览器里模拟微信小游戏运行时（只覆盖本游戏用到的 API），用于预览和自动化走查。
(function () {
  const params = new URLSearchParams(location.search);
  const DEMO = !!window.__DEMO;   // 网页 demo：无胶囊、居中成手机宽度
  const dims = () => {
    const iw = window.innerWidth || document.documentElement.clientWidth || 390;
    const ih = window.innerHeight || document.documentElement.clientHeight || 760;
    return DEMO ? [Math.max(300, Math.min(iw, 430)), Math.max(480, Math.min(ih, 940))] : [iw, ih];
  };
  let [W, H] = dims();
  const DPR = Math.min(3, window.devicePixelRatio || 2);
  const STATUS = DEMO ? 6 : Number(params.get('status') || 47);
  const SAFE_BOTTOM = DEMO ? 6 : Number(params.get('safebottom') || 34);
  const store = (() => { try { const k = '__t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; } catch (e) { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } }; } })();
  let first = true;
  const listeners = { ts: [], tm: [], te: [], tc: [], show: [], hide: [] };
  const hooks = window.__wxHooks = { prompt: null, confirm: null, shared: [] };

  function makeCanvas() {
    const c = document.createElement('canvas');
    if (first) {
      first = false;
      c.id = 'screen';
      c.style.width = W + 'px'; c.style.height = H + 'px';
      if (DEMO) { c.style.position = 'absolute'; c.style.left = '50%'; c.style.top = '50%'; c.style.transform = 'translate(-50%,-50%)'; c.style.touchAction = 'none'; if (window.innerWidth > 480) { c.style.borderRadius = '18px'; c.style.boxShadow = '0 20px 60px rgba(0,0,0,.45)'; } }
      document.body.appendChild(c);
      screenEl = c;
      bindPointer(c);
    }
    c.toTempFilePathSync = function () { return c.toDataURL('image/png'); };
    return c;
  }

  let screenEl = null;
  function touchEvt(e) {
    const r = screenEl ? screenEl.getBoundingClientRect() : { left: 0, top: 0 };
    const t = { clientX: e.clientX - r.left, clientY: e.clientY - r.top, identifier: 0 };
    return { touches: [t], changedTouches: [t], timeStamp: Date.now() };
  }
  function bindPointer(c) {
    let down = false;
    c.addEventListener('mousedown', (e) => { down = true; listeners.ts.forEach((f) => f(touchEvt(e))); });
    window.addEventListener('mousemove', (e) => { if (down) listeners.tm.forEach((f) => f(touchEvt(e))); });
    window.addEventListener('mouseup', (e) => { if (!down) return; down = false; const ev = touchEvt(e); ev.touches = []; listeners.te.forEach((f) => f(ev)); });
    const tt = (e) => { const t = e.changedTouches[0]; return touchEvt({ clientX: t.clientX, clientY: t.clientY }); };
    c.addEventListener('touchstart', (e) => { e.preventDefault(); listeners.ts.forEach((f) => f(multi(e))); }, { passive: false });
    c.addEventListener('touchmove', (e) => { e.preventDefault(); listeners.tm.forEach((f) => f(multi(e))); }, { passive: false });
    const multi = (e) => { const r = screenEl.getBoundingClientRect(); const m = (l) => Array.prototype.map.call(l, (t) => ({ clientX: t.clientX - r.left, clientY: t.clientY - r.top, identifier: t.identifier })); return { touches: m(e.touches), changedTouches: m(e.changedTouches), timeStamp: Date.now() }; };
    c.addEventListener('touchend', (e) => { e.preventDefault(); listeners.te.forEach((f) => f(multi(e))); }, { passive: false });
    c.addEventListener('touchcancel', (e) => { listeners.tc.forEach((f) => f(tt(e))); });
    c.addEventListener('wheel', (e) => {
      // 滚轮直接滚动页面
      const r = window.__app && window.__app.r;
      const sf = r && r.page && r.page.surface;
      const rect = screenEl.getBoundingClientRect();
      if (sf && sf.wheel) { sf.wheel(e.deltaY, e.clientX - rect.left, e.clientY - rect.top); r.invalidate(); } else if (r) { r.scrollTo(r.scrollY + e.deltaY); }
      e.preventDefault();
    }, { passive: false });
  }

  // 网页窗口大小变化（预览面板晚撑开、转屏）时同步画布
  window.addEventListener('resize', () => {
    const [w, h] = dims();
    if (w === W && h === H) return;
    W = w; H = h;
    if (screenEl) { screenEl.style.width = W + 'px'; screenEl.style.height = H + 'px'; }
    if (window.__app && window.__app.r) window.__app.r.resize(W, H);
  });

  window.wx = {
    createCanvas: makeCanvas,
    getWindowInfo: () => ({ windowWidth: W, windowHeight: H, screenWidth: W, screenHeight: H, pixelRatio: DPR, statusBarHeight: STATUS, safeArea: { top: STATUS, bottom: H - SAFE_BOTTOM, left: 0, right: W, width: W, height: H - STATUS - SAFE_BOTTOM } }),
    getSystemInfoSync: () => window.wx.getWindowInfo(),
    getMenuButtonBoundingClientRect: () => (DEMO ? null : { top: STATUS + 4, bottom: STATUS + 36, left: W - 95, right: W - 8, width: 87, height: 32 }),
    getStorageSync: (k) => store.getItem(k) || '',
    setStorageSync: (k, v) => store.setItem(k, v),
    removeStorageSync: (k) => store.removeItem(k),
    showModal: (o) => {
      setTimeout(() => {
        if (o.editable) {
          if (hooks.prompt) { const v = hooks.prompt(o); o.success && o.success(v === null ? { confirm: false, cancel: true } : { confirm: true, content: v }); return; }
          domModal(o.title, '', o.content || '', o.placeholderText || '', (ok, v) => o.success && o.success(ok ? { confirm: true, content: v } : { confirm: false, cancel: true }));
        } else {
          if (hooks.confirm) { const ok = hooks.confirm(o); o.success && o.success({ confirm: ok, cancel: !ok }); return; }
          domModal(o.title, o.content || '', null, '', (ok) => o.success && o.success({ confirm: ok, cancel: !ok }));
        }
      }, 0);
    },
    vibrateShort: () => {},
    showShareMenu: () => {},
    onShareAppMessage: (fn) => { hooks.shareProvider = fn; },
    onShareTimeline: () => {},
    shareAppMessage: (o) => {
      hooks.shared.push(o);
      if (hooks.confirm) return;
      const seed = decodeURIComponent(((o.query || '').match(/seed=([^&]+)/) || [])[1] || '');
      const text = seed ? `${o.title}\n种子码：${seed}` : o.title;
      try { navigator.clipboard && navigator.clipboard.writeText(text).catch(() => {}); } catch (e) {}
      domModal('分享给好友', '网页版 demo 没有微信分享，已尝试复制到剪贴板。把下面的种子码发给朋友，让 TA 在首页输入：\n\n' + text, null, '', () => {}, true);
    },
    getLaunchOptionsSync: () => ({ query: Object.fromEntries(params.entries()) }),
    onShow: (f) => listeners.show.push(f),
    onHide: (f) => listeners.hide.push(f),
    onTouchStart: (f) => listeners.ts.push(f),
    onTouchMove: (f) => listeners.tm.push(f),
    onTouchEnd: (f) => listeners.te.push(f),
    onTouchCancel: (f) => listeners.tc.push(f)
  };

  // 页面内弹窗（沙箱里 prompt/confirm 被禁用）
  function domModal(title, body, input, placeholder, done, okOnly) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,.6);display:flex;align-items:center;justify-content:center;z-index:9;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
    const box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:16px;padding:20px;width:min(320px,86vw);box-sizing:border-box;color:#0f172a';
    const h = document.createElement('div'); h.textContent = title; h.style.cssText = 'font-weight:700;font-size:17px;margin-bottom:8px;text-align:center';
    box.appendChild(h);
    if (body) { const p = document.createElement('div'); p.textContent = body; p.style.cssText = 'font-size:14px;line-height:1.6;color:#334155;white-space:pre-wrap;margin-bottom:12px;user-select:text'; box.appendChild(p); }
    let inp = null;
    if (input !== null) { inp = document.createElement('input'); inp.value = input; inp.placeholder = placeholder; inp.style.cssText = 'width:100%;box-sizing:border-box;font-size:16px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;margin:4px 0 14px'; box.appendChild(inp); }
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:10px';
    const mk = (t, primary, ok) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = `flex:1;font-size:15px;padding:11px;border-radius:10px;border:${primary ? 'none' : '1px solid #cbd5e1'};background:${primary ? '#2563eb' : '#fff'};color:${primary ? '#fff' : '#334155'};font-weight:600`; b.onclick = () => { document.body.removeChild(wrap); done(ok, inp ? inp.value : ''); }; return b; };
    if (!okOnly) row.appendChild(mk('取消', false, false));
    row.appendChild(mk(okOnly ? '知道了' : '确定', true, true));
    box.appendChild(row); wrap.appendChild(box); document.body.appendChild(wrap);
    if (inp) { inp.focus(); inp.onkeydown = (e) => { if (e.key === 'Enter') row.lastChild.click(); }; }
  }

  // 自动化辅助：按 id 找到可点区域，必要时先滚动，返回屏幕坐标
  window.__locate = function (id) {
    const r = window.__app.r;
    r.layout();
    const L = r.layoutCache;
    const find = (hits) => hits.find((h) => h.id === id);
    let h = L.footer && find(L.footer.hits);
    if (h) return { x: h.x + h.w / 2, y: r.H - L.footH + h.y + h.h / 2 };
    h = L.header && find(L.header.hits);
    if (h) return { x: h.x + h.w / 2, y: h.y + h.h / 2 };
    h = find(L.body.hits);
    if (!h) return null;
    const viewTop = L.hdrH; const viewBot = r.H - L.footH;
    let sy = h.y + h.h / 2 - r.scrollY;
    if (sy < viewTop + 10 || sy > viewBot - 10) {
      r.scrollTo(h.y + h.h / 2 - (viewTop + viewBot) / 2);
      r.layout(); r.draw();
      sy = h.y + h.h / 2 - r.scrollY;
    }
    return { x: h.x + Math.min(h.w / 2, 60), y: sy };
  };
  window.__ids = function () {
    const r = window.__app.r; r.layout();
    const L = r.layoutCache;
    return [].concat(L.body.hits, L.footer ? L.footer.hits : [], L.header ? L.header.hits : []).map((h) => h.id).filter(Boolean);
  };
})();
