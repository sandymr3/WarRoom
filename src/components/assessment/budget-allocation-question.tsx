'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Question, QuestionResponse } from '@/src/types/question'
import { Badge } from '@/components/ui/badge'

interface BudgetAllocationQuestionProps {
  question: Question
  onSubmit: (response: QuestionResponse) => Promise<void>
  isSubmitting: boolean
}

interface BudgetItem {
  id: string
  name: string
  percent: number
}

export default function BudgetAllocationQuestion({
  question,
  onSubmit,
  isSubmitting
}: BudgetAllocationQuestionProps) {
  const categories = [
    { id: 'product', name: 'Product Development' },
    { id: 'marketing', name: 'Marketing & Sales' },
    { id: 'operations', name: 'Operations' },
    { id: 'team', name: 'Team & Hiring' }
  ]

  const [allocation, setAllocation] = useState<BudgetItem[]>(
    categories.map((cat) => ({ ...cat, percent: 0 }))
  )

  const totalPercent = allocation.reduce((sum, item) => sum + item.percent, 0)
  const isValid = totalPercent === 100

  const handleChange = (id: string, value: number) => {
    setAllocation((prev) =>
      prev.map((item) => (item.id === id ? { ...item, percent: value } : item))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    await onSubmit({
      questionId: question.id,
      responseData: {
        allocation: allocation.reduce((acc, item) => ({ ...acc, [item.id]: item.percent }), {})
      },
      answeredAt: new Date()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-muted p-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">$50,000</div>
          <p className="text-sm text-muted-foreground mt-1">Total Budget</p>
        </div>
      </Card>

      <div className="space-y-4">
        {allocation.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-foreground">{item.name}</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={item.percent}
                  onChange={(e) => handleChange(item.id, Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  disabled={isSubmitting}
                  className="w-20 text-center"
                />
                <span className="text-sm font-medium">%</span>
              </div>
            </div>
            <div className="w-full bg-border rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <span className="font-medium">Total Allocated</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">{totalPercent}%</span>
          {!isValid && (
            <Badge variant="destructive">Must equal 100%</Badge>
          )}
          {isValid && (
            <Badge variant="default" className="bg-green-600">Valid</Badge>
          )}
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={!isValid || isSubmitting}
        className="w-full md:w-auto"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
      </Button>
    </form>
  )
}
