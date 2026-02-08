/**
 * Mistake Detector Service
 * Detects and tracks common entrepreneurial mistakes
 */

import mistakesData from '@/src/lib/data/mistakes.json'
import type {
  MistakeCode,
  MistakeTriggered,
  QuestionResponse,
  FullAssessmentState,
  StageNumber,
} from '@/src/types'

// JSON structure type (matches actual JSON format)
interface MistakeJSON {
  code: string;
  name: string;
  category: string;
  typicalStage: number;
  description: string;
  detection: {
    triggers: string[];
    questionPatterns: string[];
  };
  immediateImpact: Record<string, string | boolean | number>;
  compoundingImpact: {
    description: string;
    stageEffects: Record<string, Record<string, string | boolean | number>>;
  };
  recoveryPath: string;
  severity: string;
}

// Type the mistakes data
const mistakes = mistakesData as unknown as { mistakes: MistakeJSON[] }

/**
 * Get mistake definition by code
 */
export function getMistakeDefinition(code: MistakeCode): MistakeJSON | null {
  return mistakes.mistakes.find(m => m.code === code) || null
}

/**
 * Get all mistake definitions
 */
export function getAllMistakes(): MistakeJSON[] {
  return mistakes.mistakes
}

/**
 * Check if a response triggers a mistake
 */
export function checkForMistakeTrigger(
  questionId: string,
  response: QuestionResponse,
  currentMistakes: MistakeCode[]
): MistakeCode | null {
  // Check each mistake's detection triggers
  for (const mistake of mistakes.mistakes) {
    // Skip if already triggered
    if (currentMistakes.includes(mistake.code as MistakeCode)) {
      continue
    }
    
    // Check if this question pattern matches
    const matchesPattern = mistake.detection.questionPatterns.some(pattern => {
      return evaluateQuestionPattern(pattern, questionId, response)
    })
    
    if (matchesPattern) {
      return mistake.code as MistakeCode
    }
  }
  
  return null
}

/**
 * Evaluate a question pattern against a response
 */
function evaluateQuestionPattern(
  pattern: string,
  questionId: string,
  response: QuestionResponse
): boolean {
  // Simple pattern matching - can be enhanced
  if (response.responseData.type === 'choice') {
    const selectedId = response.responseData.selectedOptionId
    return pattern.includes(selectedId) || pattern.includes(questionId)
  }
  
  if (response.responseData.type === 'budget') {
    const allocations = response.responseData.allocations
    // Check budget patterns like "budget_allocation.team > 30"
    if (pattern.includes('budget_allocation')) {
      return evaluateBudgetPattern(pattern, allocations as any)
    }
  }
  
  return false
}

/**
 * Evaluate budget allocation patterns
 */
function evaluateBudgetPattern(
  pattern: string,
  allocations: { categoryId: string; percentage: number; amount: number }[]
): boolean {
  // Parse patterns like "budget_allocation.team > 30"
  const match = pattern.match(/budget_allocation\.(\w+)\s*([><=]+)\s*(\d+)/)
  if (!match) return false
  
  const [, category, operator, thresholdStr] = match
  const threshold = parseFloat(thresholdStr)
  const allocation = allocations.find((a: any) => 
    a.categoryId.toLowerCase() === category.toLowerCase()
  )
  
  if (!allocation) return false
  
  switch (operator) {
    case '>': return allocation.percentage > threshold
    case '>=': return allocation.percentage >= threshold
    case '<': return allocation.percentage < threshold
    case '<=': return allocation.percentage <= threshold
    case '==': return allocation.percentage === threshold
    default: return false
  }
}

/**
 * Evaluate a condition expression string
 */
