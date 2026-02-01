/**
 * Question Engine Service
 * Handles question loading, branching logic, and sequencing
 */

import stageNeg2 from '@/src/lib/data/stages/stage-neg2.json'
import stageNeg1 from '@/src/lib/data/stages/stage-neg1.json'
import stage0 from '@/src/lib/data/stages/stage-0.json'
import stage1 from '@/src/lib/data/stages/stage-1.json'
import stage2 from '@/src/lib/data/stages/stage-2.json'
import stage3 from '@/src/lib/data/stages/stage-3.json'
import type { 
  Question, 
  StageNumber, 
  StageConfig, 
  QuestionResponse,
  FullAssessmentState,
  MistakeCode 
} from '@/src/types'

// Stage data map
const stageDataMap: Record<StageNumber, StageConfig> = {
  [-2]: stageNeg2 as unknown as StageConfig,
  [-1]: stageNeg1 as unknown as StageConfig,
  [0]: stage0 as unknown as StageConfig,
  [1]: stage1 as unknown as StageConfig,
  [2]: stage2 as unknown as StageConfig,
  [3]: stage3 as unknown as StageConfig,
}

/**
 * Get stage configuration by stage number
 */
export function getStageConfig(stageNumber: StageNumber): StageConfig {
  const config = stageDataMap[stageNumber]
  if (!config) {
    throw new Error(`Stage ${stageNumber} not found`)
  }
  return config
}

/**
 * Get all questions for a stage
 */
export function getStageQuestions(stageNumber: StageNumber): Question[] {
  const config = getStageConfig(stageNumber)
  return config.questions.sort((a, b) => a.order - b.order)
}

/**
 * Get a specific question by ID
 */
export function getQuestionById(questionId: string): Question | null {
  for (const stageNumber of [-2, -1, 0, 1, 2, 3] as StageNumber[]) {
    const questions = getStageQuestions(stageNumber)
    const question = questions.find(q => q.id === questionId)
    if (question) {
      return question
    }
  }
  return null
}

/**
 * Get the next question based on branching logic and state
 */
export function getNextQuestion(
  currentQuestionId: string,
  stageNumber: StageNumber,
  responses: QuestionResponse[],
  state: FullAssessmentState
): Question | null {
  const questions = getStageQuestions(stageNumber)
  const currentIndex = questions.findIndex(q => q.id === currentQuestionId)
  
  if (currentIndex === -1) {
    return questions[0] || null
  }
  
  const currentQuestion = questions[currentIndex]
  
  // Check for branch logic on current question
  if (currentQuestion.branchLogic) {
    for (const branch of currentQuestion.branchLogic) {
      if (evaluateCondition(branch.condition, responses, state)) {
        const targetQuestion = questions.find(q => q.id === branch.goToQuestionId)
        if (targetQuestion) {
          return targetQuestion
        }
      }
    }
  }
  
  // Get the last response to check for follow-up
  const lastResponse = responses.find(r => r.questionId === currentQuestionId)
  if (lastResponse && currentQuestion.followUp) {
    // Follow-up questions are handled in the response flow
    // Return null to indicate we need to show follow-up first
  }
  
  // Find next applicable question
  for (let i = currentIndex + 1; i < questions.length; i++) {
    const nextQuestion = questions[i]
    
    // Check if question has a condition
    if (nextQuestion.condition) {
      if (evaluateCondition(nextQuestion.condition, responses, state)) {
        return nextQuestion
      }
      // Skip this question if condition not met
      continue
    }
    
    return nextQuestion
  }
  
  // No more questions in this stage
  return null
}

/**
 * Evaluate a question condition
 */
