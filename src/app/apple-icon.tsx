import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/**
 * Иконка для экрана «Домой» на iOS.
 *
 * Генерируется кодом, а не лежит файлом: конвенция `apple-icon` в Next
 * принимает только png/jpg, а SVG молча игнорирует — положенный рядом
 * apple-icon.svg просто отдавал 404.
 */
export default function AppleIcon() {
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
    size,
  )
}
