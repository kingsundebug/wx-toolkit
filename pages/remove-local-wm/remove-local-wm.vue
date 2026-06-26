<template>
  <view class="page">
    <view class="head-card">
      <view class="head-icon tone-purple">
        <text class="glyph">视</text>
      </view>
      <view class="head-body">
        <text class="head-title">本地视频去水印</text>
        <text class="head-desc">选视频、框选水印区域，模糊处理后导出</text>
      </view>
    </view>

    <view v-if="!supportOk" class="panel warn-panel">
      <text class="warn-txt">当前环境不支持本地视频处理，请使用微信 8.0+ 并在真机中打开</text>
    </view>

    <view class="panel">
      <view v-if="videoPath" class="video-stage">
        <video
          id="sourceVideo"
          class="source-video"
          :src="videoPath"
          :show-center-play-btn="true"
          :enable-play-gesture="true"
          object-fit="contain"
          @loadedmetadata="onVideoMeta"
        />
        <view
          class="region-box"
          :style="regionBoxStyle"
          @touchstart.stop="onRegionTouchStart"
          @touchmove.stop.prevent="onRegionTouchMove"
          @touchend.stop="onRegionTouchEnd"
        >
          <view class="region-border" />
          <text class="region-label">水印区域</text>
        </view>
        <view class="video-change" hover-class="video-change-hover" @tap="onChooseVideo">
          <text class="video-change-txt">换一个</text>
        </view>
      </view>
      <button
        v-else
        class="btn-native btn-outline"
        :disabled="!supportOk"
        hover-class="btn-hover"
        @tap="onChooseVideo"
      >
        选择视频（≤30秒 / 20MB）
      </button>

      <view v-if="videoPath" class="region-actions">
        <view class="act-chip" hover-class="act-chip-hover" @tap="onAutoDetect">
          <text class="act-chip-txt">{{ detecting ? '识别中…' : '智能识别' }}</text>
        </view>
        <view class="act-chip" hover-class="act-chip-hover" @tap="onManualRegion">
          <text class="act-chip-txt">手动框选</text>
        </view>
      </view>

      <text v-if="videoPath" class="hint">拖动方框调整水印位置与范围</text>

      <button
        v-if="videoPath"
        class="btn-native btn-secondary"
        :disabled="busy"
        hover-class="btn-hover"
        @tap="onFramePreview"
      >
        {{ framePreviewPath ? '重新单帧预览' : '单帧预览' }}
      </button>

      <button
        v-if="framePreviewPath"
        class="btn-native btn-secondary"
        :disabled="busy"
        hover-class="btn-hover"
        @tap="onClipPreview"
      >
        {{ clipPreviewPath ? '重新片段预览' : '片段预览（前3秒）' }}
      </button>

      <button
        v-if="clipPreviewPath"
        class="btn-native btn-primary"
        :disabled="busy"
        hover-class="btn-hover"
        @tap="onExportFull"
      >
        {{ outputPath ? '重新生成全片' : '生成去水印视频' }}
      </button>

      <button
        v-if="busy"
        class="btn-native btn-cancel"
        hover-class="btn-hover"
        @tap="onCancelProcess"
      >
        取消处理
      </button>
    </view>

    <view v-if="busy && progressTotal > 0" class="progress-panel">
      <text class="progress-txt">处理中 {{ progressCurrent }} / {{ progressTotal }}</text>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }" />
      </view>
    </view>

    <view v-if="framePreviewPath" class="preview">
      <text class="preview-title">单帧预览</text>
      <image
        class="preview-img"
        :src="framePreviewPath"
        mode="widthFix"
        @tap="onPreviewImage(framePreviewPath)"
      />
    </view>

    <view v-if="clipPreviewPath" class="preview">
      <text class="preview-title">片段预览（前 3 秒）</text>
      <video
        class="preview-video"
        :src="clipPreviewPath"
        :show-center-play-btn="true"
        object-fit="contain"
      />
    </view>

    <view v-if="outputPath" class="preview">
      <text class="preview-title">处理结果</text>
      <video
        class="preview-video"
        :src="outputPath"
        :show-center-play-btn="true"
        object-fit="contain"
      />
      <button
        class="btn-native btn-save"
        :disabled="saving"
        hover-class="btn-hover"
        @tap="onSave"
      >
        {{ saving ? '保存中…' : '保存到相册' }}
      </button>
    </view>

    <text class="legal">仅供个人学习使用，请勿用于侵权传播</text>
  </view>
