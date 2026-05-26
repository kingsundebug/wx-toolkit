<template>
  <view class="page">
    <view class="head-card">
      <view class="head-icon tone-blue">
        <text class="glyph">码</text>
      </view>
      <view class="head-body">
        <text class="head-title">二维码生成</text>
        <text class="head-desc">输入文字或网址，生成可保存的二维码</text>
      </view>
    </view>

    <view class="panel">
      <text class="label">内容</text>
      <textarea
        v-model="content"
        class="textarea"
        placeholder="输入网址、文字…"
        placeholder-class="ph"
        maxlength="500"
      />
      <view class="btn btn-primary" @click="onGenerate">
        <text>生成二维码</text>
      </view>
    </view>

    <view v-if="showPreview" class="preview">
      <view class="qr-frame">
        <text class="qr-text">QR</text>
      </view>
      <text class="preview-tip">正式版将显示可保存的二维码图片</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      content: '',
      showPreview: false
    }
  },
  onShow() {},
  methods: {
    onGenerate() {
      if (!this.content.trim()) {
        uni.showToast({ title: '请先输入内容', icon: 'none' })
        return
      }
      this.showPreview = true
      uni.showToast({ title: '已生成', icon: 'success' })
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx 32rpx 0;
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
  background-color: #f7f8fa;
  border-radius: 20rpx;
}

.label {
  display: block;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #141414;
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

.ph {
  color: #bfbfbf;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  margin-top: 24rpx;
  border-radius: 44rpx;
}

.btn-primary {
  background-color: #1677ff;
}

.btn-primary text {
  font-size: 30rpx;
  font-weight: 500;
  color: #ffffff;
}

.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 32rpx;
  padding: 32rpx;
  background-color: #f7f8fa;
  border-radius: 20rpx;
}

.qr-frame {
  display: flex;
  width: 320rpx;
  height: 320rpx;
  align-items: center;
  justify-content: center;
  background-color: #f7f8fa;
  border-radius: 16rpx;
  border: 2rpx dashed #d9d9d9;
}

.qr-text {
  font-size: 48rpx;
  font-weight: 700;
  color: #1677ff;
}

.preview-tip {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #8c8c8c;
}
</style>
