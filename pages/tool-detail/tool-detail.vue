<template>
  <view class="page">
    <view v-if="tool" class="card">
      <text class="name">{{ tool.name }}</text>
      <text class="desc">{{ tool.desc }}</text>
      <text class="hint">在此页面实现「{{ tool.name }}」具体逻辑</text>
    </view>
    <view v-else class="empty">
      <text>未找到对应工具</text>
    </view>
  </view>
</template>

<script>
import { getToolById } from '../../common/tools.js'

export default {
  data() {
    return {
      tool: null
    }
  },
  onLoad(query) {
    const id = query.id || ''
    this.tool = getToolById(id) || null
    if (this.tool) {
      uni.setNavigationBarTitle({ title: this.tool.name })
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32rpx;
  box-sizing: border-box;
  background-color: #ffffff;
}

.card {
  padding: 32rpx;
  background: #ffffff;
  border-radius: 16rpx;
}

.name {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #111111;
}

.desc {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #666666;
}

.hint {
  display: block;
  margin-top: 32rpx;
  font-size: 26rpx;
  color: #999999;
}

.empty {
  text-align: center;
  color: #999999;
  font-size: 28rpx;
  margin-top: 80rpx;
}
</style>
