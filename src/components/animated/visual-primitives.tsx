'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================
// GLOW CARD — Premium glassmorphism card
// ============================================

interface GlowCardProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  hoverScale?: number
  style?: React.CSSProperties
}

export function GlowCard({ children, className, glowColor = 'rgba(179, 144, 62, 0.12)', hoverScale = 1.02, style }: GlowCardProps) {
  return (
    <motion.div
      whileHover={{
        scale: hoverScale,
        boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}, inset 0 1px 0 rgba(179,144,62,0.15)`,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'relative overflow-hidden',
        'shadow-lg shadow-black/20',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(17,14,10,0.9), rgba(10,8,6,0.8))',
        border: '1px solid rgba(179,144,62,0.12)',
        borderRadius: '4px',
        ...style,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(179,144,62,0.25), transparent)' }} />
      {children}
    </motion.div>
  )
}

// ============================================
// PULSE GLOW — Pulsing glow indicator
// ============================================

interface PulseGlowProps {
  color?: string
  size?: number
  className?: string
}

export function PulseGlow({ color = '#10b981', size = 8, className }: PulseGlowProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <motion.span
        animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, width: size, height: size }}
      />
      <span className="relative rounded-full" style={{ backgroundColor: color, width: size, height: size }} />
    </span>
  )
}

// ============================================
// SHIMMER
// ============================================

interface ShimmerProps {
  className?: string
  width?: string
  height?: string
}

export function Shimmer({ className, width = '100%', height = '20px' }: ShimmerProps) {
  return (
    <div
      className={cn('animate-shimmer rounded-lg bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]', className)}
      style={{ width, height }}
    />
  )
}
