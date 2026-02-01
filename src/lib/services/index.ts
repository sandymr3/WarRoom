/**
 * Services Index
 * Central export for all simulation services
 */

export * from './question-engine'
export * from './state-manager'
export * from './scoring-engine'
export * from './mistake-detector'
export * from './consequence-engine'

// Default exports for convenience
export { default as questionEngine } from './question-engine'
export { default as stateManager } from './state-manager'
export { default as scoringEngine } from './scoring-engine'
export { default as mistakeDetector } from './mistake-detector'
export { default as consequenceEngine } from './consequence-engine'
