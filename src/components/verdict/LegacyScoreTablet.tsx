'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================================
// <LegacyScoreTablet />
// ----------------------------------------------------------------
// The founder's final ledger entry — a wax-sealed engraved stone
// tablet that displays the run's overall score with a count-up
// from 0. Sits at the bottom of the ceremony as the closing line.
//
// Score is passed in as 0-100 (composite that the page decides
// how to derive — average of investor primary scores is a
// reasonable default).
// ============================================================

interface LegacyScoreTabletProps {
  value: number
  outOf?: number
  label?: string
  /** Single-line attestation under the number (e.g. archetype name). */
  attestation?: string
  /** Delay before the count-up starts. Default 400ms. */
  delayMs?: number
  /** Duration of the count-up. Default 2000ms. */
  durationMs?: number
  className?: string
}

export function LegacyScoreTablet({
  value,
  outOf = 100,
  label = 'Legacy Score',
  attestation,
  delayMs = 400,
  durationMs = 2000,
  className,
}: LegacyScoreTabletProps) {
  const reducedMotion = useReducedMotion()
  const clamped = Math.max(0, Math.min(outOf, value))
  const [display, setDisplay] = useState(reducedMotion ? clamped : 0)

  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    let startTime: number | null = null
    const tick = (now: number) => {
      if (startTime === null) startTime = now
      const elapsed = now - startTime - delayMs
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick)
        return
      }
      const t = Math.min(1, elapsed / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(clamped * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clamped, reducedMotion, delayMs, durationMs])

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={cn(
        'relative mx-auto w-full max-w-md overflow-hidden rounded-md border border-[color:var(--color-warroom-gold)]/40 p-6 text-center noise-overlay',
        className,
      )}
      style={{
        background:
          'linear-gradient(135deg, #2a2520 0%, #1a1208 50%, #14100c 100%)',
        boxShadow:
          '0 20px 60px rgba(0,0,0,0.7), inset 0 0 30px rgba(58,48,28,0.6), inset 0 1px 0 rgba(179,144,62,0.18)',
      }}
      role="status"
      aria-label={`${label}: ${Math.round(display)} of ${outOf}`}
    >
      {/* Wax seal in the top-right corner */}
      <div
        aria-hidden
        className="absolute -right-3 -top-3 flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background:
            'radial-gradient(circle at 35% 30%, #8e3644 0%, #5c1a24 55%, #5c1010 100%)',
          boxShadow:
            '0 6px 18px rgba(0,0,0,0.6), inset 0 -3px 6px rgba(0,0,0,0.5), inset 0 3px 4px rgba(255,255,255,0.18)',
        }}
      >
        <span className="font-display text-xl text-[color:var(--color-warroom-parchment)] opacity-80">
          ⚜
        </span>
      </div>

      <p className="font-display text-[0.6rem] uppercase tracking-[0.3em] text-[color:var(--color-warroom-gold)]/70">
        {label}
      </p>

      <div className="mt-2 flex items-baseline justify-center gap-2">
        <span
          className="font-display text-6xl font-bold tabular-nums tracking-wider text-[color:var(--color-warroom-gold-bright)] sm:text-7xl"
          style={{
            textShadow: '0 0 36px rgba(217,180,95,0.45), 0 2px 0 rgba(0,0,0,0.6)',
          }}
        >
          {display}
        </span>
        <span className="font-display text-2xl text-foreground/45">
          / {outOf}
        </span>
      </div>

      {/* Engraved attestation */}
      {attestation && (
        <p
          className="mt-3 font-display text-xs uppercase tracking-[0.18em] text-[color:var(--color-warroom-parchment)]/70"
          style={{ textShadow: '0 1px 0 rgba(0,0,0,0.7)' }}
        >
          — {attestation} —
        </p>
      )}

      {/* Decorative under-line */}
      <div
        aria-hidden
        className="mx-auto mt-5 h-px w-32"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(179,144,62,0.55), transparent)',
        }}
      />
    </motion.div>
  )
}
