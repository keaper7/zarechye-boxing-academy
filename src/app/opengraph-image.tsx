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
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Тот же знак, что и в фавиконе (src/app/icon.svg): перчатка
              кулаком вперёд, манжета с ремешком сзади. Горизонтальная
              посадка — так силуэт держит форму на любом размере, в отличие
              от прежних вертикальных вариантов, которые на мелких иконках
              превращались в нечитаемое пятно. */}
          <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
            <path fill="#f2efe9" d="M10 20.5 C10 18 11.5 16.5 14 16.5 L26.5 16.5 C27 11 34 7.5 42.5 7.5 C53.5 7.5 61 14.5 61 25 C61 32 57 37.6 51 40.6 C50.2 46.6 45.6 51 39.6 51 C33 51 28 46 28 39.6 L28 38.4 C25.8 37.4 24.6 36.4 24 35 L14 35 C11.5 35 10 33.5 10 31 Z" />
            <path d="M18 17.2 L18 34.3" stroke="#0a0a0b" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
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
