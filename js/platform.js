// 平台封装：所有 wx.* 调用集中在这里，换平台（抖音小游戏 / H5）只改这个文件。
const config = require('./config.js');

function safe(fn, fallback) {
  try { return fn(); } catch (e) { return fallback; }
}

function systemInfo() {
  const info = safe(() => (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()), null) ||
    safe(() => wx.getSystemInfoSync(), {}) || {};
  const w = info.windowWidth || info.screenWidth || 375;
  const h = info.windowHeight || info.screenHeight || 667;
  const dpr = Math.min(3, info.pixelRatio || 2);
  const safeArea = info.safeArea || null;
  const statusBar = info.statusBarHeight || (safeArea ? safeArea.top : 20) || 20;
  const safeBottom = safeArea ? Math.max(0, h - safeArea.bottom) : 0;
  const menu = safe(() => wx.getMenuButtonBoundingClientRect(), null);
  return { w, h, dpr, statusBar, safeBottom, menu };
}

const storage = {
  get(key) { return safe(() => wx.getStorageSync(key), '') || null; },
  set(key, val) { return safe(() => { wx.setStorageSync(key, val); return true; }, false); },
  remove(key) { safe(() => wx.removeStorageSync(key)); }
};

// 可编辑弹窗输入（基础库 2.17.1+ 支持 editable）
function prompt(title, placeholder, initial) {
  return new Promise((resolve) => {
    try {
      wx.showModal({
        title,
        editable: true,
        placeholderText: placeholder || '',
        content: initial || '',
        success(res) { resolve(res.confirm ? (res.content || '') : null); },
        fail() { resolve(null); }
      });
    } catch (e) { resolve(null); }
  });
}

function confirm(title, content) {
  return new Promise((resolve) => {
    try {
      wx.showModal({
        title, content, confirmText: '确定', cancelText: '取消',
        success(res) { resolve(!!res.confirm); },
        fail() { resolve(false); }
      });
    } catch (e) { resolve(false); }
  });
}

function vibrate() { safe(() => wx.vibrateShort({ type: 'light' })); }

function launchQuery() {
  return safe(() => (wx.getLaunchOptionsSync().query || {}), {});
}

function onShow(cb) { safe(() => wx.onShow((res) => cb((res && res.query) || {}))); }
function onHide(cb) { safe(() => wx.onHide(cb)); }

// ---------- 分享 ----------
let shareProvider = () => ({ title: config.share.titleNoEnding, query: '' });
function setupShare(provider) {
  shareProvider = provider;
  safe(() => wx.showShareMenu({ withShareTicket: false, menus: ['shareAppMessage', 'shareTimeline'] }));
  safe(() => wx.onShareAppMessage(() => shareProvider()));
  safe(() => wx.onShareTimeline && wx.onShareTimeline(() => {
    const p = shareProvider();
    return { title: p.title, query: p.query, imageUrl: p.imageUrl };
  }));
}
function shareNow() { safe(() => wx.shareAppMessage(shareProvider())); }

// ---------- 广告（留空 ID 时全部跳过） ----------
let rewarded = null;
let interstitial = null;
function initAds() {
  if (config.ads.rewardedVideo && typeof wx !== 'undefined' && wx.createRewardedVideoAd) {
    rewarded = safe(() => wx.createRewardedVideoAd({ adUnitId: config.ads.rewardedVideo }), null);
    if (rewarded) rewarded.onError(() => {});
  }
  if (config.ads.interstitial && typeof wx !== 'undefined' && wx.createInterstitialAd) {
    interstitial = safe(() => wx.createInterstitialAd({ adUnitId: config.ads.interstitial }), null);
    if (interstitial) interstitial.onError(() => {});
  }
}
function hasRewarded() { return !!rewarded; }
// 返回 Promise<boolean>：true = 看完；没有配置广告时直接 true
function showRewarded() {
  if (!rewarded) return Promise.resolve(true);
  return new Promise((resolve) => {
    const onClose = (res) => {
      rewarded.offClose(onClose);
      resolve(!!(res && res.isEnded) || res === undefined);
    };
    rewarded.onClose(onClose);
    rewarded.show().catch(() => rewarded.load().then(() => rewarded.show()).catch(() => {
      rewarded.offClose(onClose);
      resolve(true); // 广告拉不到时不卡用户
    }));
  });
}
function showInterstitial() {
  if (!interstitial) return;
  interstitial.show().catch(() => {});
}

module.exports = {
  systemInfo, storage, prompt, confirm, vibrate, launchQuery, onShow, onHide,
  setupShare, shareNow, initAds, hasRewarded, showRewarded, showInterstitial,
  createCanvas: () => wx.createCanvas(),
  onTouchStart: (cb) => wx.onTouchStart(cb),
  onTouchMove: (cb) => wx.onTouchMove(cb),
  onTouchEnd: (cb) => wx.onTouchEnd(cb),
  onTouchCancel: (cb) => wx.onTouchCancel(cb)
};
