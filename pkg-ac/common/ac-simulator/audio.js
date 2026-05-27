/**
 * 音效参考 air.shadiao.pro；资源放在项目根 static/（uni-app 仅保证根 static 会打进包）
 */
const BASE = '/static/ac-simulator/'

const FAN_VOLUME = {
  auto: 0.5,
  low: 0.35,
  mid: 0.5,
  high: 0.68
}

const AC_WORK_DELAY_MS = 8000

function applyWxAudioOptions(ctx) {
  // #ifdef MP-WEIXIN
  if (ctx && typeof ctx.obeyMuteSwitch !== 'undefined') {
    ctx.obeyMuteSwitch = false
  }
  // #endif
}

function playSrc(src, options) {
  const { loop = false, volume = 1, onEnd } = options || {}
  const ctx = uni.createInnerAudioContext()
  applyWxAudioOptions(ctx)
  ctx.src = src
  ctx.loop = loop
  ctx.volume = volume

  const doPlay = () => {
    try {
      ctx.play()
    } catch (e) {
      console.warn('ac play', src, e)
    }
  }

  ctx.onCanplay(doPlay)
  ctx.onError((err) => {
    console.warn('ac audio error', src, err)
    destroyCtx(ctx)
  })
  if (onEnd) {
    ctx.onEnded(() => {
      onEnd()
      destroyCtx(ctx)
    })
  } else {
    ctx.onEnded(() => {
      destroyCtx(ctx)
    })
  }
  setTimeout(doPlay, 80)
  return ctx
}

function destroyCtx(ctx) {
  if (!ctx) {
    return
  }
  try {
    ctx.stop()
  } catch (e) {
    // ignore
  }
  try {
    ctx.destroy()
  } catch (e) {
    // ignore
  }
}

/**
 * @returns {{
 *   playBeep: () => void,
 *   startWork: (fanSpeed: string, mode: string) => void,
 *   updateWork: (fanSpeed: string, mode: string) => void,
 *   stopWork: () => void,
 *   destroy: () => void
 * }}
 */
export function createAcAudio() {
  /** @type {WechatMiniprogram.InnerAudioContext | null} */
  let acWorkCtx = null
  /** @type {WechatMiniprogram.InnerAudioContext | null} */
  let fanCtx = null
  let fanStartTimer = null
  let pendingFanSpeed = 'auto'
  let pendingMode = 'cool'
  let running = false

  function src(name) {
    return BASE + name
  }

  function fanVolume() {
    const base = FAN_VOLUME[pendingFanSpeed] || 0.5
    return pendingMode === 'heat' ? Math.min(1, base + 0.08) : base
  }

  function clearTimers() {
    if (fanStartTimer) {
      clearTimeout(fanStartTimer)
      fanStartTimer = null
    }
  }

  function playBeep() {
    playSrc(src('di.mp3'), { volume: 1 })
  }

  function stopFan() {
    destroyCtx(fanCtx)
    fanCtx = null
  }

  function stopWork() {
    running = false
    clearTimers()
    stopFan()
    destroyCtx(acWorkCtx)
    acWorkCtx = null
  }

  function startFan() {
    stopFan()
    if (!running) {
      return
    }
    fanCtx = uni.createInnerAudioContext()
    applyWxAudioOptions(fanCtx)
    fanCtx.src = src('fan-loop.wav')
    fanCtx.loop = true
    fanCtx.volume = fanVolume()
    fanCtx.onCanplay(() => {
      if (running && fanCtx) {
        fanCtx.play()
      }
    })
    fanCtx.onError((err) => {
      console.warn('ac fan', fanCtx && fanCtx.src, err)
      stopFan()
    })
  }

  /**
   * @param {string} fanSpeed
   * @param {string} mode
   */
  function startWork(fanSpeed, mode) {
    stopWork()
    pendingFanSpeed = fanSpeed
    pendingMode = mode
    running = true

    acWorkCtx = uni.createInnerAudioContext()
    applyWxAudioOptions(acWorkCtx)
    acWorkCtx.src = src('ac-work.mp3')
    acWorkCtx.volume = 1
    acWorkCtx.onCanplay(() => {
      if (running && acWorkCtx) {
        acWorkCtx.play()
      }
    })
    acWorkCtx.onError((err) => {
      console.warn('ac work', acWorkCtx && acWorkCtx.src, err)
    })

    fanStartTimer = setTimeout(() => {
      if (!running) {
        return
      }
      startFan()
    }, AC_WORK_DELAY_MS)
  }

  /**
   * @param {string} fanSpeed
   * @param {string} mode
   */
  function updateWork(fanSpeed, mode) {
    pendingFanSpeed = fanSpeed
    pendingMode = mode
    if (fanCtx) {
      fanCtx.volume = fanVolume()
    }
  }

  function destroy() {
    stopWork()
  }

  return {
    playBeep,
    startWork,
    updateWork,
    stopWork,
    destroy
  }
}
