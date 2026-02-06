'use client';

import { useState, useCallback, useEffect } from 'react'
import type {
  Question,
  QuestionResponse,
  StageNumber,
  StageConfig,
  ConsequenceItem
} from '@/src/types'
import { Assessment } from '@/src/types/assessment'
import { AssessmentState } from '@/src/types/state'
import * as questionEngine from '@/src/lib/services/question-engine'

// Default initial state
const defaultInitialState: AssessmentState = {
  financial: {
    capital: 0,
    monthlyRevenue: 0,
    burnRate: 0,
    runwayMonths: 0
  },
  team: {
    size: 1,
    satisfaction: 100
  },
  customers: {
    total: 0,
    retention: 0
  },
  mistakes: []
}

interface SubmitResult {
  type: 'next_question' | 'stage_complete' | 'assessment_complete'
  question?: Question
  stage?: number
  consequences?: ConsequenceItem[]
  stageData?: any
}

export function useAssessment(assessmentId: string) {
  const [currentStage, setCurrentStage] = useState<StageNumber>(-2)
  const [stageConfig, setStageConfig] = useState<StageConfig | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [responses, setResponses] = useState<QuestionResponse[]>([])
  const [questionHistory, setQuestionHistory] = useState<string[]>([])
  const [currentState, setCurrentState] = useState<AssessmentState>(defaultInitialState)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false)
  const [assessment, setAssessment] = useState<Assessment>({
    id: assessmentId,
    userId: 'user-1',
    attemptNumber: 1,
    status: 'in_progress',
    currentStage: -2,
    totalDurationMinutes: 0,
    lastActivityAt: new Date()
  })

  // Helper: map API state fields to local AssessmentState
  const mapApiStateToLocal = useCallback((data: any): AssessmentState => {
    const financial = data.financialState || data.state?.financial || {}
    const team = data.teamState || data.state?.team || {}
    const customers = data.customerState || data.state?.customers || {}

    return {
      financial: {
        capital: financial.currentCapital ?? financial.capital ?? defaultInitialState.financial.capital,
        monthlyRevenue: financial.monthlyRevenue ?? defaultInitialState.financial.monthlyRevenue,
        burnRate: financial.burnRate ?? defaultInitialState.financial.burnRate,
        runwayMonths: financial.runwayMonths ?? defaultInitialState.financial.runwayMonths
      },
      team: {
        size: team.size ?? defaultInitialState.team.size,
        satisfaction: team.satisfaction ?? defaultInitialState.team.satisfaction
      },
      customers: {
        total: customers.total ?? defaultInitialState.customers.total,
        retention: customers.retention ?? defaultInitialState.customers.retention
      },
      mistakes: data.mistakesTriggered?.map((m: any) => m.mistakeCode) || []
    }
  }, [])

  // Load existing assessment data from server on mount
  useEffect(() => {
    const loadExistingAssessment = async () => {
      if (hasLoadedFromServer) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/assessment/${assessmentId}`)

        if (response.ok) {
          const data = await response.json()
          console.log('[useAssessment] Loaded from server:', data)

          if (data.assessment) {
            const serverAssessment = data.assessment
            const serverStatus = serverAssessment.status.toLowerCase().replace('_', '-')

            // Update assessment state
            setAssessment({
              id: serverAssessment.id,
              userId: serverAssessment.userId,
              attemptNumber: serverAssessment.attemptNumber,
              status: serverStatus,
              currentStage: serverAssessment.currentStage,
              totalDurationMinutes: serverAssessment.totalDurationMinutes || 0,
              lastActivityAt: new Date(serverAssessment.lastActiveAt || Date.now())
            })

            // Set the current stage from server
            setCurrentStage(serverAssessment.currentStage as StageNumber)

            // Load full state from Assessment-level JSON fields
            setCurrentState(mapApiStateToLocal(serverAssessment))

            // Load responses from DB and rebuild history
            if (serverAssessment.responses && Array.isArray(serverAssessment.responses)) {
              const loadedResponses = serverAssessment.responses.map((r: any) => ({
                questionId: r.questionId,
                assessmentId: r.assessmentId,
                stageNumber: (r.stage?.stageNumber ?? serverAssessment.currentStage) as StageNumber,
                responseType: r.questionType,
                responseData: r.responseData,
                pointsAwarded: r.rawScore || 0,
                competenciesAssessed: r.competenciesAssessed || [],
                answeredAt: new Date(r.answeredAt || r.createdAt),
                responseTimeSeconds: r.durationSeconds || 0
              }))
              setResponses(loadedResponses)

              // Rebuild question history from response order
              const loadedHistory = loadedResponses.map((r: any) => r.questionId)
              setQuestionHistory(loadedHistory)
            }

            // If assessment was paused, resume it on the server
            if (serverAssessment.status === 'PAUSED') {
              try {
                await fetch(`/api/assessment/${assessmentId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'IN_PROGRESS' }),
                })
              } catch (err) {
                console.error('Error auto-resuming assessment:', err)
              }
            }
          }

          // Set current question from server if available
          if (data.currentQuestion) {
            console.log('[useAssessment] Setting question from server:', data.currentQuestion.id)
            setCurrentQuestion(data.currentQuestion)
          } else if (data.assessment?.responses?.length > 0) {
            // If no current question but we have responses, find next question
            console.log('[useAssessment] No currentQuestion, calculating next from responses')
            const lastResponse = data.assessment.responses[data.assessment.responses.length - 1]
            const nextQ = questionEngine.getNextQuestion(
              lastResponse.questionId,
              data.assessment.currentStage as StageNumber,
              data.assessment.responses.map((r: any) => ({
                questionId: r.questionId,
                stageNumber: (r.stage?.stageNumber ?? data.assessment.currentStage) as StageNumber,
                responseData: r.responseData,
                competenciesAssessed: r.competenciesAssessed || []
              })) as any,
              {} as any
            )
            if (nextQ) {
              setCurrentQuestion(nextQ)
            }
          }

          // Load stage config for current stage
          if (data.assessment?.currentStage !== undefined) {
            const config = questionEngine.getStageConfig(data.assessment.currentStage as StageNumber)
            setStageConfig(config)
          }
        }
      } catch (error) {
        console.error('Error loading existing assessment:', error)
      } finally {
        setHasLoadedFromServer(true)
        setIsLoading(false)
      }
    }

    loadExistingAssessment()
  }, [assessmentId, hasLoadedFromServer, mapApiStateToLocal])

  // Load stage config and first question when stage changes (only after initial load)
  useEffect(() => {
    if (!hasLoadedFromServer) return

    const loadStage = async () => {
      try {
        const config = questionEngine.getStageConfig(currentStage)
        setStageConfig(config)

        // Only get first question if we don't have a current question
        if (!currentQuestion) {
          const firstQuestion = questionEngine.getFirstQuestionOfStage(currentStage)
          setCurrentQuestion(firstQuestion)
          if (firstQuestion) {
            setQuestionHistory(prev =>
              prev.includes(firstQuestion.id) ? prev : [...prev, firstQuestion.id]
            )
          }
        }

        setAssessment(prev => ({
          ...prev,
          currentStage
        }))
      } catch (error) {
        console.error('Error loading stage:', error)
      }
    }

    loadStage()
  }, [currentStage, hasLoadedFromServer, currentQuestion])

  // Get stage progress
  const getStageProgress = useCallback(() => {
    if (!stageConfig) {
      return { answered: 0, total: 10, percentage: 0 }
    }
    return questionEngine.getStageProgress(currentStage, responses)
  }, [currentStage, responses, stageConfig])

  // Submit answer via backend API and get next question
  const submitAnswer = useCallback(
    async (response: Omit<QuestionResponse, 'assessmentId' | 'stageNumber' | 'responseType' | 'pointsAwarded' | 'competenciesAssessed' | 'responseTimeSeconds'>): Promise<SubmitResult> => {
      setIsLoading(true)
      try {
        // POST to the backend respond API
        const apiResponse = await fetch(`/api/assessment/${assessmentId}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: response.questionId,
            responseData: response.responseData,
            responseTimeSeconds: 0,
          }),
        })

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json()
          throw new Error(errorData.error || 'Failed to submit response')
        }

        const data = await apiResponse.json()

        // Build full response record from API result
        const fullResponse: QuestionResponse = {
          ...response,
          assessmentId,
          stageNumber: currentStage,
          responseType: currentQuestion?.type || 'open_text',
          pointsAwarded: data.pointsAwarded || 0,
          competenciesAssessed: currentQuestion?.assess || [],
          responseTimeSeconds: 0
        }

        // Update local responses
        setResponses(prev => [...prev, fullResponse])

        // Update local state from API response
        if (data.updatedState) {
          setCurrentState(prev => ({
            financial: {
              capital: data.updatedState.financial?.currentCapital ?? data.updatedState.financial?.capital ?? prev.financial.capital,
              monthlyRevenue: data.updatedState.financial?.monthlyRevenue ?? prev.financial.monthlyRevenue,
              burnRate: data.updatedState.financial?.burnRate ?? prev.financial.burnRate,
              runwayMonths: data.updatedState.financial?.runwayMonths ?? prev.financial.runwayMonths
            },
            team: {
              size: data.updatedState.team?.size ?? prev.team.size,
              satisfaction: data.updatedState.team?.satisfaction ?? prev.team.satisfaction
            },
            customers: {
              total: data.updatedState.customers?.total ?? prev.customers.total,
              retention: data.updatedState.customers?.retention ?? prev.customers.retention
            },
            mistakes: data.updatedState.mistakes || prev.mistakes
          }))
        }

        // Build consequences for UI display
        const consequences: ConsequenceItem[] = []
        if (data.consequenceApplied) {
          Object.entries(data.consequenceApplied).forEach(([key, value]) => {
            consequences.push({
              type: 'neutral',
              label: key.replace(/([A-Z])/g, ' $1').trim(),
              value: String(value),
            })
          })
        }

        // Stage complete - call complete-stage API
        if (data.stageComplete) {
          try {
            const completeRes = await fetch(`/api/assessment/${assessmentId}/complete-stage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            })

            if (completeRes.ok) {
              const stageData = await completeRes.json()

              if (stageData.isComplete) {
                // Assessment fully complete
                return {
                  type: 'assessment_complete',
                  consequences,
                  stageData,
                }
              }

              // Stage complete, prepare for next stage
              return {
                type: 'stage_complete',
                stage: currentStage,
                consequences,
                stageData,
              }
            }
          } catch (err) {
            console.error('Error completing stage:', err)
          }

          // Fallback if complete-stage call failed
          const nextStage = questionEngine.getNextStage(currentStage)
          if (nextStage === null) {
            return { type: 'assessment_complete', consequences }
          }
          return { type: 'stage_complete', stage: currentStage, consequences }
        }

        // Next question from API
        if (data.nextQuestion) {
          setCurrentQuestion(data.nextQuestion)
          setQuestionHistory(prev =>
            prev.includes(data.nextQuestion.id) ? prev : [...prev, data.nextQuestion.id]
          )
          return {
            type: 'next_question',
            question: data.nextQuestion,
            consequences
          }
        }

        // No more questions from API (shouldn't typically happen if stageComplete is correct)
        const nextStage = questionEngine.getNextStage(currentStage)
        if (nextStage === null) {
          return { type: 'assessment_complete', consequences }
        }
        return { type: 'stage_complete', stage: currentStage, consequences }
      } catch (error) {
        console.error('Error submitting answer:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [currentQuestion, currentStage, assessmentId]
  )

  // Advance to next stage (called after stage transition UI)
  const advanceToNextStage = useCallback(async (stageData?: any) => {
    if (stageData?.nextStage !== undefined) {
      const nextStage = stageData.nextStage as StageNumber
      setCurrentStage(nextStage)

      // Set the first question of the new stage from stageData or question engine
      if (stageData.firstQuestion) {
        setCurrentQuestion(stageData.firstQuestion)
        setQuestionHistory(prev =>
          prev.includes(stageData.firstQuestion.id) ? prev : [...prev, stageData.firstQuestion.id]
        )
      } else {
        setCurrentQuestion(null) // Will be loaded by stage change useEffect
      }
    } else {
      // Fallback: advance by incrementing
      const nextStage = questionEngine.getNextStage(currentStage)
      if (nextStage !== null) {
        setCurrentStage(nextStage)
        setCurrentQuestion(null) // Will be loaded by stage change useEffect
      }
    }
  }, [currentStage])

  const pauseAssessment = useCallback(async () => {
    setAssessment(prev => ({ ...prev, status: 'paused' }))

    // Save current state + position to server
    try {
      await fetch(`/api/assessment/${assessmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAUSED',
          currentQuestionId: currentQuestion?.id,
          currentStage: currentStage,
          financialState: {
            currentCapital: currentState.financial.capital,
            monthlyRevenue: currentState.financial.monthlyRevenue,
            burnRate: currentState.financial.burnRate,
            runwayMonths: currentState.financial.runwayMonths,
          },
          teamState: {
            size: currentState.team.size,
            satisfaction: currentState.team.satisfaction,
          },
          customerState: {
            total: currentState.customers.total,
            retention: currentState.customers.retention,
          },
        })
      })
    } catch (error) {
      console.error('Error saving pause state:', error)
    }
  }, [assessmentId, currentQuestion?.id, currentStage, currentState])

  const resumeAssessment = useCallback(async () => {
    setAssessment(prev => ({ ...prev, status: 'in_progress' }))

    try {
      await fetch(`/api/assessment/${assessmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      })
    } catch (error) {
      console.error('Error resuming assessment:', error)
    }
  }, [assessmentId])

  // Go to previous question (allows user to review/change their answer)
  const goToPreviousQuestion = useCallback(() => {
    if (questionHistory.length <= 1) {
      return false // Can't go back from first question
    }

    // Get the previous question ID from history
    const currentIndex = questionHistory.indexOf(currentQuestion?.id || '')
    if (currentIndex <= 0) {
      return false
    }

    const previousQuestionId = questionHistory[currentIndex - 1]
    const previousQuestion = questionEngine.getQuestionById(previousQuestionId, currentStage)

    if (previousQuestion) {
      setCurrentQuestion(previousQuestion)
      return true
    }
    return false
  }, [questionHistory, currentQuestion?.id, currentStage])

  // Check if we can go to previous question
  const canGoBack = useCallback(() => {
    if (questionHistory.length <= 1) return false
    const currentIndex = questionHistory.indexOf(currentQuestion?.id || '')
    return currentIndex > 0
  }, [questionHistory, currentQuestion?.id])

  // Get response for a specific question (for viewing answers)
  const getResponseForQuestion = useCallback((questionId: string) => {
    return responses.find(r => r.questionId === questionId)
  }, [responses])

  return {
    currentQuestion,
    currentState,
    isLoading,
    assessment,
    stageConfig,
    responses,
    submitAnswer,
    pauseAssessment,
    resumeAssessment,
    advanceToNextStage,
    goToPreviousQuestion,
    canGoBack,
    getResponseForQuestion,
    getStageProgress
  }
}
