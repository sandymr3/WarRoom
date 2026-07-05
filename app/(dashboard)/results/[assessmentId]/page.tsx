'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  BarChart3,
  Trophy,
  Target,
  TrendingUp,
  Loader2,
  Play,
  Award,
  Star,
  Zap,
} from 'lucide-react'
import api from '@/src/lib/api'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import {
  StoneCard,
  WarRoomCTA,
  GoldDivider,
  SigilBadge,
} from '@/src/components/primitives'
import { StatTile } from '@/src/components/dashboard/StatTile'
import {
  staggerContainer,
  staggerItem,
  easeDramatic,
} from '@/lib/animations/variants'
import type {
  AssessmentState,
  CompetencyScore,
  EvaluationReport,
} from '@/src/types'

// ─── Constants ──────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  STAGE_NEG2_IDEATION: 'The Opening',
  STAGE_NEG1_VISION: 'Development',
  STAGE_0_COMMITMENT: 'The Castling',
  STAGE_1_VALIDATION: 'The Exchange',
  STAGE_2A_GROWTH: 'The Middlegame',
  STAGE_2B_EXPANSION: 'Seizing the Center',
  STAGE_3_SCALE: 'The Promotion',
  STAGE_WARROOM_PREP: 'The Adjournment',
  STAGE_4_WARROOM: 'The Grand Board',
}

const CATEGORY_TONES: Record<string, { label: string; text: string; bg: string; border: string }> = {
  NATURAL_DOMINANT: {
    label: 'Natural Dominant',
    text: 'text-[color:var(--color-warroom-gold-bright)]',
    bg: 'bg-[color:var(--color-warroom-gold)]/[0.08]',
    border: 'border-[color:var(--color-warroom-gold)]/30',
  },
  STRONG: {
    label: 'Strong',
    text: 'text-[color:var(--color-warroom-verdant)]',
    bg: 'bg-[color:var(--color-warroom-verdant)]/[0.10]',
    border: 'border-[color:var(--color-warroom-verdant)]/30',
  },
  FUNCTIONAL: {
    label: 'Functional',
    text: 'text-[color:var(--color-warroom-silver)]',
    bg: 'bg-[color:var(--color-warroom-silver)]/[0.08]',
    border: 'border-[color:var(--color-warroom-silver)]/30',
  },
  DEVELOPMENT_REQUIRED: {
    label: 'Development',
    text: 'text-[color:var(--color-warroom-ember)]',
    bg: 'bg-[color:var(--color-warroom-ember)]/[0.08]',
    border: 'border-[color:var(--color-warroom-ember)]/30',
  },
  HIGH_RISK: {
    label: 'High Risk',
    text: 'text-[color:var(--color-warroom-crimson-bright)]',
    bg: 'bg-[color:var(--color-warroom-crimson)]/[0.08]',
    border: 'border-[color:var(--color-warroom-crimson)]/30',
  },
}

