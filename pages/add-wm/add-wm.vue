<template>
  <view class="page">
    <view class="head-card">
      <view class="head-icon tone-cyan">
        <text class="glyph">加</text>
      </view>
      <view class="head-body">
        <text class="head-title">加水印</text>
        <text class="head-desc">保持原图比例，可选位置或铺满</text>
      </view>
    </view>

    <view class="panel">
      <view v-if="imagePath" class="thumb-wrap">
        <image
          class="thumb"
          :src="imagePath"
          mode="widthFix"
          @load="onThumbLoad"
          @error="onImageLoadError('原图')"
        />
        <view class="thumb-change" hover-class="thumb-change-hover" @tap="onChooseImage">
          <text class="thumb-change-txt">换一张</text>
        </view>
      </view>
      <button
        v-else
        class="btn-native btn-outline"
        hover-class="btn-hover"
        @tap="onChooseImage"
      >
        选择图片
      </button>

      <text class="label">水印文字</text>
      <input
        v-model="wmText"
        class="input"
        placeholder="例如：仅供预览"
        placeholder-class="ph"
        maxlength="32"
        @input="resetPreview"
      />

      <text class="label layout-label">水印位置</text>
      <view class="layout-grid">
        <view
          v-for="item in layoutOptions"
          :key="item.id"
          class="layout-chip"
          :class="{ 'layout-chip-active': wmLayout === item.id }"
          hover-class="layout-chip-hover"
          @tap="onLayoutPick(item.id)"
        >
          <text class="layout-chip-txt">{{ item.name }}</text>
        </view>
      </view>

      <view class="slider-row">
        <text class="label-inline">透明度 {{ opacityPercent }}%</text>
        <slider
          class="slider"
          :value="opacityPercent"
          min="10"
          max="50"
          step="5"
          activeColor="#1677ff"
          backgroundColor="#e8e8e8"
          block-size="20"
          @changing="onOpacityChanging"
          @change="onOpacityChange"
        />
      </view>

      <button
        class="btn-native btn-primary"
        :disabled="generating || !imagePath"
        hover-class="btn-hover"
        @tap="onGenerate"
      >
        {{ generating ? '生成中…' : '生成预览' }}
      </button>
    </view>

    <view v-if="previewPath" class="preview">
      <text class="preview-title">效果预览</text>
      <view class="preview-box">
        <image
          class="preview-img"
          :src="previewPath"
          mode="widthFix"
          @tap="onPreviewImage"
          @load="onPreviewLoad"
          @error="onImageLoadError('预览')"
        />
      </view>
      <text class="preview-tip">点击图片可全屏查看，保存效果与预览一致</text>
      <button
        class="btn-native btn-save"
        :disabled="saving"
        hover-class="btn-hover"
        @tap="onSave"
      >
        {{ saving ? '保存中…' : '保存到相册' }}
      </button>
    </view>

    <!-- 画布须保持「可绘制」状态：勿 opacity:0 / display:none，仅移出视口 -->
    <view
      v-show="canvasReady"
      class="wm-canvas-slot"
      :style="{ width: canvasW + 'px', height: canvasH + 'px' }"
    >
      <canvas
        canvas-id="wmCanvas"
        class="wm-canvas"
        :style="{ width: canvasW + 'px', height: canvasH + 'px' }"
        :width="canvasW"
        :height="canvasH"
      />
    </view>
  </view>
</template>

<script>
import {
  WM_LAYOUT_OPTIONS,
  computeCanvasSize,
  getImageInfo,
  renderWatermarkedPreview,
  waitCanvasReady
} from '../../common/watermark-draw.js'

