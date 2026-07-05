'use client'

import { useEffect } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { investorPortraitSrc } from '@/src/lib/investorAssets'
import { investorDisplayName } from '@/src/lib/helpers'
import type { Investor } from '@/src/types'

// ============================================================
// <CouncilMemberCard /> — single seat at the Board's table.
//
// Renders a portrait thumb + name + lens badge per investor in
// the roster strip. The mood-driven aura is the load-bearing
// visual: a glowing border whose colour reflects the council
// member's running disposition.
//
// Click → shadcn Popover with bio, primary lens, bias trait, and
// the investor's signature question (so the founder can plan
// counters before they're put on the spot).
// ============================================================

export type CouncilMood = 'neutral' | 'interested' | 'skeptical' | 'impressed' | 'hostile'

interface CouncilMemberCardProps {
  investor: Investor
  mood: CouncilMood
  isActive: boolean
  /** Disables the popover (e.g. while overlays are open). */
  disableBio?: boolean
  /** Counter that increments whenever the council should "stir" (active
   *  member just changed). When it bumps, the card briefly rotate-shakes. */
  stirSignal?: number
  className?: string
}

const MOOD_RING: Record<CouncilMood, string> = {
  neutral:    'ring-zinc-400/40',
  interested: 'ring-amber-300/70',
  skeptical:  'ring-orange-400/70',
  impressed:  'ring-emerald-400/80',
  hostile:    'ring-red-500/80',
}

const MOOD_GLOW: Record<CouncilMood, string> = {
  neutral:    'shadow-[0_0_18px_rgba(161,161,170,0.25)]',
  interested: 'shadow-[0_0_22px_rgba(252,211,77,0.4)]',
  skeptical:  'shadow-[0_0_22px_rgba(251,146,60,0.45)]',
  impressed:  'shadow-[0_0_26px_rgba(52,211,153,0.55)]',
  hostile:    'shadow-[0_0_26px_rgba(239,68,68,0.55)]',
}

const MOOD_LABEL: Record<CouncilMood, string> = {
  neutral:    'Listening',
  interested: 'Interested',
  skeptical:  'Skeptical',
  impressed:  'Impressed',
  hostile:    'Hostile',
}

export function CouncilMemberCard({
  investor,
  mood,
  isActive,
  disableBio = false,
  stirSignal,
  className,
}: CouncilMemberCardProps) {
  const reducedMotion = useReducedMotion()
  const stirControls = useAnimationControls()
  const displayName = investorDisplayName(investor.name)
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // "Council stirs" — fire a brief shake when stirSignal increments.
  // Skipped under reducedMotion. Skipped on the very first render so the
  // initial mount doesn't stir.
  useEffect(() => {
    if (stirSignal === undefined) return
    if (reducedMotion) return
    void stirControls.start({
      rotate: [0, -1.4, 1.2, -0.6, 0],
      transition: { duration: 0.5, ease: 'easeInOut' },
    })
  }, [stirSignal, reducedMotion, stirControls])

  const card = (
    <motion.div animate={stirControls} className="origin-center">
    <motion.div
      layout
      initial={false}
      animate={
        reducedMotion
          ? { opacity: isActive ? 1 : 0.6 }
          : {
              scale: isActive ? 1.04 : 1,
              opacity: isActive ? 1 : 0.6,
            }
      }
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-md border border-border bg-card/80 p-2.5 backdrop-blur-sm',
        'ring-1 ring-inset transition-shadow duration-300',
        MOOD_RING[mood],
        isActive && MOOD_GLOW[mood],
        'hover:opacity-100',
        className,
      )}
      data-active={isActive ? 'true' : 'false'}
      data-mood={mood}
    >
      <div
        className={cn(
          'relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-border bg-muted',
          isActive && 'ring-1 ring-amber-300/60',
        )}
      >
        {investor.id || investor.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={investorPortraitSrc(investor)}
            alt={displayName}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-semibold text-foreground/60">
            {initials || '?'}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-display text-sm font-semibold leading-tight text-foreground">
          {displayName}
        </span>
        <span className="truncate text-[0.62rem] uppercase tracking-[0.18em] text-foreground/55">
          {MOOD_LABEL[mood]}
        </span>
      </div>
    </motion.div>
    </motion.div>
  )

  if (disableBio) return card

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
          aria-label={`${displayName} — view bio`}
        >
          {card}
        </button>
      </PopoverTrigger>
      <PopoverContent side="left" align="start" className="w-80">
        <div className="space-y-2.5">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">{displayName}</h3>
            {investor.primary_lens && (
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-amber-400">
                {investor.primary_lens}
              </p>
            )}
          </div>
          {investor.bio && (
            <p className="text-sm leading-relaxed text-foreground/80">{investor.bio}</p>
          )}
          {investor.bias_trait_name && (
            <p className="text-xs text-foreground/70">
              <span className="font-semibold uppercase tracking-wider text-foreground/50">
                Bias:&nbsp;
              </span>
              {investor.bias_trait_name}
            </p>
          )}
          {investor.signature_question && (
            <div className="rounded-sm border-l-2 border-amber-400/60 bg-muted/60 px-3 py-2">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-foreground/50">
                Signature question
              </p>
              <p className="mt-1 text-sm italic text-foreground/85">
                &ldquo;{investor.signature_question}&rdquo;
              </p>
            </div>
          )}
          {investor.characteristics && investor.characteristics.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 pt-1">
              {investor.characteristics.slice(0, 6).map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-foreground/70"
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
