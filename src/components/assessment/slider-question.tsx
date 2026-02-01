'use client'

import { useState, ChangeEvent } from 'react'
import { Button } from '../../../components/ui/button'
import { Slider } from '../../../components/ui/slider'
import { Textarea } from '../../../components/ui/textarea'
import { Card, CardContent } from '../../../components/ui/card'
import type { Question } from '@/src/types/question'

interface SliderQuestionProps {
  question: Question & {
    min?: number
    max?: number
    step?: number
    unit?: string
    contextText?: string
    followUp?: {
      questionText: string
      type: string
    }
  }
  onSubmit: (response: { questionId: string; responseData: any; answeredAt: Date }) => Promise<void>
  isSubmitting: boolean
}

export default function SliderQuestion({
  question,
  onSubmit,
  isSubmitting
}: SliderQuestionProps) {
  const min = question.min ?? 1
  const max = question.max ?? 10
  const step = question.step ?? 1
  
  const [value, setValue] = useState<number>(Math.floor((min + max) / 2))
  const [followUpText, setFollowUpText] = useState('')
  const [showFollowUp, setShowFollowUp] = useState(false)

  const handleSliderChange = (newValue: number[]) => {
    setValue(newValue[0])
    if (question.followUp && !showFollowUp) {
      setShowFollowUp(true)
    }
  }

  const handleSubmit = async () => {
    const responseData: any = {
      type: 'numeric',
      value,
    }
    
    // Include follow-up if present
    if (followUpText && question.followUp) {
      responseData.followUpResponse = followUpText
    }
    
    await onSubmit({
      questionId: question.id,
      responseData,
      answeredAt: new Date()
    })
  }

  const getSliderLabel = (val: number) => {
    // Custom labels for different scales
    if (max === 10) {
      if (val <= 2) return 'Not Ready'
      if (val <= 4) return 'Needs Work'
      if (val <= 6) return 'Developing'
      if (val <= 8) return 'Ready'
      return 'Highly Ready'
    }
    return `${val}${question.unit ? ` ${question.unit}` : ''}`
  }

  return (
    <div className="space-y-8">
      {/* Context text if present */}
      {question.contextText && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <p className="text-sm whitespace-pre-line">{question.contextText}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Slider section */}
      <div className="space-y-6">
        {/* Current value display */}
        <div className="text-center">
          <div className="text-5xl font-bold text-primary mb-2">
            {value}
          </div>
          <div className="text-lg text-muted-foreground">
            {getSliderLabel(value)}
          </div>
        </div>
        
        {/* Slider */}
        <div className="px-4">
          <Slider
            value={[value]}
            onValueChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            className="w-full"
          />
          
          {/* Scale labels */}
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      </div>
      
      {/* Follow-up question if applicable */}
      {showFollowUp && question.followUp && (
        <div className="space-y-4 pt-4 border-t">
          <label className="block text-sm font-medium text-foreground">
            {question.followUp.questionText}
          </label>
          <Textarea
            value={followUpText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFollowUpText(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            className="resize-none"
          />
        </div>
      )}

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? 'Submitting...' : 'Continue'}
      </Button>
    </div>
  )
}
