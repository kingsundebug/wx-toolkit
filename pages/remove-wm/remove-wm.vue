<template>
  <view class="page">
    <view class="head-card">
      <view class="head-icon tone-orange">
        <text class="glyph">清</text>
      </view>
      <view class="head-body">
        <text class="head-title">去水印</text>
        <text class="head-desc">粘贴抖音分享链接，解析无水印视频并保存</text>
      </view>
    </view>

    <view class="panel">
      <view class="label-row">
        <text class="label">分享链接</text>
        <view class="paste-btn" hover-class="paste-hover" @tap="onPaste">
          <text class="paste-txt">粘贴</text>
        </view>
      </view>
      <textarea
        v-model="inputText"
        class="textarea"
        placeholder="长按粘贴抖音分享文案或链接"
        placeholder-class="ph"
        maxlength="2000"
        :show-confirm-bar="false"
      />
      <button
        class="btn-native btn-primary"
        :disabled="loading"
        hover-class="btn-hover"
        @tap="onParse"
      >
        {{ loading ? '解析中…' : '开始解析' }}
      </button>
    </view>

    <view v-if="result" class="result">
      <text v-if="result.title" class="result-title">{{ result.title }}</text>
      <text class="result-tip">链接有时效，请尽快保存</text>

      <video
        v-if="primaryVideo"
        id="previewVideo"
        class="preview-video"
        :src="primaryVideo"
        :poster="result.cover"
        :show-center-play-btn="true"
        :enable-play-gesture="true"
        :show-fullscreen-btn="false"
        object-fit="contain"
        @play="onVideoPlay"
        @pause="onVideoPause"
        @ended="onVideoPause"
      />

      <view v-if="primaryVideo" class="video-actions">
        <view class="v-act" hover-class="v-act-hover" @tap="onTogglePlay">
          <text class="v-act-icon">{{ videoPlaying ? '⏸' : '▶' }}</text>
          <text class="v-act-txt">{{ videoPlaying ? '暂停' : '播放' }}</text>
        </view>
        <view class="v-act" hover-class="v-act-hover" @tap="onFullScreen">
          <text class="v-act-icon">⛶</text>
          <text class="v-act-txt">全屏</text>
        </view>
      </view>

      <scroll-view
        v-else-if="result.type === 'gallery' && result.items.length"
        class="gallery"
        scroll-x
      >
        <image
          v-for="(item, index) in result.items"
          :key="index"
          class="gallery-img"
          :src="item.url"
          mode="aspectFill"
        />
      </scroll-view>

      <button
        class="btn-native btn-save"
        :disabled="saving"
        hover-class="btn-hover"
        @tap="onSave"
      >
        {{ saving ? '保存中…' : saveBtnText }}
      </button>
    </view>

    <text class="legal">仅供个人学习使用，请勿用于侵权传播</text>
  </view>
</template>

<script>
import { callParseDouyin, getErrorMessage } from '../../common/cloud.js'

