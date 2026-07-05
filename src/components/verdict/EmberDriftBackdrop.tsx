'use client'

import { cn } from '@/lib/utils'
import { EmberParticles } from '@/src/components/effects/EmberParticles'

// ============================================================
// <EmberDriftBackdrop /> — atmospheric background for verdict.
//
// Tiny composition: dense embers + radial gold vignette + dark
// floor gradient. Used as a sibling under the actual ceremony
// content so it never intercepts pointer events.
// ============================================================

interface EmberDriftBackdropProps {
  density?: number
  className?: string
}

export function EmberDriftBackdrop({ density = 80, className }: EmberDriftBackdropProps) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 70%, rgba(60,30,8,0.4) 0%, rgba(20,8,0,0.95) 60%, #000 100%)',
        }}
      />
      <EmberParticles className="opacity-90" density={density} speed={0.7} />
      {/* Subtle gold light from above */}
      <div
        className="absolute inset-x-0 top-0 h-2/3"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(179,144,62,0.12) 0%, transparent 60%)',
        }}
      />
    </div>
  )
}
