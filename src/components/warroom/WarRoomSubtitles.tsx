'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

export interface SubtitleCue {
  atMs: number
  text: string
  holdMs?: number
}

interface WarRoomSubtitlesProps {
  cues: SubtitleCue[]
  /** Monotonic clock in ms since entrance start. */
  elapsedMs: number
}

interface ActiveCue {
  cue: SubtitleCue
  index: number
}

const DEFAULT_HOLD_MS = 2600

function findActiveCue(cues: SubtitleCue[], elapsedMs: number): ActiveCue | null {
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i]
    const hold = cue.holdMs ?? DEFAULT_HOLD_MS
    if (elapsedMs >= cue.atMs && elapsedMs < cue.atMs + hold) {
      return { cue, index: i }
    }
  }
  return null
}

export function WarRoomSubtitles({ cues, elapsedMs }: WarRoomSubtitlesProps) {
  const reducedMotion = useReducedMotion()
  const active = findActiveCue(cues, elapsedMs)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[18%] flex justify-center px-6">
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.index}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(6px)' }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, filter: 'blur(4px)' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-3xl text-center"
          >
            <p
              className="font-display text-2xl tracking-[0.08em] text-zinc-100 sm:text-3xl md:text-4xl"
              style={{
                textShadow:
                  '0 0 24px rgba(179,144,62,0.45), 0 0 4px rgba(0,0,0,0.85), 0 2px 12px rgba(0,0,0,0.95)',
              }}
            >
              {renderStaggered(active.cue.text, reducedMotion)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function renderStaggered(text: string, reducedMotion: boolean | null) {
  if (reducedMotion) return text
  const words = text.split(' ')
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 * i, duration: 0.45, ease: 'easeOut' }}
          className="mr-[0.35em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </>
  )
}
