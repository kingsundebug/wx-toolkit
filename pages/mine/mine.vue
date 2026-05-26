<template>
  <view class="page">
    <view class="user-card">
      <view class="avatar tone-blue">
        <text class="avatar-text">袋</text>
      </view>
      <text class="name">哆啦口袋</text>
      <text class="sub">工具箱 · 随用随取</text>
    </view>

    <view class="menu">
      <view class="menu-row">
        <text class="menu-text">关于我们</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-row menu-row-last">
        <text class="menu-text">意见反馈</text>
        <text class="arrow">›</text>
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

.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
  background-color: #f7f8fa;
  border-radius: 20rpx;
}

.avatar {
  display: flex;
  width: 120rpx;
  height: 120rpx;
  align-items: center;
  justify-content: center;
  border-radius: 60rpx;
}

.tone-blue {
  background-color: #1677ff;
}

.avatar-text {
  font-size: 48rpx;
  font-weight: 600;
  color: #ffffff;
}

.name {
  margin-top: 24rpx;
  font-size: 36rpx;
  font-weight: 600;
  color: #141414;
}

.sub {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #8c8c8c;
}

.menu {
  margin-top: 24rpx;
  background-color: #f7f8fa;
  border-radius: 20rpx;
  overflow: hidden;
}

.menu-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 28rpx;
  border-bottom: 1rpx solid #eeeeee;
}

.menu-row-last {
  border-bottom-width: 0;
}

.menu-text {
  font-size: 30rpx;
  color: #141414;
}

.arrow {
  font-size: 32rpx;
  color: #bfbfbf;
}
</style>
