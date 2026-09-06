import type { NextConfig } from 'next'

/**
 * GitHub Pages не запускает Next.js — он отдаёт файлы из репозитория как
 * есть, без сборки и без сервера. Поэтому здесь статический экспорт:
 * `next build` кладёт готовый HTML/CSS/JS в `out/`, и именно эту папку
 * публикует GitHub Actions (см. .github/workflows/deploy.yml).
 *
 * basePath раньше был равен /zarechye-boxing-academy — пока сайт жил
 * на keaper7.github.io/zarechye-boxing-academy/, не в корне домена,
 * все ссылки и пути до /_next/... нужно было собирать с этим подпутём,
 * иначе стили, скрипты и картинки ловили бы 404 (см. git-историю этого
 * файла — там ровно этот механизм).
 *
 * Теперь у сайта свой домен (zarechye-boxing.ru, см. public/CNAME),
 * а на своём домене GitHub Pages отдаёт сайт из корня — basePath не
 * нужен и, если бы остался, наоборот сломал бы все пути: браузер искал
 * бы /zarechye-boxing-academy/_next/... там, где такой папки больше нет.
 * Ровно это и произошло, когда домен подключили в настройках, а этот
 * файл не поправили, — сайт открылся, но без единого стиля.
 *
 * Если домен когда-нибудь снова сменится на username.github.io/REPO/ —
 * верните basePath: `process.env.NODE_ENV === 'production' ? '/REPO' : ''`.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Пустая строка — то же значение, что и раньше подставлялось в dev:
  // сайт живёт в корне домена, префикс перед путями не нужен.
  env: { NEXT_PUBLIC_BASE_PATH: '' },
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
