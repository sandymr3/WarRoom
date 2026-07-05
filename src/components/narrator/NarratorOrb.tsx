'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useNarratorStore } from '@/src/state/narratorStore'
import { ASSET_REGISTRY } from '@/lib/assets/assetRegistry'
import { NarratorDialogue } from './NarratorDialogue'
import { NarratorSpotlight } from './NarratorSpotlight'

const ORB_SIZE = 64

// Probe each narrator mood PNG once at module load; the orb overlays the
// matching image when present, falling back to the CSS gradient orb otherwise.
// (Stills only — animated WebMs are an aspirational upgrade per spec.)
type NarratorMood = keyof typeof ASSET_REGISTRY.narrator
const narratorMoodSrc: Record<NarratorMood, string> = ASSET_REGISTRY.narrator

/**
 * <NarratorOrb /> — the persistent floating Oracle.
 *
 * Sits in the bottom-left on desktop, bottom-center on mobile.
 * Renders the dialogue panel and spotlight as siblings when active.
 *
 * Visual: pure CSS placeholder (radial-gradient orb + breathing
 * animation + mood-driven decorations). Swap to a WebM portrait
 * later by replacing the inner `<div>` with `<video>`.
 */
export function NarratorOrb() {
  const isVisible = useNarratorStore((s) => s.isVisible)
  const currentMood = useNarratorStore((s) => s.currentMood)
  const currentDialogue = useNarratorStore((s) => s.currentDialogue)
  const targetElementId = useNarratorStore((s) => s.targetElementId)
  const dismiss = useNarratorStore((s) => s.dismiss)
  const prefersReducedMotion = useReducedMotion()

  // Hydration gate — every browser API access must wait for mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Probe the mood-specific portrait. When it loads, we overlay it on top
  // of the gradient orb; otherwise the orb renders bare (existing CSS look).
  const [portraitLoaded, setPortraitLoaded] = useState(false)
  const moodKey: NarratorMood = (currentMood ?? 'idle') as NarratorMood
  const portraitSrc = narratorMoodSrc[moodKey] ?? narratorMoodSrc.idle
  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false
    setPortraitLoaded(false)
    const img = new Image()
    img.onload = () => { if (!cancelled) setPortraitLoaded(true) }
    img.onerror = () => { if (!cancelled) setPortraitLoaded(false) }
    img.src = portraitSrc
    return () => { cancelled = true }
  }, [portraitSrc])

  if (!mounted) return null
  if (!isVisible && !currentDialogue) return null

  const dimmedMood = !currentDialogue

  return (
    <>
      <NarratorSpotlight targetElementId={targetElementId} />

      <div
        className={cn(
          'fixed z-[60] pointer-events-none',
          'bottom-6 left-6',
          'sm:bottom-8 sm:left-8',
        )}
      >
        <div className="relative flex items-end gap-3 pointer-events-auto">
          {/* Orb */}
          <motion.button
            type="button"
            aria-label="The Grandmaster"
            title="The Grandmaster"
            onDoubleClick={() => dismiss()}
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{
              opacity: dimmedMood ? 0.55 : 1,
              scale: 1,
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.6, y: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className={cn(
              'relative shrink-0 rounded-full focus:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]/60',
              'cursor-pointer',
            )}
            style={{ width: ORB_SIZE, height: ORB_SIZE }}
          >
            {/* Outer pulsing ring — only when speaking */}
            <AnimatePresence>
              {currentMood === 'speaking' && !prefersReducedMotion && (
                <motion.span
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    boxShadow:
                      '0 0 0 2px rgba(240,192,64,0.55), 0 0 18px 4px rgba(240,192,64,0.35)',
                  }}
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.55, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.6,
                    ease: 'easeOut',
                    repeat: Infinity,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Orb body */}
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 35% 35%, #f0c040, #c9962a 40%, #0e0b09 75%)',
                boxShadow:
                  currentMood === 'warning'
                    ? '0 0 22px rgba(200,75,15,0.8), 0 0 60px rgba(200,75,15,0.35)'
                    : '0 0 20px rgba(201,150,42,0.6), 0 0 60px rgba(201,150,42,0.2)',
              }}
              animate={
                prefersReducedMotion
                  ? { scale: 1, y: 0 }
                  : currentMood === 'warning'
                    ? {
                        scale: [1, 1.06, 0.98, 1.04, 1],
                        filter: ['brightness(1)', 'brightness(1.25)', 'brightness(0.9)', 'brightness(1.15)', 'brightness(1)'],
                      }
                    : { scale: [1, 1.08, 1], y: [0, -4, 0] }
              }
              transition={{
                duration: currentMood === 'warning' ? 0.9 : 3,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
            />

            {/* Mood-specific portrait overlay (PNG) — when the file loads, it
                replaces the bare sigil; otherwise the sigil glyph stays. */}
            {portraitLoaded ? (
              <span
                className="absolute inset-0 overflow-hidden rounded-full"
                style={{
                  backgroundImage: `url("${portraitSrc}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  mixBlendMode: 'screen',
                  opacity: 0.92,
                }}
              />
            ) : (
              <span
                className="absolute inset-0 flex items-center justify-center text-[1.6rem] select-none"
                style={{
                  color: '#0a0805',
                  textShadow: '0 0 6px rgba(240,192,64,0.85)',
                  fontFamily: 'var(--font-display-decorative, var(--font-display))',
                }}
              >
                ⚜
              </span>
            )}

            {/* Celebrating particle burst */}
            <AnimatePresence>
              {currentMood === 'celebrating' && !prefersReducedMotion && (
                <motion.span
                  className="absolute inset-0 rounded-full pointer-events-none"
                  initial={{ opacity: 0.9, scale: 1 }}
                  animate={{ opacity: 0, scale: 2.3 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  style={{
                    background:
                      'radial-gradient(circle, rgba(240,192,64,0.6) 0%, rgba(240,192,64,0) 70%)',
                  }}
                />
              )}
            </AnimatePresence>
          </motion.button>

          {/* Dialogue (positioned to the right of the orb) */}
          <NarratorDialogue />
        </div>
      </div>
    </>
  )
}
