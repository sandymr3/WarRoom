'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// <SoundwaveVisualizer /> — canvas-based bar visualiser driven
// off a live MediaStream (from useAudioRecorder / getUserMedia).
//
// Design choices:
//   • Web Audio API AnalyserNode with fftSize 64 → 32 bars.
//   • Bars centred vertically, mirrored top-and-bottom for the
//     "ribbon" feel.
//   • Gold gradient fill with crimson tips when amplitude spikes.
//   • Falls back to a flat baseline when stream is null / paused
//     so the chrome stays consistent.
//   • Cleans up AudioContext + analyser on unmount; never leaks.
//
// The visualiser does NOT manage recording itself — pass it the
// stream from your recording hook. Decoupling keeps it reusable.
// ============================================================

interface SoundwaveVisualizerProps {
  stream: MediaStream | null
  active?: boolean
  bars?: number
  className?: string
  height?: number
}

export function SoundwaveVisualizer({
  stream,
  active = true,
  bars = 32,
  className,
  height = 64,
}: SoundwaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = (data: Uint8Array<ArrayBuffer> | null) => {
      const c = canvas.getContext('2d')
      if (!c) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
        c.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      c.clearRect(0, 0, w, h)

      const gap = 3
      const barWidth = Math.max(2, (w - gap * (bars - 1)) / bars)
      const mid = h / 2

      for (let i = 0; i < bars; i++) {
        const value = data ? data[Math.floor((i / bars) * data.length)] / 255 : 0.05
        const eased = Math.pow(value, 0.6)
        const halfH = Math.max(2, eased * (mid - 4))
        const x = i * (barWidth + gap)
        const tip = value > 0.78
        const grad = c.createLinearGradient(0, mid - halfH, 0, mid + halfH)
        grad.addColorStop(0, tip ? '#8e3644' : '#d9b45f')
        grad.addColorStop(0.5, '#b3903e')
        grad.addColorStop(1, tip ? '#8e3644' : '#8b6914')
        c.fillStyle = grad
        c.fillRect(x, mid - halfH, barWidth, halfH * 2)
      }
    }

    // No stream → render the flat baseline and stop
    if (!stream || !active) {
      draw(null)
      return
    }

    // Defer AudioContext creation to a user-interaction-safe path;
    // it's fine here because getUserMedia has already required interaction.
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) {
      draw(null)
      return
    }

    const audioCtx = new Ctor()
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.78
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)
    ctxRef.current = audioCtx
    analyserRef.current = analyser
    sourceRef.current = source

    const buffer = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      analyser.getByteFrequencyData(buffer as Uint8Array<ArrayBuffer>)
      draw(buffer as Uint8Array<ArrayBuffer>)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      try {
        source.disconnect()
      } catch {
        /* ignore */
      }
      try {
        analyser.disconnect()
      } catch {
        /* ignore */
      }
      audioCtx.close().catch(() => {
        /* ignore */
      })
      ctxRef.current = null
      analyserRef.current = null
      sourceRef.current = null
    }
  }, [stream, active, bars])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ height }}
      className={cn('block w-full', className)}
    />
  )
}
