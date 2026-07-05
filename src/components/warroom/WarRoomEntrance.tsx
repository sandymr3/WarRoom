'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { WarRoomSubtitles, type SubtitleCue } from './WarRoomSubtitles'
import { EmberParticles } from '@/src/components/effects/EmberParticles'
import { AssetPlaceholder } from '@/src/components/effects/AssetPlaceholder'
import { useAmbientAudio } from '@/src/hooks/useAmbientAudio'

// ============================================================
// <WarRoomEntrance />
// Fullscreen cinematic overlay played the FIRST time a user
// crosses into the War Room. Behaviour:
//   • Plays /assets/video/warroom-door-opening.{webm,mp4} muted.
//   • Falls back to an SVG doors-parting animation if the video
//     is missing or fails to load — never blocks the UX.
//   • Reveals timed Cinzel subtitles over the video.
//   • Skip control: visible immediately on repeat visits
//     (localStorage flag), else after 3s.
//   • On end: fade-to-black ~800ms → unmount + onComplete().
//   • Calls useAmbientAudio.unlock() on first interaction
//     so ambient layers can begin playback when the chamber
//     mounts behind us.
// ============================================================

const VIDEO_SRC_WEBM = '/assets/video/warroom-door-opening.webm'
const VIDEO_SRC_MP4 = '/assets/video/warroom-door-opening.mp4'
const ENTERED_FLAG = 'warroom_entered_before'
const SKIP_GRACE_MS = 3000
const FADE_OUT_MS = 800
const FALLBACK_DURATION_MS = 5200

const DEFAULT_CUES: SubtitleCue[] = [
  { atMs: 1800, text: 'The Board has been assembled…', holdMs: 2800 },
  { atMs: 4800, text: 'Seven grandmasters. One title.', holdMs: 2600 },
  { atMs: 7600, text: 'Defend your position.', holdMs: 2400 },
  { atMs: 10200, text: 'Or resign.', holdMs: 2600 },
]

interface WarRoomEntranceProps {
  onComplete: () => void
  cues?: SubtitleCue[]
  /** Force the fallback CSS sequence (useful while a real video isn't on disk). */
  forceFallback?: boolean
}

type EntranceStage = 'playing' | 'fading' | 'done'

function isReturningVisitor(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(ENTERED_FLAG) === 'true'
  } catch {
    return false
  }
}

