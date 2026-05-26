# 哆啦口袋（wx-toolkit）

基于 **uni-app + Vue 2 + JavaScript** 的微信小程序工具集，主页 UI 参考「每日工具箱」类布局：浅灰底、分类白卡片、四列宫格、渐变图标。可在 **HBuilderX** 中直接打开并运行到微信开发者工具。

## 目录说明

| 路径 | 说明 |
|------|------|
| `pages/index/` | 工具箱首页（推荐区 + 分类宫格） |
| `pages/mine/` | 我的（占位） |
| `static/tab/` | 底部 Tab 图标 |
| `pages/tool-detail/` | 单个工具页模板 |
| `common/tools.js` | 工具注册表，新增工具在此配置 |
| `manifest.json` | 应用配置，含 `mp-weixin.appid` |

## 在 HBuilderX 中运行

1. 打开 HBuilderX → **文件 → 导入 → 从本地目录导入**，选择本项目根目录 `wx-toolkit`。
2. 在 `manifest.json` → **微信小程序配置** 中填写你的 **AppID**（仅本地调试可先留空，运行时在开发者工具选测试号）。
3. 安装并打开 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)，在 **设置 → 安全设置** 中开启服务端口。
4. HBuilderX → **工具 → 设置 → 运行配置**，配置微信开发者工具安装路径。
5. 菜单 **运行 → 运行到小程序模拟器 → 微信开发者工具**。

首次编译产物在 `unpackage/dist/dev/mp-weixin/`，由 HBuilder 自动生成，无需手改。

若页面空白：请先在 HBuilderX **重新运行** 一次（修改 `index.html` 后必须重新编译）。确认微信开发者工具打开的是 `unpackage/dist/dev/mp-weixin` 目录，而不是项目根目录。

## 新增一个工具

1. 在 `common/tools.js` 的 `tools` 数组中增加一项（`id`、`name`、`desc`、`path`、`enabled`）。
2. 复制 `pages/tool-detail/` 为新页面，或在现有详情页按 `id` 分支实现逻辑。
3. 在 `pages.json` 中注册新页面路径。
4. 将 `path` 指向新页面，例如：`/pages/my-tool/my-tool?id=xxx`。

## 后续你可提供

- 页面原型 / 交互稿 → 对齐 UI 与路由
- 微信小程序 **AppID** → 写入 `manifest.json` 的 `mp-weixin.appid`
- 各工具的具体功能说明 → 实现对应页面与逻辑

## 技术栈

- uni-app（Vue 2，`manifest.json` 中 `vueVersion` 可改为 `3`，需确认 HBuilder 编译产物 `app.js` 不含 `mount("#app")`）
- JavaScript（非 TypeScript）
- 目标平台：微信小程序（`mp-weixin`）
