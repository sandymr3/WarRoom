'use client'

// ============================================
// <SigilCrest /> — procedural heater-shield crest (no image assets).
// Used for Club crests (chess-piece silhouette + palette) and norm
// achievements (icon + rarity tier). The icon sits on a dark central
// medallion so it stays legible on any crest colour.
// ============================================

import { forwardRef, useId } from 'react'
import {
  Award, Bird, Coins, Crown, Flag, Footprints, Handshake, Hourglass, Lock,
  MessageSquare, Scale, Shield, Sparkles, Star, Target, Trophy,
  type LucideIcon, type LucideProps,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SHIELD =
  'M50 4 C50 4 88 16 88 16 L88 52 C88 84 50 106 50 106 C50 106 12 84 12 52 L12 16 C12 16 50 4 50 4 Z'

// ---- Chess-piece silhouettes (filled, 24×24, currentColor) ----
// Restrained single-path glyphs so club crests read as engraved pieces.
function makePiece(d: string) {
  return forwardRef<SVGSVGElement, LucideProps>(function ChessPiece(
    { color, size, strokeWidth: _sw, absoluteStrokeWidth: _asw, ...rest },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        width={size ?? 24}
        height={size ?? 24}
        fill={color ?? 'currentColor'}
        stroke="none"
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        <path d={d} />
      </svg>
    )
  }) as LucideIcon
}

const PawnIcon = makePiece(
  'M12 3.5a2.6 2.6 0 0 1 2.6 2.6c0 .9-.46 1.7-1.16 2.18 1.1.76 1.9 1.98 2.06 3.42h-1.6c.5 2.05 1.6 3.62 3.1 4.6v1.7H7v-1.7c1.5-.98 2.6-2.55 3.1-4.6H8.5c.16-1.44.96-2.66 2.06-3.42A2.62 2.62 0 0 1 9.4 6.1 2.6 2.6 0 0 1 12 3.5ZM6 19.5h12v2H6Z',
)
const RookIcon = makePiece(
  'M6 3h2.5v2H10V3h4v2h1.5V3H18v5l-1.5 1.5v6L18 17v1H6v-1l1.5-1.5v-6L6 8Zm0 16.5h12v2H6Z',
)
const BishopIcon = makePiece(
  'M12 2.5a1.5 1.5 0 0 1 0 3 1.5 1.5 0 0 1 0-3Zm0 4c2.3 1.4 3.8 3.4 3.8 5.6 0 1.5-.66 2.85-1.75 3.9l1.45 1.5v1H8.5v-1l1.45-1.5c-1.1-1.05-1.75-2.4-1.75-3.9 0-2.2 1.5-4.2 3.8-5.6ZM6 19.5h12v2H6Z',
)
const KnightIcon = makePiece(
  'M8.2 18h9.3v-6.9c0-3.5-1.6-6.2-4.6-6.9-2.2-.5-4.2.5-5.4 2.4L6 9.2l1.3 3 1.9.4 2-1.2c.3 1.7-.3 2.8-1.3 3.9-.9 1-1.7 1.6-1.7 2.7Zm-2.2 1.5h12v2H6Z',
)
const QueenIcon = makePiece(
  'm12 2.2 1.6 4.8 3.4-3 .6 4.6 3.4-.9L18.5 15h-13L3 7.7l3.4.9L7 4l3.4 3L12 2.2ZM5.5 16.5h13V18h-13ZM6 19.5h12v2H6Z',
)
const KingIcon = makePiece(
  'M11 2h2v2h2v2h-2v2.3c2.4.7 4 2.6 4 5.2 0 1.2-.42 2.3-1.2 3.2l1.2 1.3v1H7v-1l1.2-1.3A4.86 4.86 0 0 1 7 13.5c0-2.6 1.6-4.5 4-5.2V6H9V4h2Zm-5 17.5h12v2H6Z',
)

/** Norm achievement id → icon (legacy ids, chess display names). */
export const ICON_BY_SIGIL: Record<string, LucideIcon> = {
  first_blood: Footprints,
  the_committed: Flag,
  silver_tongue: MessageSquare,
  the_diplomat: Handshake,
  the_unbroken: Shield,
  master_of_coin: Coins,
  dragonslayer: Trophy,
  natural_born: Star,
  the_phoenix: Bird,
  iron_will: Hourglass,
  the_strategist: Target,
  polymath: Sparkles,
  the_sovereign: Crown,
  unanimous: Scale,
}

/** Club crest shape id → chess piece (legacy ids, piece silhouettes). */
export const ICON_BY_HOUSE_SIGIL: Record<string, LucideIcon> = {
  blade: PawnIcon,
  flame: BishopIcon,
  tower: RookIcon,
  crown: KingIcon,
  wolf: KnightIcon,
  dragon: QueenIcon,
}

export function iconForSigil(id: string): LucideIcon {
  return ICON_BY_SIGIL[id] ?? Award
}
export function iconForHouseSigil(id: string): LucideIcon {
  return ICON_BY_HOUSE_SIGIL[id] ?? PawnIcon
}

export interface SigilCrestProps {
  icon: LucideIcon
  size?: number
  /** Main crest colour. */
  primary: string
  /** Gradient end (defaults to primary). */
  secondary?: string
  /** Icon tint (defaults to a bright parchment). */
  iconColor?: string
  locked?: boolean
  title?: string
  className?: string
}

export function SigilCrest({
  icon: Icon,
  size = 72,
  primary,
  secondary,
  iconColor,
  locked = false,
  title,
  className,
}: SigilCrestProps) {
  const gid = useId().replace(/:/g, '')
  const top = locked ? '#3a352c' : secondary ?? primary
  const mid = locked ? '#2a261e' : primary
  const stroke = locked ? '#4a4336' : secondary ?? primary
  const tint = locked ? '#6b6353' : iconColor ?? '#f3ead7'

  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size * 1.1 }}
      role="img"
      aria-label={title}
      title={title}
    >
      <svg viewBox="0 0 100 110" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`crest-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={top} />
            <stop offset="52%" stopColor={mid} />
            <stop offset="100%" stopColor={top} />
          </linearGradient>
        </defs>
        <path
          d={SHIELD}
          fill={`url(#crest-${gid})`}
          stroke={stroke}
          strokeWidth="2.5"
          opacity={locked ? 0.55 : 1}
        />
        {/* top sheen */}
        <path
          d="M50 8 C50 8 84 19 84 19 L84 30 C70 22 30 22 16 30 L16 19 C16 19 50 8 50 8 Z"
          fill="rgba(255,255,255,0.14)"
        />
        {/* dark central medallion for icon legibility */}
        <circle cx="50" cy="56" r="23" fill="rgba(8,6,4,0.88)" stroke={stroke} strokeWidth="1.5" opacity={locked ? 0.6 : 1} />
      </svg>

      <Icon
        aria-hidden
        style={{
          width: size * 0.3,
          height: size * 0.3,
          color: tint,
          marginTop: size * 0.04,
          filter: locked ? 'none' : 'drop-shadow(0 0 6px rgba(0,0,0,0.5))',
        }}
      />

      {locked && (
        <span
          className="absolute -bottom-0.5 right-0 flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--color-warroom-gold)]/30 bg-[color:var(--color-warroom-black)]"
          aria-hidden
        >
          <Lock className="h-2.5 w-2.5 text-[color:var(--color-warroom-smoke)]" />
        </span>
      )}
    </div>
  )
}
