'use client'

// ============================================
// <HouseCustomizer /> — choose crest shape, banner palette, and house
// words. Only rank-unlocked options are selectable (earned, not bought).
// Reports changes via onSave; the parent owns persistence.
// ============================================

import { useState } from 'react'
import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HouseConfig } from '@/src/types'
import {
  HOUSE_PALETTES,
  HOUSE_SIGILS,
  HOUSE_WORDS,
  HOUSE_WORDS_MAX,
  isUnlocked,
} from '@/src/lib/progression'
import { SigilCrest, iconForHouseSigil } from './SigilCrest'

export interface HouseCustomizerProps {
  house: HouseConfig
  rankTier: number
  onSave: (patch: Partial<HouseConfig>) => Promise<void> | void
  className?: string
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-warroom-gold)]/80"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {children}
    </p>
  )
}

export function HouseCustomizer({ house, rankTier, onSave, className }: HouseCustomizerProps) {
  const [sigilId, setSigilId] = useState(house.sigilId)
  const [paletteId, setPaletteId] = useState(house.paletteId)
  const [words, setWords] = useState(house.words)
  const [saving, setSaving] = useState(false)

  const dirty =
    sigilId !== house.sigilId || paletteId !== house.paletteId || words !== house.words

  const handleSave = async () => {
    if (!dirty || saving) return
    setSaving(true)
    try {
      await onSave({ sigilId, paletteId, words })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn('space-y-7', className)}>
      {/* Crest shapes */}
      <div>
        <SectionLabel>Club Crest</SectionLabel>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {HOUSE_SIGILS.map((s) => {
            const unlocked = isUnlocked(s.unlockRank, rankTier)
            const selected = sigilId === s.id
            return (
              <button
                key={s.id}
                type="button"
                disabled={!unlocked}
                onClick={() => unlocked && setSigilId(s.id)}
                title={unlocked ? s.name : `Unlocks at rank ${s.unlockRank}`}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-sm border p-2 transition-colors',
                  selected
                    ? 'border-[color:var(--color-warroom-gold)] bg-[color:var(--color-warroom-gold)]/10'
                    : 'border-[color:var(--color-warroom-stone)]/50 hover:border-[color:var(--color-warroom-gold)]/40',
                  !unlocked && 'cursor-not-allowed opacity-60',
                )}
              >
                <SigilCrest
                  icon={iconForHouseSigil(s.id)}
                  size={40}
                  primary="#b3903e"
                  secondary="#8b6914"
                  locked={!unlocked}
                />
                <span className="text-[9px] uppercase tracking-[0.08em] text-[color:var(--color-warroom-smoke)]">
                  {s.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Palette */}
      <div>
        <SectionLabel>Banner Colours</SectionLabel>
        <div className="flex flex-wrap gap-3">
          {HOUSE_PALETTES.map((p) => {
            const unlocked = isUnlocked(p.unlockRank, rankTier)
            const selected = paletteId === p.id
            return (
              <button
                key={p.id}
                type="button"
                disabled={!unlocked}
                onClick={() => unlocked && setPaletteId(p.id)}
                title={unlocked ? p.name : `Unlocks at rank ${p.unlockRank}`}
                className={cn(
                  'relative h-11 w-11 rounded-sm border-2 transition-transform',
                  selected
                    ? 'border-[color:var(--color-warroom-gold-bright)] scale-105'
                    : 'border-transparent hover:scale-105',
                  !unlocked && 'cursor-not-allowed opacity-50',
                )}
                style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})` }}
                aria-label={p.name}
              >
                {selected && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-[color:var(--color-warroom-black)]" />
                )}
                {!unlocked && (
                  <Lock className="absolute inset-0 m-auto h-4 w-4 text-white/80" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Words */}
      <div>
        <SectionLabel>Club Motto</SectionLabel>
        <div className="mb-3 flex flex-wrap gap-2">
          {HOUSE_WORDS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWords(w)}
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] tracking-[0.04em] transition-colors',
                words === w
                  ? 'border-[color:var(--color-warroom-gold)] bg-[color:var(--color-warroom-gold)]/10 text-[color:var(--color-warroom-gold-bright)]'
                  : 'border-[color:var(--color-warroom-stone)]/50 text-[color:var(--color-warroom-smoke)] hover:border-[color:var(--color-warroom-gold)]/40',
              )}
              style={{ fontFamily: 'var(--font-body, var(--font-display))' }}
            >
              {w}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={words}
          maxLength={HOUSE_WORDS_MAX}
          onChange={(e) => setWords(e.target.value)}
          placeholder="Or write your own…"
          className="w-full rounded-sm border border-[color:var(--color-warroom-stone)]/50 bg-[color:var(--color-warroom-black)]/60 px-3 py-2 text-sm italic text-[color:var(--color-warroom-ivory)] outline-none transition-colors focus:border-[color:var(--color-warroom-gold)]/60"
          style={{ fontFamily: 'var(--font-body, var(--font-display))' }}
        />
        <div className="mt-1 text-right text-[10px] text-[color:var(--color-warroom-smoke)]">
          {words.length}/{HOUSE_WORDS_MAX}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!dirty || saving}
        className={cn(
          'inline-flex items-center gap-2 rounded-sm border px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-all',
          dirty && !saving
            ? 'border-[color:var(--color-warroom-gold)] text-[color:var(--color-warroom-gold)] hover:bg-[color:var(--color-warroom-gold)]/10'
            : 'cursor-not-allowed border-[color:var(--color-warroom-stone)]/50 text-[color:var(--color-warroom-smoke)]',
        )}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {saving ? 'Saving…' : 'Save Club Identity'}
      </button>
    </div>
  )
}
