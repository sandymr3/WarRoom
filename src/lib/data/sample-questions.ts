import { Question } from '@/src/types/question'

export const sampleQuestions: Question[] = [
  {
    id: 'Q-1',
    type: 'open_text',
    questionText: 'What industry or market are you interested in?',
    helpText: 'Be as specific as possible. Include the problem you are solving.',
    stage: -2,
    competencies: ['C1']
  },
  {
    id: 'Q-2',
    type: 'multiple_choice',
    questionText: 'How did you identify this problem?',
    helpText: 'Select the option that best describes your discovery process.',
    stage: -2,
    competencies: ['C1', 'C2'],
    options: [
      { id: 'A', text: 'Personal experience', points: 6 },
      { id: 'B', text: 'Customer interviews', points: 10 },
      { id: 'C', text: 'Market research', points: 8 },
      { id: 'D', text: 'Observation of others', points: 4 }
    ]
  },
  {
    id: 'Q-3',
    type: 'scenario',
    questionText: 'A major customer wants 50% more capacity in 30 days. You have limited resources.',
    helpText: 'Choose how you would respond to this scenario.',
    stage: 0,
    competencies: ['C3', 'C4'],
    options: [
      { id: 'A', text: 'Decline the order to focus on core operations', points: 3 },
      { id: 'B', text: 'Attempt to scale quickly and hire more staff', points: 7 },
      { id: 'C', text: 'Negotiate for 45 days and phase the expansion', points: 10 },
      { id: 'D', text: 'Ask them to find another supplier', points: 2 }
    ]
  },
  {
    id: 'Q-4',
    type: 'budget_allocation',
    questionText: 'Allocate your $50,000 budget across these categories:',
    stage: 1,
    competencies: ['C5', 'C6']
  }
]

export const competencies = [
  { code: 'C1', name: 'Problem Sensing', category: 'Discovery' },
  { code: 'C2', name: 'Market Understanding', category: 'Discovery' },
  { code: 'C3', name: 'Value Articulation', category: 'Communication' },
  { code: 'C4', name: 'Customer Empathy', category: 'Relationships' },
  { code: 'C5', name: 'Resource Planning', category: 'Execution' },
  { code: 'C6', name: 'Financial Acumen', category: 'Execution' },
  { code: 'C7', name: 'Team Building', category: 'Leadership' },
  { code: 'C8', name: 'Adaptability', category: 'Resilience' },
  { code: 'C9', name: 'Risk Assessment', category: 'Decision Making' },
  { code: 'C10', name: 'Learning Agility', category: 'Resilience' },
  { code: 'C11', name: 'Customer Retention', category: 'Operations' },
  { code: 'C12', name: 'Execution Excellence', category: 'Operations' },
  { code: 'C13', name: 'Product Development', category: 'Innovation' },
  { code: 'C14', name: 'Market Expansion', category: 'Growth' },
  { code: 'C15', name: 'Stakeholder Alignment', category: 'Leadership' },
  { code: 'C16', name: 'Strategic Vision', category: 'Leadership' }
]
