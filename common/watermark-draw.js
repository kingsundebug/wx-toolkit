/** 绘制/导出用的画布最长边（px），属性宽高与 style 必须一致 */
export const WM_CANVAS_MAX_EDGE = 750

/** @typedef {'tile' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'} WmLayout */

export const WM_LAYOUT_OPTIONS = [
  { id: 'tile', name: '铺满' },
  { id: 'center', name: '居中' },
  { id: 'top-left', name: '左上' },
  { id: 'top-right', name: '右上' },
  { id: 'bottom-left', name: '左下' },
  { id: 'bottom-right', name: '右下' }
]

/**
 * 等比缩放到最长边不超过 maxEdge（保持原图宽高比）
 * @param {number} imgW
 * @param {number} imgH
 * @param {number} [maxEdge]
 */
export function computeCanvasSize(imgW, imgH, maxEdge = WM_CANVAS_MAX_EDGE) {
  if (!imgW || !imgH) {
    return { width: maxEdge, height: maxEdge }
  }
  const scale = Math.min(1, maxEdge / Math.max(imgW, imgH))
  return {
    width: Math.max(1, Math.round(imgW * scale)),
    height: Math.max(1, Math.round(imgH * scale))
  }
}

/**
 * @param {number} imgW
 * @param {number} imgH
 */
export function getAspectRatio(imgW, imgH) {
  if (!imgH) {
    return 1
  }
  return imgW / imgH
}

/**
 * @param {string} path
 * @returns {Promise<UniApp.GetImageInfoSuccessData>}
 */
export function getImageInfo(path) {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src: path,
      success: resolve,
      fail: () => reject(new Error('无法读取图片'))
    })
  })
}

/**
 * 等待 canvas 节点挂载（微信端 v-if 创建后需额外一帧）
 * @param {number} [ms]
 */
