<script>
import { ensureCloudReady } from './common/cloud.js'

export default {
  onLaunch() {
    console.log('哆啦口袋 launch')
    // #ifdef MP-WEIXIN
    ensureCloudReady().catch((e) => {
      console.warn('cloud init', e)
    })
    // #endif
  },
  onShow() {},
  onHide() {}
}
</script>

<style>
page {
  background-color: #f7f8fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
