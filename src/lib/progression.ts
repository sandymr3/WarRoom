// ============================================
// The Gambit — Progression catalog & pure helpers
// ----------------------------------------------------------------
// DEFINITIONS live here (titles, norms, palettes, competency copy)
// so visuals/copy ship without a backend round-trip. The BACKEND owns
// the authoritative renown number + which sigil IDs are earned.
// (Internal ids/keys keep their legacy names — display strings are chess.)
//
// No React, no side effects — pure data + functions (easy to unit-test).
// ============================================

import type {
  CompetencyCode,
  CompetencyCategory,
  RankProgress,
  SigilTierName,
} from '@/src/types'

// ------------------------------------------------------------------
// Founder Titles — the prestige ladder (chess titles). Thresholds are
// tunable here; the backend awards the renown, this maps renown → title.
// ------------------------------------------------------------------

export interface RankDef {
  tier: number
  title: string
  /** Cumulative renown required to reach this rank. */
  threshold: number
}

export const RANKS: RankDef[] = [
  { tier: 0, title: 'Novice', threshold: 0 },
  { tier: 1, title: 'Pupil', threshold: 500 },
  { tier: 2, title: 'Club Player', threshold: 1_500 },
  { tier: 3, title: 'Expert', threshold: 3_500 },
  { tier: 4, title: 'Candidate Master', threshold: 7_000 },
  { tier: 5, title: 'International Master', threshold: 12_000 },
  { tier: 6, title: 'Grandmaster', threshold: 20_000 },
]

/** Map a total renown value to a fully-resolved RankProgress. */
export function rankForRenown(renown: number): RankProgress {
  const safe = Math.max(0, Math.floor(renown || 0))
  let current = RANKS[0]
  for (const r of RANKS) {
    if (safe >= r.threshold) current = r
    else break
  }
  const next = RANKS.find((r) => r.tier === current.tier + 1)
  return {
    tier: current.tier,
    title: current.title,
    renownIntoTier: safe - current.threshold,
    renownForNextTier: next ? next.threshold - current.threshold : null,
  }
}

/** 0–1 fraction of progress through the current rank (1 at max rank). */
export function rankFraction(rank: RankProgress): number {
  if (rank.renownForNextTier == null || rank.renownForNextTier <= 0) return 1
  return Math.min(1, Math.max(0, rank.renownIntoTier / rank.renownForNextTier))
}

// ------------------------------------------------------------------
// Competency mastery — category ↔ tier (1–5) and on-brand colours.
// weightedAverage scale is 1.0–3.0 (see CompetencyCategory comments).
// ------------------------------------------------------------------

export const CATEGORY_TIER: Record<CompetencyCategory, number> = {
  HIGH_RISK: 1,
  DEVELOPMENT_REQUIRED: 2,
  FUNCTIONAL: 3,
  STRONG: 4,
  NATURAL_DOMINANT: 5,
}

export const CATEGORY_LABEL: Record<CompetencyCategory, string> = {
  HIGH_RISK: 'High Risk',
  DEVELOPMENT_REQUIRED: 'Developing',
  FUNCTIONAL: 'Functional',
  STRONG: 'Strong',
  NATURAL_DOMINANT: 'Natural-Born',
}

/** Star colour by tier — dim bronze → bright brass as mastery rises. */
export const CATEGORY_COLOR: Record<CompetencyCategory, string> = {
  HIGH_RISK: '#6b5840',
  DEVELOPMENT_REQUIRED: '#9a7b3a',
  FUNCTIONAL: '#b3903e',
  STRONG: '#d9b45f',
  NATURAL_DOMINANT: '#fff0b8',
}

export function categoryForAverage(avg: number): CompetencyCategory {
  if (avg >= 2.7) return 'NATURAL_DOMINANT'
  if (avg >= 2.3) return 'STRONG'
  if (avg >= 2.0) return 'FUNCTIONAL'
  if (avg >= 1.6) return 'DEVELOPMENT_REQUIRED'
  return 'HIGH_RISK'
}

