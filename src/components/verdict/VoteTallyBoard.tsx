'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { investorPortraitSrc } from '@/src/lib/investorAssets'
import { investorDisplayName } from '@/src/lib/helpers'
import type { Investor, InvestorScorecard, DealDecision } from '@/src/types'
import type { VerdictLabel } from './InvestorVerdictReveal'

// ============================================================
// <VoteTallyBoard />
// ----------------------------------------------------------------
// One stone tablet per investor showing their locked verdict.
// Tablets stamp in sequentially (driven by `revealedCount`) with
// a satisfying scale+brightness flash.
//
// This is the AT-A-GLANCE summary that follows the per-investor
// dramatic reveals — it sits on screen permanently while the
// archetype and legacy score reveal below.
// ============================================================

interface VoteTallyBoardProps {
  investors: Investor[]
  scorecards: InvestorScorecard[]
  /** How many tablets have been locked-in so far. 0 = none yet.
   *  When equal to investors.length, every tablet is stamped. */
  revealedCount?: number
  className?: string
}

const DECISION_TO_LABEL: Record<DealDecision, VerdictLabel> = {
  PRIORITY_1: 'INVEST',
  PRIORITY_2: 'CONDITIONAL',
  WALK_OUT: 'PASS',
}

const TONE_CLS: Record<VerdictLabel, string> = {
  INVEST: 'text-emerald-200 border-emerald-400/60 bg-emerald-900/40',
  CONDITIONAL: 'text-[color:var(--color-warroom-gold-bright)] border-[color:var(--color-warroom-gold)]/55 bg-[color:var(--color-warroom-obsidian)]/70',
  PASS: 'text-[color:var(--color-warroom-crimson-bright)] border-[color:var(--color-warroom-crimson)]/60 bg-[color:var(--color-warroom-crimson)]/20',
}

export function VoteTallyBoard({
  investors,
  scorecards,
  revealedCount,
  className,
}: VoteTallyBoardProps) {
  const reducedMotion = useReducedMotion()
  const scorecardById = new Map(scorecards.map((s) => [s.investorId, s]))
  // Default: show all if not provided
  const reveal = revealedCount ?? investors.length

  return (
    <div
      className={cn(
        'grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6',
        className,
      )}
      aria-label="Board vote tally"
    >
      {investors.map((inv, i) => {
        const card = scorecardById.get(inv.id) ?? null
        const label: VerdictLabel = card ? DECISION_TO_LABEL[card.dealDecision] : 'PASS'
        const isRevealed = i < reveal
        return (
          <motion.div
            key={inv.id}
            initial={false}
            animate={
              reducedMotion
                ? { opacity: isRevealed ? 1 : 0.25 }
                : {
                    opacity: isRevealed ? 1 : 0.25,
                    scale: isRevealed ? 1 : 0.97,
                  }
            }
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className={cn(
              'relative flex flex-col items-center gap-2 rounded-sm border border-[color:var(--color-warroom-gold)]/30 bg-[color:var(--color-warroom-obsidian)]/70 p-3 noise-overlay',
              isRevealed ? 'shadow-[0_4px_20px_rgba(0,0,0,0.5)]' : 'shadow-none',
            )}
          >
            <div className="h-10 w-10 overflow-hidden rounded-full border border-[color:var(--color-warroom-gold)]/30 bg-muted">
              {inv.id || inv.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={investorPortraitSrc(inv)}
                  alt={investorDisplayName(inv.name)}
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display text-xs text-foreground/60">
                  {investorDisplayName(inv.name)
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
              )}
            </div>
            <p className="truncate text-[0.65rem] font-medium leading-tight text-foreground/70">
              {investorDisplayName(inv.name)}
            </p>
            <motion.div
              initial={false}
              animate={
                reducedMotion
                  ? { opacity: isRevealed ? 1 : 0 }
                  : isRevealed
                    ? { scale: [1.3, 1], opacity: [0, 1] }
                    : { scale: 1, opacity: 0 }
              }
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className={cn(
                'w-full rounded-sm border px-2 py-1 text-center font-display text-[0.6rem] font-bold uppercase tracking-[0.16em]',
                TONE_CLS[label],
              )}
            >
              {isRevealed ? label : '—'}
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}
