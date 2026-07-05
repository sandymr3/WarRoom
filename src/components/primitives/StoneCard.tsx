'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface StoneCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional decoration rendered as a low-opacity watermark behind children. */
  sigilWatermark?: ReactNode
  /** Top-border gradient color. Defaults to gold. */
  accent?: string
  /** Add hover lift + transition. */
  interactive?: boolean
  /** Inner padding shortcut. Defaults to 'lg' (p-7). */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Subtle physical material grain layered behind the content. Off by default. */
  texture?: 'parchment' | 'leather' | 'stone'
}

const PADDING_CLASSES: Record<NonNullable<StoneCardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-7',
}

// Per-material opacity — leather/parchment read stronger than near-black stone.
const TEXTURE_OPACITY: Record<NonNullable<StoneCardProps['texture']>, number> = {
  parchment: 0.13,
  leather: 0.16,
  stone: 0.1,
}

/**
 * <StoneCard /> — the canonical dark stone panel.
 *
 * Wraps the existing `.got-stone-card` CSS class (defined in
 * globals.css) so dark/light theme tokens stay aligned. Adds an
 * optional sigil watermark and configurable accent color for the
 * top gradient rule.
 */
export const StoneCard = forwardRef<HTMLDivElement, StoneCardProps>(
  function StoneCard(
    {
      sigilWatermark,
      accent,
      interactive = false,
      padding = 'lg',
      texture,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          'got-stone-card relative overflow-hidden',
          PADDING_CLASSES[padding],
          interactive &&
            'transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_10px_36px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(179,144,62,0.18)]',
          className,
        )}
        style={
          accent
            ? {
                ...style,
                ['--stonecard-accent' as never]: accent,
              }
            : style
        }
        {...rest}
      >
        {texture && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url("/assets/images/textures/${texture}.webp")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: TEXTURE_OPACITY[texture],
              mixBlendMode: 'overlay',
            }}
          />
        )}
        {accent && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            }}
          />
        )}
        {sigilWatermark && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06] text-[10rem]"
          >
            {sigilWatermark}
          </span>
        )}
        <div className="relative">{children}</div>
      </div>
    )
  },
)
