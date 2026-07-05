import type { NarratorLine } from '@/src/state/narratorStore'

/**
 * NARRATOR_SCRIPTS — pre-authored dialogue lines keyed by phase.
 *
 * This file is intentionally append-only. Each slice adds the lines
 * it needs without rewriting existing entries. The landing slice
 * populates only the two `landing.*` keys; future slices populate
 * `stage.*`, `warroom.*`, `verdict.*`, etc.
 */

export const NARRATOR_SCRIPTS: Record<string, NarratorLine[]> = {
  'landing.first-visit': [
    {
      text: 'Welcome, challenger. I am the Grandmaster of the Gambit.',
      mood: 'idle',
      duration: 3200,
    },
    {
      text: 'Before you stands the finest match a founder can play.',
      mood: 'speaking',
      duration: 3600,
    },
    {
      text: 'Eight rounds to prepare. Then... the Grand Board.',
      mood: 'warning',
      duration: 3200,
    },
    {
      text: 'Are you ready to defend your position before the Board?',
      mood: 'idle',
      duration: 0,
    },
  ],

  'landing.returning': [
    {
      text: 'You return, challenger. The Board remembers.',
      mood: 'idle',
      duration: 2800,
    },
  ],

  'dashboard.first-visit': [
    {
      text: 'Welcome to the Study. This is your quiet board between matches.',
      mood: 'idle',
      duration: 3600,
    },
    {
      text: 'When you are ready, the match begins beyond that door.',
      mood: 'pointing',
      highlight: 'dashboard-begin-cta',
      duration: 3400,
    },
    {
      text: 'The Elo Ladder tracks every founder who has entered the tournament.',
      mood: 'speaking',
      duration: 3400,
    },
    {
      text: 'Choose your line, challenger.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'dashboard.returning': [
    {
      text: 'The Study is quiet, challenger. Your games await.',
      mood: 'idle',
      duration: 2600,
    },
  ],

  'assessment.first-visit': [
    {
      text: 'The match has many lines, challenger. Choose your level with care.',
      mood: 'idle',
      duration: 3400,
    },
    {
      text: 'A Student plays a guided game. A Grandmaster faces the full tournament.',
      mood: 'speaking',
      duration: 4000,
    },
    {
      text: 'Nine rounds await — from the first move of the Opening to the Grand Board itself.',
      mood: 'speaking',
      duration: 3600,
    },
    {
      text: 'Commit your opening below, then press Begin the Match when you are ready.',
      mood: 'pointing',
      highlight: 'assessment-start-cta',
      duration: 0,
    },
  ],

  'assessment.returning': [
    {
      text: 'You return to the board, challenger. The Board remembers your last game.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'leaderboard.first-visit': [
    {
      text: 'The Elo Ladder, challenger. Here, all founders are measured by the value they command.',
      mood: 'idle',
      duration: 3600,
    },
    {
      text: 'Your projected revenue determines your standing on the board.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'The summit awaits the boldest.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'leaderboard.returning': [
    {
      text: 'The ratings shift with every match. Where do you stand now, challenger?',
      mood: 'idle',
      duration: 0,
    },
  ],

  'results.first-visit': [
    {
      text: 'The Annotated Games, challenger. Every match you have played is recorded here.',
      mood: 'idle',
      duration: 3600,
    },
    {
      text: 'Study your strengths and blunders — the Board remembers every move.',
      mood: 'speaking',
      duration: 3400,
    },
    {
      text: 'The wisest players study the board before they play again.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'results.returning': [
    {
      text: 'Your games await review, challenger. Has the analysis revealed new wisdom?',
      mood: 'idle',
      duration: 0,
    },
  ],

  'history.first-visit': [
    {
      text: 'The Scorebook, challenger. A record of every question asked and answer given.',
      mood: 'idle',
      duration: 3600,
    },
    {
      text: 'No detail is lost here — every move was written to the sheet.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Review your past, and the games to come will be sharper for it.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'history.returning': [
    {
      text: 'The scorebook remains as you left it, challenger.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'settings.first-visit': [
    {
      text: 'The Preparation Room, challenger. Here you may set your preferences.',
      mood: 'idle',
      duration: 3200,
    },
    {
      text: 'Shape the Gambit to your liking — but the matches remain the same.',
      mood: 'speaking',
      duration: 0,
    },
  ],

  'settings.returning': [
    {
      text: 'Adjusting your preparation again, challenger?',
      mood: 'idle',
      duration: 0,
    },
  ],

  'support.first-visit': [
    {
      text: 'If the Gambit confounds you, seek counsel here.',
      mood: 'idle',
      duration: 3200,
    },
    {
      text: 'Our seconds answer every request within a day.',
      mood: 'speaking',
      duration: 0,
    },
  ],

  'support.returning': [
    {
      text: 'The Board stands ready to assist, challenger.',
      mood: 'idle',
      duration: 0,
    },
  ],

  // ===================================================================
  // STAGE SCRIPTS — one per assessment stage
  // ===================================================================

  'stage.ideation.first-visit': [
    {
      text: 'The Opening, challenger. Every strong game begins with a single bold idea.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Tell the Board what problem burns in your gut — and why you alone can solve it.',
      mood: 'speaking',
      duration: 3600,
    },
    {
      text: 'Speak plainly. The investors sense weakness in vague words.',
      mood: 'warning',
      duration: 0,
    },
  ],
  'stage.ideation.returning': [
    { text: 'Back to the opening, challenger. Has the idea grown sharper?', mood: 'idle', duration: 0 },
  ],

  'stage.vision.first-visit': [
    {
      text: 'Development, challenger. The Board must see the world you intend to build.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'A founder without vision is a player without a plan.',
      mood: 'speaking',
      duration: 3000,
    },
    {
      text: 'Set out the future plainly — the Board is not impressed by mere dreams.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.vision.returning': [
    { text: 'Your development awaits refinement, challenger.', mood: 'idle', duration: 0 },
  ],

  'stage.commitment.first-visit': [
    {
      text: 'The Castling, challenger. Here you make the one move you cannot take back.',
      mood: 'warning',
      duration: 3200,
    },
    {
      text: 'The Board watches for hesitation. They invest in certainty.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Show them this is not a passing fancy — but a full commitment.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.commitment.returning': [
    { text: 'The move was made, challenger. Does your resolve hold?', mood: 'idle', duration: 0 },
  ],

  'stage.validation.first-visit': [
    {
      text: 'The Exchange, challenger. Dreams are cheap — the Board demands proof.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Show them the hunger in the market. Numbers do not lie.',
      mood: 'speaking',
      duration: 3000,
    },
    {
      text: 'A founder who knows their market is a founder worth funding.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.validation.returning': [
    { text: 'The market evidence awaits your hand, challenger.', mood: 'idle', duration: 0 },
  ],

  'stage.growth.first-visit': [
    {
      text: 'The Middlegame, challenger. The pieces are set — now they must advance.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'The Board watches for traction. Early signs of life.',
      mood: 'speaking',
      duration: 3000,
    },
    {
      text: 'Show them the curve bends upward.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.growth.returning': [
    { text: 'The middlegame pauses for no one, challenger. The numbers are waiting.', mood: 'idle', duration: 0 },
  ],

  'stage.expansion.first-visit': [
    {
      text: 'Seizing the Center, challenger. Your reach grows — but so do the threats.',
      mood: 'warning',
      duration: 3200,
    },
    {
      text: 'Churn is the silent killer. The Board knows this well.',
      mood: 'speaking',
      duration: 3000,
    },
    {
      text: 'Prove you can hold what you have while reaching for more.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.expansion.returning': [
    { text: 'The center is still contested, challenger. Press forward.', mood: 'idle', duration: 0 },
  ],

  'stage.scale.first-visit': [
    {
      text: 'The Promotion, challenger. The final round before the Grand Board.',
      mood: 'speaking',
      duration: 3400,
    },
    {
      text: 'Can your venture bear the weight of ten thousand users? A million?',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'The Board must believe your position will hold.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.scale.returning': [
    { text: 'The promotion waits for no one, challenger. Complete your answers.', mood: 'idle', duration: 0 },
  ],

  'stage.warroom-prep.first-visit': [
    {
      text: 'The Adjournment, challenger. Your final chance to study the position before the Board.',
      mood: 'warning',
      duration: 3400,
    },
    {
      text: 'Beyond this point, you face the Board directly. Prepare well.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Review your answers. Tighten your story. The Board is merciless.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.warroom-prep.returning': [
    { text: 'Still studying the position, challenger? The Grand Board draws near.', mood: 'idle', duration: 0 },
  ],

  // ===================================================================
  // WAR ROOM PHASE SCRIPTS
  // ===================================================================

  'warroom.pitch.first-visit': [
    {
      text: 'The Pitch, challenger. You have sixty seconds to seize their attention.',
      mood: 'warning',
      duration: 3200,
    },
    {
      text: 'Speak your truth with conviction. The Board respects it above all.',
      mood: 'speaking',
      duration: 0,
    },
  ],
  'warroom.pitch.returning': [
    { text: 'The board is yours again, challenger. Make it count.', mood: 'idle', duration: 0 },
  ],

  'warroom.qa.first-visit': [
    {
      text: 'The interrogation begins, challenger. Each investor will probe your weaknesses.',
      mood: 'warning',
      duration: 3400,
    },
    {
      text: 'Answer with precision. Rambling is the mark of an unprepared founder.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'The Grandmaster cannot help you here — only your preparation can.',
      mood: 'whispering',
      duration: 0,
    },
  ],
  'warroom.qa.returning': [
    { text: 'The Board’s questions resume, challenger.', mood: 'idle', duration: 0 },
  ],

  'warroom.deal.first-visit': [
    {
      text: 'The Offers, challenger. The investors have spoken — now choose wisely.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'More capital comes at a price. Guard your equity with care.',
      mood: 'warning',
      duration: 3200,
    },
    {
      text: 'Not every offer is generous. Read between the terms.',
      mood: 'whispering',
      duration: 0,
    },
  ],
  'warroom.deal.returning': [
    { text: 'The offers remain on the table, challenger.', mood: 'idle', duration: 0 },
  ],

  'warroom.complete.first-visit': [
    {
      text: 'It is done, challenger. The Grand Board has spoken.',
      mood: 'celebrating',
      duration: 3000,
    },
    {
      text: 'Proceed to the Adjudication to learn your result.',
      mood: 'pointing',
      duration: 0,
    },
  ],
  'warroom.complete.returning': [
    { text: 'The Grand Board is concluded. Onward to the Adjudication.', mood: 'idle', duration: 0 },
  ],

  // ===================================================================
  // ADJUDICATION (VERDICT) SCRIPTS
  // ===================================================================

  'verdict.first-visit': [
    {
      text: 'The Adjudication, challenger. Here, all is revealed.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Each investor will render their judgment. Watch carefully.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Your legacy score will be etched into the Elo Ladder for all to see.',
      mood: 'warning',
      duration: 3400,
    },
    {
      text: 'Whatever the outcome — you played the game. That alone is worthy.',
      mood: 'celebrating',
      duration: 0,
    },
  ],
  'verdict.returning': [
    { text: 'Revisiting the adjudication, challenger? The judgments do not change.', mood: 'idle', duration: 0 },
  ],

  // ===================================================================
  // THE STUDY — the Grandmaster's Welcome (progression onboarding).
  // A dedicated phase so it fires once for EVERY founder, including
  // those who saw the older 'dashboard' intro before progression existed.
  // ===================================================================

  'great-hall.first-visit': [
    {
      text: 'Welcome to the Study, challenger — your quiet board between matches.',
      mood: 'idle',
      duration: 3400,
    },
    {
      text: 'This is your Club: your crest, your motto, your name. Shape it as you please.',
      mood: 'pointing',
      highlight: 'dashboard-house',
      duration: 3800,
    },
    {
      text: 'Rating measures your standing. Earn it through sharp play and rise from Novice to Grandmaster.',
      mood: 'speaking',
      highlight: 'dashboard-renown',
      duration: 4200,
    },
    {
      text: 'These eight stars are your founder competencies. Each brightens as you master it across matches.',
      mood: 'pointing',
      highlight: 'dashboard-constellation',
      duration: 4000,
    },
    {
      text: 'Norms mark your great feats — won through merit, never bought.',
      mood: 'speaking',
      duration: 3400,
    },
    {
      text: 'When you are ready, the match begins beyond that door.',
      mood: 'pointing',
      highlight: 'dashboard-begin-cta',
      duration: 3400,
    },
    {
      text: 'Choose your line, challenger.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'great-hall.returning': [
    {
      text: 'The Study is quiet, challenger. Your Club and your games await.',
      mood: 'idle',
      duration: 2600,
    },
  ],
}

// ===================================================================
// MAPPING HELPERS — translate runtime identifiers to narrator phase keys
// ===================================================================

/** Map StageName (e.g. 'STAGE_NEG2_IDEATION') → narrator phase key (e.g. 'stage.ideation'). */
const STAGE_TO_NARRATOR: Record<string, string> = {
  STAGE_NEG2_IDEATION: 'stage.ideation',
  STAGE_NEG1_VISION: 'stage.vision',
  STAGE_0_COMMITMENT: 'stage.commitment',
  STAGE_1_VALIDATION: 'stage.validation',
  STAGE_2A_GROWTH: 'stage.growth',
  STAGE_2B_EXPANSION: 'stage.expansion',
  STAGE_3_SCALE: 'stage.scale',
  STAGE_WARROOM_PREP: 'stage.warroom-prep',
}

export function narratorPhaseForStage(stageName: string): string | null {
  return STAGE_TO_NARRATOR[stageName] ?? null
}

/** Map WarRoomPhase → narrator phase key. Returns null for LOADING (too brief). */
const WARROOM_TO_NARRATOR: Record<string, string> = {
  PITCH: 'warroom.pitch',
  INVESTOR_QA: 'warroom.qa',
  DEAL_RESULTS: 'warroom.deal',
  COMPLETE: 'warroom.complete',
}

export function narratorPhaseForWarRoom(phase: string): string | null {
  return WARROOM_TO_NARRATOR[phase] ?? null
}
