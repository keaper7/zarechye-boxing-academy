import { Hero } from '@/components/Hero'
import { Coach } from '@/components/Coach'
import { Programs } from '@/components/Programs'
import { Gallery } from '@/components/Gallery'
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
      {/* Фотографии зала стоят сразу после направлений: человек только
          что прочитал, чем здесь занимаются, — и следующий его вопрос
          «а куда я приду?». */}
      <Gallery />
      <Process />
      <Marquee />
      {/* Цены возвращают null: их заказчик пока не давал. Расписание
          уже с данными. См. флаги в src/content.ts. */}
      <Pricing />
      <Schedule />
      <Faq />
      <Contact />
      <Footer />
    </>
  )
}
