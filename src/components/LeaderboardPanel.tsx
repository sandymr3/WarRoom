'use client'

import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/animations/variants'
import type { HouseConfig, LeaderboardEntry } from '@/src/types'
import { paletteById } from '@/src/lib/progression'
import { SigilCrest, iconForHouseSigil } from '@/src/components/progression/SigilCrest'

// ─── Props ──────────────────────────────────────────────────────────────────

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  connected?: boolean
  updatedAt?: string | null
  /** Current user's House — renders their crest on their own row. */
  currentUserHouse?: HouseConfig
  className?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}

/** Per-rank visual tokens for the top 3. */
const PODIUM: Record<
  number,
  {
    badge: string
    row: string
    revenue: string
    label: string
    Icon?: React.ComponentType<{ className?: string }>
  }
> = {
  0: {
    badge: 'text-[color:var(--color-warroom-gold-bright)]',
    row: 'bg-[color:var(--color-warroom-gold)]/[0.06]',
    revenue: 'text-[color:var(--color-warroom-gold-bright)]',
    label: '1st',
    Icon: Crown,
  },
  1: {
    badge: 'text-[color:var(--color-warroom-silver)]',
    row: 'bg-[color:var(--color-warroom-silver)]/[0.04]',
    revenue: 'text-[color:var(--color-warroom-silver)]',
    label: '2nd',
  },
  2: {
    badge: 'text-[color:var(--color-warroom-ember)]',
    row: 'bg-[color:var(--color-warroom-ember)]/[0.04]',
    revenue: 'text-[color:var(--color-warroom-ember)]',
    label: '3rd',
  },
}

// ─── Component ──────────────────────────────────────────────────────────────

export function LeaderboardPanel({
  entries,
  currentUserId,
  connected = false,
  updatedAt,
  currentUserHouse,
  className,
}: LeaderboardPanelProps) {
  const prefersReducedMotion = useReducedMotion()

  const myIndex = currentUserId
    ? entries.findIndex((e) => e.userId === currentUserId)
    : -1
  // The founder one rung above — the one to overtake.
  const rivalIndex = myIndex > 0 ? myIndex - 1 : -1
  const housePalette = currentUserHouse ? paletteById(currentUserHouse.paletteId) : null

  return (
    <div
      className={cn(
        'got-stone-card flex flex-col overflow-hidden',
        className,
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[color:var(--color-warroom-ash)]/30">
        <div className="flex items-center gap-2.5">
          <Crown
            className="h-4 w-4 text-[color:var(--color-warroom-gold)]"
            aria-hidden
          />
          <span
            className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--color-warroom-ivory)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Elo Ladder
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              connected
                ? 'bg-[color:var(--color-warroom-verdant)] animate-pulse'
                : 'bg-[color:var(--color-warroom-ash)]',
            )}
          />
          <span
            className={cn(
              'text-[10px] uppercase tracking-[0.14em]',
              connected
                ? 'text-[color:var(--color-warroom-verdant)]'
                : 'text-[color:var(--color-warroom-smoke)]',
            )}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* ── Entries ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {entries.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 gap-3"
            >
              <Crown className="h-8 w-8 text-[color:var(--color-warroom-ash)]" />
              <p
                className="text-xs text-[color:var(--color-warroom-smoke)] uppercase tracking-[0.14em]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Waiting for participants…
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={staggerContainer}
              initial={prefersReducedMotion ? false : 'hidden'}
              animate="show"
              className="divide-y divide-[color:var(--color-warroom-ash)]/20"
            >
              {entries.map((entry, idx) => {
                const podium = PODIUM[idx]
                const isMe = entry.userId === currentUserId
                const isRival = idx === rivalIndex
                // Gap from me up to the rival directly above.
                const gapToRival =
                  isMe && rivalIndex >= 0
                    ? entries[rivalIndex].revenueProjection - entry.revenueProjection
                    : null

                return (
                  <motion.div
                    key={entry.userId}
                    variants={staggerItem}
                    layout
                    className={cn(
                      'flex items-center gap-3 px-5 py-3 text-sm transition-colors',
                      podium?.row,
                      isRival && 'bg-[color:var(--color-warroom-crimson)]/[0.05]',
                      isMe &&
                        'border-l-2 border-l-[color:var(--color-warroom-gold)] bg-[color:var(--color-warroom-gold)]/[0.04]',
                    )}
                  >
                    {/* Rank badge */}
                    <div
                      className={cn(
                        'w-10 flex items-center gap-1 font-bold shrink-0',
                        podium?.badge ||
                          'text-[color:var(--color-warroom-smoke)]',
                      )}
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {podium?.Icon && (
                        <podium.Icon
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden
                        />
                      )}
                      <span className="text-xs tracking-[0.06em]">
                        {podium?.label ?? `#${idx + 1}`}
                      </span>
                    </div>

                    {/* Current user's House crest */}
                    {isMe && currentUserHouse && housePalette && (
                      <SigilCrest
                        icon={iconForHouseSigil(currentUserHouse.sigilId)}
                        size={24}
                        primary={housePalette.primary}
                        secondary={housePalette.secondary}
                        className="shrink-0"
                      />
                    )}

                    {/* Name + rival/gap meta */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          'truncate tracking-[0.03em]',
                          isMe
                            ? 'text-[color:var(--color-warroom-gold)] font-semibold'
                            : 'text-[color:var(--color-warroom-ivory)]',
                        )}
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {entry.name}
                        {isMe && (
                          <span className="ml-1.5 text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-warroom-gold)]/70">
                            (you)
                          </span>
                        )}
                        {isRival && (
                          <span className="ml-1.5 text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-warroom-crimson-bright)]/80">
                            · your rival
                          </span>
                        )}
                      </div>
                      {isMe && (
                        <div
                          className="mt-0.5 truncate text-[10px] tracking-[0.04em] text-[color:var(--color-warroom-smoke)]"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {gapToRival != null && gapToRival > 0
                            ? `↑ ${formatRevenue(gapToRival)} to overtake ${entries[rivalIndex].name}`
                            : 'You hold the top of the realm'}
                        </div>
                      )}
                    </div>

                    {/* Revenue */}
                    <div
                      className={cn(
                        'font-semibold tabular-nums shrink-0',
                        podium?.revenue ||
                          'text-[color:var(--color-warroom-ivory)]',
                      )}
                      style={{
                        fontFamily: 'var(--font-data, var(--font-mono))',
                      }}
                    >
                      {formatRevenue(entry.revenueProjection)}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      {updatedAt && (
        <div
          className="px-5 py-2 text-[10px] tracking-[0.08em] text-[color:var(--color-warroom-smoke)] border-t border-[color:var(--color-warroom-ash)]/20 text-right"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Updated {new Date(updatedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

export default LeaderboardPanel
