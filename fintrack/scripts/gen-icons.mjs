// Generates on-brand PWA icons with zero dependencies (Node built-ins only).
// Design: full-bleed ink-navy field (#0f172a) with three ascending bars
// (action-blue -> action-blue -> income-green) — a serious finance growth mark.
// Full-bleed background keeps it valid as a `maskable` icon (content stays
// inside the central safe zone, OS applies its own mask).
//
// Run: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(OUT, { recursive: true })

const BG = [15, 23, 42] // #0f172a ink navy
const BAR_A = [59, 130, 246] // #3b82f6 action blue
const BAR_B = [16, 185, 129] // #10b981 income green

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return ~c >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function fillRect(px, W, x0, y0, w, h, [r, g, b]) {
  const x1 = Math.round(x0)
  const y1 = Math.round(y0)
  const x2 = Math.round(x0 + w)
  const y2 = Math.round(y0 + h)
  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      const i = (y * W + x) * 4
      px[i] = r
      px[i + 1] = g
      px[i + 2] = b
      px[i + 3] = 255
    }
  }
}

function makePng(size) {
  const W = size
  const H = size
  const px = Buffer.alloc(W * H * 4)
  // background
  fillRect(px, W, 0, 0, W, H, BG)

  // Three ascending bars inside the maskable safe zone (~22%..78%).
  const safe = size * 0.56
  const left = size * 0.22
  const baseline = size * 0.74 // bars grow upward from here
  const gap = safe * 0.1
  const barW = (safe - gap * 2) / 3
  const heights = [0.42, 0.66, 0.95] // fraction of safe height
  const colors = [BAR_A, BAR_A, BAR_B]
  for (let i = 0; i < 3; i++) {
    const h = safe * heights[i]
    fillRect(px, W, left + i * (barW + gap), baseline - h, barW, h, colors[i])
  }

  // Build PNG
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0)
  ihdr.writeUInt32BE(H, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const raw = Buffer.alloc(H * (W * 4 + 1))
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0 // filter: none
    px.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4)
  }
  const idat = deflateSync(raw, { level: 9 })

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [192, 512, 180]) {
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`
  writeFileSync(join(OUT, name), makePng(size))
  console.log(`wrote public/icons/${name}`)
}
