<template>
  <view class="page">
    <text class="title">便携小空调</text>
    <text class="tip">💡 Tip：为你的夏日带去清凉！</text>

    <view class="unit" :class="{ on: powerOn }">
      <view class="label-sticker">
        <view class="label-bar b1" />
        <view class="label-bar b2" />
        <view class="label-bar b3" />
        <view class="label-bar b4" />
        <view class="label-bar b5" />
      </view>

      <view class="unit-face">
        <view class="display">
          <text
            v-if="powerOn"
            class="mode-ico"
            :class="{ heat: mode === 'heat' }"
          >{{ modeIcon }}</text>
          <text v-if="powerOn" class="disp-temp">{{ temp }}°C</text>
          <text v-else class="disp-off">--</text>
          <text v-if="powerOn" class="disp-sub">{{ modeLabel }} · {{ fanLabel }}</text>
        </view>
        <view class="led" :class="{ on: powerOn }" />
      </view>

      <view class="vent-icon" />
      <view v-if="powerOn" class="wind">
        <view class="wind-line w1" />
        <view class="wind-line w2" />
        <view class="wind-line w3" />
      </view>
    </view>

    <view class="remote-panel">
      <view class="remote-pad">
        <view class="pad-row">
          <view
            class="key key-mode cool"
            :class="{ active: isCoolSide, disabled: !powerOn }"
            @tap="onCoolTap"
          >
            <text class="key-ico">❄</text>
            <text class="key-cap">模式</text>
          </view>
          <view class="key key-power" @tap="onPower">
            <text class="key-ico">⏻</text>
          </view>
          <view
            class="key key-mode heat"
            :class="{ active: mode === 'heat', disabled: !powerOn }"
            @tap="onHeatTap"
          >
            <text class="key-ico">☀</text>
            <text class="key-cap">制热</text>
          </view>
        </view>

        <view class="pad-row">
          <view
            class="key key-fan"
            :class="{ disabled: !powerOn }"
            @tap="onFanCycle"
          >
            <text class="key-ico key-ico-sm">🌀</text>
            <text class="key-cap">风速</text>
          </view>
          <view
            class="key key-temp"
            :class="{ disabled: !powerOn }"
            @tap="onTempUp"
          >
            <text class="chev">⌃</text>
          </view>
          <view class="key key-ph" />
        </view>

        <view class="pad-row">
          <view class="key key-ph" />
          <view
            class="key key-temp"
            :class="{ disabled: !powerOn }"
            @tap="onTempDown"
          >
            <text class="chev">⌄</text>
          </view>
          <view class="key key-ph" />
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import {
  TEMP_MIN,
  TEMP_MAX,
  TEMP_DEFAULT,
  getModeLabel,
  getFanLabel
} from '../../common/ac-simulator/constants.js'
import { createAcAudio } from '../../common/ac-simulator/audio.js'

const COOL_CYCLE = ['cool', 'dry', 'fan', 'auto']
const FAN_CYCLE = ['auto', 'low', 'mid', 'high']

