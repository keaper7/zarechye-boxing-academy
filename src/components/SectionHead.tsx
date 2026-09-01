import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

/**
 * Шапка секции: кикер и заголовок. Одна разметка на все секции.
 *
 * Заголовком второго уровня становится либо `title`, либо — если его нет —
 * сам кикер. Иначе после <h1> в герое шли бы сразу <h3> (имя тренера,
 * названия шагов), и структура страницы для скринридера разваливалась бы
 * на куски без общего заголовка. Внешне ничего не меняется: кикер
 * стилизован одинаково и как span, и как h2.
 */
export function SectionHead({
  kicker,
  title,
  plainKicker = false,
  className,
}: {
  kicker: string
  title?: ReactNode
  /** Секция рисует собственный <h2> ниже — тогда кикер остаётся span. */
  plainKicker?: boolean
  className?: string
}) {
  const KickerTag = title || plainKicker ? 'span' : 'h2'

  return (
    <div className={className}>
      <Reveal>
        <div className="flex items-baseline gap-4 text-[var(--dim-2)]">
          <KickerTag className="mono">{kicker}</KickerTag>
          <span className="h-px flex-1 bg-[var(--hair)] translate-y-[-4px]" />
        </div>
      </Reveal>
      {title ? (
        <Reveal delay={0.08}>
          <h2 className="h-section mt-7 max-w-[16ch]">{title}</h2>
        </Reveal>
      ) : null}
    </div>
  )
}
