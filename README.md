# 这局人生 · 微信小游戏版

> **2026-11-15 起改为全球商业决策版（V2）**：经营一家公司从 1995 到 2024，在 9 个真实国家的市场棋盘上布局，途中遇到改编自经典商业案例的抉择。设计见 `docs/design-v2-global-business.md`；引擎在 `js/biz/`；V1 人生模拟代码移到 `legacy/`（不打包）。下文的 V1 说明仅供参考。
>
> **3.0（2026-11-16）**：全球商业版打到 2074 年（2025 年后按种子推演 27 种未来）；资不抵债会破产；7 个行业 × 10 种出身 × 7 种特长；91 个案例（多数 4 种解法，可咨询 / 合作 / 推迟）；产品、资本、组织、供应链细节经营。详见 `docs/design-v2-global-business.md` 末尾。
>
> **多样性更新（2026-11-15）**：全球商业版现在有 5 个行业（电子、饮料、软件、汽车、服装）× 9 个总部国家 × 3 个开局年份（1995 / 2005 / 2015）× 5 种创始背景，30 个历史案例 + 14 张随机经营事件卡，20 种结局称号；首页可一键随机组合。
>
> **当市长模式（2026-11-15）**：首页切到“当市长”，俯视视角城市建造：6 个历史剧本（深圳、浦东、新加坡、迪拜、底特律、重庆）+ 自由建造（6 种地图、3 档资金、7 张可叠加挑战卡）。设计见 `docs/design-city-mode.md`；代码在 `js/city/`。

18 岁到 65 岁，一年一张卡的人生经济策略游戏。本仓库是 V1.0 方向 B 的**微信小游戏**移植版：引擎与本地 H5 MVP 完全一致，界面用 Canvas 重写，适配竖屏、刘海和微信胶囊按钮。

- 主包约 368 KB（上限 4 MB），纯离线运行，无需服务器
- 引擎：经济规则 economy 1.0.1，内容包 0.1.0（16 个决策、31 个事件、12 个结局）
- 变现：首版免费 + 平台广告（激励视频解锁“完整复盘”，插屏可选），广告位 ID 留空时不加载

## 用微信开发者工具打开

1. 安装[微信开发者工具](https://developers.weixin.qq.com/minigame/dev/devtools/download.html)。
2. 「导入项目」→ 目录选本仓库根目录。
3. AppID：没有正式账号时用「测试号」即可运行；有了小游戏 AppID 后，把 `project.config.json` 里的 `touristappid` 换成真实 AppID。
4. 编译后在模拟器里玩，或「预览」扫码在真机上玩。

## 在浏览器里预览（开发用）

```bash
node tools/bundle.cjs          # 打包到 preview/game.bundle.js
# 用浏览器打开 preview/index.html（窗口调成手机比例，如 390×844）
```

`preview/wx-shim.js` 只模拟本游戏用到的 wx API，真机行为以开发者工具为准。

生成可分享的单文件网页试玩版（手机 / 电脑浏览器都能玩，无微信分享和广告）：

```bash
node tools/build-demo.cjs      # → dist/demo.html
```

## 目录

| 路径 | 内容 |
|---|---|
| `game.js` / `game.json` / `project.config.json` | 小游戏入口与配置 |
| `js/config.js` | **上线前要填**：广告位 ID、分享文案、存档键 |
| `js/platform.js` | 所有 `wx.*` 调用集中在这里（存档、弹窗、分享、广告、触摸） |
| `js/engine/engine.js` | 游戏引擎 + 经济配置 + 内容包（见下方“引擎来源”） |
| `js/game/` | 对局会话（创建 / 存档 / 读档）、金额格式与中文标签 |
| `js/ui/` | Canvas 界面内核（排版、换行、滚动、点击）、配色、分享卡图片 |
| `js/screens/` | 页面：首页 / 开局 / 年度卡 / 决策卡 / 结果卡 / 结局页 |
| `tools/` | 打包、引擎自检、蒙特卡洛、浏览器自动走查 |
| `docs/recovered/` | 从引擎里导出的配置与内容 JSON（只读参考） |
| `docs/HANDOFF-minigame.md` | 交接说明、验证结果、已知问题、上架清单 |

`docs/`、`tools/`、`preview/` 已在 `project.config.json` 里设为不上传。

## 引擎来源（重要）

原始 TypeScript 源码（`/workspace/P2-001/v1/mvp/engine/`）当时拿不到，`js/engine/engine.js` 是从本地版构建产物 `index.html`（2026-11-14）里还原的。为了能在小游戏里跑，只改了运行时兼容的写法：

- 去掉 `BigInt`、`TextEncoder`、`structuredClone`，不再用 zod 做配置校验
- 补 `Array.prototype.at` / `flatMap` / `Object.fromEntries`（见 `js/polyfill.js`）

改造前后，400 局完整终局状态逐字节一致。拿到原始源码后，应该用源码重新构建这个文件，接口保持 `module.exports` 不变即可。

## 自检

```bash
node tools/verify-engine.cjs                      # 随机流对照 CPython 3.13、现金恒等式、异常数
node tools/montecarlo.cjs js/engine/engine.js 1000   # 1000 局：破产率、决策数、结局分布
node tools/bundle.cjs && node tools/play.cjs /tmp/play LIFE-48291   # 浏览器里用模拟触摸打完一整局并截图（需要 playwright）
```
