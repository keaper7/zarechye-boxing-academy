import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/content'

// См. комментарий в opengraph-image.tsx. lastModified ниже станет датой
// сборки — на статическом экспорте иначе и быть не может, реального
// «времени запроса» здесь просто не существует.
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }]
}
