const UQRCode = require('./vendor/uqrcode.js')

/** 画布边长（px），与页面 canvas 样式宽高一致 */
export const QR_CANVAS_SIZE = 280

/**
 * 微信小程序 canvas 绘制图片前解析本地路径
 * @param {string} src
 * @returns {Promise<string>}
 */
function loadImageForMp(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('图片路径为空'))
      return
    }
    uni.getImageInfo({
      src,
      success: (res) => resolve(res.path || src),
      fail: reject
    })
  })
}

/**
 * @param {string} text
 * @param {{ backgroundImage?: string, dotOpacity?: number }} options
 */
function createQrInstance(text, options) {
  const bg = options && options.backgroundImage
  const dotOpacity =
    options && options.dotOpacity != null ? options.dotOpacity : 0.72

  const qr = new UQRCode()
  qr.data = text
  qr.size = QR_CANVAS_SIZE
  qr.useDynamicSize = true
  qr.loadImage = loadImageForMp

  if (bg) {
    qr.margin = 18
    qr.backgroundPadding = 0.14
    qr.foregroundPadding = 0.06
    qr.errorCorrectLevel = UQRCode.errorCorrectLevel.H
    qr.backgroundImageSrc = bg
    qr.backgroundImageAlpha = 1
    qr.backgroundImageBorderRadius = 8
    qr.areaColor = '#ffffff'
    qr.backgroundColor = 'rgba(255,255,255,0)'
    qr.foregroundColor = `rgba(20,20,20,${dotOpacity})`
    qr.positionProbeBackgroundColor = 'rgba(255,255,255,0.92)'
    qr.positionProbeForegroundColor = `rgba(15,15,15,${Math.min(1, dotOpacity + 0.15)})`
    qr.separatorColor = 'rgba(255,255,255,0.6)'
  } else {
    qr.margin = 12
    qr.backgroundColor = '#ffffff'
    qr.foregroundColor = '#000000'
    qr.errorCorrectLevel = UQRCode.errorCorrectLevel.M
  }

  qr.make()
  return qr
}

/**
 * @param {object} componentInstance
 * @param {string} canvasId
 * @param {string} text
 * @param {{ backgroundImage?: string, dotOpacity?: number }} [options]
 * @returns {Promise<void>}
 */
export function drawQrcodeOnCanvas(componentInstance, canvasId, text, options) {
  const qr = createQrInstance(text, options || {})
  const ctx = uni.createCanvasContext(canvasId, componentInstance)
  qr.canvasContext = ctx
  return qr.drawCanvas()
}

/**
 * @param {object} componentInstance
 * @param {string} canvasId
 * @returns {Promise<string>}
 */
export function canvasToTempFile(componentInstance, canvasId) {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath(
      {
        canvasId,
        width: QR_CANVAS_SIZE,
        height: QR_CANVAS_SIZE,
        destWidth: QR_CANVAS_SIZE * 2,
        destHeight: QR_CANVAS_SIZE * 2,
        fileType: 'png',
        success: (res) => {
          if (res.tempFilePath) {
            resolve(res.tempFilePath)
            return
          }
          reject(new Error('导出图片失败'))
        },
        fail: () => reject(new Error('导出图片失败'))
      },
      componentInstance
    )
  })
}
