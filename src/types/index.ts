// ============================================
// KK's War Room - Master Type Definitions
// ============================================

// Re-export all types
export * from './assessment'
export * from './question'
export * from './state'
export * from './report'

import { Question, ResponseData } from './question'

// ============================================
// COMPETENCY TYPES
// ============================================

export type CompetencyCode = 
  | 'C1' | 'C2' | 'C3' | 'C4' 
  | 'C5' | 'C6' | 'C7' | 'C8' 
  | 'C9' | 'C10' | 'C11' | 'C12'
  | 'C13' | 'C14' | 'C15' | 'C16';

export type CompetencyLevel = 'L0' | 'L1' | 'L2';

export interface CompetencyDefinition {
  code: CompetencyCode;
  name: string;
  shortName: string;
  description: string;
  stages: number[];
  weight: number;
  levels: {
    L0: { description: string; threshold: number };
    L1: { description: string; threshold: number };
    L2: { description: string; threshold: number };
  };
  indicators: string[];
}

// ============================================
// MISTAKE TYPES
// ============================================

export type MistakeCode = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M7' | 'M8';

export interface MistakeDefinition {
  code: MistakeCode;
  name: string;
  description: string;
  detectableAtStages: number[];
  detectionTriggers: {
    questionId: string;
    condition: string;
    optionIds?: string[];
  }[];
  immediateImpact: {
    description: string;
    effects: Record<string, number | string>;
  };
  compoundingEffects: {
    stage: number;
    description: string;
    multiplier: number;
    additionalEffects: Record<string, number | string>;
  }[];
  recoveryPath: {
    description: string;
    requirements: string[];
    partialRecoveryPossible: boolean;
  };
}

// ============================================
// STAGE TYPES
// ============================================

export type StageNumber = -2 | -1 | 0 | 1 | 2 | 3;

export type StageName = 'IDEATING' | 'CONCEPTING' | 'COMMITTING' | 'VALIDATING' | 'SCALING' | 'ESTABLISHING';

// Narrative types for Detroit-style intros
export interface NarrativeIntro {
  character: 'MENTOR' | 'INVESTOR' | 'CUSTOMER' | 'TEAM_MEMBER' | 'NARRATOR';
  lines: string[];
}

export interface ScenarioConfig {
  context: string;
  stakes?: string;
}

export interface StageDefinition {
  id: string;
  number: StageNumber;
  name: StageName;
  title: string;
  goal: string;
  subtitle?: string;
  durationMinutes: number;
  competencies: CompetencyCode[];
  simulatedMonths?: number[];
  startingState?: Record<string, any>;
  introNarrative?: NarrativeIntro;
  introMedia?: MediaAsset;
  stageEndCheck?: {
    requiredCompetencies: CompetencyCode[];
    minimumQuestions: number;
    convergenceLogic?: string;
  };
}

export interface StageConfig {
  stage: StageDefinition;
  questions: Question[];
  stageEndSummary?: StageEndSummary;
  stageTransition?: StageTransitionConfig;
  phaseEndConfig?: PhaseEndConfig;
}

export interface StageEndSummary {
  competencyScores: CompetencyCode[];
  allCompetencyScores?: CompetencyCode[];
  financialState?: {
    display: { label: string; value: string }[];
  };
  teamHealth?: {
    display: { label: string; value: string }[];
  };
  mistakesTriggered?: {
    display: boolean;
    showImpact: boolean;
    showCompounding: boolean;
  };
  aiJustification?: {
    format: Record<string, string>;
  };
}

export interface StageTransitionConfig {
  narrativeIntro?: string;
  nextStage: StageNumber;
  timeAdvance?: {
    months: number;
    narrative: string;
  };
}

export interface PhaseEndConfig {
  showMetrics: MetricDisplay[];
  showCompetencyScores: { competency: CompetencyCode; label: string }[];
  mistakesToShow?: MistakeCode[];
  nextStage?: StageNumber;
  transitionMessage?: string;
  finalReportTrigger?: boolean;
  showAllCompetencySummary?: boolean;
  showMistakeCompoundingAnalysis?: boolean;
  completionMessage?: string;
}

