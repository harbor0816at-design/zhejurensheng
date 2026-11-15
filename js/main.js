// 应用控制器：页面状态机 + 存档 + 分享 + 广告
const platform = require('./platform.js');
const config = require('./config.js');
const { Renderer } = require('./ui/core.js');
const S = require('./game/session.js');
const F = require('./game/format.js');
const sharecard = require('./ui/sharecard.js');
const { home } = require('./screens/home.js');
const { board } = require('./screens/board.js');
const { countryPage, strategyPage } = require('./screens/country.js');
const { casePage, revealPage } = require('./screens/casepage.js');
const { reportPage, endingPage } = require('./screens/report.js');

const app = {
  r: null,
  life: null,
  screen: 'home',          // home | play
  view: 'board',           // board | country | strategy | report | reveal
  countryId: null,
  setup: { industry: 'electronics', hq: 'US', name: S.D.INDUSTRIES[0].names[0], seed: '' },
  saved: null,
  invite: null,
  gamesDone: 0,

  page() {
    if (this.screen === 'home' || !this.life) return home(this);
    const s = this.life.s;
    if (this.view === 'report' && s.report) return reportPage(this);
    if (this.view === 'reveal' && s.caseResult) return revealPage(this);
    if (s.caseId) return casePage(this);
    if (s.ended) return endingPage(this);
    if (this.view === 'country' && this.countryId) return countryPage(this);
    if (this.view === 'strategy') return strategyPage(this);
    return board(this);
  },
  render(opts) { this.r.setPage(this.page(), opts); },
  refresh() { this.render({ keepScroll: true, noFade: true }); },
  save() { if (this.life) S.save(platform.storage, this.life); },
  toast(msg) { this.r.showToast(msg); },

  // ---- 首页 ----
  pickIndustry(id) {
    const old = S.D.INDUSTRIES.find((i) => i.id === this.setup.industry);
    const ind = S.D.INDUSTRIES.find((i) => i.id === id);
    if (!this.setup.name || old.names.indexOf(this.setup.name) >= 0) this.setup.name = ind.names[0];
    this.setup.industry = id; this.refresh();
  },
  pickHq(id) { this.setup.hq = id; this.refresh(); },
  editName() {
    platform.prompt('公司名', '最多 8 个字', this.setup.name).then((v) => {
      if (v === null) return;
      this.setup.name = String(v).trim().slice(0, 8) || this.setup.name; this.refresh();
    });
  },
  editSeed() {
    platform.prompt('种子码', '例如 BIZ-48291，留空随机', this.setup.seed).then((v) => {
      if (v === null) return;
      this.setup.seed = S.normalizeSeed(v); this.refresh();
    });
  },
  start() {
    this.life = S.create(this.setup);
    this.invite = null;
    this.screen = 'play'; this.view = 'board';
    this.save(); this.render();
  },
  resume(life) { this.life = life; this.screen = 'play'; this.view = 'board'; this.render(); },
  clearSave() {
    platform.confirm('清除存档？', '未完成的这一局会被删掉。').then((ok) => {
      if (!ok) return;
      S.clear(platform.storage); this.saved = null; this.refresh();
    });
  },
  goHome() {
    this.save();
    this.saved = S.load(platform.storage);
    this.life = null; this.screen = 'home';
    this.render();
  },
  go(view) { this.view = view; this.render(); },
  openCountry(cid) { this.countryId = cid; this.view = 'country'; this.render(); },

  // ---- 对局 ----
  dropToken(token, cid, stay) {
    const life = this.life;
    const name = life.countryView(cid).name;
    const res = life.place(token, cid);
    if (!res.ok) { this.toast(res.reason); return; }
    platform.vibrate();
    const label = { export: life.ind.physical ? '开始出口到' : '开通线上销售：', branch: '设立分公司：', factory: life.ind.physical ? '建工厂：' : '建数据中心：', campaign: '营销战役：', exit: '撤出一级：' }[token];
    this.toast(`${label}${name}${token === 'exit' ? `，回收 ${F.usd(-res.cost)}` : `，花了 ${F.usd(res.cost)}`}`);
    this.save();
    if (stay) this.refresh(); else this.refresh();
  },
  finance(kind, amt) {
    const res = kind === 'borrow' ? this.life.borrow(amt) : this.life.repay(amt);
    if (!res.ok) this.toast(res.reason); else this.toast(`${kind === 'borrow' ? '借入' : '还款'} ${F.usd(res.amount)}`);
    this.save(); this.refresh();
  },
  endYear() {
    const life = this.life;
    if (life.s.ap > 0 && !this._apWarned) {
      this._apWarned = true;
      this.toast(`还有 ${life.s.ap} 个行动点没用，再点一次就结束这一年`);
      return;
    }
    this._apWarned = false;
    if (!life.endYear()) return;
    platform.vibrate();
    this.view = 'report';
    this.save(); this.render();
  },
  closeReport() { this.view = 'board'; this.render(); },
  chooseCase(id) {
    const r = this.life.chooseCase(id);
    if (!r) return;
    platform.vibrate();
    this.view = 'reveal';
    this.save(); this.render();
  },
  closeReveal() { this.life.s.caseResult = null; this.view = 'board'; this.save(); this.render(); },

  // ---- 结局 ----
  share() { platform.shareNow(); },
  restart(same) {
    const s = this.life.s;
    this.setup = { industry: s.industry, hq: s.hq, name: s.name, seed: same ? s.seed : '' };
    this.gamesDone += 1;
    if (config.ads.interstitialEvery && this.gamesDone % config.ads.interstitialEvery === 0) platform.showInterstitial();
    this.start();
  },
  shareInfo() {
    const life = this.life;
    if (life && life.s.ended) {
      const s = life.s;
      const title = (s.endings.find((e) => e.role === 'primary') || {}).name || '';
      return {
        title: config.share.title.replace('{company}', s.name).replace('{title}', title).replace('{value}', F.usd(s.valuation)),
        query: `seed=${encodeURIComponent(s.seed)}&ind=${s.industry}&hq=${s.hq}`,
        imageUrl: sharecard.make(life) || undefined
      };
    }
    const s = life ? life.s : null;
    return { title: config.share.titleNoEnding, query: s ? `seed=${encodeURIComponent(s.seed)}&ind=${s.industry}&hq=${s.hq}` : '' };
  },
  handleQuery(q) {
    if (!q || !q.seed) return;
    const seed = S.normalizeSeed(decodeURIComponent(q.seed));
    const ind = S.D.INDUSTRIES.find((i) => i.id === q.ind);
    const hq = ['US', 'CN', 'DE', 'JP', 'IN'].indexOf(q.hq) >= 0 ? q.hq : this.setup.hq;
    this.setup.seed = seed; this.setup.hq = hq;
    if (ind) { this.setup.industry = ind.id; this.setup.name = ind.names[0]; }
    this.invite = { seed };
    if (this.screen === 'home') this.render();
  }
};

function boot() {
  app.r = new Renderer(platform);
  platform.initAds();
  platform.setupShare(() => app.shareInfo());
  app.saved = S.load(platform.storage);
  app.render();
  app.handleQuery(platform.launchQuery());
  platform.onShow((q) => app.handleQuery(q));
  platform.onHide(() => app.save());
}

boot();
module.exports = app;
