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
    capital: 10000,
    monthlyRevenue: 0,
    burnRate: 0,
    runwayMonths: 12
  },
  team: {
    size: 1,
    satisfaction: 8
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
            // Update assessment state
            setAssessment({
              id: data.assessment.id,
              userId: data.assessment.userId,
              attemptNumber: data.assessment.attemptNumber,
              status: data.assessment.status.toLowerCase().replace('_', '-'),
              currentStage: data.assessment.currentStage,
              totalDurationMinutes: data.assessment.totalDurationMinutes || 0,
              lastActivityAt: new Date(data.assessment.lastActiveAt || Date.now())
            })
            
            // Set the current stage from server
            setCurrentStage(data.assessment.currentStage as StageNumber)
            
            // Load financial state if available (either from financialState or state snapshot)
            const financialState = data.assessment.financialState || data.state?.financial
            if (financialState) {
              setCurrentState(prev => ({
                ...prev,
                financial: {
                  capital: financialState.capital ?? prev.financial.capital,
                  monthlyRevenue: financialState.monthlyRevenue ?? 0,
                  burnRate: financialState.burnRate ?? 0,
                  runwayMonths: financialState.runwayMonths ?? 12
                }
              }))
            }
            
            // Load team state if available
            const teamState = data.assessment.teamState || data.state?.team
            if (teamState) {
              setCurrentState(prev => ({
                ...prev,
                team: {
                  size: teamState.size ?? 1,
                  satisfaction: teamState.satisfaction ?? 8
                }
              }))
            }
            
            // Load customer state if available
            const customerState = data.assessment.customerState || data.state?.customers
            if (customerState) {
              setCurrentState(prev => ({
                ...prev,
                customers: {
                  total: customerState.total ?? 0,
                  retention: customerState.retention ?? 0
                }
              }))
            }
            
            // Load responses if available
            if (data.assessment.responses && Array.isArray(data.assessment.responses)) {
              const loadedResponses = data.assessment.responses.map((r: any) => ({
                questionId: r.questionId,
                assessmentId: r.assessmentId,
                stageNumber: data.assessment.currentStage as StageNumber,
                responseType: r.questionType,
                responseData: r.responseData,
                pointsAwarded: r.rawScore || 0,
                competenciesAssessed: r.competenciesAssessed || [],
                answeredAt: new Date(r.answeredAt),
                responseTimeSeconds: r.durationSeconds || 0
              }))
              setResponses(loadedResponses)
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
                stageNumber: data.assessment.currentStage as StageNumber,
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
  }, [assessmentId, hasLoadedFromServer])

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

  // Submit answer and get next question
  const submitAnswer = useCallback(
    async (response: Omit<QuestionResponse, 'assessmentId' | 'stageNumber' | 'responseType' | 'pointsAwarded' | 'competenciesAssessed' | 'responseTimeSeconds'>): Promise<SubmitResult> => {
      setIsLoading(true)
      try {
        // Build full response
        const fullResponse: QuestionResponse = {
          ...response,
          assessmentId,
          stageNumber: currentStage,
          responseType: currentQuestion?.type || 'open_text',
          pointsAwarded: 0, // Will be calculated by scoring engine
          competenciesAssessed: currentQuestion?.assess || [],
          responseTimeSeconds: 0
        }

        // Add to responses
        setResponses(prev => [...prev, fullResponse])

        // Calculate consequences from the selected option
        const consequences: ConsequenceItem[] = []
        if (response.responseData?.type === 'choice' && currentQuestion?.options) {
          const selectedOption = currentQuestion.options.find(
            opt => opt.id === response.responseData.selectedOptionId
          )
          if (selectedOption) {
            // Convert state impact to consequences
            const stateImpact = (selectedOption as any).stateImpact
            if (stateImpact) {
              Object.entries(stateImpact).forEach(([key, value]) => {
                const strValue = String(value)
                let type: 'positive' | 'negative' | 'neutral' | 'warning' = 'neutral'
                
                if (strValue.startsWith('+') || value === true || strValue.toLowerCase().includes('high')) {
                  type = 'positive'
                } else if (strValue.startsWith('-') || strValue.toLowerCase().includes('risk') || strValue.toLowerCase().includes('poor')) {
                  type = 'negative'
                }
                
                if ((selectedOption as any).warning) {
                  type = 'warning'
                }

                consequences.push({
                  type,
                  label: key.replace(/([A-Z])/g, ' $1').trim(),
                  value: strValue,
                  description: (selectedOption as any).insight || (selectedOption as any).warning
                })
              })
            }

            // Apply state changes
            // (In a real implementation, this would call the state manager service)
          }
        }

        // Check if stage is complete
        const isComplete = questionEngine.isStageComplete(currentStage, [...responses, fullResponse])
        
        if (isComplete) {
          // Get next stage
          const nextStage = questionEngine.getNextStage(currentStage)
          
          if (nextStage === null) {
            // Assessment complete
            return { 
              type: 'assessment_complete',
              consequences
            }
          }
          
          // Move to next stage
          setCurrentStage(nextStage)
          return { 
            type: 'stage_complete', 
            stage: currentStage,
            consequences
          }
        }

        // Get next question
        const nextQuestion = questionEngine.getNextQuestion(
          currentQuestion?.id || '',
          currentStage,
          [...responses, fullResponse],
          currentState as any // Type assertion for now
        )

        if (nextQuestion) {
          setCurrentQuestion(nextQuestion)
          setQuestionHistory(prev => 
            prev.includes(nextQuestion.id) ? prev : [...prev, nextQuestion.id]
          )
          return { 
            type: 'next_question', 
            question: nextQuestion,
            consequences
          }
        }

        // No more questions, stage complete
        const nextStage = questionEngine.getNextStage(currentStage)
        if (nextStage === null) {
          return { 
            type: 'assessment_complete',
            consequences
          }
        }
        
        setCurrentStage(nextStage)
        return { 
          type: 'stage_complete', 
          stage: currentStage,
          consequences
        }
      } catch (error) {
        console.error('Error submitting answer:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [currentQuestion, currentStage, responses, currentState, assessmentId]
  )

  const pauseAssessment = useCallback(async () => {
    setAssessment(prev => ({ ...prev, status: 'paused' }))
    
    // Save current state to server so we can resume from exact position
    try {
      await fetch(`/api/assessment/${assessmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paused',
          currentQuestionId: currentQuestion?.id,
          currentStage: currentStage
        })
      })
    } catch (error) {
      console.error('Error saving pause state:', error)
    }
  }, [assessmentId, currentQuestion?.id, currentStage])

  const resumeAssessment = useCallback(async () => {
    setAssessment(prev => ({ ...prev, status: 'in_progress' }))
  }, [])

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
    goToPreviousQuestion,
    canGoBack,
    getResponseForQuestion,
    getStageProgress
  }
}
