import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Manrope, Oswald } from 'next/font/google'
import { SITE_URL, content } from '@/content'
import { Preloader } from '@/components/Preloader'
import { Nav } from '@/components/Nav'
import { JsonLd } from '@/components/JsonLd'
import { SmoothScroll } from '@/lib/SmoothScroll'
import './globals.css'

// Кириллица обязательна: без сабсета Next подгрузит только латиницу,
// и весь русский текст свалится на системный шрифт.
const oswald = Oswald({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '700'],
  variable: '--font-manrope',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['500'],
  variable: '--font-mono-ui',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: content.meta.title,
  description: content.meta.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: SITE_URL,
    siteName: content.brand.name,
    title: content.meta.title,
    description: content.meta.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: content.meta.title,
    description: content.meta.description,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0b',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${oswald.variable} ${manrope.variable} ${mono.variable}`}>
      <head>
        {/* Страница всегда открывается сверху: браузер иначе вернёт человека
            в середину лендинга — под шторку прелоадера. Скрипт стоит здесь,
            а не в компоненте: значение должно быть выставлено до первого кадра. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('scrollRestoration' in history) history.scrollRestoration='manual'`,
          }}
        />
      </head>
      <body>
        <Preloader />
        <SmoothScroll />
        {/* Видна только с клавиатуры: первым Tab'ом можно перескочить
            шапку и уйти сразу в контент. */}
        <a
          href="#main"
          data-native=""
          className="sr-only focus:not-sr-only focus:fixed focus:left-[var(--pad)] focus:top-4 focus:z-[70] focus:border focus:border-signal focus:bg-ink focus:px-4 focus:py-2 focus:text-bone"
        >
          К содержанию
        </a>
        <Nav />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <div className="grain" aria-hidden="true" />
        <JsonLd />
      </body>
    </html>
  )
}
