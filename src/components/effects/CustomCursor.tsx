'use client'

/**
 * CustomCursor — golden arrow cursor with canvas-based flame-ember particles.
 *
 * The arrow SVG is positioned exactly at the OS pointer hot-spot (top-left).
 * A full-viewport canvas sits behind it; a rAF loop draws ember particles
 * that spawn near the arrow tip, drift up/outward, shrink and fade.
 *
 * Only activates on fine-pointer (mouse) devices, and only when the
 * user hasn't disabled it via Settings.
 *
 * Toggles `body.wr-cursor-active` → the CSS rule `cursor: none !important`
 * on that class hides the OS cursor.
 */

import { useEffect, useRef } from 'react'

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, label, [data-interactive]'

export const CURSOR_DISABLED_STORAGE_KEY = 'warroom_cursor_disabled'

/** Cheap synchronous read of the user's cursor preference. */
function isCursorDisabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(CURSOR_DISABLED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

// ── Ember particle type ─────────────────────────────────────────────────────
interface Ember {
  x: number       // current x on canvas
  y: number       // current y on canvas
  vx: number      // velocity x
  vy: number      // velocity y (negative = up)
  ax: number      // x-wobble acceleration
  size: number    // initial radius px
  life: number    // 0 → 1 (0 = born, 1 = dead)
  decay: number   // how fast life drains each frame
  hue: number     // 25–45 (gold / amber range)
  bright: number  // lightness 70–100%
}

const EMBER_POOL_MAX = 32
const SPAWN_RATE = 0.5 // embers per frame at rest; ×2 when hovering

function spawnEmber(x: number, y: number, hovering: boolean): Ember {
  const angle = Math.random() * Math.PI * 2         // any direction
  const speed = 0.6 + Math.random() * (hovering ? 1.8 : 1.2)
  return {
    x: x + (Math.random() - 0.5) * 10,
    y: y + (Math.random() - 0.5) * 8,
    vx: Math.cos(angle) * speed * 0.55,
    vy: -speed * (0.7 + Math.random() * 0.5),       // mostly upward
    ax: (Math.random() - 0.5) * 0.06,               // gentle left/right wobble
    size: 0.7 + Math.random() * (hovering ? 1.6 : 1.1),
    life: 0,
    decay: 0.012 + Math.random() * 0.018,
    hue: 28 + Math.random() * 20,                   // 28–48: gold → amber
    bright: 72 + Math.random() * 28,                // 72–100%
  }
}

// ── Component ────────────────────────────────────────────────────────────────
export function CustomCursor() {
  const arrowRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (isCursorDisabled()) return

    document.body.classList.add('wr-cursor-active')

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    // Resize canvas to fill viewport
    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    // ── State ────────────────────────────────────────────────────────────
    let mx = -200, my = -200
    let hovering = false
    let clicking = false
    const embers: Ember[] = []
    let spawnAccumulator = 0
    let rafId = 0

    // ── Pointer tracking ─────────────────────────────────────────────────
    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      const el = arrowRef.current
      if (el) el.style.transform = `translate(${mx}px, ${my}px)`
    }

    const onOver = (e: MouseEvent) => {
      hovering = !!(e.target as Element).closest(INTERACTIVE_SELECTOR)
      arrowRef.current?.classList.toggle('wr-cursor--hover', hovering)
    }

    const onDown = () => {
      clicking = true
      arrowRef.current?.classList.add('wr-cursor--click')
    }
    const onUp = () => {
      clicking = false
      arrowRef.current?.classList.remove('wr-cursor--click')
    }

    const onDocLeave = () => { if (arrowRef.current) arrowRef.current.style.opacity = '0' }
    const onDocEnter = () => { if (arrowRef.current) arrowRef.current.style.removeProperty('opacity') }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.documentElement.addEventListener('mouseleave', onDocLeave)
    document.documentElement.addEventListener('mouseenter', onDocEnter)

    const onStorage = (e: StorageEvent) => {
      if (e.key === CURSOR_DISABLED_STORAGE_KEY && e.newValue === 'true') {
        document.body.classList.remove('wr-cursor-active')
        cancelAnimationFrame(rafId)
      }
    }
    window.addEventListener('storage', onStorage)

    // ── rAF render loop ───────────────────────────────────────────────────
    function tick() {
      rafId = requestAnimationFrame(tick)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Spawn new embers near the arrow tip (tip is at mx, my)
      const rate = SPAWN_RATE * (clicking ? 3 : hovering ? 2 : 1)
      spawnAccumulator += rate
      while (spawnAccumulator >= 1 && embers.length < EMBER_POOL_MAX) {
        embers.push(spawnEmber(mx + 6, my + 10, hovering))
        spawnAccumulator -= 1
      }
      // Cap accumulator so we don't burst after the cursor was idle
      spawnAccumulator = Math.min(spawnAccumulator, rate)

      // Update + draw
      for (let i = embers.length - 1; i >= 0; i--) {
        const em = embers[i]
        em.life += em.decay
        if (em.life >= 1) { embers.splice(i, 1); continue }

        // Physics
        em.vx += em.ax
        em.vx *= 0.985          // gentle air drag
        em.vy *= 0.992
        em.x += em.vx
        em.y += em.vy

        const alpha = Math.sin(em.life * Math.PI) * 0.95   // bell-curve fade
        const radius = em.size * (1 - em.life * 0.6)       // shrink with life

        // Radial gradient: bright core → transparent halo
        const grad = ctx.createRadialGradient(em.x, em.y, 0, em.x, em.y, radius * 2.8)
        grad.addColorStop(0,   `hsla(${em.hue}, 100%, ${em.bright}%, ${alpha})`)
        grad.addColorStop(0.4, `hsla(${em.hue}, 100%, ${em.bright - 20}%, ${alpha * 0.75})`)
        grad.addColorStop(0.75,`hsla(${em.hue + 10}, 85%, 55%, ${alpha * 0.35})`)
        grad.addColorStop(1,   `hsla(${em.hue + 15}, 80%, 45%, 0)`)

        ctx.beginPath()
        ctx.arc(em.x, em.y, radius * 2.8, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }
    }

    tick()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('storage', onStorage)
      document.documentElement.removeEventListener('mouseleave', onDocLeave)
      document.documentElement.removeEventListener('mouseenter', onDocEnter)
      document.body.classList.remove('wr-cursor-active')
    }
  }, [])

  return (
    <>
      {/* Full-viewport canvas for embers — sits below the arrow */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9998,
        }}
      />

      {/* The golden arrow — positioned by JS transform, anchored at tip */}
      <div
        ref={arrowRef}
        className="wr-cursor"
        aria-hidden="true"
        style={{ transform: 'translate(-200px, -200px)' }}
      >
        <svg
          viewBox="0 0 24 28"
          width={22}
          height={26}
          aria-hidden="true"
          className="wr-cursor__arrow"
        >
          <defs>
            <linearGradient id="wrCursorGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#fff7d6" />
              <stop offset="30%"  stopColor="#e8c245" />
              <stop offset="70%"  stopColor="#b3903e" />
              <stop offset="100%" stopColor="#7a5e12" />
            </linearGradient>
          </defs>
          <path
            d="M2 1 L2 22 L8 17 L11.5 24.5 L14.5 23 L11 16 L18.5 16 Z"
            fill="url(#wrCursorGold)"
            stroke="#2a1d06"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  )
}
