import { blurImageData } from './video-wm-blur.js'
import { normRectToPixels } from './video-wm-blur.js'

export const VIDEO_MAX_DURATION = 30
export const VIDEO_MAX_SIZE = 20 * 1024 * 1024
export const SAMPLE_FRAME_COUNT = 8
export const BLUR_RADIUS = 12
export const CLIP_PREVIEW_SECONDS = 3
export const DEFAULT_PROCESS_FPS = 24

/**
 * @returns {boolean}
 */
export function isVideoProcessSupported() {
  return (
    typeof wx !== 'undefined' &&
    typeof wx.createVideoDecoder === 'function' &&
    typeof wx.createMediaRecorder === 'function' &&
    typeof wx.createOffscreenCanvas === 'function'
  )
}

/**
 * @param {{ duration?: number, size?: number }} res chooseVideo 返回值
 */
export function validateChosenVideo(res) {
  const duration = res.duration || 0
  const size = res.size || 0
  if (duration > VIDEO_MAX_DURATION) {
    return `视频时长不能超过 ${VIDEO_MAX_DURATION} 秒`
  }
  if (size > VIDEO_MAX_SIZE) {
    return '视频大小不能超过 20MB'
  }
  return ''
}

/**
 * @param {string} path
 */
export function getVideoMeta(path) {
  return new Promise((resolve, reject) => {
    uni.getVideoInfo({
      src: path,
      success: (res) => {
        resolve({
          width: res.width || 720,
          height: res.height || 1280,
          duration: res.duration || 0,
          fps: res.fps || DEFAULT_PROCESS_FPS
        })
      },
      fail: () => reject(new Error('无法读取视频信息'))
    })
  })
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getWx() {
  return typeof wx !== 'undefined' ? wx : null
}

/**
 * @param {import('./video-wm-blur.js').PixelRect} frame
 */
function frameToRGBA(frame) {
  const { width, height, data } = frame
  const buf = new Uint8ClampedArray(data)
  if (buf.byteLength === width * height * 4) {
    return buf
  }
  throw new Error('不支持的视频帧格式，请换一段视频重试')
}

/**
 * @param {ReturnType<typeof getWx>} wxApi
 * @param {object} decoder
 * @param {object} options
 */
function decoderStart(wxApi, decoder, options) {
  return new Promise((resolve, reject) => {
    const onStart = (res) => {
      decoder.off('start', onStart)
      decoder.off('error', onErr)
      resolve(res)
    }
    const onErr = (err) => {
      decoder.off('start', onStart)
      decoder.off('error', onErr)
      reject(err || new Error('视频解码失败'))
    }
    decoder.on('start', onStart)
    decoder.on('error', onErr)
    decoder.start(options)
  })
}

/**
 * @param {object} decoder
 * @param {number} positionMs
 */
function decoderSeek(decoder, positionMs) {
  return new Promise((resolve, reject) => {
    const onSeek = () => {
      decoder.off('seek', onSeek)
      decoder.off('error', onErr)
      resolve()
    }
    const onErr = (err) => {
      decoder.off('seek', onSeek)
      decoder.off('error', onErr)
      reject(err || new Error('视频定位失败'))
    }
    decoder.on('seek', onSeek)
    decoder.on('error', onErr)
    decoder.seek(positionMs)
  })
}

/**
 * @param {object} decoder
 * @param {number} [retries]
 */
async function readFrame(decoder, retries = 40) {
  for (let i = 0; i < retries; i++) {
    const frame = decoder.getFrameData()
    if (frame && frame.data) {
      return frame
    }
    await wait(25)
  }
  return null
}

/**
 * @param {string} videoPath
 * @param {number} [count]
 */
export async function sampleVideoFrames(videoPath, count = SAMPLE_FRAME_COUNT) {
  const wxApi = getWx()
  if (!wxApi) {
    throw new Error('仅支持微信小程序环境')
  }

  const meta = await getVideoMeta(videoPath)
  const decoder = wxApi.createVideoDecoder()
  const durationMs = Math.max(1, meta.duration * 1000)

  try {
    const startRes = await decoderStart(wxApi, decoder, {
      source: videoPath,
      abortAudio: true,
      mode: 1
    })
    const width = startRes.width || meta.width
    const height = startRes.height || meta.height
    const frames = []

    for (let i = 0; i < count; i++) {
      const pos = count === 1 ? 0 : Math.round((durationMs * i) / (count - 1))
      await decoderSeek(decoder, pos)
      await wait(60)
      const frame = await readFrame(decoder)
      if (frame) {
        frames.push({
          width: frame.width || width,
          height: frame.height || height,
          data: frameToRGBA(frame)
        })
      }
    }

    return { frames, width, height, duration: meta.duration, fps: meta.fps }
  } finally {
    try {
      decoder.stop()
    } catch (e) {
      /* ignore */
    }
    try {
      decoder.remove()
    } catch (e) {
      /* ignore */
    }
  }
}

/**
 * 创建 WebGL 纹理绘制器，将 2d OffscreenCanvas 同步到 WebGL 供 MediaRecorder 录制
 * @param {number} width
 * @param {number} height
 */
function createGlBlitter(width, height) {
  const wxApi = getWx()
  const canvas = wxApi.createOffscreenCanvas({ type: 'webgl', width, height })
  const gl = canvas.getContext('webgl')
  if (!gl) {
    throw new Error('无法创建 WebGL 画布')
  }

  const vertexSrc = `
    attribute vec2 aPos;
    attribute vec2 aUv;
    varying vec2 vUv;
    void main() {
      vUv = aUv;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `
  const fragmentSrc = `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uTex;
    void main() {
      gl_FragColor = texture2D(uTex, vUv);
    }
  `

  function compile(type, src) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    return shader
  }

  const program = gl.createProgram()
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSrc))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSrc))
  gl.linkProgram(program)
  gl.useProgram(program)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0]),
    gl.STATIC_DRAW
  )

  const aPos = gl.getAttribLocation(program, 'aPos')
  const aUv = gl.getAttribLocation(program, 'aUv')
  gl.enableVertexAttribArray(aPos)
  gl.enableVertexAttribArray(aUv)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0)
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8)

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  return {
    canvas,
    drawFrom2d(source2d) {
      gl.viewport(0, 0, width, height)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source2d)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
  }
}

