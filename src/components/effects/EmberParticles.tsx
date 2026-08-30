'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface EmberParticlesProps {
  className?: string
  density?: number
  speed?: number
  hueShift?: number
}

interface Particle {
  x: number
  y: number
  size: number
  vy: number
  vx: number
  life: number
  maxLife: number
  brightness: number
}

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

/**
 * Subtle silver/white ambient particles — replaces the medieval ember effect.
 * Sparse, slow-drifting motes that evoke a premium tournament hall atmosphere.
 */
export function EmberParticles({
  className,
  density = 20,
  speed = 1,
}: EmberParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia(reducedMotionQuery).matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let particles: Particle[] = []
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const { width, height } = parent.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = (initial = false): Particle => {
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      const maxLife = 3000 + Math.random() * 3000
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + Math.random() * 20,
        size: 0.6 + Math.random() * 1.4,
        vy: -(0.08 + Math.random() * 0.22) * speed,
        vx: (Math.random() - 0.5) * 0.15 * speed,
        life: 0,
        maxLife,
        brightness: 70 + Math.random() * 30,
      }
    }

    const populate = () => {
      particles = Array.from({ length: density }, () => spawn(true))
    }

    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(48, now - last)
      last = now
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.life += dt
        p.x += p.vx * (dt / 16)
        p.y += p.vy * (dt / 16)
        p.vx += (Math.random() - 0.5) * 0.01

        const t = p.life / p.maxLife
        const alpha = Math.max(0, Math.sin(Math.PI * Math.min(1, t))) * 0.45
        const glow = p.size * 3.5

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow)
        grad.addColorStop(0, `rgba(${p.brightness * 2}, ${p.brightness * 2}, ${p.brightness * 2}, ${alpha})`)
        grad.addColorStop(0.5, `rgba(200, 200, 200, ${alpha * 0.3})`)
        grad.addColorStop(1, `rgba(200, 200, 200, 0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, glow, 0, Math.PI * 2)
        ctx.fill()

        if (p.life >= p.maxLife || p.y < -20) {
          particles[i] = spawn(false)
        }
      }

      raf = requestAnimationFrame(frame)
    }

    resize()
    populate()
    raf = requestAnimationFrame(frame)

    let resizeFrame = 0
    const scheduleResize = () => {
      if (resizeFrame !== 0) return
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0
        resize()
        populate()
      })
    }
    const ro = new ResizeObserver(scheduleResize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    return () => {
      cancelAnimationFrame(raf)
      if (resizeFrame) cancelAnimationFrame(resizeFrame)
      ro.disconnect()
    }
  }, [density, speed])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  )
}