function evaluateCondition(
  condition: Question['condition'],
  responses: QuestionResponse[],
  state: FullAssessmentState
): boolean {
  if (!condition) return true
  
  switch (condition.type) {
    case 'previous_answer': {
      const response = responses.find(r => r.questionId === condition.questionId)
      if (!response) return false
      if (response.responseData.type === 'choice') {
        return condition.answerIds?.includes(response.responseData.selectedOptionId) ?? false
      }
      return false
    }
    
    case 'state_check': {
      if (!condition.stateKey) return false
      const value = getNestedValue(state, condition.stateKey)
      return value === condition.stateValue
    }
    
    case 'mistake_triggered': {
      return state.mistakesTriggered.includes(condition.mistakeCode as MistakeCode)
    }
    
    case 'competency_level': {
      // Would need competency scores to evaluate
      // For now, return true
      return true
    }
    
    default:
      return true
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Interpolate dynamic content in question text
 */
export function interpolateQuestionText(
  text: string,
  state: FullAssessmentState
): string {
  // Replace {{state.xxx}} with actual values
  return text.replace(/\{\{state\.([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(state, path)
    if (value === undefined || value === null) {
      return 'N/A'
    }
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    return String(value)
  })
}

/**
 * Process dynamic context in scenario questions
 */
export function processScenarioContext(
  question: Question,
  state: FullAssessmentState
): string {
  if (!question.scenarioContext) return ''
  
  let context = question.scenarioContext
  
  // Handle conditional blocks {{#if hasMistake_XX}}...{{/if}}
  context = context.replace(
    /\{\{#if hasMistake_([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (match, mistakeCode, content) => {
      return state.mistakesTriggered.includes(mistakeCode as MistakeCode) ? content : ''
    }
  )
  
  // Handle {{#if hasManyMistakes}}
  context = context.replace(
    /\{\{#if hasManyMistakes\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (match, content) => {
      return state.mistakesTriggered.length >= 2 ? content : ''
    }
  )
  
  // Handle {{#if fewMistakes}}
  context = context.replace(
    /\{\{#if fewMistakes\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (match, content) => {
      return state.mistakesTriggered.length === 1 ? content : ''
    }
  )
  
  // Handle {{#if noMistakes}}
  context = context.replace(
    /\{\{#if noMistakes\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (match, content) => {
      return state.mistakesTriggered.length === 0 ? content : ''
    }
  )
  
  // Interpolate remaining state values
  context = interpolateQuestionText(context, state)
  
  return context.trim()
}

/**
 * Check if stage is complete
 */
export function isStageComplete(
  stageNumber: StageNumber,
  responses: QuestionResponse[]
): boolean {
  const questions = getStageQuestions(stageNumber)
  const stageResponses = responses.filter(r => r.stageNumber === stageNumber)
  
  // Check if all required questions have been answered
  const requiredQuestions = questions.filter(q => !q.condition)
  return requiredQuestions.every(q => 
    stageResponses.some(r => r.questionId === q.id)
  )
}

/**
 * Get stage progress
 */
export function getStageProgress(
  stageNumber: StageNumber,
  responses: QuestionResponse[]
): { answered: number; total: number; percentage: number } {
  const questions = getStageQuestions(stageNumber)
  const stageResponses = responses.filter(r => r.stageNumber === stageNumber)
  
  const answered = stageResponses.length
  const total = questions.length
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0
  
  return { answered, total, percentage }
}

/**
 * Get all stage definitions
 */
export function getAllStages(): { number: StageNumber; name: string; title: string }[] {
  return ([-2, -1, 0, 1, 2, 3] as StageNumber[]).map(num => {
    const config = getStageConfig(num)
    return {
      number: num,
      name: config.stage.name,
      title: config.stage.title,
    }
  })
}

/**
 * Get the first question of a stage
 */
export function getFirstQuestionOfStage(stageNumber: StageNumber): Question | null {
  const questions = getStageQuestions(stageNumber)
  return questions[0] || null
}

/**
 * Get the next stage number
 */
export function getNextStage(currentStage: StageNumber): StageNumber | null {
  const stages: StageNumber[] = [-2, -1, 0, 1, 2, 3]
  const currentIndex = stages.indexOf(currentStage)
  
  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return null
  }
  
  return stages[currentIndex + 1]
}

export default {
  getStageConfig,
  getStageQuestions,
  getQuestionById,
  getNextQuestion,
  interpolateQuestionText,
  processScenarioContext,
  isStageComplete,
  getStageProgress,
  getAllStages,
  getFirstQuestionOfStage,
  getNextStage,
}
