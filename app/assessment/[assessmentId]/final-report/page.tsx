'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import api from '@/src/lib/api'
import { CompetencyRadarChart } from '@/components/competency-radar-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  ArrowLeft,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Star,
  BarChart3,
  Target,
  Calendar,
  MessageSquare,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  EvaluationReport,
  RankedCompetency,
  InvestorScorecard,
  CompetencyCode,
  UserResponseEntry,
} from '@/src/types'

// ============================================
// CONSTANTS
// ============================================

const COMP_COLORS: Record<string, string> = {
  C1: '#6366f1', C2: '#8b5cf6', C3: '#f59e0b', C4: '#10b981',
  C5: '#3b82f6', C6: '#ec4899', C7: '#06b6d4', C8: '#f97316',
  C9: '#14b8a6',
}

const CATEGORY_STYLES: Record<string, { badge: string; bar: string }> = {
  NATURAL_DOMINANT: {
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    bar: 'bg-emerald-500',
  },
  STRONG: {
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    bar: 'bg-blue-500',
  },
  FUNCTIONAL: {
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    bar: 'bg-amber-500',
  },
  DEVELOPMENT_REQUIRED: {
    badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
    bar: 'bg-orange-500',
  },
  HIGH_RISK: {
    badge: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
    bar: 'bg-red-500',
  },
}

