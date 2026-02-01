/**
 * State Manager Service
 * Manages the evolving assessment state throughout the simulation
 */

import type {
  FullAssessmentState,
  StageNumber,
  QuestionResponse,
  MistakeCode,
  ProductState,
  MarketState,
  FinancialState,
  TeamState,
  CustomerState,
  OperationsState,
  DecisionLogEntry,
} from '@/src/types'

/**
 * Create initial assessment state
 */
export function createInitialState(): FullAssessmentState {
  return {
    product: {
      mvpBuilt: false,
      productMarketFit: 'none',
      techDebt: 'low',
      features: [],
    },
    market: {
      competitorCount: 0,
      marketPosition: 'unknown',
    },
    financial: {
      initialCapital: 0,
      currentCapital: 0,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      burnRate: 0,
      runwayMonths: 0,
      monthlyProfit: 0,
      totalCustomers: 0,
      fundingRaised: 0,
    },
    team: {
      size: 1, // Just the founder
      founderHours: 60,
      satisfaction: 100,
      roles: ['Founder'],
      hires: [],
      turnover: 0,
    },
    customers: {
      total: 0,
      active: 0,
      churnRate: 0,
      retention: 100,
      segments: [],
    },
    operations: {
      processCount: 0,
      automationLevel: 'manual',
      systemsBuilt: [],
      founderDependency: 100,
    },
    mistakesTriggered: [],
    compoundedLosses: 0,
    decisionsLog: [],
  }
}

/**
 * Apply state changes from a response
 */
export function applyStateChanges(
  currentState: FullAssessmentState,
  changes: Partial<FullAssessmentState>
): FullAssessmentState {
  return deepMerge(currentState, changes) as FullAssessmentState
}

/**
 * Apply consequence effects to state
 */
export function applyConsequence(
  currentState: FullAssessmentState,
  consequence: Record<string, any>
): FullAssessmentState {
  const newState = { ...currentState }
  
  for (const [key, value] of Object.entries(consequence)) {
    switch (key) {
      // Financial effects
      case 'capitalChange':
        newState.financial = {
          ...newState.financial,
          currentCapital: newState.financial.currentCapital + (value as number),
        }
        break
      
      case 'monthlyRevenueChange':
        newState.financial = {
          ...newState.financial,
          monthlyRevenue: newState.financial.monthlyRevenue + (value as number),
        }
        break
      
      case 'burnRateChange':
        newState.financial = {
          ...newState.financial,
          burnRate: newState.financial.burnRate + (value as number),
        }
        break
      
      case 'setCapital':
        newState.financial = {
          ...newState.financial,
          initialCapital: value as number,
          currentCapital: value as number,
        }
        break
      
      case 'hireCost':
        newState.financial = {
          ...newState.financial,
          currentCapital: newState.financial.currentCapital - (value as number),
        }
        break
      
      // Team effects
      case 'teamSizeChange':
        newState.team = {
          ...newState.team,
          size: newState.team.size + (value as number),
        }
        break
      
      case 'founderHoursChange':
        newState.team = {
          ...newState.team,
          founderHours: Math.max(0, Math.min(168, newState.team.founderHours + (value as number))),
        }
        break
      
      case 'teamSatisfactionChange':
        newState.team = {
          ...newState.team,
          satisfaction: Math.max(0, Math.min(100, newState.team.satisfaction + (value as number))),
        }
        break
      
      case 'developerMorale':
      case 'salesMorale':
        // Affect team satisfaction
        newState.team = {
          ...newState.team,
          satisfaction: Math.max(0, Math.min(100, newState.team.satisfaction + (value as number))),
        }
        break
      
      // Customer effects
      case 'customerChange':
        newState.customers = {
          ...newState.customers,
          total: Math.max(0, newState.customers.total + (value as number)),
          active: Math.max(0, newState.customers.active + (value as number)),
        }
        break
      
      case 'churnRateChange':
        newState.customers = {
          ...newState.customers,
          churnRate: Math.max(0, Math.min(100, newState.customers.churnRate + (value as number))),
          retention: Math.max(0, Math.min(100, newState.customers.retention - (value as number))),
        }
        break
      
      // Product effects
      case 'mvpBuilt':
        newState.product = {
          ...newState.product,
          mvpBuilt: value as boolean,
        }
        break
      
      case 'mvpCost':
        newState.product = {
          ...newState.product,
          mvpCost: value as number,
        }
        newState.financial = {
          ...newState.financial,
          currentCapital: newState.financial.currentCapital - (value as number),
        }
        break
      
      case 'productMarketFitChange':
        newState.product = {
          ...newState.product,
          productMarketFit: value as ProductState['productMarketFit'],
        }
        break
      
      case 'techDebtChange':
        newState.product = {
          ...newState.product,
          techDebt: value as ProductState['techDebt'],
        }
        break
      
      // Operations effects
      case 'processCountChange':
        newState.operations = {
          ...newState.operations,
          processCount: newState.operations.processCount + (value as number),
        }
        break
      
      case 'founderDependencyChange':
        newState.operations = {
          ...newState.operations,
          founderDependency: Math.max(0, Math.min(100, newState.operations.founderDependency + (value as number))),
        }
        break
      
      case 'automationLevel':
        newState.operations = {
          ...newState.operations,
          automationLevel: value as OperationsState['automationLevel'],
        }
        break
      
      // Market effects
      case 'marketPositionChange':
        newState.market = {
          ...newState.market,
          marketPosition: value as MarketState['marketPosition'],
        }
        break
    }
  }
  
  // Recalculate derived values
  return recalculateDerivedState(newState)
}

