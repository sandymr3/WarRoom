'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { investorDisplayName } from '@/src/lib/helpers'
import type { Mentor, Leader, Investor } from '@/src/types'

interface CharacterGroupProps<T> {
  title: string
  subtitle: string
  items: T[]
  selected: string[]
  maxSelect: number
  onToggle: (id: string) => void
  renderBadge: (item: T) => string
  renderMeta: (item: T) => string
  accentColor: string
}

function CharacterGroup<T extends { id: string; name: string; avatar?: string }>({
  title,
  subtitle,
  items,
  selected,
  maxSelect,
  onToggle,
  renderBadge,
  renderMeta,
  accentColor,
}: CharacterGroupProps<T>) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display text-base font-semibold uppercase tracking-[0.16em] text-[color:var(--color-warroom-gold)]/90">
          {title}
        </h3>
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-foreground/55">
          {subtitle} — Select {maxSelect} ({selected.length}/{maxSelect})
        </p>
      </div>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.06 } },
        }}
      >
        {items.map((item) => {
          const isSelected = selected.includes(item.id)
          const isDisabled = !isSelected && selected.length >= maxSelect

          return (
            <motion.button
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 16, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1 },
              }}
              whileHover={!isDisabled ? { scale: 1.04, y: -2 } : undefined}
              whileTap={!isDisabled ? { scale: 0.97 } : undefined}
              onClick={() => !isDisabled && onToggle(item.id)}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-md border p-3 text-center backdrop-blur-sm transition-all duration-300',
                isSelected
                  ? 'border-[color:var(--color-warroom-gold)]/65 bg-[color:var(--color-warroom-obsidian)]/65 shadow-md'
                  : 'border-[color:var(--color-warroom-gold)]/15 bg-card/60 hover:border-[color:var(--color-warroom-gold)]/45',
                isDisabled && !isSelected && 'opacity-40 cursor-not-allowed'
              )}
              style={isSelected ? { boxShadow: `0 0 20px ${accentColor}40, 0 0 40px ${accentColor}15` } : undefined}
            >
              {/* Selection check — scale in/out */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[color:var(--color-warroom-gold)] flex items-center justify-center shadow-[0_0_12px_rgba(179,144,62,0.55)]"
                  >
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Avatar with glow ring */}
              <div className="relative">
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute -inset-1 rounded-full animate-pulse-ring"
                      style={{ backgroundColor: `${accentColor}30` }}
                    />
                  )}
                </AnimatePresence>
                <div className={cn(
                  "relative overflow-hidden h-12 w-12 rounded-full bg-muted flex items-center justify-center font-display text-lg font-bold border transition-all duration-300",
                  isSelected
                    ? "border-[color:var(--color-warroom-gold)] ring-2 ring-[color:var(--color-warroom-gold)]/35"
                    : "border-[color:var(--color-warroom-gold)]/20",
                )}>
                  {/* Initial is the base; the avatar overlays it and removes itself
                      on load error so a broken URL falls back to the initial. */}
                  <span aria-hidden>{investorDisplayName(item.name).charAt(0)}</span>
                  {item.avatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.avatar}
                      alt={investorDisplayName(item.name)}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                      className="absolute inset-0 h-full w-full rounded-full object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="font-display text-sm font-semibold leading-tight tracking-wide">
                  {investorDisplayName(item.name)}
                </div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-warroom-gold)]/85 font-semibold">
                  {renderBadge(item)}
                </div>
                <div className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                  {renderMeta(item)}
                </div>
              </div>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}

interface CharacterPickerProps {
  mentors: Mentor[]
  leaders: Leader[]
  investors: Investor[]
  initialMentors?: string[]
  initialLeaders?: string[]
  initialInvestors?: string[]
  onConfirm: (selected: { mentors: string[]; leaders: string[]; investors: string[] }) => void
  loading?: boolean
}

export function CharacterPicker({
  mentors,
  leaders,
  investors,
  initialMentors = [],
  initialLeaders = [],
  initialInvestors = [],
  onConfirm,
  loading = false,
}: CharacterPickerProps) {
  const [selMentors, setSelMentors] = useState<string[]>(initialMentors)
  const [selLeaders, setSelLeaders] = useState<string[]>(initialLeaders)
  const [selInvestors, setSelInvestors] = useState<string[]>(initialInvestors)

  const toggle = (list: string[], setList: (v: string[]) => void, max: number, id: string) => {
    if (list.includes(id)) {
      setList(list.filter((x) => x !== id))
    } else if (list.length < max) {
      setList([...list, id])
    }
  }

  const isComplete = selMentors.length === 2 && selLeaders.length === 2 && selInvestors.length === 7

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <CharacterGroup
        title="Mentors"
        subtitle="They provide guidance during assessments"
        items={mentors}
        selected={selMentors}
        maxSelect={2}
        onToggle={(id) => toggle(selMentors, setSelMentors, 2, id)}
        renderBadge={(m) => m.specialization}
        renderMeta={(m) => m.bio?.slice(0, 60) + (m.bio?.length > 60 ? '…' : '') || ''}
        accentColor="#7c5a9e"
      />

      <CharacterGroup
        title="Leaders"
        subtitle="They will question you between phases"
        items={leaders}
        selected={selLeaders}
        maxSelect={2}
        onToggle={(id) => toggle(selLeaders, setSelLeaders, 2, id)}
        renderBadge={(l) => l.specialization}
        renderMeta={(l) => l.bio?.slice(0, 60) + (l.bio?.length > 60 ? '…' : '') || ''}
        accentColor="#3d6b8e"
      />

      <CharacterGroup
        title="Investors"
        subtitle="They will evaluate your pitch in the War Room"
        items={investors}
        selected={selInvestors}
        maxSelect={7}
        onToggle={(id) => toggle(selInvestors, setSelInvestors, 7, id)}
        renderBadge={(i) => i.primary_lens}
        renderMeta={(i) => i.bio?.slice(0, 60) + (i.bio?.length > 60 ? '…' : '') || ''}
        accentColor="#10b981"
      />

      <motion.div
        animate={isComplete ? { scale: [1, 1.02, 1] } : {}}
        transition={isComplete ? { duration: 1.5, repeat: Infinity } : {}}
      >
        <Button
          className={cn("w-full transition-all duration-300", isComplete && "glow-button")}
          disabled={!isComplete || loading}
          onClick={() =>
            onConfirm({ mentors: selMentors, leaders: selLeaders, investors: selInvestors })
          }
        >
          {loading
            ? 'Setting up...'
            : isComplete
            ? 'Confirm Characters & Start'
            : `Select 2 Mentors, 2 Leaders, 7 Investors (${selMentors.length + selLeaders.length + selInvestors.length}/11)`}
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default CharacterPicker
