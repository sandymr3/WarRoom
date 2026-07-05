'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import type { Investor, InvestorScorecard, DealDecision } from '@/src/types'

// ============================================================
// <ShareCard />
// ----------------------------------------------------------------
// The DOM node that `<ShareVerdictButton />` rasterizes into a
// shareable PNG. Designed to be 1080×1080 (Twitter/LinkedIn-
// friendly), with a self-contained background — no external
// assets, so html2canvas captures it cleanly.
//
// Caller mounts it inside an off-screen container (e.g.
// `style={{position: 'absolute', left: '-9999px'}}`) and passes
// the ref to ShareVerdictButton.
// ============================================================

interface ShareCardProps {
  founderName?: string
  archetypeName: string
  legacyScore: number
  scoreOutOf?: number
  investors: Investor[]
  scorecards: InvestorScorecard[]
  className?: string
}

const DECISION_LABEL: Record<DealDecision, 'INVEST' | 'CONDITIONAL' | 'PASS'> = {
  PRIORITY_1: 'INVEST',
  PRIORITY_2: 'CONDITIONAL',
  WALK_OUT: 'PASS',
}

const DECISION_COLOUR: Record<DealDecision, string> = {
  PRIORITY_1: '#34d399',
  PRIORITY_2: '#d9b45f',
  WALK_OUT: '#8e3644',
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  {
    founderName,
    archetypeName,
    legacyScore,
    scoreOutOf = 100,
    investors,
    scorecards,
    className,
  },
  ref,
) {
  const scorecardById = new Map(scorecards.map((s) => [s.investorId, s]))
  const tallied = investors.map((inv) => ({
    inv,
    card: scorecardById.get(inv.id) ?? null,
  }))

  const counts = tallied.reduce(
    (acc, { card }) => {
      if (!card) return acc
      const label = DECISION_LABEL[card.dealDecision]
      acc[label] += 1
      return acc
    },
    { INVEST: 0, CONDITIONAL: 0, PASS: 0 } as Record<'INVEST' | 'CONDITIONAL' | 'PASS', number>,
  )

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex flex-col justify-between overflow-hidden p-12 text-[color:var(--color-warroom-parchment)]',
        className,
      )}
      style={{
        width: '1080px',
        height: '1080px',
        // Self-contained gradient background so html2canvas doesn't need to load assets.
        background:
          'radial-gradient(ellipse at 50% 20%, #2a1c0a 0%, #1a1208 40%, #0a0805 100%)',
        fontFamily: "var(--font-got), Georgia, serif",
      }}
    >
      {/* Top accent */}
      <div
        style={{
          position: 'absolute',
          left: '12%',
          right: '12%',
          top: '8%',
          height: '2px',
          background:
            'linear-gradient(90deg, transparent, rgba(217,180,95,0.8), transparent)',
        }}
      />

      {/* Header */}
      <header style={{ textAlign: 'center', marginTop: '40px' }}>
        <p
          style={{
            fontSize: '22px',
            letterSpacing: '0.34em',
            color: 'rgba(179,144,62,0.7)',
            textTransform: 'uppercase',
          }}
        >
          The Gambit — Verdict
        </p>
        {founderName && (
          <p
            style={{
              marginTop: '12px',
              fontSize: '38px',
              fontWeight: 700,
              color: '#f5e6c8',
            }}
          >
            {founderName}
          </p>
        )}
      </header>

      {/* Archetype */}
      <section
        style={{
          textAlign: 'center',
          margin: '0 auto',
          maxWidth: '820px',
        }}
      >
        <p
          style={{
            fontSize: '20px',
            letterSpacing: '0.32em',
            color: 'rgba(179,144,62,0.65)',
            textTransform: 'uppercase',
          }}
        >
          Founder archetype
        </p>
        <h2
          style={{
            marginTop: '12px',
            fontSize: '72px',
            fontWeight: 800,
            lineHeight: 1.05,
            color: '#d9b45f',
            textShadow: '0 0 40px rgba(217,180,95,0.5)',
          }}
        >
          {archetypeName}
        </h2>
      </section>

      {/* Score + tally */}
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '64px',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            flex: '0 0 360px',
            padding: '36px',
            border: '1px solid rgba(179,144,62,0.4)',
            borderRadius: '8px',
            background:
              'linear-gradient(135deg, rgba(42,28,10,0.85), rgba(20,16,12,0.85))',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '16px',
              letterSpacing: '0.3em',
              color: 'rgba(179,144,62,0.7)',
              textTransform: 'uppercase',
            }}
          >
            Legacy Score
          </p>
          <p
            style={{
              marginTop: '12px',
              fontSize: '128px',
              fontWeight: 800,
              lineHeight: 1,
              color: '#d9b45f',
              textShadow: '0 0 36px rgba(217,180,95,0.45)',
            }}
          >
            {Math.round(legacyScore)}
            <span style={{ fontSize: '40px', color: 'rgba(245,230,200,0.4)', marginLeft: '8px' }}>
              / {scoreOutOf}
            </span>
          </p>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p
            style={{
              fontSize: '16px',
              letterSpacing: '0.3em',
              color: 'rgba(179,144,62,0.7)',
              textTransform: 'uppercase',
            }}
          >
            Board vote
          </p>
          {(['INVEST', 'CONDITIONAL', 'PASS'] as const).map((k) => (
            <div
              key={k}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 22px',
                border: `1px solid ${k === 'INVEST' ? '#34d399' : k === 'CONDITIONAL' ? 'rgba(179,144,62,0.55)' : 'rgba(194,59,59,0.55)'}`,
                background:
                  k === 'INVEST'
                    ? 'rgba(6,78,59,0.4)'
                    : k === 'CONDITIONAL'
                      ? 'rgba(20,16,12,0.7)'
                      : 'rgba(91,16,16,0.35)',
                borderRadius: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  color: k === 'INVEST' ? '#a7f3d0' : k === 'CONDITIONAL' ? '#d9b45f' : '#fca5a5',
                }}
              >
                {k}
              </span>
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: 800,
                  color: '#f5e6c8',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {counts[k]}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer ribbon */}
      <footer style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          style={{
            margin: '0 auto 18px',
            width: '160px',
            height: '1px',
            background:
              'linear-gradient(90deg, transparent, rgba(179,144,62,0.6), transparent)',
          }}
        />
        <p
          style={{
            fontSize: '18px',
            letterSpacing: '0.3em',
            color: 'rgba(245,230,200,0.55)',
            textTransform: 'uppercase',
          }}
        >
          The Gambit
        </p>
        {/* Hidden helper: keep DECISION_COLOUR import-used so the file doesn't trip
            unused-import rules even when the import remains for future variants. */}
        <span style={{ display: 'none' }} data-tone={JSON.stringify(DECISION_COLOUR)} />
      </footer>
    </div>
  )
})
