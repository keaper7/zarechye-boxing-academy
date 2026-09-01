import { ImageResponse } from 'next/og'
import { content } from '@/content'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = content.meta.ogAlt
// Статический экспорт рендерит эту картинку один раз при сборке и кладёт
// готовый PNG в out/ — без этой пометки next build отказывается собирать
// маршрут, не зная, что он не должен обслуживаться заново на каждый запрос.
export const dynamic = 'force-static'

/**
 * Картинка для соцсетей. Фотографий нет, поэтому она чисто типографическая —
 * и намеренно на латинице: встроенный шрифт ImageResponse не гарантирует
 * кириллицу, а подгружать веб-шрифт на каждый рендер OG ради подписи
 * из трёх слов не стоит того. Латинское имя бренда — это и есть ник аккаунта.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0a0a0b',
          color: '#f2efe9',
          padding: 72,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Тот же знак, что и в фавиконе (src/app/icon.svg) */}
          <svg width="60" height="60" viewBox="0 0 64 64" fill="#e8452e">
            <path d="M22 6 H42 C51 6 58 13 58 22 V34 C58 41 53 46 46 46 V56 C46 59 44 61 40 61 H28 C24 61 22 59 22 56 V46 C21 44 20 42 20 40 C16 41 11 40 8 37 C5 34 5 28 8 26 C10 24 12 23 14 23 C16 22 18 21 20 19 V12 C20 8 20 6 22 6 Z" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', height: 2, width: 240, background: 'rgba(242,239,233,0.28)' }} />
            <div style={{ display: 'flex', height: 2, width: 240, background: 'rgba(242,239,233,0.28)' }} />
            <div style={{ display: 'flex', height: 2, width: 240, background: 'rgba(242,239,233,0.28)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 128, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
            ZARECHYE
          </div>
          <div style={{ display: 'flex', fontSize: 128, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
            BOXING
          </div>
          <div style={{ display: 'flex', fontSize: 128, fontWeight: 700, letterSpacing: -4, lineHeight: 1, color: '#e8452e' }}>
            ACADEMY
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 26, letterSpacing: 3 }}>
          <div style={{ display: 'flex' }}>AYDAMIR TLINOV</div>
          <div style={{ display: 'flex', color: 'rgba(242,239,233,0.5)' }}>FIRST SESSION FREE</div>
        </div>
      </div>
    ),
    size,
  )
}
