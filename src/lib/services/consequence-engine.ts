/**
 * Consequence Engine Service
 * Handles compounding consequences from mistakes and decisions
 */

import { getMistakeDefinition, calculateMistakeTotalCost } from './mistake-detector'
import { applyConsequence } from './state-manager'
import type {
  MistakeCode,
  MistakeTriggered,
  FullAssessmentState,
  StageNumber,
} from '@/src/types'

/**
 * Apply immediate consequences of a mistake
 */
export function applyMistakeImmediateConsequence(
  state: FullAssessmentState,
  mistakeCode: MistakeCode
): { newState: FullAssessmentState; appliedEffects: Record<string, any> } {
  const definition = getMistakeDefinition(mistakeCode)
  if (!definition) {
    return { newState: state, appliedEffects: {} }
  }
  
  const effects = definition.immediateImpact as Record<string, any>
  const newState = applyConsequence(state, effects)
  
  return { newState, appliedEffects: effects }
}

/**
 * Apply compounding consequences at stage transition
 */
export function applyCompoundingConsequences(
  state: FullAssessmentState,
  triggeredMistakes: MistakeTriggered[],
  enteringStage: StageNumber
): {
  newState: FullAssessmentState
  updatedMistakes: MistakeTriggered[]
  totalCompoundedCost: number
} {
  let currentState = state
  const updatedMistakes = [...triggeredMistakes]
  let totalCompoundedCost = 0
  
  for (let i = 0; i < updatedMistakes.length; i++) {
    const mistake = updatedMistakes[i]
    const definition = getMistakeDefinition(mistake.mistakeCode)
    
    if (!definition) continue
    
    // Get compounding effects from JSON structure
    const stageEffects = definition.compoundingImpact?.stageEffects || {}
    const stageKey = String(enteringStage)
    
    if (stageEffects[stageKey]) {
      // Check if we already applied this stage's effects
      if (!mistake.compoundingImpactsApplied.some(a => a.stage === enteringStage)) {
        const effects = stageEffects[stageKey]
        
        // Apply the effects
        currentState = applyConsequence(currentState, effects as Record<string, any>)
        
        // Calculate the cost of this compounding effect
        const effectCost = calculateEffectCost(effects as Record<string, number | string>, 1.0)
        totalCompoundedCost += effectCost
        
        // Record that we applied this effect
        updatedMistakes[i] = {
          ...mistake,
          compoundingImpactsApplied: [
            ...mistake.compoundingImpactsApplied,
            {
              stage: enteringStage,
              impact: effects,
              totalCost: effectCost,
            },
          ],
          totalCompoundedCost: mistake.totalCompoundedCost + effectCost,
        }
      }
    }
  }
  
  // Add to state's compounded losses
  currentState = {
    ...currentState,
    compoundedLosses: currentState.compoundedLosses + totalCompoundedCost,
  }
  
  return {
    newState: currentState,
    updatedMistakes,
    totalCompoundedCost,
  }
}

/**
 * Calculate monetary cost of effect
 */
function calculateEffectCost(
  effects: Record<string, number | string>,
  multiplier: number
): number {
  let cost = 0
  
  for (const [key, value] of Object.entries(effects)) {
    if (typeof value !== 'number') continue
    
    // Check if this is a cost-related effect
    const costKeys = ['cost', 'capital', 'burn', 'expense', 'loss']
    if (costKeys.some(k => key.toLowerCase().includes(k))) {
      cost += Math.abs(value) * multiplier
    }
    
    // Revenue loss is also a cost
    if (key.toLowerCase().includes('revenue') && value < 0) {
      // Assume 12 months impact
      cost += Math.abs(value) * 12 * multiplier
    }
  }
  
  return Math.round(cost)
}

/**
 * Get consequence summary for display
 */
export function getConsequenceSummary(
  triggeredMistakes: MistakeTriggered[]
): {
  immediateImpacts: { mistake: string; description: string }[]
  compoundingImpacts: { mistake: string; stage: number; description: string; cost: number }[]
  totalCost: number
  warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
} {
  const immediateImpacts: { mistake: string; description: string }[] = []
  const compoundingImpacts: { mistake: string; stage: number; description: string; cost: number }[] = []
  let totalCost = 0
  
  for (const mistake of triggeredMistakes) {
    const definition = getMistakeDefinition(mistake.mistakeCode)
    if (!definition) continue
    
    // Add immediate impact
    immediateImpacts.push({
      mistake: definition.name,
      description: definition.description,
    })
    
    // Add compounding impacts
    for (const impact of mistake.compoundingImpactsApplied) {
      compoundingImpacts.push({
        mistake: definition.name,
        stage: impact.stage,
        description: definition.compoundingImpact?.description || 'Compounding effect',
        cost: impact.totalCost,
      })
      totalCost += impact.totalCost
    }
    
    totalCost += calculateMistakeTotalCost(mistake)
  }
  
  // Determine warning level
  let warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none'
  if (totalCost > 100000) warningLevel = 'critical'
  else if (totalCost > 50000) warningLevel = 'high'
  else if (totalCost > 20000) warningLevel = 'medium'
  else if (totalCost > 0) warningLevel = 'low'
  
  return {
    immediateImpacts,
    compoundingImpacts,
    totalCost,
    warningLevel,
  }
}

