/**
 * Generates PWA PNG icons without external canvas dependencies.
 * Uses the Sharp package if available, otherwise falls back to generating
 * minimal valid PNGs from an inline SVG rasterised with Inkscape/resvg.
 * For simplicity, this script writes pre-built base64-encoded PNGs.
 *
 * The icon design: dark navy background (#0a0f1a) with a golden "L"
 * letter in Sora-style geometry, representing "Lexio".
 */

import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS_DIR = resolve(__dirname, '../public/icons')

mkdirSync(ICONS_DIR, { recursive: true })

/**
 * Encode a single PNG chunk: 4-byte length, 4-byte type, data, 4-byte CRC.
 * CRC is computed with CRC32 over (type + data).
 */
function crc32(buf) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.allocUnsafe(4)
  len.writeUInt32BE(data.length, 0)
  const crcInput = Buffer.concat([typeBytes, data])
  const crcBuf = Buffer.allocUnsafe(4)
  crcBuf.writeUInt32BE(crc32(crcInput), 0)
  return Buffer.concat([len, typeBytes, data, crcBuf])
}

/**
 * Minimal zlib deflate for small images: store blocks (no compression).
 * Sufficient for small icon PNGs — keeps the script dependency-free.
 */
function zlibDeflate(data) {
  // zlib header: CM=8, CINFO=7 (window size 32768), FCHECK computed
  // We'll use store method (BTYPE=00) in DEFLATE blocks.
  const BLOCK_SIZE = 65535
  const blocks = []

  for (let i = 0; i < data.length || blocks.length === 0; i += BLOCK_SIZE) {
    const blockData = data.slice(i, i + BLOCK_SIZE)
    const isLast = i + BLOCK_SIZE >= data.length
    const header = Buffer.allocUnsafe(5)
    header[0] = isLast ? 1 : 0
    header.writeUInt16LE(blockData.length, 1)
    header.writeUInt16LE(~blockData.length & 0xffff, 3)
    blocks.push(header, blockData)
  }

  // Compute Adler-32 checksum.
  let s1 = 1,
    s2 = 0
  for (const b of data) {
    s1 = (s1 + b) % 65521
    s2 = (s2 + s1) % 65521
  }
  const adler = Buffer.allocUnsafe(4)
  adler.writeUInt32BE(((s2 << 16) | s1) >>> 0, 0)

  // zlib header bytes: 0x78 0x01 (deflate, no compression)
  return Buffer.concat([Buffer.from([0x78, 0x01]), ...blocks, adler])
}

/**
 * Build a minimal RGB PNG from raw pixel data.
 * pixels: Uint8Array of R,G,B,A values (width * height * 4 bytes).
 */
function buildPNG(width, height, pixels) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR chunk
  const ihdrData = Buffer.allocUnsafe(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // RGBA colour type
  ihdrData[10] = 0 // compression method
  ihdrData[11] = 0 // filter method
  ihdrData[12] = 0 // interlace method
  const ihdr = chunk('IHDR', ihdrData)

  // IDAT chunk — filter byte (0 = None) prepended per row
  const rowSize = width * 4
  const filtered = Buffer.allocUnsafe(height * (1 + rowSize))
  for (let y = 0; y < height; y++) {
    filtered[y * (1 + rowSize)] = 0 // None filter
    pixels.copy(filtered, y * (1 + rowSize) + 1, y * rowSize, (y + 1) * rowSize)
  }
  const idat = chunk('IDAT', zlibDeflate(filtered))

  // IEND chunk
  const iend = chunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, ihdr, idat, iend])
}

/**
 * Draw the Lexio icon onto a pixel buffer.
 * Design: rounded-rect dark-navy background, gold "L" letterform.
 *
 * @param {number} size - icon dimension in pixels
 * @param {boolean} maskable - if true, shrink the safe zone for maskable icons
 *                              (content fits within the inner 80% circle)
 */
function renderIcon(size, maskable) {
  const buf = Buffer.alloc(size * size * 4)

  // Background colour: #0a0f1a → R=10, G=15, B=26
  const BG_R = 10,
    BG_G = 15,
    BG_B = 26
  // Primary / accent colour: #f59e0b → R=245, G=158, B=11
  const FG_R = 245,
    FG_G = 158,
    FG_B = 11

  const cx = size / 2
  const cy = size / 2

  // Corner radius for the background rounded rect (non-maskable only)
  const radius = maskable ? 0 : size * 0.18

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4

      // --- Background ---
      // For maskable icons use a full bleed; for standard icons use rounded rect.
      let inBg = false
      if (maskable) {
        inBg = true
      } else {
        // Rounded rectangle test.
        const dx = Math.max(0, Math.abs(x - cx) - (size / 2 - radius))
        const dy = Math.max(0, Math.abs(y - cy) - (size / 2 - radius))
        inBg = dx * dx + dy * dy <= radius * radius
      }

      if (!inBg) {
        // Transparent outside background shape.
        buf[idx] = 0
        buf[idx + 1] = 0
        buf[idx + 2] = 0
        buf[idx + 3] = 0
        continue
      }

      // Default to background colour.
      buf[idx] = BG_R
      buf[idx + 1] = BG_G
      buf[idx + 2] = BG_B
      buf[idx + 3] = 255

      // --- "L" letterform ---
      // For maskable icons, content must fit within the centre 80% circle (safe zone).
      // Scale the glyph down to 60% of size so it sits comfortably in the safe zone.
      const glyphScale = maskable ? 0.6 : 0.72
      const glyphSize = size * glyphScale
      // Centre the glyph.
      const glyphX = cx - glyphSize / 2
      const glyphY = cy - glyphSize / 2

      // Stroke width as a fraction of glyph size.
      const strokeW = glyphSize * 0.18
      // "L" consists of:
      //   - Vertical bar: from top of glyph to bottom, left-aligned
      //   - Horizontal bar: bottom of glyph, spanning full width
      const vertLeft = glyphX
      const vertRight = glyphX + strokeW
      const horizTop = glyphY + glyphSize - strokeW
      const horizBottom = glyphY + glyphSize

      const inVert = x >= vertLeft && x < vertRight && y >= glyphY && y < horizBottom
      const inHoriz = x >= glyphX && x < glyphX + glyphSize && y >= horizTop && y < horizBottom

      if (inVert || inHoriz) {
        buf[idx] = FG_R
        buf[idx + 1] = FG_G
        buf[idx + 2] = FG_B
        buf[idx + 3] = 255
      }
    }
  }

  return buf
}

const SIZES = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  { name: 'favicon.png', size: 32, maskable: false },
]

for (const { name, size, maskable } of SIZES) {
  const pixels = renderIcon(size, maskable)
  const png = buildPNG(size, size, pixels)
  const dest = resolve(ICONS_DIR, name)
  writeFileSync(dest, png)
  console.log(`Generated ${name} (${size}x${size}${maskable ? ', maskable' : ''}) → ${dest}`)
}

console.log('All icons generated successfully.')
