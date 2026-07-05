'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================================
// <ScoreReveal /> — dramatic score readout. Counts up from 0 to
// `value` over ~1.4s, bursts gold confetti at ≥80, and adds a
// crimson shake at <40.
//
// `canvas-confetti` is already in the dependency tree and is
// loaded dynamically here so we pay nothing on render unless
// a score actually triggers the celebration path.
//
// Mounted by the parent when the typewriter completes — typically
// `revealOnComplete && <ScoreReveal value={scorecard.primaryScore} />`.
// ============================================================

interface ScoreRevealProps {
  /** 0-100. Will be clamped. */
  value: number
  label?: string
  outOf?: number
  className?: string
  /** Trigger the celebration / shake effects. Pass false during
   *  re-mounts you don't want to re-fire SFX. Default true. */
  withEffects?: boolean
  /** Duration of the count-up in ms. Default 1400. */
  durationMs?: number
}

const TRIUMPH_THRESHOLD = 80
const FAILURE_THRESHOLD = 40

export function ScoreReveal({
  value,
  label = 'Score',
  outOf = 100,
  className,
  withEffects = true,
  durationMs = 1400,
}: ScoreRevealProps) {
  const reducedMotion = useReducedMotion()
  const clamped = Math.max(0, Math.min(outOf, value))
  const [animatedDisplay, setAnimatedDisplay] = useState(0)
  // Derive the rendered value — when reduced motion is on, skip the count-up entirely
  // and render the final value directly. No setState-in-effect needed for that path.
  const display = reducedMotion ? clamped : animatedDisplay
  const firedRef = useRef(false)

  // Count-up animation — only runs when motion is allowed. setState calls live inside
  // requestAnimationFrame callbacks (async), so they don't trigger the
  // react-hooks/set-state-in-effect rule.
  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    const start = performance.now()
    const from = 0
    const to = clamped
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimatedDisplay(Math.round(from + (to - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clamped, reducedMotion, durationMs])

  // Celebration confetti — fires once when value crosses TRIUMPH_THRESHOLD
  useEffect(() => {
    if (!withEffects || firedRef.current) return
    if (reducedMotion) return
    if (clamped < TRIUMPH_THRESHOLD) return
    firedRef.current = true
    let cancelled = false
    import('canvas-confetti')
      .then((mod) => {
        if (cancelled) return
        const fire = mod.default
        const burst = (originX: number) =>
          fire({
            particleCount: 60,
            spread: 70,
            origin: { x: originX, y: 0.6 },
            colors: ['#b3903e', '#d9b45f', '#e5a94d', '#f5e6c8'],
            scalar: 0.9,
            gravity: 0.7,
            ticks: 200,
          })
        burst(0.35)
        window.setTimeout(() => burst(0.65), 180)
      })
      .catch(() => {
        /* confetti unavailable — silently skip */
      })
    return () => {
      cancelled = true
    }
  }, [clamped, withEffects, reducedMotion])

  const isTriumph = clamped >= TRIUMPH_THRESHOLD
  const isFailure = clamped < FAILURE_THRESHOLD
  const tone = isTriumph
    ? 'text-[color:var(--color-warroom-gold-bright)]'
    : isFailure
      ? 'text-[color:var(--color-warroom-crimson-bright)]'
      : 'text-foreground'

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'flex items-baseline gap-3 rounded-sm border border-[color:var(--color-warroom-gold)]/30 bg-card/60 px-4 py-3 backdrop-blur-sm',
        isFailure && withEffects && !reducedMotion && 'animate-pulse [animation-duration:0.6s]',
        className,
      )}
      aria-live="polite"
    >
      <span className="font-display text-[0.6rem] uppercase tracking-[0.22em] text-foreground/55">
        {label}
      </span>
      <span className={cn('font-display text-3xl font-bold tabular-nums tracking-wider', tone)}>
        {display}
      </span>
      <span className="font-display text-sm text-foreground/45">/ {outOf}</span>
    </motion.div>
  )
}
