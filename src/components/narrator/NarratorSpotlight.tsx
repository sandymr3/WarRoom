'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface NarratorSpotlightProps {
  targetElementId: string | null
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PADDING = 12

/**
 * <NarratorSpotlight /> — dims the page and rings the spotlit element.
 *
 * Portals to document.body so it draws above any sticky/fixed nav.
 * The dim overlay has pointer-events: none so the spotlit element
 * stays clickable.
 *
 * Tracks the element via getBoundingClientRect with animation-frame
 * scheduling and window resize/scroll listeners for liveness. Avoids
 * ResizeObserver feedback loops from animated layout changes.
 */
export function NarratorSpotlight({ targetElementId }: NarratorSpotlightProps) {
  const [rect, setRect] = useState<Rect | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (!targetElementId) {
      setRect(null)
      return
    }

    let frame = 0
    const measure = () => {
      frame = 0
      const el = document.getElementById(targetElementId)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect({
        top: r.top - PADDING,
        left: r.left - PADDING,
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
      })
    }
    const update = () => {
      if (frame === 0) frame = requestAnimationFrame(measure)
    }

    update()

    window.addEventListener('resize', update, { passive: true })
    window.addEventListener('scroll', update, { passive: true, capture: true })

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, { capture: true } as never)
      if (frame) cancelAnimationFrame(frame)
      if (ro) ro.disconnect()
    }
  }, [targetElementId, mounted])

  if (!mounted || typeof document === 'undefined') return null
  if (!targetElementId) return null

  return createPortal(
    <AnimatePresence>
      {rect && (
        <motion.div
          key="narrator-spotlight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[55] pointer-events-none"
        >
          {/* Dim overlay with a transparent cutout over the target */}
          <svg className="absolute inset-0 w-full h-full" aria-hidden>
            <defs>
              <mask id="narrator-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={rect.left}
                  y={rect.top}
                  width={rect.width}
                  height={rect.height}
                  rx="6"
                  ry="6"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(6,5,4,0.6)"
              mask="url(#narrator-spotlight-mask)"
            />
          </svg>

          {/* Pulsing gold ring */}
          <motion.span
            aria-hidden
            className="absolute rounded-md"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              boxShadow:
                '0 0 0 2px rgba(240,192,64,0.8), 0 0 24px 6px rgba(240,192,64,0.4)',
            }}
            animate={{
              boxShadow: [
                '0 0 0 2px rgba(240,192,64,0.8), 0 0 18px 4px rgba(240,192,64,0.35)',
                '0 0 0 2px rgba(240,192,64,1), 0 0 28px 10px rgba(240,192,64,0.55)',
                '0 0 0 2px rgba(240,192,64,0.8), 0 0 18px 4px rgba(240,192,64,0.35)',
              ],
            }}
            transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
