import type { MetadataRoute } from 'next'
import { SITE_URL, content } from '@/content'

// См. комментарий в opengraph-image.tsx — то же требование статического экспорта.
export const dynamic = 'force-static'

/**
 * Манифест для Android: там, где iOS берёт apple-touch-icon, Chrome ждёт
 * manifest.webmanifest — без него сайт, сохранённый на домашний экран,
 * получает обрезанный скриншот вместо знака и адрес вместо названия.
 *
 * Пути к иконкам заданы абсолютными через SITE_URL: сайт живёт в подпути
 * (username.github.io/repo), а относительный «/icon.svg» в манифесте
 * указывал бы в корень домена и ловил 404 — ровно та же ловушка, из-за
 * которой apple-touch-icon пришлось прописывать вручную.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: content.meta.title,
    short_name: content.brand.shortName,
    description: content.meta.description,
    lang: 'ru',
    start_url: `${SITE_URL}/`,
    display: 'standalone',
    background_color: '#0a0a0b',
    theme_color: '#0a0a0b',
    icons: [
      { src: `${SITE_URL}/icon.svg`, type: 'image/svg+xml', sizes: 'any' },
      { src: `${SITE_URL}/apple-touch-icon`, type: 'image/png', sizes: '180x180' },
    ],
  }
}
