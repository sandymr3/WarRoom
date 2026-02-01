export interface Financial {
  capital: number
  monthlyRevenue: number
  burnRate: number
  runwayMonths: number
}

export interface Team {
  size: number
  satisfaction: number
}

export interface Customers {
  total: number
  retention: number
}

export interface AssessmentState {
  financial: Financial
  team: Team
  customers: Customers
  mistakes?: string[]
}

export interface CompetencyScore {
  id: string
  assessmentId: string
  competencyCode: string
  competencyName: string
  score: number
  levelAchieved: 'L0' | 'L1' | 'L2'
  evidence: any[]
  lastUpdated: Date
}

export interface Mistake {
  id: string
  code: string
  name: string
  description: string
  triggeredAtStage: number
  immediateImpact: string
  compoundingImpact: string
}
