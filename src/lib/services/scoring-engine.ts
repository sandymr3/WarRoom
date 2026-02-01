/**
 * Scoring Engine Service
 * Handles competency scoring and level determination
 */

import competenciesData from '@/src/lib/data/competencies.json'
import type {
  CompetencyCode,
  CompetencyLevel,
  CompetencyScore,
  QuestionResponse,
  EvidenceItem,
  StageNumber,
} from '@/src/types'

// JSON structure type (matches actual JSON format)
interface CompetencyJSON {
  code: string;
  name: string;
  category: string;
  primaryStage: number | null;
  assessedAcross?: string;
  description: string;
  levels: {
    L0: string;
    L1: string;
    L2: string;
  };
  indicators: {
    positive: string[];
    negative: string[];
  };
  scoringWeight: number;
}

// Type the competencies data
const competencies = competenciesData as { competencies: CompetencyJSON[] }

/**
 * Get competency definition by code
 */
export function getCompetencyDefinition(code: CompetencyCode): CompetencyJSON | null {
  return competencies.competencies.find(c => c.code === code) || null
}

/**
 * Get all competency definitions
 */
export function getAllCompetencies(): CompetencyJSON[] {
  return competencies.competencies
}

/**
 * Get competencies for a specific stage
 */
export function getCompetenciesForStage(stageNumber: StageNumber): CompetencyJSON[] {
  return competencies.competencies.filter(c => c.primaryStage === stageNumber)
}

/**
 * Calculate competency score from responses
 */
export function calculateCompetencyScore(
  assessmentId: string,
  competencyCode: CompetencyCode,
  responses: QuestionResponse[]
): CompetencyScore {
  const definition = getCompetencyDefinition(competencyCode)
  if (!definition) {
    throw new Error(`Competency ${competencyCode} not found`)
  }
  
  // Filter responses that assess this competency
  const relevantResponses = responses.filter(r => 
    r.competenciesAssessed.includes(competencyCode)
  )
  
  // Calculate total score
  let totalScore = 0
  let maxPossibleScore = 0
  const evidence: EvidenceItem[] = []
  const stageScores: { stage: StageNumber; score: number }[] = []
  
  // Group by stage
  const responsesByStage = groupByStage(relevantResponses)
  
  for (const [stage, stageResponses] of Object.entries(responsesByStage)) {
    let stageScore = 0
    let stageMax = 0
    
    for (const response of stageResponses) {
      const points = response.pointsAwarded
      totalScore += points
      stageScore += points
      
      // Assume max 10 points per question
      maxPossibleScore += 10
      stageMax += 10
      
      // Build evidence
      evidence.push({
        questionId: response.questionId,
        response: getResponseSummary(response),
        pointsAwarded: points,
        levelDemonstrated: determineResponseLevel(points),
        aiNotes: response.aiEvaluation?.feedback,
      })
    }
    
    stageScores.push({
      stage: parseInt(stage) as StageNumber,
      score: stageScore,
    })
  }
  
  // Calculate percentage
  const percentageScore = maxPossibleScore > 0 
    ? Math.round((totalScore / maxPossibleScore) * 100) 
    : 0
  
  // Determine level achieved
  const levelAchieved = determineLevelFromPercentage(percentageScore, definition)
  
  return {
    assessmentId,
    competencyCode,
    competencyName: definition.name,
    currentScore: totalScore,
    maxPossibleScore,
    percentageScore,
    levelAchieved,
    evidence,
    stageScores,
    lastUpdated: new Date(),
  }
}

/**
 * Calculate all competency scores for an assessment
 */
export function calculateAllCompetencyScores(
  assessmentId: string,
  responses: QuestionResponse[]
): CompetencyScore[] {
  // Get all unique competencies assessed
  const competencyCodes = new Set<CompetencyCode>()
  responses.forEach(r => {
    r.competenciesAssessed.forEach(c => competencyCodes.add(c))
  })
  
  return Array.from(competencyCodes).map(code => 
    calculateCompetencyScore(assessmentId, code, responses)
  )
}

/**
 * Calculate overall score
 */
export function calculateOverallScore(competencyScores: CompetencyScore[]): {
  totalScore: number
  maxScore: number
  percentage: number
  averageLevel: CompetencyLevel
} {
  const totalScore = competencyScores.reduce((sum, c) => sum + c.currentScore, 0)
  const maxScore = competencyScores.reduce((sum, c) => sum + c.maxPossibleScore, 0)
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
  
  // Calculate average level
  const levelValues: Record<CompetencyLevel, number> = { L0: 0, L1: 1, L2: 2 }
  const avgLevelValue = competencyScores.reduce(
    (sum, c) => sum + levelValues[c.levelAchieved],
    0
  ) / competencyScores.length
  
  const averageLevel: CompetencyLevel = avgLevelValue < 0.5 ? 'L0' : avgLevelValue < 1.5 ? 'L1' : 'L2'
  
  return { totalScore, maxScore, percentage, averageLevel }
}

/**
 * Get strongest and weakest competencies
 */
export function getCompetencyRankings(competencyScores: CompetencyScore[]): {
  strongest: CompetencyCode[]
  weakest: CompetencyCode[]
} {
  const sorted = [...competencyScores].sort((a, b) => b.percentageScore - a.percentageScore)
  
  return {
    strongest: sorted.slice(0, 3).map(c => c.competencyCode),
    weakest: sorted.slice(-3).reverse().map(c => c.competencyCode),
  }
}

