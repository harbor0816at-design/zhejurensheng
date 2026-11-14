// 浏览器里模拟微信小游戏运行时（只覆盖本游戏用到的 API），用于预览和自动化走查。
(function () {
  const params = new URLSearchParams(location.search);
  const W = window.innerWidth;
  const H = window.innerHeight;
  const DPR = window.devicePixelRatio || 2;
  const STATUS = Number(params.get('status') || 47);
  const SAFE_BOTTOM = Number(params.get('safebottom') || 34);
  let first = true;
  const listeners = { ts: [], tm: [], te: [], tc: [], show: [], hide: [] };
  const hooks = window.__wxHooks = { prompt: null, confirm: null, shared: [] };

  function makeCanvas() {
    const c = document.createElement('canvas');
    if (first) {
      first = false;
      c.id = 'screen';
      c.style.width = W + 'px'; c.style.height = H + 'px';
      document.body.appendChild(c);
      bindPointer(c);
    }
    c.toTempFilePathSync = function () { return c.toDataURL('image/png'); };
    return c;
  }

  function touchEvt(e) {
    const t = { clientX: e.clientX, clientY: e.clientY, identifier: 0 };
    return { touches: [t], changedTouches: [t], timeStamp: Date.now() };
  }
  function bindPointer(c) {
    let down = false;
    c.addEventListener('mousedown', (e) => { down = true; listeners.ts.forEach((f) => f(touchEvt(e))); });
    window.addEventListener('mousemove', (e) => { if (down) listeners.tm.forEach((f) => f(touchEvt(e))); });
    window.addEventListener('mouseup', (e) => { if (!down) return; down = false; listeners.te.forEach((f) => f(touchEvt(e))); });
    c.addEventListener('wheel', (e) => {
      // 滚轮模拟一次拖动
      const x = 100; const y = H / 2;
      listeners.ts.forEach((f) => f(touchEvt({ clientX: x, clientY: y })));
      listeners.tm.forEach((f) => f(touchEvt({ clientX: x, clientY: y - e.deltaY })));
      listeners.te.forEach((f) => f(touchEvt({ clientX: x, clientY: y - e.deltaY })));
      e.preventDefault();
    }, { passive: false });
  }

  window.wx = {
    createCanvas: makeCanvas,
    getWindowInfo: () => ({ windowWidth: W, windowHeight: H, screenWidth: W, screenHeight: H, pixelRatio: DPR, statusBarHeight: STATUS, safeArea: { top: STATUS, bottom: H - SAFE_BOTTOM, left: 0, right: W, width: W, height: H - STATUS - SAFE_BOTTOM } }),
    getSystemInfoSync: () => window.wx.getWindowInfo(),
    getMenuButtonBoundingClientRect: () => ({ top: STATUS + 4, bottom: STATUS + 36, left: W - 95, right: W - 8, width: 87, height: 32 }),
    getStorageSync: (k) => localStorage.getItem(k) || '',
    setStorageSync: (k, v) => localStorage.setItem(k, v),
    removeStorageSync: (k) => localStorage.removeItem(k),
    showModal: (o) => {
      setTimeout(() => {
        if (o.editable) {
          const v = hooks.prompt ? hooks.prompt(o) : window.prompt(o.title, o.content || '');
          o.success && o.success(v === null ? { confirm: false, cancel: true } : { confirm: true, content: v });
        } else {
          const ok = hooks.confirm ? hooks.confirm(o) : window.confirm(o.title + '\n' + (o.content || ''));
          o.success && o.success({ confirm: ok, cancel: !ok });
        }
      }, 0);
    },
    vibrateShort: () => {},
    showShareMenu: () => {},
    onShareAppMessage: (fn) => { hooks.shareProvider = fn; },
    onShareTimeline: () => {},
    shareAppMessage: (o) => { hooks.shared.push(o); console.log('[share]', o.title, o.query); },
    getLaunchOptionsSync: () => ({ query: Object.fromEntries(params.entries()) }),
    onShow: (f) => listeners.show.push(f),
    onHide: (f) => listeners.hide.push(f),
    onTouchStart: (f) => listeners.ts.push(f),
    onTouchMove: (f) => listeners.tm.push(f),
    onTouchEnd: (f) => listeners.te.push(f),
    onTouchCancel: (f) => listeners.tc.push(f)
  };

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
