'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// <LegacyScoreSparkline />
// ----------------------------------------------------------------
// Compact line chart of the founder's run-by-run legacy scores.
// Optimised for inline use (profile hero, dashboard panel) — no
// axes, no legend, just the trend line + endpoint markers.
//
// Empty state: renders a single muted "—" so callers don't need
// to gate on `runs.length > 0`.
// ============================================================

export interface LegacyRun {
  /** Assessment id — passed to onSelectRun when a point is clicked. */
  id: string
  /** 0-100. */
  score: number
  /** Optional human label, shown in the tooltip on hover. */
  label?: string
  /** ISO date string. Used for relative ordering and tooltips. */
  completedAt?: string
}

interface LegacyScoreSparklineProps {
  runs: LegacyRun[]
  /** Width × height of the SVG. Defaults to a wide ribbon. */
  width?: number
  height?: number
  onSelectRun?: (run: LegacyRun) => void
  className?: string
}

const FALLBACK_W = 280
const FALLBACK_H = 80

export function LegacyScoreSparkline({
  runs,
  width = FALLBACK_W,
  height = FALLBACK_H,
  onSelectRun,
  className,
}: LegacyScoreSparklineProps) {
  if (runs.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-sm border border-dashed border-[color:var(--color-warroom-gold)]/20 bg-card/40 text-foreground/40',
          className,
        )}
        style={{ width, height }}
      >
        <span className="font-display text-xs uppercase tracking-[0.18em]">No runs yet</span>
      </div>
    )
  }

  const padX = 6
  const padY = 8
  const usableW = width - padX * 2
  const usableH = height - padY * 2
  const max = 100
  const min = 0

  const points = runs.map((r, i) => {
    const x = padX + (runs.length === 1 ? usableW / 2 : (i / (runs.length - 1)) * usableW)
    const norm = Math.max(min, Math.min(max, r.score)) / max
    const y = padY + (1 - norm) * usableH
    return { ...r, x, y }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const latest = points[points.length - 1]
  const latestTone = latest.score >= 80
    ? '#34d399'
    : latest.score >= 60
      ? '#d9b45f'
      : latest.score >= 40
        ? '#b3903e'
        : '#8e3644'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn('block', className)}
      role="img"
      aria-label={`Legacy score history across ${runs.length} runs. Latest: ${latest.score}.`}
    >
      <defs>
        <linearGradient id="legacySpark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b6914" />
          <stop offset="50%" stopColor="#b3903e" />
          <stop offset="100%" stopColor="#d9b45f" />
        </linearGradient>
      </defs>

      {/* Faint midline at 50 */}
      <line
        x1={padX}
        x2={width - padX}
        y1={padY + usableH / 2}
        y2={padY + usableH / 2}
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeDasharray="2 4"
      />

      <path
        d={pathD}
        fill="none"
        stroke="url(#legacySpark)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p, i) => {
        const isLast = i === points.length - 1
        const r = isLast ? 4 : 2.6
        const fill = isLast ? latestTone : '#b3903e'
        const clickable = !!onSelectRun
        return (
          <g
            key={p.id ?? i}
            style={{ cursor: clickable ? 'pointer' : 'default' }}
            onClick={clickable ? () => onSelectRun(p) : undefined}
            role={clickable ? 'button' : undefined}
            aria-label={
              p.label
                ? `${p.label}: ${p.score}`
                : `Run ${i + 1}: ${p.score}`
            }
          >
            {/* Hit target */}
            <circle cx={p.x} cy={p.y} r={r + 6} fill="transparent" />
            <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke="#0a0805" strokeWidth="1" />
          </g>
        )
      })}
    </svg>
  )
}
