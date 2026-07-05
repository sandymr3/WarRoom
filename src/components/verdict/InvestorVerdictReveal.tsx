'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { audioManager } from '@/lib/audio/audioManager'
import { useTypewriterReveal } from '@/src/hooks/useTypewriterReveal'
import { investorPortraitSrc } from '@/src/lib/investorAssets'
import { investorDisplayName } from '@/src/lib/helpers'
import type { Investor, InvestorScorecard, DealDecision } from '@/src/types'

// ============================================================
// <InvestorVerdictReveal />
// ----------------------------------------------------------------
// Per-investor reveal sequence in the verdict ceremony:
//   1. Portrait slides in (from alternating sides).
//   2. 1-2 sentence verdict types out (typewriter reveal).
//   3. Big stamped verdict label drops in: INVEST / CONDITIONAL / PASS.
//   4. `audioManager.playSfx('wr.vote-lock')` + brief flash on the stamp.
//   5. After `holdMs`, calls onComplete().
//
// dealDecision mapping:
//   PRIORITY_1 → INVEST       (best — wants in first)
//   PRIORITY_2 → CONDITIONAL  (interested, with terms)
//   WALK_OUT   → PASS         (out)
// ============================================================

export type VerdictLabel = 'INVEST' | 'CONDITIONAL' | 'PASS'

interface InvestorVerdictRevealProps {
  investor: Investor
  scorecard: InvestorScorecard | null
  side?: 'left' | 'right'
  /** Skip animations and reveal everything at once (used while seeking). */
  instant?: boolean
  /** ms the stamp stays on screen before onComplete fires. Default 1800. */
  holdMs?: number
  onComplete?: () => void
  className?: string
}

const DECISION_TO_LABEL: Record<DealDecision, VerdictLabel> = {
  PRIORITY_1: 'INVEST',
  PRIORITY_2: 'CONDITIONAL',
  WALK_OUT: 'PASS',
}

const LABEL_TONE: Record<VerdictLabel, { text: string; bg: string; border: string; shadow: string }> = {
  INVEST: {
    text: 'text-emerald-200',
    bg: 'bg-emerald-900/60',
    border: 'border-emerald-400/60',
    shadow: '0 0 30px rgba(52,211,153,0.55)',
  },
  CONDITIONAL: {
    text: 'text-[color:var(--color-warroom-gold-bright)]',
    bg: 'bg-[color:var(--color-warroom-obsidian)]/80',
    border: 'border-[color:var(--color-warroom-gold)]/60',
    shadow: '0 0 30px rgba(179,144,62,0.55)',
  },
  PASS: {
    text: 'text-[color:var(--color-warroom-crimson-bright)]',
    bg: 'bg-[color:var(--color-warroom-crimson)]/30',
    border: 'border-[color:var(--color-warroom-crimson)]/70',
    shadow: '0 0 30px rgba(92,26,36,0.55)',
  },
}

function deriveVerdictText(card: InvestorScorecard | null): string {
  if (!card) return 'No verdict was rendered.'
  const reaction = card.investorReaction?.trim()
  if (reaction) {
    const first = reaction.match(/^(.+?[.!?])(\s|$)/)
    if (first) return first[1].trim()
    return reaction.length > 180 ? `${reaction.slice(0, 177).trimEnd()}…` : reaction
  }
  if (card.redFlagReasons?.length) return card.redFlagReasons[0]
  // Score-only fallback
  if (card.primaryScore >= 75) return 'Their conviction was unshaken.'
  if (card.primaryScore >= 50) return 'They held the Board in tension.'
  return 'The chamber doubted their cause.'
}

export function InvestorVerdictReveal({
  investor,
  scorecard,
  side = 'left',
  instant = false,
  holdMs = 1800,
  onComplete,
  className,
}: InvestorVerdictRevealProps) {
  const reducedMotion = useReducedMotion()
  const verdictText = useMemo(() => deriveVerdictText(scorecard), [scorecard])
  const { revealedText, isComplete } = useTypewriterReveal(verdictText, {
    instant: instant || !!reducedMotion,
  })

  const label: VerdictLabel = scorecard
    ? DECISION_TO_LABEL[scorecard.dealDecision]
    : 'PASS'
  const tone = LABEL_TONE[label]

  const [showStamp, setShowStamp] = useState(false)
  const [stampFlash, setStampFlash] = useState(false)

  // Stamp appears once typewriter finishes
  useEffect(() => {
    if (!isComplete) return
    let cancelled = false
    const stampTimer = window.setTimeout(() => {
      if (cancelled) return
      setShowStamp(true)
      setStampFlash(true)
      audioManager.playSfx('wr.vote-lock', 0.55)
      window.setTimeout(() => {
        if (cancelled) return
        setStampFlash(false)
      }, 280)
    }, 200)
    const completeTimer = window.setTimeout(() => {
      if (cancelled) return
      onComplete?.()
    }, 200 + holdMs)
    return () => {
      cancelled = true
      window.clearTimeout(stampTimer)
      window.clearTimeout(completeTimer)
    }
  }, [isComplete, holdMs, onComplete])

  const displayName = investorDisplayName(investor.name)
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <motion.div
      initial={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, x: side === 'left' ? -50 : 50 }
      }
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={cn(
        'flex w-full max-w-2xl items-center gap-5 rounded-md border border-[color:var(--color-warroom-gold)]/25 bg-card/85 p-5 backdrop-blur-md noise-overlay',
        className,
      )}
      style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.55)' }}
    >
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-[color:var(--color-warroom-gold)]/40 bg-muted sm:h-24 sm:w-24">
        {investor.id || investor.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={investorPortraitSrc(investor)}
            alt={displayName}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold text-foreground/60">
            {initials || '?'}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display text-[0.6rem] uppercase tracking-[0.22em] text-[color:var(--color-warroom-gold)]/70">
          {displayName} declares
        </p>
        <p className="mt-1 font-mono text-sm leading-relaxed text-foreground/90 sm:text-base">
          &ldquo;{revealedText}
          {!isComplete && <span className="inline-block w-2 animate-pulse">▌</span>}&rdquo;
        </p>
      </div>

      {showStamp && (
        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { scale: 1.5, opacity: 0, rotate: -8 }}
          animate={reducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, rotate: -4 }}
          transition={{ type: 'spring', stiffness: 280, damping: 16 }}
          className={cn(
            'relative flex-shrink-0 rounded-sm border-2 px-4 py-2 sm:px-5',
            tone.bg,
            tone.border,
            stampFlash && 'brightness-150',
          )}
          style={{ boxShadow: tone.shadow, transition: 'filter 0.28s ease-out' }}
        >
          <span
            className={cn(
              'font-display text-base font-extrabold uppercase tracking-[0.18em] sm:text-lg',
              tone.text,
            )}
          >
            {label}
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}
