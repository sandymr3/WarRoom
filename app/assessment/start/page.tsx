'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  ChevronLeft,
  Check,
  Shield,
  Users,
  Crown,
  FileText,
  Swords,
} from 'lucide-react'
import api from '@/src/lib/api'
import { acceptTerms, hasAcceptedTerms } from '@/src/lib/terms-consent'
import { cn } from '@/lib/utils'
import { CampaignMap } from '@/src/components/dashboard/CampaignMap'
import {
  StoneCard,
  WarRoomCTA,
  GoldDivider,
  SigilBadge,
  WarRoomCrest,
} from '@/src/components/primitives'
import { useNarratorOnboarding } from '@/src/hooks/useNarratorOnboarding'
import { useFeatureIntro } from '@/src/hooks/useFeatureIntro'
import { audioManager } from '@/lib/audio/audioManager'
import {
  staggerContainer,
  staggerItem,
  easeDramatic,
} from '@/lib/animations/variants'

// ─── Data ──────────────────────────────────────────────────────────────────

const LEVELS = [
  {
    id: 1 as const,
    badge: 'L1',
    title: 'Student of the Game',
    subtitle:
      'For students & early-career professionals exploring entrepreneurship.',
    features: ['Guided scenarios', 'Foundational questions', '~85 minutes total'],
    sigil: '♙',
  },
  {
    id: 2 as const,
    badge: 'L2',
    title: 'Grandmaster Path',
    subtitle:
      'For mid-level managers & experienced professionals ready for the full tournament.',
    features: ['Complex scenarios', 'Advanced pressure', '~85 minutes total'],
    sigil: '♛',
  },
] as const