</template>

<script>
import {
  detectWatermarkRegion,
  defaultManualRegion
} from '../../common/video-wm-detect.js'
import {
  isVideoProcessSupported,
  validateChosenVideo,
  sampleVideoFrames,
  renderFramePreview,
  exportClipPreview,
  exportBlurredVideo,
  clampRegion
} from '../../common/video-wm-process.js'

export default {
  data() {
    return {
      supportOk: false,
      videoPath: '',
      videoMeta: null,
      region: defaultManualRegion(),
      displayW: 1,
      displayH: 1,
      detecting: false,
      busy: false,
      processSignal: { cancelled: false },
      progressCurrent: 0,
      progressTotal: 0,
      framePreviewPath: '',
      clipPreviewPath: '',
      outputPath: '',
      saving: false,
      touchStart: null,
      regionStart: null
    }
  },
  computed: {
    regionBoxStyle() {
      const r = this.region
      return {
        left: r.x * 100 + '%',
        top: r.y * 100 + '%',
        width: r.w * 100 + '%',
        height: r.h * 100 + '%'
      }
    },
    progressPercent() {
      if (!this.progressTotal) return 0
      return Math.min(100, Math.round((this.progressCurrent / this.progressTotal) * 100))
    }
  },
  onLoad() {
    this.supportOk = isVideoProcessSupported()
  },
  methods: {
    resetOutputs() {
      this.framePreviewPath = ''
      this.clipPreviewPath = ''
      this.outputPath = ''
    },
    onVideoMeta() {
      const query = uni.createSelectorQuery().in(this)
      query
        .select('.video-stage')
        .boundingClientRect((rect) => {
          if (rect) {
            this.displayW = rect.width || 1
            this.displayH = rect.height || 1
          }
        })
        .exec()
    },
    onChooseVideo() {
      if (!this.supportOk) {
        uni.showToast({ title: '当前环境不支持', icon: 'none' })
        return
      }
      uni.chooseVideo({
        sourceType: ['album'],
        compressed: false,
        maxDuration: 30,
        success: async (res) => {
          const err = validateChosenVideo(res)
          if (err) {
            uni.showToast({ title: err, icon: 'none', duration: 2500 })
            return
          }
          this.videoPath = res.tempFilePath
          this.videoMeta = {
            width: res.width,
            height: res.height,
            duration: res.duration,
            size: res.size
          }
          this.region = defaultManualRegion()
          this.resetOutputs()
          this.$nextTick(() => this.onVideoMeta())
          await this.onAutoDetect()
        }
      })
    },
    async onAutoDetect() {
      if (!this.videoPath || this.detecting) return
      this.detecting = true
      uni.showLoading({ title: '识别水印', mask: true })
      try {
        const { frames } = await sampleVideoFrames(this.videoPath)
        const detected = detectWatermarkRegion(frames)
        if (detected) {
          this.region = clampRegion(detected)
          this.resetOutputs()
          uni.showToast({ title: '已识别水印区域', icon: 'success' })
        } else {
          uni.showToast({
            title: '未识别到固定水印，请手动调整方框',
            icon: 'none',
            duration: 2500
          })
        }
      } catch (err) {
        console.error('detect fail', err)
        uni.showToast({
          title: (err && err.message) || '识别失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
        this.detecting = false
      }
    },
    onManualRegion() {
      this.region = clampRegion(defaultManualRegion())
      this.resetOutputs()
      uni.showToast({ title: '请拖动方框调整', icon: 'none' })
    },
    onRegionTouchStart(e) {
      const t = e.touches[0]
      this.touchStart = { x: t.clientX, y: t.clientY }
      this.regionStart = { ...this.region }
    },
    onRegionTouchMove(e) {
      if (!this.touchStart || !this.regionStart) return
      const t = e.touches[0]
      const dx = (t.clientX - this.touchStart.x) / this.displayW
      const dy = (t.clientY - this.touchStart.y) / this.displayH
      this.region = clampRegion({
        x: this.regionStart.x + dx,
        y: this.regionStart.y + dy,
        w: this.regionStart.w,
        h: this.regionStart.h
      })
      this.resetOutputs()
    },
    onRegionTouchEnd() {
      this.touchStart = null
      this.regionStart = null
    },
    async onFramePreview() {
      if (this.busy || !this.videoPath) return
      this.busy = true
      this.processSignal = { cancelled: false }
      uni.showLoading({ title: '生成预览', mask: true })
      try {
        const path = await renderFramePreview(this.videoPath, this.region, 0)
        this.framePreviewPath = path
        this.clipPreviewPath = ''
        this.outputPath = ''
        uni.showToast({ title: '单帧预览已生成', icon: 'success' })
      } catch (err) {
        console.error('frame preview fail', err)
        uni.showToast({
          title: (err && err.message) || '预览失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
        this.busy = false
      }
    },
    async onClipPreview() {
      if (this.busy || !this.videoPath) return
      this.busy = true
      this.processSignal = { cancelled: false }
      this.progressCurrent = 0
      this.progressTotal = 0
      uni.showLoading({ title: '片段处理中', mask: true })
      try {
        const path = await exportClipPreview(this.videoPath, this.region, {
          signal: this.processSignal,
          onProgress: (cur, total) => {
            this.progressCurrent = cur
            this.progressTotal = total
          }
        })
        this.clipPreviewPath = path
        this.outputPath = ''
        uni.showToast({ title: '片段预览已生成', icon: 'success' })
      } catch (err) {
        console.error('clip preview fail', err)
        uni.showToast({
          title: (err && err.message) || '片段预览失败',
          icon: 'none',
          duration: 3000
        })
      } finally {
        uni.hideLoading()
        this.busy = false
        this.progressCurrent = 0
        this.progressTotal = 0
      }
    },
    async onExportFull() {
      if (this.busy || !this.videoPath) return
      this.busy = true
      this.processSignal = { cancelled: false }
      this.progressCurrent = 0
      this.progressTotal = 0
      uni.showLoading({ title: '全片处理中', mask: true })
      try {
        const path = await exportBlurredVideo(this.videoPath, this.region, {
          signal: this.processSignal,
          onProgress: (cur, total) => {
            this.progressCurrent = cur
            this.progressTotal = total
          }
        })
        this.outputPath = path
        uni.showToast({ title: '视频已生成', icon: 'success' })
      } catch (err) {
        console.error('export fail', err)
        uni.showToast({
          title: (err && err.message) || '生成失败',
          icon: 'none',
          duration: 3000
        })
      } finally {
        uni.hideLoading()
        this.busy = false
        this.progressCurrent = 0
        this.progressTotal = 0
      }
    },
    onCancelProcess() {
      this.processSignal.cancelled = true
      uni.showToast({ title: '正在取消…', icon: 'none' })
    },
    onPreviewImage(url) {
      uni.previewImage({ urls: [url], current: url })
    },
    ensureAlbumAuth() {
      return new Promise((resolve, reject) => {
        uni.getSetting({
          success: (res) => {
            if (res.authSetting['scope.writePhotosAlbum']) {
              resolve()
              return
            }
            uni.authorize({
              scope: 'scope.writePhotosAlbum',
              success: () => resolve(),
              fail: () => {
                uni.showModal({
                  title: '需要相册权限',
                  content: '保存视频需要访问相册，请在设置中开启',
                  confirmText: '去设置',
                  success: (modal) => {
                    if (!modal.confirm) {
                      reject(new Error('未授权相册'))
                      return
                    }
                    uni.openSetting({
                      success: (setting) => {
                        if (setting.authSetting['scope.writePhotosAlbum']) {
                          resolve()
                        } else {
                          reject(new Error('未授权相册'))
                        }
                      },
                      fail: () => reject(new Error('未授权相册'))
                    })
                  }
                })
              }
            })
          },
          fail: () => reject(new Error('无法获取权限状态'))
        })
      })
    },
    async onSave() {
      if (this.saving || !this.outputPath) return
      this.saving = true
      uni.showLoading({ title: '保存中', mask: true })
      try {
        await this.ensureAlbumAuth()
        await new Promise((resolve, reject) => {
          uni.saveVideoToPhotosAlbum({
            filePath: this.outputPath,
            success: resolve,
            fail: reject
          })
        })
        uni.showToast({ title: '已保存', icon: 'success' })
      } catch (err) {
        uni.showToast({
          title: (err && err.errMsg) || (err && err.message) || '保存失败',
          icon: 'none',
          duration: 3000
        })
      } finally {
        uni.hideLoading()
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx 32rpx 48rpx;
  box-sizing: border-box;
  background-color: #f7f8fa;
}

.head-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 28rpx;
  background-color: #f9f0ff;
  border-radius: 20rpx;
}

.head-icon {
  display: flex;
  width: 96rpx;
  height: 96rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
}

.tone-purple {
  background-color: #722ed1;
}

.glyph {
  font-size: 40rpx;
  font-weight: 600;
  color: #ffffff;
}

.head-body {
  flex: 1;
  margin-left: 24rpx;
}

.head-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #141414;
}

.head-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: #595959;
}

.panel {
  margin-top: 24rpx;
  padding: 28rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.warn-panel {
  background-color: #fff7e6;
}

.warn-txt {
  font-size: 26rpx;
  line-height: 40rpx;
  color: #d46b08;
}

.video-stage {
  position: relative;
  width: 100%;
  height: 400rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background-color: #000000;
}

.source-video {
  width: 100%;
  height: 100%;
}

.region-box {
  position: absolute;
  box-sizing: border-box;
  z-index: 2;
}

.region-border {
  width: 100%;
  height: 100%;
  border: 2rpx dashed #ff4d4f;
  background-color: rgba(255, 77, 79, 0.15);
  box-sizing: border-box;
}

.region-label {
  position: absolute;
  top: -36rpx;
  left: 0;
  padding: 4rpx 12rpx;
  font-size: 20rpx;
  color: #ffffff;
  background-color: #ff4d4f;
  border-radius: 6rpx;
}

.video-change {
  position: absolute;
  right: 16rpx;
  bottom: 16rpx;
  z-index: 3;
  padding: 12rpx 20rpx;
  background-color: rgba(0, 0, 0, 0.45);
  border-radius: 8rpx;
}

.video-change-hover {
  opacity: 0.85;
}

.video-change-txt {
  font-size: 24rpx;
  color: #ffffff;
}

.region-actions {
  display: flex;
  flex-direction: row;
  margin-top: 20rpx;
}

.act-chip {
  margin-right: 16rpx;
  padding: 14rpx 24rpx;
  background-color: #f9f0ff;
  border-radius: 12rpx;
}

.act-chip-hover {
  opacity: 0.85;
}

.act-chip-txt {
  font-size: 26rpx;
  color: #722ed1;
}

.hint {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #8c8c8c;
}

.btn-native {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88rpx;
  margin-top: 24rpx;
  padding: 0;
  font-size: 30rpx;
  font-weight: 500;
  line-height: 88rpx;
  border: none;
  border-radius: 44rpx;
}

.btn-native::after {
  border: none;
}

.btn-outline {
  color: #722ed1;
  background-color: #f9f0ff;
  border: 2rpx solid #d3adf7;
}

.btn-secondary {
  color: #722ed1;
  background-color: #efdbff;
}

.btn-primary {
  color: #ffffff;
  background-color: #722ed1;
}

.btn-primary[disabled],
.btn-secondary[disabled] {
  opacity: 0.6;
}

.btn-cancel {
  color: #595959;
  background-color: #f5f5f5;
}

.btn-save {
  color: #ffffff;
  background-color: #1677ff;
}

.btn-hover {
  opacity: 0.85;
}

.progress-panel {
  margin-top: 16rpx;
  padding: 20rpx 28rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
}

.progress-txt {
  font-size: 24rpx;
  color: #595959;
}

.progress-bar {
  height: 12rpx;
  margin-top: 12rpx;
  background-color: #f0f0f0;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #722ed1;
  border-radius: 6rpx;
}

.preview {
  margin-top: 24rpx;
  padding: 28rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.preview-title {
  display: block;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #141414;
}

.preview-img {
  display: block;
  width: 100%;
  border-radius: 12rpx;
}

.preview-video {
  width: 100%;
  height: 400rpx;
  border-radius: 12rpx;
  background-color: #000000;
}

.legal {
  display: block;
  margin-top: 32rpx;
  font-size: 22rpx;
  color: #bfbfbf;
  text-align: center;
}
</style>
