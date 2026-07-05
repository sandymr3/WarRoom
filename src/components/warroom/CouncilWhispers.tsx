'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { investorPortraitSrc } from '@/src/lib/investorAssets'
import { investorDisplayName } from '@/src/lib/helpers'
import type { Investor, InvestorScorecard } from '@/src/types'

// ============================================================
// <CouncilWhispers />
// ----------------------------------------------------------------
// During the between-round interlude, 2-3 council members WHO
// AREN'T currently speaking flash on screen with a 1-line gut
// reaction to the last round. Pulled from their scorecard's
// `investorReaction` / `redFlagReasons` / first sentence of
// reaction text — whatever's available.
//
// Visual: portraits + speech-bubble line, sliding in from
// alternating sides, staggered by ~700ms. Auto-dismisses after
// `holdMs` per whisper. Fires the `onComplete` callback when
// the last one fades out so the parent can advance.
//
// If there's no scorecard data for a non-active investor, that
// member is skipped — we never invent dialogue.
// ============================================================

interface CouncilWhispersProps {
  investors: Investor[]
  scorecards: InvestorScorecard[]
  /** The investor currently in the hot seat. They're excluded
   *  from whispers (they're the one being talked about). */
  activeInvestorId?: string | null
  /** Show / hide the layer. */
  open: boolean
  /** Max number of whispers shown. Default 3. */
  maxWhispers?: number
  /** ms each whisper holds on screen. Default 2400. */
  holdMs?: number
  /** ms between whispers entering. Default 700. */
  staggerMs?: number
  onComplete?: () => void
  className?: string
}

interface Whisper {
  investor: Investor
  line: string
  side: 'left' | 'right'
}

const FALLBACK_LINES = [
  'A familiar lord shifts in his seat.',
  'The brazier crackles. No one speaks.',
  'A raven beats against the stained glass.',
]

export function CouncilWhispers({
  investors,
  scorecards,
  activeInvestorId,
  open,
  maxWhispers = 3,
  holdMs = 2400,
  staggerMs = 700,
  onComplete,
  className,
}: CouncilWhispersProps) {
  const reducedMotion = useReducedMotion()

  const whispers = useMemo<Whisper[]>(() => {
    const byId = new Map(scorecards.map((s) => [s.investorId, s]))
    const eligible = investors.filter((inv) => inv.id !== activeInvestorId)

    // Prefer investors whose scorecards carry concrete reaction text.
    const sorted = eligible
      .map((inv) => ({ inv, card: byId.get(inv.id) ?? null }))
      .sort((a, b) => {
        const aScore = scoreReactionStrength(a.card)
        const bScore = scoreReactionStrength(b.card)
        return bScore - aScore
      })

    const picked = sorted.slice(0, Math.max(0, maxWhispers))
    return picked.map((p, i) => ({
      investor: p.inv,
      line: extractReactionLine(p.card) ?? FALLBACK_LINES[i % FALLBACK_LINES.length],
      side: i % 2 === 0 ? 'left' : 'right',
    }))
  }, [investors, scorecards, activeInvestorId, maxWhispers])

  // Reveal whispers one-by-one
  const [visibleCount, setVisibleCount] = useState(0)
  useEffect(() => {
    let cancelled = false
    const timers: number[] = []

    // Defer all state writes by one task tick so they're async with respect
    // to the effect body (keeps react-hooks/set-state-in-effect satisfied).
    const kickoff = window.setTimeout(() => {
      if (cancelled) return

      if (!open) {
        setVisibleCount(0)
        return
      }
      if (whispers.length === 0) {
        onComplete?.()
        return
      }

      for (let i = 0; i < whispers.length; i++) {
        timers.push(
          window.setTimeout(() => {
            if (cancelled) return
            setVisibleCount(i + 1)
          }, i * staggerMs),
        )
      }
      // Schedule completion after the last whisper has fully held.
      const totalMs = (whispers.length - 1) * staggerMs + holdMs
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return
          onComplete?.()
        }, totalMs),
      )
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(kickoff)
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [open, whispers, staggerMs, holdMs, onComplete])

  if (!open) return null

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 flex flex-col items-stretch justify-center gap-4 px-4 sm:px-10',
        className,
      )}
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {whispers.slice(0, visibleCount).map((w, i) => (
          <motion.div
            key={`${w.investor.id}-${i}`}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: w.side === 'left' ? -40 : 40, y: 0 }
            }
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: w.side === 'left' ? -20 : 20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
              'flex max-w-md items-center gap-3 rounded-md border border-[color:var(--color-warroom-gold)]/30 bg-card/85 p-3 backdrop-blur-md',
              w.side === 'left' ? 'self-start' : 'self-end',
            )}
            style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.5)' }}
          >
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-[color:var(--color-warroom-gold)]/30 bg-muted">
              {w.investor.id || w.investor.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={investorPortraitSrc(w.investor)}
                  alt={investorDisplayName(w.investor.name)}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center font-display text-xs font-semibold text-foreground/60">
                  {initialsOf(investorDisplayName(w.investor.name))}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-[color:var(--color-warroom-gold)]/70">
                {investorDisplayName(w.investor.name)} counsels
              </p>
              <p className="text-sm italic leading-snug text-foreground/85">&ldquo;{w.line}&rdquo;</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Rank scorecards by how much usable reaction text they contain.
function scoreReactionStrength(card: InvestorScorecard | null): number {
  if (!card) return 0
  let s = 0
  if (card.investorReaction?.trim()) s += 3
  if (card.redFlagReasons?.length) s += 2
  if (typeof card.primaryScore === 'number') s += 1
  return s
}

function extractReactionLine(card: InvestorScorecard | null): string | null {
  if (!card) return null
  const fromReaction = firstSentence(card.investorReaction)
  if (fromReaction) return fromReaction
  if (card.redFlagReasons && card.redFlagReasons.length > 0) {
    return card.redFlagReasons[0]
  }
  return null
}

function firstSentence(text: string | undefined): string | null {
  if (!text) return null
  const trimmed = text.trim()
  if (!trimmed) return null
  const match = trimmed.match(/^(.+?[.!?])(\s|$)/)
  if (match) return match[1].trim()
  // No terminator — return the first ~120 chars.
  return trimmed.length > 120 ? `${trimmed.slice(0, 117).trimEnd()}…` : trimmed
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
