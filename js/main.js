// 应用控制器：页面状态机 + 存档 + 分享 + 广告
const platform = require('./platform.js');
const config = require('./config.js');
const { Renderer } = require('./ui/core.js');
const S = require('./game/session.js');
const sharecard = require('./ui/sharecard.js');
const { home, opening } = require('./screens/home.js');
const { year } = require('./screens/year.js');
const { decision, result } = require('./screens/decision.js');
const { ending } = require('./screens/ending.js');

const app = {
  r: null,
  life: null,
  screen: 'home',        // home | opening | play
  resultIdx: null,
  ui: {},
  seedInput: '',
  invite: '',
  saved: null,
  reviewUnlocked: false,
  adsOn: false,
  gamesDone: 0,

  page() {
    if (this.screen === 'home' || !this.life) return home(this);
    if (this.screen === 'opening') return opening(this);
    const s = this.life.s;
    if (this.resultIdx !== null && s.decisions[this.resultIdx]) return result(this);
    if (s.ended) return ending(this);
    if (s.pending.length) return decision(this);
    return year(this);
  },
  render(opts) { this.r.setPage(this.page(), opts); },
  refresh() { this.render({ keepScroll: true, noFade: true }); },
  persist() { if (this.life) S.save(platform.storage, this.life); },

  // ---- 首页 ----
  editSeed() {
    platform.prompt('输入种子码', '例如 LIFE-48291，留空随机', this.seedInput).then((v) => {
      if (v === null) return;
      this.seedInput = S.normalizeSeed(v);
      this.refresh();
    });
  },
  start(seed) {
    this.life = S.create(seed);
    this.ui = {}; this.resultIdx = null; this.reviewUnlocked = false; this.invite = '';
    this.persist();
    this.screen = 'opening';
    this.render();
  },
  resume(life) {
    this.life = life; this.ui = {}; this.resultIdx = null; this.reviewUnlocked = false;
    this.screen = 'play';
    this.render();
  },
  clearSave() {
    platform.confirm('清除存档？', '当前未完成的这一局会被删掉。').then((ok) => {
      if (!ok) return;
      S.clear(platform.storage); this.saved = null; this.refresh();
    });
  },
  goHome() {
    this.persist();
    this.saved = S.load(platform.storage);
    this.life = null; this.screen = 'home';
    this.render();
  },
  go(screen) { this.screen = screen; this.render(); },

  // ---- 对局 ----
  act(name, payload) {
    const res = this.life.act(name, payload || {});
    if (res && res.ok === false) this.r.showToast(res.reason || '做不了');
    this.persist();
    this.refresh();
  },
  confirmAct(title, content, name, payload) {
    platform.confirm(title, content).then((ok) => { if (ok) this.act(name, payload); });
  },
  advance() {
    if (!this.life.advance()) { this.render(); return; }
    this.persist();
    platform.vibrate();
    this.render();
  },
  buyIntel(id) {
    if (!this.life.buyIntel(id)) this.r.showToast('买不了这份情报');
    this.persist();
    this.refresh();
  },
  choose(id) {
    const idx = this.life.s.decisions.length;
    if (this.life.choose(id)) {
      this.resultIdx = idx;
      this.persist();
      platform.vibrate();
      this.render();
    } else {
      this.r.showToast('这个选项现在选不了');
    }
  },
  closeResult() { this.resultIdx = null; this.render(); },

  // ---- 结局 ----
  unlockReview() {
    platform.showRewarded().then((ok) => {
      if (ok) { this.reviewUnlocked = true; this.refresh(); } else this.r.showToast('看完视频才能解锁');
    });
  },
  share() { platform.shareNow(); },
  restart(sameSeed) {
    const seed = sameSeed ? this.life.s.seed : '';
    this.gamesDone += 1;
    if (config.ads.interstitialEvery && this.gamesDone % config.ads.interstitialEvery === 0) platform.showInterstitial();
    this.start(seed);
  },

  shareInfo() {
    const life = this.life;
    if (life && life.s.ended) {
      const title = S.primaryTitle(life.s);
      return {
        title: config.share.title.replace('{title}', title).replace('{seed}', life.s.seed),
        query: `seed=${encodeURIComponent(life.s.seed)}`,
        imageUrl: sharecard.make(life) || undefined
      };
    }
    const seed = life ? life.s.seed : '';
    return { title: config.share.titleNoEnding, query: seed ? `seed=${encodeURIComponent(seed)}` : '' };
  },

  // 从分享卡进入：带种子，先停在首页让玩家确认（避免覆盖进行中的存档）
  handleQuery(q) {
    const seed = q && q.seed ? S.normalizeSeed(decodeURIComponent(q.seed)) : '';
    if (!seed) return;
    this.seedInput = seed; this.invite = seed;
    if (this.screen === 'home') this.render();
  }
};

function boot() {
  app.r = new Renderer(platform);
  platform.initAds();
  app.adsOn = platform.hasRewarded();
  platform.setupShare(() => app.shareInfo());
  app.saved = S.load(platform.storage);
  const q = platform.launchQuery();
  app.render();
  app.handleQuery(q);
  platform.onShow((query) => app.handleQuery(query));
  platform.onHide(() => app.persist());
}

boot();
module.exports = app;
