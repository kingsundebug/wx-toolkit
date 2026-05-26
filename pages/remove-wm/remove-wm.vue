<template>
  <view class="page">
    <view class="head-card">
      <view class="head-icon tone-orange">
        <text class="glyph">清</text>
      </view>
      <view class="head-body">
        <text class="head-title">去水印</text>
        <text class="head-desc">粘贴短视频 / 图集分享链接，解析保存</text>
      </view>
    </view>

    <view class="panel">
      <text class="label">分享链接</text>
      <textarea class="textarea" placeholder="长按粘贴链接到这里" placeholder-class="ph" disabled />
      <view class="btn btn-disabled">
        <text>开始解析</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {}
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

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  margin-top: 24rpx;
  border-radius: 44rpx;
}

.btn-disabled {
  background-color: #e8e8e8;
}

.btn-disabled text {
  font-size: 30rpx;
  color: #8c8c8c;
}
</style>
