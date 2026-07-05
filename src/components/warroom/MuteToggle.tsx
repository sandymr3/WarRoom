'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { useAmbientAudio } from '@/src/hooks/useAmbientAudio'
import { cn } from '@/lib/utils'

interface MuteToggleProps {
  className?: string
}

export function MuteToggle({ className }: MuteToggleProps) {
  const { isMuted, toggleMute } = useAmbientAudio()

  return (
    <button
      type="button"
      aria-label={isMuted ? 'Unmute war room ambient audio' : 'Mute war room ambient audio'}
      aria-pressed={isMuted}
      onClick={toggleMute}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-sm',
        'border border-[color:var(--color-warroom-gold)]/30',
        'bg-[color:var(--color-warroom-obsidian)]/60 backdrop-blur-md',
        'text-[color:var(--color-warroom-gold)]',
        'transition-all duration-200',
        'hover:border-[color:var(--color-warroom-gold)]/60 hover:bg-[color:var(--color-warroom-obsidian)]/80',
        'hover:shadow-[0_0_18px_rgba(179,144,62,0.35)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]',
        className,
      )}
    >
      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  )
}
