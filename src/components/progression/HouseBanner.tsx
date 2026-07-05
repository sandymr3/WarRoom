'use client'

// ============================================
// <HouseBanner /> — the founder's owned identity: crest (shape +
// palette), name, rank, and house words. Appears on the dashboard
// banner, the profile hero, and (later) the leaderboard + share card.
// ============================================

import { cn } from '@/lib/utils'
import type { HouseConfig, RankProgress } from '@/src/types'
import { houseSigilById, paletteById } from '@/src/lib/progression'
import { SigilCrest, iconForHouseSigil } from './SigilCrest'
import { RankInsignia } from './RankInsignia'

export interface HouseBannerProps {
  house: HouseConfig
  rank: RankProgress
  founderName?: string
  variant?: 'hero' | 'compact'
  className?: string
}

export function HouseBanner({
  house,
  rank,
  founderName,
  variant = 'compact',
  className,
}: HouseBannerProps) {
  const palette = paletteById(house.paletteId)
  const icon = iconForHouseSigil(house.sigilId)
  const shapeName = houseSigilById(house.sigilId).name

  if (variant === 'hero') {
    return (
      <div className={cn('flex flex-col items-center gap-3 text-center', className)}>
        <SigilCrest
          icon={icon}
          size={104}
          primary={palette.primary}
          secondary={palette.secondary}
          title={`${shapeName} of ${founderName ?? ''} Club`.trim()}
        />
        {founderName && (
          <h1
            className="text-2xl font-bold tracking-wide text-[color:var(--color-warroom-ghost)] sm:text-3xl"
            style={{ fontFamily: 'var(--font-display)', textShadow: '0 0 24px rgba(179,144,62,0.22)' }}
          >
            {founderName}
          </h1>
        )}
        <RankInsignia tier={rank.tier} title={rank.title} size={48} showTitle />
        {house.words && (
          <p
            className="max-w-xs text-sm italic text-[color:var(--color-warroom-smoke)]"
            style={{ fontFamily: 'var(--font-body, var(--font-display))' }}
          >
            &ldquo;{house.words}&rdquo;
          </p>
        )}
      </div>
    )
  }

  // compact
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <SigilCrest
        icon={icon}
        size={64}
        primary={palette.primary}
        secondary={palette.secondary}
        title={shapeName}
      />
      <div className="min-w-0">
        {founderName && (
          <div
            className="truncate text-lg font-bold tracking-[0.02em] text-[color:var(--color-warroom-ghost)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {founderName}
          </div>
        )}
        <div
          className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-warroom-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {rank.title}
        </div>
        {house.words && (
          <div
            className="mt-0.5 truncate text-xs italic text-[color:var(--color-warroom-smoke)]"
            style={{ fontFamily: 'var(--font-body, var(--font-display))' }}
          >
            &ldquo;{house.words}&rdquo;
          </div>
        )}
      </div>
    </div>
  )
}
