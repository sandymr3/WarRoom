'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  STAGE_ORDER,
  STAGE_THEMES,
  STAGE_NARRATIVES,
  NARRATION_STAGE_LABELS,
} from '@/src/lib/constants'
import type { StageName } from '@/src/types'
import { cn } from '@/lib/utils'
import { easeDramatic } from '@/lib/animations/variants'

export interface CampaignMapProps {
  /** Stage the user is currently on. Stages before it are completed; after are locked. */
  currentStage: StageName | null
  /** Optional click handler for completed stages (e.g. open a popover). */
  onStageClick?: (stage: StageName, index: number) => void
  className?: string
}

type NodeStatus = 'completed' | 'current' | 'locked'

function stageStatus(currentStage: StageName | null, stageIndex: number): NodeStatus {
  if (!currentStage) return 'locked'
  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  if (currentIndex === -1) return 'locked'
  if (stageIndex < currentIndex) return 'completed'
  if (stageIndex === currentIndex) return 'current'
  return 'locked'
}

/**
 * <CampaignMap /> — horizontal ribbon of 9 hexagonal stage nodes.
 *
 * Visualizes the user's progression: Ideation → Vision → Commitment →
 * Validation → Growth → Expansion → Scale → War Room Prep → War Room.
 * Completed nodes glow gold; the current node pulses; locked nodes
 * stay dim. Clickable completed nodes call `onStageClick`.
 */
export function CampaignMap({
  currentStage,
  onStageClick,
  className,
}: CampaignMapProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className={cn('relative', className)}>
      {/* Connecting line behind the nodes */}
      <div
        aria-hidden
        className="absolute left-4 right-4 top-1/2 h-[2px] -translate-y-1/2 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(74,63,56,0.6) 0%, rgba(179,144,62,0.35) 50%, rgba(74,63,56,0.6) 100%)',
        }}
      />

      <ol
        className="relative grid items-center gap-2"
        style={{
          gridTemplateColumns: `repeat(${STAGE_ORDER.length}, minmax(0, 1fr))`,
        }}
      >
        {STAGE_ORDER.map((stage, i) => {
          const status = stageStatus(currentStage, i)
          const accent = STAGE_THEMES[stage] ?? '#b3903e'
          const label = NARRATION_STAGE_LABELS[i] ?? STAGE_NARRATIVES[stage]?.title
          const month = STAGE_NARRATIVES[stage]?.month ?? ''
          const fullTitle = STAGE_NARRATIVES[stage]?.title ?? label
          const clickable = status === 'completed' && Boolean(onStageClick)

          return (
            <motion.li
              key={stage}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: easeDramatic }}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <button
                type="button"
                disabled={!clickable}
                onClick={
                  clickable && onStageClick
                    ? () => onStageClick(stage, i)
                    : undefined
                }
                aria-label={`${month} — ${fullTitle} (${status})`}
                title={`${month} — ${fullTitle}`}
                className={cn(
                  'relative w-9 h-9 sm:w-10 sm:h-10 grid place-items-center',
                  'transition-transform',
                  clickable && 'hover:scale-110 cursor-pointer',
                  !clickable && 'cursor-default',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]/60',
                )}
              >
                {/* Hexagon outline */}
                <HexagonNode status={status} accent={accent} prefersReducedMotion={!!prefersReducedMotion} />

                {/* Inner glyph */}
                <span
                  className={cn(
                    'absolute inset-0 grid place-items-center text-[10px] font-bold uppercase tracking-tight',
                    status === 'completed' && 'text-[color:var(--color-warroom-ghost)]',
                    status === 'current' && 'text-[color:var(--color-warroom-ghost)]',
                    status === 'locked' && 'text-[color:var(--color-warroom-smoke)]',
                  )}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {i + 1}
                </span>
              </button>

              <span
                className={cn(
                  'text-[9px] sm:text-[10px] uppercase tracking-[0.14em] whitespace-nowrap',
                  status === 'current' && 'text-[color:var(--color-warroom-gold)] font-semibold',
                  status === 'completed' && 'text-[color:var(--color-warroom-ivory)]/80',
                  status === 'locked' && 'text-[color:var(--color-warroom-smoke)]',
                )}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {label}
              </span>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}

function HexagonNode({
  status,
  accent,
  prefersReducedMotion,
}: {
  status: NodeStatus
  accent: string
  prefersReducedMotion: boolean
}) {
  // Hexagon points (regular hexagon inscribed in a 40x40 viewBox)
  const hexPoints = '20,2 36,11 36,29 20,38 4,29 4,11'

  const fill =
    status === 'completed'
      ? accent
      : status === 'current'
        ? `${accent}33`
        : '#1a1511'
  const stroke =
    status === 'current'
      ? 'var(--color-warroom-gold-bright)'
      : status === 'completed'
        ? accent
        : 'var(--color-warroom-ash)'

  return (
    <>
      {status === 'current' && !prefersReducedMotion && (
        <motion.span
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.55, 0.15, 0.55],
          }}
          transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
          style={{
            boxShadow: `0 0 16px 4px ${accent}`,
            borderRadius: 6,
          }}
        />
      )}
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        <polygon
          points={hexPoints}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {status === 'completed' && (
          <polygon
            points={hexPoints}
            fill="none"
            stroke="var(--color-warroom-gold-bright)"
            strokeWidth="0.5"
            strokeLinejoin="round"
            opacity="0.7"
          />
        )}
      </svg>
    </>
  )
}