export function waitCanvasReady(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * @param {number} shortEdge 画布短边 px
 */
export function defaultFontSize(shortEdge) {
  return Math.max(12, Math.round(shortEdge / 22))
}

/**
 * @param {object} ctx
 * @param {object} opts
 */
function drawTiledText(ctx, opts) {
  const { text, width, height, opacity, angleDeg, fontSize, gapX, gapY } = opts
  const gray = Math.round(255 * (1 - opacity * 0.5))
  ctx.setFillStyle(`rgba(${gray},${gray},${gray},${opacity})`)
  ctx.setFontSize(fontSize)
  ctx.setTextAlign('left')
  ctx.setTextBaseline('middle')

  const angle = (angleDeg * Math.PI) / 180
  ctx.rotate(angle)

  const span = Math.max(width, height) * 2
  const cols = Math.ceil(span / gapX) + 2
  const rows = Math.ceil(span / gapY) + 2
  for (let row = -rows; row <= rows; row++) {
    for (let col = -cols; col <= cols; col++) {
      ctx.fillText(text, col * gapX, row * gapY)
    }
  }
}

/**
 * @param {object} ctx
 * @param {object} opts
 */
function drawPositionedText(ctx, opts) {
  const { text, width, height, opacity, fontSize, layout } = opts
  const gray = Math.round(255 * (1 - opacity * 0.5))
  ctx.setFillStyle(`rgba(${gray},${gray},${gray},${opacity})`)
  ctx.setFontSize(fontSize)

  const pad = Math.max(12, Math.round(Math.min(width, height) * 0.04))
  let x = width / 2
  let y = height / 2
  let align = 'center'
  let baseline = 'middle'

  switch (layout) {
    case 'top-left':
      x = pad
      y = pad
      align = 'left'
      baseline = 'top'
      break
    case 'top-right':
      x = width - pad
      y = pad
      align = 'right'
      baseline = 'top'
      break
    case 'bottom-left':
      x = pad
      y = height - pad
      align = 'left'
      baseline = 'bottom'
      break
    case 'bottom-right':
      x = width - pad
      y = height - pad
      align = 'right'
      baseline = 'bottom'
      break
    case 'center':
    default:
      x = width / 2
      y = height / 2
      align = 'center'
      baseline = 'middle'
      break
  }

  ctx.setTextAlign(align)
  ctx.setTextBaseline(baseline)
  ctx.fillText(text, x, y)
}

/**
 * @param {object} ctx
 * @param {object} textOpts
 */
function drawWatermarkLayer(ctx, textOpts) {
  if (textOpts.layout === 'tile') {
    drawTiledText(ctx, textOpts)
  } else {
    drawPositionedText(ctx, textOpts)
  }
}

/**
 * @param {object} componentInstance
 * @param {string} canvasId
 * @param {string} imagePath
 * @param {{ text: string, opacity?: number, layout?: WmLayout, angleDeg?: number, fontSize?: number, gapX?: number, gapY?: number }} options
 * @returns {Promise<{ width: number, height: number, aspectRatio: number }>}
 */
export function drawWatermarkedImage(componentInstance, canvasId, imagePath, options) {
  const text = (options.text || '').trim()
  if (!text) {
    return Promise.reject(new Error('请输入水印文字'))
  }

  const layout = options.layout || 'tile'
  const opacity =
    typeof options.opacity === 'number'
      ? Math.min(1, Math.max(0.05, options.opacity))
      : 0.25
  const angleDeg =
    layout === 'tile'
      ? typeof options.angleDeg === 'number'
        ? options.angleDeg
        : -30
      : 0
  const gapX = options.gapX || Math.round(WM_CANVAS_MAX_EDGE / 5)
  const gapY = options.gapY || Math.round(WM_CANVAS_MAX_EDGE / 8)

  return getImageInfo(imagePath).then((info) => {
    const drawPath = info.path || imagePath
    const { width, height } = computeCanvasSize(info.width, info.height)
    const aspectRatio = getAspectRatio(info.width, info.height)
    const fontSize =
      options.fontSize || defaultFontSize(Math.min(width, height))

    const textOpts = {
      text,
      width,
      height,
      opacity,
      angleDeg,
      fontSize,
      gapX,
      gapY,
      layout
    }

    return new Promise((resolve, reject) => {
      try {
        const ctx = uni.createCanvasContext(canvasId, componentInstance)
        ctx.drawImage(drawPath, 0, 0, width, height)
        ctx.draw(false, () => {
          try {
            const ctx2 = uni.createCanvasContext(canvasId, componentInstance)
            drawWatermarkLayer(ctx2, textOpts)
            ctx2.draw(true, () => {
              setTimeout(
                () => resolve({ width, height, aspectRatio }),
                150
              )
            })
          } catch (e) {
            reject(e)
          }
        })
      } catch (e) {
        reject(e)
      }
    })
  })
}

/**
 * @param {object} componentInstance
 * @param {string} canvasId
 * @param {string} imagePath
 * @param {object} options
 * @returns {Promise<{ previewPath: string, width: number, height: number, aspectRatio: number }>}
 */
export function renderWatermarkedPreview(
  componentInstance,
  canvasId,
  imagePath,
  options
) {
  return drawWatermarkedImage(componentInstance, canvasId, imagePath, options).then(
    ({ width, height, aspectRatio }) =>
      waitCanvasReady(80).then(
        () =>
          watermarkCanvasToTempFile(componentInstance, canvasId, width, height).then(
            (previewPath) => ({
              previewPath,
              width,
              height,
              aspectRatio
            })
          )
      )
  )
}

/**
 * @param {object} componentInstance
 * @param {string} canvasId
 * @param {number} width
 * @param {number} height
 * @returns {Promise<string>}
 */
export function watermarkCanvasToTempFile(componentInstance, canvasId, width, height) {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath(
      {
        canvasId,
        x: 0,
        y: 0,
        width,
        height,
        destWidth: width * 2,
        destHeight: height * 2,
        fileType: 'jpg',
        quality: 0.92,
        success: (res) => {
          if (res.tempFilePath) {
            resolve(res.tempFilePath)
            return
          }
          reject(new Error('导出图片失败'))
        },
        fail: (err) => {
          reject(new Error((err && err.errMsg) || '导出图片失败'))
        }
      },
      componentInstance
    )
  })
}
