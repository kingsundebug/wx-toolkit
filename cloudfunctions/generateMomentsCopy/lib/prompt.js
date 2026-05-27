const STYLE_HINTS = {
  日常: '口语自然、像随手记录，不要太书面',
  文艺: '略带诗意与意象，句子可稍长，但避免矫情堆砌',
  幽默: '轻松俏皮，可适度玩梗，但不要低俗冒犯',
  专业: '简洁克制、信息清晰，适合工作相关分享',
  小红书: '适当使用 emoji、分隔符（如 · ｜ ✨）、短句换行，氛围感强但勿堆砌'
}

/**
 * @param {{ theme: string, content: string, mood: string, style: string, extra: string, regenerate?: boolean, previousCopy?: string }} input
 */
function buildUserPrompt(input) {
  const lines = [
    '请根据以下信息，写一条适合发微信朋友圈的文案：',
    `【主题】${input.theme}`,
    `【内容要点】${input.content || '（未特别说明，可结合主题合理发挥）'}`,
    `【希望情绪】${input.mood || '自然真实'}`,
    `【文字风格】${input.style || '日常'}：${STYLE_HINTS[input.style] || STYLE_HINTS['日常']}`
  ]
  if (input.extra && input.extra.trim()) {
    lines.push(`【补充要求】${input.extra.trim()}`)
  }
  lines.push(
    '',
    '输出要求：',
    '- 只输出文案正文，不要标题、不要引号包裹、不要解释',
    '- 长度适中，一般 2～8 行，小红书风格可略长',
    '- 符合微信朋友圈语境，避免广告腔和 AI 腔',
    '- 不要编造用户未提及的具体人名、地点、品牌'
  )
  if (input.regenerate && input.previousCopy) {
    lines.push(
      '',
      '用户希望换一版，请与下面这版明显不同（表达方式、开头或结构均可变化），但需满足同样的主题与情绪：',
      '---',
      input.previousCopy,
      '---'
    )
  }
  return lines.join('\n')
}

const SYSTEM_PROMPT =
  '你是擅长写微信朋友圈文案的助手。根据用户提供的主题、内容、情绪与风格生成可直接发布的配文。输出必须是纯文案正文。'

/**
 * @param {Parameters<typeof buildUserPrompt>[0]} input
 */
function buildChatMessages(input) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(input) }
  ]
}

module.exports = { buildChatMessages, buildUserPrompt }
