import { content } from '@/content'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="shell pb-[clamp(28px,5vh,56px)]">
      <hr className="hair mb-8" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="mono text-[var(--dim-2)]">
          {content.brand.name}<span className="text-signal"> ·</span> {content.brand.area}
        </span>
        <span className="mono text-[var(--dim-2)]">© {year}</span>
      </div>
      {/* Стандартная подпись на всех сайтах SEVEN — та же формулировка
          и ссылка, что на kingstudio.sevensites.ru и publico.sevensites.ru.
          Подчёркивание здесь постоянное, а не по ховеру (как у .link-underline
          в остальном сайте): для футер-подписи это единственный способ
          сообщить, что текст кликабелен, — с телефона ховера не бывает. */}
      <p className="mono mt-4 text-[var(--dim-2)]">
        Дизайн и разработка —{' '}
        <a
          href="https://sevensites.ru"
          target="_blank"
          rel="noopener"
          className="text-signal underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70"
        >
          SEVEN
        </a>
      </p>
    </footer>
  )
}
