import { SITE_URL, content } from '@/content'

/**
 * Разметка для поисковиков. Сюда попадает только то, что подтверждено:
 * адреса и телефона нет — значит, их нет и в JSON-LD. Выдуманный
 * `address` в schema.org хуже отсутствующего: он попадёт в карточку выдачи.
 */
export function JsonLd() {
  const { brand, coach, contact, meta } = content
  const sameAs = contact.links.filter((l) => !('primary' in l && l.primary)).map((l) => l.href)

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SportsActivityLocation',
        '@id': `${SITE_URL}/#gym`,
        name: brand.name,
        alternateName: brand.nameRu,
        description: meta.description,
        url: SITE_URL,
        areaServed: brand.area,
        sport: 'Бокс',
        sameAs,
        ...(contact.place.address ? { address: contact.place.address } : {}),
        ...(contact.place.phone ? { telephone: contact.place.phone } : {}),
      },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#coach`,
        name: coach.name,
        jobTitle: 'Тренер по боксу',
        award: [...coach.awards],
        worksFor: { '@id': `${SITE_URL}/#gym` },
        sameAs: ['https://www.instagram.com/aydamir_tlinov/', 'https://www.threads.com/@aydamir_tlinov'],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  )
}
