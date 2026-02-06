'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Question, QuestionResponse } from '@/src/types/question'
import { Badge } from '@/components/ui/badge'

interface MultipleChoiceQuestionProps {
  question: Question
  onSubmit: (response: QuestionResponse) => Promise<void>
  isSubmitting: boolean
}

export default function MultipleChoiceQuestion({
  question,
  onSubmit,
  isSubmitting
}: MultipleChoiceQuestionProps) {
  const [selectedOption, setSelectedOption] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOption) return

    await onSubmit({
      questionId: question.id,
      responseData: { selectedOptionId: selectedOption },
      answeredAt: new Date()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
        <div className="space-y-3">
          {question.options?.map((option) => (
            <Card
              key={option.id}
              className="p-4 cursor-pointer hover:border-primary transition-colors"
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value={option.id} id={`option-${option.id}`} className="mt-1" />
                <label
                  htmlFor={`option-${option.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium text-foreground">{option.text}</div>
                </label>
              </div>
            </Card>
          ))}
        </div>
      </RadioGroup>

      <Button
        type="submit"
        size="lg"
        disabled={!selectedOption || isSubmitting}
        className="w-full md:w-auto"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
      </Button>
    </form>
  )
}
