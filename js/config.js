// 上线前要填的配置。广告位 ID 在微信公众平台「流量主」里申请；留空则不加载广告。
module.exports = {
  appName: '这局人生',
  version: '1.0.0-mg',
  saveKey: 'zjrs.v1.save',
  ads: {
    // 激励视频：结局页解锁「完整复盘」。留空 = 不接广告，完整复盘直接免费。
    rewardedVideo: '',
    // 插屏：结局页点「再来一局」时最多每 3 局展示一次。留空 = 不展示。
    interstitial: '',
    interstitialEvery: 3
  },
  share: {
    // 分享卡标题；{title} = 主称号，{seed} = 种子码
    title: '我这局人生的称号是「{title}」，同一个种子你能活成什么样？',
    titleNoEnding: '18 岁到 65 岁，一年一张卡：来过一局人生'
  }
};