function stageLabel(s: string) {
  return s.replace('STAGE_', '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

// ============================================
// MAIN PAGE
// ============================================

type TabId = 'deal' | 'competency' | 'analysis' | 'responses' | 'deepdive'

const TABS: { id: TabId; emoji: string; label: string; shortLabel: string }[] = [
  { id: 'deal',       emoji: '🦈', label: 'Deal Summary',      shortLabel: 'Deal'     },
  { id: 'competency', emoji: '📊', label: 'Competency Profile', shortLabel: 'Skills'   },
  { id: 'analysis',   emoji: '🧠', label: 'AI Analysis',        shortLabel: 'Analysis' },
  { id: 'responses',  emoji: '📝', label: 'Your Responses',     shortLabel: 'Answers'  },
  { id: 'deepdive',   emoji: '🔍', label: 'Deep Dive',          shortLabel: 'Stages'   },
]

export default function FinalReportPage() {
  const params = useParams()
  const assessmentId = params?.assessmentId as string
  const [report, setReport] = useState<EvaluationReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('deal')

  useEffect(() => {
    api.assessments
      .getReport(assessmentId)
      .then((r) => setReport(r))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false))
  }, [assessmentId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your evaluation report…</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-destructive text-lg">{error || 'Report not found'}</p>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-lg font-bold tracking-tight">Evaluation Report</h1>
            <p className="text-xs text-muted-foreground truncate">
              {report.entrepreneurType} • {report.organizationalRole}
            </p>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Tab Bar */}
        <div
          role="tablist"
          aria-label="Report sections"
          className="bg-muted rounded-lg p-1 flex w-full mb-8 gap-0.5"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.id}
              aria-controls={`tab-panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              <span className="text-base leading-none">{tab.emoji}</span>
              <span className="hidden sm:block">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            id={`tab-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'deal'       && <DealPage report={report} />}
            {activeTab === 'competency' && <CompetencyPage report={report} />}
            {activeTab === 'analysis'   && <AIAnalysisPage report={report} />}
            {activeTab === 'responses'  && <UserResponsesPage report={report} />}
            {activeTab === 'deepdive'   && <DeepDivePage report={report} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

// ============================================
// PAGE 1: DEAL SUMMARY
// ============================================

function DealPage({ report }: { report: EvaluationReport }) {
  const deal = report.dealSummary

  const stats = [
    {
      value: deal?.totalInvestors ?? 0,
      label: 'Investors Faced',
      icon: Users,
      highlight: false,
    },
    {
      value: deal?.dealsOffered ?? 0,
      label: 'Deals Offered',
      icon: TrendingUp,
      highlight: true,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="flex gap-4 justify-center flex-wrap">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.03 }}
          >
            <Card className={cn(
              'w-48 text-center transition-all',
              stat.highlight && 'border-emerald-500/40 bg-emerald-500/5'
            )}>
              <CardContent className="pt-6 pb-5">
                <stat.icon className={cn(
                  'h-6 w-6 mx-auto mb-2',
                  stat.highlight ? 'text-emerald-500' : 'text-muted-foreground'
                )} />
                <div className={cn(
                  'text-4xl font-extrabold',
                  stat.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                )}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Investor Scorecards */}
      {deal?.investorResults && deal.investorResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Investor Scorecards
          </h2>
          {deal.investorResults.map((sc: any, i: number) => {
            const decision = sc.dealDecision || sc.deal_decision
            const isWalkout = decision === 'WALK_OUT'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
              >
                <Card className={cn(
                  'transition-all',
                  isWalkout ? 'border-destructive/30' : 'border-emerald-500/30'
                )}>
                  <CardContent className="pt-4 pb-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-amber-500/20 border border-primary/30 flex items-center justify-center font-bold text-primary flex-shrink-0">
                          {(sc.investorName || sc.investor_name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">
                            {sc.investorName || sc.investor_name}
                          </p>
                          {sc.redFlag && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="h-3 w-3 text-destructive" />
                              <span className="text-xs text-destructive font-semibold">Red Flag</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'shrink-0',
                          isWalkout
                            ? 'bg-destructive/10 text-destructive border-destructive/30'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                        )}
                      >
                        {isWalkout ? (
                          <><XCircle className="h-3 w-3 mr-1" /> Walk Out</>
                        ) : (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> {decision?.replace(/_/g, ' ')}</>
                        )}
                      </Badge>
                    </div>

                    {/* Scores row */}
                    <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                      <span>Primary Score: <strong className="text-foreground">{sc.primaryScore ?? sc.primary_score ?? '—'}/5</strong></span>
                      <span>Bias Trait: <strong className="text-foreground">{sc.biasTraitScore ?? sc.bias_trait_score ?? '—'}/5</strong></span>
                      {sc.biasTraitName && (
                        <span className="italic">{sc.biasTraitName}</span>
                      )}
                    </div>

                    {/* Reaction quote */}
                    {sc.investorReaction && (
                      <blockquote className="border-l-2 border-border pl-3 text-sm text-muted-foreground italic leading-relaxed">
                        &ldquo;{sc.investorReaction || sc.investor_reaction}&rdquo;
                      </blockquote>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================
// PAGE 2: COMPETENCY PROFILE
// ============================================

function CompetencyPage({ report }: { report: EvaluationReport }) {
  const ranking = report.competencyRanking || []
  const spiderData = report.spiderChartData || {}
  // Max score for bar chart (competency scale is 0–3)
  const MAX_SCORE = 3

  return (
    <div className="space-y-8">
      {/* Archetype */}
      <div className="text-center space-y-3">
        <div className="inline-block px-6 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
          {report.entrepreneurType}
        </div>
        {report.organizationalRole && (
          <p className="text-sm text-muted-foreground">
            Organizational Role: <strong className="text-foreground">{report.organizationalRole}</strong>
          </p>
        )}
        {report.archetypeNarrative && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {report.archetypeNarrative}
          </p>
        )}
      </div>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Competency Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CompetencyRadarChart spiderData={spiderData} competencyRanking={ranking} />
        </CardContent>
      </Card>

      {/* Competency Profile Bars */}
      {ranking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Competency Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ranking.map((comp: RankedCompetency) => {
              const pct = Math.min((comp.weightedAverage / MAX_SCORE) * 100, 100)
              const styles = CATEGORY_STYLES[comp.category] || CATEGORY_STYLES.FUNCTIONAL
              return (
                <div key={comp.code} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-52 shrink-0">
                    <span
                      className="text-xs font-bold w-6 shrink-0"
                      style={{ color: COMP_COLORS[comp.code] || '#8b5cf6' }}
                    >
                      {comp.code}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{comp.name}</span>
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', styles.bar)}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold w-8 text-right text-foreground">
                    {comp.weightedAverage.toFixed(2)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] px-1.5 py-0 whitespace-nowrap hidden sm:inline-flex shrink-0', styles.badge)}
                  >
                    {comp.category.replace(/_/g, ' ')}
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Role Fit */}
      {report.roleFitMap && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-amber-500" />
              Role Fit Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-bold text-foreground mb-1">{report.roleFitMap.role}</p>
            <p className="text-sm text-muted-foreground mb-3">{report.roleFitMap.bestEnvironment}</p>
            {report.roleFitMap.dominantCompetencies?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {report.roleFitMap.dominantCompetencies.map((c: CompetencyCode) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded-md text-xs font-bold border"
                    style={{
                      borderColor: COMP_COLORS[c] || '#8b5cf6',
                      color: COMP_COLORS[c] || '#8b5cf6',
                      background: `${COMP_COLORS[c] || '#8b5cf6'}18`,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Plan */}
      {report.actionPlan?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ChevronRight className="h-4 w-4 text-primary" />
              Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.actionPlan.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="h-6 w-6 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{i + 1}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-0.5">
                    {item.competency}
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{item.action}</p>
                  {item.targetDate && (
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{item.targetDate}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================
// PAGE 3: AI DETAILED ANALYSIS
// ============================================

function AIAnalysisPage({ report }: { report: EvaluationReport }) {
  const analysis = report.detailedAnalysis || ''

  const renderAnalysis = (text: string) => {
    if (!text) {
      return (
        <p className="text-center text-muted-foreground py-8">No detailed analysis available.</p>
      )
    }

    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let key = 0

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        elements.push(<div key={key++} className="h-2" />)
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={key++} className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-5 mb-2 pb-1 border-b border-indigo-500/20 first:mt-0">
            {trimmed.replace('## ', '')}
          </h3>
        )
      } else if (trimmed.startsWith('- ')) {
        elements.push(
          <div key={key++} className="flex gap-2 py-0.5 text-sm text-foreground/80 leading-relaxed">
            <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
            <span>{trimmed.replace('- ', '')}</span>
          </div>
        )
      } else {
        elements.push(
          <p key={key++} className="text-sm text-foreground/80 leading-relaxed my-1">
            {trimmed}
          </p>
        )
      }
    }
    return <>{elements}</>
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">🧠 Detailed AI Evaluation</h2>
        <p className="text-sm text-muted-foreground">
          Comprehensive analysis of your simulation journey — strengths, weaknesses, and actionable insights
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 pb-6">
          {renderAnalysis(analysis)}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// PAGE 4: USER RESPONSES
// ============================================

function UserResponsesPage({ report }: { report: EvaluationReport }) {
  const responses = report.userResponses || []

  const grouped: Record<string, UserResponseEntry[]> = {}
  for (const r of responses) {
    const stage = r.stageName || 'Unknown'
    if (!grouped[stage]) grouped[stage] = []
    grouped[stage].push(r)
  }

  const sortedStages = Object.keys(grouped)

  const getResponseText = (entry: any): string => {
    if (entry.selectedOptionText) return entry.selectedOptionText
    if (!entry.response) return '(no response)'
    if (entry.response.text) return entry.response.text
    if (entry.response.selectedOptionId) return `Selected: ${entry.response.selectedOptionId}`
    if (entry.response.allocations) {
      return Object.entries(entry.response.allocations)
        .map(([k, v]) => `${k}: ${v}%`)
        .join(', ')
    }
    return JSON.stringify(entry.response)
  }

  const proficiencyConfig: Record<number, { className: string; label: string }> = {
    1: { className: 'bg-destructive/10 text-destructive border-destructive/30', label: 'P1 — Developing' },
    2: { className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', label: 'P2 — Strong' },
    3: { className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', label: 'P3 — Advanced' },
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">📝 Your Responses</h2>
        <p className="text-sm text-muted-foreground">
          All your answers throughout the simulation, grouped by stage
        </p>
      </div>

      {sortedStages.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No responses recorded.
          </CardContent>
        </Card>
      )}

      {sortedStages.map((stageName) => (
        <div key={stageName} className="space-y-3">
          {/* Stage header */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 font-bold">
              {stageLabel(stageName)}
            </Badge>
            <span className="text-xs text-muted-foreground">{grouped[stageName].length} responses</span>
            <Separator className="flex-1" />
          </div>

          {/* Response cards */}
          {grouped[stageName].map((entry, i) => (
            <Card key={i} className="bg-card/50">
              <CardContent className="pt-4 pb-4">
                {/* Question */}
                <div className="mb-3">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {entry.questionType.replace(/_/g, ' ')}
                  </span>
                  <p className="text-sm font-semibold text-foreground mt-0.5 leading-snug">
                    {entry.questionText}
                  </p>
                </div>

                {/* Answer */}
                <div className="border-l-2 border-indigo-500/30 pl-3 bg-muted/20 py-2 rounded-r-md mb-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block mb-0.5">
                    Your Answer
                  </span>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {getResponseText(entry)}
                  </p>
                </div>

                {/* Footer: proficiency + feedback */}
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.proficiency != null && proficiencyConfig[entry.proficiency] && (
                    <Badge
                      variant="outline"
                      className={cn('text-xs', proficiencyConfig[entry.proficiency].className)}
                    >
                      {proficiencyConfig[entry.proficiency].label}
                    </Badge>
                  )}
                  {entry.aiFeedback?.feedback && typeof entry.aiFeedback.feedback === 'string' && (
                    <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      {entry.aiFeedback.feedback}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}

// ============================================
// PAGE 5: DEEP DIVE
// ============================================

function DeepDivePage({ report }: { report: EvaluationReport }) {
  const narrations = report.stageNarrations || []

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">🔍 Stage-by-Stage Journey</h2>
        <p className="text-sm text-muted-foreground">
          How your decisions shaped each stage of your entrepreneurial simulation
        </p>
      </div>

      {narrations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No stage narrations available.
          </CardContent>
        </Card>
      )}

      {narrations.map((n, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
        >
          <Card>
            <CardContent className="pt-4 pb-4">
              {/* Stage header */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 font-bold">
                  Stage {n.stageNumber}
                </Badge>
                <span className="text-sm font-semibold text-foreground">
                  {stageLabel(n.stage)}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {n.questionsAnswered} questions answered
                </span>
              </div>

              {/* Decisions */}
              {n.decisions && n.decisions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                    Key Decisions
                  </p>
                  <ul className="space-y-0.5 pl-3">
                    {n.decisions.map((d, j) => (
                      <li key={j} className="text-sm text-foreground/80 leading-relaxed flex items-start gap-1.5">
                        <span className="text-muted-foreground mt-1 shrink-0">›</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Scoring rationale */}
              {n.scoringRationale && (
                <p className="text-xs text-muted-foreground italic leading-relaxed border-t border-border/30 pt-2 mt-2">
                  {n.scoringRationale}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
