'use client'

import { forwardRef, type ReactNode, type MouseEvent } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { audioManager, type SfxKey } from '@/lib/audio/audioManager'

type WarRoomCTASize = 'sm' | 'md' | 'lg'
type WarRoomCTAVariant = 'primary' | 'ghost'

type MotionButtonProps = HTMLMotionProps<'button'>

export interface WarRoomCTAProps
  extends Omit<MotionButtonProps, 'children' | 'ref'> {
  size?: WarRoomCTASize
  variant?: WarRoomCTAVariant
  icon?: LucideIcon
  iconRight?: LucideIcon
  sfxKey?: SfxKey
  children: ReactNode
  className?: string
}

const SIZE_CLASSES: Record<WarRoomCTASize, string> = {
  sm: 'px-5 py-2.5 text-xs',
  md: 'px-7 py-3.5 text-sm',
  lg: 'px-10 py-5 text-base',
}

const CORNER_SIZE: Record<WarRoomCTASize, number> = {
  sm: 6,
  md: 8,
  lg: 10,
}

/**
 * <WarRoomCTA /> — the canonical primary action button for the app.
 *
 * Gold-bordered with corner embellishments. Plays a UI click SFX
 * on click (routed via audioManager, which falls through to the
 * GOTSoundManager synth when files are missing).
 *
 * Wrap in <Link> for navigation: <Link href="..."><WarRoomCTA>...</WarRoomCTA></Link>.
 */
export const WarRoomCTA = forwardRef<HTMLButtonElement, WarRoomCTAProps>(
  function WarRoomCTA(
    {
      size = 'md',
      variant = 'primary',
      icon: Icon,
      iconRight: IconRight,
      sfxKey = 'ui.click',
      onClick,
      className,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      audioManager.playSfx(sfxKey)
      onClick?.(e)
    }

    const corner = CORNER_SIZE[size]

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        onClick={handleClick}
        className={cn(
          'relative inline-flex items-center justify-center gap-2.5 font-bold uppercase tracking-[0.1em] select-none',
          'border rounded-[3px] overflow-visible',
          SIZE_CLASSES[size],
          variant === 'primary' && [
            'text-primary-foreground',
            'border-[color:var(--color-warroom-gold)]/60',
            'shadow-[0_4px_24px_rgba(201,150,42,0.35),inset_0_1px_0_rgba(255,230,120,0.3)]',
          ],
          variant === 'ghost' && [
            'text-warroom-gold border-[color:var(--color-warroom-gold)]/35 bg-[color:var(--color-warroom-gold)]/[0.06]',
            'hover:border-[color:var(--color-warroom-gold)]/60',
          ],
          className,
        )}
        style={{
          fontFamily: 'var(--font-display)',
          ...(variant === 'primary'
            ? {
                background:
                  'linear-gradient(135deg, #8b6914, #b3903e, #d9b45f, #b3903e, #8b6914)',
                backgroundSize: '200% 100%',
              }
            : {}),
        }}
        {...rest}
      >
        {/* Corner embellishments — 4 small L-shapes at each corner */}
        <CornerOrnament position="tl" size={corner} variant={variant} />
        <CornerOrnament position="tr" size={corner} variant={variant} />
        <CornerOrnament position="bl" size={corner} variant={variant} />
        <CornerOrnament position="br" size={corner} variant={variant} />

        {Icon && <Icon className="h-[1.1em] w-[1.1em] shrink-0" aria-hidden />}
        <span>{children}</span>
        {IconRight && (
          <IconRight className="h-[1.1em] w-[1.1em] shrink-0" aria-hidden />
        )}
      </motion.button>
    )
  },
)

type CornerPosition = 'tl' | 'tr' | 'bl' | 'br'

function CornerOrnament({
  position,
  size,
  variant,
}: {
  position: CornerPosition
  size: number
  variant: WarRoomCTAVariant
}) {
  const color =
    variant === 'primary'
      ? 'rgba(255, 230, 120, 0.85)'
      : 'var(--color-warroom-gold)'
  const offset = -2

  const styles: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: color,
    pointerEvents: 'none',
  }
  if (position === 'tl') {
    styles.top = offset
    styles.left = offset
    styles.borderTop = `1px solid ${color}`
    styles.borderLeft = `1px solid ${color}`
  } else if (position === 'tr') {
    styles.top = offset
    styles.right = offset
    styles.borderTop = `1px solid ${color}`
    styles.borderRight = `1px solid ${color}`
  } else if (position === 'bl') {
    styles.bottom = offset
    styles.left = offset
    styles.borderBottom = `1px solid ${color}`
    styles.borderLeft = `1px solid ${color}`
  } else {
    styles.bottom = offset
    styles.right = offset
    styles.borderBottom = `1px solid ${color}`
    styles.borderRight = `1px solid ${color}`
  }
  return <span aria-hidden style={styles} />
}
