import { content } from '@/content'
import { Reveal } from './Reveal'
import { SectionHead } from './SectionHead'

/**
 * Цен в открытых источниках нет, поэтому секция выключена флагом
 * `content.pricing.enabled`. Включить = проставить `true` и заполнить
 * `items` — вёрстка уже готова и ничего больше править не нужно.
 */
export function Pricing() {
  const { pricing } = content
  if (!pricing.enabled || pricing.items.length === 0) return null

  return (
    <section id="pricing" className="section shell">
      <SectionHead kicker={pricing.kicker} />
      <ul className="mt-14 grid gap-px bg-[var(--hair)] md:grid-cols-3">
        {pricing.items.map((item, i) => (
          <Reveal as="li" key={item.title} delay={0.08 * i} className="bg-ink p-[clamp(24px,2.4vw,40px)]">
            <h3 className="text-[clamp(18px,1.6vw,24px)] text-bone">{item.title}</h3>
            <p className="display mt-8 text-signal text-[clamp(36px,4vw,64px)]">{item.price}</p>
            <p className="body-text mt-4">{item.note}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
