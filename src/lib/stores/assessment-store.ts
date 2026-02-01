/**
 * Assessment Store
 * Zustand store for managing assessment state client-side
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Question,
  QuestionResponse,
  FullAssessmentState,
  StageNumber,
  MistakeCode,
  CompetencyScore,
  MistakeTriggered,
} from '@/src/types'
import {
  createInitialState,
  applyConsequence,
  triggerMistake as addMistakeToState,
  logDecision,
  setBusinessContext,
} from '@/src/lib/services/state-manager'
import {
  getStageConfig,
  getNextQuestion,
  getStageProgress,
  isStageComplete,
} from '@/src/lib/services/question-engine'

// ============================================
// STORE INTERFACE
// ============================================

export interface AssessmentStore {
  // Assessment Identity
  assessmentId: string | null
  userId: string | null
  attemptNumber: 1 | 2
  
  // Navigation State
  currentStage: StageNumber
  currentQuestion: Question | null
  questionHistory: string[]
  
  // Simulation State
  simulationState: FullAssessmentState
  
  // Response Tracking
  responses: QuestionResponse[]
  
  // Scoring
  competencyScores: CompetencyScore[]
  mistakesTriggered: MistakeTriggered[]
  
  // UI State
  isLoading: boolean
  isSaving: boolean
  error: string | null
  showStageReport: boolean
  showFinalReport: boolean
  
  // Timer State
  stageStartTime: Date | null
  totalTimeSpent: number // in seconds
  
  // Actions
  initializeAssessment: (assessmentId: string, userId: string, attemptNumber: 1 | 2) => void
  loadAssessment: (data: Partial<AssessmentStore>) => void
  setCurrentQuestion: (question: Question | null) => void
  submitResponse: (response: QuestionResponse) => void
  applyStateChange: (changes: Record<string, any>) => void
  triggerMistake: (mistakeCode: MistakeCode, questionId: string, response: string) => void
  advanceToNextQuestion: () => void
  completeStage: () => void
  advanceToNextStage: () => void
  setShowStageReport: (show: boolean) => void
  setShowFinalReport: (show: boolean) => void
  updateCompetencyScores: (scores: CompetencyScore[]) => void
  setBusinessContext: (context: Partial<FullAssessmentState['businessIdea']>) => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  resetAssessment: () => void
  getProgress: () => { stage: number; question: number; total: number; percentage: number }
}

// ============================================
// INITIAL STATE
// ============================================

const initialStoreState = {
  assessmentId: null,
  userId: null,
  attemptNumber: 1 as const,
  currentStage: -2 as StageNumber,
  currentQuestion: null,
  questionHistory: [],
  simulationState: createInitialState(),
  responses: [],
  competencyScores: [],
  mistakesTriggered: [],
  isLoading: false,
  isSaving: false,
  error: null,
  showStageReport: false,
  showFinalReport: false,
  stageStartTime: null,
  totalTimeSpent: 0,
}

// ============================================
// STORE CREATION
// ============================================

export const useAssessmentStore = create<AssessmentStore>()(
  persist(
    (set, get) => ({
      ...initialStoreState,
      
      // Initialize a new assessment
      initializeAssessment: (assessmentId, userId, attemptNumber) => {
        const stageConfig = getStageConfig(-2)
        const firstQuestion = stageConfig.questions[0] || null
        
        set({
          assessmentId,
          userId,
          attemptNumber,
          currentStage: -2,
          currentQuestion: firstQuestion,
          questionHistory: firstQuestion ? [firstQuestion.id] : [],
          simulationState: createInitialState(),
          responses: [],
          competencyScores: [],
          mistakesTriggered: [],
          isLoading: false,
          error: null,
          showStageReport: false,
          showFinalReport: false,
          stageStartTime: new Date(),
          totalTimeSpent: 0,
        })
      },
      
      // Load existing assessment data
      loadAssessment: (data) => {
        set((state) => ({
          ...state,
          ...data,
          stageStartTime: data.stageStartTime ? new Date(data.stageStartTime) : state.stageStartTime,
        }))
      },
      
      // Set current question
      setCurrentQuestion: (question) => {
        set((state) => ({
          currentQuestion: question,
          questionHistory: question && !state.questionHistory.includes(question.id)
            ? [...state.questionHistory, question.id]
            : state.questionHistory,
        }))
      },
      
      // Submit a response
      submitResponse: (response) => {
        set((state) => {
          // Add response to list
          const updatedResponses = [...state.responses, response]
          
          // Log the decision
          const updatedState = logDecision(state.simulationState, {
            questionId: response.questionId,
            stageNumber: state.currentStage,
            decision: JSON.stringify(response.responseData),
          })
          
          return {
            responses: updatedResponses,
            simulationState: updatedState,
          }
        })
      },
      
      // Apply state changes from consequences
      applyStateChange: (changes) => {
        set((state) => ({
          simulationState: applyConsequence(state.simulationState, changes),
        }))
      },
      
      // Trigger a mistake
      triggerMistake: (mistakeCode, questionId, response) => {
        set((state) => {
          // Check if already triggered
          if (state.mistakesTriggered.some(m => m.mistakeCode === mistakeCode)) {
            return state
          }
          
          // Create mistake record
          const newMistake: MistakeTriggered = {
            assessmentId: state.assessmentId || '',
            mistakeCode,
            mistakeName: mistakeCode, // Will be resolved by detector
            triggeredAtStage: state.currentStage,
            triggerQuestionId: questionId,
            triggerResponse: response,
            immediateImpactApplied: {},
            compoundingImpactsApplied: [],
            recovered: false,
            totalCompoundedCost: 0,
            triggeredAt: new Date(),
          }
          
          return {
            mistakesTriggered: [...state.mistakesTriggered, newMistake],
            simulationState: addMistakeToState(state.simulationState, mistakeCode),
          }
        })
      },
      
      // Advance to next question
      advanceToNextQuestion: () => {
        const state = get()
        const { currentQuestion, currentStage, responses, simulationState } = state
        
        if (!currentQuestion) return
        
        const nextQuestion = getNextQuestion(
          currentQuestion.id,
          currentStage,
          responses,
          simulationState
        )
        
        if (nextQuestion) {
          set({
            currentQuestion: nextQuestion,
            questionHistory: [...state.questionHistory, nextQuestion.id],
          })
        } else {
          // Stage complete
          set({ showStageReport: true })
        }
      },
      
      // Complete current stage
      completeStage: () => {
        set({ showStageReport: true })
      },
      
      // Advance to next stage
      advanceToNextStage: () => {
        const state = get()
        const nextStage = (state.currentStage + 1) as StageNumber
        
        if (nextStage > 3) {
          // Assessment complete
          set({ showFinalReport: true, showStageReport: false })
          return
        }
        
        try {
          const stageConfig = getStageConfig(nextStage)
          const firstQuestion = stageConfig.questions[0] || null
          
          set({
            currentStage: nextStage,
            currentQuestion: firstQuestion,
            questionHistory: firstQuestion 
              ? [...state.questionHistory, firstQuestion.id] 
              : state.questionHistory,
            showStageReport: false,
            stageStartTime: new Date(),
          })
        } catch (error) {
          set({ error: `Failed to load stage ${nextStage}` })
        }
      },
      
      // Toggle stage report visibility
      setShowStageReport: (show) => set({ showStageReport: show }),
      
      // Toggle final report visibility
      setShowFinalReport: (show) => set({ showFinalReport: show }),
      
      // Update competency scores
      updateCompetencyScores: (scores) => set({ competencyScores: scores }),
      
      // Set business context
      setBusinessContext: (context) => {
        set((state) => ({
          simulationState: setBusinessContext(state.simulationState, context),
        }))
      },
      
      // Set error
      setError: (error) => set({ error }),
      
      // Set loading
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Set saving
      setSaving: (saving) => set({ isSaving: saving }),
      
      // Reset assessment
      resetAssessment: () => set(initialStoreState),
      
      // Get progress
      getProgress: () => {
        const state = get()
        const { currentStage, responses } = state
        
        const stageProgress = getStageProgress(currentStage, responses)
        const stages: StageNumber[] = [-2, -1, 0, 1, 2, 3]
        const stageIndex = stages.indexOf(currentStage)
        
        // Calculate overall progress
        const completedStages = stageIndex
        const totalStages = stages.length
        const stageWeight = 100 / totalStages
        const overallProgress = (completedStages * stageWeight) + 
          (stageProgress.percentage * stageWeight / 100)
        
        return {
          stage: currentStage,
          question: stageProgress.answered,
          total: stageProgress.total,
          percentage: Math.round(overallProgress),
        }
      },
    }),
    {
      name: 'kk-warroom-assessment',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        assessmentId: state.assessmentId,
        userId: state.userId,
        attemptNumber: state.attemptNumber,
        currentStage: state.currentStage,
        questionHistory: state.questionHistory,
        simulationState: state.simulationState,
        responses: state.responses,
        competencyScores: state.competencyScores,
        mistakesTriggered: state.mistakesTriggered,
        totalTimeSpent: state.totalTimeSpent,
      }),
    }
  )
)

// ============================================
// SELECTORS
// ============================================

export const selectCurrentStage = (state: AssessmentStore) => state.currentStage
export const selectCurrentQuestion = (state: AssessmentStore) => state.currentQuestion
export const selectSimulationState = (state: AssessmentStore) => state.simulationState
export const selectResponses = (state: AssessmentStore) => state.responses
export const selectMistakes = (state: AssessmentStore) => state.mistakesTriggered
export const selectCompetencyScores = (state: AssessmentStore) => state.competencyScores
export const selectIsLoading = (state: AssessmentStore) => state.isLoading
export const selectError = (state: AssessmentStore) => state.error

export default useAssessmentStore
