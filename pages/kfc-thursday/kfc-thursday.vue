<template>
  <view class="page">
    <view class="head-card">
      <view class="head-icon tone-kfc">
        <text class="glyph">肯</text>
      </view>
      <view class="head-body">
        <text class="head-title">疯狂星期四</text>
        <text class="head-desc">内置 {{ copyCount }} 条疯四梗文案，随机抽取，一键复制</text>
      </view>
    </view>

    <view v-if="isThursday" class="badge-row">
      <text class="badge">今天是星期四，发梗正当时</text>
    </view>

    <view class="panel">
      <button class="btn-native btn-primary" hover-class="btn-hover" @tap="onPick">
        {{ resultCopy ? '换一条' : '随机文案' }}
      </button>
    </view>

    <view v-if="resultCopy" class="result">
      <text class="result-label">文案</text>
      <text class="result-copy" selectable>{{ resultCopy }}</text>
      <button class="btn-native btn-secondary" hover-class="btn-hover" @tap="onCopy">
        复制文案
      </button>
    </view>

  </view>
</template>

<script>
import { getCopyCount, isThursdayToday, pickRandomCopy } from '../../common/kfc-thursday/index.js'

export default {
  data() {
    return {
      copyCount: getCopyCount(),
      isThursday: isThursdayToday(),
      resultCopy: '',
      currentIndex: -1
    }
  },
  onLoad() {
    this.onPick()
  },
  methods: {
    onPick() {
      const { text, index } = pickRandomCopy(this.currentIndex)
      this.resultCopy = text
      this.currentIndex = index
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
  background-color: #fff7e6;
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

.tone-kfc {
  background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
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

.badge-row {
  margin-top: 20rpx;
}

.badge {
  display: inline-block;
  padding: 10rpx 24rpx;
  font-size: 24rpx;
  color: #d4380d;
  background-color: #fff2e8;
  border-radius: 999rpx;
}

.panel {
  margin-top: 24rpx;
  padding: 28rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.btn-native {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88rpx;
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
  background-color: #fa8c16;
}

.btn-secondary {
  margin-top: 24rpx;
  color: #ffffff;
  background-color: #1677ff;
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

</style>
