/**
 * Готовит фотографии зала к публикации.
 *
 *   node scripts/prepare-photos.mjs <папка-с-исходниками>
 *
 * Что делает и зачем:
 *
 * 1. Цветокоррекция — грейд «Тёплый вечер». Заказчик смотрел три
 *    варианта на реальных кадрах (сравнение делали отдельным скриптом,
 *    не сохранился в репозитории — был одноразовым) и выбрал этот.
 *    Раньше здесь стояла только лёгкая коррекция контраста и насыщенности
 *    (linear(1.14,-18) + modulate 0.86/0.98) — с ней снимки были честными,
 *    но плоскими, «максимально обычными», как выразился заказчик.
 *    Нынешний грейд сильнее: контраст глубже, лёгкий тёплый цвет в кадре
 *    (будто зал освещён вечерним светом, а не люминесцентными лампами)
 *    и виньетка по краям, которая тянет взгляд к центру кадра. Красные
 *    канаты и перчатки от этого не блекнут, а становятся заметнее —
 *    в отличие от первой пробы с sharp .tint(), которая перекрашивала
 *    кадр целиком и съедала родные цвета зала.
 *
 * 2. Два размера. На статическом экспорте next/image не умеет резать
 *    картинки на лету (images.unoptimized), поэтому srcset собирается
 *    здесь руками: 480 px для плитки на телефоне, 960 px для десктопа.
 *    Больше 960 нет смысла — это разрешение исходников, апскейл добавил
 *    бы вес, но не детали.
 *
 * 3. WebP вместо JPEG — примерно на треть легче при том же качестве.
 *
 * 4. Крошечная размытая заглушка (blur-up) в base64. Пока фотография
 *    грузится, на её месте стоит не серая дыра, а размытое пятно
 *    правильного цвета. Заглушки печатаются в консоль — их нужно
 *    вставить в src/content.ts рядом с именем файла.
 *
 * Список отбирается вручную: снимать «всё подряд» на сайт нельзя,
 * половина кадров дублирует друг друга.
 */
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs/promises'

const SRC = process.argv[2]
if (!SRC) {
  console.error('Укажите папку с исходниками: node scripts/prepare-photos.mjs <папка>')
  process.exit(1)
}

const OUT = path.join(process.cwd(), 'public', 'gym')

/** Отобранные кадры: имя файла-исходника → имя на сайте. */
const PICKS = [
  ['614e4be5-a050-462e-9dd9-fb4b82385b69.JPG', 'bags-row'],
  ['1add1f8c-cb7a-421f-a897-af67a64cf288.JPG', 'bags-ring'],
  ['7c9089d4-b231-4e70-9d0e-0db544cfd5e1.JPG', 'ring-front'],
  ['00809951-8e32-4467-a1ec-fdc4b5bc1c4d.JPG', 'cardio'],
  ['4ca14e8d-42ce-4c00-b204-6d946fe5d01a.JPG', 'ring-training'],
  ['8261339e-f7e1-436e-87b6-72081e459dae.JPG', 'dummies'],
  ['79ce656d-4685-47ea-8bc8-eefd03f80cbf.JPG', 'hall'],
  ['778fff73-e99a-431d-9c73-34af888afccc.JPG', 'strength'],
]

/** Тёплый оверлей поверх кадра (soft-light, малая непрозрачность) —
 *  не sharp .tint(): tint полностью переопределяет цвет по яркости
 *  и на ярких акцентах (красные канаты, сине-оранжевые маты) съедает
 *  их в один тон. Оверлей — это цветной свет в кадре, а не перекраска. */
async function warmOverlay(buf) {
  const img = sharp(buf)
  const { width, height } = await img.metadata()
  const rect = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="#ff8a3d" fill-opacity="0.16"/>
    </svg>`,
  )
  return img.composite([{ input: rect, blend: 'soft-light' }]).toBuffer()
}

/** Радиальная виньетка — затемнение к углам кадра, не к центру. */
async function vignette(buf) {
  const img = sharp(buf)
  const { width, height } = await img.metadata()
  const grad = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <radialGradient id="v" cx="50%" cy="46%" r="75%">
          <stop offset="55%" stop-color="#000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0.4"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#v)"/>
    </svg>`,
  )
  return img.composite([{ input: grad, blend: 'multiply' }]).toBuffer()
}

/** Одна и та же обработка на все кадры — иначе галерея развалится
 *  на разные по тону картинки и перестанет читаться как один зал.
 *  Возвращает буфер полного разрешения — resize делается отдельно
 *  от него для каждого нужного размера, а не пересчитывает грейд
 *  заново на каждый размер. */
async function graded(file) {
  // Телефон пишет поворот в EXIF, а не в пиксели: без rotate() часть
  // кадров легла бы на бок.
  let buf = await sharp(file).rotate().linear(1.3, -46).modulate({ saturation: 0.92, brightness: 0.94 }).toBuffer()
  buf = await warmOverlay(buf)
  buf = await vignette(buf)
  return buf
}

await fs.mkdir(OUT, { recursive: true })

const manifest = []

for (const [src, name] of PICKS) {
  const file = path.join(SRC, src)
  const meta = await sharp(file).rotate().metadata()
  const full = await graded(file)

  for (const width of [480, 960]) {
    await sharp(full)
      .resize({ width, withoutEnlargement: true })
      .sharpen({ sigma: 0.7 })
      .webp({ quality: width === 480 ? 78 : 82 })
      .toFile(path.join(OUT, `${name}-${width}.webp`))
  }

  const blur = await sharp(full).resize({ width: 16 }).webp({ quality: 40 }).toBuffer()

  const stat = await fs.stat(path.join(OUT, `${name}-960.webp`))
  manifest.push({ name, width: meta.width, height: meta.height, kb: Math.round(stat.size / 1024) })

  console.log(`${name.padEnd(14)} ${meta.width}×${meta.height}  ${Math.round(stat.size / 1024)} КБ`)
  console.log(`  blur: data:image/webp;base64,${blur.toString('base64')}`)
}

const total = manifest.reduce((s, m) => s + m.kb, 0)
console.log(`\nГотово: ${manifest.length} кадров, ${total} КБ в максимальном размере.`)
