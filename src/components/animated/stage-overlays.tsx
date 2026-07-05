'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmberParticles } from '@/src/components/effects/EmberParticles'
import { useTypewriterReveal } from '@/src/hooks/useTypewriterReveal'
import { useFeatureIntro } from '@/src/hooks/useFeatureIntro'
import { useNarratorStore } from '@/src/state/narratorStore'

// ============================================
// CINEMA OVERLAY — Full-screen dramatic transition
// ============================================

interface CinemaOverlayProps {
  show: boolean
  icon?: React.ReactNode
  title?: string
  subtitle?: string
}

export function CinemaOverlay({ show, icon, title, subtitle }: CinemaOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 backdrop-blur-xl flex flex-col items-center justify-center gap-5"
          style={{ background: 'radial-gradient(ellipse at center, rgba(10,8,6,0.97), rgba(5,4,3,0.99))' }}
        >
          {/* Ambient embers */}
          <EmberParticles density={12} speed={0.7} />
          {icon && (
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
              {icon}
            </motion.div>
          )}
          {title && (
            <motion.h2
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              style={{ fontFamily: "var(--font-got), Georgia, serif", fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.06em', color: '#b3903e', textShadow: '0 0 30px rgba(179,144,62,0.5)' }}
            >
              {title}
            </motion.h2>
          )}
          {subtitle && (
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
              style={{ fontSize: '0.8rem', color: '#8c8075', letterSpacing: '0.06em' }}
            >
              {subtitle}
            </motion.p>
          )}
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 1.5, ease: 'easeInOut' }}
            style={{ width: 200, height: 1, background: 'linear-gradient(90deg, transparent, #b3903e, transparent)', transformOrigin: 'center' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// STAGE NARRATION OVERLAY
// ============================================

interface StageNarrationData {
  month: string
  title: string
  desc: string
}

interface StageNarrationOverlayProps {
  show: boolean
  data: StageNarrationData
  stageIndex: number
  totalStages: number
  stageLabels: string[]
  accentColor?: string
  onDismiss: () => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function StageNarrationOverlay({ show, data, stageIndex, totalStages: _totalStages, stageLabels, accentColor = '#b3903e', onDismiss }: StageNarrationOverlayProps) {
  useEffect(() => {
    if (!show) return
    const timer = setTimeout(onDismiss, 6000)
    return () => clearTimeout(timer)
  }, [show, onDismiss])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[70] flex items-center justify-center cursor-pointer"
          style={{ background: 'radial-gradient(ellipse at center, rgba(10,8,6,0.97) 0%, rgba(5,4,3,0.99) 100%)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ delay: 0.1, duration: 0.45, ease: 'easeOut' }}
            className="relative w-full h-full flex flex-col justify-center items-center px-5 py-7 sm:px-8 sm:py-9 text-center overflow-hidden"
            style={{
              background: `linear-gradient(145deg, hsl(var(--background) / 0.58), ${accentColor}14)`,
              boxShadow: `0 30px 70px -45px ${accentColor}`,
              backdropFilter: 'blur(18px)',
            }}
            onClick={onDismiss}
          >
            <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 20% 15%, ${accentColor}22, transparent 55%)` }} />
            <div className="relative flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-extrabold tracking-[0.15em] uppercase mb-6 border"
                style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30`, color: accentColor }}
              >
                {data.month}
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="text-3xl sm:text-5xl font-black tracking-tight mb-3"
                style={{ color: accentColor }}
              >
                {data.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.5 }}
                className="text-muted-foreground max-w-xl leading-relaxed text-sm sm:text-base"
              >
                {data.desc}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                className="flex items-center gap-0 w-full max-w-xl mt-8"
              >
                {stageLabels.map((label, i) => (
                  <React.Fragment key={i}>
                    <div
                      className={cn('w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all duration-300', i === stageIndex ? 'scale-125' : '', i < stageIndex ? 'bg-emerald-500 border-emerald-500' : i === stageIndex ? 'border-[var(--active-color)] bg-[var(--active-color)]' : 'border-muted-foreground/20 bg-muted/30')}
                      style={{ '--active-color': accentColor } as React.CSSProperties}
                      title={label}
                    />
                    {i < stageLabels.length - 1 && <div className={cn('flex-1 h-0.5', i < stageIndex ? 'bg-emerald-500' : 'bg-muted-foreground/10')} />}
                  </React.Fragment>
                ))}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="flex justify-between w-full max-w-xl mt-1.5 px-0">
                {stageLabels.map((label, i) => (
                  <span key={i} className={cn('text-[8px] font-bold tracking-wider', i === stageIndex ? 'text-foreground' : i < stageIndex ? 'text-emerald-500/50' : 'text-muted-foreground/30')} style={i === stageIndex ? { color: accentColor } : undefined}>
                    {label}
                  </span>
                ))}
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="text-xs text-muted-foreground/50 mt-8 tracking-wide">
                Click anywhere or wait to continue...
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// SNAPSHOT DASHBOARD — Post-Stage Performance
// ============================================

interface SnapshotEntry {
  name: string
  score: number
  isUser: boolean
}

interface SnapshotNextStage {
  month: string
  title: string
  desc: string
  /** Fail-soft narrator voiceover for this next-stage line. */
  voiceUrl?: string
}

interface SnapshotDashboardProps {
  show: boolean
  revenue: number
  previousRevenue?: number
  leaderboardEntries: SnapshotEntry[]
  currentUserId?: string
  stageName: string
  /** The stage the founder is about to enter — the Oracle previews it. */
  nextStage?: SnapshotNextStage
  budgetAllocations?: Record<string, number>
  capital?: number
  onContinue: () => void
}

function fmtRev(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toLocaleString()}`
}

// ── Middle column: the Oracle previewing the next month / stage / goal.
// Mounted only while the snapshot is open so its typewriter + voiceover
// fire fresh on each reveal.
function SnapshotNextStagePanel({ nextStage }: { nextStage?: SnapshotNextStage }) {
  const goal = nextStage?.desc ?? 'The next trial awaits, lord. Steel yourself.'
  const { revealedText, isComplete } = useTypewriterReveal(goal, { charDelayMs: 24 })

  useEffect(() => {
    const url = nextStage?.voiceUrl
    if (!url) return
    if (useNarratorStore.getState().isMuted) return
    const audio = new Audio(url)
    audio.volume = 0.85
    void audio.play().catch(() => { /* gated by browser autoplay */ })
    return () => { try { audio.pause() } catch { /* ignore */ } }
  }, [nextStage?.voiceUrl])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative flex flex-col items-center overflow-hidden rounded-2xl border p-5 text-center"
      style={{
        borderColor: 'rgba(179,144,62,0.3)',
        background: 'linear-gradient(160deg, rgba(179,144,62,0.07), transparent 55%), rgba(14,11,8,0.6)',
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 20%, rgba(179,144,62,0.14), transparent 60%)' }} />

      {/* Oracle orb */}
      <motion.div
        animate={{ scale: [1, 1.06, 1], boxShadow: ['0 0 24px rgba(179,144,62,0.35)', '0 0 38px rgba(179,144,62,0.55)', '0 0 24px rgba(179,144,62,0.35)'] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
        className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'radial-gradient(circle at 50% 35%, #f6e6b0, #b3903e 55%, #7a5e12)', border: '1px solid rgba(179,144,62,0.6)' }}
      >
        <span className="text-2xl" aria-hidden>🜂</span>
      </motion.div>

      <p className="relative z-10 mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">The Oracle Foretells</p>

      {nextStage && (
        <span
          className="relative z-10 mt-2 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em]"
          style={{ background: 'rgba(179,144,62,0.12)', border: '1px solid rgba(179,144,62,0.3)', color: '#b3903e' }}
        >
          {nextStage.month}
        </span>
      )}

      <h4
        className="relative z-10 mt-2 text-2xl font-black tracking-tight"
        style={{ color: '#e8d49a', fontFamily: "var(--font-got), Georgia, serif" }}
      >
        {nextStage?.title ?? 'The Next Round'}
      </h4>

      <p className="relative z-10 mt-2 min-h-[3.5rem] text-sm leading-relaxed text-foreground/75">
        {revealedText}
        {!isComplete && <span className="ml-0.5 inline-block w-1.5 animate-pulse" style={{ color: '#b3903e' }}>▍</span>}
      </p>
    </motion.div>
  )
}

export function SnapshotDashboard({ show, revenue, previousRevenue, leaderboardEntries, stageName, nextStage, budgetAllocations, capital, onContinue }: SnapshotDashboardProps) {
  const revChange = previousRevenue && previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue * 100) : 0
  const isPositive = revChange >= 0
  const continueIntro = useFeatureIntro('snapshot-continue')

  const allocations = budgetAllocations ? Object.entries(budgetAllocations).filter(([, v]) => Number(v) > 0) : []
  const allocated = allocations.reduce((sum, [, v]) => sum + Number(v), 0)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[65] bg-background/95 backdrop-blur-xl flex items-center justify-center overflow-y-auto p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 22 }}
            className="my-auto w-full max-w-5xl"
          >
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-3"
              style={{ background: 'rgba(179,144,62,0.08)', border: '1px solid rgba(179,144,62,0.3)', color: '#b3903e', borderRadius: '2px', fontFamily: "var(--font-got), Georgia, serif", letterSpacing: '0.15em' }}>
              ⚔ Stage Complete ⚔
              </div>
              <h3 className="text-xl font-bold">{stageName}</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.1fr_1fr] lg:items-stretch">
              {/* ── LEFT: results + capital allocation ── */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-4"
              >
                <div className={cn('rounded-2xl border p-5 text-center bg-card', isPositive ? 'border-emerald-500/30' : 'border-red-500/30')}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Revenue Projection</p>
                  <div className={cn('text-3xl font-black font-mono', isPositive ? 'text-emerald-500' : 'text-red-500')}>{fmtRev(revenue)}</div>
                  {previousRevenue !== undefined && previousRevenue > 0 && (
                    <div className={cn('flex items-center justify-center gap-1 mt-2 text-sm font-semibold', isPositive ? 'text-emerald-500' : 'text-red-500')}>
                      <span>{isPositive ? 'UP' : 'DOWN'}</span>
                      <span>{isPositive ? '+' : ''}{revChange.toFixed(1)}% from last stage</span>
                    </div>
                  )}
                </div>

                {(allocations.length > 0 || capital !== undefined) && (
                  <div className="rounded-2xl border bg-card p-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Capital Allocation</p>
                    {capital !== undefined && (
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="uppercase tracking-wider text-muted-foreground">War Chest</span>
                        <span className="font-mono font-bold" style={{ color: '#b3903e' }}>{fmtRev(Math.max(0, capital - allocated))}</span>
                      </div>
                    )}
                    {allocations.length > 0 ? (
                      <div className="space-y-1.5">
                        {allocations.map(([label, amount]) => (
                          <div key={label} className="flex items-center justify-between text-[11px]">
                            <span className="mr-2 truncate font-medium uppercase text-muted-foreground">{label}</span>
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono">{fmtRev(Number(amount))}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] italic text-muted-foreground">No capital deployed this stage.</p>
                    )}
                  </div>
                )}
              </motion.div>

              {/* ── MIDDLE: Oracle previews the next stage ── */}
              <SnapshotNextStagePanel nextStage={nextStage} />

              {/* ── RIGHT: live leaderboard ── */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border bg-card p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Leaderboard</p>
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>
                {leaderboardEntries.length > 0 ? (
                  <div className="space-y-1">
                    {leaderboardEntries.slice(0, 6).map((entry, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                        className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm', entry.isUser ? 'bg-primary/5 border border-primary/20' : '')}
                      >
                        <span className="w-6 text-center font-bold text-xs" style={{ color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : undefined }}>
                          {i < 3 ? ['1st', '2nd', '3rd'][i] : `#${i + 1}`}
                        </span>
                        <span className="flex-1 truncate">
                          {entry.name}
                          {entry.isUser && <span className="ml-1 text-[10px] text-primary font-bold">(YOU)</span>}
                        </span>
                        <span className="font-mono text-xs font-bold text-muted-foreground">{entry.score.toFixed(0)}</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] italic text-muted-foreground">Join a batch to see live rankings.</p>
                )}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex justify-center mt-6">
              <motion.button
                {...continueIntro}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onContinue}
                style={{ background: 'linear-gradient(135deg, #b8891e, #b3903e)', color: '#0a0806', border: '1px solid rgba(179,144,62,0.5)', borderRadius: '3px', padding: '10px 28px', fontFamily: "var(--font-got), Georgia, serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: '0 4px 20px rgba(179,144,62,0.3)', cursor: 'pointer' }}
              >
                Continue →
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// MENTOR TIP POPUP
// ============================================

interface MentorTipPopupProps {
  show: boolean
  message: string
  emoji?: string
  onDismiss: () => void
  onAskMentor?: () => void
}

export function MentorTipPopup({ show, message, emoji = 'TIP', onDismiss, onAskMentor }: MentorTipPopupProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed bottom-24 right-6 z-[55] max-w-xs"
        >
          <div className="relative p-4 shadow-xl" style={{ background: 'rgba(17,14,10,0.95)', border: '1px solid rgba(179,144,62,0.2)', borderRadius: '4px', backdropFilter: 'blur(16px)' }}>
            <button onClick={onDismiss} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-all">✕</button>
            <div className="flex items-start gap-3 pr-4">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="h-10 w-10 flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(179,144,62,0.1)', border: '1px solid rgba(179,144,62,0.25)', borderRadius: '50%' }}
              >
                {emoji}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#b3903e', fontFamily: "var(--font-got), Georgia, serif", letterSpacing: '0.15em' }}><ScrollText className="h-3 w-3" />Second's Note</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{message}</p>
              </div>
            </div>
            {onAskMentor && (
              <button onClick={() => { onDismiss(); onAskMentor() }} className="mt-3 w-full py-2 text-xs font-bold transition-all" style={{ background: 'rgba(179,144,62,0.08)', border: '1px solid rgba(179,144,62,0.25)', color: '#b3903e', borderRadius: '2px', fontFamily: "var(--font-got), Georgia, serif", letterSpacing: '0.08em' }}>
                Use a Mentor Lifeline
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
