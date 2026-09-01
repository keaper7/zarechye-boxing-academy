import { content } from '@/content'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="shell pb-[clamp(28px,5vh,56px)]">
      <hr className="hair mb-8" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="mono text-[var(--dim-2)]">
          {content.brand.name}<span className="text-signal"> ·</span> {content.brand.area}
        </span>
        <span className="mono text-[var(--dim-2)]">© {year}</span>
      </div>
    </footer>
  )
}
