const axios = require('axios')

const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'

const COMMON_HEADERS = {
  'User-Agent': UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  Referer: 'https://www.douyin.com/'
}

/**
 * @param {string} raw
 * @returns {string}
 */
function normalizeUrl(raw) {
  let url = raw.trim()
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url
  }
  return url
}

/**
 * @param {string} inputUrl
 * @returns {Promise<string>}
 */
async function resolveFinalUrl(inputUrl) {
  const res = await axios.get(normalizeUrl(inputUrl), {
    maxRedirects: 10,
    timeout: 15000,
    headers: COMMON_HEADERS,
    validateStatus: (s) => s < 500
  })
  const final =
    (res.request && res.request.res && res.request.res.responseUrl) ||
    (res.request && res.request.responseURL) ||
    res.config.url ||
    normalizeUrl(inputUrl)
  return final
}

/**
 * @param {string} url
 * @returns {string | null}
 */
function extractItemId(url) {
  const patterns = [
    /[?&]modal_id=(\d+)/,
    /[?&]aweme_id=(\d+)/,
    /\/video\/(\d+)/,
    /\/note\/(\d+)/,
    /\/share\/video\/(\d+)/,
    /(\d{15,22})/
  ]
  for (let i = 0; i < patterns.length; i++) {
    const m = url.match(patterns[i])
    if (m && m[1]) {
      return m[1]
    }
  }
  return null
}

/**
 * @param {string} html
 * @returns {string | null}
 */
function extractItemIdFromHtml(html) {
  const patterns = [
    /"aweme_id"\s*:\s*"(\d+)"/,
    /"awemeId"\s*:\s*"(\d+)"/,
    /"itemId"\s*:\s*"(\d+)"/,
    /aweme_id%22%3A%22(\d+)/,
    /video\/(\d{15,22})/
  ]
  for (let i = 0; i < patterns.length; i++) {
    const m = html.match(patterns[i])
    if (m && m[1]) {
      return m[1]
    }
  }
  return null
}

/**
 * @param {string} encoded
 * @returns {object | null}
 */
function tryParseRenderData(encoded) {
  try {
    const json = decodeURIComponent(encoded)
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}

/**
 * @param {unknown} node
 * @returns {object | null}
 */
function findAwemeDetail(node) {
  if (!node || typeof node !== 'object') {
    return null
  }
  if (node.aweme_detail && node.aweme_detail.video) {
    return node.aweme_detail
  }
  if (node.awemeDetail && node.awemeDetail.video) {
    return node.awemeDetail
  }
  if (node.video && (node.desc !== undefined || node.aweme_id)) {
    return node
  }
  const keys = Object.keys(node)
  for (let i = 0; i < keys.length; i++) {
    const found = findAwemeDetail(node[keys[i]])
    if (found) {
      return found
    }
  }
  return null
}

/**
 * @param {string} pageUrl
 * @returns {Promise<{ html: string, finalUrl: string }>}
 */
async function fetchPage(pageUrl) {
  const res = await axios.get(pageUrl, {
    timeout: 15000,
    headers: COMMON_HEADERS,
    maxRedirects: 10
  })
  const final =
    (res.request && res.request.res && res.request.res.responseUrl) ||
    pageUrl
  return { html: String(res.data || ''), finalUrl: final }
}

/**
 * @param {string} html
 * @returns {object | null}
 */
function extractAwemeFromHtml(html) {
  const renderMatch = html.match(
    /<script[^>]*id="RENDER_DATA"[^>]*>([^<]+)<\/script>/i
  )
  if (renderMatch && renderMatch[1]) {
    const data = tryParseRenderData(renderMatch[1].trim())
    const detail = data ? findAwemeDetail(data) : null
    if (detail) {
      return detail
    }
  }

  const routerMatch = html.match(/window\._ROUTER_DATA\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/)
  if (routerMatch && routerMatch[1]) {
    try {
      const data = JSON.parse(routerMatch[1])
      const detail = findAwemeDetail(data)
      if (detail) {
        return detail
      }
    } catch (e) {}
  }

  const universalMatch = html.match(
    /window\.__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/
  )
  if (universalMatch && universalMatch[1]) {
    try {
      const data = JSON.parse(universalMatch[1])
      const detail = findAwemeDetail(data)
      if (detail) {
        return detail
      }
    } catch (e) {}
  }

  return null
}

/**
 * @param {string} playUrl
 * @returns {string}
 */
function stripWatermark(playUrl) {
  if (!playUrl) {
    return playUrl
  }
  return playUrl.replace(/playwm/g, 'play')
}

/**
 * @param {object} item
 * @returns {{ type: string, title: string, cover: string, items: Array<{url: string, type: string}> }}
 */
function mapAwemeItem(item) {
  const title = (item.desc || item.share_info?.share_title || '').trim()
  const cover =
    (item.video &&
      item.video.cover &&
      item.video.cover.url_list &&
      item.video.cover.url_list[0]) ||
    (item.video &&
      item.video.origin_cover &&
      item.video.origin_cover.url_list &&
      item.video.origin_cover.url_list[0]) ||
    ''

  const images = item.images || item.image_post_info?.images
  if (images && images.length) {
    const items = images
      .map((img) => {
        const u =
          img.url_list?.[0] ||
          img.download_url_list?.[0] ||
          img.display_image?.url_list?.[0]
        return u ? { url: u, type: 'image' } : null
      })
      .filter(Boolean)
    if (items.length) {
      return {
        type: 'gallery',
        title,
        cover: cover || items[0].url,
        items
      }
    }
  }

  let videoUrl =
    (item.video &&
      item.video.play_addr &&
      item.video.play_addr.url_list &&
      item.video.play_addr.url_list[0]) ||
    (item.video &&
      item.video.download_addr &&
      item.video.download_addr.url_list &&
      item.video.download_addr.url_list[0]) ||
    ''

  videoUrl = stripWatermark(videoUrl)

  if (!videoUrl) {
    throw new Error('NO_MEDIA')
  }

  return {
    type: 'video',
    title,
    cover,
    items: [{ url: videoUrl, type: 'video' }]
  }
}

/**
 * @param {string} html
 * @returns {string | null}
 */
function extractDirectVideoFromHtml(html) {
  const patterns = [
    /"play_addr"\s*:\s*\{[^}]*"url_list"\s*:\s*\[\s*"([^"]+)"/,
    /"download_addr"\s*:\s*\{[^}]*"url_list"\s*:\s*\[\s*"([^"]+)"/,
    /playAddr\\":\\"(https:[^\\]+)/,
    /"srcNoMark"\s*:\s*"(https:[^"]+)"/
  ]
  for (let i = 0; i < patterns.length; i++) {
    const m = html.match(patterns[i])
    if (m && m[1]) {
      let url = m[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/')
      url = stripWatermark(url)
      if (/^https?:\/\//i.test(url)) {
        return url
      }
    }
  }
  return null
}