/**
 * Generate consequence narrative for scenario context
 */
export function generateConsequenceNarrative(
  triggeredMistakes: MistakeTriggered[],
  currentStage: StageNumber
): string {
  if (triggeredMistakes.length === 0) {
    return 'Your disciplined approach is paying off. You\'ve avoided common pitfalls that trip up many founders.'
  }
  
  const narratives: string[] = []
  
  for (const mistake of triggeredMistakes) {
    const definition = getMistakeDefinition(mistake.mistakeCode)
    if (!definition) continue
    
    // Check for relevant compounding effect for current stage
    const stageEffects = definition.compoundingImpact?.stageEffects || {}
    const stageKey = String(currentStage)
    
    if (stageEffects[stageKey]) {
      narratives.push(`**${definition.name}:** ${definition.compoundingImpact.description}`)
    }
  }
  
  if (narratives.length === 0) {
    return `You made ${triggeredMistakes.length} earlier decisions that may have consequences later.`
  }
  
  return narratives.join('\n\n')
}

/**
 * Check if state is in critical condition
 */
export function checkCriticalCondition(state: FullAssessmentState): {
  isCritical: boolean
  reasons: string[]
} {
  const reasons: string[] = []
  
  // Check runway
  if (state.financial.runwayMonths < 3 && state.financial.runwayMonths !== 999) {
    reasons.push('Runway is critically low (less than 3 months)')
  }
  
  // Check burn rate vs revenue
  if (state.financial.burnRate > state.financial.currentCapital * 0.2) {
    reasons.push('Burn rate is dangerously high relative to capital')
  }
  
  // Check team satisfaction
  if (state.team.satisfaction < 30) {
    reasons.push('Team morale is critically low')
  }
  
  // Check customer retention
  if (state.customers.retention < 50 && state.customers.total > 0) {
    reasons.push('Customer retention is unsustainable')
  }
  
  // Check compounded losses
  if (state.compoundedLosses > state.financial.initialCapital * 0.5) {
    reasons.push('Compounded mistakes have cost over 50% of initial capital')
  }
  
  return {
    isCritical: reasons.length >= 2,
    reasons,
  }
}

/**
 * Calculate potential future impact if mistakes continue
 */
export function projectFutureImpact(
  triggeredMistakes: MistakeTriggered[],
  currentStage: StageNumber,
  remainingStages: StageNumber[]
): {
  projectedAdditionalCost: number
  projectedTotalCost: number
  stageBreakdown: { stage: StageNumber; cost: number }[]
} {
  let projectedAdditionalCost = 0
  const stageBreakdown: { stage: StageNumber; cost: number }[] = []
  
  for (const stage of remainingStages) {
    let stageCost = 0
    
    for (const mistake of triggeredMistakes) {
      const definition = getMistakeDefinition(mistake.mistakeCode)
      if (!definition) continue
      
      // Find compounding effects for this future stage
      const stageEffects = definition.compoundingImpact?.stageEffects || {}
      const stageKey = String(stage)
      
      if (stageEffects[stageKey] && !mistake.compoundingImpactsApplied.some(a => a.stage === stage)) {
        stageCost += calculateEffectCost(stageEffects[stageKey] as Record<string, number | string>, 1.0)
      }
    }
    
    stageBreakdown.push({ stage, cost: stageCost })
    projectedAdditionalCost += stageCost
  }
  
  const currentTotalCost = triggeredMistakes.reduce(
    (sum, m) => sum + calculateMistakeTotalCost(m), 
    0
  )
  
  return {
    projectedAdditionalCost,
    projectedTotalCost: currentTotalCost + projectedAdditionalCost,
    stageBreakdown,
  }
}

export default {
  applyMistakeImmediateConsequence,
  applyCompoundingConsequences,
  getConsequenceSummary,
  generateConsequenceNarrative,
  checkCriticalCondition,
  projectFutureImpact,
}
