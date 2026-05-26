<template>
  <view class="page" :class="{ fullscreen: isFullscreen }">
    <view
      v-if="isFullscreen"
      class="fs-top-fill"
      :style="'height:' + capsuleBottom + 'px'"
    />

    <view
      v-if="!isFullscreen"
      class="nav-bar"
      :style="'padding-top:' + statusBarH + 'px'"
    >
      <view class="nav-inner">
        <text class="nav-back" @tap="goBack">‹</text>
        <text class="nav-title">手持弹幕</text>
        <view class="nav-ph" :style="'width:' + navPadRight + 'px'" />
      </view>
    </view>

    <view class="stage" @tap="onStageTap">
      <view class="track">
        <view class="roll-wrap" :style="wrapPosStyle">
          <view class="roll-inner" :class="{ 'roll-fs': isFullscreen }">
            <text
              class="roll-txt"
              :class="'dm-c-' + colorIdx"
              :style="txtStyleStr"
            >{{ displayText }}</text>
          </view>
        </view>
      </view>

      <view
        class="float-btn"
        :class="{ hidden: isFullscreen && !fsBtnVisible }"
        :style="floatBtnStyle"
        @tap.stop="onFloatBtnTap"
      >
        <text class="ico-char">{{ isFullscreen ? '✕' : '⛶' }}</text>
      </view>
    </view>

    <view v-if="!isFullscreen" class="panel">
      <textarea
        v-model="text"
        class="input"
        placeholder="输入弹幕内容"
        placeholder-class="ph"
        maxlength="80"
        :show-confirm-bar="false"
        @input="onTextInput"
      />
      <view class="row">
        <text class="label">颜色</text>
        <view class="colors">
          <view
            v-for="(c, index) in colors"
            :key="index"
            class="dot-wrap"
            @click="pickColor(c, index)"
          >
            <view
              class="dot"
              :class="{
                on: colorIdx === index,
                'dot-pale': isPaleColor(c)
              }"
              :style="'background-color:' + c"
            />
          </view>
        </view>
      </view>
      <view class="row">
        <text class="label">字号 {{ size }}</text>
        <slider
          class="slider"
          :min="48"
          :max="120"
          :step="4"
          :value="size"
          activeColor="#1677ff"
          block-size="20"
          @change="onSizeChange"
        />
      </view>
      <view class="row">
        <text class="label">速度 {{ scrollSpeed }}</text>
        <slider
          class="slider"
          :min="1"
          :max="10"
          :step="1"
          :value="scrollSpeed"
          activeColor="#1677ff"
          block-size="20"
          @changing="onSpeedChanging"
          @change="onSpeedChange"
        />
      </view>
      <view class="row">
        <text class="label">方向</text>
        <view class="dirs">
          <text
            class="dir"
            :class="{ on: direction === 'left' }"
            @click="setDirection('left')"
          >从左向右</text>
          <text
            class="dir"
            :class="{ on: direction === 'right' }"
            @click="setDirection('right')"
          >从右向左</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 单条弹幕引擎
 * - 预览横轴：左=左缘进右缘出，右=右缘进左缘出
 * - 全屏竖轴+旋转举牌：左=上缘进下缘出，右=下缘进上缘出
 * - 位移按 track 与文字实测像素计算，保证边缘进出
 */
var HIDE_MS = 3000
var CFG_KEY = 'danmaku_cfg'

