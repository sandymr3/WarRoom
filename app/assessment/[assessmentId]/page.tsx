'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import QuestionRenderer from '@/src/components/assessment/question-renderer'
import StateDashboard from '@/src/components/assessment/state-dashboard'
import NarrativeIntro from '@/src/components/assessment/narrative-intro'
import StageTransition from '@/src/components/assessment/stage-transition'
import ConsequenceDisplay from '@/src/components/assessment/consequence-display'
import { useAssessment } from '@/src/lib/hooks/use-assessment'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, Pause, Clock, Zap } from 'lucide-react'
import Link from 'next/link'
import type { StageNumber, NarrativeIntro as NarrativeIntroType, ConsequenceItem, CompetencyScoreDisplay, MistakeDisplay, StageMetric } from '@/src/types'

type AssessmentView = 'narrative' | 'question' | 'consequence' | 'stage-transition'

export default function AssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.assessmentId as string

  const {
    currentQuestion,
    currentState,
    isLoading,
    assessment,
    stageConfig,
    submitAnswer,
    pauseAssessment,
    getStageProgress
  } = useAssessment(assessmentId)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentView, setCurrentView] = useState<AssessmentView>('narrative')
  const [lastConsequences, setLastConsequences] = useState<ConsequenceItem[]>([])
  const [showNarrativeForStage, setShowNarrativeForStage] = useState<StageNumber | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(90 * 60) // 90 minutes in seconds

  // Show narrative intro when stage changes
  useEffect(() => {
    if (stageConfig?.stage?.introNarrative && assessment?.currentStage !== showNarrativeForStage) {
      setShowNarrativeForStage(assessment?.currentStage as StageNumber)
      setCurrentView('narrative')
    } else if (!stageConfig?.stage?.introNarrative) {
      setCurrentView('question')
    }
  }, [stageConfig, assessment?.currentStage])

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleNarrativeComplete = () => {
    setCurrentView('question')
  }

  const handleSubmitAnswer = async (response: any) => {
    setIsSubmitting(true)
    try {
      const result = await submitAnswer(response)

      // Show consequences if any
      if (result.consequences && result.consequences.length > 0) {
        setLastConsequences(result.consequences)
        setCurrentView('consequence')
        
        // Auto-advance after showing consequences
        setTimeout(() => {
          if (result.type === 'stage_complete') {
            setCurrentView('stage-transition')
          } else if (result.type === 'assessment_complete') {
            router.push(`/assessment/${assessmentId}/final-report`)
          } else {
            setCurrentView('question')
          }
        }, 2500)
      } else if (result.type === 'stage_complete') {
        setCurrentView('stage-transition')
      } else if (result.type === 'assessment_complete') {
        router.push(`/assessment/${assessmentId}/final-report`)
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStageTransitionComplete = () => {
    // Will show narrative for next stage automatically via useEffect
    setShowNarrativeForStage(null)
    setCurrentView('narrative')
  }

  const handlePause = async () => {
    await pauseAssessment()
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-background to-muted">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading War Room...</p>
        </motion.div>
      </div>
    )
  }

  if (!currentQuestion && currentView === 'question') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Assessment Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't load your assessment. Please try again or contact support.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const progress = getStageProgress?.() || { answered: 0, total: 10, percentage: 0 }
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {/* Narrative Intro Overlay */}
        {currentView === 'narrative' && stageConfig?.stage?.introNarrative && (
          <NarrativeIntro
            key="narrative"
            narrative={stageConfig.stage.introNarrative}
            stageName={stageConfig.stage.name}
            stageTitle={stageConfig.stage.title}
            onComplete={handleNarrativeComplete}
          />
        )}

        {/* Consequence Display Overlay */}
        {currentView === 'consequence' && lastConsequences.length > 0 && (
          <motion.div
            key="consequence"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          >
            <div className="max-w-lg w-full">
              <ConsequenceDisplay
                consequences={lastConsequences}
                title="Decision Impact"
                subtitle="Your choice has consequences"
              />
            </div>
          </motion.div>
        )}

        {/* Stage Transition Overlay */}
        {currentView === 'stage-transition' && (
          <StageTransition
            key="transition"
            currentStageName={stageConfig?.stage?.name || 'Current Stage'}
            currentStageNumber={assessment?.currentStage || 0}
            nextStageName="Next Stage"
            nextStageNumber={(assessment?.currentStage || 0) + 1 as StageNumber}
            competencyScores={[]}
            mistakesTriggered={[]}
            stageMetrics={[
              { label: 'Questions Answered', value: progress.answered },
              { label: 'Time Spent', value: formatTime(90 * 60 - timeRemaining) }
            ]}
            onContinue={handleStageTransitionComplete}
          />
        )}
      </AnimatePresence>

      {/* Main Assessment UI */}
      {currentView === 'question' && (
        <>
          {/* Header */}
          <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Exit
                  </Button>
                </Link>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center gap-2 text-sm">
                    <span className="text-primary font-semibold">{stageConfig?.stage?.name}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">Q{progress.answered + 1} of {progress.total}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className={timeRemaining < 600 ? 'text-red-500' : 'text-foreground'}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handlePause}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={progress.percentage} className="h-1.5" />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex h-[calc(100vh-90px)]">
            {/* Left Sidebar - State Dashboard */}
            <aside className="hidden lg:block w-80 border-r border-border bg-card/50 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <h3 className="font-semibold text-foreground">Live Status</h3>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Stage</span>
                      <span className="font-medium text-foreground">{stageConfig?.stage?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Progress</span>
                      <span className="font-medium text-foreground">{progress.percentage}%</span>
                    </div>
                  </div>
                </div>
                {currentState && (
                  <StateDashboard
                    state={currentState}
                    timeRemaining={Math.floor(timeRemaining / 60)}
                  />
                )}
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
              >
                {currentQuestion && (
                  <QuestionRenderer
                    question={currentQuestion}
                    onSubmit={handleSubmitAnswer}
                    isSubmitting={isSubmitting}
                    state={currentState}
                  />
                )}
              </motion.div>
            </main>
          </div>
        </>
      )}
    </div>
  )
}
