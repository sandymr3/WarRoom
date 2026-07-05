'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================
// COUNT UP — Animated number counter
// ============================================

interface CountUpProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export function CountUp({ end, duration = 2, prefix = '', suffix = '', decimals = 0, className }: CountUpProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimated.current) return
    hasAnimated.current = true

    const startTime = performance.now()
    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(eased * end)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isInView, end, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  )
}

// ============================================
// TYPEWRITER TEXT — Character-by-character reveal
// ============================================

interface TypewriterTextProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  onComplete?: () => void
}

export function TypewriterText({ text, speed = 40, delay = 0, className, onComplete }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(timeout)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (displayed.length >= text.length) {
      onComplete?.()
      return
    }
    const timeout = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1))
    }, speed)
    return () => clearTimeout(timeout)
  }, [started, displayed, text, speed, onComplete])

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
          className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle"
        />
      )}
    </span>
  )
}

// ============================================
// ANIMATED GRADIENT TEXT
// ============================================

interface AnimatedGradientTextProps {
  children: React.ReactNode
  className?: string
  from?: string
  via?: string
  to?: string
}

export function AnimatedGradientText({ children, className, from = '#b3903e', via = '#f59e0b', to = '#8e3644' }: AnimatedGradientTextProps) {
  return (
    <motion.span
      className={cn('inline-block bg-clip-text text-transparent bg-[length:200%_auto]', className)}
      style={{ backgroundImage: `linear-gradient(90deg, ${from}, ${via}, ${to}, ${from})` }}
      animate={{ backgroundPosition: ['0% center', '200% center'] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    >
      {children}
    </motion.span>
  )
}
