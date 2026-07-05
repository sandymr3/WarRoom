'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { audioManager } from '@/lib/audio/audioManager'
import type { EvaluationReport, Investor, InvestorScorecard } from '@/src/types'
import { EmberDriftBackdrop } from './EmberDriftBackdrop'
import { InvestorVerdictReveal } from './InvestorVerdictReveal'
import { VoteTallyBoard } from './VoteTallyBoard'
import { FounderArchetypeCard } from './FounderArchetypeCard'
import { LegacyScoreTablet } from './LegacyScoreTablet'
import { ShareCard } from './ShareCard'
import { ShareVerdictButton } from './ShareVerdictButton'

// ============================================================
// <VerdictCeremony />
// ----------------------------------------------------------------
// Orchestrates the closing ceremony. Sequence:
//
//   ACT 1 — Per-investor reveals (one at a time, alternating sides)
//   ACT 2 — Vote tally board appears, all stamps lit
//   ACT 3 — Founder archetype card flips in
//   ACT 4 — Legacy score tablet rises with count-up
//   ACT 5 — Share controls + "Continue to full report" CTA
//
// Pure presentational. Data comes from props:
//   • investors: the selected council (from CharactersState)
//   • scorecards: GET /warroom/scorecard
//   • report: GET /assessments/:id/report (optional — controls
//     the archetype card. Skipped gracefully if absent.)
//
// `onContinue` fires when the user clicks "Continue to report".
// ============================================================

interface VerdictCeremonyProps {
  investors: Investor[]
  scorecards: InvestorScorecard[]
  report: EvaluationReport | null
  founderName?: string
  onContinue: () => void
  className?: string
}

type Act = 'reveals' | 'tally' | 'archetype' | 'score' | 'share'

const ACT_ORDER: Act[] = ['reveals', 'tally', 'archetype', 'score', 'share']

function computeLegacyScore(scorecards: InvestorScorecard[]): number {
  if (scorecards.length === 0) return 0
  const sum = scorecards.reduce((acc, s) => acc + (s.primaryScore || 0), 0)
  return Math.round(sum / scorecards.length)
}

