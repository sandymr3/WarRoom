'use client'

import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { TrendingUp, TrendingDown, Users, DollarSign, MessageSquare, ArrowRight } from 'lucide-react'
import type { Question } from '@/src/types/question'

interface OutcomeMetrics {
  customers?: string | number
  revenue?: string | number
  cac?: string | number
  burnRate?: string | number
  runway?: string | number
  [key: string]: string | number | undefined
}

interface CustomerFeedback {
  positive?: string[]
  negative?: string[]
  neutral?: string[]
}

interface DecisionOption {
  id: string
  text: string
  points?: number
  competencyLevel?: string
  insight?: string
  warning?: string
  stateImpact?: Record<string, unknown>
}

interface OutcomeQuestionProps {
  question: Question & {
    outcome?: {
      dynamicDisplay?: boolean
      metrics?: OutcomeMetrics
      customerFeedback?: CustomerFeedback
    }
    decisionRequired?: {
      questionText: string
      options: DecisionOption[]
    }
  }
  onSubmit: (response: { questionId: string; responseData: any; answeredAt: Date }) => Promise<void>
  isSubmitting: boolean
}

export default function OutcomeQuestion({
  question,
  onSubmit,
  isSubmitting
}: OutcomeQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  
  const outcome = question.outcome
  const decision = question.decisionRequired
  const metrics = outcome?.metrics || {}
  const feedback = outcome?.customerFeedback

  const handleSubmit = async () => {
    if (!selectedOption && decision) return
    
    const selectedDecision = decision?.options.find(o => o.id === selectedOption)
    
    await onSubmit({
      questionId: question.id,
      responseData: {
        type: 'outcome',
        metrics: metrics,
        selectedOptionId: selectedOption,
        selectedOptionText: selectedDecision?.text,
        stateImpact: selectedDecision?.stateImpact
      },
      answeredAt: new Date()
    })
  }

  // Format metric value for display
  const formatMetric = (value: string | number | undefined): string => {
    if (value === undefined) return '—'
    if (typeof value === 'number') {
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
      return value.toString()
    }
    // Handle template strings like {{calculated_customers}}
    if (value.includes('{{')) return '—'
    return value
  }

  return (
    <div className="space-y-6">
      {/* Metrics Display */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(metrics).map(([key, value]) => {
          const formattedValue = formatMetric(value)
          const isPositive = typeof value === 'number' && value > 0
          const Icon = key.toLowerCase().includes('customer') ? Users : DollarSign
          
          return (
            <Card key={key} className="bg-muted/50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <p className="text-xl font-bold">{formattedValue}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Customer Feedback */}
      {feedback && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Customer Feedback</h3>
            </div>
            
            <div className="space-y-4">
              {feedback.positive && feedback.positive.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Positive</span>
                  </div>
                  <ul className="space-y-1">
                    {feedback.positive.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground pl-6">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {feedback.negative && feedback.negative.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">Concerns</span>
                  </div>
                  <ul className="space-y-1">
                    {feedback.negative.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground pl-6">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {feedback.neutral && feedback.neutral.length > 0 && (
                <div>
                  <ul className="space-y-1">
                    {feedback.neutral.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground pl-6">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision Required */}
      {decision && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{decision.questionText}</h3>
          
          <div className="space-y-3">
            {decision.options.map((option) => (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all ${
                  selectedOption === option.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedOption(option.id)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedOption === option.id
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {selectedOption === option.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{option.text}</p>
                      {option.insight && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {option.insight}
                        </Badge>
                      )}
                      {option.warning && (
                        <Badge variant="destructive" className="mt-2 text-xs">
                          {option.warning}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || (decision && !selectedOption)}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? 'Submitting...' : (
          <>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}
