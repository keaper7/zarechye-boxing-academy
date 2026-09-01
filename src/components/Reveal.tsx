'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Единственная reveal-обёртка на весь сайт. Одна кривая, одна дистанция,
 * один порог срабатывания — движение читается как система, а не как
 * набор разных эффектов, налепленных секция за секцией.
 */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'li' | 'section' | 'span'
}) {
  const reduced = usePrefersReducedMotion()
  const Tag = motion[as] as typeof motion.div

  return (
    <Tag
      data-reveal=""
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduced ? 0.2 : 0.9, ease: EASE, delay: reduced ? 0 : delay }}
    >
      {children}
    </Tag>
  )
}
