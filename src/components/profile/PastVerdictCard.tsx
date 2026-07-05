'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Assessment } from '@/src/types'

// ============================================================
// <PastVerdictCard />
// ----------------------------------------------------------------
// A single row in the founder's "trial record" — one past
// assessment summarised at a glance. Click → routes to the
// cinematic verdict page (or the static final-report if the
// caller prefers).
//
// Data-light by design: only consumes what `api.assessments.list()`
// already returns. Optional enrichment via `archetypeName` /
// `legacyScore` props (the page can fetch reports in parallel
// and pass them in once resolved).
// ============================================================

interface PastVerdictCardProps {
  assessment: Assessment
  /** Enrichment from EvaluationReport, if loaded. */
  archetypeName?: string | null
  /** Enrichment: composite score 0-100. */
  legacyScore?: number | null
  /** Where clicking the card should go. Default: /verdict route. */
  hrefBase?: 'verdict' | 'final-report'
  className?: string
}

const STATUS_TONE: Record<string, { label: string; cls: string }> = {
  COMPLETED:   { label: 'Completed',   cls: 'border-emerald-400/45 bg-emerald-900/25 text-emerald-200' },
  IN_PROGRESS: { label: 'In progress', cls: 'border-[color:var(--color-warroom-gold)]/45 bg-[color:var(--color-warroom-obsidian)]/60 text-[color:var(--color-warroom-gold)]' },
  ABANDONED:   { label: 'Abandoned',   cls: 'border-foreground/15 bg-card/40 text-foreground/45' },
  FAILED:      { label: 'Failed',      cls: 'border-[color:var(--color-warroom-crimson)]/55 bg-[color:var(--color-warroom-crimson)]/15 text-[color:var(--color-warroom-crimson-bright)]' },
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

function snippet(text: string | undefined, max = 96): string {
  if (!text) return ''
  const trimmed = text.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed
}

export function PastVerdictCard({
  assessment,
  archetypeName,
  legacyScore,
  hrefBase = 'verdict',
  className,
}: PastVerdictCardProps) {
  const status = STATUS_TONE[String(assessment.status).toUpperCase()] ?? STATUS_TONE.IN_PROGRESS
  const href = `/assessment/${assessment.id}/${hrefBase === 'final-report' ? 'final-report' : 'verdict'}`
  const completedDate = formatDate(assessment.completedAt || assessment.updatedAt || assessment.createdAt)
  const idea = snippet(assessment.userIdea)
  const investorCount = assessment.selectedInvestors?.length ?? 0

  const scoreTone =
    legacyScore == null
      ? 'text-foreground/45'
      : legacyScore >= 80
        ? 'text-emerald-200'
        : legacyScore >= 60
          ? 'text-[color:var(--color-warroom-gold-bright)]'
          : legacyScore >= 40
            ? 'text-[color:var(--color-warroom-gold)]'
            : 'text-[color:var(--color-warroom-crimson-bright)]'

  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-md border border-[color:var(--color-warroom-gold)]/25 bg-card/70 p-4 backdrop-blur-sm transition-all',
        'hover:border-[color:var(--color-warroom-gold)]/60 hover:bg-card/85 hover:shadow-[0_4px_24px_rgba(179,144,62,0.18)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-sm border px-2 py-0.5 font-display text-[0.55rem] font-bold uppercase tracking-[0.18em]',
                status.cls,
              )}
            >
              {status.label}
            </span>
            <span className="font-display text-[0.55rem] uppercase tracking-[0.18em] text-foreground/40">
              Level {assessment.level} · Attempt {assessment.attemptNumber}
            </span>
            <span className="font-display text-[0.55rem] uppercase tracking-[0.18em] text-foreground/40">
              {completedDate}
            </span>
          </div>

          {archetypeName && (
            <p className="mt-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--color-warroom-gold-bright)]">
              <span aria-hidden className="mr-1">⚜</span> {archetypeName}
            </p>
          )}

          {idea && (
            <p className="mt-1.5 text-sm leading-snug text-foreground/75">
              <span className="font-display text-[0.6rem] uppercase tracking-[0.18em] text-foreground/40">
                Vision&nbsp;
              </span>
              {idea}
            </p>
          )}

          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.16em] text-foreground/40">
            {investorCount > 0 ? `${investorCount} investors faced` : 'Board not yet assembled'}
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          {legacyScore != null ? (
            <>
              <span className={cn('font-display text-3xl font-bold tabular-nums', scoreTone)}>
                {Math.round(legacyScore)}
              </span>
              <span className="font-display text-[0.55rem] uppercase tracking-[0.18em] text-foreground/40">
                / 100
              </span>
            </>
          ) : (
            <span className="font-display text-[0.55rem] uppercase tracking-[0.18em] text-foreground/40">
              {assessment.status === 'COMPLETED' ? 'Score pending' : '—'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
