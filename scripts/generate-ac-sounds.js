/**
 * 空调音效：di / ac-work 来自 YunYouJun/air-conditioner；风机为本地短循环（控制包体）
 * Run: node scripts/generate-ac-sounds.js
 */
const fs = require('fs')
const path = require('path')
const https = require('https')

const outDir = path.join(__dirname, '..', 'static', 'ac-simulator')
const SAMPLE_RATE = 22050
const CDN =
  'https://cdn.jsdelivr.net/gh/YunYouJun/air-conditioner/public/assets/audio'

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close()
          if (fs.existsSync(dest)) fs.unlinkSync(dest)
          return download(res.headers.location, dest).then(resolve, reject)
        }
        if (res.statusCode !== 200) {
          reject(new Error(`${url} -> ${res.statusCode}`))
          return
        }
        res.pipe(file)
        file.on('finish', () => {
          file.close(resolve)
        })
      })
      .on('error', reject)
  })
}

function writeWav(filePath, samples) {
  const numSamples = samples.length
  const dataSize = numSamples * 2
  const buf = Buffer.alloc(44 + dataSize)

  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(SAMPLE_RATE, 24)
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < numSamples; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.floor(v * 32767 * 0.9), 44 + i * 2)
  }

  fs.writeFileSync(filePath, buf)
}

/** ~12s 风机循环，体积约 500KB，听感接近换气扇 */
function buildFanLoop(durationSec) {
  const n = Math.floor(SAMPLE_RATE * durationSec)
  const out = new Array(n)
  let pink = 0
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE
    const white = Math.random() * 2 - 1
    pink = pink * 0.93 + white * 0.07
    const hum = Math.sin(2 * Math.PI * 88 * t) * 0.32
    const hum2 = Math.sin(2 * Math.PI * 176 * t) * 0.08
    const trem = 0.88 + 0.12 * Math.sin(2 * Math.PI * 2.4 * t)
    const env = i < 600 ? i / 600 : i > n - 1200 ? (n - i) / 1200 : 1
    out[i] = (pink * 0.14 + hum + hum2) * trem * env
  }
  return out
}

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const legacy = path.join(outDir, 'air-extractor-fan.mp3')
  if (fs.existsSync(legacy)) {
    fs.unlinkSync(legacy)
    console.log('Removed large', legacy)
  }

  for (const name of ['di.mp3', 'ac-work.mp3']) {
    const dest = path.join(outDir, name)
    console.log('Downloading', name)
    await download(`${CDN}/${name}`, dest)
  }

  const fanPath = path.join(outDir, 'fan-loop.wav')
  writeWav(fanPath, buildFanLoop(12))
  console.log(
    'Wrote',
    fanPath,
    `(${Math.round(fs.statSync(fanPath).size / 1024)} KB)`
  )
  console.log('Done:', outDir)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
