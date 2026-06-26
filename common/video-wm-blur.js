/** @typedef {{ x: number, y: number, w: number, h: number }} PixelRect */

/**
 * 归一化选区 (0~1) 转为像素矩形（整数、边界裁剪）
 * @param {{ x: number, y: number, w: number, h: number }} norm
 * @param {number} width
 * @param {number} height
 * @returns {PixelRect}
 */
export function normRectToPixels(norm, width, height) {
  const x = Math.max(0, Math.min(width - 1, Math.round(norm.x * width)))
  const y = Math.max(0, Math.min(height - 1, Math.round(norm.y * height)))
  const w = Math.max(1, Math.min(width - x, Math.round(norm.w * width)))
  const h = Math.max(1, Math.min(height - y, Math.round(norm.h * height)))
  return { x, y, w, h }
}

/**
 * 对 RGBA ImageData 指定区域做水平+垂直 box blur
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @param {PixelRect} rect
 * @param {number} radius
 */
export function boxBlurRegion(data, width, height, rect, radius) {
  const r = Math.max(1, Math.round(radius))
  const x0 = Math.max(0, rect.x)
  const y0 = Math.max(0, rect.y)
  const x1 = Math.min(width, rect.x + rect.w)
  const y1 = Math.min(height, rect.y + rect.h)
  if (x1 <= x0 || y1 <= y0) {
    return
  }

  const rw = x1 - x0
  const rh = y1 - y0
  const region = new Uint8ClampedArray(rw * rh * 4)

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const si = (y * width + x) * 4
      const di = ((y - y0) * rw + (x - x0)) * 4
      region[di] = data[si]
      region[di + 1] = data[si + 1]
      region[di + 2] = data[si + 2]
      region[di + 3] = data[si + 3]
    }
  }

  boxBlurPass(region, rw, rh, r, true)
  boxBlurPass(region, rw, rh, r, false)

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const si = ((y - y0) * rw + (x - x0)) * 4
      const di = (y * width + x) * 4
      data[di] = region[si]
      data[di + 1] = region[si + 1]
      data[di + 2] = region[si + 2]
      data[di + 3] = region[si + 3]
    }
  }
}

/**
 * @param {Uint8ClampedArray} buf
 * @param {number} w
 * @param {number} h
 * @param {number} radius
 * @param {boolean} horizontal
 */
function boxBlurPass(buf, w, h, radius, horizontal) {
  const tmp = new Uint8ClampedArray(buf.length)
  const size = radius * 2 + 1

  if (horizontal) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let rSum = 0
        let gSum = 0
        let bSum = 0
        let aSum = 0
        let count = 0
        for (let k = -radius; k <= radius; k++) {
          const cx = Math.min(w - 1, Math.max(0, x + k))
          const i = (y * w + cx) * 4
          rSum += buf[i]
          gSum += buf[i + 1]
          bSum += buf[i + 2]
          aSum += buf[i + 3]
          count++
        }
        const o = (y * w + x) * 4
        tmp[o] = Math.round(rSum / count)
        tmp[o + 1] = Math.round(gSum / count)
        tmp[o + 2] = Math.round(bSum / count)
        tmp[o + 3] = Math.round(aSum / count)
      }
    }
  } else {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let rSum = 0
        let gSum = 0
        let bSum = 0
        let aSum = 0
        let count = 0
        for (let k = -radius; k <= radius; k++) {
          const cy = Math.min(h - 1, Math.max(0, y + k))
          const i = (cy * w + x) * 4
          rSum += buf[i]
          gSum += buf[i + 1]
          bSum += buf[i + 2]
          aSum += buf[i + 3]
          count++
        }
        const o = (y * w + x) * 4
        tmp[o] = Math.round(rSum / count)
        tmp[o + 1] = Math.round(gSum / count)
        tmp[o + 2] = Math.round(bSum / count)
        tmp[o + 3] = Math.round(aSum / count)
      }
    }
  }

  buf.set(tmp)
}

/**
 * @param {ImageData} imageData
 * @param {PixelRect} rect
 * @param {number} [radius]
 */
export function blurImageData(imageData, rect, radius = 12) {
  boxBlurRegion(imageData.data, imageData.width, imageData.height, rect, radius)
}
