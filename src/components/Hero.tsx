'use client'

import dynamic from 'next/dynamic'
import { useState, type CSSProperties } from 'react'
import { content } from '@/content'
import { MagneticButton } from './MagneticButton'

// Сцена трогает window и devicePixelRatio — на сервере ей делать нечего
const HeroCanvas = dynamic(() => import('./HeroCanvas').then((m) => m.HeroCanvas), { ssr: false })

/** Задержка входа — переменной, чтобы не плодить утилитарные классы. */
const at = (seconds: number) => ({ '--d': `${seconds}s` }) as CSSProperties

/**
 * Первый экран.
 *
 * Всё движение здесь — на CSS-анимациях, а не на motion. Motion пишет
 * стартовое `opacity: 0` прямо в серверную разметку: до гидратации
 * заголовок, лид и кнопка были бы невидимы, а это и LCP, и главный
 * текст страницы. CSS отрабатывает с первой же отрисовкой.
 */
export function Hero() {
  const { hero, brand, coach } = content
  const [punched, setPunched] = useState(false)

  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0">
        <HeroCanvas onPunch={() => setPunched(true)} />
      </div>

      {/* Интерактивный герой, о котором никто не догадался, — потраченная
          работа. Подсказка появляется с задержкой, чтобы не мешать входу
          заголовка, и гаснет насовсем после первого удара.

          Canvas слушает pointer-события, а не mouse — тап по мешку бьёт
          точно так же, как клик, так что подсказка нужна и на телефоне.
          Только стрелка «прицеливания» на курсор там не имеет смысла, и
          центр экрана — не центр мешка: pivotX в HeroCanvas вешает его
          на 62% ширины, а не на 50%, так что текст по центру всей ширины
          заходил под него. Слева, у того же отступа --pad, что и у
          остального текста этого экрана, — там мешка нет ни на одной
          ширине. На широких экранах раскладка не меняется: текст стоит
          справа со стрелкой, указывающей на мешок. */}
      {!punched && (
        <span
          className="fade-up mono pointer-events-none absolute left-[var(--pad)] top-[28%] flex items-center gap-3 text-[var(--dim-2)] lg:inset-x-auto lg:right-[var(--pad)] lg:left-auto"
          style={at(2.6)}
          aria-hidden="true"
        >
          <span className="hidden lg:inline" aria-hidden="true">←</span>
          Ударьте по мешку
        </span>
      )}

      {/* Затемнение под текстом: снизу на узких экранах, слева на широких.
          Без него светлая типографика тонет в световом пятне сцены. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(10,10,11,0.94) 0%, rgba(10,10,11,0.55) 34%, rgba(10,10,11,0) 62%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          background:
            'linear-gradient(100deg, rgba(10,10,11,0.95) 0%, rgba(10,10,11,0.72) 34%, rgba(10,10,11,0) 66%)',
        }}
      />

      <div className="pointer-events-none relative flex min-h-[100svh] flex-col justify-end px-[var(--pad)] pb-[clamp(24px,5svh,60px)] pt-[max(96px,16svh)]">
        <p className="mono fade-up text-[var(--dim)]" style={at(0.55)}>
          {hero.overline}
        </p>

        {/* Кегль ограничен и по высоте экрана: на ноутбуке 1280×720
            три строки по 13.4vw не помещались бы в первый экран, поэтому
            выше определённой ширины его перехватывает svh-предел — растёт
            только мобильный размер (см. комментарий у lead-абзаца ниже:
            той же правкой усиливали контраст между заголовком и текстом
            под ним). */}
        <h1 className="display mt-4 text-[clamp(48px,min(13.4vw,17svh),220px)]">
          {brand.latin.map((line, i) => (
            <span key={line} className="block overflow-clip pb-[0.12em] -mb-[0.12em]">
              <span className="rise-line" style={at(0.35 + i * 0.08)}>
                {line}
              </span>
            </span>
          ))}
          <span className="sr-only">{brand.nameRu}</span>
        </h1>

        <div className="mt-[clamp(20px,3.4svh,40px)] flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-7">
          {/* На телефоне это была `.lead` (17–23px, line-height 1.45) —
              тот же класс, что и у второстепенных абзацев в Contact/Process.
              Тут это не второстепенный текст, а единственная строка, которая
              объясняет, что за зал, — а из-за узкой ширины экрана она ещё
              и переносится на три строки. При этом кнопка ниже набрана
              заглавными и в рамке, и на маленьком экране рядом с некрупным
              приглушённым текстом она читалась крупнее и весомее, чем
              главная мысль над ней. Здесь текст плотнее по строкам, а
              заголовок над ним — на пункт крупнее (см. h1 выше): так
              граница между «главным» и «поясняющим» текстом читается
              яснее, чем если оба тянуть к одному размеру. На десктопе —
              тот же класс `.lead`, что и раньше: там абзац и кнопка уже
              стоят в один визуальный ряд, а не друг под другом. */}
          <p className="fade-up max-w-[46ch] text-[clamp(18px,4.1vw,23px)] leading-[1.35] text-[var(--dim)] lg:text-[clamp(17px,1.55vw,23px)] lg:leading-[1.45]" style={at(0.8)}>
            {hero.lead}
          </p>

          <div className="fade-up pointer-events-auto flex flex-col items-start gap-3" style={at(0.95)}>
            <MagneticButton
              href={content.contact.directHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-4 overflow-hidden border border-signal px-6 py-3.5 lg:px-7 lg:py-4"
            >
              <span className="absolute inset-0 -translate-x-full bg-signal transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-0" />
              <span className="mono relative text-bone">{hero.cta}</span>
              <span className="relative text-signal transition-colors duration-500 group-hover:text-bone" aria-hidden="true">
                →
              </span>
            </MagneticButton>
            <span className="mono text-[var(--dim-2)]">{hero.ctaNote}</span>
          </div>
        </div>

        <div
          className="fade-up mt-[clamp(20px,3.6svh,48px)] flex items-center justify-between gap-6 border-t border-[var(--hair)] pt-5"
          style={at(1.15)}
        >
          <span className="mono text-[var(--dim-2)]">{coach.name} — мастер спорта России</span>
          <span className="mono hidden items-center gap-3 text-[var(--dim-2)] sm:flex">
            {hero.scrollHint}
            <span className="hint-line block h-px w-10 bg-[var(--dim-2)]" aria-hidden="true" />
          </span>
        </div>
      </div>
    </section>
  )
}
