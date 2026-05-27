# 去水印（抖音 · 微信云开发）设计说明

**日期：** 2026-05-26  
**状态：** 已确认方向（云开发 + 抖音 MVP）  
**关联页面：** `pages/remove-wm/remove-wm.vue`

---

## 1. 目标

用户粘贴抖音分享链接（或含链接的整段文案），小程序调用**微信云开发云函数**解析，展示无水印视频/封面，并支持保存到相册。

**不在 MVP 范围：** 小红书、快手、本地选图去水印、批量解析、用户账号体系。

---

## 2. 架构

```
remove-wm 页面
  → wx.cloud.callFunction('parseDouyin', { text })
  → 云函数：提取 URL → 请求抖音解析 → 返回统一 JSON
  → 页面预览 video / image
  → uni.downloadFile → saveVideoToPhotosAlbum / saveImageToPhotosAlbum
```

| 层级 | 职责 |
|------|------|
| 小程序 | 输入、剪贴板、调云函数、预览、下载、权限与错误提示 |
| 云函数 `parseDouyin` | 从文案提取链接、解析抖音、返回 `items[]` |
| 微信云开发控制台 | 开通环境、部署函数、查看日志与用量 |

**选型理由（成本）：** 云开发免费额度适合工具类低流量；无需自建服务器与 `request` 合法域名（调云函数）；固定成本低于按次第三方 API。

---

## 3. 云函数接口

### 3.1 入参

```json
{ "text": "用户粘贴的整段分享文案或 URL" }
```

云函数内用正则提取 `https://v.douyin.com/...`、`https://www.douyin.com/...` 等；提取失败返回 `INVALID_URL`。

### 3.2 出参（成功）

```json
{
  "ok": true,
  "platform": "douyin",
  "type": "video",
  "title": "",
  "cover": "https://...",
  "items": [
    { "url": "https://...", "type": "video" }
  ]
}
```

图集场景 `type: "gallery"`，`items` 多条 `type: "image"`（v1 以单视频为主，结构预留 gallery）。

### 3.3 出参（失败）

```json
{
  "ok": false,
  "code": "INVALID_URL | PARSE_FAILED | UNSUPPORTED",
  "message": "给用户看的简短说明"
}
```

---

## 4. 抖音解析（云函数实现要点）

1. 短链 `v.douyin.com` 跟随重定向拿到真实 ID（`axios`/`request`，`maxRedirects` 开启）。
2. 调用公开解析逻辑或稳定第三方解析 HTTP 接口（实现细节放在 `cloudfunctions/parseDouyin/lib/parser.js`，便于替换）。
3. 返回**可直接下载**的媒体 URL（注意部分 CDN 带时效，前端解析成功后提示尽快保存）。
4. 云函数设置合理超时（建议 15s）与简单频率限制（同一 openid 可选，v1 可省略）。

**维护：** 抖音接口变更时只改云函数，无需发版小程序（若仅改函数逻辑；改入参/出参则需同步前端）。

---

## 5. 小程序改动

### 5.1 初始化

- `App.vue` `onLaunch`：`wx.cloud.init({ env: '你的环境ID', traceUser: true })`（仅 `#ifdef MP-WEIXIN`）。
- `project.config.json` 增加 `cloudfunctionRoot: "cloudfunctions/"`。
- 新建 `common/cloud.js`：封装 `callParseDouyin(text)`，统一 loading 与错误映射。

### 5.2 `remove-wm.vue` 状态

| 状态 | UI |
|------|-----|
| idle | 可编辑 textarea、「粘贴」「开始解析」 |
| loading | 按钮 loading，禁用重复提交 |
| result | 视频/封面预览、「保存到相册」 |
| error | Toast + 可选行内文案 |

### 5.3 配置与注册

- `common/config.js`：`CLOUD_ENV_ID`（或从 manifest 读取，文档说明在控制台复制）。
- `tools.js`：`remove-wm` → `status: 'ready'`。
- `pages/index/index.vue`：移除 `remove-wm` 的「即将上线」硬编码角标。

### 5.4 相册与下载

- 保存前检查 `scope.writePhotosAlbum`，拒绝时引导 `openSetting`。
- `downloadFile` 的域名须在小程序后台配置 **downloadFile 合法域名**（解析结果 CDN 域名，部署后根据实际返回 URL 配置）。

---

## 6. 目录结构（新增）

```
cloudfunctions/
  parseDouyin/
    index.js          # 入口，校验入参、调用 parser
    package.json
    lib/
      parser.js       # 抖音解析
      extract-url.js  # 从文案提取 URL
common/
  cloud.js            # callFunction 封装
  config.js           # CLOUD_ENV_ID
```

---

## 7. 错误与用户文案

| code | 用户提示（示例） |
|------|------------------|
| INVALID_URL | 未识别到有效链接，请粘贴完整分享文案 |
| PARSE_FAILED | 解析失败，请稍后重试或更换链接 |
| UNSUPPORTED | 暂仅支持抖音链接 |
| 下载失败 | 保存失败，请检查网络或相册权限 |

页脚一行说明：「仅供个人学习使用，请勿用于侵权传播。」

---

## 8. 开通与部署（人工步骤）

1. 微信开发者工具 → 云开发 → 开通环境（选按量计费即可）。
2. 复制**环境 ID** 写入 `common/config.js`。
3. 右键 `cloudfunctions/parseDouyin` → 上传并部署。
4. 真机测试解析；将返回媒体所在域名加入 **downloadFile 合法域名**。
5. HBuilderX 重新运行到微信开发者工具。

---

## 9. 验收标准

- [ ] 粘贴抖音分享文案可解析并预览视频。
- [ ] 可保存视频到系统相册（授权流程正常）。
- [ ] 无效文案、非抖音链接有明确错误提示。
- [ ] 首页点击「去水印」与 Tab 进入行为一致；`status` 为 `ready`。
- [ ] 云函数日志可在控制台查看，便于排查解析失败。

---

## 10. 后续扩展（非 MVP）

- 云函数内增加 `platform` 分支：小红书 `parseXhs`。
- 图集多图保存、「全部保存」。
- 解析历史（本地 storage，可选）。