const FEATURES = [
  {
    glyph: 'C8',
    title: '8 Core Competencies',
    desc: 'Problem Sensing, Learning Agility, Courage, Financial Discipline, Strategy, Influence, Team Management, Value Creation.',
    icon: Shield,
    tone: 'gold' as const,
    accent: 'var(--color-warroom-gold)',
  },
  {
    glyph: 'M3',
    title: '3 Mentor Lifelines',
    desc: 'Consult the Mindset Architect, the Knight of Hustle, the Brand Pioneer, and four more world-class mentors when you need guidance.',
    icon: Users,
    tone: 'verdant' as const,
    accent: 'var(--color-warroom-verdant)',
  },
  {
    glyph: 'WR',
    title: 'The Grand Board',
    desc: 'Pitch to seven investors — the Queen of Coin, the Rook of Execution, the Blindfold Master. Negotiate your deal.',
    icon: Crown,
    tone: 'crimson' as const,
    accent: 'var(--color-warroom-crimson)',
  },
  {
    glyph: 'E3',
    title: '3-Page Evaluation',
    desc: 'Get your entrepreneur archetype, competency spider chart, role fit map, and a personalised action plan.',
    icon: FileText,
    tone: 'amethyst' as const,
    accent: 'var(--color-warroom-amethyst)',
  },
] as const

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SimulationStartPage() {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  const [level, setLevel] = useState<1 | 2>(1)
  const [acceptedTerms, setAcceptedTerms] = useState(() => hasAcceptedTerms())
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')

  // Narrator onboarding for this phase
  useNarratorOnboarding('assessment', { delayMs: 1200 })
  const startIntro = useFeatureIntro('assessment-start', { elementId: 'assessment-start-cta' })

  const handleStart = async () => {
    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions before attending the simulation.')
      return
    }
    setIsStarting(true)
    setError('')
    try {
      const simulation = await api.assessments.create({ level })
      acceptTerms()
      audioManager.playSfx('wr.door-creak')
      router.push(`/assessment/${simulation.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start simulation.')
      setIsStarting(false)
    }
  }

  const handleLevelSelect = useCallback(
    (id: 1 | 2) => {
      setLevel(id)
      audioManager.playSfx('ui.click')
    },
    [],
  )

  const toggleTerms = useCallback(() => {
    setAcceptedTerms((prev) => !prev)
    audioManager.playSfx('ui.click')
  }, [])

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[color:var(--color-warroom-void)] text-[color:var(--color-warroom-ivory)] relative overflow-x-hidden">
      {/* Atmospheric backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 110% 55% at 50% 0%, rgba(179,144,62,0.07) 0%, transparent 65%)',
        }}
      />

      {/* ── Top Navigation ── */}
      <nav className="sticky top-0 z-20 flex items-center gap-2 px-6 py-3.5 border-b border-[color:var(--color-warroom-ash)]/25 bg-[color:var(--color-warroom-void)]/90 backdrop-blur-sm">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-[color:var(--color-warroom-smoke)] hover:text-[color:var(--color-warroom-gold)] transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-[0.14em]">
            The Great Hall
          </span>
        </Link>
        <span className="text-[color:var(--color-warroom-ash)] text-xs">/</span>
        <span
          className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          The Match
        </span>
      </nav>

      {/* ── Main Content ── */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-14">

        {/* ── Hero ── */}
        <motion.section
          className="text-center mb-14"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: easeDramatic }}
        >
          <div className="flex justify-center mb-6">
            <WarRoomCrest size={88} />
          </div>

          <div className="flex justify-center mb-5">
            <SigilBadge tone="gold" icon={Swords}>
              The Gambit 2.0
            </SigilBadge>
          </div>

          <h1
            className="text-3xl sm:text-[2.4rem] font-semibold mb-4 tracking-[0.04em] leading-tight"
            style={{
              fontFamily: 'var(--font-display)',
              background:
                'linear-gradient(135deg, var(--color-warroom-gold) 0%, var(--color-warroom-gold-bright) 50%, var(--color-warroom-gold) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            The Business Simulation
          </h1>

          <p
            className="text-[color:var(--color-warroom-smoke)] text-[0.95rem] leading-relaxed max-w-[580px] mx-auto"
            style={{ fontFamily: 'var(--font-body, serif)' }}
          >
            Navigate a 12-month startup journey across 9 stages. Make decisions under
            pressure, consult mentors, and pitch to investors. Your 8 core competencies
            will be evaluated to reveal your entrepreneur type and organisational role fit.
          </p>
        </motion.section>

        <GoldDivider variant="sword" className="mb-14" />

        {/* ── Level Selection ── */}
        <section className="mb-14">
          <SectionHeader>Choose Your Rank</SectionHeader>

          <motion.div
            className="grid sm:grid-cols-2 gap-4 mt-6"
            variants={staggerContainer}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="show"
          >
            {LEVELS.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                variants={staggerItem}
                onClick={() => handleLevelSelect(item.id)}
                whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                transition={{ duration: 0.2, ease: easeDramatic }}
                className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]/60 rounded-[3px]"
                aria-pressed={level === item.id}
              >
                <StoneCard
                  accent={
                    level === item.id
                      ? 'var(--color-warroom-gold)'
                      : 'var(--color-warroom-ash)'
                  }
                  sigilWatermark={
                    <span
                      className="text-[9rem] leading-none select-none"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {item.sigil}
                    </span>
                  }
                  className={cn(
                    'h-full p-6 transition-all duration-300',
                    level === item.id
                      ? 'ring-1 ring-[color:var(--color-warroom-gold)]/40 shadow-[0_0_32px_-8px_rgba(179,144,62,0.55)]'
                      : '',
                  )}
                >
                  {/* Badge + checkmark row */}
                  <div className="flex items-start justify-between mb-5">
                    <span
                      className={cn(
                        'inline-flex items-center px-3 py-1 text-[10px] font-bold rounded-[2px] border tracking-[0.14em] uppercase transition-all duration-300',
                        level === item.id
                          ? 'text-primary-foreground bg-[color:var(--color-warroom-gold)] border-[color:var(--color-warroom-gold)]'
                          : 'text-[color:var(--color-warroom-smoke)] bg-transparent border-[color:var(--color-warroom-ash)]/50',
                      )}
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {item.badge}
                    </span>

                    <AnimatePresence>
                      {level === item.id && (
                        <motion.span
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 380,
                            damping: 20,
                          }}
                        >
                          <Check
                            className="w-5 h-5 text-[color:var(--color-warroom-gold)]"
                            strokeWidth={2.5}
                          />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Title */}
                  <h3
                    className={cn(
                      'text-base font-semibold mb-2.5 tracking-[0.05em] transition-colors duration-300',
                      level === item.id
                        ? 'text-[color:var(--color-warroom-gold)]'
                        : 'text-[color:var(--color-warroom-ivory)]',
                    )}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {item.title}
                  </h3>

                  {/* Subtitle */}
                  <p
                    className="text-sm text-[color:var(--color-warroom-smoke)] mb-5 leading-relaxed"
                    style={{ fontFamily: 'var(--font-body, serif)' }}
                  >
                    {item.subtitle}
                  </p>

                  {/* Feature bullets */}
                  <ul className="space-y-2">
                    {item.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2.5 text-xs tracking-[0.05em] text-[color:var(--color-warroom-ivory)]/70"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        <span
                          className={cn(
                            'w-1 h-1 rounded-full flex-shrink-0 transition-colors duration-300',
                            level === item.id
                              ? 'bg-[color:var(--color-warroom-gold)]'
                              : 'bg-[color:var(--color-warroom-ash)]',
                          )}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                </StoneCard>
              </motion.button>
            ))}
          </motion.div>
        </section>

        <GoldDivider variant="line" className="mb-14" />

        {/* ── The 12-Month Journey ── */}
        <section className="mb-14">
          <SectionHeader>The 12-Month Journey</SectionHeader>

          <motion.div
            className="mt-6"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeDramatic }}
          >
            <StoneCard className="p-5 sm:p-7 overflow-x-auto">
              {/* currentStage=null → all nodes appear locked (not yet started) */}
              <CampaignMap currentStage={null} className="min-w-[540px]" />
            </StoneCard>
          </motion.div>
        </section>

        <GoldDivider variant="rune" className="mb-14" />

        {/* ── What Awaits ── */}
        <section className="mb-14">
          <SectionHeader>What Awaits</SectionHeader>

          <motion.div
            className="grid sm:grid-cols-2 gap-4 mt-6"
            variants={staggerContainer}
            initial={prefersReducedMotion ? false : 'hidden'}
            whileInView="show"
            viewport={{ once: true }}
          >
            {FEATURES.map((feat) => (
              <motion.div key={feat.glyph} variants={staggerItem}>
                <StoneCard
                  accent={feat.accent}
                  sigilWatermark={
                    <span
                      className="text-[6.5rem] font-bold leading-none select-none tracking-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {feat.glyph}
                    </span>
                  }
                  className="h-full p-5"
                >
                  <div className="mb-3">
                    <SigilBadge tone={feat.tone} icon={feat.icon}>
                      {feat.glyph}
                    </SigilBadge>
                  </div>
                  <h3
                    className="text-sm font-semibold text-[color:var(--color-warroom-ivory)] mb-2 tracking-[0.06em]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {feat.title}
                  </h3>
                  <p
                    className="text-xs text-[color:var(--color-warroom-smoke)] leading-relaxed"
                    style={{ fontFamily: 'var(--font-body, serif)' }}
                  >
                    {feat.desc}
                  </p>
                </StoneCard>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Terms & CTA ── */}
        <section>
          <GoldDivider variant="line" className="mb-8" />

          {/* Wax-seal terms toggle */}
          <motion.div
            role="group"
            aria-labelledby="terms-label"
            className={cn(
              'flex items-start gap-4 p-5 rounded-[3px] border mb-4 transition-all duration-300 cursor-pointer select-none',
              acceptedTerms
                ? 'border-[color:var(--color-warroom-gold)]/35 bg-[color:var(--color-warroom-gold)]/[0.04]'
                : 'border-[color:var(--color-warroom-ash)]/30 bg-[color:var(--color-warroom-rampart)]/50',
            )}
            onClick={toggleTerms}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.997 }}
          >
            {/* Wax seal visual checkbox */}
            <button
              type="button"
              role="checkbox"
              aria-checked={acceptedTerms}
              aria-label="Accept Terms & Conditions"
              className="flex-shrink-0 mt-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]/60 rounded-full"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                toggleTerms()
              }}
            >
              <motion.div
                className={cn(
                  'w-7 h-7 rounded-full border-2 flex items-center justify-center relative overflow-hidden transition-colors duration-300',
                  acceptedTerms
                    ? 'border-[color:var(--color-warroom-gold)] bg-[color:var(--color-warroom-gold)]'
                    : 'border-[color:var(--color-warroom-ash)] bg-[color:var(--color-warroom-rampart)]',
                )}
                animate={
                  acceptedTerms && !prefersReducedMotion
                    ? { scale: [1, 0.8, 1.08, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.3, ease: easeDramatic }}
              >
                <AnimatePresence mode="wait">
                  {acceptedTerms ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.16 }}
                    >
                      <Check
                        className="w-3.5 h-3.5 text-primary-foreground"
                        strokeWidth={3}
                      />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="seal-glyph"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[7px] font-bold text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      WR
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </button>

            {/* Terms text */}
            <p
              id="terms-label"
              className="text-sm leading-relaxed"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-[color:var(--color-warroom-ivory)]">
                I have read and agree to the{' '}
              </span>
              <Link
                href="/terms"
                onClick={(e) => e.stopPropagation()}
                className="text-[color:var(--color-warroom-gold)] underline underline-offset-2 hover:text-[color:var(--color-warroom-gold-bright)] transition-colors"
              >
                Terms &amp; Conditions
              </Link>
              <span className="text-[color:var(--color-warroom-ivory)]">
                {' '}of the Gambit.
              </span>
            </p>
          </motion.div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mb-5 p-4 rounded-[3px] border border-[color:var(--color-warroom-crimson)]/40 bg-[color:var(--color-warroom-crimson)]/[0.08] text-[color:var(--color-warroom-crimson-bright)] text-sm text-center"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Start CTA */}
          <div {...startIntro} className="flex flex-col items-stretch gap-3">
            <WarRoomCTA
              size="lg"
              variant="primary"
              icon={Swords}
              disabled={isStarting || !acceptedTerms}
              onClick={handleStart}
              className="w-full justify-center"
            >
              {isStarting ? 'Preparing the board…' : 'Begin the Match'}
            </WarRoomCTA>

            {!acceptedTerms && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-warroom-smoke)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Accept the terms above to enter the trial
              </motion.p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

// ─── Sub-component ──────────────────────────────────────────────────────────

/** Inline horizontal rule with centred section title. */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <GoldDivider variant="line" className="flex-1" />
      <h2
        className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--color-warroom-smoke)] whitespace-nowrap"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {children}
      </h2>
      <GoldDivider variant="line" className="flex-1" />
    </div>
  )
}