export function VerdictCeremony({
  investors,
  scorecards,
  report,
  founderName,
  onContinue,
  className,
}: VerdictCeremonyProps) {
  // Order scorecards by the investor order (so the reveal cadence matches
  // the council layout shown elsewhere). Missing scorecards still get a slot.
  const ordered = useMemo(
    () => investors.map((inv) => scorecards.find((s) => s.investorId === inv.id) ?? null),
    [investors, scorecards],
  )

  const [revealedInvestors, setRevealedInvestors] = useState(0)
  const [currentAct, setCurrentAct] = useState<Act>('reveals')
  const shareCardRef = useRef<HTMLDivElement>(null)

  const legacyScore = useMemo(() => computeLegacyScore(scorecards), [scorecards])
  const archetypeName = report?.entrepreneurType?.trim() || 'The Unseen Founder'
  const archetypeNarrative =
    report?.archetypeNarrative?.trim() ||
    'The Board saw what could not yet be named. Your story is still being written.'

  // Fire ravens_wings on opening curtain
  useEffect(() => {
    audioManager.playSfx('sim.mentor-enter', 0.5)
  }, [])

  // Advance through the acts as each completes
  const advanceFromReveal = useCallback(() => {
    setRevealedInvestors((n) => {
      const next = n + 1
      if (next >= ordered.length) {
        // Hold a beat, then move to tally
        window.setTimeout(() => setCurrentAct('tally'), 600)
      }
      return next
    })
  }, [ordered.length])

  useEffect(() => {
    if (currentAct !== 'tally') return
    const t = window.setTimeout(() => setCurrentAct('archetype'), 1400)
    return () => window.clearTimeout(t)
  }, [currentAct])

  useEffect(() => {
    if (currentAct !== 'archetype') return
    const t = window.setTimeout(() => setCurrentAct('score'), 2400)
    return () => window.clearTimeout(t)
  }, [currentAct])

  useEffect(() => {
    if (currentAct !== 'score') return
    // Final fanfare on the score tablet appearing.
    audioManager.playSfx('wr.invest', 0.55)
    const t = window.setTimeout(() => setCurrentAct('share'), 2400)
    return () => window.clearTimeout(t)
  }, [currentAct])

  const actIndex = ACT_ORDER.indexOf(currentAct)
  const showRevealsActive = currentAct === 'reveals'
  const showTally = actIndex >= ACT_ORDER.indexOf('tally')
  const showArchetype = actIndex >= ACT_ORDER.indexOf('archetype')
  const showScore = actIndex >= ACT_ORDER.indexOf('score')
  const showShare = actIndex >= ACT_ORDER.indexOf('share')

  const shareText = `The Board has rendered its verdict. I am ${archetypeName}. Legacy score: ${legacyScore}/100. — The Gambit`

  return (
    <div className={cn('relative min-h-screen w-full overflow-hidden bg-[color:var(--color-warroom-black)] text-foreground', className)}>
      <EmberDriftBackdrop density={70} />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 py-12 sm:py-16">
        {/* Opening title */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="text-center"
        >
          <p className="font-display text-[0.65rem] uppercase tracking-[0.32em] text-[color:var(--color-warroom-gold)]/70">
            The Board Has Returned
          </p>
          <h1
            className="mt-2 font-display text-4xl font-bold uppercase tracking-wider text-[color:var(--color-warroom-gold-bright)] sm:text-5xl"
            style={{ textShadow: '0 0 38px rgba(217,180,95,0.45)' }}
          >
            The Verdict
          </h1>
        </motion.header>

        {/* ACT 1 — per-investor reveals */}
        {showRevealsActive && ordered[revealedInvestors] !== undefined && (
          <div className="flex w-full flex-col items-center gap-6">
            <p className="font-display text-[0.6rem] uppercase tracking-[0.22em] text-foreground/45">
              {revealedInvestors + 1} of {ordered.length}
            </p>
            <InvestorVerdictReveal
              key={investors[revealedInvestors]?.id}
              investor={investors[revealedInvestors]}
              scorecard={ordered[revealedInvestors]}
              side={revealedInvestors % 2 === 0 ? 'left' : 'right'}
              onComplete={advanceFromReveal}
            />
          </div>
        )}

        {/* ACT 2 — full vote tally */}
        {showTally && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex w-full flex-col items-center gap-4"
          >
            <p className="font-display text-[0.6rem] uppercase tracking-[0.22em] text-foreground/55">
              The Board records its votes
            </p>
            <VoteTallyBoard investors={investors} scorecards={scorecards} />
          </motion.section>
        )}

        {/* ACT 3 — founder archetype */}
        {showArchetype && (
          <FounderArchetypeCard archetypeName={archetypeName} narrative={archetypeNarrative} />
        )}

        {/* ACT 4 — legacy score */}
        {showScore && (
          <LegacyScoreTablet value={legacyScore} attestation={archetypeName} />
        )}

        {/* ACT 5 — share + continue */}
        {showShare && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex w-full flex-col items-center gap-5 pt-4"
          >
            <ShareVerdictButton
              cardRef={shareCardRef}
              shareText={shareText}
            />
            <button
              type="button"
              onClick={onContinue}
              className={cn(
                'mt-2 inline-flex items-center gap-2 rounded-sm border px-6 py-3',
                'font-display text-xs font-bold uppercase tracking-[0.16em]',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'border-[color:var(--color-warroom-gold)]/55 text-[color:var(--color-warroom-gold)]',
                'hover:border-[color:var(--color-warroom-gold)] hover:bg-[color:var(--color-warroom-obsidian)]/70 hover:shadow-[0_0_22px_rgba(179,144,62,0.4)]',
              )}
            >
              Read the full report <span aria-hidden>→</span>
            </button>
          </motion.section>
        )}
      </div>

      {/* Off-screen rasterise target — html2canvas captures this DOM node */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <ShareCard
          ref={shareCardRef}
          founderName={founderName}
          archetypeName={archetypeName}
          legacyScore={legacyScore}
          investors={investors}
          scorecards={scorecards}
        />
      </div>
    </div>
  )
}
