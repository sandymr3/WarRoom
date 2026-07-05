import type { NarratorMood } from '@/src/state/narratorStore'

/**
 * FEATURE_INTROS — first-hover Grandmaster explanations, keyed by feature.
 *
 * The first time the founder hovers (or focuses) an important control, the
 * Grandmaster steps in, spotlights it, and explains what it does — once. After
 * that the feature stays silent (a `wr_feat_<key>` localStorage flag is set).
 *
 * Wired via `useFeatureIntro(key)` (src/hooks/useFeatureIntro.ts), which
 * reuses the existing narrator (`speak` → spotlight + voiceover). Voiceover
 * files follow `/audio/narrator/feature-<key>-01-<mood>.mp3` and are
 * fail-soft (silent until supplied — see ASSETS_REQUIRED.md).
 *
 * This map is append-only: add a key here, then spread `useFeatureIntro(key)`
 * onto the control. Copy stays in-world (the Grandmaster's voice).
 */
export interface FeatureIntro {
  text: string
  mood?: NarratorMood
}

export const FEATURE_INTROS: Record<string, FeatureIntro> = {
  // ── Dashboard / entry ─────────────────────────────────────────
  'dashboard-begin': {
    text: 'Beyond this door lies the match, challenger. Press on when your resolve is set.',
    mood: 'pointing',
  },
  'assessment-start': {
    text: 'Commit your opening and enter the tournament. Nine rounds stand between you and the Grand Board.',
    mood: 'pointing',
  },

  // ── Stage simulation ──────────────────────────────────────────
  'stage-submit': {
    text: 'When your answer is ready, deliver it to the Board. They weigh every word.',
    mood: 'pointing',
  },
  'mentor-block': {
    text: 'Your seconds offer counsel here. Spend a hint wisely — you hold only a few.',
    mood: 'whispering',
  },

  // ── Grand Board ───────────────────────────────────────────────
  'warroom-pitch-record': {
    text: 'Raise your voice, challenger. Sixty seconds to command the board with your pitch.',
    mood: 'warning',
  },
  'warroom-investor-mic': {
    text: 'Speak your answer aloud. The investor listens for conviction, not polish.',
    mood: 'pointing',
  },

  // ── Negotiation ───────────────────────────────────────────────
  'negotiation-offer': {
    text: 'An offer on the table. Open it to negotiate — more capital oft costs more of your position.',
    mood: 'pointing',
  },

  // ── Transition ────────────────────────────────────────────────
  'snapshot-continue': {
    text: 'The next round awaits. Press on to face what the position brings.',
    mood: 'pointing',
  },
}

export type FeatureIntroKey = keyof typeof FEATURE_INTROS
