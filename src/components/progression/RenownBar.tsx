'use client'

// ============================================
// <RenownBar /> — rank insignia + a restrained progress rail toward
// the next title, with a CountUp of total Rating. The prestige spine's
// at-a-glance widget for the dashboard banner.
// ============================================

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { easeDramatic } from '@/lib/animations/variants'
import type { RankProgress } from '@/src/types'
import { RANKS, rankFraction } from '@/src/lib/progression'
import { CountUp } from '@/src/components/AnimatedComponents'
import { RankInsignia } from './RankInsignia'

export interface RenownBarProps {
  rank: RankProgress
  renown: number
  showInsignia?: boolean
  className?: string
}

export function RenownBar({ rank, renown, showInsignia = true, className }: RenownBarProps) {
  const prefersReduced = useReducedMotion()
  const frac = rankFraction(rank)
  const next = RANKS.find((r) => r.tier === rank.tier + 1)
  const atMax = rank.renownForNextTier == null

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {showInsignia && <RankInsignia tier={rank.tier} size={56} />}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span
            className="truncate text-sm font-semibold tracking-[0.04em] text-[color:var(--color-warroom-ghost)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {rank.title}
          </span>
          <span
            className="shrink-0 text-[11px] tracking-[0.08em] text-[color:var(--color-warroom-gold)]"
            style={{ fontFamily: 'var(--font-data, var(--font-mono))' }}
          >
            <CountUp end={renown} duration={1.4} /> Rating
          </span>
        </div>

        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-warroom-stone)]/60"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(frac * 100)}
          aria-label="Progress to next title"
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                'linear-gradient(90deg, var(--color-warroom-gold-dark), var(--color-warroom-gold-bright))',
              boxShadow: '0 0 10px rgba(179,144,62,0.45)',
            }}
            initial={prefersReduced ? false : { width: 0 }}
            animate={{ width: `${frac * 100}%` }}
            transition={{ duration: 1, ease: easeDramatic }}
          />
        </div>

        <div
          className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {atMax || !next
            ? 'Highest title — the summit of the Elo Ladder'
            : `${rank.renownIntoTier.toLocaleString()} / ${rank.renownForNextTier?.toLocaleString()} to ${next.title}`}
        </div>
      </div>
    </div>
  )
}
