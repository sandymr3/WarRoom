'use client'

// ============================================
// <CompetencyConstellation /> — the founder's eight competencies as a
// celestial crown. Each star's size/brightness tracks its best-ever
// mastery tier; the connecting "crown" edges brighten as both ends rise.
//
// Doubles as a comprehension surface: clicking/hovering a star (when
// interactive) reveals its plain-language meaning + mastery tier.
// Respects prefers-reduced-motion (renders fully-lit, no draw-in).
// ============================================

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { easeDramatic } from '@/lib/animations/variants'
import type { CompetencyCode, CompetencyMastery } from '@/src/types'
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  CATEGORY_TIER,
  COMPETENCY_META,
  CONSTELLATION_EDGES,
} from '@/src/lib/progression'

export interface CompetencyConstellationProps {
  mastery: Partial<Record<CompetencyCode, CompetencyMastery>>
  /** Override display names (e.g. from api.config.getCompetencies). */
  names?: Partial<Record<CompetencyCode, string>>
  size?: number
  interactive?: boolean
  /** Compact mode: no caption, native <title> tooltips only. */
  compact?: boolean
  className?: string
}

const UNLIT = '#3a3228'

export function CompetencyConstellation({
  mastery,
  names,
  size = 320,
  interactive = false,
  compact = false,
  className,
}: CompetencyConstellationProps) {
  const prefersReduced = useReducedMotion()
  const [active, setActive] = useState<CompetencyCode | null>(null)

  const posByCode = useMemo(() => {
    const m = new Map<CompetencyCode, { x: number; y: number }>()
    for (const c of COMPETENCY_META) m.set(c.code, { x: c.x, y: c.y })
    return m
  }, [])

  const tierOf = (code: CompetencyCode) => {
    const mc = mastery[code]
    return mc ? CATEGORY_TIER[mc.category] : 0
  }
  const colorOf = (code: CompetencyCode) => {
    const mc = mastery[code]
    return mc ? CATEGORY_COLOR[mc.category] : UNLIT
  }
  const nameOf = (code: CompetencyCode) =>
    names?.[code] ?? COMPETENCY_META.find((c) => c.code === code)?.name ?? code

  const litCount = COMPETENCY_META.filter((c) => tierOf(c.code) > 0).length
  const activeMeta = active ? COMPETENCY_META.find((c) => c.code === active) : null
  const activeMastery = active ? mastery[active] : null

  const edgeMotion = (i: number) =>
    prefersReduced
      ? { initial: false as const, animate: { pathLength: 1, opacity: 1 } }
      : {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { duration: 0.8, delay: 0.1 + i * 0.05, ease: easeDramatic },
        }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg
        viewBox="0 0 206 196"
        width={size}
        height={size * 0.95}
        role="img"
        aria-label={`Competency constellation: ${litCount} of ${COMPETENCY_META.length} competencies lit.`}
        style={{ maxWidth: '100%' }}
      >
        <defs>
          <radialGradient id="constellation-haze" cx="50%" cy="48%" r="60%">
            <stop offset="0%" stopColor="rgba(179,144,62,0.10)" />
            <stop offset="100%" stopColor="rgba(179,144,62,0)" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="206" height="196" fill="url(#constellation-haze)" />

        {/* Edges (the crown) */}
        {CONSTELLATION_EDGES.map(([a, b], i) => {
          const pa = posByCode.get(a)
          const pb = posByCode.get(b)
          if (!pa || !pb) return null
          const minTier = Math.min(tierOf(a), tierOf(b))
          const opacity = 0.06 + minTier * 0.13
          return (
            <motion.line
              key={`${a}-${b}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke="var(--color-warroom-gold)"
              strokeWidth={0.6 + minTier * 0.25}
              strokeOpacity={opacity}
              vectorEffect="non-scaling-stroke"
              {...edgeMotion(i)}
            />
          )
        })}

        {/* Stars */}
        {COMPETENCY_META.map((c, i) => {
          const tier = tierOf(c.code)
          const color = colorOf(c.code)
          const r = 2.6 + tier * 1.2
          const isActive = active === c.code
          const label = `${nameOf(c.code)}: ${
            mastery[c.code] ? CATEGORY_LABEL[mastery[c.code]!.category] : 'Unlit'
          }`
          return (
            <motion.g
              key={c.code}
              initial={prefersReduced ? false : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.05, ease: easeDramatic }}
              style={{ cursor: interactive ? 'pointer' : 'default', transformOrigin: `${c.x}px ${c.y}px` }}
              tabIndex={interactive ? 0 : undefined}
              role={interactive ? 'button' : undefined}
              aria-label={interactive ? label : undefined}
              onMouseEnter={interactive ? () => setActive(c.code) : undefined}
              onMouseLeave={interactive ? () => setActive(null) : undefined}
              onFocus={interactive ? () => setActive(c.code) : undefined}
              onBlur={interactive ? () => setActive(null) : undefined}
              onClick={interactive ? () => setActive(c.code) : undefined}
            >
              {!compact && <title>{label}</title>}
              {/* glow halo */}
              {tier > 0 && (
                <circle cx={c.x} cy={c.y} r={r + 5} fill={color} opacity={isActive ? 0.4 : 0.16} />
              )}
              <circle
                cx={c.x}
                cy={c.y}
                r={r}
                fill={color}
                stroke={isActive ? '#fff' : 'rgba(255,255,255,0.35)'}
                strokeWidth={isActive ? 1 : 0.5}
              />
            </motion.g>
          )
        })}
      </svg>

      {!compact && (
        <div className="mt-3 min-h-[3.5rem] w-full max-w-sm text-center">
          {activeMeta ? (
            <>
              <p
                className="text-sm font-semibold tracking-[0.04em] text-[color:var(--color-warroom-gold-bright)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {nameOf(activeMeta.code)}
                <span className="ml-2 text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]">
                  {activeMastery ? CATEGORY_LABEL[activeMastery.category] : 'Unlit'}
                </span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-warroom-smoke)]">
                {activeMeta.plain}
              </p>
            </>
          ) : (
            <p
              className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {litCount === 0
                ? 'Complete a trial to light your constellation'
                : interactive
                  ? 'Hover a star to read its meaning'
                  : `${litCount} of ${COMPETENCY_META.length} competencies lit`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
