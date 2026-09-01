'use client'

import Image from 'next/image'
/**
 * Место под фотографию.
 *
 * Реальных снимков зала у нас нет: контент из Instagram — чужой копирайт,
 * а сток «какой-то абстрактный бокс» уронил бы уровень сайта. Поэтому пока
 * слот рисует графическую панель — свет над рингом, штриховка, углы каната.
 * Это выглядит как осознанная арт-дирекция, а не как битая картинка.
 *
 * Когда клиент пришлёт файлы: положить их в `public/`, вписать путь
 * в `content.ts` — и слот сам отдаст `next/image` вместо панели.
 * Пропорции заданы здесь, поэтому вёрстка не поедет.
 */
export function MediaSlot({
  src,
  alt,
  ratio = '4 / 5',
  className,
  priority = false,
}: {
  src?: string | null
  alt: string
  ratio?: string
  className?: string
  priority?: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden bg-ink-2 ${className ?? ''}`}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes="(max-width: 900px) 100vw, 45vw" priority={priority} className="object-cover" />
      ) : (
        <Placeholder />
      )}
    </div>
  )
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      {/* свет над рингом */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(115% 72% at 50% -10%, rgba(242,239,233,0.24) 0%, rgba(242,239,233,0.07) 40%, transparent 72%)',
        }}
      />
      {/* штриховка — читается как ткань канваса ринга */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(242,239,233,0.075) 0 1px, transparent 1px 10px)',
        }}
      />
      {/* три каната поперёк панели: тот же мотив, что в разделителях секций */}
      <div className="absolute inset-x-0 top-[58%] flex flex-col gap-[9px]">
        <span className="block h-px bg-[rgba(242,239,233,0.16)]" />
        <span className="block h-px bg-[rgba(242,239,233,0.16)]" />
        <span className="block h-px bg-[rgba(242,239,233,0.16)]" />
      </div>
      {/* сигнальный отсвет снизу — единственное цветное пятно */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background: 'radial-gradient(78% 100% at 28% 118%, rgba(232,69,46,0.28) 0%, transparent 68%)',
        }}
      />
      <span className="absolute inset-0 ring-1 ring-inset ring-[var(--hair-strong)]" />
    </div>
  )
}
