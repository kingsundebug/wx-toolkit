/** 全局主题色 — 页面 wxss 请保持同名色值 */
export const colors = {
  pageBg: '#FFFFFF',
  surface: '#F7F8FA',
  primary: '#1677FF',
  primarySoft: '#E6F4FF',
  orange: '#FF7A45',
  orangeSoft: '#FFF2E8',
  green: '#52C41A',
  purple: '#722ED1',
  gold: '#FAAD14',
  cyan: '#13C2C2',
  text: '#141414',
  textSub: '#595959',
  textHint: '#8C8C8C',
  border: '#F0F0F0',
  tabInactive: '#666666'
}

/** @param {number} index */
export function setTabBarIndex(index) {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (page && typeof page.getTabBar === 'function') {
    const tabBar = page.getTabBar()
    if (tabBar) {
      tabBar.setData({ selected: index })
    }
  }
}
