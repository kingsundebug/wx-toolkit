import { CLOUD_ENV_ID } from './config.js'

const ERROR_MSG = {
  INVALID_URL: '未识别到有效抖音链接，请粘贴完整分享文案',
  PARSE_FAILED: '解析失败，请稍后重试或更换链接',
  UNSUPPORTED: '暂仅支持抖音链接',
  CLOUD_NOT_READY: '云开发未就绪，请确认已开通并填写环境 ID',
  CLOUD_CALL_FAIL: '云函数调用失败，请确认 parseDouyin 已上传部署到云端（非仅本地调试）'
}

/**
 * @param {unknown} err
 * @returns {string}
 */
export function getErrorMessage(err) {
  if (err && typeof err === 'object') {
    if ('errMsg' in err && err.errMsg) {
      const msg = String(err.errMsg)
      if (/FUNCTION_NOT_FOUND|501000|could not find function/i.test(msg)) {
        return ERROR_MSG.CLOUD_CALL_FAIL
      }
      if (/cloud init|Environment not found/i.test(msg)) {
        return '云环境未找到，请检查 common/config.js 中的 CLOUD_ENV_ID'
      }
      return msg
    }
    if ('message' in err && err.message) {
      return String(err.message)
    }
    if ('code' in err && err.code && ERROR_MSG[err.code]) {
      return ERROR_MSG[err.code]
    }
  }
  if (typeof err === 'string' && err) {
    return err
  }
  return ERROR_MSG.PARSE_FAILED
}

/**
 * 真机预览必须调用已部署的云端函数；仅本地调试在手机上无效。
 */
export function ensureCloudReady() {
  // #ifdef MP-WEIXIN
  if (typeof wx === 'undefined' || !wx.cloud) {
    return Promise.reject(new Error(ERROR_MSG.CLOUD_NOT_READY))
  }
  if (!CLOUD_ENV_ID) {
    return Promise.reject(
      new Error('请在 common/config.js 填写 CLOUD_ENV_ID')
    )
  }
  wx.cloud.init({
    env: CLOUD_ENV_ID,
    traceUser: true
  })
  return Promise.resolve()
  // #endif
  // #ifndef MP-WEIXIN
  return Promise.reject(new Error('仅支持微信小程序'))
  // #endif
}

/**
 * @param {string} text
 * @returns {Promise<object>}
 */
export function callParseDouyin(text) {
  return ensureCloudReady().then(
    () =>
      new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN
        wx.cloud.callFunction({
          name: 'parseDouyin',
          data: { text },
          success(res) {
            const data = res.result
            if (data && data.ok) {
              resolve(data)
              return
            }
            reject(data || { code: 'PARSE_FAILED', message: ERROR_MSG.PARSE_FAILED })
          },
          fail(err) {
            reject(err || { errMsg: ERROR_MSG.CLOUD_CALL_FAIL })
          }
        })
        // #endif
      })
  )
}

export { ERROR_MSG }
