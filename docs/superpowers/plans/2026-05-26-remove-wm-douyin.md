# 去水印（抖音 · 云开发）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用户粘贴抖音分享链接，经云函数解析后预览并保存无水印视频到相册。

**Architecture:** 小程序 `wx.cloud.callFunction('parseDouyin')` → 云函数提取 URL 并解析抖音 → 统一 JSON 回传 → 前端 `downloadFile` + 相册 API。

**Tech Stack:** uni-app Vue2、微信小程序云开发、云函数 Node.js（wx-server-sdk + axios）

**Design spec:** `docs/superpowers/specs/2026-05-26-remove-wm-douyin-design.md`

---

## File map

| 文件 | 操作 | 职责 |
|------|------|------|
| `cloudfunctions/parseDouyin/index.js` | 创建 | 云函数入口 |
| `cloudfunctions/parseDouyin/lib/extract-url.js` | 创建 | 从文案提取抖音 URL |
| `cloudfunctions/parseDouyin/lib/parser.js` | 创建 | 抖音解析逻辑 |
| `cloudfunctions/parseDouyin/package.json` | 创建 | 依赖 wx-server-sdk、axios |
| `common/config.js` | 创建 | `CLOUD_ENV_ID` |
| `common/cloud.js` | 创建 | `callParseDouyin` |
| `App.vue` | 修改 | `wx.cloud.init` |
| `project.config.json` | 修改 | `cloudfunctionRoot` |
| `pages/remove-wm/remove-wm.vue` | 修改 | 完整交互与保存 |
| `common/tools.js` | 修改 | `status: 'ready'` |
| `pages/index/index.vue` | 修改 | 去掉「即将上线」角标 |

---

### Task 1: 云开发工程骨架

**Files:**
- Create: `cloudfunctions/parseDouyin/package.json`
- Create: `cloudfunctions/parseDouyin/index.js`（占位返回 `NOT_IMPLEMENTED`）
- Modify: `project.config.json`

- [ ] **Step 1:** 在 `project.config.json` 添加 `"cloudfunctionRoot": "cloudfunctions/"`
- [ ] **Step 2:** 创建 `parseDouyin/package.json`，依赖 `wx-server-sdk`、`axios`
- [ ] **Step 3:** 创建 `index.js` 导出 `main`，校验 `event.text` 存在
- [ ] **Step 4:** 微信开发者工具中确认云函数目录可见（需用户本地开通云开发）

---

### Task 2: URL 提取与解析模块

**Files:**
- Create: `cloudfunctions/parseDouyin/lib/extract-url.js`
- Create: `cloudfunctions/parseDouyin/lib/parser.js`
- Modify: `cloudfunctions/parseDouyin/index.js`

- [ ] **Step 1:** `extract-url.js` 正则匹配 `v.douyin.com`、`www.douyin.com`、`www.iesdouyin.com` 等
- [ ] **Step 2:** `parser.js` 实现：短链跳转 → 解析 video_id → 返回 `{ type, title, cover, items }`
- [ ] **Step 3:** `index.js` 串联：无 URL → `INVALID_URL`；解析异常 → `PARSE_FAILED`
- [ ] **Step 4:** 在云开发控制台部署并用手动测试参数调用云函数验证返回结构

---

### Task 3: 小程序云初始化与封装

**Files:**
- Create: `common/config.js`
- Create: `common/cloud.js`
- Modify: `App.vue`

- [ ] **Step 1:** `config.js` 导出 `CLOUD_ENV_ID`（注释说明从控制台复制）
- [ ] **Step 2:** `App.vue` `onLaunch` 内 `#ifdef MP-WEIXIN` 调用 `wx.cloud.init({ env: CLOUD_ENV_ID })`
- [ ] **Step 3:** `cloud.js` 实现 `callParseDouyin(text)`，Promise 封装 `wx.cloud.callFunction`
- [ ] **Step 4:** 将云函数 `errMsg` / `ok: false` 映射为可 Toast 的文案

---

### Task 4: 去水印页面 UI 与保存

**Files:**
- Modify: `pages/remove-wm/remove-wm.vue`

- [ ] **Step 1:** 启用 textarea、`v-model`、按钮「开始解析」
- [ ] **Step 2:** 增加「粘贴」按钮（`getClipboardData`）
- [ ] **Step 3:** loading 态调用 `callParseDouyin`；成功展示 `video` + cover
- [ ] **Step 4:** 「保存到相册」：`downloadFile` → `saveVideoToPhotosAlbum`，处理权限
- [ ] **Step 5:** 页脚合规说明一行；解析成功提示「链接有时效，请尽快保存」

---

### Task 5: 工具注册与首页

**Files:**
- Modify: `common/tools.js`
- Modify: `pages/index/index.vue`

- [ ] **Step 1:** `remove-wm` 的 `status` 改为 `'ready'`
- [ ] **Step 2:** 删除 `index.vue` 中 `item.id === 'remove-wm'` 的 `badge-soon` 块

---

### Task 6: 真机验收与域名配置

- [ ] **Step 1:** 部署云函数到与 `CLOUD_ENV_ID` 一致的环境
- [ ] **Step 2:** 真机粘贴抖音分享文案，完成解析与保存
- [ ] **Step 3:** 将返回的视频 CDN 域名加入小程序 **downloadFile 合法域名**
- [ ] **Step 4:** 对照设计 spec 第 9 节验收清单逐项勾选

---

## 风险与依赖

- **抖音接口变动：** 仅影响 `parser.js`，需关注云函数日志。
- **用户必须先开通云开发：** 无环境 ID 时小程序无法调通云函数。
- **解析实现：** 可选用维护中的开源解析思路，避免在仓库提交侵权或失效的硬编码密钥。

## 建议提交粒度（用户要求 commit 时）

1. `chore: add cloud function scaffold for parseDouyin`
2. `feat(cloud): implement douyin parse function`
3. `feat(remove-wm): wire cloud parse and save to album`
4. `chore: enable remove-wm tool in registry`