// ------------------------------------------------------------------
// The 8 founder competencies — display name (fallback; prefer config),
// plain-language meaning (comprehension layer), and constellation
// coordinates in a 0–200 viewBox forming a crown-like star ring.
// ------------------------------------------------------------------

export interface CompetencyMeta {
  code: CompetencyCode
  name: string
  /** One-line plain-English meaning for tooltips. */
  plain: string
  x: number
  y: number
}

export const COMPETENCY_META: CompetencyMeta[] = [
  { code: 'C1', name: 'Problem Sensing', plain: 'Spotting the real problem worth solving before anyone else.', x: 38, y: 70 },
  { code: 'C2', name: 'Learning Agility', plain: 'Updating fast when the evidence changes.', x: 72, y: 40 },
  { code: 'C3', name: 'Courage', plain: 'Making the hard call under pressure and owning it.', x: 116, y: 34 },
  { code: 'C4', name: 'Financial Discipline', plain: 'Spending like every dollar is your last — runway and unit economics.', x: 158, y: 60 },
  { code: 'C5', name: 'Strategy', plain: 'Choosing where to play and where to not play.', x: 168, y: 108 },
  { code: 'C6', name: 'Influence', plain: 'Persuading investors, customers, and your own team.', x: 132, y: 150 },
  { code: 'C7', name: 'Team Management', plain: 'Building and keeping a team that ships.', x: 86, y: 158 },
  { code: 'C8', name: 'Value Creation', plain: 'Turning effort into durable customer and business value.', x: 46, y: 122 },
]

/** Closed-loop edges between competency stars (forms the "crown"). */
export const CONSTELLATION_EDGES: Array<[CompetencyCode, CompetencyCode]> = [
  ['C1', 'C2'], ['C2', 'C3'], ['C3', 'C4'], ['C4', 'C5'],
  ['C5', 'C6'], ['C6', 'C7'], ['C7', 'C8'], ['C8', 'C1'],
]

export function competencyMeta(code: CompetencyCode): CompetencyMeta | undefined {
  return COMPETENCY_META.find((c) => c.code === code)
}

// ------------------------------------------------------------------
// Norms (achievements; legacy "sigils" ids) — each tied to a genuine
// founder feat. Pure data; the id → icon mapping lives in SigilCrest.tsx.
// ------------------------------------------------------------------

export interface SigilDef {
  id: string
  name: string
  /** Plain description of the feat that earns it. */
  description: string
  tier: SigilTierName
}

export const SIGILS: SigilDef[] = [
  { id: 'first_blood', name: 'First Game', description: 'Complete your first match.', tier: 'BRONZE' },
  { id: 'the_committed', name: 'The Committed', description: 'Reach the Grand Board in any match.', tier: 'BRONZE' },
  { id: 'silver_tongue', name: 'Silver Tongue', description: 'Score 80+ persuasion on a pitch.', tier: 'SILVER' },
  { id: 'the_diplomat', name: 'The Diplomat', description: 'Negotiate a better deal than first offered.', tier: 'SILVER' },
  { id: 'the_unbroken', name: 'The Unbroken', description: 'Complete a match without a single hint from your seconds.', tier: 'SILVER' },
  { id: 'master_of_coin', name: 'Material Advantage', description: 'Project $1M+ annual revenue.', tier: 'GOLD' },
  { id: 'dragonslayer', name: 'Checkmate', description: 'Close a deal with an investor.', tier: 'GOLD' },
  { id: 'natural_born', name: 'Natural-Born', description: 'Reach Natural-Born mastery in any competency.', tier: 'GOLD' },
  { id: 'the_phoenix', name: 'The Phoenix', description: 'Beat your previous legacy score by 15+.', tier: 'GOLD' },
  { id: 'iron_will', name: 'The Long Grind', description: 'Keep the study candle burning for 4 weeks running.', tier: 'GOLD' },
  { id: 'the_strategist', name: 'The Strategist', description: 'Reach Strong+ in Strategy and Financial Discipline.', tier: 'GOLD' },
  { id: 'polymath', name: 'The Polymath', description: 'Reach Strong+ in all eight competencies.', tier: 'OBSIDIAN' },
  { id: 'the_sovereign', name: 'The Grandmaster', description: 'Rise to the title of Grandmaster.', tier: 'OBSIDIAN' },
  { id: 'unanimous', name: 'Unanimous Decision', description: 'Win a favourable verdict from every investor.', tier: 'OBSIDIAN' },
]

