import { ImageResponse } from 'next/og'
import { content } from '@/content'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = content.meta.ogAlt

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', width: 8, height: 56, background: '#e8452e' }} />
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