export default {
  data() {
    return {
      powerOn: false,
      temp: TEMP_DEFAULT,
      mode: 'cool',
      fanSpeed: 'auto',
      audio: null
    }
  },
  computed: {
    modeLabel() {
      return getModeLabel(this.mode)
    },
    fanLabel() {
      return getFanLabel(this.fanSpeed)
    },
    isCoolSide() {
      return COOL_CYCLE.indexOf(this.mode) >= 0
    },
    modeIcon() {
      return this.mode === 'heat' ? '☀' : '❄'
    }
  },
  onLoad() {
    // #ifdef MP-WEIXIN
    if (typeof wx !== 'undefined' && wx.setInnerAudioOption) {
      wx.setInnerAudioOption({ obeyMuteSwitch: false })
    }
    // #endif
    this.audio = createAcAudio()
  },
  onHide() {
    if (this.audio) {
      this.audio.stopWork()
    }
  },
  onUnload() {
    if (this.audio) {
      this.audio.destroy()
      this.audio = null
    }
  },
  methods: {
    beep() {
      if (this.audio) {
        this.audio.playBeep()
      }
    },
    syncHum() {
      if (!this.powerOn || !this.audio) {
        return
      }
      this.audio.updateWork(this.fanSpeed, this.mode)
    },
    onPower() {
      this.beep()
      if (this.powerOn) {
        this.powerOn = false
        if (this.audio) {
          this.audio.stopWork()
        }
        return
      }
      this.powerOn = true
      this.temp = TEMP_DEFAULT
      this.mode = 'cool'
      this.fanSpeed = 'auto'
      if (this.audio) {
        this.audio.startWork(this.fanSpeed, this.mode)
      }
    },
    onCoolTap() {
      if (!this.powerOn) {
        return
      }
      this.beep()
      const idx = COOL_CYCLE.indexOf(this.mode)
      if (idx >= 0) {
        this.mode = COOL_CYCLE[(idx + 1) % COOL_CYCLE.length]
      } else {
        this.mode = 'cool'
      }
      this.syncHum()
    },
    onHeatTap() {
      if (!this.powerOn || this.mode === 'heat') {
        return
      }
      this.beep()
      this.mode = 'heat'
      this.syncHum()
    },
    onFanCycle() {
      if (!this.powerOn) {
        return
      }
      this.beep()
      const idx = FAN_CYCLE.indexOf(this.fanSpeed)
      this.fanSpeed = FAN_CYCLE[(idx + 1) % FAN_CYCLE.length]
      this.syncHum()
    },
    onTempDown() {
      if (!this.powerOn || this.temp <= TEMP_MIN) {
        return
      }
      this.beep()
      this.temp -= 1
    },
    onTempUp() {
      if (!this.powerOn || this.temp >= TEMP_MAX) {
        return
      }
      this.beep()
      this.temp += 1
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 48rpx 32rpx 64rpx;
  box-sizing: border-box;
  background-color: #ffffff;
}

.title {
  display: block;
  font-size: 52rpx;
  font-weight: 700;
  color: #1a1a1a;
  text-align: center;
}

.tip {
  display: block;
  margin-top: 16rpx;
  margin-bottom: 40rpx;
  font-size: 26rpx;
  color: #8c8c8c;
  text-align: center;
}

.unit {
  position: relative;
  margin: 0 auto 32rpx;
  padding: 32rpx 28rpx 56rpx;
  width: 100%;
  max-width: 620rpx;
  box-sizing: border-box;
  border-radius: 20rpx;
  background-color: #fafafa;
  border: 2rpx solid #f0f0f0;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
}

.unit.on {
  background-color: #ffffff;
}

.label-sticker {
  position: absolute;
  top: 28rpx;
  left: 28rpx;
  width: 48rpx;
  padding: 6rpx 4rpx;
  border-radius: 4rpx;
  background-color: #ffffff;
  border: 1rpx solid #e8e8e8;
}

.label-bar {
  height: 6rpx;
  margin-bottom: 4rpx;
  border-radius: 2rpx;
}

.label-bar:last-child {
  margin-bottom: 0;
}

.b1 { background-color: #52c41a; width: 100%; }
.b2 { background-color: #a0d911; width: 88%; }
.b3 { background-color: #fadb14; width: 76%; }
.b4 { background-color: #fa8c16; width: 64%; }
.b5 { background-color: #f5222d; width: 52%; }

.unit-face {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-end;
  min-height: 120rpx;
  padding-right: 8rpx;
}

.display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.mode-ico {
  font-size: 28rpx;
  color: #1677ff;
  line-height: 1;
}

.mode-ico.heat {
  color: #fa8c16;
}

.disp-temp {
  margin-top: 4rpx;
  font-size: 56rpx;
  font-weight: 300;
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 4rpx;
  color: #bfbfbf;
}

.unit.on .disp-temp {
  color: #8c8c8c;
}

.disp-off {
  font-size: 56rpx;
  font-family: 'Courier New', Courier, monospace;
  color: #d9d9d9;
}

.disp-sub {
  margin-top: 6rpx;
  font-size: 20rpx;
  font-family: 'Courier New', Courier, monospace;
  color: #c8c8c8;
  letter-spacing: 2rpx;
}

.unit.on .disp-sub {
  color: #a6a6a6;
}

.led {
  position: absolute;
  right: 36rpx;
  bottom: 72rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background-color: #e8e8e8;
}

.led.on {
  background-color: #52c41a;
  box-shadow: 0 0 8rpx rgba(82, 196, 26, 0.6);
}

.vent-icon {
  position: absolute;
  left: 50%;
  bottom: 48rpx;
  width: 32rpx;
  height: 16rpx;
  margin-left: -16rpx;
  border: 2rpx solid #d9d9d9;
  border-radius: 4rpx;
}

.wind {
  position: absolute;
  left: 50%;
  bottom: 8rpx;
  width: 120rpx;
  height: 40rpx;
  margin-left: -60rpx;
}

.wind-line {
  position: absolute;
  width: 36rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background-color: #d9d9d9;
  transform: rotate(-28deg);
  animation: blow 1.2s ease-in-out infinite;
}

.w1 { left: 8rpx; top: 4rpx; animation-delay: 0s; }
.w2 { left: 42rpx; top: 14rpx; animation-delay: 0.2s; }
.w3 { left: 76rpx; top: 4rpx; animation-delay: 0.4s; }

@keyframes blow {
  0%, 100% { opacity: 0.35; transform: rotate(-28deg) translateY(0); }
  50% { opacity: 1; transform: rotate(-28deg) translateY(6rpx); }
}

.remote-panel {
  margin: 0 auto;
  padding: 28rpx 24rpx 32rpx;
  max-width: 620rpx;
  border-radius: 32rpx;
  background: linear-gradient(180deg, #ebebeb 0%, #d8d8d8 100%);
  box-shadow:
    0 16rpx 48rpx rgba(0, 0, 0, 0.12),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.65);
}

.remote-pad {
  padding: 16rpx 8rpx 8rpx;
}

.pad-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.pad-row:last-child {
  margin-bottom: 0;
}

.key {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 108rpx;
  height: 108rpx;
  margin: 0 28rpx;
  border-radius: 50%;
  box-shadow:
    0 6rpx 0 rgba(0, 0, 0, 0.12),
    0 8rpx 20rpx rgba(0, 0, 0, 0.08),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.35);
}

.key:active:not(.disabled):not(.key-ph) {
  transform: translateY(4rpx);
  box-shadow:
    0 2rpx 0 rgba(0, 0, 0, 0.12),
    0 4rpx 12rpx rgba(0, 0, 0, 0.06),
    inset 0 2rpx 6rpx rgba(0, 0, 0, 0.08);
}

.key.disabled {
  opacity: 0.38;
}

.key-ph {
  visibility: hidden;
  box-shadow: none;
}

.key-mode.cool {
  background: linear-gradient(160deg, #5b9cff 0%, #3a7ae0 100%);
}

.key-mode.cool.active {
  box-shadow:
    0 6rpx 0 #2a5fb0,
    0 8rpx 24rpx rgba(58, 122, 224, 0.4),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.3);
}

.key-mode.heat {
  background: linear-gradient(160deg, #ffc040 0%, #f59e0b 100%);
}

.key-mode.heat.active {
  box-shadow:
    0 6rpx 0 #c47a08,
    0 8rpx 24rpx rgba(245, 158, 11, 0.4),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.3);
}

.key-power {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(160deg, #ff7a9a 0%, #e84393 100%);
  box-shadow:
    0 8rpx 0 #b83280,
    0 10rpx 28rpx rgba(232, 67, 147, 0.35),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.3);
}

.key-fan {
  background: linear-gradient(160deg, #f0f0f0 0%, #dcdcdc 100%);
}

.key-temp {
  background: linear-gradient(160deg, #f5f5f5 0%, #e8e8e8 100%);
}

.key-ico {
  font-size: 40rpx;
  color: #ffffff;
  line-height: 1;
}

.key-ico-sm {
  font-size: 36rpx;
}

.key-fan .key-ico-sm {
  color: #595959;
}

.key-cap {
  margin-top: 4rpx;
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1;
}

.key-fan .key-cap {
  color: #8c8c8c;
}

.chev {
  font-size: 42rpx;
  font-weight: 600;
  color: #595959;
  line-height: 1;
}
</style>
