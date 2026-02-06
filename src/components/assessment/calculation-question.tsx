'use client'

import { useState, ChangeEvent } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent } from '../../../components/ui/card'
import { AlertCircle, Calculator } from 'lucide-react'
import type { Question } from '@/src/types/question'

interface InputConfig {
  id: string
  label: string
  defaultValue?: number
  min?: number
  max?: number
  suggestedValue?: number | string
}

interface CalculationConfig {
  components?: Array<{
    label: string
    suggestedValue?: number | string
  }>
  formula?: string
  unit?: string
  tolerance?: number
}

interface CalculationQuestionProps {
  question: Question & {
    formula?: string
    inputs?: InputConfig[]
    calculation?: CalculationConfig
    unit?: string
    contextText?: string
  }
  onSubmit: (response: { questionId: string; responseData: any; answeredAt: Date }) => Promise<void>
  isSubmitting: boolean
}

export default function CalculationQuestion({
  question,
  onSubmit,
  isSubmitting
}: CalculationQuestionProps) {
  // Support both old format (inputs) and new format (calculation.components)
  const rawInputs = question.inputs || 
    question.calculation?.components?.map((comp, idx) => ({
      id: `input_${idx}`,
      label: comp.label,
      defaultValue: typeof comp.suggestedValue === 'number' ? comp.suggestedValue : 0,
      suggestedValue: comp.suggestedValue
    })) || []
  
  // If no inputs defined, create a single input for direct entry
  const inputs: InputConfig[] = rawInputs.length > 0 ? rawInputs : [
    { id: 'result', label: 'Your Answer', defaultValue: 0 }
  ]
  
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    inputs.forEach(input => {
      initial[input.id] = input.defaultValue ?? 0
    })
    return initial
  })
  
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (inputId: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setValues(prev => ({ ...prev, [inputId]: numValue }))
    setResult(null) // Reset result when inputs change
    setError(null)
  }

  const calculateResult = () => {
    try {
      setError(null)
      
      const formula = question.formula || question.calculation?.formula || 'sum_of_components'
      let calculatedResult: number
      
      if (formula === 'sum_of_components') {
        // Sum all input values
        calculatedResult = Object.values(values).reduce((sum, val) => sum + val, 0)
      } else if (inputs.length === 1 && inputs[0].id === 'result') {
        // Direct entry mode - just use the entered value
        calculatedResult = values['result']
      } else {
        // Custom formula - replace placeholders and evaluate
        let evalFormula = formula
        Object.entries(values).forEach(([key, value]) => {
          evalFormula = evalFormula.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
        })
        
        // eslint-disable-next-line no-eval
        calculatedResult = eval(evalFormula)
      }
      
      if (isNaN(calculatedResult) || !isFinite(calculatedResult)) {
        throw new Error('Invalid calculation')
      }
      
      setResult(Math.round(calculatedResult * 100) / 100)
    } catch (err) {
      setError('Unable to calculate. Please check your inputs.')
      setResult(null)
    }
  }

  const handleSubmit = async () => {
    if (result === null) {
      calculateResult()
      return
    }
    
    await onSubmit({
      questionId: question.id,
      responseData: {
        type: 'calculation',
        inputs: values,
        result,
        formula: question.formula || question.calculation?.formula || 'sum_of_components',
      },
      answeredAt: new Date()
    })
  }

  const unit = question.unit || question.calculation?.unit || ''
  const isCurrencyUnit = !unit || unit.toLowerCase() === 'dollars' || unit.toLowerCase() === 'usd' || unit === '$'
  const showDollarSign = isCurrencyUnit

  return (
    <div className="space-y-6">
      {/* Context if present */}
      {question.contextText && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <p className="text-sm whitespace-pre-line">{question.contextText}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Input fields */}
      <div className="space-y-4">
        {inputs.map(input => (
          <div key={input.id} className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              {input.label}
            </label>
            <div className="relative">
              {showDollarSign && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
              )}
              <Input
                type="number"
                value={values[input.id]}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(input.id, e.target.value)}
                min={input.min ?? 0}
                max={input.max}
                className={showDollarSign ? "pl-7 pr-12" : "pr-16"}
                placeholder="0"
              />
              {unit && !isCurrencyUnit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Calculate button */}
      {result === null && (
        <Button
          onClick={calculateResult}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <Calculator className="mr-2 h-4 w-4" />
          Calculate
        </Button>
      )}
      
      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {/* Result display */}
      {result !== null && (
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Your Result</p>
              <p className="text-4xl font-bold text-primary">
                {showDollarSign ? '$' : ''}{result.toLocaleString()}
                {unit && !isCurrencyUnit && <span className="text-lg ml-1">{unit}</span>}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || (result === null && inputs.length > 0)}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? 'Submitting...' : result === null ? 'Calculate First' : 'Continue'}
      </Button>
    </div>
  )
}