export default {
  data() {
    return {
      imagePath: '',
      wmText: '仅供预览',
      wmLayout: 'tile',
      layoutOptions: WM_LAYOUT_OPTIONS,
      opacityPercent: 25,
      generating: false,
      saving: false,
      previewPath: '',
      canvasReady: false,
      canvasW: 1,
      canvasH: 1
    }
  },
  computed: {
    opacityValue() {
      return this.opacityPercent / 100
    }
  },
  methods: {
    resetPreview() {
      this.previewPath = ''
    },
    onImageLoadError(which) {
      uni.showToast({
        title: which + '加载失败，请换一张图重试',
        icon: 'none'
      })
    },
    onThumbLoad() {},
    onPreviewLoad() {},
    onLayoutPick(id) {
      this.wmLayout = id
      this.resetPreview()
    },
    onChooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album'],
        success: async (res) => {
          const path = res.tempFilePaths && res.tempFilePaths[0]
          if (!path) {
            return
          }
          try {
            const info = await getImageInfo(path)
            this.imagePath = info.path || path
            const { width, height } = computeCanvasSize(info.width, info.height)
            this.canvasW = width
            this.canvasH = height
            this.canvasReady = true
            this.resetPreview()
          } catch (e) {
            uni.showToast({ title: '无法读取图片', icon: 'none' })
          }
        }
      })
    },
    onOpacityChanging(e) {
      this.opacityPercent = e.detail.value
      this.resetPreview()
    },
    onOpacityChange(e) {
      this.opacityPercent = e.detail.value
      this.resetPreview()
    },
    buildDrawOptions() {
      return {
        text: this.wmText,
        opacity: this.opacityValue,
        layout: this.wmLayout
      }
    },
    async onGenerate() {
      if (this.generating) {
        return
      }
      if (!this.imagePath) {
        uni.showToast({ title: '请先选择图片', icon: 'none' })
        return
      }
      const text = this.wmText.trim()
      if (!text) {
        uni.showToast({ title: '请输入水印文字', icon: 'none' })
        return
      }
      this.generating = true
      this.resetPreview()
      uni.showLoading({ title: '生成中', mask: true })
      try {
        const info = await getImageInfo(this.imagePath)
        const { width, height } = computeCanvasSize(info.width, info.height)
        this.canvasW = width
        this.canvasH = height
        this.canvasReady = true
        await new Promise((resolve) => this.$nextTick(resolve))
        await waitCanvasReady(250)
        const result = await renderWatermarkedPreview(
          this,
          'wmCanvas',
          this.imagePath,
          this.buildDrawOptions()
        )
        this.previewPath = result.previewPath
        uni.showToast({ title: '已生成', icon: 'success' })
      } catch (err) {
        console.error('watermark draw fail', err)
        uni.showToast({
          title: (err && err.message) || '生成失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
        this.generating = false
      }
    },
    onPreviewImage() {
      if (!this.previewPath) {
        return
      }
      uni.previewImage({
        urls: [this.previewPath],
        current: this.previewPath
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
                  content: '保存图片需要访问相册，请在设置中开启',
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
      if (this.saving) {
        return
      }
      if (!this.previewPath) {
        uni.showToast({ title: '请先生成预览', icon: 'none' })
        return
      }
      this.saving = true
      uni.showLoading({ title: '保存中', mask: true })
      try {
        await this.ensureAlbumAuth()
        await new Promise((resolve, reject) => {
          uni.saveImageToPhotosAlbum({
            filePath: this.previewPath,
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
  background-color: #e6fffb;
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

.tone-cyan {
  background-color: #13c2c2;
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

.thumb-wrap {
  position: relative;
  width: 100%;
  margin-bottom: 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background-color: #f7f8fa;
}

.thumb {
  display: block;
  width: 100%;
  max-height: 480rpx;
}

.thumb-change {
  position: absolute;
  right: 16rpx;
  bottom: 16rpx;
  padding: 12rpx 20rpx;
  background-color: rgba(0, 0, 0, 0.45);
  border-radius: 8rpx;
}

.thumb-change-hover {
  opacity: 0.85;
}

.thumb-change-txt {
  font-size: 24rpx;
  color: #ffffff;
}

.label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #141414;
}

.layout-label {
  margin-top: 24rpx;
}

.layout-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin: -8rpx;
}

.layout-chip {
  margin: 8rpx;
  padding: 14rpx 24rpx;
  background-color: #f7f8fa;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
}

.layout-chip-active {
  background-color: #e6fffb;
  border-color: #13c2c2;
}

.layout-chip-hover {
  opacity: 0.85;
}

.layout-chip-txt {
  font-size: 26rpx;
  color: #141414;
}

.layout-chip-active .layout-chip-txt {
  color: #13c2c2;
  font-weight: 500;
}

.label-inline {
  display: block;
  margin-bottom: 8rpx;
  font-size: 26rpx;
  color: #595959;
}

.input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  color: #141414;
  background-color: #f7f8fa;
  border-radius: 16rpx;
}

.ph {
  color: #bfbfbf;
}

.slider-row {
  margin-top: 24rpx;
}

.slider {
  margin: 0;
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
  color: #13c2c2;
  background-color: #e6fffb;
  border: 2rpx solid #87e8de;
}

.btn-primary {
  color: #ffffff;
  background-color: #13c2c2;
}

.btn-primary[disabled] {
  color: #ffffff;
  background-color: #87e8de;
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
  align-items: stretch;
  width: 100%;
  margin-top: 24rpx;
  padding: 28rpx;
  box-sizing: border-box;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.preview-title {
  margin-bottom: 16rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #141414;
}

.preview-box {
  width: 100%;
  min-height: 120rpx;
  background-color: #f7f8fa;
  border-radius: 12rpx;
  overflow: hidden;
}

.preview-img {
  display: block;
  width: 100%;
  max-height: 80vh;
}

.preview-tip {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #8c8c8c;
  text-align: center;
}

.wm-canvas-slot {
  position: fixed;
  left: -10000px;
  top: 0;
  overflow: hidden;
  z-index: -1;
}

.wm-canvas {
  display: block;
}
</style>
