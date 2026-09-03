'use client'

import { useEffect, useRef, useState } from 'react'
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
 * Лента едет вбок, а не лежит плиткой: восемь кадров подряд плиткой —
 * это уже почти всё, что можно увидеть на первом экране секции, а зал
 * должен разворачиваться постепенно, кадр за кадром, как при обходе.
 * Клик по любому кадру открывает то же фото крупно, с навигацией
 * стрелками, — простой лайтбокс без внешних библиотек.
 */
export function Gallery() {
  const { gallery } = content
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="gallery" className="section shell">
      <SectionHead kicker={gallery.kicker} title={gallery.title} />

      <Reveal>
        <Filmstrip items={gallery.items} onOpen={setOpenIndex} />
      </Reveal>

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
 * Лента с горизонтальным скроллом и снапом по кадрам. Высота кадра
 * привязана к высоте вьюпорта, а не к ширине колонки, — от этого лента
 * выглядит так же на любой ширине экрана и не сплющивается в полоску
 * на широком мониторе, как сплющилась бы плитка на 5–6 колонок.
 */
function Filmstrip({ items, onOpen }: { items: readonly Item[]; onOpen: (i: number) => void }) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [progress, setProgress] = useState(0)

  const updateEdges = () => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft >= max - 4)
    setProgress(max > 0 ? el.scrollLeft / max : 0)
  }

  useEffect(() => {
    updateEdges()
    // Меняется число кадров, помещающихся в ленту, — пересчитать края.
    const onResize = () => updateEdges()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current
    const card = el?.querySelector('li')
    if (!el || !card) return
    el.scrollBy({ left: dir * (card.clientWidth + 12), behavior: 'smooth' })
  }

  return (
    <div className="relative mt-14">
      <ul
        ref={trackRef}
        onScroll={updateEdges}
        className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 sm:gap-4"
      >
        {items.map((item, i) => (
          <li key={item.name} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => onOpen(i)}
              className="group relative block aspect-[3/4] h-[52svh] max-h-[540px] min-h-[280px] overflow-hidden bg-ink-2"
              aria-label={`Открыть фото: ${item.alt}`}
            >
              <Photo
                item={item}
                sizes="(max-width: 640px) 70vw, 420px"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
              />
              <span
                className="absolute inset-0 bg-ink opacity-0 transition-opacity duration-500 group-hover:opacity-10"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Тень по краям подсказывает, что лента едет дальше, ещё до того,
          как за неё потянули, — без этого первый экран секции выглядел
          бы как четыре законченных кадра, а не как начало ленты. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-ink to-transparent transition-opacity duration-300 sm:w-20 ${atStart ? 'opacity-0' : 'opacity-100'}`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ink to-transparent transition-opacity duration-300 sm:w-20 ${atEnd ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Стрелки раньше стояли под лентой в правом углу рядом с тонкой
          линией прогресса — там их было легко не заметить: угол, мелкий
          масштаб, вообще без визуального веса. Теперь они лежат прямо
          на кадрах, по центру высоты ленты, — как в обычной карусели:
          такую пару стрелок на фото замечаешь, даже не ища глазами
          элементы управления. На телефоне их по-прежнему нет — там
          лента листается свайпом, и стрелки поверх фото были бы лишним
          пальцем в кадре. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 hidden items-center justify-between px-2 sm:flex sm:px-4">
        <div className="pointer-events-auto">
          <NavButton dir="left" onClick={() => scrollByCard(-1)} disabled={atStart} />
        </div>
        <div className="pointer-events-auto">
          <NavButton dir="right" onClick={() => scrollByCard(1)} disabled={atEnd} />
        </div>
      </div>

      {/* Раньше здесь была заполняющаяся линия прогресса — тонкая полоска
          почти не читалась и не говорила ничего конкретного. Счётчик
          «01 / 08» — тот же приём, что и в лайтбоксе ниже, только для
          ленты целиком: понятно и сколько кадров всего, и где сейчас. */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <span className="h-px w-10 bg-[var(--hair)] sm:w-16" aria-hidden="true" />
        <span className="mono text-[var(--dim-2)]">
          {String(Math.round(progress * (items.length - 1)) + 1).padStart(2, '0')} /{' '}
          {String(items.length).padStart(2, '0')}
        </span>
        <span className="h-px w-10 bg-[var(--hair)] sm:w-16" aria-hidden="true" />
      </div>
    </div>
  )
}

/**
 * Кнопка лежит прямо на фотографии — фон под ней меняется от кадра
 * к кадру, поэтому заливка полупрозрачная с бэкдроп-блюром (читается
 * на любом фото, а не только на тёмных) и собственная тень, чтобы
 * не сливаться с краем кадра.
 */
function NavButton({ dir, onClick, disabled }: { dir: 'left' | 'right'; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'left' ? 'Прошлые фото' : 'Следующие фото'}
      className="flex h-12 w-12 items-center justify-center border border-[var(--hair-strong)] bg-ink/70 text-[19px] text-bone shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-colors duration-300 disabled:opacity-0 enabled:hover:border-signal enabled:hover:bg-signal"
    >
      {dir === 'left' ? '←' : '→'}
    </button>
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
