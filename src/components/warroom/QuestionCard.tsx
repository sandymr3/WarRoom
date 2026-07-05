'use client'

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { investorDisplayName } from '@/src/lib/helpers'
import { QuestionWordReveal } from './QuestionWordReveal'

// ============================================================
// <QuestionCard /> — the parchment-on-stone slab that holds the
// active investor's question. Subtle gold shimmer on the top
// edge, optional sigil watermark, and the word-reveal animation
// inside.
//
// Composition:
//   <QuestionCard
//     investorName="Mira"
//     sigilUrl="/investors/mira/sigil.svg"   // optional
//     label="The mirror of identity asks:"
//     audioSlot={<QuestionAudioPlayer ... />}
//   >
//     {questionText}
//   </QuestionCard>
//
// The actual reveal animation is delegated to QuestionWordReveal;
// this card owns chrome, framing, sigil, and the audio-player slot.
// ============================================================

interface QuestionCardProps {
  investorName: string
  questionText: string
  /** Pre-text label like "Lord Bartlett asks:" */
  label?: string
  /** Optional sigil watermark URL (svg/png). */
  sigilUrl?: string | null
  /** Slot for the per-investor audio player (TTS). */
  audioSlot?: React.ReactNode
  className?: string
  /** Re-mount key — change this when the question changes so the
   *  word reveal re-fires. Defaults to questionText itself. */
  revealKey?: string | number
  staggerMs?: number
}

export function QuestionCard({
  investorName,
  questionText,
  label,
  sigilUrl = null,
  audioSlot,
  className,
  revealKey,
  staggerMs = 60,
}: QuestionCardProps) {
  const reducedMotion = useReducedMotion()
  const key = revealKey ?? questionText

  return (
    <motion.article
      key={key}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-md border border-[color:var(--color-warroom-gold)]/30 bg-card/80 p-5 backdrop-blur-sm',
        'shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(179,144,62,0.1)]',
        'noise-overlay',
        className,
      )}
      style={{
        // Parchment-on-stone slab: aged vellum grain under a warm-dark wash that
        // keeps gold + ivory copy fully legible.
        backgroundImage:
          'var(--wr-parchment-wash), url("/assets/images/textures/parchment.webp")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      aria-label={label ? `${label} ${questionText}` : questionText}
    >
      {/* Top-edge shimmer accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(179,144,62,0.55), transparent)',
        }}
      />

      {/* Sigil watermark */}
      {sigilUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sigilUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -bottom-8 h-44 w-44 opacity-[0.06]"
          draggable={false}
        />
      )}

      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-display text-[0.6rem] uppercase tracking-[0.22em] text-[color:var(--color-warroom-gold)]/90">
            {label ?? `${investorDisplayName(investorName)} asks`}
          </span>
        </div>
        {audioSlot && <div className="flex-shrink-0">{audioSlot}</div>}
      </header>

      <p className="font-display text-lg leading-relaxed text-foreground sm:text-xl">
        <span className="text-[color:var(--color-warroom-gold)]">&ldquo;</span>
        <QuestionWordReveal text={questionText} staggerMs={staggerMs} />
        <span className="text-[color:var(--color-warroom-gold)]">&rdquo;</span>
      </p>
    </motion.article>
  )
}