/**
 * Generate competency feedback
 */
export function generateCompetencyFeedback(score: CompetencyScore): {
  status: 'strong' | 'developing' | 'needs_work'
  headline: string
  details: string
} {
  const definition = getCompetencyDefinition(score.competencyCode)
  if (!definition) {
    return {
      status: 'developing',
      headline: 'Assessment recorded',
      details: 'Review your responses for insights.',
    }
  }
  
  const levelDescriptions = {
    L0: { status: 'needs_work' as const, headline: 'Needs Development' },
    L1: { status: 'developing' as const, headline: 'Developing Well' },
    L2: { status: 'strong' as const, headline: 'Strong Competency' },
  }
  
  const levelInfo = levelDescriptions[score.levelAchieved]
  const levelDetail = definition.levels[score.levelAchieved]
  
  return {
    status: levelInfo.status,
    headline: `${score.competencyName}: ${levelInfo.headline}`,
    details: levelDetail, // levelDetail is a string in the JSON
  }
}

/**
 * Get competency radar chart data
 */
export function getRadarChartData(competencyScores: CompetencyScore[]): {
  labels: string[]
  data: number[]
} {
  // Order by competency code
  const ordered = [...competencyScores].sort((a, b) => 
    a.competencyCode.localeCompare(b.competencyCode)
  )
  
  return {
    labels: ordered.map(c => c.competencyName),
    data: ordered.map(c => c.percentageScore),
  }
}

/**
 * Determine level from score percentage
 */
function determineLevelFromPercentage(
  percentage: number,
  definition: CompetencyJSON
): CompetencyLevel {
  // Use fixed thresholds since JSON doesn't have threshold values
  if (percentage >= 75) return 'L2'
  if (percentage >= 40) return 'L1'
  return 'L0'
}

/**
 * Determine level from individual response score
 */
function determineResponseLevel(points: number): CompetencyLevel {
  if (points >= 9) return 'L2'
  if (points >= 6) return 'L1'
  return 'L0'
}

/**
 * Get summary of response for evidence
 */
function getResponseSummary(response: QuestionResponse): string {
  const data = response.responseData
  
  switch (data.type) {
    case 'text':
      return data.value.substring(0, 100) + (data.value.length > 100 ? '...' : '')
    case 'choice':
      return `Selected: ${data.selectedOptionId}`
    case 'budget':
      return `Budget allocation: ${data.allocations.map(a => `${a.categoryId}: ${a.percentage}%`).join(', ')}`
    case 'calculation':
      return `Calculated: ${data.result}`
    case 'numeric':
      return `Value: ${data.value}`
    default:
      return 'Response recorded'
  }
}

/**
 * Group responses by stage
 */
function groupByStage(responses: QuestionResponse[]): Record<string, QuestionResponse[]> {
  return responses.reduce((groups, response) => {
    const stage = String(response.stageNumber)
    if (!groups[stage]) {
      groups[stage] = []
    }
    groups[stage].push(response)
    return groups
  }, {} as Record<string, QuestionResponse[]>)
}

/**
 * Score multiple choice response
 */
export function scoreMultipleChoiceResponse(
  selectedOptionId: string,
  options: { id: string; points?: number }[]
): number {
  const selected = options.find(o => o.id === selectedOptionId)
  return selected?.points ?? 0
}

/**
 * Score budget allocation response
 */
export function scoreBudgetAllocation(
  allocations: { categoryId: string; percentage: number }[],
  idealRanges: { categoryId: string; min: number; max: number; weight: number }[]
): number {
  let score = 0
  const maxScore = idealRanges.reduce((sum, r) => sum + r.weight * 10, 0)
  
  for (const ideal of idealRanges) {
    const allocation = allocations.find(a => a.categoryId === ideal.categoryId)
    if (allocation) {
      const percentage = allocation.percentage
      
      // Full points if within range
      if (percentage >= ideal.min && percentage <= ideal.max) {
        score += ideal.weight * 10
      } else {
        // Partial points based on distance from range
        const midPoint = (ideal.min + ideal.max) / 2
        const distance = Math.abs(percentage - midPoint)
        const maxDistance = 50 // Max possible distance
        const partialScore = Math.max(0, 1 - distance / maxDistance)
        score += ideal.weight * 10 * partialScore
      }
    }
  }
  
  return Math.round(score / maxScore * 10) // Normalize to 0-10
}

/**
 * Score calculation response
 */
export function scoreCalculationResponse(
  result: number,
  expectedRange: { min: number; max: number },
  maxPoints: number = 10
): number {
  if (result >= expectedRange.min && result <= expectedRange.max) {
    return maxPoints
  }
  
  // Partial credit based on how close they are
  const midPoint = (expectedRange.min + expectedRange.max) / 2
  const distance = Math.abs(result - midPoint)
  const rangeSize = (expectedRange.max - expectedRange.min) / 2
  
  if (distance <= rangeSize * 2) {
    return Math.round(maxPoints * 0.5)
  }
  
  return Math.round(maxPoints * 0.25)
}

export default {
  getCompetencyDefinition,
  getAllCompetencies,
  getCompetenciesForStage,
  calculateCompetencyScore,
  calculateAllCompetencyScores,
  calculateOverallScore,
  getCompetencyRankings,
  generateCompetencyFeedback,
  getRadarChartData,
  scoreMultipleChoiceResponse,
  scoreBudgetAllocation,
  scoreCalculationResponse,
}
