import { content } from '@/content'
import { Reveal } from './Reveal'
import { SectionHead } from './SectionHead'

export function Programs() {
  const { programs } = content

  return (
    <section id="programs" className="section shell">
      <SectionHead kicker={programs.kicker} title={programs.title} />

      <ul className="mt-16 grid gap-px bg-[var(--hair)] md:grid-cols-3">
        {programs.items.map((item, i) => (
          <Reveal as="li" key={item.title} delay={0.09 * i} className="group relative bg-ink">
            <div className="relative flex h-full flex-col overflow-hidden bg-ink p-[clamp(24px,2.4vw,40px)] transition-colors duration-500 group-hover:bg-ink-2">
              {/* Полоска-акцент проявляется на наведении — тихая деталь,
                  без отдельной иконки поверх карточки. */}
              <span
                className="block h-px w-8 origin-left scale-x-0 bg-signal transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100"
                aria-hidden="true"
              />

              <h3 className="display mt-8 text-[clamp(30px,3.4vw,52px)] transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-1">
                {item.title}
              </h3>
              <p className="mt-4 text-[clamp(15px,1.1vw,18px)] leading-snug text-bone">{item.summary}</p>
              <p className="body-text mt-4 max-w-[38ch]">{item.body}</p>

              {/* Раньше здесь стоял ряд из трёх слов-тегов — по виду
                  метки, а сравнить карточки между собой по ним было
                  нельзя: у каждой карточки свой независимый набор слов.
                  Одна метка формата — то, что действительно отличает
                  «Персонально» от двух других карточек, — и «Индивидуальная»
                  выделена акцентом: так разница видна сразу по всему ряду
                  карточек, а не только из текста внутри одной из них. */}
              <div className="mt-auto pt-6">
                <span
                  className={`mono inline-block border px-3 py-1.5 ${
                    item.individual ? 'border-signal text-signal' : 'border-[var(--hair)] text-[var(--dim-2)]'
                  }`}
                >
                  {item.format}
                </span>
              </div>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
