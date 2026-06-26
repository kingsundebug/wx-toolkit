# 本地视频去水印 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan step-by-task.

**Goal:** 新增微信小程序工具「本地视频去水印」：选视频、智能/手动框选、三步预览、本地模糊导出。

**Architecture:** VideoDecoder 采样与逐帧解码 → 静态区域方差检测 → Canvas 2d box blur → WebGL blit + MediaRecorder 导出 mp4。

**Tech Stack:** uni-app Vue2、微信 VideoDecoder / MediaRecorder / OffscreenCanvas

**Spec:** `docs/superpowers/specs/2026-06-26-remove-local-wm-design.md`

---

## Files

| File | Action |
|------|--------|
| `common/video-wm-blur.js` | Create — 区域 box blur |
| `common/video-wm-detect.js` | Create — 静态水印检测 |
| `common/video-wm-process.js` | Create — 解码/录制编排 |
| `pages/remove-local-wm/remove-local-wm.vue` | Create — 页面 UI |
| `common/tools.js` | Modify — 注册工具 |
| `pages.json` | Modify — 路由 |

## Test plan

- [ ] 工具箱出现「本地视频去水印」入口
- [ ] 选择 ≤30s 视频后自动智能识别或提示手动调整
- [ ] 单帧预览、片段预览、全片导出流程可用
- [ ] 保存到相册（真机 + 相册权限）
