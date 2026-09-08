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
              href={content.contact.coachHref}
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
          прижимались к низу портрета и оставляли посреди секции дыру.

          Раньше под каждой цифрой была одна короткая строка, и три
          колонки на sm (640px) хватало с запасом. Заказчик прислал
          на каждую цифру уже целый абзац — «МС» вдобавок с цитатой
          и ссылками на бои, — и втроём в ряд на планшетной ширине
          это просто не читалось бы. Три колонки теперь только с lg
          (1024px), а до того — одна колонка, стат под статом. */}
      <div className="mt-[clamp(48px,7vw,96px)]">
        <Reveal>
          <hr className="hair mb-10" />
        </Reveal>
        <dl className="grid gap-x-10 gap-y-14 lg:grid-cols-3">
          {coach.stats.map((s, i) => (
            <Reveal key={s.value} delay={0.08 * i}>
              <div>
                <dt className="display text-signal text-[clamp(44px,5.4vw,84px)]">{s.value}</dt>
                <dd className="mt-3 max-w-[38ch] text-[var(--dim)]">
                  <p className="text-[15px] font-medium text-bone">{s.title}</p>
                  {s.subtitle ? <p className="mt-1 text-[13px] text-[var(--dim-2)]">{s.subtitle}</p> : null}
                  {/* Цитата — не .mono: тот класс держит верхний регистр
                      и разрядку под короткие лейблы вроде ссылок ниже,
                      а живую фразу «Бокс — это не просто спорт» с ними
                      было бы неловко читать. Курсив и красная полоса
                      слева — тот же акцентный приём, что и у цитаты
                      в другом месте сайта. */}
                  {s.quote ? (
                    <p className="mt-5 border-l-2 border-signal pl-4 text-[16px] italic leading-snug text-bone">
                      «{s.quote}»
                    </p>
                  ) : null}
                  {s.body ? <p className="mt-5 text-[14px] leading-snug">{s.body}</p> : null}
                  {s.links.length > 0 ? (
                    <ul className="mt-5 space-y-2">
                      {s.links.map((l) => (
                        <li key={l.href}>
                          <a
                            href={l.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mono link-underline text-[12px] text-[var(--dim-2)] transition-colors hover:text-bone"
                          >
                            {l.label} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}
