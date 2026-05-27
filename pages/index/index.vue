<template>
  <view class="page">
    <view class="section">
      <view class="section-head">
        <view class="section-bar" />
        <text class="section-title">推荐</text>
      </view>
      <view class="section-card featured-card">
          <view
            v-for="item in featuredList"
            :key="item.id"
            class="featured-item"
            @click="onOpenTool(item)"
          >
            <view class="icon-lg" :class="item.gradient">
            <text class="icon-text">{{ item.glyph }}</text>
          </view>
          <text class="item-name">{{ item.name }}</text>
          <text class="item-sub">{{ item.subtitle }}</text>
        </view>
      </view>
    </view>

    <view v-for="cat in categoryList" :key="cat.id" class="section">
      <view class="section-head">
        <view class="section-bar" />
        <text class="section-title">{{ cat.name }}</text>
      </view>
      <view class="section-card">
        <view class="tool-grid">
          <view
            v-for="item in cat.tools"
            :key="item.id"
            class="tool-cell"
            @click="onOpenTool(item)"
          >
            <view class="icon-md" :class="item.gradient">
              <text class="icon-text">{{ item.glyph }}</text>
            </view>
            <text class="tool-name">{{ item.name }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getCategoriesWithTools, getFeaturedTools, openTool } from '../../common/tools.js'

export default {
  data() {
    return {
      featuredList: getFeaturedTools(),
      categoryList: getCategoriesWithTools()
    }
  },
  methods: {
    onOpenTool(item) {
      openTool(item)
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 20rpx 24rpx 24rpx;
  box-sizing: border-box;
  background-color: #f7f8fa;
}

.section {
  margin-bottom: 24rpx;
}

.section-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16rpx;
  padding-left: 8rpx;
}

.section-bar {
  width: 8rpx;
  height: 28rpx;
  margin-right: 12rpx;
  border-radius: 4rpx;
  background-color: #1677ff;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.section-card {
  padding: 28rpx 16rpx 12rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.featured-card {
  display: flex;
  flex-direction: row;
  padding: 32rpx 20rpx 36rpx;
}

.featured-item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.icon-lg {
  display: flex;
  width: 112rpx;
  height: 112rpx;
  align-items: center;
  justify-content: center;
  border-radius: 28rpx;
}

.icon-md {
  display: flex;
  width: 96rpx;
  height: 96rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
}

.icon-text {
  font-size: 44rpx;
  font-weight: 600;
  color: #ffffff;
}

.icon-md .icon-text {
  font-size: 38rpx;
}

.item-name {
  margin-top: 20rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
}

.item-sub {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999999;
  text-align: center;
}

.tool-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.tool-cell {
  display: flex;
  width: 25%;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28rpx;
}

.tool-name {
  margin-top: 12rpx;
  max-width: 100%;
  padding: 0 6rpx;
  font-size: 24rpx;
  color: #333333;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grad-blue-purple {
  background: linear-gradient(135deg, #6b8cff 0%, #a855f7 100%);
}

.grad-pink-red {
  background: linear-gradient(135deg, #ff8fb1 0%, #ff6b6b 100%);
}

.grad-cyan-blue {
  background: linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%);
}

.grad-green-teal {
  background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
}

.grad-orange-yellow {
  background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
}

.grad-purple-pink {
  background: linear-gradient(135deg, #c471ed 0%, #f64f59 100%);
}

.grad-pink-light {
  background: linear-gradient(135deg, #ffcbd5 0%, #ffe4c9 100%);
}
</style>
