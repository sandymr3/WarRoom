'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================================
// <FounderArchetypeCard />
// ----------------------------------------------------------------
// Elaborate parchment-gilt card revealing the founder's archetype
// (e.g. "The Reckless Visionary"). 3D rotateY flip on reveal.
//
// Front: gilded frame, sigil, archetype name in Cinzel.
// Back: archetypeNarrative prose.
// Click → toggle flip.
//
// Data sourced from EvaluationReport:
//   • entrepreneurType  → headline name
//   • archetypeNarrative → back-card description
// ============================================================

interface FounderArchetypeCardProps {
  archetypeName: string
  narrative: string
  /** Trigger the reveal flip after mount. Default true. */
  autoReveal?: boolean
  /** ms after mount before the reveal flip. Default 350. */
  revealDelayMs?: number
  className?: string
}

export function FounderArchetypeCard({
  archetypeName,
  narrative,
  autoReveal = true,
  revealDelayMs = 350,
  className,
}: FounderArchetypeCardProps) {
  const reducedMotion = useReducedMotion()
  const [isRevealed, setIsRevealed] = useState(reducedMotion ? true : !autoReveal)
  const [showBack, setShowBack] = useState(false)

  useEffect(() => {
    if (reducedMotion || !autoReveal) return
    const t = window.setTimeout(() => setIsRevealed(true), revealDelayMs)
    return () => window.clearTimeout(t)
  }, [autoReveal, reducedMotion, revealDelayMs])

  const toggleFlip = () => {
    if (reducedMotion) return
    setShowBack((v) => !v)
  }

  // Pre-reveal: card faces away (rotateY 180). After reveal: face front (0).
  // Manual flip toggles between 0 and 180.
  const rotY = !isRevealed ? -180 : showBack ? 180 : 0

  return (
    <div
      className={cn('relative mx-auto w-full max-w-md', className)}
      style={{ perspective: '1200px' }}
    >
      <motion.button
        type="button"
        onClick={toggleFlip}
        animate={{ rotateY: rotY }}
        transition={{ duration: 0.95, ease: [0.65, 0, 0.35, 1] }}
        className="relative block aspect-[3/4] w-full origin-center focus-visible:outline-none"
        style={{ transformStyle: 'preserve-3d' }}
        aria-label={`Founder archetype: ${archetypeName}. ${showBack ? 'Back' : 'Front'} of card. Click to flip.`}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 overflow-hidden rounded-md border border-[color:var(--color-warroom-gold)]/50 noise-overlay"
          style={{
            backfaceVisibility: 'hidden',
            background:
              'linear-gradient(135deg, #1a1208 0%, #2a1c0a 30%, #1a1208 70%, #0a0805 100%)',
            boxShadow:
              '0 20px 60px rgba(0,0,0,0.7), inset 0 0 30px rgba(179,144,62,0.12)',
          }}
        >
          {/* Gilt corners */}
          {(['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'] as const).map(
            (corner) => (
              <div
                key={corner}
                className={cn(
                  'absolute h-6 w-6 border-[color:var(--color-warroom-gold)]/60',
                  corner,
                  corner.includes('top-2 left-2') && 'border-l border-t',
                  corner.includes('top-2 right-2') && 'border-r border-t',
                  corner.includes('bottom-2 left-2') && 'border-l border-b',
                  corner.includes('bottom-2 right-2') && 'border-r border-b',
                )}
              />
            ),
          )}
          {/* Top-edge gold accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-3 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(217,180,95,0.85), transparent)',
            }}
          />

          {/* Sigil */}
          <div className="absolute inset-0 flex items-center justify-center opacity-25 [filter:drop-shadow(0_0_18px_rgba(179,144,62,0.5))]">
            <span className="font-display text-[10rem] leading-none text-[color:var(--color-warroom-gold)]">
              ⚜
            </span>
          </div>

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col items-center justify-between p-6 text-center">
            <div className="pt-2">
              <p className="font-display text-[0.6rem] uppercase tracking-[0.3em] text-[color:var(--color-warroom-gold)]/70">
                Founder Archetype
              </p>
            </div>
            <div>
              <h2
                className="font-display text-3xl font-bold uppercase tracking-wide text-[color:var(--color-warroom-gold-bright)] sm:text-4xl"
                style={{ textShadow: '0 0 28px rgba(217,180,95,0.5)' }}
              >
                {archetypeName}
              </h2>
            </div>
            <div className="pb-2">
              <p className="font-display text-[0.55rem] uppercase tracking-[0.22em] text-foreground/40">
                Tap to read
              </p>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 overflow-y-auto rounded-md border border-[color:var(--color-warroom-gold)]/40 p-6 text-left noise-overlay"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background:
              'linear-gradient(135deg, #2a1c0a 0%, #1a1208 80%)',
            boxShadow:
              '0 20px 60px rgba(0,0,0,0.7), inset 0 0 30px rgba(179,144,62,0.12)',
          }}
        >
          <p className="mb-3 font-display text-[0.6rem] uppercase tracking-[0.3em] text-[color:var(--color-warroom-gold)]/70">
            {archetypeName}
          </p>
          <p className="font-mono text-sm leading-relaxed text-foreground/85">
            {narrative}
          </p>
        </div>
      </motion.button>
    </div>
  )
}
