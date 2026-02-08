export type AssessmentStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'paused' 
  | 'completed' 
  | 'abandoned'

export interface BusinessContext {
  industry?: string
  customerSegment?: string
  problem?: string
  solution?: string
  targetAudience?: string
  stage?: string // Current stage of the assessment
  // Add other relevant business context fields as needed
}

export interface Assessment {
  id: string
  userId: string
  attemptNumber: 1 | 2
  status: AssessmentStatus
  currentStage: number
  currentQuestionId?: string
  businessContext?: BusinessContext // Use the new interface
  selectedPanelists?: string[] // Added for tracking selected panelists
  startedAt?: Date
  completedAt?: Date
  totalDurationMinutes: number
  lastActivityAt: Date
}

export interface Stage {
  id: string
  assessmentId: string
  stageNumber: number
  stageName: string
  startedAt?: Date
  completedAt?: Date
  durationMinutes: number
  stateSnapshot?: any // Declare AssessmentState as any for now
}

// AssessmentState should be declared or imported here
type AssessmentState = any; // Placeholder declaration