function evaluateConditionExpression(
  condition: string,
  response: QuestionResponse
): boolean {
  const data = response.responseData
  
  // Handle common condition patterns
  if (condition.startsWith('selectedOption:')) {
    const optionId = condition.replace('selectedOption:', '').trim()
    return data.type === 'choice' && data.selectedOptionId === optionId
  }
  
  if (condition.startsWith('budgetBelow:')) {
    const [category, threshold] = condition.replace('budgetBelow:', '').split(':').map(s => s.trim())
    if (data.type === 'budget') {
      const allocation = (data.allocations as any).find((a: any) => a.categoryId === category)
      return allocation ? allocation.percentage < parseFloat(threshold) : false
    }
  }
  
  if (condition.startsWith('budgetAbove:')) {
    const [category, threshold] = condition.replace('budgetAbove:', '').split(':').map(s => s.trim())
    if (data.type === 'budget') {
      const allocation = (data.allocations as any).find((a: any) => a.categoryId === category)
      return allocation ? allocation.percentage > parseFloat(threshold) : false
    }
  }
  
  if (condition.startsWith('textContains:')) {
    const keywords = condition.replace('textContains:', '').split(',').map(s => s.trim().toLowerCase())
    if (data.type === 'text') {
      const text = data.value.toLowerCase()
      return keywords.some(keyword => text.includes(keyword))
    }
  }
  
  return false
}

/**
 * Create a mistake triggered record
 */
export function createMistakeTriggered(
  assessmentId: string,
  mistakeCode: MistakeCode,
  stageNumber: StageNumber,
  triggerQuestionId: string,
  triggerResponse: string
): MistakeTriggered {
  const definition = getMistakeDefinition(mistakeCode)
  if (!definition) {
    throw new Error(`Mistake ${mistakeCode} not found`)
  }
  
  return {
    assessmentId,
    mistakeCode,
    mistakeName: definition.name,
    triggeredAtStage: stageNumber,
    triggerQuestionId,
    triggerResponse,
    immediateImpactApplied: definition.immediateImpact as Record<string, string | boolean | number>,
    compoundingImpactsApplied: [],
    recovered: false,
    totalCompoundedCost: 0,
    triggeredAt: new Date(),
  }
}

/**
 * Check for mistakes detectable at a given stage
 */
export function getMistakesDetectableAtStage(stageNumber: StageNumber): MistakeJSON[] {
  return mistakes.mistakes.filter(m => 
    m.typicalStage === stageNumber
  )
}

/**
 * Get warning message for a potential mistake
 */
export function getMistakeWarning(mistakeCode: MistakeCode): string | null {
  const definition = getMistakeDefinition(mistakeCode)
  if (!definition) return null
  
  return `⚠️ Warning: This could lead to "${definition.name}" - ${definition.description}`
}

/**
 * Check if a mistake has a recovery path
 */
export function canRecoverFromMistake(
  mistakeCode: MistakeCode,
  currentState: FullAssessmentState
): { canRecover: boolean; requirements: string[] } {
  const definition = getMistakeDefinition(mistakeCode)
  if (!definition || !definition.recoveryPath) {
    return { canRecover: false, requirements: [] }
  }
  
  return {
    canRecover: true,
    requirements: [definition.recoveryPath],
  }
}

/**
 * Get immediate impact of a mistake
 */
export function getMistakeImmediateImpact(mistakeCode: MistakeCode): {
  description: string
  effects: Record<string, number | string | boolean>
} | null {
  const definition = getMistakeDefinition(mistakeCode)
  if (!definition) return null
  
  return {
    description: definition.description,
    effects: definition.immediateImpact
  }
}

/**
 * Get all compounding effects for triggered mistakes at a given stage
 */
export function getCompoundingEffects(
  triggeredMistakes: MistakeTriggered[],
  currentStage: StageNumber
): {
  mistakeCode: MistakeCode
  description: string
  effects: Record<string, number | string | boolean>
  multiplier: number
}[] {
  const effects: {
    mistakeCode: MistakeCode
    description: string
    effects: Record<string, number | string | boolean>
    multiplier: number
  }[] = []
  
  for (const mistake of triggeredMistakes) {
    const definition = getMistakeDefinition(mistake.mistakeCode)
    if (!definition) continue
    
    // Find compounding effects for this stage
    const stageEffectsObj = definition.compoundingImpact.stageEffects
    const stageKey = String(currentStage)
    
    if (stageEffectsObj && stageEffectsObj[stageKey]) {
      // Skip if already applied
      if (mistake.compoundingImpactsApplied.some(a => a.stage === currentStage)) {
        continue
      }
      
      effects.push({
        mistakeCode: mistake.mistakeCode,
        description: definition.compoundingImpact.description,
        effects: stageEffectsObj[stageKey],
        multiplier: 1.0,
      })
    }
  }
  
  return effects
}