/**
 * Recalculate derived state values
 */
export function recalculateDerivedState(state: FullAssessmentState): FullAssessmentState {
  const newState = { ...state }
  
  // Calculate burn rate if not set
  if (newState.financial.monthlyExpenses > 0) {
    newState.financial.burnRate = newState.financial.monthlyExpenses - newState.financial.monthlyRevenue
  }
  
  // Calculate runway
  if (newState.financial.burnRate > 0) {
    newState.financial.runwayMonths = Math.floor(
      newState.financial.currentCapital / newState.financial.burnRate
    )
  } else if (newState.financial.burnRate <= 0 && newState.financial.monthlyRevenue > 0) {
    newState.financial.runwayMonths = 999 // Profitable
  }
  
  // Calculate monthly profit
  newState.financial.monthlyProfit = 
    newState.financial.monthlyRevenue - newState.financial.monthlyExpenses
  
  // Calculate unit economics if we have customer data
  if (newState.customers.total > 0 && newState.financial.monthlyRevenue > 0) {
    // Simplified LTV calculation
    const avgRevenuePerCustomer = newState.financial.monthlyRevenue / newState.customers.active
    const avgLifetimeMonths = newState.customers.retention > 0 
      ? 1 / (1 - newState.customers.retention / 100)
      : 12
    newState.financial.ltv = avgRevenuePerCustomer * avgLifetimeMonths
    
    // Determine unit economics status
    if (newState.financial.cac && newState.financial.ltv) {
      const ratio = newState.financial.ltv / newState.financial.cac
      newState.financial.unitEconomics = ratio > 3 ? 'positive' : ratio > 1 ? 'breakeven' : 'negative'
    }
  }
  
  return newState
}

/**
 * Log a decision
 */
export function logDecision(
  state: FullAssessmentState,
  entry: Omit<DecisionLogEntry, 'timestamp'>
): FullAssessmentState {
  return {
    ...state,
    decisionsLog: [
      ...state.decisionsLog,
      { ...entry, timestamp: new Date() },
    ],
  }
}

/**
 * Trigger a mistake
 */
export function triggerMistake(
  state: FullAssessmentState,
  mistakeCode: MistakeCode
): FullAssessmentState {
  if (state.mistakesTriggered.includes(mistakeCode)) {
    return state
  }
  
  return {
    ...state,
    mistakesTriggered: [...state.mistakesTriggered, mistakeCode],
  }
}

/**
 * Add compounded loss
 */
export function addCompoundedLoss(
  state: FullAssessmentState,
  amount: number
): FullAssessmentState {
  return {
    ...state,
    compoundedLosses: state.compoundedLosses + amount,
  }
}

/**
 * Set business context from initial questions
 */
export function setBusinessContext(
  state: FullAssessmentState,
  context: Partial<FullAssessmentState['businessIdea']>
): FullAssessmentState {
  return {
    ...state,
    businessIdea: {
      ...state.businessIdea,
      ...context,
    },
  }
}

/**
 * Get state summary for display
 */
export function getStateSummary(state: FullAssessmentState): {
  financial: { label: string; value: string }[]
  team: { label: string; value: string }[]
  customers: { label: string; value: string }[]
  operations: { label: string; value: string }[]
} {
  return {
    financial: [
      { label: 'Capital', value: `$${state.financial.currentCapital.toLocaleString()}` },
      { label: 'Monthly Revenue', value: `$${state.financial.monthlyRevenue.toLocaleString()}` },
      { label: 'Burn Rate', value: `$${state.financial.burnRate.toLocaleString()}/mo` },
      { label: 'Runway', value: state.financial.runwayMonths === 999 ? 'Profitable' : `${state.financial.runwayMonths} months` },
    ],
    team: [
      { label: 'Team Size', value: `${state.team.size} people` },
      { label: 'Founder Hours', value: `${state.team.founderHours} hrs/week` },
      { label: 'Team Satisfaction', value: `${state.team.satisfaction}%` },
    ],
    customers: [
      { label: 'Total Customers', value: state.customers.total.toLocaleString() },
      { label: 'Active Customers', value: state.customers.active.toLocaleString() },
      { label: 'Retention Rate', value: `${state.customers.retention}%` },
    ],
    operations: [
      { label: 'Processes Documented', value: `${state.operations.processCount}` },
      { label: 'Automation Level', value: state.operations.automationLevel },
      { label: 'Founder Dependency', value: `${state.operations.founderDependency}%` },
    ],
  }
}

/**
 * Deep merge utility
 */
function deepMerge(target: any, source: any): any {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      result[key] = deepMerge(target[key], source[key])
    } else {
      result[key] = source[key]
    }
  }
  
  return result
}

/**
 * Serialize state for storage
 */
export function serializeState(state: FullAssessmentState): string {
  return JSON.stringify(state)
}

/**
 * Deserialize state from storage
 */
export function deserializeState(serialized: string): FullAssessmentState {
  const parsed = JSON.parse(serialized)
  // Restore Date objects
  if (parsed.decisionsLog) {
    parsed.decisionsLog = parsed.decisionsLog.map((entry: any) => ({
      ...entry,
      timestamp: new Date(entry.timestamp),
    }))
  }
  return parsed
}

export default {
  createInitialState,
  applyStateChanges,
  applyConsequence,
  recalculateDerivedState,
  logDecision,
  triggerMistake,
  addCompoundedLoss,
  setBusinessContext,
  getStateSummary,
  serializeState,
  deserializeState,
}
