'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Question, QuestionOption, MistakeCode } from '@/src/types'
import { AlertCircle, Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExtendedOption extends Omit<QuestionOption, 'triggersMistake'> {
  points?: number
  competencyLevel?: string
  insight?: string
  warning?: string
  stateImpact?: Record<string, any>
  triggersMistake?: MistakeCode | string
}

interface ScenarioQuestionProps {
  question: Question & { 
    scenario?: { context?: string; stakes?: string }
    narrativeIntro?: string
    options?: ExtendedOption[]
    branches?: {
      ifProfitable?: { questionText: string; options: ExtendedOption[] }
      ifUnprofitable?: { questionText: string; options: ExtendedOption[] }
    }
    isDynamic?: boolean
  }
  onSubmit: (response: any) => Promise<void>
  isSubmitting: boolean
  showConsequencePreview?: boolean
}

export default function ScenarioQuestion({
  question,
  onSubmit,
  isSubmitting,
  showConsequencePreview = true
}: ScenarioQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // Determine which options to use - handle branched questions
  // For branched questions, default to "ifProfitable" branch options (user can be shown either based on their state)
  const effectiveOptions: ExtendedOption[] = question.options 
    || question.branches?.ifProfitable?.options 
    || question.branches?.ifUnprofitable?.options 
    || []

  const selectedOptionData = effectiveOptions.find(opt => opt.id === selectedOption) as ExtendedOption | undefined
  const hoveredOptionData = effectiveOptions.find(opt => opt.id === hoveredOption) as ExtendedOption | undefined

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId)
    setShowConfirm(true)
  }

  const handleSubmit = async () => {
    if (!selectedOption) return

    await onSubmit({
      questionId: question.id,
      responseData: { 
        type: 'choice',
        selectedOptionId: selectedOption 
      },
      answeredAt: new Date()
    })
  }

  const handleBack = () => {
    setShowConfirm(false)
    setSelectedOption(null)
  }

  const getOptionStyle = (option: ExtendedOption, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) {
      return 'border-primary bg-primary/5 ring-2 ring-primary/20'
    }
    if (isHovered) {
      return 'border-primary/50 bg-muted/50'
    }
    return 'border-border hover:border-primary/50'
  }

  return (
    <div className="space-y-6">
      {/* Narrative intro */}
      {question.narrativeIntro && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pb-6 border-b border-border"
        >
          <p className="text-lg text-muted-foreground italic">
            "{question.narrativeIntro}"
          </p>
        </motion.div>
      )}

      {/* Scenario context box */}
      {question.scenario && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-6"
        >
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="space-y-2">
              {question.scenario.context && (
                <p className="text-foreground leading-relaxed">
                  {question.scenario.context}
                </p>
              )}
              {question.scenario.stakes && (
                <div className="flex items-start gap-2 mt-3 pt-3 border-t border-blue-500/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                    Stakes: {question.scenario.stakes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!showConfirm ? (
          /* Options selection view */
          <motion.div
            key="options"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4"
          >
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              What would you do?
            </p>
            
            <div className="grid gap-3">
              {effectiveOptions.map((option, index) => {
                const extOption = option as ExtendedOption
                const isSelected = selectedOption === option.id
                const isHovered = hoveredOption === option.id
                
                return (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={cn(
                        'p-4 cursor-pointer transition-all duration-200',
                        getOptionStyle(extOption, isSelected, isHovered)
                      )}
                      onClick={() => handleOptionSelect(option.id)}
                      onMouseEnter={() => setHoveredOption(option.id)}
                      onMouseLeave={() => setHoveredOption(null)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Option letter */}
                        <div className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors',
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                          {option.id}
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-medium text-foreground leading-relaxed">
                            {option.text}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

          </motion.div>
        ) : (
          /* Confirmation view */
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                You've chosen
              </p>
              <Card className="p-6 border-primary bg-primary/5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {selectedOptionData?.id}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">
                      {selectedOptionData?.text}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Change Decision
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="group"
              >
                {isSubmitting ? (
                  'Processing...'
                ) : (
                  <>
                    Confirm Decision
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