/**
 * Calculate total cost from a mistake (immediate + compounding)
 */
export function calculateMistakeTotalCost(mistake: MistakeTriggered): number {
  const definition = getMistakeDefinition(mistake.mistakeCode)
  if (!definition) return 0
  
  let totalCost = 0
  
  // Add immediate impact costs
  const immediateEffects = definition.immediateImpact.effects
  for (const [key, value] of Object.entries(immediateEffects)) {
    if (typeof value === 'number' && key.toLowerCase().includes('cost')) {
      totalCost += Math.abs(value)
    }
    if (typeof value === 'number' && key.toLowerCase().includes('capital')) {
      totalCost += Math.abs(value)
    }
  }
  
  // Add compounding costs
  for (const impact of mistake.compoundingImpactsApplied) {
    totalCost += impact.totalCost
  }
  
  return totalCost
}

/**
 * Get mistake severity
 */
export function getMistakeSeverity(mistakeCode: MistakeCode): 'low' | 'medium' | 'high' | 'critical' {
  const definition = getMistakeDefinition(mistakeCode)
  if (!definition) return 'medium'
  
  // Use severity from JSON if available
  const severity = definition.severity
  if (severity === 'high' || severity === 'critical') return severity as 'high' | 'critical'
  if (severity === 'medium') return 'medium'
  return 'low'
}

/**
 * Get mistakes avoided (not triggered)
 */
export function getMistakesAvoided(
  triggeredMistakes: MistakeCode[],
  completedStages: StageNumber[]
): MistakeCode[] {
  const avoidable = mistakes.mistakes.filter(m => 
    completedStages.includes(m.typicalStage as StageNumber)
  )
  
  return avoidable
    .filter(m => !triggeredMistakes.includes(m.code as MistakeCode))
    .map(m => m.code as MistakeCode)
}

/**
 * Generate mistake analysis for report
 */
export function generateMistakeAnalysis(
  triggeredMistakes: MistakeTriggered[],
  completedStages: StageNumber[]
): {
  totalMistakes: number
  totalCost: number
  worstMistake: MistakeTriggered | null
  mistakesAvoided: MistakeCode[]
  pattern: string | null
} {
  const totalMistakes = triggeredMistakes.length
  const totalCost = triggeredMistakes.reduce((sum, m) => sum + calculateMistakeTotalCost(m), 0)
  
  // Find worst mistake by cost
  const worstMistake = triggeredMistakes.length > 0
    ? triggeredMistakes.reduce((worst, current) => 
        calculateMistakeTotalCost(current) > calculateMistakeTotalCost(worst) ? current : worst
      )
    : null
  
  const mistakesAvoided = getMistakesAvoided(
    triggeredMistakes.map(m => m.mistakeCode),
    completedStages
  )
  
  // Identify pattern
  let pattern: string | null = null
  if (totalMistakes >= 3) {
    const financialMistakes = triggeredMistakes.filter(m => 
      ['M3', 'M7', 'M8'].includes(m.mistakeCode)
    )
    const operationalMistakes = triggeredMistakes.filter(m => 
      ['M1', 'M4', 'M6'].includes(m.mistakeCode)
    )
    const strategicMistakes = triggeredMistakes.filter(m => 
      ['M2', 'M5'].includes(m.mistakeCode)
    )
    
    if (financialMistakes.length >= 2) {
      pattern = 'Financial discipline challenges - focus on unit economics and resource management'
    } else if (operationalMistakes.length >= 2) {
      pattern = 'Operational scaling issues - focus on building systems before scaling'
    } else if (strategicMistakes.length >= 2) {
      pattern = 'Strategic gaps - focus on market validation and customer focus'
    }
  }
  
  return {
    totalMistakes,
    totalCost,
    worstMistake,
    mistakesAvoided,
    pattern,
  }
}

export default {
  getMistakeDefinition,
  getAllMistakes,
  checkForMistakeTrigger,
  createMistakeTriggered,
  getMistakesDetectableAtStage,
  getMistakeWarning,
  canRecoverFromMistake,
  getMistakeImmediateImpact,
  getCompoundingEffects,
  calculateMistakeTotalCost,
  getMistakeSeverity,
  getMistakesAvoided,
  generateMistakeAnalysis,
}
