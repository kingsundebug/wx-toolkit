const path = require('path')

/** uni-app Vue2：编译时把 cloudfunctions 复制到 mp-weixin 输出目录（需 copy-webpack-plugin@5） */
let cloudCopyPlugin = null
try {
  const CopyWebpackPlugin = require('copy-webpack-plugin')
  cloudCopyPlugin = new CopyWebpackPlugin([
    {
      from: path.join(__dirname, 'cloudfunctions'),
      to: path.join(
        __dirname,
        'unpackage/dist',
        process.env.NODE_ENV === 'production' ? 'build' : 'dev',
        process.env.UNI_PLATFORM,
        'cloudfunctions'
      )
    }
  ])
} catch (e) {
  // HBuilderX 未安装 copy-webpack-plugin 时，编译后请执行 npm run sync:cloud
}

module.exports = {
  configureWebpack: {
    plugins: cloudCopyPlugin ? [cloudCopyPlugin] : []
  }
}