export function WarRoomEntrance({
  onComplete,
  cues = DEFAULT_CUES,
  forceFallback = false,
}: WarRoomEntranceProps) {
  const reducedMotion = useReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const startedAtRef = useRef<number>(0)
  const completedRef = useRef(false)
  const { unlock, setScene } = useAmbientAudio()

  const [stage, setStage] = useState<EntranceStage>('playing')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [videoFailed, setVideoFailed] = useState(forceFallback)
  // Always start false on SSR + initial client render so the server and
  // hydrated HTML match. The mount effect below promotes it to true for
  // returning visitors after hydration completes.
  const [skipVisible, setSkipVisible] = useState<boolean>(false)

  const finish = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    try {
      window.localStorage.setItem(ENTERED_FLAG, 'true')
    } catch {
      /* ignore */
    }
    setStage('fading')
    window.setTimeout(() => {
      setStage('done')
      onComplete()
    }, FADE_OUT_MS)
  }, [onComplete])

  const handleSkip = useCallback(() => {
    finish()
  }, [finish])

  const begin = useCallback(() => {
    unlock()
    setScene('warroom-lobby')
  }, [setScene, unlock])

  // Capture start time. Reveal the skip button immediately for returning
  // visitors (read from localStorage post-hydration to avoid SSR mismatch),
  // or after the grace period for first-timers.
  useEffect(() => {
    startedAtRef.current = performance.now()
    if (isReturningVisitor()) {
      setSkipVisible(true)
      return
    }
    const t = window.setTimeout(() => setSkipVisible(true), SKIP_GRACE_MS)
    return () => window.clearTimeout(t)
  }, [])

  // rAF clock for subtitle timing
  useEffect(() => {
    if (stage !== 'playing') return
    let raf = 0
    const tick = () => {
      setElapsedMs(performance.now() - startedAtRef.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stage])

  // Fallback timeout — if video never reports `ended` (missing file etc.)
  useEffect(() => {
    if (stage !== 'playing') return
    if (!videoFailed) return
    const t = window.setTimeout(() => finish(), FALLBACK_DURATION_MS)
    return () => window.clearTimeout(t)
  }, [stage, videoFailed, finish])

  // Try to play the video once it's mounted (autoplay rejections are normal — fail soft)
  useEffect(() => {
    if (videoFailed) return
    const v = videoRef.current
    if (!v) return
    v.play().catch(() => {
      // Some browsers/devices reject muted autoplay; fall back to the CSS sequence.
      setVideoFailed(true)
    })
  }, [videoFailed])

  if (stage === 'done') return null

  return (
    <AnimatePresence>
      <motion.div
        key="entrance"
        className="fixed inset-0 z-[9999] overflow-hidden bg-black"
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === 'fading' ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: stage === 'fading' ? FADE_OUT_MS / 1000 : 0.3 }}
        onPointerDown={begin}
        onKeyDown={begin}
        tabIndex={-1}
        role="dialog"
        aria-label="Entering the War Room"
      >
        {!videoFailed ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            preload="auto"
            autoPlay
            muted
            playsInline
            onEnded={finish}
            onError={() => setVideoFailed(true)}
          >
            {/* Only MP4 was generated by Veo; the WebM source line is
                commented out so the browser doesn't 404 fetching it.
                Re-enable when a .webm export is dropped on disk. */}
            {/* <source src={VIDEO_SRC_WEBM} type="video/webm" /> */}
            <source src={VIDEO_SRC_MP4} type="video/mp4" />
          </video>
        ) : (
          <FallbackDoorsAnimation reducedMotion={!!reducedMotion} />
        )}

        {/* Vignette + ember atmosphere on top of video */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.92) 100%)',
          }}
        />
        <EmberParticles className="opacity-70" density={28} speed={0.85} />

        <WarRoomSubtitles cues={cues} elapsedMs={elapsedMs} />

        {skipVisible && (
          <button
            type="button"
            onClick={handleSkip}
            className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-sm border border-[color:var(--color-warroom-gold)]/25 bg-black/50 px-3 py-1.5 font-display text-xs tracking-[0.18em] uppercase text-zinc-200/80 backdrop-blur-md transition-all duration-200 hover:border-[color:var(--color-warroom-gold)]/60 hover:bg-black/70 hover:text-[color:var(--color-warroom-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]"
            aria-label="Skip cinematic"
          >
            Skip <span aria-hidden>→</span>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function FallbackDoorsAnimation({ reducedMotion }: { reducedMotion: boolean }) {
  const slideOut = reducedMotion ? { opacity: 0 } : { x: '-105%' }
  const slideOutRight = reducedMotion ? { opacity: 0 } : { x: '105%' }
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(60,30,8,0.5) 0%, rgba(20,8,0,0.95) 70%, #000 100%)',
        }}
      />
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2"
        initial={{ x: 0 }}
        animate={slideOut}
        transition={{ duration: reducedMotion ? 0.3 : 4.2, delay: 0.6, ease: [0.65, 0, 0.35, 1] }}
        style={{
          background:
            'linear-gradient(90deg, #1a0a00 0%, #2a1808 60%, #3d2210 100%)',
          borderRight: '2px solid rgba(179,144,62,0.45)',
          boxShadow: 'inset -10px 0 30px rgba(0,0,0,0.7), 8px 0 40px rgba(179,144,62,0.18)',
        }}
      />
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2"
        initial={{ x: 0 }}
        animate={slideOutRight}
        transition={{ duration: reducedMotion ? 0.3 : 4.2, delay: 0.6, ease: [0.65, 0, 0.35, 1] }}
        style={{
          background:
            'linear-gradient(270deg, #1a0a00 0%, #2a1808 60%, #3d2210 100%)',
          borderLeft: '2px solid rgba(179,144,62,0.45)',
          boxShadow: 'inset 10px 0 30px rgba(0,0,0,0.7), -8px 0 40px rgba(179,144,62,0.18)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-48 w-72 max-w-[80%]">
          <AssetPlaceholder
            kind="video"
            label="Door cinematic"
            path="public/assets/video/warroom-door-opening.{webm,mp4}"
            formatHint="1080p · 8–14s · ≤6MB · muted autoplay"
          />
        </div>
      </div>
    </div>
  )
}