export default {
  data() {
    return {
      inputText: '',
      loading: false,
      saving: false,
      result: null,
      videoPlaying: false,
      videoCtx: null
    }
  },
  computed: {
    primaryVideo() {
      if (!this.result || !this.result.items || !this.result.items.length) {
        return ''
      }
      if (this.result.type === 'video') {
        return this.result.items[0].url
      }
      return ''
    },
    saveBtnText() {
      if (!this.result) {
        return '保存到相册'
      }
      if (this.result.type === 'gallery') {
        return '保存全部图片'
      }
      return '保存到相册'
    }
  },
  watch: {
    primaryVideo(val) {
      if (val) {
        this.$nextTick(() => {
          this.videoCtx = uni.createVideoContext('previewVideo', this)
        })
      } else {
        this.videoCtx = null
        this.videoPlaying = false
      }
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
          this.inputText = text
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
    onParse() {
      if (this.loading) {
        return
      }
      const text = this.inputText.trim()
      if (!text) {
        uni.showToast({ title: '请先粘贴分享链接', icon: 'none' })
        return
      }
      this.loading = true
      this.result = null
      callParseDouyin(text)
        .then((data) => {
          this.result = data
        })
        .catch((err) => {
          console.error('parseDouyin fail', err)
          uni.showToast({
            title: getErrorMessage(err),
            icon: 'none',
            duration: 3000
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    onVideoPlay() {
      this.videoPlaying = true
    },
    onVideoPause() {
      this.videoPlaying = false
    },
    onTogglePlay() {
      if (!this.videoCtx) {
        this.videoCtx = uni.createVideoContext('previewVideo', this)
      }
      if (this.videoPlaying) {
        this.videoCtx.pause()
      } else {
        this.videoCtx.play()
      }
    },
    onFullScreen() {
      if (!this.videoCtx) {
        this.videoCtx = uni.createVideoContext('previewVideo', this)
      }
      this.videoCtx.requestFullScreen({ direction: 0 })
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
                  content: '保存视频或图片需要访问相册，请在设置中开启',
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
    downloadFile(url) {
      return new Promise((resolve, reject) => {
        uni.downloadFile({
          url,
          success: (res) => {
            if (res.statusCode === 200 && res.tempFilePath) {
              resolve(res.tempFilePath)
              return
            }
            reject(new Error('下载失败，请检查 downloadFile 合法域名'))
          },
          fail: () => reject(new Error('下载失败'))
        })
      })
    },
    saveVideo(filePath) {
      return new Promise((resolve, reject) => {
        uni.saveVideoToPhotosAlbum({
          filePath,
          success: resolve,
          fail: reject
        })
      })
    },
    saveImage(filePath) {
      return new Promise((resolve, reject) => {
        uni.saveImageToPhotosAlbum({
          filePath,
          success: resolve,
          fail: reject
        })
      })
    },
    async onSave() {
      if (this.saving || !this.result || !this.result.items || !this.result.items.length) {
        return
      }
      this.saving = true
      uni.showLoading({ title: '保存中', mask: true })
      try {
        await this.ensureAlbumAuth()
        const items = this.result.items
        if (this.result.type === 'gallery') {
          for (let i = 0; i < items.length; i++) {
            const filePath = await this.downloadFile(items[i].url)
            await this.saveImage(filePath)
          }
        } else if (items[0].type === 'video') {
          const filePath = await this.downloadFile(items[0].url)
          await this.saveVideo(filePath)
        } else {
          const filePath = await this.downloadFile(items[0].url)
          await this.saveImage(filePath)
        }
        uni.showToast({ title: '已保存', icon: 'success' })
      } catch (err) {
        uni.showToast({
          title: getErrorMessage(err) || '保存失败',
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
  background-color: #fff2e8;
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

.tone-orange {
  background-color: #ff7a45;
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

.label {
  font-size: 28rpx;
  font-weight: 500;
  color: #141414;
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
  height: 200rpx;
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
  background-color: #ff7a45;
}

.btn-save[disabled] {
  opacity: 0.7;
}

.btn-hover {
  opacity: 0.85;
}

.result {
  margin-top: 24rpx;
  padding: 28rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.result-title {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #141414;
  line-height: 40rpx;
}

.result-tip {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8c8c8c;
}

.preview-video {
  width: 100%;
  height: 400rpx;
  margin-top: 20rpx;
  border-radius: 12rpx;
  background-color: #000000;
}

.video-actions {
  display: flex;
  flex-direction: row;
  margin-top: 20rpx;
}

.v-act {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx 0;
  margin-right: 16rpx;
  background-color: #f7f8fa;
  border-radius: 12rpx;
}

.v-act:last-child {
  margin-right: 0;
}

.v-act-hover {
  background-color: #e6f4ff;
}

.v-act-icon {
  font-size: 36rpx;
  line-height: 1.2;
  color: #1677ff;
}

.v-act-txt {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #595959;
}

.gallery {
  margin-top: 20rpx;
  white-space: nowrap;
}

.gallery-img {
  display: inline-block;
  width: 240rpx;
  height: 240rpx;
  margin-right: 16rpx;
  border-radius: 12rpx;
}

.legal {
  display: block;
  margin-top: 32rpx;
  font-size: 22rpx;
  color: #bfbfbf;
  text-align: center;
}
</style>
