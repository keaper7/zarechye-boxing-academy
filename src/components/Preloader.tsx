'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { motion } from 'motion/react'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'

const COUNT_MS = 1150
const KEY = 'zba:seen'

// useLayoutEffect на сервере не существует; нам он нужен только в браузере,
// зато там — обязательно: решение «показывать отсчёт или нет» должно быть
// принято до первой отрисовки, иначе шторка успеет моргнуть.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type Mode = 'idle' | 'count' | 'gone'

/**
 * Отсчёт рефери 1→10, после которого шторка уходит вверх.
 *
 * Взято не ради «загрузки» (грузить особо нечего), а ради ритма: сайт
 * начинается с узнаваемого жеста из бокса, и герой открывается на пустой
 * странице, а не догоняет пользователя посреди скролла.
 *
 * Показывается один раз за сессию: на второй заход отсчёт — уже помеха.
 * Проверка sessionStorage живёт в эффекте, а не в рендере: иначе сервер
 * и клиент разошлись бы на первом кадре.
 *
 * Здесь намеренно нет AnimatePresence. Когда отсчёт нужно пропустить,
 * шторка должна исчезнуть простым размонтированием — анимация выхода
 * потребовала бы requestAnimationFrame, а он не вызывается, пока вкладка
 * в фоне, и шторка залипала бы поверх страницы.
 */
export function Preloader() {
  const reduced = usePrefersReducedMotion()
  const [mode, setMode] = useState<Mode>('idle')
  const [lift, setLift] = useState(false)
  const [n, setN] = useState(1)

  useIsoLayoutEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(KEY) === '1'
    } catch {
      // приватный режим — просто покажем отсчёт
    }
    setMode(seen || reduced ? 'gone' : 'count')
  }, [reduced])

  useEffect(() => {
    if (mode !== 'count') return

    document.body.dataset.locked = 'true'
    const start = performance.now()
    let raf = 0

    const finish = () => {
      window.clearTimeout(failsafe)
      cancelAnimationFrame(raf)
      try {
        sessionStorage.setItem(KEY, '1')
      } catch {
        /* игнорируем */
      }
      delete document.body.dataset.locked
      setLift(true)
    }

    // Страховка: в фоновой вкладке requestAnimationFrame не вызывается вовсе,
    // и без таймера отсчёт замер бы на «01», а страница осталась бы
    // заблокированной под шторкой до момента, когда вкладку откроют.
    const failsafe = window.setTimeout(finish, COUNT_MS + 400)

    const tick = (now: number) => {
      const p = Math.min((now - start) / COUNT_MS, 1)
      // ease-out: первые цифры летят, последние «вбиваются»
      const eased = 1 - Math.pow(1 - p, 2.1)
      setN(Math.max(1, Math.round(eased * 10)))
      if (p < 1) raf = requestAnimationFrame(tick)
      else finish()
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(failsafe)
      delete document.body.dataset.locked
    }
  }, [mode])

  if (mode === 'gone') return null

  return (
    <motion.div
      /* Снимается через CSS при (scripting: none) — см. globals.css.
         Шторка попадает и в серверную разметку, а убрать её умеет только
         скрипт: без этого страница без JS была бы пустым тёмным экраном. */
      data-preloader=""
      className="fixed inset-0 z-[80] flex items-end justify-between bg-ink px-[var(--pad)] pb-[max(var(--pad),40px)]"
      initial={{ y: '0%' }}
      animate={{ y: lift ? '-101%' : '0%' }}
      transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => {
        if (lift) setMode('gone')
      }}
      aria-hidden="true"
    >
      <span className="mono text-[var(--dim)]">Заречье · Академия бокса</span>
      <span className="display text-signal text-[clamp(72px,16vw,220px)] leading-[0.8] tabular-nums">
        {String(n).padStart(2, '0')}
      </span>
    </motion.div>
  )
}
