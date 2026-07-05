'use client'

// ============================================
// <SigilUnlockOverlay /> — a restrained, cinematic reveal for newly
// earned sigils. Steps through them one at a time over a dark, ember-lit
// backdrop. High-impact but quiet: one moment, then gone. Reduced-motion
// aware; audio routed through the audioManager.
// ============================================

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { EarnedSigil } from '@/src/types'
import { sigilById, SIGIL_TIER_COLOR } from '@/src/lib/progression'
import { EmberParticles } from '@/src/components/effects/EmberParticles'
import { audioManager } from '@/lib/audio/audioManager'
import { SigilCrest, iconForSigil } from './SigilCrest'

export interface SigilUnlockOverlayProps {
  sigils: EarnedSigil[]
  /** Called once the founder has stepped through all reveals. */
  onClose: () => void
}

export function SigilUnlockOverlay({ sigils, onClose }: SigilUnlockOverlayProps) {
  const prefersReduced = useReducedMotion()
  const [index, setIndex] = useState(0)

  const current = sigils[index]
  const total = sigils.length

  // Sound on each reveal (manager handles its own mute state).
  useEffect(() => {
    if (!current) return
    audioManager.playSfx('narrator.appear')
  }, [current])

  if (!current) return null

  const def = sigilById(current.id)
  const style = SIGIL_TIER_COLOR[current.tier]
  const isLast = index >= total - 1

  const advance = () => {
    if (isLast) {
      audioManager.playSfx('wr.verdict')
      onClose()
    } else {
      setIndex((i) => i + 1)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="sigil-unlock"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'radial-gradient(ellipse at center, rgba(10,8,6,0.97), rgba(5,4,3,0.99))' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Norm earned: ${def?.name ?? current.id}`}
      >
        <EmberParticles density={14} speed={0.7} />

        <motion.div
          key={current.id}
          initial={prefersReduced ? false : { scale: 0.6, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="relative z-10 flex flex-col items-center gap-4"
        >
          <p
            className="text-[0.6rem] font-semibold uppercase tracking-[0.34em] text-[color:var(--color-warroom-gold)]/80"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Norm Earned
          </p>

          <SigilCrest
            icon={iconForSigil(current.id)}
            size={150}
            primary={style.base}
            secondary={style.bright}
            iconColor={style.bright}
            title={def?.name}
          />

          <h2
            className="text-2xl font-bold tracking-wide text-[color:var(--color-warroom-ghost)] sm:text-3xl"
            style={{ fontFamily: 'var(--font-display)', textShadow: '0 0 26px rgba(179,144,62,0.3)' }}
          >
            {def?.name ?? current.id}
          </h2>

          <p
            className="text-[0.6rem] uppercase tracking-[0.22em]"
            style={{ fontFamily: 'var(--font-display)', color: style.bright }}
          >
            {style.label} Norm
          </p>

          {def?.description && (
            <p className="max-w-sm text-sm leading-relaxed text-[color:var(--color-warroom-smoke)]">
              {def.description}
            </p>
          )}

          {total > 1 && (
            <div className="mt-1 flex items-center gap-1.5" aria-hidden>
              {sigils.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background:
                      i === index
                        ? 'var(--color-warroom-gold-bright)'
                        : 'var(--color-warroom-stone)',
                  }}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={advance}
            className="mt-4 inline-flex items-center gap-2 rounded-sm border border-[color:var(--color-warroom-gold)]/50 px-6 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--color-warroom-gold)] transition-all hover:border-[color:var(--color-warroom-gold)] hover:bg-[color:var(--color-warroom-gold)]/10"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isLast ? 'Claim' : `Next (${index + 1}/${total})`}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
