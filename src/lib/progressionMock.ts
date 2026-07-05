// ============================================
// The Gambit — Progression mock adapter
// ----------------------------------------------------------------
// Derives a FounderProgression from data that ALREADY exists
// (assessments + reports + locally-stored house) so the UI is fully
// buildable/testable before the backend ships /progression/*.
//
// `deriveProgression` is PURE (no api import) to avoid a circular
// dependency — api.progression.me() fetches the inputs and calls it.
// When the live endpoint lands, flip USE_LIVE_PROGRESSION in api.ts;
// the UI is unchanged.
// ============================================

import type {
  Assessment,
  CompetencyCode,
  CompetencyMastery,
  EarnedSigil,
  EvaluationReport,
  FounderProgression,
  HouseConfig,
  InvestorScorecard,
  RenownEvent,
  SigilTierName,
} from '@/src/types'
import {
  CATEGORY_TIER,
  DEFAULT_HOUSE,
  categoryForAverage,
  rankForRenown,
  sigilById,
} from '@/src/lib/progression'

// --- tunable mock weights (the backend owns the real numbers) ---
const RENOWN_PER_TRIAL = 600
const RENOWN_PER_MASTERY_TIER = 80 // × (tier-1) per competency
const SIGIL_RENOWN: Record<SigilTierName, number> = {
  BRONZE: 80,
  SILVER: 150,
  GOLD: 300,
  OBSIDIAN: 600,
}
const PHOENIX_DELTA = 15
const MILLION = 1_000_000
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const HOUSE_STORAGE_KEY = 'warroom_house'

type AssessmentWithRevenue = Assessment & { revenueProjection?: number }

export interface ReportSlot {
  assessmentId: string
  report: EvaluationReport | null
}

export interface DeriveInput {
  userId: string
  assessments: Assessment[]
  reports: ReportSlot[]
  house: HouseConfig
}

function avgScorecard(cards: InvestorScorecard[] | undefined): number | null {
  if (!cards || cards.length === 0) return null
  const sum = cards.reduce((acc, c) => acc + (c.primaryScore || 0), 0)
  return Math.round(sum / cards.length)
}

function computeHearth(dates: string[]): {
  current: number
  longest: number
  lastActiveAt: string | null
} {
  const weeks = Array.from(
    new Set(
      dates
        .map((d) => new Date(d).getTime())
        .filter((t) => !Number.isNaN(t))
        .map((t) => Math.floor(t / WEEK_MS)),
    ),
  ).sort((a, b) => a - b)

  if (weeks.length === 0) return { current: 0, longest: 0, lastActiveAt: null }

  let longest = 1
  let run = 1
  let trailing = 1
  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i] === weeks[i - 1] + 1) run += 1
    else run = 1
    longest = Math.max(longest, run)
  }
  trailing = run // run ending at the most recent active week

  const lastActiveAt = new Date(
    Math.max(...dates.map((d) => new Date(d).getTime()).filter((t) => !Number.isNaN(t))),
  ).toISOString()

  return { current: trailing, longest, lastActiveAt }
}