/**
 * @param {string} itemId
 * @returns {Promise<object>}
 */
async function fetchBySharePage(itemId) {
  const url = `https://www.iesdouyin.com/share/video/${itemId}/`
  const res = await axios.get(url, {
    timeout: 15000,
    headers: COMMON_HEADERS,
    maxRedirects: 10
  })
  const html = String(res.data || '')
  const direct = extractDirectVideoFromHtml(html)
  if (direct) {
    return {
      desc: '',
      video: {
        play_addr: { url_list: [direct] },
        cover: { url_list: [] }
      }
    }
  }
  const fromEmbed = extractAwemeFromHtml(html)
  if (fromEmbed) {
    return fromEmbed
  }
  throw new Error('EMPTY_SHARE_PAGE')
}

/**
 * @param {string} itemId
 * @returns {Promise<object>}
 */
async function fetchByItemInfoApi(itemId) {
  const api = `https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${itemId}`
  const res = await axios.get(api, {
    timeout: 15000,
    headers: COMMON_HEADERS
  })
  const list = res.data && res.data.item_list
  if (!list || !list.length) {
    throw new Error('EMPTY_ITEM_LIST')
  }
  return list[0]
}

/**
 * @param {string} itemId
 * @returns {Promise<object>}
 */
async function fetchByDetailApi(itemId) {
  const api =
    'https://www.douyin.com/aweme/v1/web/aweme/detail/?device_platform=webapp&aid=6383&channel=channel_pc_web&aweme_id=' +
    itemId
  const res = await axios.get(api, {
    timeout: 15000,
    headers: {
      ...COMMON_HEADERS,
      Referer: `https://www.douyin.com/video/${itemId}`
    }
  })
  const detail = res.data && res.data.aweme_detail
  if (!detail) {
    throw new Error('EMPTY_AWEME_DETAIL')
  }
  return detail
}

/**
 * @param {string} shareUrl
 * @returns {Promise<{ type: string, title: string, cover: string, items: Array<{url: string, type: string}> }>}
 */
async function parseDouyin(shareUrl) {
  const finalUrl = await resolveFinalUrl(shareUrl)
  let itemId = extractItemId(finalUrl)

  const page = await fetchPage(finalUrl)
  if (!itemId) {
    itemId = extractItemId(page.finalUrl) || extractItemIdFromHtml(page.html)
  }

  const fromHtml = extractAwemeFromHtml(page.html)
  if (fromHtml) {
    return mapAwemeItem(fromHtml)
  }

  const directUrl = extractDirectVideoFromHtml(page.html)
  if (directUrl) {
    return {
      type: 'video',
      title: '',
      cover: '',
      items: [{ url: directUrl, type: 'video' }]
    }
  }

  if (!itemId) {
    throw new Error('NO_ITEM_ID')
  }

  const errors = []
  try {
    const item = await fetchByDetailApi(itemId)
    return mapAwemeItem(item)
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e))
  }

  try {
    const item = await fetchBySharePage(itemId)
    return mapAwemeItem(item)
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e))
  }

  try {
    const item = await fetchByItemInfoApi(itemId)
    return mapAwemeItem(item)
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e))
  }

  const err = new Error('ALL_PARSE_FAILED')
  err.causes = errors
  throw err
}

module.exports = {
  parseDouyin
}
