/**
 * Печатает готовый блок `gallery.items` для src/content.ts.
 *
 *   node scripts/gallery-entries.mjs
 *
 * Отдельно от prepare-photos.mjs, потому что подписи (alt) пишутся руками:
 * их нельзя вывести из файла, а без них фотографии не существуют для
 * скринридера и для поиска по картинкам. Скрипт только считает размеры
 * и заглушки — чтобы не переносить длинные base64-строки вручную.
 */
import sharp from 'sharp'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'public', 'gym')

/** Порядок здесь = порядок в галерее. Первым идёт самый сильный кадр. */
const ITEMS = [
  ['bags-row', 'Ряд боксёрских мешков на цепях вдоль ринга'],
  ['ring-front', 'Ринг академии, вид от матов'],
  ['bags-ring', 'Мешки на цепях и ринг за ними'],
  ['ring-training', 'Ринг, на заднем плане идёт тренировка'],
  ['dummies', 'Манекены для отработки ударов'],
  ['cardio', 'Кардиозона: воздушные велотренажёры и блочная рама'],
  ['hall', 'Общий вид зала: маты, ринг и мешки'],
  ['strength', 'Силовая рама и тренажёры для общей подготовки'],
]

const lines = []
for (const [name, alt] of ITEMS) {
  const file = path.join(DIR, `${name}-960.webp`)
  const { width, height } = await sharp(file).metadata()
  const blur = await sharp(file).resize({ width: 16 }).webp({ quality: 40 }).toBuffer()
  lines.push(
    `      {\n` +
      `        name: '${name}',\n` +
      `        alt: '${alt}',\n` +
      `        width: ${width},\n` +
      `        height: ${height},\n` +
      `        blur: 'data:image/webp;base64,${blur.toString('base64')}',\n` +
      `      },`,
  )
}

console.log(lines.join('\n'))
