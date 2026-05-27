<template>
  <view class="page">
    <view class="head-card">
      <view class="head-icon tone-blue">
        <text class="glyph">码</text>
      </view>
      <view class="head-body">
        <text class="head-title">二维码生成</text>
        <text class="head-desc">可选风景/人物底图，生成艺术二维码，扫码内容不变</text>
      </view>
    </view>

    <view class="panel">
      <view class="label-row">
        <text class="label">内容</text>
        <view class="paste-btn" hover-class="paste-hover" @tap="onPaste">
          <text class="paste-txt">粘贴</text>
        </view>
      </view>
      <textarea
        v-model="content"
        class="textarea"
        placeholder="输入网址、文字…"
        placeholder-class="ph"
        maxlength="500"
        :show-confirm-bar="false"
      />

      <view class="label-row label-row-mt">
        <text class="label">底图（可选）</text>
        <text v-if="bgImage" class="clear-txt" @tap="onClearBg">清除</text>
      </view>
      <view class="bg-row">
        <view v-if="bgImage" class="bg-preview-wrap">
          <image class="bg-preview" :src="bgImage" mode="aspectFill" />
        </view>
        <view v-else class="bg-placeholder" @tap="onChooseBg">
          <text class="bg-ph-icon">+</text>
          <text class="bg-ph-txt">选风景 / 人物图</text>
        </view>
        <view v-if="bgImage" class="bg-change" hover-class="paste-hover" @tap="onChooseBg">
          <text class="bg-change-txt">更换</text>
        </view>
      </view>

      <view v-if="bgImage" class="slider-row">
        <text class="slider-label">码点浓度 {{ dotOpacityText }}</text>
        <slider
          class="slider"
          :min="45"
          :max="88"
          :step="1"
          :value="dotOpacityPercent"
          activeColor="#1677ff"
          block-size="20"
          @changing="onOpacityChanging"
          @change="onOpacityChange"
        />
        <text class="slider-hint">浓度越低画面越清晰，过高可能难扫；生成后请先扫码测试</text>
      </view>

      <button
        class="btn-native btn-primary"
        :disabled="generating"
        hover-class="btn-hover"
        @tap="onGenerate"
      >
        {{ generating ? '生成中…' : '生成二维码' }}
      </button>
    </view>

    <view v-if="showPreview" class="preview">
      <view class="qr-wrap">
        <canvas
          canvas-id="qrCanvas"
          class="qr-canvas"
          :style="{ width: qrSizePx + 'px', height: qrSizePx + 'px' }"
          :width="qrSizePx"
          :height="qrSizePx"
        />
      </view>
      <text class="preview-tip">
        {{ bgImage ? '艺术码：整体为底图样式，请用另一台手机扫码验证' : '长按识别或保存到相册' }}
      </text>
      <button
        class="btn-native btn-save"
        :disabled="saving"
        hover-class="btn-hover"
        @tap="onSave"
      >
        {{ saving ? '保存中…' : '保存到相册' }}
      </button>
    </view>
  </view>
</template>

<script>
import {
  drawQrcodeOnCanvas,
  canvasToTempFile,
  QR_CANVAS_SIZE
} from '../../common/qrcode-draw.js'

