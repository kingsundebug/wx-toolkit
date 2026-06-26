/** 检测时最长边缩放到该值（px）以加速 */
const ANALYSIS_MAX_EDGE = 360

/** 方差低于该阈值的像素视为静态 */
const VARIANCE_THRESHOLD = 80

/** 连通区域最小像素数（缩放后坐标系） */
const MIN_REGION_AREA = 120

/**
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @param {number} [maxEdge]
 */
export function downscaleRGBA(data, width, height, maxEdge = ANALYSIS_MAX_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  const nw = Math.max(1, Math.round(width * scale))
  const nh = Math.max(1, Math.round(height * scale))
  const out = new Uint8ClampedArray(nw * nh * 4)

  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const sx = Math.min(width - 1, Math.round((x / nw) * width))
      const sy = Math.min(height - 1, Math.round((y / nh) * height))
      const si = (sy * width + sx) * 4
      const di = (y * nw + x) * 4
      out[di] = data[si]
      out[di + 1] = data[si + 1]
      out[di + 2] = data[si + 2]
      out[di + 3] = data[si + 3]
    }
  }
  return { data: out, width: nw, height: nh }
}

/**
 * @param {{ x: number, y: number, w: number, h: number }} box
 * @param {number} analysisW
 * @param {number} analysisH
 */
export function mapBoxToNormalized(box, analysisW, analysisH) {
  const w = Math.max(0.02, Math.min(1, box.w / analysisW))
  const h = Math.max(0.02, Math.min(1, box.h / analysisH))
  const x = Math.max(0, Math.min(1 - w, box.x / analysisW))
  const y = Math.max(0, Math.min(1 - h, box.y / analysisH))
  return { x, y, w, h }
}

/**
 * @param {Uint8Array} mask
 * @param {number} sw
 * @param {number} sh
 * @param {{ x0: number, y0: number, x1: number, y1: number }} zone
 */
function boundingBoxInZone(mask, sw, sh, zone) {
  let minX = sw
  let minY = sh
  let maxX = -1
  let maxY = -1

  for (let y = zone.y0; y < zone.y1; y++) {
    for (let x = zone.x0; x < zone.x1; x++) {
      if (mask[y * sw + x]) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return null
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

/**
 * @param {Array<{ data: Uint8ClampedArray, width: number, height: number }>} frames
 * @returns {{ x: number, y: number, w: number, h: number } | null}
 */
export function detectWatermarkRegion(frames) {
  if (!frames || frames.length < 2) {
    return null
  }

  const width = frames[0].width
  const height = frames[0].height
  const first = downscaleRGBA(frames[0].data, width, height)
  const scaledList = frames.map((f) => downscaleRGBA(f.data, width, height).data)
  const sw = first.width
  const sh = first.height
  const pixelCount = sw * sh
  const variance = new Float32Array(pixelCount)

  const lum = scaledList.map((data) => {
    const arr = new Float32Array(pixelCount)
    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4
      arr[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
    }
    return arr
  })

  for (let i = 0; i < pixelCount; i++) {
    let sum = 0
    let sumSq = 0
    for (let f = 0; f < lum.length; f++) {
      const v = lum[f][i]
      sum += v
      sumSq += v * v
    }
    const mean = sum / lum.length
    variance[i] = sumSq / lum.length - mean * mean
  }

  const staticMask = new Uint8Array(pixelCount)
  for (let i = 0; i < pixelCount; i++) {
    staticMask[i] = variance[i] < VARIANCE_THRESHOLD ? 1 : 0
  }

  const cornerZones = [
    { x0: 0, y0: 0, x1: Math.floor(sw * 0.38), y1: Math.floor(sh * 0.25) },
    { x0: Math.floor(sw * 0.62), y0: 0, x1: sw, y1: Math.floor(sh * 0.25) },
    { x0: 0, y0: Math.floor(sh * 0.75), x1: Math.floor(sw * 0.38), y1: sh },
    { x0: Math.floor(sw * 0.62), y0: Math.floor(sh * 0.75), x1: sw, y1: sh },
    { x0: 0, y0: Math.floor(sh * 0.8), x1: sw, y1: sh }
  ]

  let best = null
  let bestArea = 0
  for (const zone of cornerZones) {
    const box = boundingBoxInZone(staticMask, sw, sh, zone)
    if (!box) continue
    const area = box.w * box.h
    if (area >= MIN_REGION_AREA && area > bestArea) {
      bestArea = area
      best = box
    }
  }

  if (!best) {
    return null
  }

  const pad = 6
  const bx = Math.max(0, best.x - pad)
  const by = Math.max(0, best.y - pad)
  const bw = Math.min(sw - bx, best.w + pad * 2)
  const bh = Math.min(sh - by, best.h + pad * 2)

  return mapBoxToNormalized({ x: bx, y: by, w: bw, h: bh }, sw, sh)
}

/** 默认手动选区（右上角常见水印位） */
export function defaultManualRegion() {
  return { x: 0.55, y: 0.02, w: 0.4, h: 0.1 }
}
