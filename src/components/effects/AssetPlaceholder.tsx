'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// <AssetPlaceholder />
// ----------------------------------------------------------------
// Drop-in placeholder shown when an expected asset (image, video,
// audio) isn't on disk yet. Communicates exactly which file the
// caller is missing so the team can drop one in.
//
// Designed to be quiet but legible — dashed gold border, Cinzel
// label, asset path in monospace. Sits inside the same bounding
// box the real asset would occupy.
//
// Usage:
//   <AssetPlaceholder
//     kind="video"
//     label="Door cinematic"
//     path="/videos/warroom-door-opening.mp4"
//   />
//
// To globally hide every placeholder (e.g. for a polished demo):
//   localStorage.setItem('warroom_hide_asset_placeholders', 'true')
// ============================================================

export type AssetKind = 'video' | 'image' | 'audio' | 'sigil' | 'generic'

interface AssetPlaceholderProps {
  /** Short human label e.g. "Door cinematic", "Speaking GIF". */
  label: string
  /** The exact public-path the component is probing for. */
  path: string
  /** Hint shown to the right of the label, e.g. ".webm / .mp4". */
  formatHint?: string
  kind?: AssetKind
  /** Override the verb. Default: "will be shown here". */
  verb?: string
  className?: string
}

const HIDE_KEY = 'warroom_hide_asset_placeholders'

function shouldHide(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(HIDE_KEY) === 'true'
  } catch {
    return false
  }
}

const KIND_ICON: Record<AssetKind, string> = {
  video: '▶',
  image: '◧',
  audio: '♪',
  sigil: '⚜',
  generic: '◇',
}

export function AssetPlaceholder({
  label,
  path,
  formatHint,
  kind = 'generic',
  verb = 'will be shown here',
  className,
}: AssetPlaceholderProps) {
  if (shouldHide()) return null

  return (
    <div
      role="img"
      aria-label={`${label} placeholder — drop ${path} to populate`}
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden p-4 text-center',
        'border border-dashed border-[color:var(--color-warroom-gold)]/40',
        'bg-[color:var(--color-warroom-obsidian)]/40 backdrop-blur-[2px]',
        className,
      )}
    >
      <span
        aria-hidden
        className="font-display text-3xl text-[color:var(--color-warroom-gold)]/55"
        style={{ textShadow: '0 0 14px rgba(179,144,62,0.35)' }}
      >
        {KIND_ICON[kind]}
      </span>
      <p className="font-display text-[0.6rem] uppercase tracking-[0.22em] text-[color:var(--color-warroom-gold)]/75">
        {label}
      </p>
      <p className="font-display text-[0.55rem] uppercase tracking-[0.18em] text-foreground/55">
        {verb}
      </p>
      <code className="max-w-full break-all rounded-sm border border-[color:var(--color-warroom-gold)]/15 bg-[color:var(--color-warroom-black)]/40 px-2 py-0.5 font-mono text-[0.65rem] text-[color:var(--color-warroom-parchment)]/65">
        {path}
      </code>
      {formatHint && (
        <p className="font-mono text-[0.6rem] text-foreground/35">{formatHint}</p>
      )}
    </div>
  )
}
