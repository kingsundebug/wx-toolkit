export const TEMP_MIN = 16
export const TEMP_MAX = 30
export const TEMP_DEFAULT = 26

export const MODES = [
  { id: 'cool', label: '制冷' },
  { id: 'heat', label: '制热' },
  { id: 'dry', label: '除湿' },
  { id: 'fan', label: '送风' },
  { id: 'auto', label: '自动' }
]

export const FAN_SPEEDS = [
  { id: 'auto', label: '自动' },
  { id: 'low', label: '低' },
  { id: 'mid', label: '中' },
  { id: 'high', label: '高' }
]

/** @param {string} modeId */
export function getModeLabel(modeId) {
  const item = MODES.find((m) => m.id === modeId)
  return item ? item.label : '—'
}

/** @param {string} fanId */
export function getFanLabel(fanId) {
  const item = FAN_SPEEDS.find((f) => f.id === fanId)
  return item ? item.label : '—'
}