export interface MetricDisplay {
  metric: string;
  label: string;
  format?: 'currency' | 'percentage' | 'number' | 'count';
}

// ============================================
// MEDIA TYPES
// ============================================

export type MediaType = 'image' | 'video' | 'audio' | 'none';

export interface MediaAsset {
  type: MediaType;
  url: string | null;
  altText?: string;
  transcript?: string;
  thumbnailUrl?: string;
  duration?: number; // in seconds for video/audio
}

// ============================================
// ASSESSMENT STATE TYPES (EXTENDED)
// ============================================

export interface ProductState {
  mvpBuilt: boolean;
  mvpCost?: number;
  productMarketFit: 'none' | 'weak' | 'moderate' | 'strong';
  techDebt: 'low' | 'medium' | 'high';
  features: string[];
}

export interface MarketState {
  targetMarket?: string;
  marketSize?: number;
  competitorCount: number;
  differentiator?: string;
  marketPosition: 'unknown' | 'follower' | 'challenger' | 'leader';
}

export interface FinancialState {
  initialCapital: number;
  currentCapital: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  burnRate: number;
  runwayMonths: number;
  monthlyProfit: number;
  totalCustomers: number;
  cac?: number;
  ltv?: number;
  unitEconomics?: 'negative' | 'breakeven' | 'positive';
  fundingRaised: number;
  fundingStage?: 'bootstrapped' | 'friends-family' | 'angel' | 'seed' | 'series-a';
}

export interface TeamState {
  size: number;
  founderHours: number;
  satisfaction: number; // 0-100
  roles: string[];
  hires: { role: string; salary: number; hiredAtStage: number }[];
  turnover: number;
}

export interface CustomerState {
  total: number;
  active: number;
  churnRate: number;
  retention: number; // 0-100
  nps?: number;
  segments: string[];
}

export interface OperationsState {
  processCount: number;
  automationLevel: 'manual' | 'partial' | 'automated';
  systemsBuilt: string[];
  founderDependency: number; // 0-100, lower is better
}

export interface FullAssessmentState {
  product: ProductState;
  market: MarketState;
  financial: FinancialState;
  team: TeamState;
  customers: CustomerState;
  operations: OperationsState;
  
  // Business context from user input
  businessIdea?: {
    industry?: string;
    problem?: string;
    solution?: string;
    customerSegment?: string;
    revenueModel?: string;
  };
  
  // Tracking
  mistakesTriggered: MistakeCode[];
  compoundedLosses: number;
  decisionsLog: DecisionLogEntry[];
}

export interface DecisionLogEntry {
  questionId: string;
  stageNumber: StageNumber;
  decision: string;
  consequence?: string;
  timestamp: Date;
}

// ============================================
// COMPETENCY SCORE TYPES (EXTENDED)
// ============================================

export interface CompetencyScore {
  id?: string;
  assessmentId: string;
  competencyCode: CompetencyCode;
  competencyName: string;
  currentScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  levelAchieved: CompetencyLevel;
  evidence: EvidenceItem[];
  stageScores: { stage: StageNumber; score: number }[];
  lastUpdated: Date;
}

export interface EvidenceItem {
  questionId: string;
  response: string;
  pointsAwarded: number;
  levelDemonstrated?: CompetencyLevel;
  aiNotes?: string;
}

// ============================================
// MISTAKE TRACKING TYPES
// ============================================

export interface MistakeTriggered {
  id?: string;
  assessmentId: string;
  mistakeCode: MistakeCode;
  mistakeName: string;
  triggeredAtStage: StageNumber;
  triggerQuestionId: string;
  triggerResponse: string;
  immediateImpactApplied: Record<string, any>;
  compoundingImpactsApplied: {
    stage: StageNumber;
    impact: Record<string, any>;
    totalCost: number;
  }[];
  recovered: boolean;
  recoveredAtStage?: StageNumber;
  totalCompoundedCost: number;
  triggeredAt: Date;
}

