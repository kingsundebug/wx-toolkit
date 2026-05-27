# 空调模拟器设计说明

**日期：** 2026-05-27  
**状态：** 已确认  

## 目标

趣味工具：整屏空调遥控器 UI，支持开关、温度 16–30°C、五种模式、四档风速；按键嘀声，开机启动音 + 运行嗡鸣，关机停止。

## 不在 MVP

定时、扫风、睡眠、WiFi；真实设备控制；音量滑条与自定义音效。

## 架构

- `pages/ac-simulator/ac-simulator.vue` — 遥控器 UI 与状态
- `common/ac-simulator/constants.js` — 枚举与文案
- `common/ac-simulator/audio.js` — InnerAudioContext 封装
- `static/ac-simulator/*.wav` — 由 `node scripts/generate-ac-sounds.js` 生成
- `common/tools.js` + `pages.json` 注册

## 状态

`power` off|on；`temp` 16–30（默认 26）；`mode` cool|heat|dry|fan|auto；`fanSpeed` auto|low|mid|high。关机仅电源键有效。

## 音效

按键 beep；开机 power-on + 循环 hum（按风速选文件，auto→mid，heat 略大声）；`onHide`/`onUnload` 销毁实例。

## 验收

- [ ] 首页可进入，遥控器风格 + LCD
- [ ] 温度/模式/风速与开关行为正确
- [ ] 音效符合设计，离页无残留播放
