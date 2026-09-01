'use client'

import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'

/**
 * Фон героя вместо фотографии: мешок на цепи под лампой.
 *
 * Почему canvas, а не картинка. Реальных снимков зала у нас нет, а сток
 * читается как сток. Живая сцена, которая раскачивается от курсора и
 * получает удар по клику, делает то, что должна делать первая секция
 * сайта спортзала, — вовлекает физически.
 *
 * Физика — маятник с затуханием: θ'' = −(g / L)·sin θ − k·θ'.
 * Плюс отдельная пружина на деформацию: удар сминает мешок поперёк
 * и она затухает колебанием, а не линейно.
 *
 * СИСТЕМА КООРДИНАТ. Всё, что относится к мешку, живёт в локальном
 * кадре с началом в подвесе и осью Y вниз; в мир его переводит
 * ctx.rotate(θ), то есть матрица [cos −sin; sin cos]. Значит точка
 * (0, L) под подвесом уезжает в (−L·sin θ, L·cos θ): при росте θ
 * мешок идёт ВЛЕВО. Знак существенный — на нём висят и тень на полу,
 * и попадание клика, и направление отталкивания курсором.
 *
 * Цвета продублированы из globals.css намеренно: тянуть их из
 * getComputedStyle на каждый кадр дорого, а один раз — хрупко
 * (шрифты и токены доезжают асинхронно).
 */

const INK = '#0a0a0b'

type Scene = {
  pivotX: number
  pivotY: number
  chain: number
  bagW: number
  bagH: number
  bagTop: number
  bagBot: number
  capRy: number
  armLen: number
  floorY: number
}

/** Удар хранится в локальном кадре мешка — иначе круг остаётся висеть
 *  в воздухе, пока мешок от него уезжает. */
type Impact = { lx: number; ly: number; t: number }
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number }
type Mote = { x: number; y: number; vx: number; vy: number; r: number; a: number }

const IMPACT_MS = 0.62

