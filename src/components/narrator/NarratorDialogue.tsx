'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useNarratorStore } from '@/src/state/narratorStore'
import { narratorDialogueEnter } from '@/lib/animations/variants'

const BASE_CHAR_MS = 28        // baseline per-char delay
const PAUSE_CHAR_MS = 280      // pause after sentence-ending punctuation

/**
 * Custom typewriter — paces faster on common letters, slower on
 * punctuation. No dependency on a typewriter library.
 */
function useTypewriter(text: string, enabled: boolean) {
  const [revealed, setRevealed] = useState(enabled ? '' : text)
  const cursorRef = useRef(0)

  useEffect(() => {
    cursorRef.current = 0
    if (!enabled) {
      setRevealed(text)
      return
    }
    setRevealed('')
    if (!text) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = () => {
      if (cancelled) return
      const i = cursorRef.current
      if (i >= text.length) return
      const ch = text[i]
      cursorRef.current = i + 1
      setRevealed(text.slice(0, i + 1))
      const isPause = ch === '.' || ch === '!' || ch === '?' || ch === ',' || ch === ';'
      const next = isPause ? PAUSE_CHAR_MS : BASE_CHAR_MS
      timer = setTimeout(tick, next)
    }
    tick()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [text, enabled])

  const done = revealed.length >= text.length
  return { revealed, done }
}

/**
 * <NarratorDialogue /> — parchment-styled card anchored next to the orb.
 *
 * Typewriter text reveal + auto-advance progress bar + Next/Dismiss links.
 * Rendered inside <NarratorOrb /> so it sits naturally next to the orb.
 */
export function NarratorDialogue() {
  const currentDialogue = useNarratorStore((s) => s.currentDialogue)
  const queue = useNarratorStore((s) => s.queue)
  const nextLine = useNarratorStore((s) => s.nextLine)
  const dismiss = useNarratorStore((s) => s.dismiss)
  const prefersReducedMotion = useReducedMotion()

  const text = currentDialogue?.text ?? ''
  const duration = currentDialogue?.duration ?? 0
  const { revealed, done } = useTypewriter(text, !prefersReducedMotion)

  // Auto-advance once typewriter is done AND duration is set
  useEffect(() => {
    if (!currentDialogue) return
    if (!done) return
    if (duration <= 0) return
    const t = setTimeout(() => {
      nextLine()
    }, duration)
    return () => clearTimeout(t)
  }, [currentDialogue, done, duration, nextLine])

  const hasNext = queue.length > 0
  const showProgress = duration > 0 && done && !prefersReducedMotion

  const progressKey = useMemo(
    () => `${currentDialogue?.text ?? ''}-${duration}`,
    [currentDialogue, duration],
  )

  return (
    <AnimatePresence mode="wait">
      {currentDialogue && (
        <motion.div
          key={progressKey}
          variants={narratorDialogueEnter}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            'relative max-w-sm sm:max-w-md',
            'rounded-[3px] overflow-hidden',
            'border border-[color:var(--color-warroom-gold)]/35',
            'shadow-[0_8px_28px_rgba(0,0,0,0.7),0_0_24px_rgba(179,144,62,0.18)]',
          )}
          style={{
            background:
              'linear-gradient(135deg, rgba(26,21,17,0.96), rgba(20,16,12,0.96))',
          }}
        >
          {/* Top gradient rule */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(179,144,62,0.6), transparent)',
            }}
          />

          {/* Parchment texture overlay — procedural SVG fractalNoise pattern */}
          <span
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.18] mix-blend-overlay"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix values=\'0 0 0 0 0.79 0 0 0 0 0.64 0 0 0 0 0.16 0 0 0 0.7 0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
              backgroundSize: '140px 140px',
            }}
          />

          {/* Close button — wax-seal style */}
          <button
            type="button"
            onClick={() => dismiss()}
            aria-label="Close narrator"
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-bold select-none cursor-pointer transition-transform hover:scale-110 active:scale-95 z-10"
            style={{
              background:
                'radial-gradient(circle at 35% 35%, #8e3644, #6e1010 70%, #2a0808)',
              color: '#f0c040',
              border: '1px solid rgba(240,192,64,0.4)',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 0 8px rgba(92,26,36,0.6)',
            }}
          >
            ✕
          </button>

          {/* Voice equalizer chip */}
          <span
            aria-hidden
            className="absolute top-3 left-3 flex items-end gap-[2px] h-3"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-sm"
                style={{ background: 'var(--color-warroom-gold)' }}
                animate={
                  prefersReducedMotion
                    ? { height: '40%' }
                    : { height: ['30%', '95%', '50%', '80%', '40%'] }
                }
                transition={{
                  duration: 0.9 + i * 0.15,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </span>

          {/* Content */}
          <div className="relative px-5 pt-9 pb-5">
            <p
              className="text-[15px] leading-[1.65]"
              style={{
                fontFamily: 'var(--font-body, var(--font-display))',
                color: '#f2ece0',
              }}
            >
              {revealed}
              {!done && (
                <span
                  aria-hidden
                  className="inline-block w-[2px] h-[1em] align-text-bottom ml-[1px] animate-narrator-caret"
                  style={{ background: 'var(--color-warroom-gold)' }}
                />
              )}
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => dismiss()}
                className="text-[10px] uppercase tracking-[0.18em] transition-colors hover:text-[color:var(--color-warroom-gold)]"
                style={{ fontFamily: 'var(--font-display)', color: 'rgba(200,185,160,0.7)' }}
              >
                ✕ Dismiss
              </button>
              <button
                type="button"
                onClick={() => nextLine()}
                disabled={!done}
                className={cn(
                  'text-[10px] uppercase tracking-[0.18em] transition-colors',
                  'disabled:opacity-30 disabled:cursor-not-allowed',
                  'text-[color:var(--color-warroom-gold)] hover:text-[color:var(--color-warroom-gold-bright)]',
                )}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {hasNext ? 'Next →' : done && duration > 0 ? 'Continue →' : 'End →'}
              </button>
            </div>
          </div>

          {/* Burning auto-advance progress bar */}
          {showProgress && (
            <motion.span
              aria-hidden
              className="absolute bottom-0 left-0 h-[2px]"
              style={{
                background:
                  'linear-gradient(90deg, #c9962a, #f0c040, #d98e2b)',
                boxShadow: '0 0 8px rgba(255,107,0,0.6)',
              }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
