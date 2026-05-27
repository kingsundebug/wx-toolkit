/**
 * 将 cloudfunctions 同步到 uni-app 微信小程序编译目录。
 * HBuilderX 运行到微信开发者工具后执行：npm run sync:cloud
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'cloudfunctions')
const DIST = path.join(ROOT, 'unpackage', 'dist', 'dev', 'mp-weixin')
const DIST_CLOUD = path.join(DIST, 'cloudfunctions')
const DIST_PROJECT = path.join(DIST, 'project.config.json')
const ROOT_PROJECT = path.join(ROOT, 'project.config.json')

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(from, to)
    } else {
      fs.copyFileSync(from, to)
    }
  }
}

function mergeProjectConfig() {
  let distCfg = {}
  if (fs.existsSync(DIST_PROJECT)) {
    distCfg = JSON.parse(fs.readFileSync(DIST_PROJECT, 'utf8'))
  }
  let rootCfg = {}
  if (fs.existsSync(ROOT_PROJECT)) {
    rootCfg = JSON.parse(fs.readFileSync(ROOT_PROJECT, 'utf8'))
  }
  if (rootCfg.cloudfunctionRoot) {
    distCfg.cloudfunctionRoot = rootCfg.cloudfunctionRoot
  } else {
    distCfg.cloudfunctionRoot = 'cloudfunctions/'
  }
  fs.writeFileSync(DIST_PROJECT, JSON.stringify(distCfg, null, 2), 'utf8')
}

function mergeAppJson() {
  const distApp = path.join(DIST, 'app.json')
  if (!fs.existsSync(distApp)) {
    return
  }
  const appCfg = JSON.parse(fs.readFileSync(distApp, 'utf8'))
  appCfg.cloud = true
  fs.writeFileSync(distApp, JSON.stringify(appCfg, null, 2), 'utf8')
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('未找到 cloudfunctions 目录:', SRC)
    process.exit(1)
  }
  if (!fs.existsSync(DIST)) {
    console.error('未找到编译目录，请先在 HBuilderX 运行到微信开发者工具:')
    console.error(DIST)
    process.exit(1)
  }
  if (fs.existsSync(DIST_CLOUD)) {
    fs.rmSync(DIST_CLOUD, { recursive: true, force: true })
  }
  copyDir(SRC, DIST_CLOUD)
  mergeProjectConfig()
  mergeAppJson()
  console.log('已同步 cloudfunctions ->', DIST_CLOUD)
  console.log('已写入 cloudfunctionRoot 与 app.json cloud:true')
  console.log('请关闭并重新打开微信开发者工具项目，再右键 cloudfunctions 文件夹')
}

main()