export function HeroCanvas({ className, onPunch }: { className?: string; onPunch?: () => void }) {
  const reduced = usePrefersReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Через ref, а не через зависимость эффекта: иначе смена колбэка
  // пересоздавала бы всю сцену и сбрасывала раскачку мешка.
  const punchRef = useRef(onPunch)
  punchRef.current = onPunch

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let dpr = 1

    // Геометрия и градиенты зависят только от размера холста, поэтому
    // собираются на resize, а не пересоздаются каждый кадр.
    let S: Scene | null = null
    let bodyGrad: CanvasGradient | null = null

    // Конус света и виньетка не зависят ни от θ, ни от времени — только
    // от размера холста. Раскатывать два полноэкранных радиальных
    // градиента каждый кадр значит переписывать ~15 млн пикселей
    // на 60 Гц; запекаем их один раз и дальше только копируем.
    const lightLayer = document.createElement('canvas')
    const vignetteLayer = document.createElement('canvas')

    let theta = 0.14
    let omega = 0
    let squash = 0
    let squashV = 0
    let time = 0

    let visible = true
    let hovering = false
    let raf = 0
    let last = performance.now()

    const pointer = { x: -9999, y: -9999, active: false }
    const impacts: Impact[] = []
    const sparks: Spark[] = []
    const motes: Mote[] = []

    const build = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const narrow = w < 900
      // Пропорции настоящего мешка ближе к 1:3,5 — при 1:2 он читается как бочка
      const bagH = Math.min(h * (narrow ? 0.46 : 0.52), 480)
      const bagW = bagH * 0.3
      const chain = h * (narrow ? 0.2 : 0.24)
      const bagTop = chain + Math.max(12, bagW * 0.18)

      S = {
        pivotX: narrow ? w * 0.62 : w * 0.76,
        pivotY: -h * 0.03,
        chain,
        bagW,
        bagH,
        bagTop,
        bagBot: bagTop + bagH,
        capRy: bagW * 0.13,
        armLen: bagTop + bagH / 2,
        floorY: h * 0.95,
      }

      // Цилиндрическая раскладка света: блик слева сверху, широкая
      // тень справа и слабый отсвет по правой кромке. Без него мешок
      // читается плоским прямоугольником.
      bodyGrad = ctx.createLinearGradient(-bagW / 2, 0, bagW / 2, 0)
      bodyGrad.addColorStop(0, '#2b2b33')
      bodyGrad.addColorStop(0.07, '#50505c')
      bodyGrad.addColorStop(0.3, '#383840')
      bodyGrad.addColorStop(0.62, '#1c1c21')
      bodyGrad.addColorStop(0.9, '#111115')
      bodyGrad.addColorStop(1, '#1b1b21')

      bakeLayer(lightLayer, (c) => {
        const cone = c.createRadialGradient(S!.pivotX, S!.pivotY, 0, S!.pivotX, S!.pivotY, h * 1.15)
        cone.addColorStop(0, 'rgba(242,239,233,0.175)')
        cone.addColorStop(0.32, 'rgba(242,239,233,0.054)')
        cone.addColorStop(1, 'rgba(242,239,233,0)')
        c.fillStyle = cone
        c.fillRect(0, 0, w, h)
      })

      bakeLayer(vignetteLayer, (c) => {
        const v = c.createRadialGradient(
          w * 0.5,
          h * 0.45,
          Math.min(w, h) * 0.28,
          w * 0.5,
          h * 0.5,
          Math.max(w, h) * 0.78,
        )
        v.addColorStop(0, 'rgba(10,10,11,0)')
        v.addColorStop(1, 'rgba(10,10,11,0.55)')
        c.fillStyle = v
        c.fillRect(0, 0, w, h)
      })

      motes.length = 0
      const count = Math.round(Math.min(34, (w * h) / 42000))
      for (let i = 0; i < count; i++) {
        motes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 6,
          vy: -4 - Math.random() * 8,
          r: 0.6 + Math.random() * 1.3,
          a: 0.08 + Math.random() * 0.22,
        })
      }
    }

    const bakeLayer = (layer: HTMLCanvasElement, paint: (c: CanvasRenderingContext2D) => void) => {
      layer.width = Math.round(w * dpr)
      layer.height = Math.round(h * dpr)
      const c = layer.getContext('2d')
      if (!c) return
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.clearRect(0, 0, w, h)
      paint(c)
    }

    /** Центр мешка в экранных координатах. Знак минус — см. шапку файла. */
    const bagCenter = (s: Scene) => ({
      x: s.pivotX - Math.sin(theta) * s.armLen,
      y: s.pivotY + Math.cos(theta) * s.armLen,
    })

    /** Экранная точка → локальный кадр мешка (поворот на −θ). */
    const toLocal = (s: Scene, px: number, py: number) => {
      const dx = px - s.pivotX
      const dy = py - s.pivotY
      const c = Math.cos(theta)
      const sn = Math.sin(theta)
      return { lx: dx * c + dy * sn, ly: -dx * sn + dy * c }
    }

    const isOnBag = (s: Scene, px: number, py: number) => {
      const { lx, ly } = toLocal(s, px, py)
      const pad = 10
      return Math.abs(lx) <= s.bagW / 2 + pad && ly >= s.bagTop - pad && ly <= s.bagBot + pad
    }

    const step = (s: Scene, dt: number) => {
      time += dt

      // Затухание намеренно слабое: тяжёлый мешок качается долго,
      // при k≈0.9 он замирал за пару секунд и сцена мертвела.
      const g = 1400
      omega += (-(g / s.armLen) * Math.sin(theta) - 0.42 * omega) * dt

      // Курсор рядом отталкивает мешок ОТ себя. Курсор слева (dx>0)
      // должен двинуть мешок вправо, то есть уменьшить θ.
      if (pointer.active) {
        const b = bagCenter(s)
        const dx = b.x - pointer.x
        const dy = b.y - pointer.y
        const dist = Math.hypot(dx, dy)
        const reach = s.bagW * 3
        if (dist < reach && dist > 0.1) {
          const push = (1 - dist / reach) * 1.1
          omega -= Math.sign(dx) * push * dt
        }
      }

      theta += omega * dt
      // Мешок на цепи не должен раскачиваться как качели на площадке
      if (theta > 0.46) {
        theta = 0.46
        omega = -Math.abs(omega) * 0.4
      } else if (theta < -0.46) {
        theta = -0.46
        omega = Math.abs(omega) * 0.4
      }

      // Пружина деформации: сминание отыгрывает колебанием и затухает
      squashV += (-squash * 1100 - squashV * 16) * dt
      squash += squashV * dt

      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i]
        p.vy += 620 * dt
        p.vx *= 1 - 1.6 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.life -= dt
        if (p.life <= 0) sparks.splice(i, 1)
      }

      for (let i = impacts.length - 1; i >= 0; i--) {
        impacts[i].t += dt
        if (impacts[i].t > IMPACT_MS) impacts.splice(i, 1)
      }

      for (const m of motes) {
        m.x += m.vx * dt
        m.y += m.vy * dt
        if (m.y < -10) {
          m.y = h + 10
          m.x = Math.random() * w
        }
        if (m.x < -10) m.x = w + 10
        else if (m.x > w + 10) m.x = -10
      }
    }

    /** Слабое мерцание лампы — сцена не выглядит замороженной, даже
     *  когда мешок уже остановился. Только приглушает: слой запечён
     *  на полной яркости, а globalAlpha выше единицы не поднимается. */
    const flicker = () => 1 - 0.028 * (0.5 + 0.5 * Math.sin(time * 2.1)) - 0.016 * (0.5 + 0.5 * Math.sin(time * 5.7 + 1.3))

    const drawRoom = (s: Scene) => {
      const b = bagCenter(s)
      const f = flicker()

      // Конус света от лампы: запечённый слой, мерцание — через альфу
      ctx.globalAlpha = f
      ctx.drawImage(lightLayer, 0, 0, w, h)
      ctx.globalAlpha = 1

      // Пятно на полу — держит мешок в пространстве, а не в пустоте
      const poolR = s.bagW * 3.6
      const pool = ctx.createRadialGradient(s.pivotX, s.floorY, 0, s.pivotX, s.floorY, poolR)
      pool.addColorStop(0, `rgba(242,239,233,${0.1 * f})`)
      pool.addColorStop(1, 'rgba(242,239,233,0)')
      ctx.fillStyle = pool
      ctx.beginPath()
      ctx.ellipse(s.pivotX, s.floorY, poolR, s.bagW * 0.9, 0, 0, Math.PI * 2)
      ctx.fill()

      // Тень мешка внутри пятна: едет вместе с мешком и растягивается
      // тем сильнее, чем дальше он отклонился от лампы
      const spread = 1 + Math.abs(theta) * 0.9
      const shadow = ctx.createRadialGradient(b.x, s.floorY, 0, b.x, s.floorY, s.bagW * 1.5 * spread)
      shadow.addColorStop(0, 'rgba(10,10,11,0.72)')
      shadow.addColorStop(1, 'rgba(10,10,11,0)')
      ctx.fillStyle = shadow
      ctx.beginPath()
      ctx.ellipse(b.x, s.floorY, s.bagW * 1.5 * spread, s.bagW * 0.44, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    /** Пылинки в луче. Видны только там, где есть свет, — иначе
     *  превращаются в «звёзды» на чёрном и портят всю сцену. */
    const drawMotes = (s: Scene) => {
      for (const m of motes) {
        const d = Math.hypot(m.x - s.pivotX, m.y - s.pivotY) / (h * 1.05)
        const lit = Math.max(0, 1 - d)
        if (lit <= 0.02) continue
        ctx.fillStyle = `rgba(242,239,233,${m.a * lit * lit})`
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawBag = (s: Scene) => {
      const bw = s.bagW
      const top = s.bagTop
      const bot = s.bagBot
      const cap = s.capRy

      ctx.save()
      ctx.translate(s.pivotX, s.pivotY)
      ctx.rotate(theta)

      drawChain(s)

      // Удар сминает мешок поперёк и слегка раздувает вдоль —
      // сжатие по одной оси без прибавки по другой читается как
      // «мешок сдулся», а не как «принял удар».
      ctx.save()
      ctx.translate(0, top + s.bagH / 2)
      ctx.scale(1 - squash * 0.09, 1 + squash * 0.045)
      ctx.translate(0, -(top + s.bagH / 2))

      // Силуэт: бока прямые, верх и низ — дуги. Кромка выше линии
      // взгляда выгибается вверх, ниже — вниз; на этом цилиндр и
      // «читается» глазом как объём.
      ctx.beginPath()
      ctx.moveTo(-bw / 2, top)
      ctx.lineTo(-bw / 2, bot)
      ctx.quadraticCurveTo(0, bot + 2 * cap, bw / 2, bot)
      ctx.lineTo(bw / 2, top)
      ctx.quadraticCurveTo(0, top - 2 * cap, -bw / 2, top)
      ctx.closePath()

      ctx.fillStyle = bodyGrad!
      ctx.fill()

      ctx.save()
      ctx.clip()

      // Швы: те же дуги, что и кромки, — прямые линии мгновенно
      // расплющили бы цилиндр обратно в прямоугольник.
      const mid = top + s.bagH / 2
      ctx.lineWidth = Math.max(1, bw * 0.012)
      for (const k of [0.2, 0.44, 0.68]) {
        const sy = top + s.bagH * k
        const bow = ((sy - mid) / (s.bagH / 2)) * cap * 1.15
        ctx.strokeStyle = 'rgba(10,10,11,0.5)'
        ctx.beginPath()
        ctx.moveTo(-bw / 2, sy)
        ctx.quadraticCurveTo(0, sy + 2 * bow, bw / 2, sy)
        ctx.stroke()
        // Тонкий блик под швом — кожа на сгибе ловит свет
        ctx.strokeStyle = 'rgba(242,239,233,0.06)'
        ctx.beginPath()
        ctx.moveTo(-bw / 2, sy + ctx.lineWidth)
        ctx.quadraticCurveTo(0, sy + 2 * bow + ctx.lineWidth, bw / 2, sy + ctx.lineWidth)
        ctx.stroke()
      }

      // Контровой свет по левой кромке. Через градиент, а не ровной
      // заливкой: линия одинаковой яркости во всю высоту читается
      // как царапина по холсту, а не как блик на коже.
      const rimL = ctx.createLinearGradient(0, top, 0, bot)
      rimL.addColorStop(0, 'rgba(242,239,233,0)')
      rimL.addColorStop(0.18, 'rgba(242,239,233,0.34)')
      rimL.addColorStop(0.62, 'rgba(242,239,233,0.16)')
      rimL.addColorStop(1, 'rgba(242,239,233,0)')
      ctx.strokeStyle = rimL
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-bw / 2 + 1, top + cap)
      ctx.lineTo(-bw / 2 + 1, bot - cap)
      ctx.stroke()

      // Слабый отсвет по правой кромке — без него силуэт растворяется
      // в фоне и мешок теряет форму справа.
      const rimR = ctx.createLinearGradient(0, top, 0, bot)
      rimR.addColorStop(0, 'rgba(242,239,233,0)')
      rimR.addColorStop(0.4, 'rgba(242,239,233,0.1)')
      rimR.addColorStop(1, 'rgba(242,239,233,0)')
      ctx.strokeStyle = rimR
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(bw / 2 - 1, top + cap)
      ctx.lineTo(bw / 2 - 1, bot - cap)
      ctx.stroke()

      // Верхняя обвязка. Обе кромки выгибаются одинаково — иначе
      // полоса выходит серпом: толстой у краёв и тонкой посередине.
      const bandH = s.bagH * 0.055
      ctx.beginPath()
      ctx.moveTo(-bw / 2, top)
      ctx.quadraticCurveTo(0, top - 2 * cap, bw / 2, top)
      ctx.lineTo(bw / 2, top + bandH)
      ctx.quadraticCurveTo(0, top + bandH - 2 * cap, -bw / 2, top + bandH)
      ctx.closePath()
      ctx.fillStyle = 'rgba(9,9,11,0.5)'
      ctx.fill()

      // Блик по самой верхней кромке
      ctx.strokeStyle = 'rgba(242,239,233,0.18)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-bw / 2, top + 1)
      ctx.quadraticCurveTo(0, top - 2 * cap + 1, bw / 2, top + 1)
      ctx.stroke()

      // Нижняя обвязка — зеркало верхней. Кромки выгнуты вниз, потому
      // что низ мешка расположен ниже линии взгляда.
      ctx.beginPath()
      ctx.moveTo(-bw / 2, bot - bandH)
      ctx.quadraticCurveTo(0, bot - bandH + 2 * cap, bw / 2, bot - bandH)
      ctx.lineTo(bw / 2, bot)
      ctx.quadraticCurveTo(0, bot + 2 * cap, -bw / 2, bot)
      ctx.closePath()
      ctx.fillStyle = 'rgba(9,9,11,0.45)'
      ctx.fill()

      drawImpacts()
      ctx.restore()

      ctx.restore()
      ctx.restore()
    }

    /** Цепь звеньями, а не одной линией: на светлом фоне лампы
     *  прямая двухпиксельная палка сразу выдаёт схематичность. */
    const drawChain = (s: Scene) => {
      const links = Math.max(5, Math.round(s.chain / 22))
      const stepY = s.chain / links
      const rx = Math.max(2.5, s.bagW * 0.05)
      const ry = stepY * 0.62

      for (let i = 0; i < links; i++) {
        const cy = stepY * (i + 0.5)
        const side = i % 2 === 0
        ctx.strokeStyle = side ? 'rgba(242,239,233,0.24)' : 'rgba(242,239,233,0.13)'
        ctx.lineWidth = Math.max(1.1, s.bagW * 0.016)
        ctx.beginPath()
        ctx.ellipse(0, cy, side ? rx : rx * 0.42, ry, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Карабин
      ctx.strokeStyle = 'rgba(242,239,233,0.28)'
      ctx.lineWidth = Math.max(1.6, s.bagW * 0.024)
      ctx.beginPath()
      ctx.arc(0, s.chain + rx * 1.4, rx * 1.5, Math.PI * 0.16, Math.PI * 0.84, true)
      ctx.stroke()
    }

    /** Рисуется внутри локального кадра мешка — вместе с ним и едет. */
    const drawImpacts = () => {
      for (const im of impacts) {
        const p = im.t / IMPACT_MS
        const ease = 1 - Math.pow(1 - p, 3)
        const fade = 1 - p

        ctx.strokeStyle = `rgba(232,69,46,${fade * 0.9})`
        ctx.lineWidth = Math.max(1, 3 * fade)
        ctx.beginPath()
        ctx.arc(im.lx, im.ly, 6 + ease * 90, 0, Math.PI * 2)
        ctx.stroke()

        ctx.strokeStyle = `rgba(242,239,233,${fade * 0.35})`
        ctx.lineWidth = Math.max(1, 1.6 * fade)
        ctx.beginPath()
        ctx.arc(im.lx, im.ly, 3 + ease * 46, 0, Math.PI * 2)
        ctx.stroke()

        // Горячее пятно в точке попадания
        if (p < 0.4) {
          const flash = ctx.createRadialGradient(im.lx, im.ly, 0, im.lx, im.ly, 44)
          flash.addColorStop(0, `rgba(242,239,233,${(1 - p / 0.4) * 0.3})`)
          flash.addColorStop(1, 'rgba(242,239,233,0)')
          ctx.fillStyle = flash
          ctx.beginPath()
          ctx.arc(im.lx, im.ly, 44, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    /** Пыль от удара — в мировых координатах: она отлетает от мешка,
     *  а не приклеена к нему. */
    const drawSparks = () => {
      for (const p of sparks) {
        const k = Math.max(0, p.life / p.max)
        ctx.fillStyle = `rgba(226,220,206,${k * 0.55})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * k, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawVignette = () => {
      ctx.drawImage(vignetteLayer, 0, 0, w, h)
    }

    const render = (s: Scene) => {
      ctx.fillStyle = INK
      ctx.fillRect(0, 0, w, h)
      drawRoom(s)
      drawMotes(s)
      drawBag(s)
      drawSparks()
      drawVignette()
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible || !S) return

      // Кадры длиннее 50 мс (вкладка была в фоне) ломают интегрирование
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      step(S, dt)
      render(S)
    }

    const punch = (px: number, py: number) => {
      const s = S
      if (!s || !isOnBag(s, px, py)) return

      const { lx, ly } = toLocal(s, px, py)
      const b = bagCenter(s)

      // Удар слева (px < b.x) должен толкнуть мешок вправо, а вправо —
      // это уменьшение θ. Значит знак импульса совпадает со знаком
      // (px − центр): слева получаем −1 и θ падает. Ровно по центру
      // считаем удар пришедшим слева, иначе мешок замер бы на месте.
      const side = px < b.x ? -1 : 1
      omega += side * 1.6
      squashV += 26
      punchRef.current?.()

      impacts.push({
        lx: Math.max(-s.bagW / 2, Math.min(s.bagW / 2, lx)),
        ly: Math.max(s.bagTop, Math.min(s.bagBot, ly)),
        t: 0,
      })

      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2
        const v = 50 + Math.random() * 190
        const max = 0.4 + Math.random() * 0.5
        sparks.push({
          x: px,
          y: py,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 70,
          life: max,
          max,
          r: 1 + Math.random() * 1.8,
        })
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
      pointer.active = true

      // Курсор-прицел только над мешком: на пустом фоне он лишь
      // обещает интерактивность, которой там нет.
      if (S) {
        const on = isOnBag(S, pointer.x, pointer.y)
        if (on !== hovering) {
          hovering = on
          canvas.style.cursor = on ? 'crosshair' : ''
        }
      }
    }

    const onPointerLeave = () => {
      pointer.active = false
      pointer.x = -9999
      hovering = false
      canvas.style.cursor = ''
    }

    const onPointerDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      punch(e.clientX - r.left, e.clientY - r.top)
    }

    const ro = new ResizeObserver(() => {
      build()
      if (reduced && S) render(S)
    })
    ro.observe(canvas)

    // Вне экрана сцена не считается — незачем жечь батарею на невидимое
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible) last = performance.now()
      },
      { threshold: 0 },
    )
    io.observe(canvas)

    build()

    if (reduced) {
      // Один статичный кадр: сцена остаётся, движение — нет
      theta = 0.07
      if (S) render(S)
      return () => {
        ro.disconnect()
        io.disconnect()
      }
    }

    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('pointerdown', onPointerDown)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('pointerdown', onPointerDown)
    }
  }, [reduced])

  return <canvas ref={canvasRef} aria-hidden="true" className={`h-full w-full ${className ?? ''}`} />
}
