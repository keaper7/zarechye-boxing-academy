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
 * ФИЗИКА. Не маятник с одним углом, а верёвка Верле: цепочка узлов,
 * связанных ограничениями на расстояние. Один угол не позволял цепи
 * ни прогнуться, ни отыграть удар — она была жёсткой палкой, которая
 * просто поворачивалась вместе с мешком. Здесь удар прилетает в узел
 * мешка, а дальше сам расходится вверх по звеньям волной: именно это
 * и видно на записях из зала.
 *
 * Узлы: 0 — подвес (прибит намертво), 1..lastChain — звенья цепи,
 * последний узел — центр мешка. Отрезок lastChain → центр задаёт ось
 * мешка, поэтому его наклон и есть угол мешка; отдельного θ в системе
 * нет, он вычисляется из узлов.
 *
 * СИСТЕМА КООРДИНАТ МЕШКА. Начало — в нижнем узле цепи (карабин),
 * ось Y вниз вдоль мешка. Переводит в мир ctx.rotate(θ), матрица
 * [cos −sin; sin cos]: точка (0, L) уезжает в (−L·sin θ, L·cos θ).
 * Знак существенный — на нём висят и попадание клика, и импакты.
 *
 * Цвета продублированы из globals.css намеренно: тянуть их из
 * getComputedStyle на каждый кадр дорого, а один раз — хрупко
 * (шрифты и токены доезжают асинхронно).
 */

const INK = '#0a0a0b'

// Шаг физики фиксирован: Верле на переменном dt разъезжается — при
// просадке кадров цепь то провисает, то дёргается. Кадр «догоняет»
// накопленным временем, а не растягивает один большой шаг.
const STEP = 1 / 120
const GRAVITY = 1400
// 0.9965 за шаг ≈ e^(−0.42·t) за секунду — то же затухание, что было
// у прежнего маятника: тяжёлый мешок качается долго.
const DRAG = 0.9965
const ITERATIONS = 6

// Открытие сцены: груша не появляется уже готовой, а опускается на
// цепи сверху и слегка раскачивается от собственного веса — вместо
// отдельной шторки-прелоадера, которая стоит почти на каждом нашем
// сайте и должна была бы повторяться и здесь.
const INTRO_MS = 0.85
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3)

type Node = { x: number; y: number; px: number; py: number; ax: number; ay: number; inv: number }

