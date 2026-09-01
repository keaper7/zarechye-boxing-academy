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
          color: '#e8452e',
          fontSize: 132,
          fontWeight: 700,
          letterSpacing: -4,
        }}
      >
        Z
      </div>
    ),
    { width: 180, height: 180 },
  )
}
