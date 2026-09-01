import { content } from '@/content'
import { Reveal } from './Reveal'
import { SectionHead } from './SectionHead'

/**
 * Расписания в открытых источниках нет — секция выключена флагом
 * `content.schedule.enabled`. Разметка ждёт данных.
 */
export function Schedule() {
  const { schedule } = content
  if (!schedule.enabled || schedule.days.length === 0) return null

  return (
    <section id="schedule" className="section shell">
      <SectionHead kicker={schedule.kicker} />
      <ul className="mt-14 border-t border-[var(--hair)]">
        {schedule.days.map((day, i) => (
          <Reveal as="li" key={day.day} delay={0.05 * i} className="flex flex-wrap items-baseline gap-x-10 gap-y-2 border-b border-[var(--hair)] py-5">
            <span className="display w-40 text-[clamp(20px,2vw,30px)]">{day.day}</span>
            <span className="mono text-[var(--dim)]">{day.slots.join(' · ')}</span>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
