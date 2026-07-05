// ============================================
// The Gambit – Shared Constants
// ============================================

import type { LucideIcon } from 'lucide-react'
import { Globe, AlertTriangle, Target, BarChart3 } from 'lucide-react'
import type { StageName } from '@/src/types'


// Stage accent colours — Grandmaster's Study palette
export const STAGE_THEMES: Record<string, string> = {
  STAGE_NEG2_IDEATION: '#66607f',     // The Opening — twilight heather
  STAGE_NEG1_VISION: '#77678f',       // Development — study violet
  STAGE_0_COMMITMENT: '#b3903e',      // The Castling — aged brass
  STAGE_1_VALIDATION: '#3f6b4f',      // The Exchange — board green
  STAGE_2A_GROWTH: '#42617a',         // The Middlegame — slate blue
  STAGE_2B_EXPANSION: '#2f6f6a',      // Seizing the Center — deep teal
  STAGE_3_SCALE: '#c9a45a',           // The Promotion — bright electrum
  STAGE_WARROOM_PREP: '#8a5a2a',      // The Adjournment — amber walnut
  STAGE_4_WARROOM: '#5c1a24',         // The Grand Board — oxblood
}

// Cinematic narration metadata per stage
export const STAGE_NARRATIVES: Record<string, { month: string; title: string; desc: string }> = {
  STAGE_NEG2_IDEATION: { month: 'Move 1', title: 'The Opening', desc: 'Every great game starts with a strong first move. Define your vision, target market, and initial model.' },
  STAGE_NEG1_VISION: { month: 'Move 2', title: 'Development', desc: 'Develop your pieces. Decide what kind of company you want to build before taking the leap.' },
  STAGE_0_COMMITMENT: { month: 'Move 3', title: 'The Castling', desc: 'One irreversible move. Are you ready to commit your time and capital?' },
  STAGE_1_VALIDATION: { month: 'Move 4', title: 'The Exchange', desc: 'Test every trade. Talk to customers and prove they actually want what you are building.' },
  STAGE_2A_GROWTH: { month: 'Move 5', title: 'The Middlegame', desc: 'You have a product. Now you need to find your first true believers and early adopters.' },
  STAGE_2B_EXPANSION: { month: 'Move 6', title: 'Seizing the Center', desc: 'Growth brings pressure. Deal with scaling issues, team dynamics, and keeping customers happy.' },
  STAGE_3_SCALE: { month: 'Move 7', title: 'The Promotion', desc: 'You have hit early product-market fit. Push your pawn to the eighth rank and scale operations.' },
  STAGE_WARROOM_PREP: { month: 'Move 8', title: 'The Adjournment', desc: 'You need outside capital to truly win. Study the position and perfect your pitch before facing the Board.' },
  STAGE_4_WARROOM: { month: 'Move 9', title: 'The Grand Board', desc: 'Face the investors. Defend your valuation, handle tough questions, and close the deal.' },
}

// Stage-specific mentor tip messages
export const STAGE_MENTOR_TIPS: Record<string, string> = {
  STAGE_NEG2_IDEATION: 'Be specific about your target customer. Investors want to see you understand WHO you are building for.',
  STAGE_NEG1_VISION: 'Choose your advisory board wisely — they will shape your strategic decisions throughout the simulation.',
  STAGE_0_COMMITMENT: 'This is your "point of no return" moment. Consider both the personal and financial cost of commitment.',
  STAGE_1_VALIDATION: 'Think about both short-term survival AND long-term growth. Every decision has trade-offs.',
  STAGE_2A_GROWTH: 'Focus on unit economics. Rapid growth without a sustainable model is a recipe for failure.',
  STAGE_2B_EXPANSION: 'Culture issues at this stage can kill startups. Pay attention to team dynamics.',
  STAGE_3_SCALE: 'Scaling too fast is just as dangerous as scaling too slowly. Find the right cadence.',
  STAGE_WARROOM_PREP: 'Know your numbers cold. Investors will push back on claims you cannot back up with data.',
  STAGE_4_WARROOM: 'Confidence is key but know when to listen. The best deals come from collaborative negotiation.',
}

