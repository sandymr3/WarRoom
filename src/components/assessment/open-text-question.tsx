'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Question, QuestionResponse } from '@/src/types/question'

interface OpenTextQuestionProps {
  question: Question
  onSubmit: (response: QuestionResponse) => Promise<void>
  isSubmitting: boolean
}

export default function OpenTextQuestion({
  question,
  onSubmit,
  isSubmitting
}: OpenTextQuestionProps) {
  const [response, setResponse] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!response.trim()) return

    await onSubmit({
      questionId: question.id,
      responseData: { 
        type: 'text',
        value: response,
        wordCount: response.trim().split(/\s+/).length
      },
      answeredAt: new Date()
    } as any)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="response" className="text-sm font-medium">
          Your Answer
        </label>
        <Textarea
          id="response"
          placeholder="Share your thoughts here..."
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={6}
          className="mt-2"
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Character count: {response.length} / 500
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={!response.trim() || isSubmitting}
        className="w-full md:w-auto"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
      </Button>
    </form>
  )
}