export default {
  data() {
    return {
      text: '手持弹幕',
      color: '#ffffff',
      colorIdx: 0,
      size: 72,
      scrollSpeed: 5,
      direction: 'left',
      isFullscreen: false,
      fsBtnVisible: true,
      fsHideTimer: null,
      statusBarH: 20,
      navPadRight: 96,
      capsuleBottom: 64,
      safeBottom: 0,
      trackSize: 0,
      textSize: 0,
      pos: 0,
      fromPos: 0,
      toPos: 0,
      pxPerMs: 0,
      axis: 'x',
      rafId: null,
      lastTs: 0,
      measureTimer: null,
      rollGen: 0,
      rollStarting: false,
      winW: 375,
      winH: 667,
      colors: [
        '#ffffff',
        '#ff4d4f',
        '#ff7875',
        '#fa8c16',
        '#faad14',
        '#fadb14',
        '#52c41a',
        '#13c2c2',
        '#1677ff',
        '#2f54eb'
      ]
    }
  },
  computed: {
    displayText() {
      var t = (this.text || '').trim()
      return t || '请输入弹幕'
    },
    displaySize() {
      if (!this.isFullscreen) {
        return this.size
      }
      return Math.min(160, Math.round(this.size * 1.35))
    },
    txtStyleStr() {
      return 'font-size:' + this.displaySize + 'rpx'
    },
    wrapPosStyle() {
      var p = Math.round(this.pos * 100) / 100
      if (this.axis === 'y') {
        return 'transform:translate3d(-50%,' + p + 'px,0);'
      }
      return 'transform:translate3d(' + p + 'px,-50%,0);'
    },
    floatBtnStyle() {
      if (!this.isFullscreen) {
        return ''
      }
      return 'left:28rpx;right:auto;bottom:' + (28 + this.safeBottom) + 'rpx'
    }
  },
  watch: {
    isFullscreen: function () {
      this.applyNavStyle(this.isFullscreen)
      if (this.isFullscreen) {
        this.fsBtnVisible = true
        this.resetFsHideTimer()
      } else {
        this.clearFsHideTimer()
        this.fsBtnVisible = true
      }
      this.restartRoll(true)
    },
    scrollSpeed: function () {
      this.updateSpeedOnly()
    }
  },
  onLoad() {
    var sys = uni.getSystemInfoSync()
    var menu = uni.getMenuButtonBoundingClientRect()
    this.statusBarH = sys.statusBarHeight || 20
    this.navPadRight = sys.windowWidth - menu.left + 10
    this.capsuleBottom = menu.bottom + 4
    this.safeBottom = (sys.safeAreaInsets && sys.safeAreaInsets.bottom) || 0
    this.winW = sys.windowWidth || 375
    this.winH = sys.windowHeight || 667
    this.loadCfg()
  },
  onReady() {
    var self = this
    this.$nextTick(function () {
      setTimeout(function () {
        self.restartRoll(true)
      }, 120)
    })
  },
  onShow() {
    if (!this.rafId && !this.rollStarting) {
      this.restartRoll(true)
    }
  },
  onHide() {
    this.stopRoll()
  },
  onUnload() {
    this.stopRoll()
    this.clearFsHideTimer()
    this.clearMeasureTimer()
    this.saveCfg()
  },
  methods: {
    loadCfg() {
      try {
        var raw = uni.getStorageSync(CFG_KEY)
        if (!raw) {
          return
        }
        if (raw.text !== undefined) {
          this.text = raw.text
        }
        if (raw.colorIdx !== undefined) {
          var idx = raw.colorIdx
          if (idx >= this.colors.length) {
            idx = this.colors.length - 1
          }
          if (idx < 0) {
            idx = 0
          }
          this.colorIdx = idx
          this.color = this.colors[idx] || this.color
        }
        if (raw.size !== undefined) {
          this.size = raw.size
        }
        if (raw.scrollSpeed !== undefined) {
          this.scrollSpeed = raw.scrollSpeed
        }
        if (raw.direction === 'left' || raw.direction === 'right') {
          this.direction = raw.direction
        }
      } catch (e) {}
    },
    saveCfg() {
      try {
        uni.setStorageSync(CFG_KEY, {
          text: this.text,
          colorIdx: this.colorIdx,
          size: this.size,
          scrollSpeed: this.scrollSpeed,
          direction: this.direction
        })
      } catch (e) {}
    },
    applyNavStyle(full) {
      uni.setNavigationBarColor({
        frontColor: full ? '#ffffff' : '#000000',
        backgroundColor: full ? '#000000' : '#ffffff',
        animation: { duration: 0, timingFunc: 'linear' }
      })
    },
    syncAxis() {
      this.axis = this.isFullscreen ? 'y' : 'x'
    },
    calcDurationSec() {
      var len = this.displayText.length || 1
      var base = Math.max(5, Math.min(18, len * 0.3 + this.displaySize / 24))
      var sec = base * (11 - this.scrollSpeed) / 5
      return Math.max(3, Math.min(30, sec))
    },
    applyMotionRange() {
      var W = this.trackSize
      var T = this.textSize
      if (W <= 0 || T <= 0) {
        return false
      }
      if (this.direction === 'left') {
        this.fromPos = -T
        this.toPos = W
      } else {
        this.fromPos = W
        this.toPos = -T
      }
      this.pos = this.fromPos
      this.updateSpeedOnly()
      return true
    },
    updateSpeedOnly() {
      if (this.trackSize <= 0 || this.textSize <= 0) {
        return
      }
      var dist = Math.abs(this.toPos - this.fromPos)
      var durMs = this.calcDurationSec() * 1000
      var ppm = dist / durMs
      this.pxPerMs = this.toPos < this.fromPos ? -ppm : ppm
    },
    estimateTextSize() {
      var len = this.displayText.length || 1
      return Math.max(this.displaySize, Math.round(this.displaySize * len * 0.62))
    },
    applyFallbackSizes() {
      if (this.axis === 'x') {
        this.trackSize = this.winW
        this.textSize = this.estimateTextSize()
      } else {
        this.trackSize = this.winH
        this.textSize = this.estimateTextSize()
      }
    },
    measureSizes() {
      var self = this
      return new Promise(function (resolve) {
        var q = uni.createSelectorQuery().in(self)
        q.select('.track').boundingClientRect()
        q.select('.roll-txt').boundingClientRect()
        q.exec(function (res) {
          var ok = false
          if (res && res[0] && res[1]) {
            var track = res[0]
            var txt = res[1]
            if (self.axis === 'x' && track.width > 0 && txt.width > 0) {
              self.trackSize = track.width
              self.textSize = txt.width
              ok = true
            } else if (self.axis === 'y' && track.height > 0 && txt.width > 0) {
              self.trackSize = track.height
              self.textSize = txt.width
              ok = true
            }
          }
          if (!ok) {
            self.applyFallbackSizes()
          }
          resolve(self.trackSize > 0 && self.textSize > 0)
        })
      })
    },
    stopRoll() {
      if (this.rafId != null) {
        clearInterval(this.rafId)
        this.rafId = null
      }
      this.lastTs = 0
    },
    startLoop() {
      var self = this
      this.stopRoll()
      this.lastTs = Date.now()
      this.rafId = setInterval(function () {
        self.tick()
      }, 16)
    },
    clearMeasureTimer() {
      if (this.measureTimer) {
        clearTimeout(this.measureTimer)
        this.measureTimer = null
      }
    },
    scheduleRestart(resetPos) {
      var self = this
      this.clearMeasureTimer()
      this.measureTimer = setTimeout(function () {
        self.measureTimer = null
        self.restartRoll(resetPos)
      }, 80)
    },
    restartRoll(resetPos) {
      var self = this
      this.rollGen++
      var gen = this.rollGen
      this.rollStarting = true
      this.stopRoll()
      this.syncAxis()
      this.$nextTick(function () {
        setTimeout(function () {
          if (gen !== self.rollGen) {
            return
          }
          self.measureSizes().then(function (ok) {
            if (gen !== self.rollGen) {
              return
            }
            if (!ok) {
              self.rollStarting = false
              return
            }
            if (!self.applyMotionRange()) {
              self.rollStarting = false
              return
            }
            if (!resetPos) {
              self.updateSpeedOnly()
            }
            self.rollStarting = false
            self.startLoop()
          })
        }, 80)
      })
    },
    tick() {
      var now = Date.now()
      if (!this.lastTs) {
        this.lastTs = now
      }
      var dt = now - this.lastTs
      this.lastTs = now
      if (dt > 100 || dt < 0) {
        dt = 16
      }
      if (!this.pxPerMs) {
        return
      }
      this.pos += this.pxPerMs * dt
      if (this.pxPerMs > 0) {
        if (this.pos >= this.toPos) {
          this.pos = this.fromPos
        }
      } else if (this.pxPerMs < 0) {
        if (this.pos <= this.toPos) {
          this.pos = this.fromPos
        }
      }
    },
    goBack() {
      uni.navigateBack({
        fail: function () {
          uni.switchTab({ url: '/pages/index/index' })
        }
      })
    },
    onTextInput() {
      this.saveCfg()
      this.scheduleRestart(true)
    },
    setDirection(dir) {
      if (this.direction === dir) {
        return
      }
      this.direction = dir
      this.saveCfg()
      this.restartRoll(true)
    },
    isPaleColor(c) {
      return c === '#ffffff' || c === '#fadb14' || c === '#faad14'
    },
    pickColor(c, index) {
      this.color = c
      this.colorIdx = index
      this.saveCfg()
    },
    onSizeChange(e) {
      this.size = e.detail.value
      this.saveCfg()
      this.scheduleRestart(true)
    },
    onSpeedChanging(e) {
      var v = parseInt(e.detail.value, 10)
      if (!isNaN(v)) {
        this.scrollSpeed = v
      }
    },
    onSpeedChange(e) {
      var v = parseInt(e.detail.value, 10)
      if (!isNaN(v)) {
        this.scrollSpeed = v
      }
      this.saveCfg()
      this.updateSpeedOnly()
    },
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen
    },
    onFloatBtnTap() {
      this.toggleFullscreen()
    },
    onStageTap() {
      if (!this.isFullscreen) {
        return
      }
      this.fsBtnVisible = true
      this.resetFsHideTimer()
    },
    resetFsHideTimer() {
      var self = this
      this.clearFsHideTimer()
      if (!this.isFullscreen) {
        return
      }
      this.fsHideTimer = setTimeout(function () {
        if (self.isFullscreen) {
          self.fsBtnVisible = false
        }
      }, HIDE_MS)
    },
    clearFsHideTimer() {
      if (this.fsHideTimer) {
        clearTimeout(this.fsHideTimer)
        this.fsHideTimer = null
      }
    }
  }
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f7f8fa;
}

