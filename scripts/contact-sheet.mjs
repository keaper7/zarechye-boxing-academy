/**
 * Склеивает отобранные кадры в один лист, как они лягут в сетку галереи
 * (4 колонки на десктопе). Нужен, чтобы посмотреть подборку целиком —
 * ровный ли тон между кадрами и не дублируют ли они друг друга.
 *
 *   node scripts/contact-sheet.mjs
 */
import sharp from 'sharp'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'public', 'gym')
const OUT = process.argv[2] ?? path.join(process.cwd(), 'contact-sheet.webp')

const NAMES = [
  'bags-row',
  'ring-front',
  'bags-ring',
  'ring-training',
  'dummies',
  'cardio',
  'hall',
  'strength',
]

const COLS = 4
const CELL_W = 300
const CELL_H = 400
const GAP = 8

const rows = Math.ceil(NAMES.length / COLS)
const width = COLS * CELL_W + (COLS - 1) * GAP
const height = rows * CELL_H + (rows - 1) * GAP

const tiles = await Promise.all(
  NAMES.map(async (name, i) => ({
    input: await sharp(path.join(DIR, `${name}-960.webp`))
      .resize(CELL_W, CELL_H, { fit: 'cover' })
      .toBuffer(),
    left: (i % COLS) * (CELL_W + GAP),
    top: Math.floor(i / COLS) * (CELL_H + GAP),
  })),
)

await sharp({
  create: { width, height, channels: 3, background: '#0a0a0b' },
})
  .composite(tiles)
  .webp({ quality: 82 })
  .toFile(OUT)

console.log(`Лист собран: ${OUT} (${width}×${height}, ${NAMES.length} кадров)`)
