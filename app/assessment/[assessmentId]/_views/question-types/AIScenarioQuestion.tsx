'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, TrendingUp, ShieldAlert, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { SCENARIO_STEP_STYLES } from '@/src/lib/constants'
import { parseInvestorPanelQuestions } from '@/src/lib/helpers'
import { QuestionAudioPlayer } from '@/src/components/QuestionAudioPlayer'

interface AIScenarioQuestionProps {
  scenarioStep?: string
  scenarioGroup?: string
  contextText?: string
  questionId: string
  text: string
  currentAnswer?: { text?: string; selectedOptionId?: string }
  buyoutCompany: string
  buyoutAmount: string
  submitError?: string
  submitting?: boolean
  onTextChange: (text: string) => void
  onBuyoutCompanyChange: (v: string) => void
  onBuyoutAmountChange: (v: string) => void
  onBuyoutSubmit: () => void
  onAcknowledge: () => void
}

export function AIScenarioQuestion({
  scenarioStep, scenarioGroup, contextText, questionId,
  currentAnswer, buyoutCompany, buyoutAmount, submitError, submitting,
  onTextChange, onBuyoutCompanyChange, onBuyoutAmountChange, onBuyoutSubmit, onAcknowledge,
}: AIScenarioQuestionProps) {
  const stepStyle = SCENARIO_STEP_STYLES[scenarioStep || 'environment']
  const isDecisionStep = scenarioStep === 'decision'
  const isInfoStep = scenarioStep === 'environment' || scenarioStep === 'consequence'
  const isProblemStep = scenarioStep === 'problem'
  const isBuyout = questionId === 'Q_3_BUYOUT_DECISION'
  const steps = ['environment', 'problem', 'decision', 'consequence']

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          {steps.map((step, i) => {
            const s = SCENARIO_STEP_STYLES[step]
            const isCurrent = step === scenarioStep
            const isPast = steps.indexOf(scenarioStep || '') > i
            return (
              <div key={step} className="flex items-center gap-1">
                <div
                  className={cn('h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all', isCurrent ? 'ring-2 ring-offset-1' : '', isPast ? 'opacity-50' : '')}
                  style={{ backgroundColor: isCurrent ? `${s.color}20` : isPast ? `${s.color}10` : 'var(--muted)', color: (isCurrent || isPast) ? s.color : 'var(--muted-foreground)', boxShadow: isCurrent ? `0 0 0 2px ${s.color}` : 'none' }}
                >
                  <s.icon className="h-3.5 w-3.5" />
                </div>
                {i < 3 && <div className="w-4 h-0.5 bg-muted-foreground/20" />}
              </div>
            )
          })}
        </div>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: stepStyle.color }}>{stepStyle.label}</span>
      </div>

      {/* Context */}
      {contextText && scenarioGroup !== 'investor_panel' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={cn('p-4 rounded-xl border text-sm leading-relaxed', stepStyle.bgColor)}
          style={{ borderColor: `${stepStyle.color}30` }}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: stepStyle.color }}><stepStyle.icon className="h-3 w-3" />{stepStyle.label}</div>
          <p className="text-foreground/80 whitespace-pre-line">{contextText}</p>
        </motion.div>
      )}

      {/* Investor panel */}
      {scenarioGroup === 'investor_panel' && contextText && (
        <div className="space-y-3">
          {parseInvestorPanelQuestions(contextText).map((entry, idx) => (
            <motion.div key={`${entry.investorName}-${idx}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + idx * 0.04 }} className="rounded-xl border bg-card/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question {idx + 1}</div>
                  <div className="font-semibold text-sm">{entry.investorName}</div>
                </div>
                <QuestionAudioPlayer audioKeys={entry.voiceKeys} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{entry.question}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Decision step */}
      {isDecisionStep && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
          {isBuyout ? (
            <div className="-mx-2 sm:-mx-4 md:-mx-6 overflow-hidden rounded-2xl border border-border/50 shadow-2xl">
              <div className="flex flex-col md:flex-row min-h-[420px]">
                {/* LEFT HALF — Accept Buyout */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="relative flex-1 p-7 md:p-10 flex flex-col justify-between bg-gradient-to-br from-emerald-900/50 via-emerald-700/25 to-emerald-500/10"
                >
                  <div className="space-y-5">
                    <motion.div
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      className="h-16 w-16 rounded-full bg-emerald-500/25 ring-2 ring-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                    >
                      <TrendingUp className="h-8 w-8" />
                    </motion.div>
                    <div>
                      <h3
                        className="text-2xl md:text-3xl font-bold tracking-wide text-emerald-200"
                        style={{ fontFamily: "var(--font-got), Georgia, serif", letterSpacing: '0.04em' }}
                      >
                        Accept the Buyout
                      </h3>
                      <p className="text-sm text-emerald-100/70 mt-2 max-w-sm">
                        Exit now with a guaranteed return. Your run ends here.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 pt-6">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-bold text-emerald-300/80">Acquiring Company</label>
                      <input
                        type="text"
                        value={buyoutCompany}
                        onChange={e => onBuyoutCompanyChange(e.target.value)}
                        placeholder="e.g. Google, Target"
                        className="w-full mt-1.5 bg-background/40 border border-emerald-500/40 focus:border-emerald-400 rounded-md py-2 px-3 text-sm outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-bold text-emerald-300/80">Deal Value ($)</label>
                      <input
                        type="number"
                        value={buyoutAmount}
                        onChange={e => onBuyoutAmountChange(e.target.value)}
                        placeholder="e.g. 5000000"
                        className="w-full mt-1.5 bg-background/40 border border-emerald-500/40 focus:border-emerald-400 rounded-md py-2 px-3 text-sm outline-none transition"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onBuyoutSubmit}
                      disabled={submitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-3 rounded-md transition shadow-lg shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: "var(--font-got), Georgia, serif", letterSpacing: '0.08em' }}
                    >
                      {submitting ? 'Finalizing…' : 'Accept & Exit'}
                    </motion.button>
                    {submitError && <p className="text-xs text-red-300 mt-1">{submitError}</p>}
                  </div>
                </motion.div>

                {/* Divider */}
                <div
                  className="hidden md:block w-px"
                  style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.18), transparent)' }}
                />

                {/* RIGHT HALF — Enter War Room (entire panel is the click target) */}
                <motion.button
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => onTextChange('I choose to WALK OUT OF THE DEAL and ENTER THE WAR ROOM for investments.')}
                  className={cn(
                    'relative flex-1 p-7 md:p-10 flex flex-col justify-between text-left group transition-all bg-gradient-to-br from-red-900/50 via-red-700/25 to-red-500/10',
                    currentAnswer?.text?.includes('WALK OUT') ? 'ring-2 ring-red-400/60 ring-inset' : 'hover:from-red-900/60 hover:via-red-700/30',
                  )}
                >
                  <div className="space-y-5">
                    <div className="h-16 w-16 rounded-full bg-red-500/25 ring-2 ring-red-400/40 text-red-300 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                      <ShieldAlert className="h-8 w-8" />
                    </div>
                    <div>
                      <h3
                        className="text-2xl md:text-3xl font-bold tracking-wide text-red-200"
                        style={{ fontFamily: "var(--font-got), Georgia, serif", letterSpacing: '0.04em' }}
                      >
                        Enter the War Room
                      </h3>
                      <p className="text-sm text-red-100/70 mt-2 max-w-sm">
                        Reject the buyout. Fight for valuation and retain control of the throne.
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 flex items-center gap-2 text-xs font-bold text-red-200 uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity"
                    style={{ fontFamily: "var(--font-got), Georgia, serif", letterSpacing: '0.12em' }}
                  >
                    Prepare for War <ChevronRight className="h-4 w-4" />
                  </div>
                </motion.button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-xs font-bold text-[color:var(--color-warroom-gold)]">How do you respond to this situation?</div>
              <Textarea placeholder="Describe your decision and reasoning..." value={currentAnswer?.text || ''} onChange={e => onTextChange(e.target.value)} rows={5} className="resize-none" />
            </>
          )}
        </motion.div>
      )}

      {/* Info / consequence acknowledge */}
      {(isInfoStep || isProblemStep) && !currentAnswer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center">
          <Button variant="outline" size="sm" onClick={onAcknowledge} className="text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />{isProblemStep ? 'I understand the problem — Continue' : 'I understand — Continue'}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
