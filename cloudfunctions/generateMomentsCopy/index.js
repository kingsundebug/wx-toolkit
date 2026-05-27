const cloud = require('wx-server-sdk')
const { buildChatMessages } = require('./lib/prompt')
const { chatCompletion } = require('./lib/llm')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const MSG = {
  INVALID_INPUT: '请至少填写朋友圈主题',
  LLM_NOT_CONFIGURED:
    '大模型未配置，请在云函数环境变量中设置 LLM_API_KEY（及可选 LLM_BASE_URL、LLM_MODEL）',
  GENERATE_FAILED: '生成失败，请稍后重试',
  RATE_LIMIT: '请求过于频繁，请稍后再试'
}

/**
 * @param {import('wx-server-sdk').ILogger} log
 * @param {unknown} err
 */
function logError(log, err) {
  if (err instanceof Error) {
    log.error({
      message: err.message,
      stack: err.stack,
      code: err.code
    })
  } else {
    log.error({ message: String(err) })
  }
}

/**
 * @param {unknown} event
 */
function normalizeInput(event) {
  const e = event || {}
  return {
    theme: (e.theme ? String(e.theme) : '').trim(),
    content: (e.content ? String(e.content) : '').trim(),
    mood: (e.mood ? String(e.mood) : '').trim(),
    style: (e.style ? String(e.style) : '').trim(),
    extra: (e.extra ? String(e.extra) : '').trim(),
    regenerate: Boolean(e.regenerate),
    previousCopy: (e.previousCopy ? String(e.previousCopy) : '').trim()
  }
}

exports.main = async (event) => {
  const log = cloud.logger()
  const input = normalizeInput(event)

  if (!input.theme) {
    return { ok: false, code: 'INVALID_INPUT', message: MSG.INVALID_INPUT }
  }

  try {
    const messages = buildChatMessages(input)
    const copy = await chatCompletion(messages)
    return { ok: true, copy }
  } catch (err) {
    logError(log, err)
    const code =
      err && typeof err === 'object' && 'code' in err ? String(err.code) : ''
    if (code === 'LLM_NOT_CONFIGURED') {
      return { ok: false, code, message: MSG.LLM_NOT_CONFIGURED }
    }
    const status = err && err.response && err.response.status
    if (status === 429) {
      return { ok: false, code: 'RATE_LIMIT', message: MSG.RATE_LIMIT }
    }
    const apiMsg =
      err &&
      err.response &&
      err.response.data &&
      err.response.data.error &&
      err.response.data.error.message
        ? String(err.response.data.error.message)
        : ''
    return {
      ok: false,
      code: 'GENERATE_FAILED',
      message: apiMsg || MSG.GENERATE_FAILED
    }
  }
}
