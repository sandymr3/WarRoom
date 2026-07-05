'use client'

// ============================================
// <VerdictProgressionEpilogue /> — the bridge between the verdict
// ceremony and the report. A single restrained beat that ties the
// trial's outcome to the founder's lasting progression: their House,
// updated rank + Renown, and any sigils won. Then on to the report.
// ============================================

import { motion } from 'framer-motion'
import type { EarnedSigil, FounderProgression } from '@/src/types'
import { sigilById, SIGIL_TIER_COLOR } from '@/src/lib/progression'
import { EmberDriftBackdrop } from '@/src/components/verdict/EmberDriftBackdrop'
import {
  HouseBanner,
  RenownBar,
  SigilCrest,
  iconForSigil,
} from '@/src/components/progression'

export interface VerdictProgressionEpilogueProps {
  progression: FounderProgression
  newSigils: EarnedSigil[]
  founderName?: string
  onContinue: () => void
}

export function VerdictProgressionEpilogue({
  progression,
  newSigils,
  founderName,
  onContinue,
}: VerdictProgressionEpilogueProps) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--color-warroom-black)] px-4 py-12"
    >
      <EmberDriftBackdrop density={42} />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-7 text-center">
        <p className="font-display text-[0.6rem] uppercase tracking-[0.34em] text-[color:var(--color-warroom-gold)]/75">
          The Board Takes Note
        </p>

        <HouseBanner
          house={progression.house}
          rank={progression.rank}
          founderName={founderName}
          variant="hero"
        />

        <div className="w-full rounded-md border border-[color:var(--color-warroom-gold)]/25 bg-card/50 p-5 backdrop-blur-sm">
          <RenownBar rank={progression.rank} renown={progression.renown} />
        </div>

        {newSigils.length > 0 && (
          <div className="flex w-full flex-col items-center gap-3">
            <p className="font-display text-[0.6rem] uppercase tracking-[0.24em] text-foreground/55">
              {newSigils.length === 1 ? 'Norm Won' : `${newSigils.length} Norms Won`}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {newSigils.map((s) => {
                const def = sigilById(s.id)
                const style = SIGIL_TIER_COLOR[s.tier]
                return (
                  <div key={s.id} className="flex flex-col items-center gap-1" style={{ width: 72 }}>
                    <SigilCrest
                      icon={iconForSigil(s.id)}
                      size={56}
                      primary={style.base}
                      secondary={style.bright}
                      iconColor={style.bright}
                      title={def ? `${def.name} — ${def.description}` : s.id}
                    />
                    <span
                      className="text-center text-[9px] uppercase tracking-[0.08em] text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {def?.name ?? s.id}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onContinue}
          className="mt-2 inline-flex items-center gap-2 rounded-sm border border-[color:var(--color-warroom-gold)]/50 px-6 py-2.5 font-display text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--color-warroom-gold)] transition-all hover:border-[color:var(--color-warroom-gold)] hover:bg-[color:var(--color-warroom-gold)]/10"
        >
          Continue to your report →
        </button>
      </div>
    </motion.main>
  )
}
