'use client'

import { Question, QuestionResponse } from '@/src/types/question'
import { AssessmentState } from '@/src/types/state'
import OpenTextQuestion from './open-text-question'
import MultipleChoiceQuestion from './multiple-choice-question'
import ScenarioQuestion from './scenario-question'
import BudgetAllocationQuestion from './budget-allocation-question'
import SliderQuestion from './slider-question'
import CalculationQuestion from './calculation-question'
import ReflectionQuestion from './reflection-question'
import OutcomeQuestion from './outcome-question'

interface QuestionRendererProps {
  question: Question
  onSubmit: (response: QuestionResponse) => Promise<void>
  isSubmitting: boolean
  state?: AssessmentState
  responses?: any[]
}

// Interpolate template variables in text
function interpolateText(text: string, state?: AssessmentState, responses?: any[]): string {
  if (!text || !text.includes('{{')) return text
  
  // Calculate derived values from state and responses
  const values: Record<string, string | number> = {}
  
  if (state) {
    // Financial metrics
    values.capital = state.financial.capital
    values.burnRate = state.financial.burnRate
    values.monthlyRevenue = state.financial.monthlyRevenue
    values.runway = state.financial.runwayMonths
    values.runwayMonths = state.financial.runwayMonths
    
    // Customer metrics
    values.customers = state.customers.total
    values.total_customers = state.customers.total
    values.retention = state.customers.retention
    
    // Team metrics
    values.team_size = state.team.size
    values.satisfaction = state.team.satisfaction
    
    // Calculate derived metrics
    const arpc = state.customers.total > 0 
      ? Math.round(state.financial.monthlyRevenue / state.customers.total) 
      : 200 // Default ARPC
    values.arpc = arpc
    
    // Calculate CAC from responses if available
    const marketingSpend = 5000 // Default from scenario
    const newCustomers = state.customers.total || 50
    const cac = Math.round(marketingSpend / newCustomers)
    values.cac = cac
    
    // Calculate margin
    const margin = arpc > cac ? Math.round(((arpc - cac) / arpc) * 100) : 0
    values.margin = margin
    
    // Determine profitability status
    values.profitability_status = arpc > cac ? 'profitable per customer' : 'losing money per customer'
  }
  
  // Replace all {{variable}} patterns
  return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    const key = variable.trim()
    if (key in values) {
      return String(values[key])
    }
    // Try to evaluate simple expressions
    if (key.includes('*') || key.includes('/') || key.includes('+') || key.includes('-')) {
      try {
        // Replace variable names in expression with values
        let expr = key
        Object.entries(values).forEach(([k, v]) => {
          expr = expr.replace(new RegExp(k, 'g'), String(v))
        })
        const result = eval(expr)
        return String(Math.round(result))
      } catch {
        return match
      }
    }
    return match // Keep original if not found
  })
}

export default function QuestionRenderer({
  question,
  onSubmit,
  isSubmitting,
  state,
  responses
}: QuestionRendererProps) {
  // Interpolate template variables in question text
  const interpolatedQuestion = {
    ...question,
    questionText: interpolateText(question.questionText, state, responses),
    helpText: question.helpText ? interpolateText(question.helpText, state, responses) : undefined,
    narrativeIntro: (question as any).narrativeIntro 
      ? interpolateText((question as any).narrativeIntro, state, responses) 
      : undefined
  }
  
  const renderQuestion = () => {
    switch (interpolatedQuestion.type) {
      case 'open_text':
        return (
          <OpenTextQuestion
            question={interpolatedQuestion}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        )

      case 'multiple_choice':
        return (
          <MultipleChoiceQuestion
            question={interpolatedQuestion}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        )

      case 'scenario':
        return (
          <ScenarioQuestion
            question={interpolatedQuestion}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        )

      case 'budget_allocation':
        return (
          <BudgetAllocationQuestion
            question={interpolatedQuestion}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        )

      case 'slider':
      case 'number_input':
        return (
          <SliderQuestion
            question={interpolatedQuestion as any}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        )

      case 'calculation':
        return (
          <CalculationQuestion
            question={interpolatedQuestion as any}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        )

      case 'reflection':
        return (
          <ReflectionQuestion
            question={interpolatedQuestion as any}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        )

      case 'outcome':
        return (
          <OutcomeQuestion
            question={interpolatedQuestion as any}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        )

      default:
        return <div className="text-muted-foreground">Unknown question type: {interpolatedQuestion.type}</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Question header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-muted-foreground">Question {interpolatedQuestion.id}</span>
          {interpolatedQuestion.stage !== undefined && (
            <span className="badge-primary">
              {interpolatedQuestion.stage >= 0 ? `Stage ${interpolatedQuestion.stage}` : `Pre-Stage ${Math.abs(interpolatedQuestion.stage)}`}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-foreground">{interpolatedQuestion.questionText}</h2>
        {interpolatedQuestion.helpText && (
          <p className="mt-3 text-sm text-muted-foreground">{interpolatedQuestion.helpText}</p>
        )}
      </div>

      {/* Question content */}
      <div>{renderQuestion()}</div>
    </div>
  )
}
