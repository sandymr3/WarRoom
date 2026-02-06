'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Eye, ChevronRight } from 'lucide-react'
import type { QuestionResponse } from '@/src/types'
import { getQuestionById } from '@/src/lib/services/question-engine'

interface AnswersModalProps {
  responses: QuestionResponse[]
  onNavigateToQuestion?: (questionId: string) => void
}

export function AnswersModal({ responses, onNavigateToQuestion }: AnswersModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getAnswerDisplay = (response: QuestionResponse): string => {
    const data = response.responseData as any
    
    if (!data) return 'No answer recorded'
    
    // Handle different response types
    if (data.type === 'choice' && data.selectedOptionId) {
      const question = getQuestionById(response.questionId)
      const option = question?.options?.find((o: any) => o.id === data.selectedOptionId)
      return option?.text || `Option ${data.selectedOptionId}`
    }
    
    if (data.text) return data.text
    if (data.value !== undefined) return String(data.value)
    if (data.result !== undefined) return String(data.result)
    if (data.allocation) {
      return Object.entries(data.allocation)
        .map(([key, val]) => `${key}: ${val}%`)
        .join(', ')
    }
    
    return JSON.stringify(data)
  }

  const getQuestionText = (questionId: string): string => {
    const question = getQuestionById(questionId)
    return question?.questionText || questionId
  }

  if (responses.length === 0) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Eye className="h-4 w-4 mr-2" />
          View My Answers ({responses.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Your Answers</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {responses.map((response, index) => (
              <Card key={response.questionId} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Q{index + 1}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {response.questionId}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {getQuestionText(response.questionId)}
                    </p>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Your Answer:</p>
                      <p className="text-sm font-medium mt-1">
                        {getAnswerDisplay(response)}
                      </p>
                    </div>
                  </div>
                  {onNavigateToQuestion && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onNavigateToQuestion(response.questionId)
                        setIsOpen(false)
                      }}
                    >
                      Edit
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default AnswersModal
