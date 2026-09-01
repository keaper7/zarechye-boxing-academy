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
        {/* Тот же контур перчатки, что и в src/app/icon.svg — тут просто
            вписан напрямую, у Satori (движок ImageResponse) нет доступа
            к внешним SVG-файлам. */}
        <svg width="108" height="108" viewBox="0 0 64 64" fill="#e8452e">
          <path d="M22 6 H42 C51 6 58 13 58 22 V34 C58 41 53 46 46 46 V56 C46 59 44 61 40 61 H28 C24 61 22 59 22 56 V46 C21 44 20 42 20 40 C16 41 11 40 8 37 C5 34 5 28 8 26 C10 24 12 23 14 23 C16 22 18 21 20 19 V12 C20 8 20 6 22 6 Z" />
        </svg>
      </div>
    ),
    { width: 180, height: 180 },
  )
}
