import { SITE_URL, content } from '@/content'

/**
 * Разметка для поисковиков. Сюда попадает только то, что подтверждено:
 * адреса и телефона нет — значит, их нет и в JSON-LD. Выдуманный
 * `address` в schema.org хуже отсутствующего: он попадёт в карточку выдачи.
 */
export function JsonLd() {
  const { brand, coach, contact, faq, meta } = content
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
        // PostalAddress, а не строкой: разобранный на поля адрес поисковик
        // может показать в карточке и связать с картой, слитную строку —
        // нет. Регион не указан намеренно: заказчик прислал адрес без него,
        // а угадывать область по названию посёлка нельзя — «Заречье»
        // в России не одно.
        ...(contact.place.address
          ? {
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'улица Лучистая, 1А',
                addressLocality: 'рабочий посёлок Заречье',
                addressCountry: 'RU',
              },
            }
          : {}),
        ...(contact.place.phone ? { telephone: contact.place.phone } : {}),
      },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#coach`,
        name: coach.name,
        jobTitle: 'Тренер по боксу',
        award: [...coach.awards],
        worksFor: { '@id': `${SITE_URL}/#gym` },
        sameAs: [contact.coachHref, 'https://www.threads.com/@aydamir_tlinov'],
      },
      {
        /* Те же шесть вопросов, что и в секции FAQ, — и это не дубль ради
           поисковика, а его требование: размечать можно только те ответы,
           которые посетитель видит на странице целиком. Массив здесь один
           и тот же, так что разметка не может разойтись с текстом. */
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        mainEntity: faq.items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
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
