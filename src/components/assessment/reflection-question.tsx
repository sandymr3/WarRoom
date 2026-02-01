'use client'

import { useState, ChangeEvent } from 'react'
import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Slider } from '../../../components/ui/slider'
import { MessageSquare, Lightbulb } from 'lucide-react'
import type { Question } from '@/src/types/question'

interface ReflectionQuestionProps {
  question: Question & {
    inputType?: 'slider' | 'text' | 'both'
    min?: number
    max?: number
    contextText?: string
    followUp?: {
      questionText: string
      type: string
    }
  }
  onSubmit: (response: { questionId: string; responseData: any; answeredAt: Date }) => Promise<void>
  isSubmitting: boolean
}

export default function ReflectionQuestion({
  question,
  onSubmit,
  isSubmitting
}: ReflectionQuestionProps) {
  const rawInputType = question.inputType || 'text'
  const inputType = rawInputType as 'text' | 'slider' | 'both'
  const min = question.min ?? 1
  const max = question.max ?? 10
  
  const [rating, setRating] = useState<number>(Math.floor((min + max) / 2))
  const [reflection, setReflection] = useState('')
  const [followUpText, setFollowUpText] = useState('')

  const showSlider = inputType === 'slider' || inputType === 'both'
  const showText = inputType === 'text' || inputType === 'both'

  const handleSubmit = async () => {
    const responseData: any = {
      type: 'text',
      value: reflection,
      wordCount: reflection.split(/\s+/).filter(Boolean).length,
    }
    
    if (showSlider) {
      responseData.rating = rating
    }
    
    if (followUpText && question.followUp) {
      responseData.followUpResponse = followUpText
    }
    
    await onSubmit({
      questionId: question.id,
      responseData,
      answeredAt: new Date()
    })
  }

  const getRatingLabel = (val: number) => {
    const percentage = ((val - min) / (max - min)) * 100
    if (percentage <= 20) return 'Very Low'
    if (percentage <= 40) return 'Low'
    if (percentage <= 60) return 'Moderate'
    if (percentage <= 80) return 'High'
    return 'Very High'
  }

  const isValid = () => {
    if (showText) {
      return reflection.length >= 20
    }
    return true
  }

  return (
    <div className="space-y-6">
      {/* Context display */}
      {question.contextText && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{question.contextText}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Rating slider (if applicable) */}
      {showSlider && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-1">
              {rating}
            </div>
            <div className="text-sm text-muted-foreground">
              {getRatingLabel(rating)}
            </div>
          </div>
          
          <div className="px-4">
            <Slider
              value={[rating]}
              onValueChange={([val]: number[]) => setRating(val)}
              min={min}
              max={max}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Text reflection (if applicable) */}
      {showText && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Your Reflection
            </label>
            <span className="text-xs text-muted-foreground">
              {reflection.length} characters
            </span>
          </div>
          <Textarea
            value={reflection}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReflection(e.target.value)}
            placeholder="Take a moment to reflect honestly..."
            rows={5}
            className="resize-none"
          />
          {reflection.length > 0 && reflection.length < 20 && (
            <p className="text-xs text-amber-500">
              Please write at least 20 characters for a meaningful reflection
            </p>
          )}
        </div>
      )}
      
      {/* Follow-up question */}
      {question.followUp && (
        <div className="space-y-3 pt-4 border-t">
          <label className="text-sm font-medium">
            {question.followUp.questionText}
          </label>
          <Textarea
            value={followUpText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFollowUpText(e.target.value)}
            placeholder="Your answer..."
            rows={3}
            className="resize-none"
          />
        </div>
      )}

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !isValid()}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? 'Submitting...' : 'Continue'}
      </Button>
    </div>
  )
}
