import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/content'

// См. комментарий в opengraph-image.tsx — то же самое требование
// статического экспорта для генерируемых маршрутов.
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
