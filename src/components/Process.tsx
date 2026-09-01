'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { content } from '@/content'
import { Reveal } from './Reveal'
import { SectionHead } from './SectionHead'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'

export function Process() {
  const { process } = content
  const wide = useMediaQuery('(min-width: 1024px)')
  const reduced = usePrefersReducedMotion()
  const pinned = wide && !reduced

  return (
    <section id="process" className="section pb-0">
      <div className="shell">
        <SectionHead kicker={process.kicker} />

        {/* Единственное обещание с цифрами на сайте — и оно снабжено оговоркой.
            Обещать «минус 10 кг» без «зависит от режима» было бы враньём. */}
        <div className="mt-14 grid gap-[var(--gutter)] lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end">
          <Reveal>
            <p className="display flex items-baseline gap-3 text-[clamp(72px,11vw,180px)]">
              <span className="text-signal">−</span>
              <span>{process.claim.value}</span>
              <span className="text-[0.36em] text-[var(--dim)]">{process.claim.unit}</span>
            </p>
            <p className="mono mt-2 text-[var(--dim-2)]">{process.claim.period}</p>
          </Reveal>

          <div className="lg:pb-4">
            {/* Без бейджа с повтором «первая тренировка бесплатно»: та же
                фраза — заголовок блока Contact ниже, и раннее появление
                здесь сажает силу этой кульминации. Раздел заканчивается
                на claimNote — и не нуждается в довеске. */}
            <Reveal delay={0.1}>
              <p className="lead max-w-[46ch] text-[var(--dim)]">{process.claimNote}</p>
            </Reveal>
          </div>
        </div>
      </div>

      {pinned ? <PinnedSteps /> : <StackedSteps />}
    </section>
  )
}

/** Десктоп: шаги едут вбок, пока страница прокручивается вниз. */
function PinnedSteps() {
  const { steps } = content.process
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)

  // Сколько именно нужно проехать, известно только после раскладки шрифтов
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => setDistance(Math.max(0, track.scrollWidth - window.innerWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(track)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance])
  const progress = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <div
      ref={wrapRef}
      className="relative mt-16"
      /* Высота = экран + ровно тот путь, который нужно проехать вбок.
         Фиксированные «42vh на шаг» давали 2900px прокрутки ради
         96px хода на широком мониторе — секция стояла на месте. */
      style={{ height: `calc(100svh + ${Math.round(distance)}px)` }}
    >
      {/* Раньше здесь было h-[100svh] + justify-center: карточки
          центрировались по всей высоте экрана, а кикер стоял отдельным
          блоком выше — между ними разъезжался пустой экран. Кикер теперь
          часть закреплённой сцены (виден весь горизонтальный скролл, а
          не уезжает вверх за секунду), а сцена держится у верхнего края
          отступом, а не центрируется в проём высотой с целый вьюпорт. */}
      <div className="sticky top-28 overflow-hidden">
        <div className="shell">
          <div className="flex items-baseline gap-4 text-[var(--dim-2)]">
            <span className="mono">{content.process.stepsKicker}</span>
            <span className="h-px flex-1 bg-[var(--hair)] translate-y-[-4px]" />
          </div>
        </div>

        {/* Разделители — на самих карточках, а не подложкой дорожки:
            подложка проступала сплошной полосой в боковых отступах. */}
        <motion.div ref={trackRef} style={{ x }} className="mt-12 flex w-max px-[var(--pad)]">
          {steps.map((s) => (
            <article
              key={s.title}
              className="w-[clamp(420px,32vw,760px)] shrink-0 border-l border-[var(--hair)] bg-ink px-[clamp(24px,2.2vw,44px)] py-[clamp(40px,5vw,72px)] first:border-l-0"
            >
              <h3 className="display text-[clamp(32px,3.6vw,58px)]">{s.title}</h3>
              <p className="body-text mt-5 max-w-[42ch]">{s.body}</p>
            </article>
          ))}
        </motion.div>

        {/* Прогресс в виде каната: видно, сколько шагов осталось */}
        <div className="mx-[var(--pad)] mt-14 h-px bg-[var(--hair)]">
          <motion.div className="h-px bg-signal" style={{ width: progress }} />
        </div>
      </div>
    </div>
  )
}

/** Мобильные и prefers-reduced-motion: те же шаги, обычным списком. */
function StackedSteps() {
  const { steps } = content.process

  return (
    <>
      <div className="shell mt-16">
        <div className="flex items-baseline gap-4 text-[var(--dim-2)]">
          <span className="mono">{content.process.stepsKicker}</span>
          <span className="h-px flex-1 bg-[var(--hair)] translate-y-[-4px]" />
        </div>
      </div>
      <ol className="shell mt-8 grid gap-px bg-[var(--hair)] sm:grid-cols-2">
      {steps.map((s, i) => (
        <Reveal as="li" key={s.title} delay={0.06 * i} className="bg-ink px-[clamp(20px,3vw,40px)] py-[clamp(28px,4vw,48px)]">
          <h3 className="display text-[clamp(28px,5vw,44px)]">{s.title}</h3>
          <p className="body-text mt-4">{s.body}</p>
        </Reveal>
      ))}
      </ol>
    </>
  )
}
