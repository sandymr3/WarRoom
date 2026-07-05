'use client'

// ============================================
// <RankInsignia /> — a gold medallion marking the founder's rank.
// A crown whose glow scales with tier, plus tier-count pips along the
// lower arc. Optional title underneath.
// ============================================

import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RankInsigniaProps {
  tier: number
  title?: string
  size?: number
  showTitle?: boolean
  className?: string
}

export function RankInsignia({
  tier,
  title,
  size = 64,
  showTitle = false,
  className,
}: RankInsigniaProps) {
  const pips = Math.max(0, Math.min(6, tier))
  const glow = 0.18 + Math.min(tier, 6) * 0.07

  // Pips along the bottom arc (210° → 330°).
  const pipNodes = Array.from({ length: pips }).map((_, i) => {
    const t = pips === 1 ? 0.5 : i / (pips - 1)
    const deg = 210 + t * 120
    const rad = (deg * Math.PI) / 180
    const cx = 50 + 38 * Math.cos(rad)
    const cy = 50 + 38 * Math.sin(rad)
    return <circle key={i} cx={cx} cy={cy} r={3.2} fill="var(--color-warroom-gold-bright)" />
  })

  return (
    <div className={cn('inline-flex flex-col items-center gap-1.5', className)}>
      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
        role="img"
        aria-label={title ? `Rank: ${title}` : `Rank tier ${tier}`}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="rank-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b6914" />
              <stop offset="50%" stopColor="#d9b45f" />
              <stop offset="100%" stopColor="#8b6914" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="rgba(10,8,5,0.92)" stroke="url(#rank-ring)" strokeWidth="3" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(179,144,62,0.25)" strokeWidth="1" />
          {pipNodes}
        </svg>
        <Crown
          aria-hidden
          style={{
            width: size * 0.4,
            height: size * 0.4,
            color: 'var(--color-warroom-gold-bright)',
            filter: `drop-shadow(0 0 ${6 + tier * 2}px rgba(217,180,95,${glow}))`,
          }}
        />
      </div>
      {showTitle && title && (
        <span
          className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-warroom-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </span>
      )}
    </div>
  )
}
