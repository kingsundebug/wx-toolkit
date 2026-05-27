const DOUYIN_URL_RE =
  /https?:\/\/(?:v\.douyin\.com|www\.douyin\.com|www\.iesdouyin\.com|m\.douyin\.com)[^\s\u4e00-\u9fa5，。！？；：""''（）【】]*/gi

/**
 * @param {string} text
 * @returns {string | null}
 */
function extractDouyinUrl(text) {
  if (!text || typeof text !== 'string') {
    return null
  }
  const matches = text.match(DOUYIN_URL_RE)
  if (!matches || !matches.length) {
    return null
  }
  return matches[0].replace(/[,.，。!?！？;；]+$/, '')
}

module.exports = {
  extractDouyinUrl
}
