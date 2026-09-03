import { content } from '@/content'
import { Reveal } from './Reveal'
import { SectionHead } from './SectionHead'

/**
 * Расписание — со стенда в зале, от заказчика. Секция всё ещё выключается
 * флагом `content.schedule.enabled`, на случай если расписание сменится
 * быстрее, чем кто-то успеет поправить сайт.
 *
 * Раскладка каждого дня — время и группа рядом, а не одной строкой через
 * «·»: с тремя группами в один день (Пн/Ср/Пт) склеенная строка моно-шрифтом
 * читалась тяжело. Так время и группа держат общую линию по каждому дню.
 */
export function Schedule() {
  const { schedule } = content
  // Только флаг: content.ts помечен `as const`, поэтому длина массива —
  // литеральный тип, и проверка на пустоту для TypeScript недостижима.
  if (!schedule.enabled) return null

  return (
    <section id="schedule" className="section shell">
      <SectionHead kicker={schedule.kicker} />
      <ul className="mt-14 grid gap-px bg-[var(--hair)] md:grid-cols-3">
        {schedule.days.map((day, i) => (
          <Reveal as="li" key={day.day} delay={0.08 * i} className="bg-ink p-[clamp(24px,2.4vw,36px)]">
            <h3 className="display text-[clamp(22px,2vw,30px)]">{day.day}</h3>
            <ul className="mt-6 space-y-4">
              {day.slots.map((slot) => (
                <li key={slot.time} className="border-t border-[var(--hair)] pt-4 first:border-t-0 first:pt-0">
                  <span className="mono block text-signal">{slot.time}</span>
                  <span className="mt-1 block text-[clamp(15px,1.1vw,17px)] text-bone">{slot.group}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
