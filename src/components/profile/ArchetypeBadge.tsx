'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// <ArchetypeBadge />
// ----------------------------------------------------------------
// Compact display of the founder's archetype. Used on:
//   • /profile hero
//   • /dashboard "your current standing" panel
//   • anywhere we surface entrepreneurType
//
// Variants:
//   'inline'  — small chip-style for inline use
//   'hero'    — big Cinzel display for the profile page
//   'compact' — single-line label + name, dashboard-friendly
//
// Pure presentational. No data fetching.
// ============================================================

export type ArchetypeBadgeVariant = 'inline' | 'hero' | 'compact'

interface ArchetypeBadgeProps {
  archetypeName: string
  /** Optional tier/role description shown under the name. */
  tier?: string
  variant?: ArchetypeBadgeVariant
  className?: string
}

export function ArchetypeBadge({
  archetypeName,
  tier,
  variant = 'inline',
  className,
}: ArchetypeBadgeProps) {
  if (variant === 'hero') {
    return (
      <div className={cn('flex flex-col items-center gap-2 text-center', className)}>
        <span className="font-display text-[0.6rem] uppercase tracking-[0.32em] text-[color:var(--color-warroom-gold)]/70">
          Founder Archetype
        </span>
        <h2
          className="font-display text-3xl font-bold uppercase tracking-wide text-[color:var(--color-warroom-gold-bright)] sm:text-4xl"
          style={{ textShadow: '0 0 30px rgba(217,180,95,0.45)' }}
        >
          {archetypeName}
        </h2>
        {tier && (
          <p className="font-display text-xs uppercase tracking-[0.18em] text-foreground/55">
            {tier}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-sm border border-[color:var(--color-warroom-gold)]/30 bg-card/70 px-3 py-2 backdrop-blur-sm',
          className,
        )}
      >
        <span aria-hidden className="font-display text-base text-[color:var(--color-warroom-gold)]">
          ⚜
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="font-display text-[0.55rem] uppercase tracking-[0.22em] text-foreground/50">
            Archetype
          </span>
          <span className="truncate font-display text-sm font-semibold text-foreground">
            {archetypeName}
          </span>
        </div>
      </div>
    )
  }

  // inline
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border border-[color:var(--color-warroom-gold)]/35 bg-[color:var(--color-warroom-obsidian)]/55 px-2 py-0.5 font-display text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-warroom-gold)]',
        className,
      )}
    >
      <span aria-hidden>⚜</span>
      {archetypeName}
    </span>
  )
}
