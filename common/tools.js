/**
 * @typedef {'ready' | 'soon'} ToolStatus
 * @typedef {{ id: string, name: string, desc: string, subtitle?: string, categoryId: string, glyph: string, gradient: string, status: ToolStatus, path: string, tabPath?: string, featured?: boolean }} ToolItem
 */

export const categories = [
  { id: 'media', name: '图片媒体' },
  { id: 'life', name: '效率备忘' },
  { id: 'fun', name: '趣味创意' }
]

export const tools = [
  {
    id: 'remove-wm',
    name: '去水印',
    desc: '粘贴分享链接，解析无水印资源',
    subtitle: '视频/图片链接解析',
    categoryId: 'media',
    glyph: '去',
    gradient: 'grad-blue-purple',
    status: 'ready',
    path: '/pages/remove-wm/remove-wm',
    tabPath: '/pages/remove-wm/remove-wm',
    featured: true
  },
  {
    id: 'qrcode',
    name: '二维码',
    desc: '文本、链接一键生成与保存',
    subtitle: '生成与保存',
    categoryId: 'media',
    glyph: '码',
    gradient: 'grad-pink-red',
    status: 'soon',
    path: '/pages/qrcode/qrcode',
    tabPath: '/pages/qrcode/qrcode',
    featured: true
  },
  {
    id: 'add-wm',
    name: '加水印',
    desc: '相册选图，文字平铺保护',
    subtitle: '文字水印',
    categoryId: 'media',
    glyph: '加',
    gradient: 'grad-cyan-blue',
    status: 'ready',
    path: '/pages/add-wm/add-wm'
  },
  {
    id: 'qr-parse',
    name: '码解析',
    desc: '识别图中二维码内容',
    categoryId: 'media',
    glyph: '码',
    gradient: 'grad-green-teal',
    status: 'soon',
    path: '/pages/tool-detail/tool-detail?id=qr-parse'
  },
  {
    id: 'memo',
    name: '备忘录',
    desc: '轻量记事，支持置顶',
    categoryId: 'life',
    glyph: '备',
    gradient: 'grad-orange-yellow',
    status: 'soon',
    path: '/pages/tool-detail/tool-detail?id=memo'
  },
  {
    id: 'calendar',
    name: '查日历',
    desc: '农历、节气与节假日',
    categoryId: 'life',
    glyph: '查',
    gradient: 'grad-purple-pink',
    status: 'soon',
    path: '/pages/tool-detail/tool-detail?id=calendar'
  },
  {
    id: 'danmaku',
    name: '手持弹幕',
    desc: '全屏滚动字幕展示',
    categoryId: 'fun',
    glyph: '手',
    gradient: 'grad-pink-light',
    status: 'ready',
    path: '/pages/danmaku/danmaku'
  }
]

export function getToolById(id) {
  return tools.find((item) => item.id === id)
}

export function getFeaturedTools() {
  return tools.filter((item) => item.featured)
}

export function getToolsByCategory(categoryId) {
  return tools.filter((item) => item.categoryId === categoryId)
}

export function getCategoriesWithTools() {
  return categories
    .map((cat) => ({
      ...cat,
      tools: getToolsByCategory(cat.id)
    }))
    .filter((cat) => cat.tools.length > 0)
}

/** @param {ToolItem} tool */
export function openTool(tool) {
  if (tool.tabPath) {
    uni.switchTab({ url: tool.tabPath })
    return
  }
  if (tool.status !== 'ready') {
    uni.showToast({ title: '功能开发中', icon: 'none' })
    return
  }
  if (tool.path) {
    uni.navigateTo({ url: tool.path })
  }
}
