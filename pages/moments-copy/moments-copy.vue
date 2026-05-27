<template>
  <view class="page">
    <view class="head-card">
      <view class="head-icon tone-green">
        <text class="glyph">圈</text>
      </view>
      <view class="head-body">
        <text class="head-title">朋友圈文案</text>
        <text class="head-desc">填写主题与风格，AI 帮你写配文，可一键换一版</text>
      </view>
    </view>

    <view class="panel">
      <view class="field">
        <text class="label">主题 <text class="req">*</text></text>
        <input
          v-model="form.theme"
          class="input"
          placeholder="例如：周末露营、新车提车、健身打卡"
          placeholder-class="ph"
          maxlength="80"
        />
      </view>

      <view class="field">
        <text class="label">内容要点</text>
        <textarea
          v-model="form.content"
          class="textarea"
          placeholder="想提到的事：天气、同行的人、吃了什么、发生了什么…"
          placeholder-class="ph"
          maxlength="500"
          :show-confirm-bar="false"
        />
      </view>

      <view class="field">
        <text class="label">希望情绪</text>
        <view class="chips">
          <view
            v-for="item in moodOptions"
            :key="item"
            class="chip"
            :class="{ active: form.mood === item }"
            hover-class="chip-hover"
            @tap="form.mood = item"
          >
            <text class="chip-txt">{{ item }}</text>
          </view>
        </view>
      </view>

      <view class="field">
        <text class="label">文字风格</text>
        <view class="chips">
          <view
            v-for="item in styleOptions"
            :key="item"
            class="chip"
            :class="{ active: form.style === item }"
            hover-class="chip-hover"
            @tap="form.style = item"
          >
            <text class="chip-txt">{{ item }}</text>
          </view>
        </view>
      </view>

      <view class="field">
        <text class="label">补充要求</text>
        <textarea
          v-model="form.extra"
          class="textarea textarea-sm"
          placeholder="可选：字数、要不要 emoji、避免某些词…"
          placeholder-class="ph"
          maxlength="200"
          :show-confirm-bar="false"
        />
      </view>

      <button
        class="btn-native btn-primary"
        :disabled="loading"
        hover-class="btn-hover"
        @tap="onGenerate(false)"
      >
        {{ loading ? '生成中…' : '生成文案' }}
      </button>
    </view>

    <view v-if="resultCopy" class="result">
      <text class="result-label">生成结果</text>
      <text class="result-copy" selectable>{{ resultCopy }}</text>
      <view class="result-actions">
        <button
          class="btn-native btn-outline"
          :disabled="loading"
          hover-class="btn-hover"
          @tap="onGenerate(true)"
        >
          {{ loading ? '生成中…' : '换一版' }}
        </button>
        <button class="btn-native btn-secondary" hover-class="btn-hover" @tap="onCopy">
          复制文案
        </button>
      </view>
    </view>

    <text class="legal">文案由 AI 生成，发布前请自行核对</text>
  </view>
</template>

<script>
import { callGenerateMomentsCopy, getErrorMessage } from '../../common/cloud.js'

const MOOD_OPTIONS = ['开心', '治愈', '感慨', '励志', '佛系', '吐槽']
const STYLE_OPTIONS = ['日常', '文艺', '幽默', '专业', '小红书']

export default {
  data() {
    return {
      moodOptions: MOOD_OPTIONS,
      styleOptions: STYLE_OPTIONS,
      form: {
        theme: '',
        content: '',
        mood: '开心',
        style: '日常',
        extra: ''
      },
      loading: false,
      resultCopy: ''
    }
  },
  methods: {
    buildPayload(regenerate) {
      return {
        theme: this.form.theme.trim(),
        content: this.form.content.trim(),
        mood: this.form.mood,
        style: this.form.style,
        extra: this.form.extra.trim(),
        regenerate: Boolean(regenerate),
        previousCopy: regenerate ? this.resultCopy : ''
      }
    },
    onGenerate(regenerate) {
      if (this.loading) {
        return
      }
      const theme = this.form.theme.trim()
      if (!theme) {
        uni.showToast({ title: '请先填写主题', icon: 'none' })
        return
      }
      this.loading = true
      callGenerateMomentsCopy(this.buildPayload(regenerate))
        .then((data) => {
          this.resultCopy = data.copy
        })
        .catch((err) => {
          console.error('generateMomentsCopy fail', err)
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
    onCopy() {
      if (!this.resultCopy) {
        return
      }
      uni.setClipboardData({
        data: this.resultCopy,
        success: () => {
          uni.showToast({ title: '已复制', icon: 'success' })
        },
        fail: () => {
          uni.showToast({ title: '复制失败', icon: 'none' })
        }
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
  background-color: #f6ffed;
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

.tone-green {
  background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
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

.field {
  margin-bottom: 28rpx;
}

.field:last-of-type {
  margin-bottom: 0;
}

.label {
  display: block;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #141414;
}

.req {
  color: #ff4d4f;
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

.textarea {
  width: 100%;
  height: 180rpx;
  padding: 20rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  color: #141414;
  background-color: #f7f8fa;
  border-radius: 16rpx;
}

.textarea-sm {
  height: 120rpx;
}

.ph {
  color: #bfbfbf;
}

.chips {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin: -8rpx;
}

.chip {
  margin: 8rpx;
  padding: 14rpx 28rpx;
  background-color: #f7f8fa;
  border-radius: 999rpx;
  border: 2rpx solid transparent;
}

.chip.active {
  background-color: #e6f4ff;
  border-color: #1677ff;
}

.chip-hover {
  opacity: 0.85;
}

.chip-txt {
  font-size: 26rpx;
  color: #595959;
}

.chip.active .chip-txt {
  color: #1677ff;
  font-weight: 500;
}

.btn-native {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88rpx;
  margin-top: 28rpx;
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

.btn-secondary {
  color: #ffffff;
  background-color: #52c41a;
}

.btn-outline {
  color: #1677ff;
  background-color: #ffffff;
  border: 2rpx solid #1677ff;
}

.btn-outline[disabled] {
  color: #91caff;
  border-color: #91caff;
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

.result-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #141414;
}

.result-copy {
  display: block;
  margin-top: 20rpx;
  font-size: 28rpx;
  line-height: 44rpx;
  color: #262626;
  white-space: pre-wrap;
}

.result-actions {
  display: flex;
  flex-direction: row;
  margin-top: 8rpx;
}

.result-actions .btn-native {
  flex: 1;
  margin-top: 0;
  margin-right: 16rpx;
}

.result-actions .btn-native:last-child {
  margin-right: 0;
}

.legal {
  display: block;
  margin-top: 32rpx;
  font-size: 22rpx;
  color: #bfbfbf;
  text-align: center;
}
</style>
