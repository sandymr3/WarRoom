'use client'

import { Loader2, AlertTriangle, MessageSquare, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { FadeInUp } from '@/src/components/AnimatedComponents'
import type { SimOption } from '@/src/types'

interface DynamicScenarioData {
  questionText: string
  options: SimOption[] | string
  [key: string]: unknown
}

interface DynamicScenarioQuestionProps {
  loadingScenario: boolean
  dynamicScenario: DynamicScenarioData | null
  dynamicScenarioError: string
  selectedOptionId?: string
  loadingFollowup?: boolean
  followupScenario?: { question: string } | null
  followupError?: string
  followupText?: string
  onSelect: (opt: SimOption) => void
  onConfirmDecision: (opt: SimOption) => void
  onTextChange: (text: string) => void
  onRetryScenario: () => void
  onRetryFollowup: (opt: SimOption) => void
  questionId: string
}

export function DynamicScenarioQuestion({
  loadingScenario, dynamicScenario, dynamicScenarioError, selectedOptionId,
  loadingFollowup, followupScenario, followupError, followupText,
  onSelect, onConfirmDecision, onTextChange, onRetryScenario, onRetryFollowup,
}: DynamicScenarioQuestionProps) {
  if (loadingScenario) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground italic">AI is generating a custom scenario based on your journey...</p>
      </div>
    )
  }

  if (!dynamicScenario) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="dynamic-scenario-border rounded-xl">
          <div className="p-5 text-sm text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-[color:var(--color-warroom-crimson-bright,#8e3644)]" />
            <p className="text-[color:var(--color-warroom-crimson-bright,#8e3644)]">{dynamicScenarioError || 'Failed to generate scenario.'}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onRetryScenario}>Retry scenario generation</Button>
      </div>
    )
  }

  const options: SimOption[] = typeof dynamicScenario.options === 'string' ? JSON.parse(dynamicScenario.options || '[]') : (dynamicScenario.options || [])
  const selectedOpt = options.find(o => o.id === selectedOptionId)

  return (
    <FadeInUp className="space-y-4">
      <div className="dynamic-scenario-border rounded-xl">
        <div className="p-5 text-sm leading-relaxed whitespace-pre-line font-medium italic text-foreground/90">
          &ldquo;{dynamicScenario.questionText}&rdquo;
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {options.map((opt: SimOption) => {
          const isSelected = selectedOptionId === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => { onSelect(opt) }}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl border transition-all text-sm',
                isSelected
                  ? 'border-[color:var(--color-warroom-gold)] bg-[color:var(--color-warroom-gold)]/5 font-bold shadow-[0_0_12px_rgba(179,144,62,0.15)]'
                  : 'border-[color:var(--color-warroom-gold)]/20 hover:border-[color:var(--color-warroom-gold)]/50 hover:bg-[color:var(--color-warroom-gold)]/5',
              )}
            >
              {opt.text}
            </button>
          )
        })}
      </div>

      {/* Follow-up branching */}
      {selectedOptionId && (loadingFollowup || followupScenario || followupError) && (
        <FadeInUp className="mt-6 pl-4 border-l-2 border-primary/40 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Consequence</span>
          </div>
          {loadingFollowup ? (
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm italic text-muted-foreground">AI is assessing the impact of your decision...</span>
            </div>
          ) : followupError ? (
            <div className="space-y-3">
              <div className="dynamic-scenario-border rounded-xl">
                <div className="p-4 text-sm">
                  <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-[color:var(--color-warroom-crimson-bright,#8e3644)]" /><span className="font-bold text-[color:var(--color-warroom-crimson-bright,#8e3644)]">Follow-up Scenario Failed</span></div>
                  <p className="text-foreground/80">{followupError}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => selectedOpt && onRetryFollowup(selectedOpt)} className="w-full">Retry Generating Consequence</Button>
            </div>
          ) : followupScenario && (
            <div className="space-y-3">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm font-medium leading-relaxed text-foreground/90">{followupScenario.question}</div>
              <div className="pt-2">
                <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> How do you respond?</div>
                <Textarea placeholder="Type your response here..." value={followupText || ''} onChange={e => onTextChange(e.target.value)} rows={4} className="resize-none text-sm" />
              </div>
            </div>
          )}
        </FadeInUp>
      )}

      {selectedOptionId && !loadingFollowup && !followupScenario && !followupError && (
        <FadeInUp className="mt-4 flex justify-end">
          <Button onClick={() => selectedOpt && onConfirmDecision(selectedOpt)} className="w-full sm:w-auto">
            Confirm Decision <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </FadeInUp>
      )}
    </FadeInUp>
  )
}
