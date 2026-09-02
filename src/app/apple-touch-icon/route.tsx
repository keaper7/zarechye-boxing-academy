import { ImageResponse } from 'next/og'

// Статический экспорт рендерит эту картинку один раз при сборке.
export const dynamic = 'force-static'

/**
 * Иконка для экрана «Домой» на iOS.
 *
 * Обычный route handler, а не файл-конвенция `apple-icon.tsx`: та сама
 * генерирует и картинку, и <link> на неё, но на статическом экспорте
 * с basePath этот автосгенерированный <link> терял префикс подпути
 * (в отличие от favicon.svg и OG-картинки — там всё верно). Здесь
 * маршрут отдаёт только саму картинку; ссылка на неё прописана вручную
 * в src/app/layout.tsx через SITE_URL, абсолютным URL — так проблема
 * с префиксом не может возникнуть в принципе.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0b',
        }}
      >
        {/* Тот же знак, что и в src/app/icon.svg — перчатка кулаком вперёд,
            манжета с ремешком сзади. Тут просто вписан напрямую: у Satori
            (движок ImageResponse) нет доступа к внешним SVG-файлам. */}
        <svg width="128" height="128" viewBox="0 0 64 64" fill="none">
          <path fill="#f2efe9" d="M10 20.5 C10 18 11.5 16.5 14 16.5 L26.5 16.5 C27 11 34 7.5 42.5 7.5 C53.5 7.5 61 14.5 61 25 C61 32 57 37.6 51 40.6 C50.2 46.6 45.6 51 39.6 51 C33 51 28 46 28 39.6 L28 38.4 C25.8 37.4 24.6 36.4 24 35 L14 35 C11.5 35 10 33.5 10 31 Z" />
          <path d="M18 17.2 L18 34.3" stroke="#0a0a0b" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { width: 180, height: 180 },
  )
}
