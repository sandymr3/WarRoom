export type QuestionType = 
  | 'open_text' 
  | 'multiple_choice' 
  | 'scenario' 
  | 'budget_allocation'
  | 'calculation'
  | 'slider'
  | 'number_input'
  | 'reflection'
  | 'outcome'

export interface QuestionOption {
  id: string
  text: string
  points?: number
  warning?: string
  insight?: string
  competencyLevel?: string
  stateImpact?: Record<string, any>
  triggersMistake?: string
  mistakeName?: string
  followUp?: FollowUpQuestion
}

export interface FollowUpQuestion {
  id: string
  type: QuestionType
  questionText: string
  options?: QuestionOption[]
}

export interface Question {
  id: string
  type: QuestionType
  questionText: string
  helpText?: string
  contextText?: string
  narrativeIntro?: string
  stage?: number
  order?: number
  assess?: string[]
  isRequired?: boolean
  isDynamic?: boolean
  generate?: boolean  // When true, use AI to adapt question to user's business context
  options?: QuestionOption[]
  categoryId?: string
  competencies?: string[]
  scenario?: {
    context?: string
    stakes?: string
  }
  scoring?: {
    rubric?: any[]
    maxPoints?: number
  }
  aiEvaluation?: {
    systemPrompt?: string
    redFlags?: string[]
    greenFlags?: string[]
    rubric?: any[]
  }
  minLength?: number
  maxLength?: number
  placeholder?: string
  // Budget allocation specific
  totalBudget?: number
  categories?: BudgetCategory[]
  // Slider specific
  min?: number
  max?: number
  step?: number
  unit?: string
}

export interface BudgetCategory {
  id: string
  name: string
  description?: string
  recommended?: number
  scoringNote?: string
}

export interface QuestionResponse {
  questionId: string
  responseData: {
    type?: 'text' | 'choice' | 'budget' | 'calculation' | 'numeric'
    value?: string | number
    selectedOptionId?: string
    allocations?: Record<string, number>
  }
  answeredAt: Date
}