const PROGRESS_CLASSES =
  'h-1.5 bg-[color:var(--color-warroom-rampart)] [&>div]:bg-[color:var(--color-warroom-gold)]'

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SimulationResultPage() {
  const params = useParams()
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const assessmentId = params?.assessmentId as string

  const [state, setState] = useState<AssessmentState | null>(null)
  const [report, setReport] = useState<EvaluationReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const assessmentData = await api.assessments.get(assessmentId)
      setState(assessmentData)

      try {
        const reportData = await api.assessments.getReport(assessmentId)
        setReport(reportData)
      } catch {
        // Report may not be ready yet
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        router.push('/login')
        return
      }
      setError(msg || 'Failed to load simulation results')
    } finally {
      setLoading(false)
    }
  }, [assessmentId, router])

  useEffect(() => {
    load()
  }, [load])

  // ── Loading ──

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[color:var(--color-warroom-gold)]" />
        <p
          className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Loading simulation results…
        </p>
      </div>
    )
  }

  // ── Error ──

  if (error || !state) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <p
          className="text-sm text-[color:var(--color-warroom-crimson-bright)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {error || 'Simulation not found'}
        </p>
        <WarRoomCTA
          size="sm"
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </WarRoomCTA>
      </div>
    )
  }

  // ── Derived data ──

  const simulation = (state as unknown as Record<string, unknown>).simulation ?? (state as unknown as Record<string, unknown>).assessment ?? state
  const sim = simulation as Record<string, unknown>
  const { competencies, progress } = state
  const isCompleted = sim.status === 'COMPLETED'
  const isInProgress = sim.status === 'IN_PROGRESS'

  const avgScore =
    competencies && competencies.length > 0
      ? Math.round(
          competencies.reduce(
            (sum: number, c: CompetencyScore) =>
              sum + (c.weightedAverage || 0),
            0,
          ) / competencies.length,
        )
      : 0

  const revenueProjection = (sim.revenueProjection as number) || 0

  function formatRev(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
    return `$${n}`
  }

  // ── Render ──

  return (
    <div className="py-6 max-w-5xl mx-auto px-2 sm:px-0 w-full space-y-8">
      {/* Header */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeDramatic }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <BarChart3
              className="h-6 w-6 text-[color:var(--color-warroom-gold)]"
              aria-hidden
            />
            <div>
              <h1
                className="text-xl font-semibold tracking-[0.04em] text-[color:var(--color-warroom-ivory)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Simulation Results
              </h1>
              <p
                className="text-xs text-[color:var(--color-warroom-smoke)]"
                style={{ fontFamily: 'var(--font-body, serif)' }}
              >
                {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : String((sim.status as string) || '')}
                {sim.startedAt
                  ? ` — Started ${new Date(sim.startedAt as string).toLocaleDateString()}`
                  : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SigilBadge
              tone={isCompleted ? 'gold' : 'crimson'}
              icon={isCompleted ? CheckCircle2 : Clock}
            >
              {isCompleted ? 'Complete' : String(sim.status || 'Active').replace(/_/g, ' ')}
            </SigilBadge>
            {isInProgress && (
              <Link href={`/assessment/${assessmentId}`}>
                <WarRoomCTA size="sm" variant="primary" icon={Play}>
                  Continue
                </WarRoomCTA>
              </Link>
            )}
          </div>
        </div>
        <GoldDivider variant="line" />
      </motion.div>

      {/* ── Overview Tiles ── */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        variants={staggerContainer}
        initial={prefersReducedMotion ? false : 'hidden'}
        animate="show"
      >
        <motion.div variants={staggerItem}>
          <StatTile
            label="Avg Competency"
            value={avgScore}
            icon={Trophy}
            accent="var(--color-warroom-gold)"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatTile
            label="Revenue Projection"
            value={formatRev(revenueProjection)}
            icon={TrendingUp}
            accent="var(--color-warroom-verdant)"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatTile
            label="Progress"
            value={`${progress?.percentComplete || 0}%`}
            icon={Target}
            accent="var(--color-warroom-electrum)"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatTile
            label="Questions"
            value={progress?.answeredQuestions || 0}
            icon={BarChart3}
            accent="var(--color-warroom-amethyst)"
          />
        </motion.div>
      </motion.div>

      {/* ── Stage Progress ── */}
      <StoneCard accent="var(--color-warroom-gold)" padding="lg">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="h-4 w-4 text-[color:var(--color-warroom-gold)]" />
          <h2
            className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Stage Progress
          </h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-9 gap-1.5 mb-5">
          {Object.entries(STAGE_LABELS).map(([stageId, label]) => {
            const stagesOrder = Object.keys(STAGE_LABELS)
            const currentIdx = stagesOrder.indexOf(
              sim.currentStage as string,
            )
            const thisIdx = stagesOrder.indexOf(stageId)
            const isActive = stageId === sim.currentStage
            const isDone = thisIdx < currentIdx || isCompleted

            return (
              <div
                key={stageId}
                className={cn(
                  'text-center py-2.5 px-1 rounded-[3px] text-[10px] border transition-colors',
                  isDone &&
                    'bg-[color:var(--color-warroom-gold)]/[0.08] border-[color:var(--color-warroom-gold)]/30',
                  isActive &&
                    !isCompleted &&
                    'bg-[color:var(--color-warroom-ember)]/[0.08] border-[color:var(--color-warroom-ember)]/40 ring-1 ring-[color:var(--color-warroom-ember)]/25',
                  !isDone &&
                    !isActive &&
                    'bg-[color:var(--color-warroom-rampart)]/40 border-[color:var(--color-warroom-ash)]/20',
                )}
              >
                <div
                  className={cn(
                    'font-semibold truncate',
                    isDone && 'text-[color:var(--color-warroom-gold)]',
                    isActive &&
                      !isCompleted &&
                      'text-[color:var(--color-warroom-ember)]',
                    !isDone &&
                      !isActive &&
                      'text-[color:var(--color-warroom-smoke)]',
                  )}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {label}
                </div>
                <div className="text-[color:var(--color-warroom-smoke)] mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="h-3 w-3 mx-auto text-[color:var(--color-warroom-gold)]" />
                  ) : isActive ? (
                    '…'
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <Progress
          value={progress?.percentComplete || 0}
          className={PROGRESS_CLASSES}
        />
      </StoneCard>

      {/* ── Competency Scores ── */}
      {competencies && competencies.length > 0 && (
        <StoneCard accent="var(--color-warroom-gold)" padding="lg">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-4 w-4 text-[color:var(--color-warroom-gold)]" />
            <h2
              className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Competency Scores
            </h2>
          </div>
          <p
            className="text-xs text-[color:var(--color-warroom-smoke)] mb-5"
            style={{ fontFamily: 'var(--font-body, serif)' }}
          >
            Your performance across all 8 entrepreneurial competencies.
          </p>
          <div className="space-y-3">
            {[...competencies]
              .sort(
                (a, b) =>
                  (b.weightedAverage || 0) - (a.weightedAverage || 0),
              )
              .map((comp, i) => {
                const tone = CATEGORY_TONES[comp.category]
                return (
                  <div key={comp.competencyCode} className="flex items-center gap-3">
                    <span
                      className="text-[10px] w-5 text-[color:var(--color-warroom-smoke)] shrink-0"
                      style={{ fontFamily: 'var(--font-data, var(--font-mono))' }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-medium text-[color:var(--color-warroom-ivory)] truncate"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {comp.competencyName}
                        </span>
                        <span
                          className={cn(
                            'text-[9px] px-2 py-0.5 rounded-[2px] border uppercase tracking-[0.08em] shrink-0',
                            tone?.text,
                            tone?.bg,
                            tone?.border,
                          )}
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {tone?.label || comp.category?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(
                          ((comp.weightedAverage || 0) / 3) * 100,
                          100,
                        )}
                        className={PROGRESS_CLASSES}
                      />
                    </div>
                    <span
                      className="text-xs font-bold w-10 text-right text-[color:var(--color-warroom-ivory)] shrink-0"
                      style={{ fontFamily: 'var(--font-data, var(--font-mono))' }}
                    >
                      {(((comp.weightedAverage || 0) / 3) * 10).toFixed(1)}
                    </span>
                  </div>
                )
              })}
          </div>
        </StoneCard>
      )}

      {/* ── Entrepreneur Type (from report) ── */}
      {report?.entrepreneurType && (
        <StoneCard
          accent="var(--color-warroom-gold)"
          padding="lg"
          className="text-center"
        >
          <Star className="h-10 w-10 mx-auto mb-3 text-[color:var(--color-warroom-gold)]" />
          <h2
            className="text-2xl font-bold tracking-[0.04em] mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              background:
                'linear-gradient(135deg, var(--color-warroom-gold), var(--color-warroom-gold-bright))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {report.entrepreneurType}
          </h2>
          {report.organizationalRole && (
            <p
              className="text-sm text-[color:var(--color-warroom-smoke)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Best Organisational Role: {report.organizationalRole}
            </p>
          )}
          {report.archetypeNarrative && (
            <p
              className="text-xs text-[color:var(--color-warroom-smoke)] max-w-2xl mx-auto mt-3 leading-relaxed"
              style={{ fontFamily: 'var(--font-body, serif)' }}
            >
              {report.archetypeNarrative}
            </p>
          )}
        </StoneCard>
      )}

      {/* ── Action Plan ── */}
      {report?.actionPlan && report.actionPlan.length > 0 && (
        <StoneCard accent="var(--color-warroom-verdant)" padding="lg">
          <h2
            className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)] mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Action Plan
          </h2>
          <p
            className="text-xs text-[color:var(--color-warroom-smoke)] mb-5"
            style={{ fontFamily: 'var(--font-body, serif)' }}
          >
            Recommended actions to improve your entrepreneurial skills.
          </p>
          <div className="space-y-3">
            {report.actionPlan.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-[3px] bg-[color:var(--color-warroom-rampart)]/40 border border-[color:var(--color-warroom-ash)]/20"
              >
                <div
                  className="h-6 w-6 rounded-full bg-[color:var(--color-warroom-gold)]/[0.12] flex items-center justify-center text-[10px] font-bold text-[color:var(--color-warroom-gold)] shrink-0"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div
                    className="text-xs font-semibold text-[color:var(--color-warroom-ivory)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {item.competency}
                  </div>
                  <p
                    className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5 leading-relaxed"
                    style={{ fontFamily: 'var(--font-body, serif)' }}
                  >
                    {item.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </StoneCard>
      )}

      {/* ── Stage Narrations ── */}
      {report?.stageNarrations && report.stageNarrations.length > 0 && (
        <StoneCard accent="var(--color-warroom-ash)" padding="lg">
          <h2
            className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)] mb-5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Stage-by-Stage Breakdown
          </h2>
          <div className="space-y-3">
            {report.stageNarrations.map((narration, i) => (
              <div
                key={i}
                className="p-4 rounded-[3px] border border-[color:var(--color-warroom-ash)]/25 bg-[color:var(--color-warroom-rampart)]/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <SigilBadge tone="gold">
                    {STAGE_LABELS[narration.stage] || narration.stage}
                  </SigilBadge>
                  <span
                    className="text-[10px] text-[color:var(--color-warroom-smoke)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {narration.questionsAnswered} questions
                  </span>
                </div>
                {narration.decisions && narration.decisions.length > 0 && (
                  <div className="mt-2">
                    <h5
                      className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-warroom-smoke)] mb-1"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Key Decisions
                    </h5>
                    <ul className="space-y-0.5">
                      {narration.decisions.map(
                        (d: string, j: number) => (
                          <li
                            key={j}
                            className="text-xs text-[color:var(--color-warroom-smoke)] leading-relaxed"
                            style={{ fontFamily: 'var(--font-body, serif)' }}
                          >
                            — {d}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
                {narration.scoringRationale && (
                  <p
                    className="text-xs text-[color:var(--color-warroom-smoke)] mt-2 leading-relaxed"
                    style={{ fontFamily: 'var(--font-body, serif)' }}
                  >
                    {narration.scoringRationale}
                  </p>
                )}
              </div>
            ))}
          </div>
        </StoneCard>
      )}

      {/* ── Competency Analysis (detailed) ── */}
      {competencies && competencies.length > 0 && (
        <StoneCard accent="var(--color-warroom-amethyst)" padding="lg">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-[color:var(--color-warroom-amethyst)]" />
            <h2
              className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Competency Analysis
            </h2>
          </div>
          <p
            className="text-xs text-[color:var(--color-warroom-smoke)] mb-5"
            style={{ fontFamily: 'var(--font-body, serif)' }}
          >
            Detailed breakdown of your performance across the 8 core competencies.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...competencies]
              .sort(
                (a: CompetencyScore, b: CompetencyScore) =>
                  (b.weightedAverage || 0) - (a.weightedAverage || 0),
              )
              .map((comp: CompetencyScore) => {
                const tone = CATEGORY_TONES[comp.category]
                const ext = comp as unknown as Record<string, unknown>
                const strengths = (ext.strengths as string[]) || []
                const weaknesses = (ext.weaknesses as string[]) || []
                return (
                  <div
                    key={comp.competencyCode}
                    className="space-y-3 p-4 rounded-[3px] border border-[color:var(--color-warroom-ash)]/20 bg-[color:var(--color-warroom-rampart)]/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4
                          className="font-semibold text-xs text-[color:var(--color-warroom-ivory)]"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {comp.competencyName}
                        </h4>
                        <span
                          className="text-[9px] text-[color:var(--color-warroom-smoke)] uppercase"
                          style={{ fontFamily: 'var(--font-data, var(--font-mono))' }}
                        >
                          {comp.competencyCode}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-[9px] px-2 py-0.5 rounded-[2px] border uppercase tracking-[0.06em]',
                          tone?.text,
                          tone?.bg,
                          tone?.border,
                        )}
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {tone?.label || comp.category}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[color:var(--color-warroom-smoke)]">
                          Proficiency
                        </span>
                        <span
                          className="text-[color:var(--color-warroom-ivory)]"
                          style={{ fontFamily: 'var(--font-data, var(--font-mono))' }}
                        >
                          {(((comp.weightedAverage || 0) / 3) * 10).toFixed(
                            1,
                          )}{' '}
                          / 10.0
                        </span>
                      </div>
                      <Progress
                        value={
                          ((comp.weightedAverage || 0) / 3) * 100
                        }
                        className={PROGRESS_CLASSES}
                      />
                    </div>

                    {strengths.length > 0 && (
                      <div className="space-y-1">
                        <span
                          className="text-[9px] font-bold text-[color:var(--color-warroom-verdant)] uppercase tracking-[0.08em]"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          Positive Signals
                        </span>
                        <ul className="text-[10px] space-y-0.5">
                          {strengths.slice(0, 2).map((s, si) => (
                            <li
                              key={si}
                              className="flex items-start gap-1.5 text-[color:var(--color-warroom-smoke)] leading-tight"
                            >
                              <span className="text-[color:var(--color-warroom-verdant)] mt-0.5">
                                +
                              </span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {weaknesses.length > 0 && (
                      <div className="space-y-1">
                        <span
                          className="text-[9px] font-bold text-[color:var(--color-warroom-ember)] uppercase tracking-[0.08em]"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          Development Areas
                        </span>
                        <ul className="text-[10px] space-y-0.5">
                          {weaknesses.slice(0, 2).map((w, wi) => (
                            <li
                              key={wi}
                              className="flex items-start gap-1.5 text-[color:var(--color-warroom-smoke)] leading-tight"
                            >
                              <span className="text-[color:var(--color-warroom-ember)] mt-0.5">
                                -
                              </span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </StoneCard>
      )}

      {/* ── Bottom Actions ── */}
      <div className="flex justify-center gap-4 pb-6">
        <Link href="/dashboard">
          <WarRoomCTA size="sm" variant="ghost" icon={ArrowLeft}>
            The Study
          </WarRoomCTA>
        </Link>
        {isInProgress && (
          <Link href={`/assessment/${assessmentId}`}>
            <WarRoomCTA size="sm" variant="primary" icon={Play}>
              Continue Simulation
            </WarRoomCTA>
          </Link>
        )}
      </div>
    </div>
  )
}
