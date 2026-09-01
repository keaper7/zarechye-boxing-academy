'use client'

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import { content } from '@/content'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'

/** Зацикливает значение в диапазоне [min, max) — для бесшовной ленты. */
function wrap(min: number, max: number, v: number) {
  const range = max - min
  return ((((v - min) % range) + range) % range) + min
}

/**
 * Лента слов, скорость и направление которой привязаны к скроллу:
 * стоите — она ползёт сама, крутите вниз — разгоняется, вверх — идёт назад.
 * Это единственное место, где сайт откровенно играет, и оно отделяет
 * блок «как это работает» от блока вопросов.
 */
export function Marquee() {
  const reduced = usePrefersReducedMotion()
  const words = content.marquee

  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 48, stiffness: 380 })
  // 1.0: изначальные 2.6 давали слишком быстрый бег даже без скролла,
  // слова не успевали прочитаться. 2.0 — потолок ускорения от скролла,
  // раньше было 3.5 и лента срывалась в нечитаемое мельтешение при
  // резком прокручивании.
  const factor = useTransform(smooth, [-1200, 1200], [-2, 2], { clamp: false })
  const direction = useMotionValue(1)

  useAnimationFrame((_, delta) => {
    if (reduced) return
    let moveBy = direction.get() * -1 * (delta / 1000)
    const f = factor.get()
    if (f < 0) direction.set(-1)
    else if (f > 0) direction.set(1)
    moveBy += moveBy * f
    baseX.set(baseX.get() + moveBy)
  })

  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`)

  const row = (
    <span className="flex shrink-0 items-center">
      {words.map((word, i) => (
        <span key={word + i} className="flex items-center">
          <span className="display px-[0.14em] text-[clamp(48px,9vw,150px)] text-bone">{word}</span>
          <span className="mx-[0.1em] h-[0.12em] w-[0.12em] shrink-0 rounded-full bg-signal" aria-hidden="true" />
        </span>
      ))}
    </span>
  )

  return (
    <div className="relative overflow-hidden border-y border-[var(--hair)] py-[clamp(24px,4vh,56px)]" aria-hidden="true">
      {reduced ? (
        <div className="flex px-[var(--pad)]">{row}</div>
      ) : (
        <motion.div className="flex w-max" style={{ x }}>
          {row}
          {row}
          {row}
          {row}
        </motion.div>
      )}
    </div>
  )
}
