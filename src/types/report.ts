import { CompetencyScore, Mistake } from './state'

export type ReportType = 'PHASE_END' | 'FINAL'

export interface PhaseEndReport {
  id: string
  assessmentId: string
  stageNumber: number
  stageName: string
  completedAt: Date
  durationMinutes: number
  competencyScores: CompetencyScore[]
  mistakes: Mistake[]
  financialSnapshot: {
    capital: number
    revenue: number
    burn: number
    runway: number
  }
  aiJustification: {
    positiveEvidence: string[]
    improvementAreas: string[]
    patternsNoticed: string[]
  }
}

export interface FinalReport {
  id: string
  assessmentId: string
  completedAt: Date
  allCompetencies: CompetencyScore[]
  allMistakes: Mistake[]
  executiveSummary: string
  developmentRoadmap: string[]
  leadershipProfile: string
  attemptComparison?: {
    attempt1Score: number
    attempt2Score: number
    improvement: number
  }
}
