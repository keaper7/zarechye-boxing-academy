'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * Инерционный скролл. Без него все reveal-анимации выглядят рвано:
 * нативный скролл в macOS даёт скачки в 40–120px, и маска текста
 * успевает «моргнуть» вместо того, чтобы проехать.
 *
 * Lenis не инициализируется вовсе при prefers-reduced-motion — перехват
 * колеса это тоже движение, навязанное пользователю.
 */
export function SmoothScroll() {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // На тач-устройствах нативная инерция лучше любой эмуляции
      syncTouch: false,
    })

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    // Якорные ссылки в шапке должны ехать через Lenis, а не прыгать
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      // Ссылке с data-native нужно родное поведение браузера: перехват
      // доскроллил бы до цели, но не перенёс бы на неё фокус, а для
      // skip-link перенос фокуса и есть весь смысл.
      if (anchor.dataset.native !== undefined) return
      const id = anchor.getAttribute('href')
      if (!id || id === '#') return
      const target = document.querySelector(id)
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target as HTMLElement, { offset: -24 })
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [reduced])

  return null
}
