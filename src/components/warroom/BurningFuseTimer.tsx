'use client'

import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================================
// <BurningFuseTimer /> — a fuse burning right-to-left as the
// remaining time on a stage drops to zero. Replaces the boring
// progress-bar timer with something that lives in the chamber's
// world (gunpowder fuses, sieges, etc.).
//
// Driven purely by props — the parent owns the clock. Both
// `seconds` (formatted readout) and `progress` (0..1, where 1 =
// just started, 0 = burnt out) are passed in.
//
// SVG strategy:
//   • Long horizontal path = the fuse rope.
//   • stroke-dasharray shifts to "consume" the rope right-to-left.
//   • The ember-glow circle sits at the burn point (a CSS
//     transform driven off `progress`).
//   • At <20% remaining, the rope adds an urgency crimson tint
//     and a faster flicker.
// ============================================================

interface BurningFuseTimerProps {
  /** 0..1 — fraction of time remaining (1 = full, 0 = expired). */
  progress: number
  /** Display string e.g. "01:45". Optional. */
  readout?: string
  className?: string
}

const FUSE_LENGTH = 240
const FUSE_HEIGHT = 36
const ROPE_Y = FUSE_HEIGHT / 2

export function BurningFuseTimer({ progress, readout, className }: BurningFuseTimerProps) {
  const reducedMotion = useReducedMotion()
  const clamped = Math.max(0, Math.min(1, progress))
  const burnt = (1 - clamped) * FUSE_LENGTH
  const remaining = FUSE_LENGTH - burnt
  const urgent = clamped < 0.2

  // Ember position — slides from right (full) to left (expired)
  const emberX = FUSE_LENGTH - burnt

  return (
    <div
      className={cn('flex items-center gap-3', className)}
      role="timer"
      aria-label={readout ? `Time remaining: ${readout}` : 'Time remaining'}
    >
      <svg
        viewBox={`0 0 ${FUSE_LENGTH} ${FUSE_HEIGHT}`}
        width={FUSE_LENGTH}
        height={FUSE_HEIGHT}
        className={cn('max-w-full', urgent && !reducedMotion && 'animate-pulse')}
        aria-hidden
      >
        <defs>
          <radialGradient id="fuseEmber" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%"   stopColor="#fff3b0" stopOpacity="1" />
            <stop offset="35%"  stopColor="#e5a94d" stopOpacity="0.95" />
            <stop offset="70%"  stopColor="#d98e2b" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#5c1a24" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ropeUnburnt" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b6914" />
            <stop offset="50%" stopColor="#b3903e" />
            <stop offset="100%" stopColor="#8b6914" />
          </linearGradient>
        </defs>

        {/* Rope shadow — runs the full width as a faint baseline */}
        <line
          x1="0" y1={ROPE_Y}
          x2={FUSE_LENGTH} y2={ROPE_Y}
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Burnt-away portion — wisp of ash */}
        {burnt > 4 && (
          <line
            x1="0" y1={ROPE_Y}
            x2={burnt - 6} y2={ROPE_Y}
            stroke="#3d3530"
            strokeWidth="1.4"
            strokeDasharray="2 3"
            strokeLinecap="round"
            opacity="0.8"
          />
        )}

        {/* Unburnt rope — gold-braided */}
        <line
          x1={burnt}
          y1={ROPE_Y}
          x2={FUSE_LENGTH}
          y2={ROPE_Y}
          stroke={urgent ? '#8e3644' : 'url(#ropeUnburnt)'}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Ember at the burn point */}
        {remaining > 0 && (
          <>
            <circle
              cx={emberX} cy={ROPE_Y}
              r="8"
              fill="url(#fuseEmber)"
              className={cn(!reducedMotion && 'animate-pulse')}
              style={{ animationDuration: urgent ? '0.6s' : '1.4s' }}
            />
            <circle cx={emberX} cy={ROPE_Y} r="2.2" fill="#fff3b0" />
          </>
        )}
      </svg>

      {readout && (
        <span
          className={cn(
            'font-mono text-base font-semibold tabular-nums tracking-wider',
            urgent ? 'text-[color:var(--color-warroom-crimson-bright)]' : 'text-foreground',
          )}
        >
          {readout}
        </span>
      )}
    </div>
  )
}
