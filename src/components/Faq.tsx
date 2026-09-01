'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { content } from '@/content'
import { Reveal } from './Reveal'
import { SectionHead } from './SectionHead'

const EASE = [0.16, 1, 0.3, 1] as const

export function Faq() {
  const { faq } = content
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="section shell">
      <SectionHead kicker={faq.kicker} title={faq.title} />

      <ul className="mt-14 border-t border-[var(--hair)]">
        {faq.items.map((item, i) => {
          const isOpen = open === i
          const panelId = `faq-panel-${i}`
          const buttonId = `faq-button-${i}`

          return (
            <Reveal as="li" key={item.q} delay={0.04 * i} className="border-b border-[var(--hair)]">
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="group flex w-full items-start justify-between gap-8 py-6 text-left"
                >
                  <span
                    className={`text-[clamp(18px,2vw,28px)] leading-tight transition-colors duration-300 ${
                      isOpen ? 'text-bone' : 'text-[var(--dim)] group-hover:text-bone'
                    }`}
                  >
                    {item.q}
                  </span>
                  {/* Плюс, который поворачивается в минус */}
                  <span className="relative mt-2 block h-3 w-3 shrink-0" aria-hidden="true">
                    <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-signal" />
                    <span
                      className={`absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-signal transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
                        isOpen ? 'rotate-90 scale-y-0' : ''
                      }`}
                    />
                  </span>
                </button>
              </h3>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.55, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="body-text max-w-[68ch] pb-7 pr-10">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Reveal>
          )
        })}
      </ul>
    </section>
  )
}
