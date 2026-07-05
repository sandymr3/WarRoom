'use client'

import { useState } from 'react'
import { Volume2, VolumeX, Music, Mic2, Zap, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAudioStore } from '@/src/state/audioStore'

type MutedKey = 'isSfxMuted' | 'isAmbientMuted' | 'isNarratorMuted' | 'isVoiceMuted'
type ToggleAction = 'toggleSfxMute' | 'toggleAmbientMute' | 'toggleNarratorMute' | 'toggleVoiceMute'

interface ChannelConfig {
  id: string
  label: string
  icon: React.ReactNode
  mutedKey: MutedKey
  toggleAction: ToggleAction
}

const CHANNELS: ChannelConfig[] = [
  { id: 'voice',    label: 'Voice Lines',  icon: <Mic2 className="h-3.5 w-3.5" />,         mutedKey: 'isVoiceMuted',    toggleAction: 'toggleVoiceMute'    },
  { id: 'narrator', label: 'Narrator Voice', icon: <MessageSquare className="h-3.5 w-3.5" />, mutedKey: 'isNarratorMuted', toggleAction: 'toggleNarratorMute' },
  { id: 'sfx',      label: 'SFX',          icon: <Zap className="h-3.5 w-3.5" />,           mutedKey: 'isSfxMuted',      toggleAction: 'toggleSfxMute'      },
  { id: 'ambient',  label: 'Sound Theme',  icon: <Music className="h-3.5 w-3.5" />,         mutedKey: 'isAmbientMuted',  toggleAction: 'toggleAmbientMute'  },
]

export function AudioControls({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const store = useAudioStore()

  const activeCount = CHANNELS.filter((ch) => !store[ch.mutedKey]).length
  const allMuted = activeCount === 0

  return (
    <div className={cn('relative', className)}>
      <button
        id="audio-controls-toggle"
        type="button"
        aria-label="Audio channel controls"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-sm px-3',
          'border border-[color:var(--color-warroom-gold)]/30',
          'bg-[color:var(--color-warroom-obsidian)]/60 backdrop-blur-md',
          'text-[color:var(--color-warroom-gold)] font-display text-[0.6rem] uppercase tracking-[0.16em]',
          'transition-all duration-200',
          'hover:border-[color:var(--color-warroom-gold)]/60 hover:bg-[color:var(--color-warroom-obsidian)]/80',
          'hover:shadow-[0_0_18px_rgba(179,144,62,0.25)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]',
          open && 'border-[color:var(--color-warroom-gold)]/60 shadow-[0_0_18px_rgba(179,144,62,0.25)]',
        )}
      >
        {allMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        <span className="hidden sm:inline">Audio</span>
        {activeCount > 0 && (
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--color-warroom-gold)] text-[9px] font-bold text-[color:var(--color-warroom-obsidian)]">
            {activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[49]" onClick={() => setOpen(false)} aria-hidden />
            <motion.div
              id="audio-controls-panel"
              role="dialog"
              aria-label="Audio channel controls"
              className={cn(
                'absolute right-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-md',
                'border border-[color:var(--color-warroom-gold)]/25',
                'bg-[color:var(--color-warroom-obsidian)] backdrop-blur-xl',
                'shadow-[0_8px_40px_rgba(0,0,0,0.7),0_0_30px_rgba(179,144,62,0.08)]',
              )}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[color:var(--color-warroom-gold)]/15 px-4 py-2.5">
                <span className="font-display text-[0.58rem] uppercase tracking-[0.2em] text-[color:var(--color-warroom-gold)]/70">
                  Audio Channels
                </span>
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: allMuted ? 'var(--color-warroom-crimson)' : '#4ade80',
                    boxShadow: allMuted ? '0 0 6px var(--color-warroom-crimson)' : '0 0 6px #4ade80',
                  }}
                />
              </div>

              {/* Channels */}
              <div className="flex flex-col gap-1 p-2">
                {CHANNELS.map((ch, i) => {
                  const isMuted = store[ch.mutedKey]
                  const toggle = store[ch.toggleAction]
                  return (
                    <motion.button
                      key={ch.id}
                      id={`audio-channel-${ch.id}`}
                      type="button"
                      role="switch"
                      aria-checked={!isMuted}
                      aria-label={`${isMuted ? 'Unmute' : 'Mute'} ${ch.label}`}
                      onClick={toggle}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left',
                        'transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--color-warroom-gold)]',
                        isMuted
                          ? 'bg-transparent text-[color:var(--color-warroom-ash)] hover:bg-white/5'
                          : 'bg-[color:var(--color-warroom-gold)]/8 text-[color:var(--color-warroom-gold)] hover:bg-[color:var(--color-warroom-gold)]/15',
                      )}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <span className={cn('flex-shrink-0 transition-opacity', isMuted ? 'opacity-35' : 'opacity-100')}>
                        {ch.icon}
                      </span>
                      <span className="flex-1 font-display text-[0.65rem] uppercase tracking-[0.14em]">
                        {ch.label}
                      </span>
                      <span className="flex-shrink-0">
                        {isMuted
                          ? <VolumeX className="h-3 w-3 opacity-40" />
                          : (
                            <span
                              className="inline-flex h-1.5 w-1.5 rounded-full"
                              style={{ background: 'var(--color-warroom-gold)', boxShadow: '0 0 6px rgba(179,144,62,0.8)' }}
                            />
                          )
                        }
                      </span>
                    </motion.button>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="border-t border-[color:var(--color-warroom-gold)]/10 px-4 py-2">
                <p className="text-[9px] uppercase tracking-[0.1em] text-[color:var(--color-warroom-smoke)]">
                  Settings saved automatically
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}