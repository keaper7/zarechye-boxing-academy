import type { NextConfig } from 'next'

/**
 * GitHub Pages не запускает Next.js — он отдаёт файлы из репозитория как
 * есть, без сборки и без сервера. Поэтому здесь статический экспорт:
 * `next build` кладёт готовый HTML/CSS/JS в `out/`, и именно эту папку
 * публикует GitHub Actions (см. .github/workflows/deploy.yml).
 *
 * Сайт публикуется на username.github.io/REPO/ — не в корне домена,
 * а в подпути. basePath вписывает этот подпуть во все ссылки и в пути
 * до /_next/... на этапе сборки; без него страница откроется, но все
 * стили, скрипты и внутренние ссылки будут смотреть в корень домена
 * и ловить 404.
 *
 * Название репозитория — единственное, что здесь может отличаться от
 * проекта к проекту. Меняется в одном месте.
 */
const REPO = 'zarechye-boxing-academy'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: `/${REPO}`,
  // trailingSlash: страница «/coach» экспортируется как coach/index.html,
  // а не coach.html. GitHub Pages отдаёт index.html по обращению к папке
  // без явного файла — без этого флага прямые заходы на подстраницы
  // (не с главной) требовали бы точного .html в адресе.
  trailingSlash: true,
  images: {
    // На статическом экспорте нет сервера, который резал бы и кэшировал
    // изображения на лету, — оптимизация Next.js работать не может.
    unoptimized: true,
  },
}

export default nextConfig
