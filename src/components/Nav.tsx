'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { content } from '@/content'

/**
 * Шапка прячется при скролле вниз и возвращается при скролле вверх:
 * на длинном лендинге постоянная панель съедает высоту первого экрана,
 * а нужна она ровно в тот момент, когда человек решил вернуться.
 */
export function Nav() {
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)
  const [active, setActive] = useState('')

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setSolid(y > 24)
    setHidden(y > prev && y > 220)
  })

  /**
   * Активный раздел. Поля обзора сужены до узкой полосы по центру экрана:
   * так «текущей» всегда оказывается ровно одна секция — та, что сейчас
   * перед глазами, — и подсветка не прыгает между двумя соседними.
   */
  useEffect(() => {
    const els = content.nav
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null)
    if (els.length === 0) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Через функциональный setState, а не через сравнение с active:
          // колбэк создаётся один раз и захватил бы первое значение
          // навсегда, так что подсветка никогда бы не гасла.
          if (entry.isIntersecting) setActive(entry.target.id)
          else setActive((cur) => (cur === entry.target.id ? '' : cur))
        }
      },
      { rootMargin: '-48% 0px -48% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      animate={{ y: hidden ? '-110%' : '0%' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={`flex items-center justify-between gap-6 px-[var(--pad)] py-4 transition-colors duration-500 ${
          solid ? 'bg-[rgba(10,10,11,0.72)] backdrop-blur-md' : ''
        }`}
      >
        <a href="#top" className="mono text-bone whitespace-nowrap">
          Zarechye<span className="text-signal"> ·</span> Boxing
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Разделы">
          {content.nav.map((item) => {
            const isActive = active === item.href.slice(1)
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'true' : undefined}
                className={`mono group transition-colors duration-300 ${
                  isActive ? 'text-bone' : 'text-[var(--dim)] hover:text-bone'
                }`}
              >
                {/* Одна черта на оба состояния — и активное, и наведение.
                    Отдельное подчёркивание из .link-underline легло бы
                    рядом со смещением в пару пикселей. */}
                <span className="relative">
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-[5px] left-0 h-px w-full origin-left bg-signal transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100 ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </span>
              </a>
            )
          })}
        </nav>

        <a
          href={content.contact.links[0].href}
          target="_blank"
          rel="noopener noreferrer"
          className="mono border border-[var(--hair-strong)] px-4 py-2 text-bone transition-colors duration-300 hover:border-signal hover:bg-signal"
        >
          Записаться
        </a>
      </div>
      <div className={`h-px w-full transition-opacity duration-500 ${solid ? 'bg-[var(--hair)] opacity-100' : 'opacity-0'}`} />
    </motion.header>
  )
}
