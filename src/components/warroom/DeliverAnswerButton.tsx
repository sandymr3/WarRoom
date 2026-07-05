'use client'

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { audioManager } from '@/lib/audio/audioManager'

// ============================================================
// <DeliverAnswerButton /> — the "submit" CTA. Styled as a forged
// gold seal that you press down to commit your dispatch. Press
// animation scales 0.96 → flash → 1; an optional `onPress` SFX
// hook lets callers wire in the sword-unsheath sound.
//
// Decoupled from any submission logic — it's a button. The
// parent passes onClick + isPending + disabled.
// ============================================================

interface DeliverAnswerButtonProps {
  onClick?: () => void
  disabled?: boolean
  isPending?: boolean
  label?: string
  pendingLabel?: string
  /** Optional callback fired on press, BEFORE onClick. When omitted,
   *  a default sword-clash SFX fires (respecting the shared MuteToggle).
   *  Pass an explicit callback to override OR `false` to disable. */
  onPress?: (() => void) | false
  className?: string
}

export function DeliverAnswerButton({
  onClick,
  disabled = false,
  isPending = false,
  label = 'Deliver your answer',
  pendingLabel = 'Sealing dispatch…',
  onPress,
  className,
}: DeliverAnswerButtonProps) {
  const reducedMotion = useReducedMotion()

  const handle = React.useCallback(() => {
    if (disabled || isPending) return
    if (onPress === false) {
      // explicitly disabled
    } else if (onPress) {
      onPress()
    } else {
      // Default: sword-unsheath flourish. audioManager routes through
      // LEGACY_SFX_ALIASES to the Web Audio synth when no MP3 is on disk.
      audioManager.playSfx('sim.answer-submit', 0.45)
    }
    onClick?.()
  }, [disabled, isPending, onPress, onClick])

  return (
    <motion.button
      type="button"
      onClick={handle}
      disabled={disabled || isPending}
      whileTap={reducedMotion || disabled || isPending ? undefined : { scale: 0.96 }}
      whileHover={reducedMotion || disabled || isPending ? undefined : { y: -1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-sm',
        'min-h-12 px-6 py-3',
        'font-display text-sm font-bold uppercase tracking-[0.12em]',
        'text-primary-foreground',
        'shadow-[0_2px_12px_rgba(179,144,62,0.32),inset_0_1px_0_rgba(255,220,100,0.35)]',
        'transition-all duration-300',
        'border border-[color:var(--color-warroom-gold)]/55',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      style={{
        background:
          'linear-gradient(135deg, #b8891e 0%, #b3903e 35%, #d9b45f 50%, #b3903e 65%, #b8891e 100%)',
        backgroundSize: '200% 100%',
      }}
      aria-busy={isPending}
    >
      {/* Hover sweep */}
      {!reducedMotion && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
      )}

      <span aria-hidden className="text-[0.85em] leading-none opacity-80">
        ⚔
      </span>
      <span className="relative">{isPending ? pendingLabel : label}</span>
      <span aria-hidden className="text-[0.85em] leading-none opacity-80">
        →
      </span>
    </motion.button>
  )
}
