// Shark Tank-style Panel Members
// Behavioral abstractions for AI-driven entrepreneurial simulation

import judgesData from './data/judges.json'

export type PanelistCategory = 'mentor' | 'investor' | 'leader'

export interface Panelist {
  id: string
  name: string
  role: string
  category: PanelistCategory
  primaryLens: string
  avatar?: string // Initials or emoji for avatar
  
  // Core characteristics for AI behavior
  characteristics: string[]
  
  // Challenge questions this panelist asks
  challengeQuestions: string[]
  
  // Decision tree triggers
  triggers: string[]
  
  // How they provide guidance
  guidanceStyle: string
  
  // Tone and personality
  tone: 'aggressive' | 'calm' | 'intense' | 'analytical' | 'warm' | 'blunt' | 'skeptical' | 'optimistic'
  
  // Short bio for display
  bio: string
  
  // Pre-written remarks for multiple-choice options (keyed by question ID, then option ID)
  remarks: {
    [questionId: string]: {
      [optionId: string]: string
    }
  }
}

export const ALL_PANELISTS: Panelist[] = judgesData as Panelist[]

export const PANELISTS_BY_CATEGORY = ALL_PANELISTS.reduce((acc, panelist) => {
  acc[panelist.category] = acc[panelist.category] || []
  acc[panelist.category].push(panelist)
  return acc
}, {} as Record<PanelistCategory, Panelist[]>)

export const getPanelistById = (id: string): Panelist | undefined => {
  return ALL_PANELISTS.find(p => p.id === id)
}

export const getPanelistsByIds = (ids: string[]): Panelist[] => {
  return ids.map(id => getPanelistById(id)).filter((p): p is Panelist => p !== undefined)
}

// Category display names
export const CATEGORY_LABELS: Record<PanelistCategory, string> = {
  mentor: 'Mentors',
  investor: 'Investors', 
  leader: 'Leaders'
}

export const CATEGORY_DESCRIPTIONS: Record<PanelistCategory, string> = {
  mentor: 'Inner game, strategy, and human thinking',
  investor: 'Capital discipline, risk, and returns',
  leader: 'Vision, ethics, and long-term impact'
}

// Selection rules
export const SELECTION_RULES = {
  minPerCategory: 2,
  maxPerCategory: 3,
  totalRequired: 6, // 2 from each category
  categories: ['mentor', 'investor', 'leader'] as PanelistCategory[]
}
