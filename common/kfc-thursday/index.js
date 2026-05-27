import copies from './copies.json'

/**
 * @param {number} [excludeIndex] 换一条时尽量不与当前重复
 * @returns {{ text: string, index: number }}
 */
export function pickRandomCopy(excludeIndex) {
  const list = copies
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

/** @returns {boolean} */
export function isThursdayToday() {
  return new Date().getDay() === 4
}

export function getCopyCount() {
  return copies.length
}

export { copies }