.page.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  height: 100vh;
  background-color: #000000;
}

.fs-top-fill {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: #000000;
}

.nav-bar {
  flex-shrink: 0;
  background-color: #ffffff;
  border-bottom: 1rpx solid #eeeeee;
}

.nav-inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 88rpx;
  padding-left: 24rpx;
}

.nav-back {
  width: 80rpx;
  font-size: 48rpx;
  line-height: 88rpx;
  color: #333333;
}

.nav-title {
  flex: 1;
  font-size: 34rpx;
  font-weight: 500;
  color: #333333;
  text-align: center;
}

.nav-ph {
  flex-shrink: 0;
}

.stage {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 360rpx;
  background-color: #111111;
  overflow: hidden;
}

.page.fullscreen .stage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #000000;
}

.track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}

.roll-wrap {
  position: absolute;
  left: 0;
  top: 50%;
  will-change: transform;
}

.page.fullscreen .roll-wrap {
  left: 50%;
  top: 0;
}

.roll-inner {
  display: inline-block;
}

.roll-inner.roll-fs {
  transform: rotate(90deg);
  transform-origin: center center;
}

.roll-txt {
  display: block;
  white-space: nowrap;
  color: #ffffff;
  line-height: 1.1;
}

.dm-c-0 { color: #ffffff; }
.dm-c-1 { color: #ff4d4f; }
.dm-c-2 { color: #ff7875; }
.dm-c-3 { color: #fa8c16; }
.dm-c-4 { color: #faad14; }
.dm-c-5 { color: #fadb14; }
.dm-c-6 { color: #52c41a; }
.dm-c-7 { color: #13c2c2; }
.dm-c-8 { color: #1677ff; }
.dm-c-9 { color: #2f54eb; }

.float-btn {
  position: absolute;
  right: 28rpx;
  bottom: 28rpx;
  z-index: 20;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  border: 1rpx solid rgba(255, 255, 255, 0.35);
  transition: opacity 0.3s ease;
  pointer-events: auto;
}

.float-btn.hidden {
  opacity: 0;
  pointer-events: none;
}

.ico-char {
  font-size: 30rpx;
  color: #ffffff;
  line-height: 1;
}

.panel {
  flex-shrink: 0;
  padding: 24rpx 28rpx 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  border-top: 1rpx solid #eeeeee;
}

.input {
  width: 100%;
  height: 120rpx;
  padding: 16rpx 20rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  color: #333333;
  background-color: #f7f8fa;
  border-radius: 12rpx;
}

.ph {
  color: #bfbfbf;
}

.row {
  margin-top: 28rpx;
}

.label {
  display: block;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  color: #333333;
}

.colors {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.dot-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  margin-right: 12rpx;
  margin-bottom: 8rpx;
}

.dot {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 3rpx solid #c8c8c8;
  box-sizing: border-box;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.dot.dot-pale {
  border-color: #8c8c8c;
  box-shadow: inset 0 0 0 1rpx rgba(0, 0, 0, 0.06);
}

.dot.on {
  border-color: #1677ff;
  transform: scale(1.1);
  box-shadow: 0 0 0 4rpx rgba(22, 119, 255, 0.28);
}

.dot.dot-pale.on {
  border-color: #1677ff;
  box-shadow: 0 0 0 4rpx rgba(22, 119, 255, 0.28), inset 0 0 0 1rpx rgba(0, 0, 0, 0.08);
}

.slider {
  margin: 0;
}

.dirs {
  display: flex;
  flex-direction: row;
}

.dir {
  flex: 1;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #666666;
  text-align: center;
  background-color: #f7f8fa;
  border-radius: 12rpx;
}

.dir + .dir {
  margin-left: 20rpx;
}

.dir.on {
  color: #1677ff;
  font-weight: 500;
  background-color: #e6f4ff;
}
</style>
