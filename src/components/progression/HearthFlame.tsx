'use client'

// ============================================
// <HearthFlame /> — gentle weekly streak indicator. The flame brightens
// with consecutive active weeks. Designed to encourage, never to shame:
// a dim hearth simply reads "unlit", with no penalty language.
// ============================================

import { motion, useReducedMotion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HearthState } from '@/src/types'

export interface HearthFlameProps {
  hearth: HearthState
  showLabel?: boolean
  size?: number
  className?: string
}

export function HearthFlame({ hearth, showLabel = true, size = 22, className }: HearthFlameProps) {
  const prefersReduced = useReducedMotion()
  const weeks = hearth.current ?? 0
  const lit = weeks > 0
  const intensity = Math.min(1, weeks / 6)
  const color = lit ? 'var(--color-warroom-ember)' : 'var(--color-warroom-smoke)'

  return (
    <div className={cn('inline-flex items-center gap-2', className)} title={`Longest hearth: ${hearth.longest} weeks`}>
      <motion.span
        className="inline-flex"
        animate={
          prefersReduced || !lit
            ? undefined
            : { scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }
        }
        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
      >
        <Flame
          style={{
            width: size,
            height: size,
            color,
            filter: lit ? `drop-shadow(0 0 ${4 + intensity * 12}px rgba(255,107,0,${0.3 + intensity * 0.5}))` : 'none',
          }}
          aria-hidden
        />
      </motion.span>
      {showLabel && (
        <span
          className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--color-warroom-smoke)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {lit ? `${weeks}-week candle` : 'Candle unlit'}
        </span>
      )}
    </div>
  )
}