export default {
  data() {
    return {
      content: '',
      bgImage: '',
      dotOpacity: 0.72,
      dotOpacityPercent: 72,
      showPreview: false,
      generating: false,
      saving: false,
      qrSizePx: QR_CANVAS_SIZE,
      lastText: '',
      lastBgImage: ''
    }
  },
  computed: {
    dotOpacityText() {
      return Math.round(this.dotOpacity * 100) + '%'
    }
  },
  methods: {
    onPaste() {
      uni.getClipboardData({
        success: (res) => {
          const text = (res.data || '').trim()
          if (!text) {
            uni.showToast({ title: '剪贴板为空', icon: 'none' })
            return
          }
          this.content = text
          uni.showToast({ title: '已粘贴', icon: 'success' })
        },
        fail: () => {
          uni.showToast({
            title: 'PC 模拟器请手动长按输入框粘贴',
            icon: 'none',
            duration: 2500
          })
        }
      })
    },
    onChooseBg() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const path = res.tempFilePaths && res.tempFilePaths[0]
          if (path) {
            this.bgImage = path
          }
        }
      })
    },
    onClearBg() {
      this.bgImage = ''
    },
    onOpacityChanging(e) {
      const v = parseInt(e.detail.value, 10)
      if (!isNaN(v)) {
        this.dotOpacityPercent = v
        this.dotOpacity = v / 100
      }
    },
    onOpacityChange(e) {
      const v = parseInt(e.detail.value, 10)
      if (!isNaN(v)) {
        this.dotOpacityPercent = v
        this.dotOpacity = v / 100
      }
      if (this.showPreview && this.lastText) {
        this.redraw()
      }
    },
    getDrawOpts() {
      const bg = this.bgImage || this.lastBgImage
      const opacity = bg ? this.dotOpacity : undefined
      return {
        backgroundImage: bg || undefined,
        dotOpacity: opacity
      }
    },
    redraw() {
      const text = this.lastText || this.content.trim()
      if (!text) {
        return Promise.resolve()
      }
      return drawQrcodeOnCanvas(this, 'qrCanvas', text, this.getDrawOpts())
    },
    onGenerate() {
      if (this.generating) {
        return
      }
      const text = this.content.trim()
      if (!text) {
        uni.showToast({ title: '请先输入内容', icon: 'none' })
        return
      }
      if (text.length > 500) {
        uni.showToast({ title: '内容过长', icon: 'none' })
        return
      }
      this.generating = true
      this.showPreview = true
      this.lastText = text
      this.lastBgImage = this.bgImage
      this.$nextTick(() => {
        drawQrcodeOnCanvas(this, 'qrCanvas', text, this.getDrawOpts())
          .then(() => {
            uni.showToast({
              title: this.bgImage ? '艺术码已生成' : '已生成',
              icon: 'success'
            })
          })
          .catch((err) => {
            console.error('qrcode draw fail', err)
            this.showPreview = false
            uni.showToast({
              title: (err && err.errMsg) || '生成失败',
              icon: 'none'
            })
          })
          .finally(() => {
            this.generating = false
          })
      })
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
                  content: '保存二维码需要访问相册，请在设置中开启',
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
    onSave() {
      if (this.saving || !this.showPreview) {
        return
      }
      this.saving = true
      uni.showLoading({ title: '保存中', mask: true })
      this.redraw()
        .then(() => canvasToTempFile(this, 'qrCanvas'))
        .then((filePath) => {
          return new Promise((resolve, reject) => {
            uni.saveImageToPhotosAlbum({
              filePath,
              success: resolve,
              fail: reject
            })
          })
        })
        .then(() => {
          uni.showToast({ title: '已保存', icon: 'success' })
        })
        .catch((err) => {
          uni.showToast({
            title: (err && err.errMsg) || '保存失败',
            icon: 'none'
          })
        })
        .finally(() => {
          uni.hideLoading()
          this.saving = false
        })
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
  background-color: #e6f4ff;
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

.tone-blue {
  background-color: #1677ff;
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

.label-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.label-row-mt {
  margin-top: 28rpx;
}

.label {
  font-size: 28rpx;
  font-weight: 500;
  color: #141414;
}

.clear-txt {
  font-size: 26rpx;
  color: #8c8c8c;
}

.paste-btn {
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
}

.paste-hover {
  background-color: #e6f4ff;
}

.paste-txt {
  font-size: 26rpx;
  color: #1677ff;
}

.textarea {
  width: 100%;
  height: 160rpx;
  padding: 20rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  color: #141414;
  background-color: #f7f8fa;
  border-radius: 16rpx;
}

.ph {
  color: #bfbfbf;
}

.bg-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.bg-preview-wrap {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.bg-preview {
  width: 100%;
  height: 100%;
}

.bg-placeholder {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160rpx;
  background-color: #f7f8fa;
  border-radius: 12rpx;
  border: 2rpx dashed #d9d9d9;
}

.bg-ph-icon {
  font-size: 48rpx;
  color: #bfbfbf;
  line-height: 1;
}

.bg-ph-txt {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #8c8c8c;
}

.bg-change {
  margin-left: 20rpx;
  padding: 16rpx 28rpx;
  border-radius: 8rpx;
  background-color: #f7f8fa;
}

.bg-change-txt {
  font-size: 26rpx;
  color: #1677ff;
}

.slider-row {
  margin-top: 24rpx;
}

.slider-label {
  display: block;
  font-size: 26rpx;
  color: #333333;
}

.slider {
  margin: 16rpx 0 8rpx;
}

.slider-hint {
  display: block;
  font-size: 22rpx;
  line-height: 32rpx;
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

.btn-primary {
  color: #ffffff;
  background-color: #1677ff;
}

.btn-primary[disabled] {
  color: #ffffff;
  background-color: #91caff;
}

.btn-save {
  color: #ffffff;
  background-color: #1677ff;
}

.btn-hover {
  opacity: 0.85;
}

.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 24rpx;
  padding: 28rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.qr-wrap {
  padding: 12rpx;
  background-color: #ffffff;
  border-radius: 12rpx;
  border: 1rpx solid #f0f0f0;
}

.qr-canvas {
  display: block;
}

.preview-tip {
  margin-top: 20rpx;
  padding: 0 8rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: #8c8c8c;
  text-align: center;
}
</style>
