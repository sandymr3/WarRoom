'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// <AnswerScrollInput /> — dramatic answer area styled as an aged
// dispatch / war scroll. Supports either text input or recording.
//
// This component owns NO audio/recording state — it's purely a
// styled container. The parent passes:
//   • `value` / `onChange` for text mode
//   • `recordingSlot` for the soundwave visualiser + mic button
//
// Mode is implied by which slot you provide. Both can coexist
// (some flows allow text fallback alongside voice).
// ============================================================

interface AnswerScrollInputProps {
  value?: string
  onChange?: (next: string) => void
  placeholder?: string
  /** Slot for the soundwave + mic UI when in voice mode. */
  recordingSlot?: React.ReactNode
  /** Tag rendered above the input — e.g. "Your war dispatch". */
  label?: string
  /** Optional helper text below the input. */
  hint?: string
  disabled?: boolean
  /** Min rows in text mode. */
  minRows?: number
  maxLength?: number
  className?: string
}

export function AnswerScrollInput({
  value,
  onChange,
  placeholder = 'Speak your defence into the air, or commit it to ink…',
  recordingSlot,
  label = 'Your reply',
  hint,
  disabled = false,
  minRows = 4,
  maxLength,
  className,
}: AnswerScrollInputProps) {
  const id = React.useId()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border border-[color:var(--color-warroom-gold)]/25 p-4',
        'bg-[color:var(--color-warroom-parchment)]/[0.04] backdrop-blur-sm',
        'shadow-[0_4px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(245,230,200,0.06)]',
        'noise-overlay',
        disabled && 'opacity-60',
        className,
      )}
      style={{
        // Aged war-scroll: parchment grain beneath a warm-dark wash so the
        // mono dispatch text stays crisp.
        backgroundImage:
          'var(--wr-parchment-wash), url("/assets/images/textures/parchment.webp")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top accent — gold tape across the top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(179,144,62,0.6), rgba(217,180,95,0.85), rgba(179,144,62,0.6), transparent)',
        }}
      />

      <label
        htmlFor={id}
        className="mb-2 block font-display text-[0.6rem] uppercase tracking-[0.22em] text-[color:var(--color-warroom-gold)]/90"
      >
        {label}
      </label>

      {recordingSlot && <div className="mb-3">{recordingSlot}</div>}

      {onChange !== undefined && (
        <textarea
          id={id}
          ref={textareaRef}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={minRows}
          className={cn(
            'block w-full resize-y rounded-sm border border-[color:var(--color-warroom-gold)]/15 bg-transparent px-3 py-2',
            'font-mono text-sm leading-relaxed text-foreground placeholder:italic placeholder:text-foreground/40',
            'caret-[color:var(--color-warroom-gold)]',
            'focus-visible:border-[color:var(--color-warroom-gold)]/45 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--color-warroom-gold)]/40',
          )}
        />
      )}

      {(hint || (maxLength && value !== undefined)) && (
        <div className="mt-2 flex items-center justify-between text-[0.65rem] uppercase tracking-wider text-foreground/45">
          {hint && <span>{hint}</span>}
          {maxLength && value !== undefined && (
            <span className="ml-auto font-mono tabular-nums">
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
