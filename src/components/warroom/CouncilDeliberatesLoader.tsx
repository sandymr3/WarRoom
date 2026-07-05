'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================================
// <CouncilDeliberatesLoader /> — overlay shown while the backend
// is generating the investor's feedback (the moment between
// "answer submitted" and "feedback streaming").
//
// Visual: dim crimson vignette + three slowly-rotating rune
// glyphs + Cinzel "The council deliberates…" text. No external
// images — everything is Unicode + SVG so it works offline / on
// poor connections.
// ============================================================

interface CouncilDeliberatesLoaderProps {
  message?: string
  className?: string
}

const RUNES = ['♟', '♞', '♝'] as const

export function CouncilDeliberatesLoader({
  message = 'The Board deliberates…',
  className,
}: CouncilDeliberatesLoaderProps) {
  const reducedMotion = useReducedMotion()

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-none flex h-full w-full flex-col items-center justify-center gap-5 rounded-md',
        'backdrop-blur-md',
        className,
      )}
      style={{
        background: 'var(--wr-overlay-bg)',
        boxShadow: 'inset 0 0 60px rgba(92,26,36,0.18)',
      }}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer ring */}
        <motion.div
          aria-hidden
          className="absolute h-24 w-24 rounded-full border border-[color:var(--color-warroom-gold)]/30"
          animate={reducedMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />
        {/* Inner ring */}
        <motion.div
          aria-hidden
          className="absolute h-16 w-16 rounded-full border border-[color:var(--color-warroom-crimson)]/40"
          animate={reducedMotion ? undefined : { rotate: -360 }}
          transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
        />
        {/* Rune triad */}
        {RUNES.map((rune, i) => (
          <motion.span
            key={rune}
            aria-hidden
            className="absolute font-display text-2xl text-[color:var(--color-warroom-gold)]"
            style={{
              transformOrigin: '0 0',
            }}
            initial={{
              x: Math.cos((i / 3) * Math.PI * 2 - Math.PI / 2) * 40 - 9,
              y: Math.sin((i / 3) * Math.PI * 2 - Math.PI / 2) * 40 - 14,
            }}
            animate={
              reducedMotion
                ? undefined
                : {
                    rotate: 360,
                    opacity: [0.6, 1, 0.6],
                  }
            }
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          >
            {rune}
          </motion.span>
        ))}
        {/* Center ember */}
        <motion.div
          aria-hidden
          className="h-2 w-2 rounded-full bg-[color:var(--color-warroom-ember-bright)]"
          animate={
            reducedMotion
              ? undefined
              : {
                  scale: [1, 1.6, 1],
                  opacity: [0.5, 1, 0.5],
                }
          }
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ boxShadow: '0 0 18px rgba(255,153,51,0.85)' }}
        />
      </div>

      <p className="font-display text-base uppercase tracking-[0.22em] text-foreground/90">
        {message}
      </p>
    </div>
  )
}
