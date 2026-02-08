import { CompetencyCode, CompetencyLevel, MistakeCode, StageNumber } from './index'

export type QuestionType = 
  | 'open_text' 
  | 'multiple_choice' 
  | 'scenario' 
  | 'budget_allocation' 
  | 'calculation'
  | 'number_input'
  | 'slider'
  | 'ranking'
  | 'reflection'
  | 'outcome'
  | 'ai_generated_open_text'

export interface Question {
  id: string
  type: QuestionType
  questionText: string
  helpText?: string
  contextText?: string
  scenarioContext?: string
  narrativeIntro?: string
  assess: CompetencyCode[]
  order: number
  
  // Media support
  media?: MediaAsset
  
  // Options for choice-based questions
  options?: QuestionOption[]
  
  // For open text
  minLength?: number
  maxLength?: number
  placeholder?: string
  
  // For numeric inputs
  min?: number
  max?: number
  step?: number
  unit?: string
  inputType?: 'slider' | 'number'
  
  // For budget allocation
  totalBudget?: number
  categories?: BudgetCategory[]
  
  // For calculations
  formula?: string
  inputs?: CalculationInput[]
  
  // Scoring & AI Evaluation
  scoring?: ScoringRubric
  aiEvaluation?: AIEvaluationConfig
  
  // Branching & Conditions
  condition?: QuestionCondition
  branchLogic?: BranchLogic[]
  followUp?: FollowUpQuestion
  
  // Dynamic context
  dynamicContext?: boolean
  isDynamic?: boolean
  generate?: boolean
  basedOnMistakes?: MistakeCode[]
  
  // Time constraints
  timeLimit?: number // in seconds
  
  // Legacy support
  stage?: number
  categoryId?: string
  competencies?: string[]
}

export interface QuestionOption {
  id: string
  text: string
  points?: number
  signal?: string
  achievesLevel?: string
  warning?: string
  note?: string
  insight?: string
  competencyLevel?: string
  stateImpact?: Record<string, any>
  triggersMistake?: MistakeCode
  mistakeName?: string
  consequence?: Record<string, any>
  followUp?: FollowUpQuestion
}

export interface BudgetCategory {
  id: string
  name: string
  description?: string
  minPercentage?: number
  maxPercentage?: number
  recommendedRange?: { min: number; max: number }
  scoringWeight?: number
  recommended?: number
  scoringNote?: string
}

export interface CalculationInput {
  id: string
  label: string
  defaultValue?: number
  min?: number;
  max?: number;
}

export interface ScoringRubric {
  rubric?: RubricLevel[]
  maxPoints?: number
}

export interface RubricLevel {
  criteria: string
  points: number
  description: string
  keywords?: string[]
}

export interface AIEvaluationConfig {
  systemPrompt: string
  lookFor: string[]
  scoringGuidelines?: string
  maxTokens?: number
  temperature?: number
  redFlags?: string[]
  greenFlags?: string[]
  rubric?: any[]
}

export interface QuestionCondition {
  type: 'previous_answer' | 'state_check' | 'mistake_triggered' | 'competency_level'
  questionId?: string
  answerIds?: string[]
  stateKey?: string
  stateValue?: any
  mistakeCode?: MistakeCode
  competencyCode?: CompetencyCode
  levelRequired?: CompetencyLevel
}

export interface BranchLogic {
  condition: QuestionCondition
  goToQuestionId: string
  skipQuestions?: string[]
}

export interface FollowUpQuestion {
  id?: string
  condition?: 'always' | 'specific_answer'
  answerTrigger?: string[]
  questionText: string
  type: QuestionType
  assess?: CompetencyCode[]
  minLength?: number
  maxLength?: number
  options?: QuestionOption[]
}

export interface QuestionResponse {
  id?: string
  assessmentId: string
  questionId: string
  stageNumber: StageNumber
  responseType: QuestionType
  responseData: ResponseData
  aiEvaluation?: AIEvaluationResult
  preWrittenRemark?: string
  pointsAwarded: number
  competenciesAssessed: CompetencyCode[]
  mistakesTriggered?: MistakeCode[]
  answeredAt: Date
  responseTimeSeconds: number
}

export type ResponseData = 
  | TextResponseData
  | ChoiceResponseData
  | BudgetResponseData
  | CalculationResponseData
  | NumericResponseData

export interface TextResponseData {
  type: 'text'
  value: string
  wordCount?: number
}

export interface ChoiceResponseData {
  type: 'choice'
  selectedOptionId: string
  selectedOptionIds?: string[]
}

export interface BudgetResponseData {
  type: 'budget'
  allocations: Record<string, number> | { categoryId: string; amount: number; percentage: number }[]
  totalAllocated?: number
}

export interface CalculationResponseData {
  type: 'calculation'
  inputs: Record<string, number>
  result: number
  formula: string
}

export interface NumericResponseData {
  type: 'numeric'
  value: number
}

export interface AIEvaluationResult {
  score: number
  maxScore: number
  feedback: string
  criteriaMatched: string[]
  strengths: string[]
  areasForImprovement: string[]
  evaluatedAt: Date
  modelUsed: string
}

export interface MediaAsset {
  type: 'image' | 'video' | 'audio' | 'none'
  url: string | null
  altText?: string
  transcript?: string
  thumbnailUrl?: string
  duration?: number
}