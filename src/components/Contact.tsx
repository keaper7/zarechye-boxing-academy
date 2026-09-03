import { content } from '@/content'
import { Reveal } from './Reveal'
import { SectionHead } from './SectionHead'
import { MagneticButton } from './MagneticButton'

export function Contact() {
  const { contact } = content
  const [primary, ...rest] = contact.links

  return (
    <section id="contact" className="section shell">
      <SectionHead kicker={contact.kicker} plainKicker />

      <Reveal>
        <h2 className="h-section mt-14">{contact.title}</h2>
      </Reveal>

      <div className="mt-12 grid gap-[var(--gutter)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <div>
          <Reveal>
            <p className="lead max-w-[42ch] text-[var(--dim)]">
              {/* Ни рамки, ни своего шрифта, ни паддингов: любая
                  вставленная в строку «коробка» — другой line-height,
                  другой baseline — тут же подпрыгивает над текстом или
                  проваливается под него. Акцент — просто жирным и цветом,
                  прямо в шрифте абзаца: слово течёт вместе со строкой,
                  а кавычки честно показывают, что это цитата команды. */}
              Напишите «
              <strong className="font-bold text-signal">
                {content.hero.ctaNote.match(/«(.+?)»/)?.[1] ?? 'БОКС'}
              </strong>
              » в директ. Тренер ответит, задаст пару вопросов про уровень и подберёт время.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <MagneticButton
              href={primary.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative mt-10 inline-flex items-center gap-4 overflow-hidden border border-signal px-8 py-5"
            >
              <span className="absolute inset-0 -translate-x-full bg-signal transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-0" />
              <span className="mono relative text-bone">{primary.label}</span>
              <span className="relative text-signal transition-colors duration-500 group-hover:text-bone" aria-hidden="true">
                →
              </span>
            </MagneticButton>
          </Reveal>
        </div>

        <ul className="divide-y divide-[var(--hair)] border-y border-[var(--hair)]">
          {rest.map((link, i) => (
            <Reveal as="li" key={link.href + link.label} delay={0.06 * i}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-baseline justify-between gap-6 py-5"
              >
                <span className="text-[clamp(16px,1.4vw,20px)] text-bone">{link.label}</span>
                <span className="mono text-[var(--dim-2)] transition-colors duration-300 group-hover:text-signal">
                  {'handle' in link ? link.handle : ''} ↗
                </span>
              </a>
            </Reveal>
          ))}

          {/* Адрес и телефон — от заказчика, см. contact.place в content.ts.
              Это личный номер Айдамира, а не общий номер зала, поэтому
              подписан его именем — иначе неясно, кому звонишь. Телефон
              и «показать на карте» раньше были соседними inline-block без
              явного зазора и слипались в одну строку — теперь это ряд
              с фиксированным отступом. Встроенная карта — ниже, под всей
              сеткой, см. комментарий там. */}
          {contact.place.enabled && (
            <li className="py-5">
              <p className="mono text-[var(--dim-2)]">
                {contact.place.area} · {content.coach.name}
              </p>
              {contact.place.address ? <p className="mt-2 text-bone">{contact.place.address}</p> : null}

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                {contact.place.phone ? (
                  <a
                    href={`tel:${contact.place.phone.replace(/[^+\d]/g, '')}`}
                    className="link-underline text-bone"
                  >
                    {contact.place.phone}
                  </a>
                ) : null}
                {contact.place.mapUrl ? (
                  <a
                    href={contact.place.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono link-underline text-[var(--dim-2)] transition-colors hover:text-bone"
                  >
                    Показать на карте ↗
                  </a>
                ) : null}
              </div>
            </li>
          )}
        </ul>
      </div>

      {/* Карта — не внутри правой колонки: там она сделала бы список
          контактов заметно выше блока с текстом слева (проверено —
          на десктопе правая часть выходила на ~350px ниже левой), и
          получилось бы ровно то перекошенное соотношение, которого
          просили избежать. Здесь она на всю ширину, под сеткой, —
          иллюстрация к обеим колонкам сразу, а не довесок к одной. */}
      {contact.place.enabled && contact.place.mapEmbedUrl ? (
        <Reveal delay={0.1}>
          <div className="mt-10 overflow-hidden border border-[var(--hair-strong)]">
            <iframe
              src={contact.place.mapEmbedUrl}
              title={`Карта: ${contact.place.address}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-64 w-full sm:h-80"
            />
          </div>
        </Reveal>
      ) : null}
    </section>
  )
}
