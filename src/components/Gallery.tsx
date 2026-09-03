'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { content } from '@/content'
import { Reveal } from './Reveal'
import { SectionHead } from './SectionHead'

const EASE = [0.16, 1, 0.3, 1] as const

// Сайт живёт в подпути (username.github.io/repo), и путь к файлу
// в public/ приходится писать с этим префиксом вручную: подставить
// его сам умеет только next/image, а здесь обычный <img>. Значение
// приходит из next.config.ts, в dev оно пустое.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

type Item = (typeof content.gallery.items)[number]

/**
 * Фотографии зала — от заказчика напрямую, не из Instagram и не сток.
 * Качество не студийное (снято на телефон), но это и есть зал, а не
 * его рекламная картинка — для сайта спортивного клуба это честнее.
 *
 * Здесь обычный <img>, а не next/image. На статическом экспорте стоит
 * images.unoptimized, и next/image в этом режиме не режет картинки и
 * не собирает srcset — атрибут sizes у него превращается в пустой звук,
 * а телефон качает полноразмерный файл. Свой srcset из двух заранее
 * подготовленных размеров честнее и втрое легче на мобильном.
 *
 * Сетка кликабельна и открывает то же фото крупно, с навигацией
 * стрелками, — простой лайтбокс без внешних библиотек.
 */
export function Gallery() {
  const { gallery } = content
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="gallery" className="section shell">
      <SectionHead kicker={gallery.kicker} title={gallery.title} />

      <ul className="mt-14 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {gallery.items.map((item, i) => (
          <Reveal as="li" key={item.name} delay={0.05 * i}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group relative block aspect-[3/4] w-full overflow-hidden bg-ink-2"
              aria-label={`Открыть фото: ${item.alt}`}
            >
              <Photo
                item={item}
                sizes="(max-width: 768px) 50vw, 25vw"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
              />
              <span
                className="absolute inset-0 bg-ink opacity-0 transition-opacity duration-500 group-hover:opacity-10"
                aria-hidden="true"
              />
            </button>
          </Reveal>
        ))}
      </ul>

      {openIndex !== null && (
        <Lightbox
          items={gallery.items}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onChange={setOpenIndex}
        />
      )}
    </section>
  )
}

/**
 * Размытая заглушка стоит фоном под самой картинкой: пока файл летит,
 * на его месте прямоугольник нужного цвета, а не тёмная дыра. Когда
 * фото загрузилось, оно просто перекрывает фон собой.
 */
function Photo({
  item,
  sizes,
  className,
  priority = false,
}: {
  item: Item
  sizes: string
  className?: string
  priority?: boolean
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- см. комментарий у Gallery
    <img
      src={`${BASE}/gym/${item.name}-960.webp`}
      srcSet={`${BASE}/gym/${item.name}-480.webp 480w, ${BASE}/gym/${item.name}-960.webp 960w`}
      sizes={sizes}
      width={item.width}
      height={item.height}
      alt={item.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      style={{
        backgroundImage: `url(${item.blur})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  )
}

function Lightbox({
  items,
  index,
  onClose,
  onChange,
}: {
  items: readonly Item[]
  index: number
  onClose: () => void
  onChange: (i: number) => void
}) {
  const prev = () => onChange((index - 1 + items.length) % items.length)
  const next = () => onChange((index + 1) % items.length)

  // Пока лайтбокс открыт, страница за ним не должна скроллиться —
  // иначе стрелка/скролл-жест на телефоне листает сайт под фото.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const item = items[index]

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={item.alt}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/96 p-[var(--pad)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        onClick={onClose}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-[var(--pad)] top-[var(--pad)] text-[28px] leading-none text-bone transition-opacity hover:opacity-60"
          aria-label="Закрыть"
        >
          ×
        </button>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                prev()
              }}
              className="absolute left-[max(12px,var(--pad))] top-1/2 -translate-y-1/2 text-[32px] leading-none text-bone transition-opacity hover:opacity-60"
              aria-label="Предыдущее фото"
            >
              ←
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
              className="absolute right-[max(12px,var(--pad))] top-1/2 -translate-y-1/2 text-[32px] leading-none text-bone transition-opacity hover:opacity-60"
              aria-label="Следующее фото"
            >
              →
            </button>
          </>
        )}

        <motion.div
          key={item.name}
          className="flex h-[min(80svh,900px)] w-full max-w-[720px] items-center justify-center"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: EASE }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Исходники — 960 px по длинной стороне, тянуть их на весь экран
              нечем: выше этой ширины картинка начинает мылиться. */}
          <Photo item={item} sizes="720px" priority className="h-full w-auto max-w-full object-contain" />
        </motion.div>

        <span className="mono absolute bottom-[var(--pad)] left-1/2 -translate-x-1/2 text-[var(--dim-2)]">
          {index + 1} / {items.length}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}
