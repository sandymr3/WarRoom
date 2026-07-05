// ============================================
// The Gambit — Codex (lore → plain language)
// ----------------------------------------------------------------
// Central plain-language definitions for the themed terms, surfaced
// via <LoreTip>. Keeps the chess metaphors atmospheric without
// sacrificing comprehension. One source of truth for the copy.
// ============================================

export const LORE = {
  renown:
    'Rating — your prestige score, earned by making strong decisions in matches. It raises your Founder Title.',
  founderRank:
    'Founder Title — your prestige tier, from Novice up to Grandmaster, earned by accumulating Rating.',
  ranking:
    'Your live position on this cohort’s leaderboard, ranked by projected revenue.',
  constellation:
    'Each star is one of your eight founder competencies. It brightens as you master that skill across matches.',
  sigil:
    'Norms are achievements for genuine feats — earned through merit, never bought.',
  hearth:
    'The Study Candle tracks your weekly consistency. Keep it burning by returning each week.',
  house:
    'Your Club is your identity — crest, motto, and colours. New options unlock as your title rises.',
  ironRankings:
    'The Elo Ladder ranks every founder in your cohort by projected revenue.',
  legacyScore:
    'Your legacy score is the investors’ average verdict from a completed match.',
} as const

export type LoreKey = keyof typeof LORE