// ============================================
// REPORT TYPES
// ============================================

export interface AssessmentReport {
  id?: string;
  assessmentId: string;
  attemptNumber: 1 | 2;
  generatedAt: Date;
  
  executiveSummary: ExecutiveSummary;
  competencyProfile: CompetencyProfile;
  mistakeAnalysis: MistakeAnalysis;
  stageBreakdown: StageBreakdown[];
  recommendations: Recommendation[];
  
  // For attempt 2 comparison
  previousAttemptComparison?: AttemptComparison;
}

export interface ExecutiveSummary {
  overallReadiness: 'not_ready' | 'developing' | 'ready' | 'highly_ready';
  overallScore: number;
  maxScore: number;
  percentile?: number;
  keyStrengths: string[];
  criticalGaps: string[];
  primaryRecommendation: string;
}

export interface CompetencyProfile {
  scores: CompetencyScore[];
  strongestCompetencies: CompetencyCode[];
  weakestCompetencies: CompetencyCode[];
  averageLevel: CompetencyLevel;
  radarChartData: { competency: string; score: number }[];
}

export interface MistakeAnalysis {
  mistakesTriggered: MistakeTriggered[];
  mistakesAvoided: MistakeCode[];
  totalCompoundedCost: number;
  worstMistake?: MistakeTriggered;
  mistakePattern?: string;
}

export interface StageBreakdown {
  stageNumber: StageNumber;
  stageName: string;
  score: number;
  maxScore: number;
  timeSpentMinutes: number;
  questionsAnswered: number;
  competenciesAssessed: CompetencyCode[];
  highlights: string[];
  concerns: string[];
}

export interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  area: 'competency' | 'mistake' | 'general';
  title: string;
  description: string;
  actionItems: string[];
  relatedCompetencies?: CompetencyCode[];
  relatedMistakes?: MistakeCode[];
}

export interface AttemptComparison {
  attempt1Score: number;
  attempt2Score: number;
  improvement: number;
  improvementPercentage: number;
  competencyChanges: {
    competency: CompetencyCode;
    attempt1Level: CompetencyLevel;
    attempt2Level: CompetencyLevel;
    improved: boolean;
  }[];
  mistakesFixedInAttempt2: MistakeCode[];
  newMistakesInAttempt2: MistakeCode[];
  overallAssessment: string;
}

// ============================================
// API TYPES
// ============================================

export interface CreateAssessmentRequest {
  userId: string;
  cohortId?: string;
  attemptNumber: 1 | 2;
}

export interface SubmitResponseRequest {
  assessmentId: string;
  questionId: string;
  responseData: ResponseData;
  responseTimeSeconds: number;
}

export interface GetAssessmentResponse {
  assessment: import('./assessment').Assessment;
  currentQuestion?: Question;
  state: FullAssessmentState;
  progress: {
    currentStage: StageNumber;
    questionsAnsweredInStage: number;
    totalQuestionsInStage: number;
    overallProgress: number;
  };
}

export interface StageReportResponse {
  stageNumber: StageNumber;
  stageName: string;
  competencyScores: CompetencyScore[];
  mistakesTriggered: MistakeTriggered[];
  stateSnapshot: FullAssessmentState;
  transitionMessage: string;
  nextStage?: StageNumber;
}

// ============================================
// UTILITY TYPES
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ============================================
// UI/DISPLAY TYPES
// ============================================

export interface ConsequenceItem {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  label: string;
  value: string | number;
  icon?: 'money' | 'time' | 'team' | 'customers' | 'warning' | 'success';
  description?: string;
}

export interface CompetencyScoreDisplay {
  code: string;
  name: string;
  score: number;
  level: CompetencyLevel;
  trend?: 'up' | 'down' | 'stable';
}

export interface MistakeDisplay {
  code: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  compoundingNote?: string;
}

export interface StageMetric {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export interface StageMetricDisplay {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}
