'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { audioManager } from '@/lib/audio/audioManager'
import { EmberParticles } from '@/src/components/effects/EmberParticles'

// ============================================================
// <RoundCompleteOverlay />
// ----------------------------------------------------------------
// Fullscreen interlude between investor rounds. Shows:
//   • The round label (e.g. "Round 2 of 3 — Cleared")
//   • A sparkline of the founder's scores across rounds so far
//   • Verdict text ("Round survived" vs "The council is unmoved")
//   • Continue button → onContinue()
//
// Auto-fires the appropriate SFX on mount:
//   • Latest score ≥ 60 → triumph_fanfare
//   • Otherwise          → chains
//
// `audioManager.playSfx` routes through LEGACY_SFX_ALIASES to
// the Web Audio synth when no MP3 is on disk.
// ============================================================

interface RoundCompleteOverlayProps {
  /** Sequence of per-round scores so far (0-100). Latest = last index. */
  scores: number[]
  open: boolean
  /** Index of THIS round (0-based) — controls the heading label. */
  roundIndex: number
  /** Total rounds in the trial. */
  totalRounds?: number
  onContinue: () => void
  /** Custom verdict line. Defaults derive from latest score. */
  message?: string
  /** Override the success threshold (default 60). */
  successThreshold?: number
}

const SPARK_W = 240
const SPARK_H = 64

export function RoundCompleteOverlay({
  scores,
  open,
  roundIndex,
  totalRounds,
  onContinue,
  message,
  successThreshold = 60,
}: RoundCompleteOverlayProps) {
  const reducedMotion = useReducedMotion()
  const latest = scores.length > 0 ? scores[scores.length - 1] : 0
  const survived = latest >= successThreshold

  // Fire SFX on mount of the overlay (not on every re-render)
  useEffect(() => {
    if (!open) return
    audioManager.playSfx(survived ? 'sim.stage-clear' : 'ui.error', survived ? 0.55 : 0.5)
  }, [open, survived])

  const verdict = message ?? (survived ? 'Round survived.' : 'The Board is unmoved.')
  const headingLabel = totalRounds
    ? `Round ${roundIndex + 1} of ${totalRounds}`
    : `Round ${roundIndex + 1}`

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="round-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9500] flex items-center justify-center bg-black/85 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${headingLabel} — ${verdict}`}
        >
          {/* Atmospheric layer */}
          <EmberParticles className="opacity-50" density={26} speed={0.7} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: survived
                ? 'radial-gradient(ellipse at center, rgba(179,144,62,0.08) 0%, rgba(0,0,0,0.92) 75%)'
                : 'radial-gradient(ellipse at center, rgba(92,26,36,0.12) 0%, rgba(0,0,0,0.95) 75%)',
            }}
          />

          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            className="relative z-10 mx-4 w-full max-w-lg rounded-md border border-[color:var(--color-warroom-gold)]/30 bg-card/85 p-8 text-center backdrop-blur-md noise-overlay"
            style={{
              boxShadow:
                '0 12px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(179,144,62,0.15)',
            }}
          >
            <p className="font-display text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-warroom-gold)]/70">
              {headingLabel}
            </p>
            <h2
              className={cn(
                'mt-2 font-display text-3xl font-bold uppercase tracking-wider sm:text-4xl',
                survived
                  ? 'text-[color:var(--color-warroom-gold-bright)]'
                  : 'text-[color:var(--color-warroom-crimson-bright)]',
              )}
              style={{
                textShadow: survived
                  ? '0 0 30px rgba(179,144,62,0.4)'
                  : '0 0 30px rgba(92,26,36,0.4)',
              }}
            >
              {verdict}
            </h2>

            {scores.length > 0 && (
              <div className="mx-auto mt-6 max-w-xs">
                <p className="mb-2 font-display text-[0.6rem] uppercase tracking-[0.22em] text-foreground/45">
                  Trial record
                </p>
                <Sparkline scores={scores} survived={survived} />
                <p className="mt-2 font-mono text-sm tabular-nums text-foreground/70">
                  Latest:&nbsp;
                  <span
                    className={cn(
                      'font-semibold',
                      survived ? 'text-[color:var(--color-warroom-gold-bright)]' : 'text-[color:var(--color-warroom-crimson-bright)]',
                    )}
                  >
                    {Math.round(latest)}
                  </span>
                  <span className="text-foreground/40"> / 100</span>
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onContinue}
              className={cn(
                'mt-8 inline-flex items-center gap-2 rounded-sm border px-6 py-2.5',
                'font-display text-xs font-bold uppercase tracking-[0.16em]',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'border-[color:var(--color-warroom-gold)]/45 bg-[color:var(--color-warroom-obsidian)]/60 text-[color:var(--color-warroom-gold)]',
                'hover:border-[color:var(--color-warroom-gold)]/85 hover:bg-[color:var(--color-warroom-obsidian)]/80 hover:shadow-[0_0_22px_rgba(179,144,62,0.35)]',
              )}
            >
              Next investor <span aria-hidden>→</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface SparklineProps {
  scores: number[]
  survived: boolean
}

function Sparkline({ scores, survived }: SparklineProps) {
  const points = scores.map((s, i) => {
    const x = scores.length === 1 ? SPARK_W / 2 : (i / (scores.length - 1)) * SPARK_W
    const y = SPARK_H - (Math.max(0, Math.min(100, s)) / 100) * SPARK_H
    return { x, y, score: s }
  })
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')
  const accent = survived ? '#d9b45f' : '#8e3644'

  return (
    <svg
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      className="block w-full"
      role="img"
      aria-label={`Score sparkline: ${scores.map((s) => Math.round(s)).join(', ')}`}
    >
      {/* Midline */}
      <line
        x1={0} y1={SPARK_H / 2}
        x2={SPARK_W} y2={SPARK_H / 2}
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeDasharray="2 4"
      />
      {/* Path */}
      <path d={pathD} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 4 : 2.2}
          fill={accent}
          stroke="#0a0805"
          strokeWidth="1"
        />
      ))}
    </svg>
  )
}
