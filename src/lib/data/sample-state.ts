import { AssessmentState } from '@/src/types/state'

export const initialAssessmentState: AssessmentState = {
  financial: {
    capital: 50000,
    monthlyRevenue: 8000,
    burnRate: 4000,
    runwayMonths: 12.5
  },
  team: {
    size: 3,
    satisfaction: 8.5
  },
  customers: {
    total: 25,
    retention: 96
  },
  mistakes: []
}

export const mockAssessmentState: AssessmentState = {
  financial: {
    capital: 75000,
    monthlyRevenue: 15000,
    burnRate: 3500,
    runwayMonths: 21.4
  },
  team: {
    size: 5,
    satisfaction: 7.8
  },
  customers: {
    total: 42,
    retention: 92
  },
  mistakes: ['M1', 'M3']
}
