const cloud = require('wx-server-sdk')
const { extractDouyinUrl } = require('./lib/extract-url')
const { parseDouyin } = require('./lib/parser')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const MSG = {
  INVALID_URL: '未识别到有效抖音链接，请粘贴完整分享文案',
  PARSE_FAILED: '解析失败，请稍后重试或更换链接',
  UNSUPPORTED: '暂仅支持抖音链接'
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
      name: err.name,
      causes: err.causes
    })
  } else {
    log.error({ message: String(err) })
  }
}

exports.main = async (event) => {
  const log = cloud.logger()
  const text = (event && event.text ? String(event.text) : '').trim()

  if (!text) {
    return { ok: false, code: 'INVALID_URL', message: MSG.INVALID_URL }
  }

  const shareUrl = extractDouyinUrl(text)
  if (!shareUrl) {
    return { ok: false, code: 'INVALID_URL', message: MSG.INVALID_URL }
  }

  if (!/douyin\.com|iesdouyin\.com/i.test(shareUrl)) {
    return { ok: false, code: 'UNSUPPORTED', message: MSG.UNSUPPORTED }
  }

  try {
    const parsed = await parseDouyin(shareUrl)
    return {
      ok: true,
      platform: 'douyin',
      type: parsed.type,
      title: parsed.title,
      cover: parsed.cover,
      items: parsed.items
    }
  } catch (err) {
    logError(log, err)
    const reason =
      err instanceof Error && err.message ? err.message : 'UNKNOWN'
    const detail =
      err instanceof Error && err.causes ? { causes: err.causes } : {}
    return {
      ok: false,
      code: 'PARSE_FAILED',
      reason,
      message: MSG.PARSE_FAILED,
      ...detail
    }
  }
}