type Scene = {
  pivotX: number
  pivotY: number
  chain: number
  segLen: number
  lastChain: number
  linkR: number
  bagW: number
  bagH: number
  /** Зазор от нижнего узла цепи до верхней кромки мешка (карабин) */
  gap: number
  capRy: number
  armLen: number
  floorY: number
  maxSwing: number
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

    // Конус света и виньетка не зависят ни от узлов, ни от времени —
    // только от размера холста. Раскатывать два полноэкранных
    // радиальных градиента каждый кадр значит переписывать ~15 млн
    // пикселей на 60 Гц; запекаем их один раз и дальше только копируем.
    const lightLayer = document.createElement('canvas')
    const vignetteLayer = document.createElement('canvas')

    let nodes: Node[] = []
    let rests: number[] = []
    let squash = 0
    let squashV = 0
    let time = 0
    let acc = 0

    let visible = true
    let hovering = false
    let raf = 0
    let last = performance.now()

    // Точка подвеса цепи во время физики — обычно равна S.pivotY, но
    // на входной анимации едет снизу... то есть сверху вниз, от точки
    // над кадром к настоящей. solve() крепит узел 0 сюда, а не к
    // S.pivotY напрямую — иначе пришлось бы временно портить сам S,
    // от которого зависят и градиент лампы, и пятно на полу.
    let anchorY = 0
    let builtOnce = false
    let introActive = false
    let introT = 0
    let introFromY = 0
    let introToY = 0

    const pointer = { x: -9999, y: -9999, active: false }
    const impacts: Impact[] = []
    const sparks: Spark[] = []
    const motes: Mote[] = []

    const bakeLayer = (layer: HTMLCanvasElement, paint: (c: CanvasRenderingContext2D) => void) => {
      layer.width = Math.round(w * dpr)
      layer.height = Math.round(h * dpr)
      const c = layer.getContext('2d')
      if (!c) return
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.clearRect(0, 0, w, h)
      paint(c)
    }

    /** Раскладывает верёвку прямой линией с небольшим наклоном — это и
     *  стартовая поза, и статичный кадр для prefers-reduced-motion. */
    const rest = (s: Scene, tilt: number) => {
      const dirX = -Math.sin(tilt)
      const dirY = Math.cos(tilt)
      nodes = []
      rests = []

      for (let i = 0; i <= s.lastChain; i++) {
        const d = s.segLen * i
        nodes.push({
          x: s.pivotX + dirX * d,
          y: s.pivotY + dirY * d,
          px: s.pivotX + dirX * d,
          py: s.pivotY + dirY * d,
          ax: 0,
          ay: 0,
          // Звенья лёгкие, мешок тяжёлый: ограничения двигают в основном
          // цепь, а не мешок. Иначе цепь тащила бы мешок за собой и он
          // болтался бы как воздушный шарик.
          inv: 1,
        })
        if (i > 0) rests.push(s.segLen)
      }

      const bagDist = s.segLen * s.lastChain + s.gap + s.bagH / 2
      nodes.push({
        x: s.pivotX + dirX * bagDist,
        y: s.pivotY + dirY * bagDist,
        px: s.pivotX + dirX * bagDist,
        py: s.pivotY + dirY * bagDist,
        ax: 0,
        ay: 0,
        inv: 0.12,
      })
      rests.push(s.gap + s.bagH / 2)

      nodes[0].inv = 0
    }

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
      const gap = Math.max(12, bagW * 0.18)
      // Одно звено на отрезок: ~22px даёт цепь, которая и читается
      // звеньями, и гнётся достаточно плавно
      const links = Math.max(5, Math.round(chain / 22))

      S = {
        pivotX: narrow ? w * 0.62 : w * 0.76,
        pivotY: -h * 0.03,
        chain,
        segLen: chain / links,
        lastChain: links,
        linkR: Math.max(2.5, bagW * 0.05),
        bagW,
        bagH,
        gap,
        capRy: bagW * 0.13,
        armLen: chain + gap + bagH / 2,
        floorY: h * 0.95,
        // Мешок на цепи не должен раскачиваться как качели на площадке
        maxSwing: (chain + gap + bagH / 2) * Math.sin(0.5),
      }

      // Первая сборка сцены на этом монтировании — груша едет с высоты;
      // все последующие (например, ресайз окна) просто перекладывают
      // верёвку в её обычный покой, как было всегда.
      if (!builtOnce && !reduced) {
        builtOnce = true
        const trueY = S.pivotY
        // На такую высоту, чтобы мешок с цепью целиком стоял выше
        // кадра — иначе будет видно, как он «телепортируется» доверху.
        const rise = S.armLen + Math.max(60, h * 0.1)
        S.pivotY = trueY - rise
        rest(S, 0.12)
        S.pivotY = trueY

        introFromY = trueY - rise
        introToY = trueY
        anchorY = introFromY
        introT = 0
        introActive = true
      } else {
        builtOnce = true
        introActive = false
        anchorY = S.pivotY
        rest(S, reduced ? 0.07 : 0.12)
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

    /** Нижний узел цепи — точка подвеса мешка и начало его кадра. */
    const hook = (s: Scene) => nodes[s.lastChain]
    const bagCenter = () => nodes[nodes.length - 1]

    /** Угол мешка выводится из отрезка «карабин → центр», а не хранится
     *  отдельно: иначе он рассинхронизировался бы с верёвкой. */
    const bagAngle = (s: Scene) => {
      const a = hook(s)
      const b = bagCenter()
      return Math.atan2(-(b.x - a.x), b.y - a.y)
    }

    /** Экранная точка → локальный кадр мешка (поворот на −θ). */
    const toLocal = (s: Scene, px: number, py: number) => {
      const a = hook(s)
      const th = bagAngle(s)
      const dx = px - a.x
      const dy = py - a.y
      const c = Math.cos(th)
      const sn = Math.sin(th)
      return { lx: dx * c + dy * sn, ly: -dx * sn + dy * c }
    }

    const isOnBag = (s: Scene, px: number, py: number) => {
      const { lx, ly } = toLocal(s, px, py)
      const pad = 10
      return Math.abs(lx) <= s.bagW / 2 + pad && ly >= s.gap - pad && ly <= s.gap + s.bagH + pad
    }

    /** Добавляет узлу скорость в px/с. В Верле скорость — это разница
     *  между текущей и прошлой позицией, поэтому импульс задаётся
     *  сдвигом прошлой позиции назад. */
    const push = (n: Node, vx: number, vy: number) => {
      n.px -= vx * STEP
      n.py -= vy * STEP
    }

    const integrate = () => {
      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i]
        const vx = (n.x - n.px) * DRAG
        const vy = (n.y - n.py) * DRAG
        n.px = n.x
        n.py = n.y
        n.x += vx + n.ax * STEP * STEP
        n.y += vy + (GRAVITY + n.ay) * STEP * STEP
        n.ax = 0
        n.ay = 0
      }
    }

    const solve = (s: Scene) => {
      for (let it = 0; it < ITERATIONS; it++) {
        for (let i = 0; i < nodes.length - 1; i++) {
          const a = nodes[i]
          const b = nodes[i + 1]
          const wsum = a.inv + b.inv
          if (wsum === 0) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const d = Math.hypot(dx, dy) || 1e-6
          const diff = (d - rests[i]) / d
          a.x += dx * diff * (a.inv / wsum)
          a.y += dy * diff * (a.inv / wsum)
          b.x -= dx * diff * (b.inv / wsum)
          b.y -= dy * diff * (b.inv / wsum)
        }
      }

      // Подвес прибит намертво — накопленный дрейф ему не положен.
      // По Y — не к s.pivotY напрямую, а к anchorY: во время входной
      // анимации это разные точки (см. играющий сверху вниз intro).
      nodes[0].x = s.pivotX
      nodes[0].y = anchorY

      // Мягкий предел раскачки: дальше мешок не уходит, а остаток
      // скорости гасится, будто цепь дошла до упора
      const bag = bagCenter()
      const off = bag.x - s.pivotX
      if (Math.abs(off) > s.maxSwing) {
        bag.x = s.pivotX + Math.sign(off) * s.maxSwing
        bag.px = bag.x + (bag.px - bag.x) * 0.35
      }
    }

    const physics = (s: Scene) => {
      // Курсор рядом отталкивает мешок ОТ себя
      if (pointer.active) {
        const b = bagCenter()
        const dx = b.x - pointer.x
        const dy = b.y - pointer.y
        const dist = Math.hypot(dx, dy)
        const reach = s.bagW * 3
        if (dist < reach && dist > 0.1) {
          b.ax += Math.sign(dx) * (1 - dist / reach) * 620
        }
      }

      integrate()
      solve(s)
    }

    const step = (s: Scene, dt: number) => {
      if (introActive) {
        introT += dt
        const p = Math.min(introT / INTRO_MS, 1)
        anchorY = introFromY + (introToY - introFromY) * easeOutCubic(p)
        if (p >= 1) {
          introActive = false
          anchorY = introToY
          // Толчок в сторону в момент приземления: без него груша
          // просто гасит вертикальную скорость об натянутую цепь и
          // замирает — а раскачаться боком ей больше не от чего.
          push(bagCenter(), (Math.random() < 0.5 ? 1 : -1) * 95, 0)
        }
      }

      time += dt

      acc += dt
      // Потолок на случай, если вкладка была свёрнута: иначе накопится
      // минута времени и физика провернётся тысячами шагов за кадр
      if (acc > 0.25) acc = 0.25
      while (acc >= STEP) {
        physics(s)
        acc -= STEP
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
    const flicker = () =>
      1 - 0.028 * (0.5 + 0.5 * Math.sin(time * 2.1)) - 0.016 * (0.5 + 0.5 * Math.sin(time * 5.7 + 1.3))

    const drawRoom = (s: Scene) => {
      const b = bagCenter()
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
      const spread = 1 + Math.abs(bagAngle(s)) * 0.9
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

    /** Цепь рисуется по реальным узлам, в мировых координатах: каждое
     *  звено садится на свой отрезок и наклоняется вместе с ним, так
     *  что прогиб и волна от удара видны сами собой. */
    const drawChain = (s: Scene) => {
      ctx.lineWidth = Math.max(1.1, s.bagW * 0.016)
      for (let i = 0; i < s.lastChain; i++) {
        const a = nodes[i]
        const b = nodes[i + 1]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy) || 1e-6
        const side = i % 2 === 0
        ctx.strokeStyle = side ? 'rgba(242,239,233,0.24)' : 'rgba(242,239,233,0.13)'
        ctx.beginPath()
        ctx.ellipse(
          (a.x + b.x) / 2,
          (a.y + b.y) / 2,
          len * 0.62,
          side ? s.linkR : s.linkR * 0.42,
          Math.atan2(dy, dx),
          0,
          Math.PI * 2,
        )
        ctx.stroke()
      }
    }

    const drawBag = (s: Scene) => {
      const bw = s.bagW
      const top = s.gap
      const bot = s.gap + s.bagH
      const cap = s.capRy
      const a = hook(s)

      ctx.save()
      ctx.translate(a.x, a.y)
      ctx.rotate(bagAngle(s))

      // Карабин
      ctx.strokeStyle = 'rgba(242,239,233,0.28)'
      ctx.lineWidth = Math.max(1.6, bw * 0.024)
      ctx.beginPath()
      ctx.arc(0, s.linkR * 1.4, s.linkR * 1.5, Math.PI * 0.16, Math.PI * 0.84, true)
      ctx.stroke()

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

    const render = (s: Scene) => {
      ctx.fillStyle = INK
      ctx.fillRect(0, 0, w, h)
      drawRoom(s)
      drawMotes(s)
      drawChain(s)
      drawBag(s)
      drawSparks()
      ctx.drawImage(vignetteLayer, 0, 0, w, h)
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
      const bag = bagCenter()

      // Удар слева должен толкнуть мешок вправо. Ровно по центру
      // считаем удар пришедшим слева, иначе мешок замер бы на месте.
      const side = px < bag.x ? 1 : -1
      push(bag, side * 430, 0)

      // Нижним звеньям добавлен собственный небольшой импульс,
      // затухающий вверх. Чистого протаскивания мешком мало: волна
      // получается вялой и на тёмном фоне почти не читается — это
      // осознанное усиление эффекта, а не физика.
      for (let i = s.lastChain; i > 0; i--) {
        const up = s.lastChain - i
        const k = Math.exp(-up * 0.55)
        if (k < 0.03) break
        push(nodes[i], side * 430 * 0.45 * k, 0)
      }

      squashV += 26
      punchRef.current?.()

      impacts.push({
        lx: Math.max(-s.bagW / 2, Math.min(s.bagW / 2, lx)),
        ly: Math.max(s.gap, Math.min(s.gap + s.bagH, ly)),
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
      // ResizeObserver зовёт колбэк один раз сразу после observe(), даже
      // если размер не менялся, — раньше это был второй build() почти
      // синхронно с первым, и он мгновенно откатывал грушу из полёта
      // обратно в состояние покоя, съедая всю входную анимацию. Реальный
      // ресайз здесь отличим по факту изменения размеров холста.
      const rect = canvas.getBoundingClientRect()
      if (Math.abs(rect.width - w) < 1 && Math.abs(rect.height - h) < 1) return
      build()
      if (reduced && S) render(S)
    })
    ro.observe(canvas)

    // Вне экрана сцена не считается — незачем жечь батарею на невидимое
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible) {
          last = performance.now()
          acc = 0
        }
      },
      { threshold: 0 },
    )
    io.observe(canvas)

    build()

    if (reduced) {
      // Один статичный кадр: сцена остаётся, движение — нет
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
