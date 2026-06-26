# 本地视频去水印设计说明

**日期：** 2026-06-26  
**状态：** 已确认  
**关联页面：** `pages/remove-local-wm/remove-local-wm.vue`

---

## 1. 目标

用户从相册选择本地短视频（≤30 秒、≤20MB），通过**静态区域智能检测**或**手动框选**确定水印区域，经**单帧预览 → 片段预览（前 3 秒）→ 全片导出**三步确认后，在本地对选区做模糊处理并生成新视频，保存到相册。

**不在范围：** 云端 AI 修复、多水印区域、链接解析（保留在 `remove-wm`）。

---

## 2. 架构

```
remove-local-wm 页面
  → uni.chooseVideo（校验时长/大小）
  → VideoDecoder 采样多帧 → video-wm-detect（静态区域检测）
  → 用户调整选区（归一化坐标）
  → 单帧：解码一帧 → Canvas 2d 模糊 → 导出图片预览
  → 片段/全片：VideoDecoder 逐帧 → Canvas 2d 模糊 → WebGL 录制 → MediaRecorder 导出 mp4
  → uni.saveVideoToPhotosAlbum
```

| 模块 | 职责 |
|------|------|
| `video-wm-detect.js` | 多帧方差分析，检测静态水印区域 |
| `video-wm-blur.js` | ImageData 区域 box blur |
| `video-wm-process.js` | VideoDecoder / MediaRecorder 编排 |
| `remove-local-wm.vue` | UI、步骤流、选区交互 |

**选型理由：** 微信小程序无法运行 FFmpeg；`VideoDecoder` + 本地模糊无需云成本；`MediaRecorder` 需 WebGL Canvas 录制，2d 处理结果 blit 到 WebGL。

---

## 3. 约束

- 视频：≤30 秒、≤20MB
- 基础库：≥ 2.16.1（`VideoDecoder`、`MediaRecorder`）
- 智能检测失败时引导手动框选
- 处理中显示进度，支持取消

---

## 4. 预览流程

| 阶段 | 输出 |
|------|------|
| 单帧预览 | 静态图（当前时刻一帧模糊后） |
| 片段预览 | 前 3 秒 mp4 |
| 全片导出 | 完整模糊视频 |

---

## 5. 入口

独立工具「本地视频去水印」，注册于 `common/tools.js`，`categoryId: 'media'`。