// Ordered list of all stages
export const STAGE_ORDER: StageName[] = [
  'STAGE_NEG2_IDEATION',
  'STAGE_NEG1_VISION',
  'STAGE_0_COMMITMENT',
  'STAGE_1_VALIDATION',
  'STAGE_2A_GROWTH',
  'STAGE_2B_EXPANSION',
  'STAGE_3_SCALE',
  'STAGE_WARROOM_PREP',
  'STAGE_4_WARROOM',
]

// Stage durations in minutes (from SOP)
export const STAGE_DURATIONS: Record<string, number> = {
  STAGE_NEG2_IDEATION: 10,
  STAGE_NEG1_VISION: 5,
  STAGE_0_COMMITMENT: 10,
  STAGE_1_VALIDATION: 10,
  STAGE_2A_GROWTH: 10,
  STAGE_2B_EXPANSION: 10,
  STAGE_3_SCALE: 10,
  STAGE_WARROOM_PREP: 10,
  STAGE_4_WARROOM: 15,
}

// Short labels shown on stage timeline
export const NARRATION_STAGE_LABELS = ['Opening', 'Develop', 'Castle', 'Exchange', 'Middlegame', 'Center', 'Promote', 'Adjourn', 'Grand Board']

// Investor voice filename overrides, keyed by investor id (stable across rename)
export const INVESTOR_VOICE_BY_ID: Record<string, string> = {
  master_coin: 'master_coin',
  lord_hustle: 'lord_hustle',
  mother_instinct: 'mother_instinct',
  hand_execution: 'hand_execution',
  spider_strategy: 'spider_strategy',
  warden_trust: 'warden_trust',
  mirror_identity: 'mirror_identity',
}

// Maps the public display title back to the stable investor id.
// Investor panel context_text shows the title; we resolve it here to look up
// voice assets and other id-keyed resources. The backend still sends the
// legacy titles — keep them forever. The chess display titles are also
// listed so any display string round-trips back to the same id.
export const INVESTOR_TITLE_TO_ID: Record<string, string> = {
  // Legacy titles (backend contract — do not remove)
  'The Mirror of Identity': 'mirror_identity',
  'The Master of Coin': 'master_coin',
  'The Lord of Hustle': 'lord_hustle',
  'The Mother of Instinct': 'mother_instinct',
  'The Hand of Execution': 'hand_execution',
  'The Spider of Strategy': 'spider_strategy',
  'The Warden of Trust': 'warden_trust',
  // Chess display titles (defensive round-trip)
  'The Arbiter of Identity': 'mirror_identity',
  'The Queen of Coin': 'master_coin',
  'The Knight of Hustle': 'lord_hustle',
  'The Blindfold Master': 'mother_instinct',
  'The Rook of Execution': 'hand_execution',
  'The Bishop of Strategy': 'spider_strategy',
  'The Warden of the King': 'warden_trust',
}

// Chess-themed display names, keyed by stable investor id. The backend keeps
// sending the legacy titles; render sites resolve through
// investorDisplayName() (src/lib/helpers.tsx) so users only ever see these.
export const INVESTOR_DISPLAY_BY_ID: Record<string, string> = {
  master_coin: 'The Queen of Coin',
  lord_hustle: 'The Knight of Hustle',
  hand_execution: 'The Rook of Execution',
  spider_strategy: 'The Bishop of Strategy',
  warden_trust: 'The Warden of the King',
  mother_instinct: 'The Blindfold Master',
  mirror_identity: 'The Arbiter of Identity',
}

// Scenario step styling — icons are lucide components (on-brand SVG, no emoji).
export const SCENARIO_STEP_STYLES: Record<string, { icon: LucideIcon; label: string; color: string; bgColor: string }> = {
  environment: { icon: Globe, label: 'ENVIRONMENT', color: '#3d6b8e', bgColor: 'bg-[#3d6b8e]/10 dark:bg-[#3d6b8e]/20' },
  problem: { icon: AlertTriangle, label: 'PROBLEM', color: '#f59e0b', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  decision: { icon: Target, label: 'YOUR DECISION', color: '#7c5a9e', bgColor: 'bg-[#7c5a9e]/10 dark:bg-[#7c5a9e]/20' },
  consequence: { icon: BarChart3, label: 'CONSEQUENCE', color: '#10b981', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
}
