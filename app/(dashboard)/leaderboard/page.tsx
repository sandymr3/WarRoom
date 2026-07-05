'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Trophy, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LeaderboardPanel } from '@/src/components/LeaderboardPanel'
import { useLeaderboard } from '@/src/hooks/useLeaderboard'
import { useNarratorOnboarding } from '@/src/hooks/useNarratorOnboarding'
import { GoldDivider, SigilBadge, StoneCard } from '@/src/components/primitives'
import { easeDramatic } from '@/lib/animations/variants'
import { HouseBanner, RenownBar } from '@/src/components/progression'
import { useFounderProgression } from '@/src/hooks/useFounderProgression'

export default function LeaderboardPage() {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  const [user, setUser] = useState<{ name: string; id?: string } | null>(null)
  const [batch, setBatch] = useState<{ code: string; name: string } | null>(
    null,
  )

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
    const storedBatch = JSON.parse(localStorage.getItem('batch') || 'null')
    if (!storedUser) {
      router.push('/login')
      return
    }
    setUser(storedUser)
    setBatch(storedBatch)
  }, [router])

  const { entries, connected, updatedAt } = useLeaderboard(batch?.code)
  const { progression } = useFounderProgression()
  const myRank = entries.find((e) => e.userId === user?.id)?.rank

  useNarratorOnboarding('leaderboard', { enabled: false }) // narrator disabled: was mid-nav spam

  return (
    <div className="py-6 px-2 sm:px-0 max-w-3xl mx-auto w-full">
      {/* ── Header ── */}
      <motion.div
        className="mb-8"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeDramatic }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Trophy
              className="h-6 w-6 text-[color:var(--color-warroom-gold)]"
              aria-hidden
            />
            <h1
              className="text-xl font-semibold tracking-[0.04em]"
              style={{
                fontFamily: 'var(--font-display)',
                background:
                  'linear-gradient(135deg, var(--color-warroom-gold), var(--color-warroom-gold-bright))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              The Elo Ladder
            </h1>
          </div>

          {batch && (
            <SigilBadge tone="gold">
              {batch.code}
            </SigilBadge>
          )}
        </div>

        <GoldDivider variant="line" />
      </motion.div>

      {batch ? (
        <>
          {/* ── Batch info ── */}
          <motion.div
            className="mb-6 text-center"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45, ease: easeDramatic }}
          >
            <h2
              className="text-lg font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {batch.name || batch.code}
            </h2>
            <p
              className={cn(
                'text-xs mt-1.5 uppercase tracking-[0.14em]',
                connected
                  ? 'text-[color:var(--color-warroom-verdant)]'
                  : 'text-[color:var(--color-warroom-smoke)]',
              )}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {connected ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-warroom-verdant)] animate-pulse inline-block" />
                  Live updates active
                </span>
              ) : (
                'Reconnecting…'
              )}
            </p>
          </motion.div>

          {/* ── Your standing (House + rank + Renown) ── */}
          {progression && (
            <motion.div
              className="mb-6"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45, ease: easeDramatic }}
            >
              <StoneCard padding="md" texture="leather">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <HouseBanner
                    house={progression.house}
                    rank={progression.rank}
                    founderName={user?.name}
                    variant="compact"
                  />
                  {myRank && (
                    <div className="text-right">
                      <div
                        className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        Your Standing
                      </div>
                      <div
                        className="text-2xl font-bold text-[color:var(--color-warroom-gold-bright)]"
                        style={{ fontFamily: 'var(--font-data, var(--font-mono))' }}
                      >
                        #{myRank}
                      </div>
                    </div>
                  )}
                </div>
                <div className="my-3">
                  <GoldDivider variant="line" />
                </div>
                <RenownBar rank={progression.rank} renown={progression.renown} />
              </StoneCard>
            </motion.div>
          )}

          {/* ── Leaderboard ── */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: easeDramatic }}
          >
            <LeaderboardPanel
              entries={entries}
              currentUserId={user?.id}
              connected={connected}
              updatedAt={updatedAt}
              currentUserHouse={progression?.house}
              className="w-full min-h-[460px]"
            />
          </motion.div>

          {/* ── Footer note ── */}
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-[10px] text-center uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)] mt-5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Rankings are based on projected annual revenue from simulation decisions.
          </motion.p>
        </>
      ) : (
        /* ── Empty state (no batch) ── */
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: easeDramatic }}
        >
          <StoneCard className="py-16 text-center">
            <Crown
              className="h-10 w-10 mx-auto mb-4 text-[color:var(--color-warroom-ash)]"
              aria-hidden
            />
            <p
              className="text-sm text-[color:var(--color-warroom-smoke)] mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              No batch associated with your account.
            </p>
            <p
              className="text-xs text-[color:var(--color-warroom-smoke)]"
              style={{ fontFamily: 'var(--font-body, serif)' }}
            >
              Sign in with a batch code to see live rankings.
            </p>
          </StoneCard>
        </motion.div>
      )}
    </div>
  )
}
