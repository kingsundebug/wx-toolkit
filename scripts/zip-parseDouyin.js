/**
 * 打包 parseDouyin 云函数为 ZIP，供云开发控制台「上传 ZIP 包」使用。
 * 用法：node scripts/zip-parseDouyin.js
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const SRC = path.join(__dirname, '..', 'cloudfunctions', 'parseDouyin')
const OUT = path.join(__dirname, '..', 'parseDouyin.zip')

if (!fs.existsSync(SRC)) {
  console.error('未找到', SRC)
  process.exit(1)
}

if (fs.existsSync(OUT)) {
  fs.unlinkSync(OUT)
}

const isWin = process.platform === 'win32'
if (isWin) {
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${SRC}\\*' -DestinationPath '${OUT}' -Force"`,
    { stdio: 'inherit' }
  )
} else {
  execSync(`cd "${SRC}" && zip -r "${OUT}" .`, { stdio: 'inherit' })
}

console.log('已生成:', OUT)
console.log('云开发控制台 → parseDouyin → 函数代码 → 上传 ZIP 包 → 保存并安装依赖')
