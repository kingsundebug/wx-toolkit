import copies from './copies.json'

/** @typedef {'mild' | 'max'} ZuanMode */

const MODE_LABELS = {
  mild: '口吐莲花',
  max: '火力全开'
}

/**
 * @param {ZuanMode} mode
 * @param {number} [excludeIndex]
 * @returns {{ text: string, index: number }}
 */
export function pickRandomCopy(mode, excludeIndex) {
  const list = copies[mode] || []
  const total = list.length
  if (!total) {
    return { text: '文案库为空', index: -1 }
  }
  if (total === 1) {
    return { text: list[0], index: 0 }
  }
  let index = Math.floor(Math.random() * total)
  if (typeof excludeIndex === 'number' && excludeIndex >= 0 && total > 1) {
    let guard = 0
    while (index === excludeIndex && guard < 8) {
      index = Math.floor(Math.random() * total)
      guard += 1
    }
  }
  return { text: list[index], index }
}

export function getModeLabel(mode) {
  return MODE_LABELS[mode] || ''
}

export { MODE_LABELS }