/**
 * @param {object} recorder
 */
function recorderStart(recorder) {
  return new Promise((resolve, reject) => {
    const onStart = () => {
      recorder.off('start', onStart)
      recorder.off('error', onErr)
      resolve()
    }
    const onErr = (err) => {
      recorder.off('start', onStart)
      recorder.off('error', onErr)
      reject(err || new Error('视频录制启动失败'))
    }
    recorder.on('start', onStart)
    recorder.on('error', onErr)
    recorder.start()
  })
}

/**
 * @param {object} recorder
 */
function recorderRequestFrame(recorder) {
  if (typeof recorder.requestFrame === 'function') {
    const ret = recorder.requestFrame()
    if (ret && typeof ret.then === 'function') {
      return ret
    }
    return new Promise((resolve) => {
      if (typeof recorder.on === 'function') {
        recorder.on('frame', resolve)
      } else {
        setTimeout(resolve, 0)
      }
    })
  }
  return wait(0)
}

/**
 * @param {object} recorder
 */
function recorderStop(recorder) {
  return new Promise((resolve, reject) => {
    const onStop = (res) => {
      recorder.off('stop', onStop)
      recorder.off('error', onErr)
      resolve(res)
    }
    const onErr = (err) => {
      recorder.off('stop', onStop)
      recorder.off('error', onErr)
      reject(err || new Error('视频导出失败'))
    }
    recorder.on('stop', onStop)
    recorder.on('error', onErr)
    recorder.stop()
  })
}

/**
 * @param {string} videoPath
 * @param {{ x: number, y: number, w: number, h: number }} regionNorm
 * @param {number} [timeSec]
 */
export async function renderFramePreview(videoPath, regionNorm, timeSec = 0) {
  const wxApi = getWx()
  if (!wxApi) {
    throw new Error('仅支持微信小程序环境')
  }

  const meta = await getVideoMeta(videoPath)
  const decoder = wxApi.createVideoDecoder()
  const canvas2d = wxApi.createOffscreenCanvas({
    type: '2d',
    width: meta.width,
    height: meta.height
  })
  const ctx = canvas2d.getContext('2d')

  try {
    await decoderStart(wxApi, decoder, {
      source: videoPath,
      abortAudio: true,
      mode: 1
    })
    await decoderSeek(decoder, Math.round(timeSec * 1000))
    await wait(80)
    const frame = await readFrame(decoder)
    if (!frame) {
      throw new Error('无法读取视频帧')
    }

    const width = frame.width || meta.width
    const height = frame.height || meta.height
    canvas2d.width = width
    canvas2d.height = height

    const rgba = frameToRGBA(frame)
    const imageData = ctx.createImageData(width, height)
    imageData.data.set(rgba)
    blurImageData(imageData, normRectToPixels(regionNorm, width, height), BLUR_RADIUS)
    ctx.putImageData(imageData, 0, 0)

    return new Promise((resolve, reject) => {
      wxApi.canvasToTempFilePath({
        canvas: canvas2d,
        fileType: 'jpg',
        quality: 0.9,
        success: (res) => {
          if (res.tempFilePath) {
            resolve(res.tempFilePath)
            return
          }
          reject(new Error('预览图导出失败'))
        },
        fail: () => reject(new Error('预览图导出失败'))
      })
    })
  } finally {
    try {
      decoder.stop()
    } catch (e) {
      /* ignore */
    }
    try {
      decoder.remove()
    } catch (e) {
      /* ignore */
    }
  }
}

