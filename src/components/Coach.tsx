import { content } from '@/content'
import { MediaSlot } from './MediaSlot'
import { Reveal } from './Reveal'
import { SectionHead } from './SectionHead'

export function Coach() {
  const { coach } = content

  return (
    <section id="coach" className="section shell">
      <SectionHead kicker={coach.kicker} />

      <div className="mt-14 grid items-start gap-[var(--gutter)] lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)]">
        <Reveal>
          <MediaSlot src={coach.portrait} alt={`${coach.name} — тренер по боксу`} ratio="4 / 5" />
        </Reveal>

        <div>
          <Reveal>
            <h3 className="h-section">{coach.name}</h3>
          </Reveal>
          <Reveal delay={0.08}>
            <a
              href={content.contact.links[2].href}
              target="_blank"
              rel="noopener noreferrer"
              className="mono link-underline mt-6 inline-block text-[var(--dim-2)] transition-colors hover:text-bone"
            >
              {coach.handle}
            </a>
          </Reveal>

          <div className="mt-10 max-w-[58ch] space-y-5">
            {coach.bio.map((p, i) => (
              <Reveal key={i} delay={0.06 * i}>
                <p className="body-text">{p}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* Регалии вынесены под сетку во всю ширину: в правой колонке они
          прижимались к низу портрета и оставляли посреди секции дыру. */}
      <div className="mt-[clamp(48px,7vw,96px)]">
        <Reveal>
          <hr className="hair mb-10" />
        </Reveal>
        <dl className="grid gap-10 sm:grid-cols-3">
          {coach.stats.map((s, i) => (
            <Reveal key={s.value} delay={0.08 * i}>
              <div>
                <dt className="display text-signal text-[clamp(44px,5.4vw,84px)]">{s.value}</dt>
                <dd className="mt-3 max-w-[24ch] text-[14px] leading-snug text-[var(--dim)]">{s.label}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}
