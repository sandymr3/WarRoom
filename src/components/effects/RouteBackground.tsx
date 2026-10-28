'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ASSET_REGISTRY } from '@/lib/assets/assetRegistry'
import { useTheme } from 'next-themes'

type BgKey = keyof typeof ASSET_REGISTRY.backgrounds

/**
 * Which plate belongs to which route.
 *
 * Order matters — the first matching prefix wins, so the more specific
 * `/assessment/.../chessboard` entry has to be tested before `/assessment`.
 * `null` means "this route paints its own backdrop, stay out of the way":
 * /login and /register already run the battlefield video in (auth)/layout.
 */
const ROUTE_PLATES: ReadonlyArray<[RegExp, BgKey | null]> = [
  [/^\/(login|register)(\/|$)/, null],
  [/^\/assessment\/[^/]+\/chessboard(\/|$)/, 'chessboard'],
  [/^\/assessment\/[^/]+\/(final-report|stage-report)(\/|$)/, 'verdict'],
  [/^\/assessment(\/|$)/, 'simulation'],
  [/^\/results(\/|$)/, 'verdict'],
  [/^\/history(\/|$)/, 'verdict'],
  [/^\/(dashboard|leaderboard|profile|settings|support|admin)(\/|$)/, 'dashboard'],
  [/^\/terms(\/|$)/, 'landing'],
]

function plateForPath(pathname: string | null): BgKey | null {
  if (!pathname) return 'landing'
  for (const [pattern, plate] of ROUTE_PLATES) {
    if (pattern.test(pathname)) return plate
  }
  return 'landing'
}

interface RouteBackgroundProps {
  /**
   * Force a specific plate. Omit it — the normal case — and the plate is
   * chosen from the current route via ROUTE_PLATES.
   */
  bg?: BgKey
  /** How strongly the plate reads through, 0..1. Per-theme defaults below. */
  opacity?: number
  /** Image brightness filter. Per-theme defaults below. */
  brightness?: number
}

/**
 * <RouteBackground /> — the full-viewport backdrop plate.
 *
 * Mounted once in the root layout, so every route gets a backdrop instead of
 * bare white. It was previously imported by two pages and rendered by neither,
 * which is why the simulation screens showed a flat white page with only the
 * 2%-alpha checkerboard from globals.css.
 *
 * Layering, all fixed and pointer-events-none so nothing captures clicks:
 *   -z-30  solid base in the theme background colour
 *   -z-20  the plate itself, cover-positioned
 *   -z-10  scrim + vignette — lifts contrast for copy that sits directly on
 *          the backdrop (stage headings, "STAGE COMPLETE") rather than inside
 *          a card, and keeps the edges cinematic
 *
 * The image is probed before it is shown, so a missing or slow file leaves the
 * plain background in place rather than flashing a broken plate.
 */
export function RouteBackground({ bg, opacity, brightness }: RouteBackgroundProps) {
  const pathname = usePathname()
  const plate = bg ?? plateForPath(pathname)
  const src = plate ? ASSET_REGISTRY.backgrounds[plate] : null

  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !src) return
    let cancelled = false
    setLoaded(false)
    setFailed(false)
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

  if (!src || failed || !loaded) return null

  // The app runs under forcedTheme="light", so the light values are the ones
  // actually in play today; the dark pair keeps the component honest if that
  // is ever lifted.
  const isLight = mounted && resolvedTheme !== 'dark'

  const plateOpacity = opacity ?? (isLight ? 1 : 0.6)
  const plateBrightness = brightness ?? (isLight ? 1.03 : 0.45)
  const plateSaturation = isLight ? 0.97 : 1

  // Light: a frosted warm wash. Body copy, labels and small gold text sit
  // directly on this backdrop on several routes, so it has to keep them at
  // WCAG AA (4.5:1) even over the darkest stone in the plate — the earlier
  // 20–50% wash let the photo drop that copy to ~2:1. The plate still reads
  // through, softened, with a little more of it left at the edges.
  // Dark: the original black vignette.
  const scrim = isLight
    ? 'radial-gradient(ellipse 90% 85% at 50% 42%, rgba(251,250,247,0.86) 0%, rgba(251,250,247,0.84) 55%, rgba(250,247,240,0.78) 100%)'
    : 'radial-gradient(ellipse at 50% 50%, transparent 0%, transparent 40%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.85) 100%)'

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: -30, backgroundColor: 'var(--background)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: -20,
          backgroundImage: `url("${src}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: plateOpacity,
          filter: `brightness(${plateBrightness}) saturate(${plateSaturation})`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: -10,
          background: scrim,
          backdropFilter: isLight ? 'blur(3px)' : undefined,
        }}
      />
    </>
  )
}
