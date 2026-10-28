'use client'

import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { easeDramatic } from '@/lib/animations/variants'

export type GoldDividerVariant = 'sword' | 'line' | 'rune'

export interface GoldDividerProps {
  variant?: GoldDividerVariant
  width?: string
  className?: string
}

/**
 * <GoldDivider /> — ornamental SVG divider that draws itself in on mount.
 * 'sword' → ♟  'rune' → ♔  'line' → no glyph
 */
export function GoldDivider({ variant = 'sword', width, className }: GoldDividerProps) {
  const prefersReducedMotion = useReducedMotion()
  const gradientId = useId().replace(/:/g, '')

  const motionProps = prefersReducedMotion
    ? { initial: false, animate: { pathLength: 1, opacity: 1 } }
    : {
        initial: { pathLength: 0, opacity: 0 },
        whileInView: { pathLength: 1, opacity: 1 },
        viewport: { once: true, margin: '0px 0px -20% 0px' },
        transition: { duration: 0.9, ease: easeDramatic },
      }

  const glyph = variant === 'sword' ? '♟' : variant === 'rune' ? '♔' : null
  const isClassWidth = width && /^(max-w-|w-)/.test(width)

  return (
    <div
      className={cn('flex items-center gap-4 mx-auto min-w-0', isClassWidth ? width : undefined, className)}
      style={!isClassWidth && width ? { maxWidth: width } : undefined}
    >
      <svg role="presentation" aria-hidden className="flex-1 h-[1px] overflow-visible" viewBox="0 0 100 1" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-l-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(200,200,200,0)" />
            <stop offset="100%" stopColor="rgba(200,200,200,0.45)" />
          </linearGradient>
        </defs>
        <motion.line x1="0" y1="0.5" x2="100" y2="0.5" stroke={`url(#grad-l-${gradientId})`} strokeWidth="0.6" vectorEffect="non-scaling-stroke" {...motionProps} />
      </svg>
      {glyph && (
        <motion.span
          aria-hidden
          className="text-[color:var(--color-chessboard-silver)]/60 text-base leading-none select-none"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4, ease: easeDramatic }}
        >
          {glyph}
        </motion.span>
      )}
      <svg role="presentation" aria-hidden className="flex-1 h-[1px] overflow-visible" viewBox="0 0 100 1" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-r-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(200,200,200,0.45)" />
            <stop offset="100%" stopColor="rgba(200,200,200,0)" />
          </linearGradient>
        </defs>
        <motion.line x1="0" y1="0.5" x2="100" y2="0.5" stroke={`url(#grad-r-${gradientId})`} strokeWidth="0.6" vectorEffect="non-scaling-stroke" {...motionProps} />
      </svg>
    </div>
  )
}
