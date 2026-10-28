'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { LeaderboardPanel } from '@/src/components/LeaderboardPanel'
import { useLeaderboard } from '@/src/hooks/useLeaderboard'
import {
  ArrowRight,
  CheckCircle2,
  Plus,
  Sparkles,
  Swords,
  Crown,
  Coins,
  Award,
  ScrollText,
  Target,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/src/lib/api'
import { signOutUser } from '@/src/lib/firebase'
import { useAuth } from '@/src/context/AuthContext'
import type { Assessment } from '@/src/types'
import { STAGE_NARRATIVES } from '@/src/lib/constants'
import { FadeInUp } from '@/src/components/AnimatedComponents'
import {
  ChessboardCTA,
  StoneCard,
  GoldDivider,
  SigilBadge,
} from '@/src/components/primitives'
import { CampaignMap } from '@/src/components/dashboard/CampaignMap'
import { StatTile } from '@/src/components/dashboard/StatTile'
import { audioManager } from '@/lib/audio/audioManager'
import { useNarratorOnboarding } from '@/src/hooks/useNarratorOnboarding'
import { useFeatureIntro } from '@/src/hooks/useFeatureIntro'
import { useFounderProgression } from '@/src/hooks/useFounderProgression'
import {
  RenownBar,
  HouseBanner,
  HearthFlame,
  CompetencyConstellation,
  SigilCrest,
  iconForSigil,
  SigilUnlockOverlay,
} from '@/src/components/progression'
import { useNewSigils } from '@/src/hooks/useNewSigils'
import {
  SIGIL_TIER_COLOR,
  sigilById,
  COMPETENCY_META,
  CATEGORY_TIER,
} from '@/src/lib/progression'
import { LoreTip } from '@/src/components/common/LoreTip'
import { LORE } from '@/src/lib/lore'

interface AssessmentWithRevenue extends Assessment {
  revenueProjection?: number
}

function stageLabel(stageName: string): string {
  return (
    STAGE_NARRATIVES[stageName]?.title ??
    stageName
      .replace('STAGE_', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toLocaleString('en-US')}`
}

export default function DashboardPage() {
  const router = useRouter()
  const [simulations, setSimulations] = useState<AssessmentWithRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{
    name: string
    email: string
    batchCode?: string
    id?: string
  } | null>(null)
  const [batch, setBatch] = useState<{ code: string; name: string } | null>(null)

  const { entries, connected, updatedAt } = useLeaderboard(batch?.code)
  const { progression } = useFounderProgression()
  const { newSigils, acknowledge: acknowledgeSigils } = useNewSigils(progression?.sigils)
  useNarratorOnboarding('great-hall', { delayMs: 1800 })
  const beginIntro = useFeatureIntro('dashboard-begin', { elementId: 'dashboard-begin-cta' })
  const { refresh } = useAuth()
  const [paymentNotice, setPaymentNotice] = useState<{
    tone: 'success' | 'info' | 'error'
    text: string
  } | null>(null)
  const paymentHandled = useRef(false)

  // Return from Stripe Checkout: credit the attempt, refresh the cached profile so
  // requiresPayment clears, then strip the payment params from the URL.
  useEffect(() => {
    if (paymentHandled.current) return
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    if (!payment) return
    paymentHandled.current = true
    const sessionId = params.get('session_id')
    params.delete('payment')
    params.delete('session_id')
    const qs = params.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)

    if (payment === 'cancelled') {
      setPaymentNotice({ tone: 'info', text: 'Payment cancelled — you can pay whenever you are ready to start a war room.' })
      return
    }
    if (payment !== 'success' || !sessionId) return
    api.payments
      .confirm(sessionId)
      .then(async ({ attemptCredits }) => {
        try {
          const p = await refresh()
          setUser(p)
        } catch {
          /* cached profile stays; the next sync will catch up */
        }
        setPaymentNotice({
          tone: 'success',
          text: `Payment received — you have ${attemptCredits} war room attempt${attemptCredits === 1 ? '' : 's'} ready.`,
        })
      })
      .catch(() =>
        setPaymentNotice({
          tone: 'error',
          text: 'We could not confirm your payment yet. If you were charged, refresh in a moment or contact support.',
        }),
      )
  }, [refresh])

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
    const storedBatch = JSON.parse(localStorage.getItem('batch') || 'null')
    if (!storedUser) {
      router.push('/login')
      return
    }
    setUser(storedUser)
    setBatch(storedBatch)

    api.assessments
      .list()
      .then((list) => setSimulations(list as AssessmentWithRevenue[]))
      .catch(() => setSimulations([]))
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = async () => {
    await signOutUser()
    router.push('/login')
  }

  const activeAssessments = useMemo(
    () =>
      simulations.filter(
        (a) => a.status === 'IN_PROGRESS' || a.status === 'NOT_STARTED',
      ),
    [simulations],
  )
  const completedAssessments = useMemo(
    () => simulations.filter((a) => a.status === 'COMPLETED'),
    [simulations],
  )

  const currentSim = activeAssessments[0]

  const stats = useMemo(() => {
    const completed = completedAssessments.length
    const bestRevenue = simulations.reduce(
      (acc, a) => Math.max(acc, a.revenueProjection ?? 0),
      0,
    )
    const myRankEntry = entries.find((e) => e.isCurrentUser)
    return {
      completed,
      bestRevenue,
      rank: myRankEntry?.rank ?? null,
      attempts: simulations.length,
    }
  }, [completedAssessments, simulations, entries])

  // Earned emblems, newest first.
  const earnedEmblems = useMemo(
    () =>
      [...(progression?.sigils ?? [])].sort(
        (a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime(),
      ),
    [progression],
  )

  // A single, clear "what to do next" recommendation (comprehension/wayfinding).
  const nextObjective = useMemo(() => {
    if (currentSim) {
      return {
        title: 'Resume your trial',
        detail: `You stand at ${stageLabel(currentSim.currentStage)}. Return and press your advantage.`,
      }
    }
    if (completedAssessments.length === 0) {
      return {
        title: 'Begin your first trial',
        detail: 'Step into the chamber and light your first competency.',
      }
    }
    const mastery = progression?.competencyMastery ?? {}
    let weakestName: string | null = null
    let lowest = Infinity
    for (const c of COMPETENCY_META) {
      const m = mastery[c.code]
      const tier = m ? CATEGORY_TIER[m.category] : 0
      if (tier < lowest) {
        lowest = tier
        weakestName = c.name
      }
    }
    return {
      title: 'Begin a new trial',
      detail: weakestName
        ? `Your thinnest banner is ${weakestName}. A fresh trial is your chance to raise it.`
        : 'A new trial raises your Rating and sharpens your record.',
    }
  }, [currentSim, completedAssessments.length, progression])

  const firstName = user?.name?.split(' ')[0] ?? 'Player'
  const primaryCtaLabel = currentSim
    ? currentSim.status === 'IN_PROGRESS'
      ? 'Resume Your Trial'
      : 'Begin Your Trial'
    : 'Begin the Trial'

  const handlePrimaryCta = () => {
    audioManager.playSfx('nav.door-open')
    if (currentSim) {
      router.push(`/assessment/${currentSim.id}`)
    } else {
      router.push('/assessment/new')
    }
  }

  return (
    <div className="min-h-screen relative bg-transparent">
      {/* Soft torch glow overhead */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-96 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,200,200,0.07), transparent 70%)',
        }}
      />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 border-b backdrop-blur-md bg-[color:var(--color-chessboard-void)]/90 border-[color:var(--color-chessboard-ash)]/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-sm flex items-center justify-center text-[10px] font-bold tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #a0a0a0, #e0e0e0, #a0a0a0)',
                color: '#0a0805',
                fontFamily: 'var(--font-display)',
                boxShadow: '0 0 14px rgba(200,200,200,0.3)',
              }}
            >
              {user?.name?.substring(0, 2).toUpperCase() || 'KK'}
            </div>
            <div className="leading-tight">
              <div
                className="font-semibold text-sm text-[color:var(--color-chessboard-ghost)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {user?.name || 'Loading...'}
              </div>
              {batch && (
                <div className="flex items-center gap-2 -mt-0.5">
                  <Badge
                    variant="outline"
                    className="text-[9px] uppercase tracking-[0.18em] h-5 px-1.5 border-[color:var(--color-chessboard-silver)]/30 text-[color:var(--color-chessboard-silver)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {batch.code}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile">
              <button
                type="button"
                className="px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-chessboard-silver)] hover:text-[color:var(--color-chessboard-ghost)] transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Player Profile
              </button>
            </Link>
            <Link href="/leaderboard">
              <button
                type="button"
                className="px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-chessboard-silver)] hover:text-[color:var(--color-chessboard-ghost)] transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Elo Ladder
              </button>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-chessboard-smoke)] hover:text-[color:var(--color-chessboard-ivory)] transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {paymentNotice && (
              <div
                role="status"
                className={cn(
                  'flex items-start justify-between gap-3 rounded-[3px] border p-4 text-sm',
                  paymentNotice.tone === 'success' &&
                    'border-[color:var(--color-chessboard-verdant)]/40 bg-[color:var(--color-chessboard-verdant)]/[0.08] text-[color:var(--color-chessboard-verdant)]',
                  paymentNotice.tone === 'info' &&
                    'border-[color:var(--color-chessboard-silver)]/30 bg-[color:var(--color-chessboard-silver)]/[0.06] text-[color:var(--color-chessboard-ghost)]',
                  paymentNotice.tone === 'error' &&
                    'border-[color:var(--color-chessboard-crimson)]/40 bg-[color:var(--color-chessboard-crimson)]/[0.08] text-[color:var(--color-chessboard-crimson-bright)]',
                )}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span className="flex items-start gap-2">
                  {paymentNotice.tone === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                  {paymentNotice.text}
                </span>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => setPaymentNotice(null)}
                  className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Welcome banner */}
            <FadeInUp>
              <div className="space-y-5">
                <SigilBadge icon={Sparkles} tone="gold">
                  The Dashboard
                </SigilBadge>
                <h1
                  className="text-3xl sm:text-4xl font-bold tracking-[0.02em] text-[color:var(--color-chessboard-ghost)]"
                  style={{ fontFamily: 'var(--font-display)', lineHeight: 1.1 }}
                >
                  Welcome back,{' '}
                  <span
                    style={{
                      background:
                        'linear-gradient(135deg, var(--color-chessboard-gold), var(--color-chessboard-gold-bright), var(--color-chessboard-gold))',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {firstName}
                  </span>
                </h1>
                <p
                  className="text-[color:var(--color-chessboard-smoke)] max-w-xl"
                  style={{
                    fontFamily: 'var(--font-body, var(--font-display))',
                    fontSize: '1rem',
                    lineHeight: 1.7,
                  }}
                >
                  {batch
                    ? `The ${batch.name || batch.code} panel awaits your next move.`
                    : 'The domain is quiet. When you are ready, the trial begins.'}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <div {...beginIntro}>
                    <ChessboardCTA
                      size="lg"
                      variant="primary"
                      icon={Swords}
                      iconRight={ArrowRight}
                      sfxKey="nav.door-open"
                      onClick={handlePrimaryCta}
                    >
                      {primaryCtaLabel}
                    </ChessboardCTA>
                  </div>
                  {currentSim && (
                    <span
                      className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-chessboard-smoke)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Currently at: {stageLabel(currentSim.currentStage)}
                    </span>
                  )}
                </div>
              </div>
            </FadeInUp>

            {/* Founder progression banner — Club, rank, rating, streak */}
            {progression && (
              <FadeInUp delay={0.08}>
                <StoneCard padding="md" texture="leather">
                  <div id="dashboard-club" className="flex flex-wrap items-center justify-between gap-4">
                    <HouseBanner
                      house={progression.house}
                      rank={progression.rank}
                      founderName={user?.name}
                      variant="compact"
                    />
                    <HearthFlame streak={progression.streak} />
                  </div>
                  <div className="my-4">
                    <GoldDivider variant="line" />
                  </div>
                  <div id="dashboard-rating">
                    <RenownBar rank={progression.rank} rating={progression.rating} />
                  </div>
                </StoneCard>
              </FadeInUp>
            )}

            {/* Constellation + next objective */}
            {progression && (
              <FadeInUp delay={0.12}>
                <div className="grid gap-4 md:grid-cols-2">
                  <StoneCard id="dashboard-constellation" padding="md">
                    <SigilBadge icon={Sparkles} tone="gold">
                      <LoreTip tip={LORE.constellation}>Your Constellation</LoreTip>
                    </SigilBadge>
                    <div className="mt-3 flex justify-center">
                      <CompetencyConstellation
                        mastery={progression.competencyMastery}
                        size={240}
                        interactive
                      />
                    </div>
                  </StoneCard>
                  <StoneCard padding="md" className="flex flex-col">
                    <SigilBadge icon={Target} tone="crimson">
                      Next Objective
                    </SigilBadge>
                    <h3
                      className="mt-3 text-lg font-semibold text-[color:var(--color-chessboard-ghost)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {nextObjective.title}
                    </h3>
                    <p
                      className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--color-chessboard-smoke)]"
                      style={{ fontFamily: 'var(--font-body, var(--font-display))' }}
                    >
                      {nextObjective.detail}
                    </p>
                    <div className="mt-4">
                      <ChessboardCTA
                        size="sm"
                        variant="primary"
                        icon={Swords}
                        iconRight={ArrowRight}
                        sfxKey="nav.door-open"
                        onClick={handlePrimaryCta}
                      >
                        {primaryCtaLabel}
                      </ChessboardCTA>
                    </div>
                  </StoneCard>
                </div>
              </FadeInUp>
            )}

            {/* Stat tiles */}
            <FadeInUp delay={0.16}>
              <div className="grid grid-cols-2 gap-4">
                <StatTile
                  label="Trials Complete"
                  value={stats.completed}
                  icon={CheckCircle2}
                  accent="var(--color-chessboard-verdant)"
                  hint={stats.attempts > 0 ? `${stats.attempts} attempt${stats.attempts === 1 ? '' : 's'}` : 'No attempts yet'}
                />
                <StatTile
                  label="Best Projection"
                  value={stats.bestRevenue > 0 ? formatRevenue(stats.bestRevenue) : '—'}
                  icon={Coins}
                  accent="var(--color-chessboard-gold)"
                  hint={stats.bestRevenue > 0 ? 'Annual revenue' : 'Finish a trial to record'}
                />
                <StatTile
                  label={<LoreTip tip={LORE.ranking}>Rank in the Domain</LoreTip>}
                  value={stats.rank ? `#${stats.rank}` : '—'}
                  icon={Award}
                  accent={stats.rank && stats.rank <= 3 ? 'var(--color-chessboard-crimson-bright)' : 'var(--color-chessboard-gold)'}
                  hint={batch ? batch.code : 'Join a cohort to rank'}
                />
                <StatTile
                  label={<LoreTip tip={LORE.founderRank}>Founder Rank</LoreTip>}
                  value={
                    <span
                      className="text-base tracking-[0.04em] text-[color:var(--color-chessboard-ivory)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {progression ? progression.rank.title : '—'}
                    </span>
                  }
                  icon={Crown}
                  accent="var(--color-chessboard-gold)"
                  hint={progression ? `${progression.rating.toLocaleString()} Rating` : 'Begin to earn Rating'}
                />
              </div>
            </FadeInUp>

            {/* Recently earned emblems */}
            {progression && earnedEmblems.length > 0 && (
              <FadeInUp delay={0.2}>
                <div id="dashboard-emblems" className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <SigilBadge icon={Award} tone="gold">
                      Emblems Earned ({earnedEmblems.length})
                    </SigilBadge>
                    <Link
                      href="/profile"
                      className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-chessboard-gold)] hover:text-[color:var(--color-chessboard-gold-bright)] transition-colors"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      The Founder&apos;s Record →
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {earnedEmblems.slice(0, 6).map((s) => {
                      const def = sigilById(s.id)
                      const style = SIGIL_TIER_COLOR[s.tier]
                      return (
                        <div key={s.id} className="flex flex-col items-center gap-1" style={{ width: 64 }}>
                          <SigilCrest
                            icon={iconForSigil(s.id)}
                            size={48}
                            primary={style.base}
                            secondary={style.bright}
                            iconColor={style.bright}
                            title={def ? `${def.name} — ${def.description}` : s.id}
                          />
                          <span
                            className="text-center text-[9px] uppercase tracking-[0.08em] text-[color:var(--color-chessboard-smoke)]"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {def?.name ?? s.id}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </FadeInUp>
            )}

            {/* Campaign map (only when a trial is in motion) */}
            {currentSim && (
              <FadeInUp delay={0.15}>
                <StoneCard padding="md" texture="leather">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <SigilBadge tone="crimson">Active Campaign</SigilBadge>
                    <span
                      className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-chessboard-smoke)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {STAGE_NARRATIVES[currentSim.currentStage]?.month ?? ''}
                    </span>
                  </div>
                  <CampaignMap currentStage={currentSim.currentStage} />
                </StoneCard>
              </FadeInUp>
            )}

            {/* Other in-progress assessments (excluding the primary one shown above) */}
            {!loading && activeAssessments.length > 1 && (
              <FadeInUp delay={0.2}>
                <div className="space-y-3">
                  <SigilBadge tone="gold">Other Campaigns in Motion</SigilBadge>
                  {activeAssessments.slice(1).map((a) => (
                    <StoneCard key={a.id} padding="md" interactive>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-sm font-semibold text-[color:var(--color-chessboard-ghost)]"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {stageLabel(a.currentStage)}
                          </div>
                          <div
                            className="text-xs text-[color:var(--color-chessboard-smoke)] mt-0.5"
                            style={{ fontFamily: 'var(--font-body, var(--font-display))' }}
                          >
                            Began {new Date(a.createdAt).toLocaleDateString()}
                            {a.revenueProjection && a.revenueProjection > 0 ? (
                              <>
                                {' • '}
                                <span className="text-[color:var(--color-chessboard-verdant)]">
                                  {formatRevenue(a.revenueProjection)} projected
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                        <ChessboardCTA
                          size="sm"
                          variant="ghost"
                          iconRight={ArrowRight}
                          sfxKey="ui.click"
                          onClick={() => router.push(`/assessment/${a.id}`)}
                        >
                          {a.status === 'IN_PROGRESS' ? 'Continue' : 'Begin'}
                        </ChessboardCTA>
                      </div>
                    </StoneCard>
                  ))}
                </div>
              </FadeInUp>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.25, 0.5, 0.25] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                    className="h-24 rounded-sm border border-[color:var(--color-chessboard-slate)]/40 bg-[color:var(--color-chessboard-stone)]/40"
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && activeAssessments.length === 0 && completedAssessments.length === 0 && (
              <FadeInUp delay={0.2}>
                <StoneCard className="py-12 text-center">
                  <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-sm border border-[color:var(--color-chessboard-gold)]/30 bg-[color:var(--color-chessboard-gold)]/[0.06]">
                    <Swords className="h-6 w-6 text-[color:var(--color-chessboard-gold)]" aria-hidden />
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2 text-[color:var(--color-chessboard-ghost)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    No Trials Begun
                  </h3>
                  <p
                    className="text-sm text-[color:var(--color-chessboard-smoke)] mb-5 max-w-md mx-auto"
                    style={{ fontFamily: 'var(--font-body, var(--font-display))' }}
                  >
                    Your war record is empty. Step into the chamber and stake your claim.
                  </p>
                  <ChessboardCTA
                    size="md"
                    variant="primary"
                    icon={Plus}
                    sfxKey="nav.door-open"
                    onClick={() => router.push('/assessment/new')}
                  >
                    Start Your First Trial
                  </ChessboardCTA>
                </StoneCard>
              </FadeInUp>
            )}

            {/* Completed Simulations */}
            {completedAssessments.length > 0 && (
              <div className="space-y-4">
                <GoldDivider variant="line" />
                <FadeInUp delay={0.3}>
                  <div className="flex items-center justify-between gap-3">
                    <SigilBadge icon={ScrollText} tone="gold">
                      Past Verdicts ({completedAssessments.length})
                    </SigilBadge>
                  </div>
                </FadeInUp>
                <div className="space-y-3">
                  {completedAssessments.map((a, idx) => (
                    <FadeInUp key={a.id} delay={0.35 + idx * 0.05}>
                      <StoneCard padding="md" interactive>
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-[color:var(--color-chessboard-verdant)] flex-shrink-0" aria-hidden />
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-sm font-medium text-[color:var(--color-chessboard-ivory)]"
                              style={{ fontFamily: 'var(--font-display)' }}
                            >
                              Trial sealed {new Date(a.completedAt || a.createdAt).toLocaleDateString()}
                            </div>
                            {a.revenueProjection && a.revenueProjection > 0 ? (
                              <div
                                className="text-xs text-[color:var(--color-chessboard-smoke)] mt-0.5"
                                style={{ fontFamily: 'var(--font-body, var(--font-display))' }}
                              >
                                Final ARR: {formatRevenue(a.revenueProjection)}
                              </div>
                            ) : null}
                          </div>
                          <Link href={`/results/${a.id}`} className="shrink-0">
                            <span
                              className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-chessboard-gold)] hover:text-[color:var(--color-chessboard-gold-bright)] transition-colors"
                              style={{ fontFamily: 'var(--font-display)' }}
                            >
                              View Verdict →
                            </span>
                          </Link>
                        </div>
                      </StoneCard>
                    </FadeInUp>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side rail: Elo Ladder */}
          <div className="space-y-6">
            <FadeInUp delay={0.2}>
              <div id="dashboard-leaderboard" className="space-y-4">
                <SigilBadge icon={ScrollText} tone="gold">
                  <LoreTip tip={LORE.ironRankings}>Elo Ladder</LoreTip>
                </SigilBadge>
                {batch ? (
                  <LeaderboardPanel
                    entries={entries}
                    currentUserId={user?.id}
                    connected={connected}
                    updatedAt={updatedAt}
                    currentUserClub={progression?.house}
                    className={cn('h-[520px]')}
                  />
                ) : (
                  <StoneCard className="py-10 text-center">
                    <p
                      className="text-sm text-[color:var(--color-chessboard-smoke)] mb-1"
                      style={{ fontFamily: 'var(--font-body, var(--font-display))' }}
                    >
                      The Rankings are sealed.
                    </p>
                    <p
                      className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-chessboard-smoke)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Join a cohort from the Rankings page to reveal the standings.
                    </p>
                  </StoneCard>
                )}
              </div>
            </FadeInUp>
          </div>
        </div>
      </div>

      {newSigils.length > 0 && (
        <SigilUnlockOverlay sigils={newSigils} onClose={acknowledgeSigils} />
      )}
    </div>
  )
}
