'use client'

import { useEffect, useState } from 'react'
import { ASSET_REGISTRY } from '@/lib/assets/assetRegistry'
import { useTheme } from 'next-themes'

type BgKey = keyof typeof ASSET_REGISTRY.backgrounds

interface RouteBackgroundProps {
  /** Which background plate to render. Keys come from ASSET_REGISTRY.backgrounds. */
  bg: BgKey
  /**
   * Optional brightness override (0..1). Defaults to 0.35 per
   * ASSETS_REQUIRED.md so gold/ivory copy remains legible.
   */
  brightness?: number
}

/**
 * <RouteBackground /> — full-viewport fixed background plate.
 *
 * Probes the image at mount; renders it only when the browser
 * successfully decoded it, so a missing file shows the existing
 * CSS gradient fallback the page already provides.
 *
 * Sits at z-index -10 behind every other layer. Pointer-events
 * disabled so it never captures clicks.
 */
export function RouteBackground({ bg, brightness = 0.35 }: RouteBackgroundProps) {
  const src = ASSET_REGISTRY.backgrounds[bg]
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setLoaded(true)
    }
    img.onerror = () => {
      if (!cancelled) setFailed(true)
    }
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  if (failed || !loaded) return null

  const currentBrightness = mounted && resolvedTheme === 'light' ? 0.85 : brightness

  const vignetteStyle = mounted && resolvedTheme === 'light'
    ? {
        background:
          'radial-gradient(ellipse at 50% 50%, transparent 0%, transparent 50%, rgba(139,120,90,0.15) 80%, rgba(139,120,90,0.3) 100%)',
        mixBlendMode: 'multiply' as const,
      }
    : {
        background:
          'radial-gradient(ellipse at 50% 50%, transparent 0%, transparent 40%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.85) 100%)',
        mixBlendMode: 'multiply' as const,
      }

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          backgroundColor: 'var(--background)',
          backgroundImage: 'conic-gradient(color-mix(in srgb, var(--card) 70%, transparent) 25%, var(--background) 0 50%, color-mix(in srgb, var(--card) 70%, transparent) 0 75%, var(--background) 0)',
          backgroundSize: '160px 160px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.20]"
        style={{
          backgroundImage: `url("${src}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: `brightness(${currentBrightness}) saturate(${mounted && resolvedTheme === 'light' ? 0.72 : 1})`,
        }}
      />
      {/* Cinematic vignette — CSS radial gradient from transparent center to black edges */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={vignetteStyle}
      />
    </>
  )
}