/**
 * @param {string} videoPath
 * @param {{ x: number, y: number, w: number, h: number }} regionNorm
 * @param {{ maxSeconds?: number, onProgress?: (cur: number, total: number) => void, signal?: { cancelled: boolean } }} [options]
 */
export async function exportBlurredVideo(videoPath, regionNorm, options = {}) {
  const wxApi = getWx()
  if (!wxApi) {
    throw new Error('仅支持微信小程序环境')
  }

  const meta = await getVideoMeta(videoPath)
  const maxSeconds = options.maxSeconds != null ? options.maxSeconds : meta.duration
  const processDuration = Math.min(meta.duration, maxSeconds)
  const fps = meta.fps || DEFAULT_PROCESS_FPS
  const maxFrames = Math.max(1, Math.ceil(processDuration * fps))

  const width = meta.width
  const height = meta.height
  const regionPx = normRectToPixels(regionNorm, width, height)

  const canvas2d = wxApi.createOffscreenCanvas({ type: '2d', width, height })
  const ctx = canvas2d.getContext('2d')
  const blitter = createGlBlitter(width, height)

  const recorder = wxApi.createMediaRecorder(blitter.canvas, {
    fps,
    videoBitsPerSecond: 2000,
    gop: fps
  })

  const decoder = wxApi.createVideoDecoder()
  let processed = 0

  try {
    await decoderStart(wxApi, decoder, {
      source: videoPath,
      abortAudio: true,
      mode: 1
    })
    await recorderStart(recorder)

    while (processed < maxFrames) {
      if (options.signal && options.signal.cancelled) {
        throw new Error('已取消')
      }

      const frame = await readFrame(decoder, 80)
      if (!frame) {
        break
      }

      const fw = frame.width || width
      const fh = frame.height || height
      if (fw !== width || fh !== height) {
        canvas2d.width = fw
        canvas2d.height = fh
      }

      const imageData = ctx.createImageData(fw, fh)
      imageData.data.set(frameToRGBA(frame))
      blurImageData(imageData, normRectToPixels(regionNorm, fw, fh), BLUR_RADIUS)
      ctx.putImageData(imageData, 0, 0)
      blitter.drawFrom2d(canvas2d)
      await recorderRequestFrame(recorder)

      processed++
      if (options.onProgress) {
        options.onProgress(processed, maxFrames)
      }
    }

    const res = await recorderStop(recorder)
    if (!res || !res.tempFilePath) {
      throw new Error('视频导出失败')
    }
    return res.tempFilePath
  } finally {
    try {
      decoder.stop()
    } catch (e) {
      /* ignore */
    }
    try {
      decoder.remove()
    } catch (e) {
      /* ignore */
    }
  }
}

/**
 * @param {string} videoPath
 * @param {{ x: number, y: number, w: number, h: number }} regionNorm
 * @param {{ onProgress?: (cur: number, total: number) => void, signal?: { cancelled: boolean } }} [options]
 */
export function exportClipPreview(videoPath, regionNorm, options = {}) {
  return exportBlurredVideo(videoPath, regionNorm, {
    maxSeconds: CLIP_PREVIEW_SECONDS,
    onProgress: options.onProgress,
    signal: options.signal
  })
}

/**
 * @param {{ x: number, y: number, w: number, h: number }} region
 */
export function clampRegion(region) {
  const w = Math.max(0.05, Math.min(0.95, region.w))
  const h = Math.max(0.03, Math.min(0.95, region.h))
  const x = Math.max(0, Math.min(1 - w, region.x))
  const y = Math.max(0, Math.min(1 - h, region.y))
  return { x, y, w, h }
}
