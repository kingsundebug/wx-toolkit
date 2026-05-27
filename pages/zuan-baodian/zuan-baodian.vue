<template>
  <view class="page">
    <view class="head-card">
      <view class="head-icon tone-zuan">
        <text class="glyph">怼</text>
      </view>
      <view class="head-body">
        <text class="head-title">怼人宝典</text>
        <text class="head-desc">内置语录随机抽取，仅供娱乐互怼</text>
      </view>
    </view>

    <view class="panel">
      <text class="label">模式</text>
      <view class="chips">
        <view
          v-for="item in modeOptions"
          :key="item.id"
          class="chip"
          :class="{ active: mode === item.id }"
          hover-class="chip-hover"
          @tap="onModeChange(item.id)"
        >
          <text class="chip-txt">{{ item.label }}</text>
        </view>
      </view>

      <button class="btn-native btn-primary" hover-class="btn-hover" @tap="onPick">
        {{ resultCopy ? '换一条' : '随机文案' }}
      </button>
    </view>

    <view v-if="resultCopy" class="result">
      <text class="result-label">文案</text>
      <text class="result-copy" selectable>{{ resultCopy }}</text>
      <view class="result-actions">
        <button
          class="btn-native btn-outline"
          :disabled="!canPrev"
          hover-class="btn-hover"
          @tap="onPrev"
        >
          上一条
        </button>
        <button class="btn-native btn-secondary" hover-class="btn-hover" @tap="onCopy">
          复制文案
        </button>
      </view>
    </view>

    <text class="warn">不管怎么说骂人都是不对的，请不要主动攻击别人。</text>
  </view>
</template>

<script>
import { MODE_LABELS, pickRandomCopy } from '../../common/zuan-baodian/index.js'

function emptyModeState() {
  return {
    resultCopy: '',
    currentIndex: -1,
    history: []
  }
}

export default {
  data() {
    return {
      modeOptions: [
        { id: 'mild', label: MODE_LABELS.mild },
        { id: 'max', label: MODE_LABELS.max }
      ],
      mode: 'mild',
      modeState: {
        mild: emptyModeState(),
        max: emptyModeState()
      }
    }
  },
  computed: {
    activeState() {
      return this.modeState[this.mode]
    },
    resultCopy() {
      return this.activeState.resultCopy
    },
    canPrev() {
      return this.activeState.history.length > 0
    }
  },
  onLoad() {
    this.onPick()
  },
  methods: {
    onModeChange(mode) {
      if (this.mode === mode) {
        return
      }
      this.mode = mode
    },
    onPick() {
      const state = this.modeState[this.mode]
      if (state.resultCopy) {
        state.history.push({
          text: state.resultCopy,
          index: state.currentIndex
        })
      }
      const { text, index } = pickRandomCopy(this.mode, state.currentIndex)
      state.resultCopy = text
      state.currentIndex = index
    },
    onPrev() {
      const state = this.modeState[this.mode]
      if (!state.history.length) {
        uni.showToast({ title: '没有上一条了', icon: 'none' })
        return
      }
      const prev = state.history.pop()
      state.resultCopy = prev.text
      state.currentIndex = prev.index
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
  background-color: #fff1f0;
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

.tone-zuan {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
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

.label {
  display: block;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #141414;
}

.chips {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin: -8rpx -8rpx 20rpx;
}

.chip {
  margin: 8rpx;
  padding: 14rpx 28rpx;
  background-color: #f7f8fa;
  border-radius: 999rpx;
  border: 2rpx solid transparent;
}

.chip.active {
  background-color: #fff1f0;
  border-color: #ff4d4f;
}

.chip-hover {
  opacity: 0.85;
}

.chip-txt {
  font-size: 26rpx;
  color: #595959;
}

.chip.active .chip-txt {
  color: #ff4d4f;
  font-weight: 500;
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
  background-color: #ff4d4f;
}

.btn-secondary {
  color: #ffffff;
  background-color: #1677ff;
}

.btn-outline {
  color: #ff4d4f;
  background-color: #ffffff;
  border: 2rpx solid #ff4d4f;
}

.btn-outline[disabled] {
  color: #ffccc7;
  border-color: #ffccc7;
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
  margin-top: 24rpx;
}

.result-actions .btn-native {
  flex: 1;
  margin-right: 16rpx;
}

.result-actions .btn-native:last-child {
  margin-right: 0;
}

.warn {
  display: block;
  margin-top: 32rpx;
  font-size: 22rpx;
  line-height: 34rpx;
  color: #bfbfbf;
  text-align: center;
}
</style>
