'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  STAGE_ORDER,
  STAGE_THEMES,
  STAGE_NARRATIVES,
  NARRATION_STAGE_LABELS,
} from '@/src/lib/constants'
import type { StageName } from '@/src/types'

// ============================================================
// <WarMap />
// ----------------------------------------------------------------
// A campaign map of the trial's 9 stages, rendered as an SVG
// path with one waypoint per stage. State per node:
//
//   completed → gold-filled, soft glow
//   current   → larger, pulsing ring at stage colour
//   locked    → stone-grey, low opacity
//
// Two layout modes:
//   'horizontal' (default) — straight waypoint row, fits a header strip
//   'campaign'             — gentle diagonal so it FEELS like a march
//
// Designed to drop into:
//   • app/assessment/[id]/page.tsx — as a compact header
//   • app/(dashboard)/results/[id]/page.tsx — at hero size
//
// Pure props. The page owns currentStage + which stages are
// completed (from the assessment state).
// ============================================================

export type WarMapVariant = 'horizontal' | 'campaign'

interface WarMapProps {
  /** Stages that have been finished. Order doesn't matter. */
  completedStages: StageName[]
  /** The stage the founder is currently inside. null = none active. */
  currentStage: StageName | null
  variant?: WarMapVariant
  /** Click a node to navigate to a stage's report etc. Optional. */
  onStageClick?: (stage: StageName) => void
  className?: string
  /** Show or hide the under-node labels. Default true. */
  showLabels?: boolean
}

const VIEW_W = 760
const VIEW_H = 100
const PAD_X = 32

interface NodeGeo {
  stage: StageName
  index: number
  x: number
  y: number
  state: 'completed' | 'current' | 'locked'
  color: string
  label: string
  narrative: { month: string; title: string } | null
}

function computeGeometry(
  completed: Set<string>,
  current: StageName | null,
  variant: WarMapVariant,
): NodeGeo[] {
  const count = STAGE_ORDER.length
  const usableW = VIEW_W - PAD_X * 2

  return STAGE_ORDER.map((stage, i): NodeGeo => {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const x = PAD_X + t * usableW
    const baseY = VIEW_H / 2
    // Campaign mode: gently dip and rise so the path feels like terrain.
    const y =
      variant === 'campaign'
        ? baseY - Math.sin(t * Math.PI) * 18 + (i % 2 === 0 ? -4 : 4)
        : baseY

    const isCompleted = completed.has(stage)
    const isCurrent = current === stage
    const state = isCompleted ? 'completed' : isCurrent ? 'current' : 'locked'

    return {
      stage,
      index: i,
      x,
      y,
      state,
      color: STAGE_THEMES[stage] ?? '#b3903e',
      label: NARRATION_STAGE_LABELS[i] ?? stage,
      narrative: STAGE_NARRATIVES[stage] ?? null,
    }
  })
}

export function WarMap({
  completedStages,
  currentStage,
  variant = 'horizontal',
  onStageClick,
  className,
  showLabels = true,
}: WarMapProps) {
  const reducedMotion = useReducedMotion()
  const completedSet = new Set<string>(completedStages)
  const nodes = computeGeometry(completedSet, currentStage, variant)

  // Path between waypoints — straight, then we paint a gold portion up to the
  // last completed (or current) node so the trail is visible.
  const pathD = nodes
    .map((n, i) => `${i === 0 ? 'M' : 'L'} ${n.x.toFixed(1)} ${n.y.toFixed(1)}`)
    .join(' ')

  // Determine the "progress index" — index of the rightmost completed node
  // (or the current node if nothing's completed yet).
  let progressIdx = -1
  nodes.forEach((n, i) => {
    if (n.state === 'completed') progressIdx = Math.max(progressIdx, i)
  })
  if (progressIdx === -1 && currentStage) {
    progressIdx = nodes.findIndex((n) => n.stage === currentStage)
  }
  const progressed = progressIdx >= 0 ? nodes.slice(0, progressIdx + 1) : []
  const progressPathD = progressed
    .map((n, i) => `${i === 0 ? 'M' : 'L'} ${n.x.toFixed(1)} ${n.y.toFixed(1)}`)
    .join(' ')

  return (
    <div
      className={cn('relative w-full', className)}
      role="group"
      aria-label="Match progression map"
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="block w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="warmapProgress" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b6914" />
            <stop offset="50%" stopColor="#b3903e" />
            <stop offset="100%" stopColor="#d9b45f" />
          </linearGradient>
          <radialGradient id="warmapGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#d9b45f" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#b3903e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Locked baseline path */}
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.14"
          strokeWidth="2"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
        {/* Progressed path (gold) */}
        {progressPathD && (
          <path
            d={progressPathD}
            fill="none"
            stroke="url(#warmapProgress)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Nodes */}
        {nodes.map((n) => (
          <WarMapNode
            key={n.stage}
            node={n}
            reducedMotion={!!reducedMotion}
            onClick={onStageClick ? () => onStageClick(n.stage) : undefined}
          />
        ))}
      </svg>

      {showLabels && (
        <div className="mt-2 flex w-full select-none justify-between px-[4.2%]">
          {nodes.map((n) => (
            <div
              key={`label-${n.stage}`}
              className={cn(
                'flex flex-1 flex-col items-center text-center font-display text-[0.55rem] uppercase tracking-[0.18em] sm:text-[0.62rem]',
                n.state === 'completed' && 'text-[color:var(--color-warroom-gold)]',
                n.state === 'current' && 'text-foreground',
                n.state === 'locked' && 'text-foreground/35',
              )}
            >
              <span className="truncate">{n.label}</span>
              {n.narrative && (
                <span className="hidden text-foreground/35 sm:inline">{n.narrative.month}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface WarMapNodeProps {
  node: NodeGeo
  reducedMotion: boolean
  onClick?: () => void
}

function WarMapNode({ node, reducedMotion, onClick }: WarMapNodeProps) {
  const { x, y, state, color, label, narrative } = node
  const isCurrent = state === 'current'
  const isCompleted = state === 'completed'

  const radius = isCurrent ? 9 : 6
  const fill = isCompleted ? '#b3903e' : isCurrent ? color : '#5a5048'
  const stroke = isCompleted ? '#d9b45f' : isCurrent ? '#d9b45f' : '#3d3530'
  const ariaLabel = narrative ? `${narrative.title} (${state})` : `${label} (${state})`

  return (
    <g
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={ariaLabel}
    >
      {/* Glow halo for current node */}
      {isCurrent && !reducedMotion && (
        <motion.circle
          cx={x}
          cy={y}
          r={20}
          fill="url(#warmapGlow)"
          initial={{ opacity: 0.4, scale: 0.8 }}
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.8, 1.15, 0.8] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {/* Hit target */}
      <circle
        cx={x}
        cy={y}
        r={radius + 6}
        fill="transparent"
      />
      {/* The node itself */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={isCurrent ? 2 : 1.4}
      />
      {/* Completed inner check pip */}
      {isCompleted && (
        <circle cx={x} cy={y} r={2.6} fill="#0a0805" />
      )}
    </g>
  )
}
