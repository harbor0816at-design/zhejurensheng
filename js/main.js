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
const { cityPage, budgetPage, eventPage, endPage, OVERLAYS } = require('./screens/city.js');
const { CitySim, VERSION: CITY_VERSION } = require('./city/sim.js');
const CR = require('./city/render.js');

const SPEED_MS = [0, 1000, 450, 160];
function freshCityUI() { return { tool: 'pan', cam: { x: 0, y: 0, z: 1 }, camInit: false, overlay: null, sel: null, preview: null, g: null }; }

const app = {
  r: null,
  life: null,
  screen: 'home',          // home | play | city
  mode: 'biz',             // 首页当前选项卡：biz | city
  city: null, cityUI: freshCityUI(), cityView: 'map', citySpeed: 1, cityTimer: null, savedCity: null, citySeed: '', citySetup: { map: 'river', money: 'normal', challenges: [] },
  view: 'board',           // board | country | strategy | report | reveal
  countryId: null,
  setup: { industry: 'electronics', hq: 'US', name: S.D.INDUSTRIES[0].names[0], seed: '', startYear: 1995, founder: 'startup' },
  saved: null,
  invite: null,
  gamesDone: 0,

  page() {
    if (this.screen === 'city' && this.city) {
      const cs = this.city.s;
      if (cs.pendingEvent) return eventPage(this);
      if (cs.ended && !cs.freePlay) return endPage(this);
      if (this.cityView === 'budget') return budgetPage(this);
      return cityPage(this);
    }
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
  pickStart(y) { this.setup.startYear = y; this.refresh(); },
  pickFounder(id) { this.setup.founder = id; this.refresh(); },
  randomSetup() {
    const r = (a) => a[Math.floor(Math.random() * a.length)];
    const ind = r(S.D.INDUSTRIES);
    this.setup = { industry: ind.id, hq: r(S.D.COUNTRIES).id, name: r(ind.names), seed: '', startYear: r(S.D.START_YEARS).year, founder: r(S.D.FOUNDERS).id };
    this.refresh(); this.toast('已随机组合，满意就开始吧');
  },
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
    this.save(); this.saveCity(); this.stopCityTimer();
    this.saved = S.load(platform.storage);
    this.savedCity = this.loadCity();
    if (this.screen === 'city') this.mode = 'city';
    this.life = null; this.city = null; this.screen = 'home';
    this.render();
  },
  pickMode(m) { this.mode = m; this.render(); },

  // ---- 当市长 ----
  loadCity() {
    const raw = platform.storage.get(config.citySaveKey);
    if (!raw) return null;
    try { const c = CitySim.fromJSON(raw); if (c.s.v !== CITY_VERSION) return null; c.recompute(); return c; } catch (e) { return null; }
  },
  saveCity() { if (this.city) platform.storage.set(config.citySaveKey, this.city.toJSON()); },
  editCitySeed() {
    platform.prompt('地图种子', '留空随机', this.citySeed).then((v) => { if (v === null) return; this.citySeed = S.normalizeSeed(v); this.refresh(); });
  },
  startCityScenario(id) { this.stopCityTimer(); this.city = CitySim.create({ mode: 'scenario', scenario: id }); this.enterCity(); },
  startCitySandbox() { this.stopCityTimer(); const c = this.citySetup; this.city = CitySim.create({ mode: 'sandbox', map: c.map, money: c.money, challenges: c.challenges.slice(), seed: this.citySeed || '' }); this.enterCity(); },
  toggleChallenge(id) { const a = this.citySetup.challenges; const i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); this.refresh(); },
  resumeCity(c) { this.city = c; this.enterCity(); },
  enterCity() {
    this.cityUI = freshCityUI(); this.cityView = 'map'; this.screen = 'city';
    this.citySpeed = 1; this.saveCity(); this.startCityTimer(); this.render();
    const sc = this.city.scenario;
    this.toast(sc ? `${sc.start} 年，${sc.place}。` : '先修一条路，在旁边划住宅和工业区，再建电厂和水厂。');
  },
  startCityTimer() {
    this.stopCityTimer();
    const ms = SPEED_MS[this.citySpeed];
    if (!ms) return;
    this.cityTimer = setInterval(() => this.cityTick(), ms);
  },
  stopCityTimer() { if (this.cityTimer) { clearInterval(this.cityTimer); this.cityTimer = null; } },
  cityTick() {
    const c = this.city;
    if (this.screen !== 'city' || !c || c.s.pendingEvent || (c.s.ended && !c.s.freePlay) || this.cityView !== 'map') return;
    if (this.cityUI.g && this.cityUI.g.mode === 'paint') return; // 正在画的时候先不推进
    const news = c.step();
    const important = news.find((n) => n.type === 'milestone') || news.find((n) => n.type === 'goal') || news.find((n) => n.type === 'unlock') || news.find((n) => n.type === 'fire') || news.find((n) => n.type === 'money');
    if (important) this.toast(important.text);
    if (c.s.month % 6 === 0) this.saveCity();
    if (c.s.pendingEvent || (c.s.ended && !c.s.freePlay)) { this.saveCity(); this.render(); return; }
    this.refresh();
  },
  cityButton(id) {
    const ui = this.cityUI;
    if (id.indexOf('speed') === 0) { this.citySpeed = +id.slice(5); this.startCityTimer(); this.toast(['已暂停', '正常速度', '', '快进'][this.citySpeed]); }
    if (id === 'view') { const i = OVERLAYS.indexOf(ui.overlay); ui.overlay = OVERLAYS[(i + 1) % OVERLAYS.length]; }
    if (id === 'budget') { this.cityView = 'budget'; this.render(); return; }
    if ((id === 'zin' || id === 'zout') && ui.rect) {
      const z0 = ui.cam.z; const z = Math.max(0.5, Math.min(2.6, z0 * (id === 'zin' ? 1.25 : 0.8))); const r = z / z0;
      const mx = ui.rect.w / 2; const my = ui.rect.h / 2;
      ui.cam.x = mx - (mx - ui.cam.x) * r; ui.cam.y = my - (my - ui.cam.y) * r; ui.cam.z = z;
    }
    this.refresh();
  },
  cityTool(id) {
    const lock = this.city.unlockedTool(id);
    if (!lock.ok) { this.toast(lock.reason); return; }
    this.cityUI.tool = id; this.cityUI.sel = null; this.cityUI.preview = null;
    this.refresh();
  },
  cityBuild(tool, cells) {
    const res = this.city.build(tool, cells);
    if (!res.ok) { this.toast(res.reason || '这里建不了'); this.refresh(); return; }
    platform.vibrate();
    this.toast(tool === 'bulldoze' ? `拆除 ${res.cells.length} 格` : `建好了，花费 ¥${String(res.cost).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`);
    this.saveCity(); this.refresh();
  },
  cityTax(k, d) { const c = this.city; c.setTax(k, c.s.tax[k] + d); c.stats(); this.saveCity(); this.refresh(); },
  cityLoan(kind) { const r = kind === 'borrow' ? this.city.borrow() : this.city.repay(); if (!r.ok) this.toast(r.reason); this.city.stats(); this.saveCity(); this.refresh(); },
  setCityView(v) { this.cityView = v; this.render(); },
  cityCloseEvent() { this.city.s.pendingEvent = null; this.saveCity(); this.render(); },
  cityFreePlay() { const s = this.city.s; s.freePlay = true; s.ended = false; this.saveCity(); this.startCityTimer(); this.render(); },
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
    this.setup = { industry: s.industry, hq: s.hq, name: s.name, seed: same ? s.seed : '', startYear: s.startYear || 1995, founder: s.founder || 'startup' };
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
        query: `seed=${encodeURIComponent(s.seed)}&ind=${s.industry}&hq=${s.hq}&y=${s.startYear || 1995}&f=${s.founder || 'startup'}`,
        imageUrl: sharecard.make(life) || undefined
      };
    }
    const s = life ? life.s : null;
    return { title: config.share.titleNoEnding, query: s ? `seed=${encodeURIComponent(s.seed)}&ind=${s.industry}&hq=${s.hq}&y=${s.startYear || 1995}&f=${s.founder || 'startup'}` : '' };
  },
  handleQuery(q) {
    if (!q || !q.seed) return;
    const seed = S.normalizeSeed(decodeURIComponent(q.seed));
    const ind = S.D.INDUSTRIES.find((i) => i.id === q.ind);
    const hq = S.D.COUNTRIES.some((c) => c.id === q.hq) ? q.hq : this.setup.hq;
    this.setup.seed = seed; this.setup.hq = hq;
    const y = Number(q.y); if (S.D.START_YEARS.some((x) => x.year === y)) this.setup.startYear = y;
    if (S.D.FOUNDERS.some((x) => x.id === q.f)) this.setup.founder = q.f;
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
  app.savedCity = app.loadCity();
  app.render();
  app.handleQuery(platform.launchQuery());
  platform.onShow((q) => app.handleQuery(q));
  platform.onHide(() => { app.save(); app.saveCity(); });
}

boot();
module.exports = app;