/** Pure: turn already-fetched data into a FounderProgression. Never throws. */
export function deriveProgression(input: DeriveInput): FounderProgression {
  const { userId, assessments, reports, house } = input
  const reportFor = (id: string) => reports.find((r) => r.assessmentId === id)?.report ?? null

  const completed = assessments.filter((a) => a.status === 'COMPLETED')

  // --- best-ever competency mastery across all reports ---
  const mastery: Partial<Record<CompetencyCode, CompetencyMastery>> = {}
  const seenTrials: Partial<Record<CompetencyCode, number>> = {}
  for (const a of assessments) {
    const report = reportFor(a.id)
    if (!report?.competencyRanking) continue
    for (const rc of report.competencyRanking) {
      seenTrials[rc.code] = (seenTrials[rc.code] ?? 0) + 1
      const existing = mastery[rc.code]
      if (!existing || rc.weightedAverage > existing.bestAverage) {
        mastery[rc.code] = {
          bestAverage: rc.weightedAverage,
          category: rc.category ?? categoryForAverage(rc.weightedAverage),
          trials: seenTrials[rc.code]!,
          updatedAt: a.completedAt || a.updatedAt || a.createdAt,
        }
      } else {
        existing.trials = seenTrials[rc.code]!
      }
    }
  }

  // --- per-run legacy scores (chronological) for the Phoenix sigil ---
  const legacyRuns = completed
    .map((a) => {
      const report = reportFor(a.id)
      const legacy = report
        ? avgScorecard(report.dealSummary?.investorResults)
        : null
      return {
        time: new Date(a.completedAt || a.updatedAt || a.createdAt).getTime(),
        legacy,
      }
    })
    .filter((r) => r.legacy != null)
    .sort((a, b) => a.time - b.time) as Array<{ time: number; legacy: number }>

  let phoenix = false
  for (let i = 1; i < legacyRuns.length; i++) {
    if (legacyRuns[i].legacy >= legacyRuns[i - 1].legacy + PHOENIX_DELTA) phoenix = true
  }

  // --- feats from raw assessment data ---
  const masteryTier = (c: CompetencyCode) =>
    mastery[c] ? CATEGORY_TIER[mastery[c]!.category] : 0
  const allEight = (['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'] as CompetencyCode[])

  const anyDeal = assessments.some((a) => a.dealResult?.dealMade)
  const anyMillion = assessments.some(
    (a) => ((a as AssessmentWithRevenue).revenueProjection ?? 0) >= MILLION,
  )
  const anyUnbroken = completed.some((a) => (a.mentorLifelinesRemaining ?? 0) >= 3)
  const reachedWarRoom = assessments.some(
    (a) => a.currentStage === 'STAGE_4_WARROOM' || a.status === 'COMPLETED',
  )
  const naturalBorn = allEight.some((c) => masteryTier(c) >= 5)
  const strategist = masteryTier('C5') >= 4 && masteryTier('C4') >= 4
  const polymath = allEight.every((c) => masteryTier(c) >= 4)
  const unanimous = assessments.some((a) => {
    const r = reportFor(a.id)
    const cards = r?.dealSummary?.investorResults
    return (
      !!cards &&
      cards.length > 0 &&
      cards.every((c) => c.dealDecision !== 'WALK_OUT' && !c.redFlag)
    )
  })

  const hearth = computeHearth(
    assessments.map((a) => a.completedAt || a.updatedAt || a.createdAt),
  )
  const ironWill = hearth.longest >= 4

  const earnedAtFor = (predicate: (a: Assessment) => boolean): string => {
    const match = assessments.find(predicate)
    return match?.completedAt || match?.updatedAt || new Date().toISOString()
  }

  const sigils: EarnedSigil[] = []
  const award = (id: string, tier: SigilTierName, when: string) =>
    sigils.push({ id, tier, earnedAt: when })

  if (completed.length > 0) award('first_blood', 'BRONZE', earnedAtFor((a) => a.status === 'COMPLETED'))
  if (reachedWarRoom) award('the_committed', 'BRONZE', earnedAtFor((a) => a.currentStage === 'STAGE_4_WARROOM' || a.status === 'COMPLETED'))
  if (anyUnbroken) award('the_unbroken', 'SILVER', earnedAtFor((a) => a.status === 'COMPLETED' && (a.mentorLifelinesRemaining ?? 0) >= 3))
  if (anyMillion) award('master_of_coin', 'GOLD', earnedAtFor((a) => ((a as AssessmentWithRevenue).revenueProjection ?? 0) >= MILLION))
  if (anyDeal) award('dragonslayer', 'GOLD', earnedAtFor((a) => !!a.dealResult?.dealMade))
  if (naturalBorn) award('natural_born', 'GOLD', new Date().toISOString())
  if (phoenix) award('the_phoenix', 'GOLD', new Date().toISOString())
  if (ironWill) award('iron_will', 'GOLD', hearth.lastActiveAt || new Date().toISOString())
  if (strategist) award('the_strategist', 'GOLD', new Date().toISOString())
  if (polymath) award('polymath', 'OBSIDIAN', new Date().toISOString())
  if (unanimous) award('unanimous', 'OBSIDIAN', new Date().toISOString())

  // --- renown: quality-weighted (trials + mastery + sigils) ---
  const masteryRenown = allEight.reduce(
    (acc, c) => acc + Math.max(0, masteryTier(c) - 1) * RENOWN_PER_MASTERY_TIER,
    0,
  )
  const sigilRenown = sigils.reduce((acc, s) => acc + SIGIL_RENOWN[s.tier], 0)
  const trialRenown = completed.length * RENOWN_PER_TRIAL
  const renown = trialRenown + masteryRenown + sigilRenown

  const rank = rankForRenown(renown)
  if (rank.tier >= 6) award('the_sovereign', 'OBSIDIAN', new Date().toISOString())

  // --- renown history (most-recent-first) ---
  const history: RenownEvent[] = []
  for (const a of completed) {
    history.push({
      date: a.completedAt || a.updatedAt || a.createdAt,
      delta: RENOWN_PER_TRIAL,
      reason: 'Match completed',
    })
  }
  for (const s of sigils) {
    history.push({ date: s.earnedAt, delta: SIGIL_RENOWN[s.tier], reason: `Norm earned: ${sigilById(s.id)?.name ?? s.id}` })
  }
  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return {
    userId,
    renown,
    rank,
    competencyMastery: mastery,
    sigils,
    hearth,
    house: { ...DEFAULT_HOUSE, ...house },
    renownHistory: history.slice(0, 12),
  }
}

// --- local house persistence (until backend owns it) ---

export function readStoredHouse(): HouseConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_HOUSE }
  try {
    const raw = window.localStorage.getItem(HOUSE_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_HOUSE }
    return { ...DEFAULT_HOUSE, ...(JSON.parse(raw) as Partial<HouseConfig>) }
  } catch {
    return { ...DEFAULT_HOUSE }
  }
}

export function writeStoredHouse(patch: Partial<HouseConfig>): HouseConfig {
  const merged = { ...readStoredHouse(), ...patch }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(HOUSE_STORAGE_KEY, JSON.stringify(merged))
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }
  return merged
}