export function sigilById(id: string): SigilDef | undefined {
  return SIGILS.find((s) => s.id === id)
}

export interface SigilTierStyle {
  base: string
  bright: string
  label: string
}

export const SIGIL_TIER_COLOR: Record<SigilTierName, SigilTierStyle> = {
  BRONZE: { base: '#a05a2c', bright: '#c8814c', label: 'Bronze' },
  SILVER: { base: '#8a8f98', bright: '#c4cad2', label: 'Silver' },
  GOLD: { base: '#b3903e', bright: '#d9b45f', label: 'Gold' },
  OBSIDIAN: { base: '#3a2a52', bright: '#7a5ca0', label: 'Obsidian' },
}

// ------------------------------------------------------------------
// Club identity (legacy "house" keys) — palettes & crest shapes unlock
// by title (earned, never purchased). All palette colours are on-brand.
// ------------------------------------------------------------------

export interface HousePalette {
  id: string
  name: string
  primary: string
  secondary: string
  /** Rank tier required to unlock. */
  unlockRank: number
}

export const HOUSE_PALETTES: HousePalette[] = [
  { id: 'gold', name: 'Brass & Ebony', primary: '#d9b45f', secondary: '#7a6224', unlockRank: 0 },
  { id: 'crimson', name: 'Oxblood', primary: '#8e3644', secondary: '#5c1a24', unlockRank: 0 },
  { id: 'verdant', name: 'Tournament Green', primary: '#3f9c6f', secondary: '#2d6a4f', unlockRank: 1 },
  { id: 'sapphire', name: 'Deep Waters', primary: '#3d6b8e', secondary: '#1a3a5c', unlockRank: 2 },
  { id: 'ember', name: 'Candlelight', primary: '#e5a94d', secondary: '#d98e2b', unlockRank: 3 },
  { id: 'amethyst', name: 'Twilight Study', primary: '#7a5ca0', secondary: '#4a2060', unlockRank: 4 },
]

export function paletteById(id: string): HousePalette {
  return HOUSE_PALETTES.find((p) => p.id === id) ?? HOUSE_PALETTES[0]
}

/** Crest shapes — id → display name; the icon mapping lives in SigilCrest.tsx. */
export interface HouseSigilDef {
  id: string
  name: string
  unlockRank: number
}

export const HOUSE_SIGILS: HouseSigilDef[] = [
  { id: 'blade', name: 'The Pawn', unlockRank: 0 },
  { id: 'flame', name: 'The Bishop', unlockRank: 0 },
  { id: 'tower', name: 'The Rook', unlockRank: 0 },
  { id: 'crown', name: 'The King', unlockRank: 2 },
  { id: 'wolf', name: 'The Knight', unlockRank: 3 },
  { id: 'dragon', name: 'The Queen', unlockRank: 5 },
]

export function houseSigilById(id: string): HouseSigilDef {
  return HOUSE_SIGILS.find((s) => s.id === id) ?? HOUSE_SIGILS[0]
}

/** Curated club mottos. Customizer also allows capped free-text. */
export const HOUSE_WORDS: string[] = [
  'Every Move Counts',
  'Ship Without Fear',
  'We Do Not Flinch',
  'The Bold Endure',
  'Conviction Over Comfort',
  'Play the Long Game',
  'First, Then Fast',
  'Think Three Moves Ahead',
]

export const HOUSE_WORDS_MAX = 32

export const DEFAULT_HOUSE = {
  sigilId: 'blade',
  words: 'The Bold Endure',
  paletteId: 'gold',
} as const

export function isUnlocked(unlockRank: number, currentTier: number): boolean {
  return currentTier >= unlockRank
}
