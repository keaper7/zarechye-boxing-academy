import { Hero } from '@/components/Hero'
import { Coach } from '@/components/Coach'
import { Programs } from '@/components/Programs'
import { Process } from '@/components/Process'
import { Marquee } from '@/components/Marquee'
import { Pricing } from '@/components/Pricing'
import { Schedule } from '@/components/Schedule'
import { Faq } from '@/components/Faq'
import { Contact } from '@/components/Contact'
import { Footer } from '@/components/Footer'

export default function Page() {
  return (
    <>
      <Hero />
      <Coach />
      <Programs />
      <Process />
      <Marquee />
      {/* Обе секции ниже сейчас возвращают null: цен и расписания
          в открытых источниках нет. См. флаги в src/content.ts. */}
      <Pricing />
      <Schedule />
      <Faq />
      <Contact />
      <Footer />
    </>
  )
}
