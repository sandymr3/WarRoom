'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Award, AlertTriangle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export interface CompetencyScoreDisplay {
  code: string
  name: string
  score: number
  level: 'L0' | 'L1' | 'L2'
  trend?: 'up' | 'down' | 'stable'
}

export interface MistakeDisplay {
  code: string
  name: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  compoundingNote?: string
}

export interface StageMetric {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

interface StageTransitionProps {
  currentStageName: string
  currentStageNumber: number
  nextStageName: string
  nextStageNumber: number
  competencyScores: CompetencyScoreDisplay[]
  mistakesTriggered: MistakeDisplay[]
  stageMetrics: StageMetric[]
  transitionMessage?: string
  onContinue: () => void
}

export function StageTransition({
  currentStageName,
  currentStageNumber,
  nextStageName,
  nextStageNumber,
  competencyScores,
  mistakesTriggered,
  stageMetrics,
  transitionMessage,
  onContinue
}: StageTransitionProps) {
  const [activeTab, setActiveTab] = useState<'scores' | 'mistakes' | 'metrics'>('scores')
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const getScoreColor = (level: string) => {
    switch (level) {
      case 'L2': return 'text-green-500'
      case 'L1': return 'text-yellow-500'
      case 'L0': return 'text-red-500'
      default: return 'text-muted-foreground'
    }
  }

  const getScoreProgress = (level: string) => {
    switch (level) {
      case 'L2': return 100
      case 'L1': return 60
      case 'L0': return 25
      default: return 0
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-500 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
      case 'low': return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-b from-black via-gray-900 to-black z-50 overflow-y-auto"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      
      <div className="relative min-h-screen flex flex-col items-center justify-center p-8">
        {/* Stage completion header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 mb-6">
            <Award className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {currentStageName} Complete
          </h1>
          <p className="text-lg text-white/60">
            Stage {currentStageNumber < 0 ? currentStageNumber : currentStageNumber} → Stage {nextStageNumber < 0 ? nextStageNumber : nextStageNumber}
          </p>
        </motion.div>

        {/* Tab navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          className="flex gap-2 mb-8 bg-white/5 rounded-lg p-1"
        >
          <Button
            variant={activeTab === 'scores' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('scores')}
            className="text-white"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Competencies
          </Button>
          <Button
            variant={activeTab === 'mistakes' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('mistakes')}
            className="text-white"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Mistakes ({mistakesTriggered.length})
          </Button>
          <Button
            variant={activeTab === 'metrics' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('metrics')}
            className="text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Metrics
          </Button>
        </motion.div>

        {/* Content area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'scores' && (
              <motion.div
                key="scores"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 space-y-4"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Competency Scores</h3>
                {competencyScores.map((score, index) => (
                  <motion.div
                    key={score.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-primary/60">{score.code}</span>
                        <span className="text-sm font-medium text-white">{score.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {score.trend && (
                          score.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : score.trend === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : null
                        )}
                        <span className={cn('text-sm font-bold', getScoreColor(score.level))}>
                          {score.level}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={getScoreProgress(score.level)} 
                      className="h-2"
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === 'mistakes' && (
              <motion.div
                key="mistakes"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Mistakes Triggered</h3>
                {mistakesTriggered.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-4">
                      <Award className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="text-white/60">No mistakes triggered in this stage!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mistakesTriggered.map((mistake, index) => (
                      <motion.div
                        key={mistake.code}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          'p-4 rounded-lg border',
                          getSeverityColor(mistake.severity)
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono opacity-60">{mistake.code}</span>
                              <span className="font-medium">{mistake.name}</span>
                            </div>
                            {mistake.compoundingNote && (
                              <p className="text-sm opacity-80">{mistake.compoundingNote}</p>
                            )}
                          </div>
                          <span className="text-xs font-medium uppercase px-2 py-1 rounded bg-current/20">
                            {mistake.severity}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'metrics' && (
              <motion.div
                key="metrics"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Business Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  {stageMetrics.map((metric, index) => (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="text-sm text-white/60 mb-1">{metric.label}</div>
                      <div className="text-2xl font-bold text-white">{metric.value}</div>
                      {metric.change && (
                        <div className={cn(
                          'text-sm mt-1',
                          metric.changeType === 'positive' ? 'text-green-500' : 
                          metric.changeType === 'negative' ? 'text-red-500' : 
                          'text-white/60'
                        )}>
                          {metric.change}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Transition message */}
        {transitionMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: 0.5 }}
            className="text-center text-white/60 max-w-xl mx-auto mt-8"
          >
            {transitionMessage}
          </motion.p>
        )}

        {/* Continue button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Button
            size="lg"
            onClick={onContinue}
            className="group"
          >
            Continue to {nextStageName}
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default StageTransition
