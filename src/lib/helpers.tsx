// ============================================
// The Gambit – Shared Helper Functions
// ============================================

import { FileText, AlertTriangle, Target, DollarSign, Lightbulb } from 'lucide-react'
import { INVESTOR_VOICE_BY_ID, INVESTOR_TITLE_TO_ID, INVESTOR_DISPLAY_BY_ID, STAGE_NARRATIVES } from './constants'
import type { AssessmentState } from '@/src/types'

// ---- Stage / Question labels ----

export function stageLabel(s: string): string {
  // Chess display titles for known stages ("The Grand Board" instead of
  // "4 Warroom"); mechanical fallback keeps unknown backend stages readable.
  const narrative = STAGE_NARRATIVES[s]
  if (narrative) return narrative.title
  return s.replace('STAGE_', '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toLocaleString('en-US')}`
}

export function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case 'multiple_choice': return 'Multiple Choice'
    case 'scenario': return 'Scenario Based'
    case 'budget_allocation': return 'Budget Allocation'
    case 'open_text': return 'Open Response'
    case 'ai_scenario': return 'AI Scenario'
    case 'info': return 'Information'
    default: return 'Question'
  }
}

export function getQuestionTypeIcon(type: string) {
  switch (type) {
    case 'scenario': return <AlertTriangle className="h-3.5 w-3.5" />
    case 'multiple_choice': return <Target className="h-3.5 w-3.5" />
    case 'budget_allocation': return <DollarSign className="h-3.5 w-3.5" />
    case 'ai_scenario': return <Lightbulb className="h-3.5 w-3.5" />
    case 'info': return <FileText className="h-3.5 w-3.5" />
    default: return <FileText className="h-3.5 w-3.5" />
  }
}

export function getQuestionTypeColor(type: string): string {
  switch (type) {
    case 'scenario': return '#d98e2b'
    case 'multiple_choice': return '#b3903e'
    case 'budget_allocation': return '#2d6a4f'
    case 'ai_scenario': return '#5c1a24'
    case 'info': return '#42617a'
    default: return '#77678f'
  }
}

// ---- Voice / Audio helpers ----

export function normalizeVoiceSlug(value: string): string {
  const trimmed = value.trim()
  const idFromTitle = INVESTOR_TITLE_TO_ID[trimmed]
  if (idFromTitle && INVESTOR_VOICE_BY_ID[idFromTitle]) return INVESTOR_VOICE_BY_ID[idFromTitle]
  if (INVESTOR_VOICE_BY_ID[trimmed]) return INVESTOR_VOICE_BY_ID[trimmed]
  return trimmed
    .toLowerCase()
    .replace(/[\u2019']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function getVoiceKeysForName(value: string): string[] {
  const normalized = normalizeVoiceSlug(value)
  return normalized ? [normalized] : []
}

// ---- Investor display names ----

// The backend still sends the legacy titles ("The Master of Coin") in
// context_text and payloads. Resolve any title or id to its chess display
// name at render time; unknown strings pass through untouched (fail-soft).
export function investorDisplayName(titleOrId: string): string {
  const trimmed = (titleOrId ?? '').trim()
  if (!trimmed) return trimmed
  const id = INVESTOR_TITLE_TO_ID[trimmed] ?? (INVESTOR_DISPLAY_BY_ID[trimmed] ? trimmed : undefined)
  return (id && INVESTOR_DISPLAY_BY_ID[id]) || trimmed
}

// Parse structured investor panel Q lines: `Name: "Question"`
export function parseInvestorPanelQuestions(
  contextText: string
): Array<{ investorName: string; question: string; voiceKeys: string[] }> {
  return contextText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?):\s*['"](.+?)['"]$/)
      if (!match) return null
      const rawName = match[1].trim()
      const question = match[2].trim()
      // voiceKeys derive from the RAW backend name (voice ids are stable);
      // the display name shown to users is the chess title.
      return { investorName: investorDisplayName(rawName), question, voiceKeys: getVoiceKeysForName(rawName) }
    })
    .filter((item): item is { investorName: string; question: string; voiceKeys: string[] } => item !== null)
}

// ---- War Room helpers ----

type PreviousResponseEntry = Record<string, unknown>

export function normalizePreviousResponses(raw: unknown): PreviousResponseEntry[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.filter((item): item is PreviousResponseEntry => typeof item === 'object' && item !== null)
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed)
        ? parsed.filter((item): item is PreviousResponseEntry => typeof item === 'object' && item !== null)
        : []
    } catch {
      return []
    }
  }
  return []
}

export function getPreparedPitchFromState(state: AssessmentState | null): string {
  const directPitch = state?.assessment?.warRoomPitch?.trim()
  if (directPitch) return directPitch

  const previousResponses = normalizePreviousResponses(state?.assessment?.previousResponses)
  for (let i = previousResponses.length - 1; i >= 0; i--) {
    const entry = previousResponses[i] as Record<string, unknown>
    const questionId = String(entry.questionId || entry.qId || entry.question_id || entry.q_id || '').toUpperCase()
    const question = String(entry.q || entry.question || entry.questionText || entry.text || '').toLowerCase()
    const answer = String(entry.a || entry.answer || entry.response || entry.selectedOptionText || entry.text || '').trim()
    if (!answer) continue
    if (
      questionId === 'Q_WP_1' ||
      question.includes('pitch template') ||
      question.includes('war room pitch') ||
      question.includes('prepared pitch')
    ) {
      return answer
    }
  }
  return ''
}
