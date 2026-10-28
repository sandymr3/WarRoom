'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, ChevronRight, ChevronLeft, Check, Swords, CreditCard } from 'lucide-react'
import api, { isPaymentRequired } from '@/src/lib/api'
import { useAuth } from '@/src/context/AuthContext'
import { acceptTerms, hasAcceptedTerms } from '@/src/lib/terms-consent'
import { cn } from '@/lib/utils'
import {
  StoneCard,
  ChessboardCTA,
  GoldDivider,
  SigilBadge,
  ChessboardCrest,
} from '@/src/components/primitives'
import { easeDramatic } from '@/lib/animations/variants'

interface StartSimulationViewProps {
  /** Leave the flow without creating a simulation (back to the dashboard). */
  onClose: () => void
  onCreated: (assessmentId: string) => void
}

type Step = 'idea' | 'level'

const STEPS: Step[] = ['idea', 'level']

const LEVELS = [
  {
    id: 1 as const,
    title: 'Level 1',
    badge: 'Student / Fresher',
    desc: 'Early-stage entrepreneur or student exploring business for the first time.',
    emblem: '⚔',
  },
  {
    id: 2 as const,
    title: 'Level 2',
    badge: 'Manager / Professional',
    desc: 'Experienced professional or manager with prior business exposure.',
    emblem: '♛',
  },
]

/**
 * <StartSimulationView /> — the full-viewport "Enter Your Business Idea" flow.
 *
 * Two steps (idea → level), then creates the simulation. This used to be a
 * small dialog on the dashboard; it now owns the whole screen at
 * /assessment/new so the idea gets room to be written properly.
 */
export function StartSimulationView({ onClose, onCreated }: StartSimulationViewProps) {
  const prefersReducedMotion = useReducedMotion()
  const [step, setStep] = useState<Step>('idea')
  const [idea, setIdea] = useState('')
  const [level, setLevel] = useState<1 | 2>(1)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  // Individuals without a paid attempt go to Stripe Checkout instead of starting.
  const { profile } = useAuth()
  const [paymentRequired, setPaymentRequired] = useState(false)
  const [paying, setPaying] = useState(false)
  const needsPayment = paymentRequired || profile?.requiresPayment === true

  useEffect(() => {
    setAcceptedTerms(hasAcceptedTerms())
  }, [])

  // Escape steps back, and leaves the flow from the first step — the same
  // keyboard exit the dialog had.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || creating) return
      if (step === 'level') setStep('idea')
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, creating, onClose])

  // Each step is its own screen — start it from the top.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  const handleBack = () => {
    if (step === 'level') setStep('idea')
    else onClose()
  }

  const handleCreateSimulation = async () => {
    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions before starting a simulation')
      return
    }

    setCreating(true)
    setError('')
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const batchCode = user?.batchCode || ''

      // ── Pre-flight: verify the batch is still enabled ──
      if (batchCode) {
        const validation = await api.batches.validate(batchCode)
        if (!validation.valid) {
          setError(
            'Your batch has been disabled by the admin. Please contact your instructor to re-enable it before starting a new simulation.'
          )
          setCreating(false)
          return
        }
      }

      const simulation = await api.assessments.create({
        level,
        userIdea: idea.trim() || undefined,
        batchCode,
        // Characters are now selected later in the flow
        selectedMentors: [],
        selectedLeaders: [],
        selectedInvestors: [],
      })

      acceptTerms()
      onCreated(simulation.id)
    } catch (err: unknown) {
      if (isPaymentRequired(err)) {
        setPaymentRequired(true)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create simulation')
      }
    } finally {
      setCreating(false)
    }
  }

  const handleCheckout = async () => {
    setPaying(true)
    setError('')
    try {
      const { url } = await api.payments.checkout()
      window.location.href = url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not open checkout')
      setPaying(false)
    }
  }

  const stepIndex = STEPS.indexOf(step)
  const enter = prefersReducedMotion ? false : { opacity: 0, y: 20 }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col text-[color:var(--color-chessboard-ivory)]">
      {/* Atmospheric glow over the route backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 110% 55% at 50% 0%, rgba(201,162,39,0.10) 0%, transparent 65%)',
        }}
      />

      {/* ── Top bar: back / close + progress ── */}
      <nav className="sticky top-0 z-20 flex items-center justify-between gap-4 pl-4 pr-16 sm:pl-8 sm:pr-20 py-3.5 border-b border-[color:var(--color-chessboard-ash)]/25 bg-[color:var(--color-chessboard-void)]/85 backdrop-blur-sm">
        <button
          type="button"
          onClick={handleBack}
          disabled={creating}
          className="flex items-center gap-1.5 text-[color:var(--color-chessboard-smoke)] hover:text-[color:var(--color-chessboard-gold)] transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-chessboard-gold)]/60 rounded-[3px]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-[0.14em]">
            {step === 'idea' ? 'Dashboard' : 'Back'}
          </span>
        </button>

        <div className="flex items-center gap-3" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
          <span
            className="hidden sm:inline text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-chessboard-smoke)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={cn(
                  'h-1 w-8 sm:w-12 rounded-full transition-colors duration-300',
                  i <= stepIndex
                    ? 'bg-[color:var(--color-chessboard-gold)]'
                    : 'bg-[color:var(--color-chessboard-ash)]/40',
                )}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="relative z-10 flex flex-1 flex-col w-full mx-auto max-w-4xl px-4 sm:px-8 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {step === 'idea' ? (
            <motion.section
              key="idea"
              className="flex flex-1 flex-col"
              initial={enter}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: easeDramatic }}
            >
              <header className="text-center mb-8 sm:mb-10">
                <div className="flex justify-center mb-5">
                  <ChessboardCrest size={72} />
                </div>
                <div className="flex justify-center mb-4">
                  <SigilBadge tone="gold" icon={Swords}>
                    New Simulation
                  </SigilBadge>
                </div>
                <h1
                  className="text-3xl sm:text-[2.6rem] font-semibold mb-4 tracking-[0.04em] leading-tight"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background:
                      'linear-gradient(135deg, var(--color-chessboard-gold) 0%, var(--color-chessboard-gold-bright) 50%, var(--color-chessboard-gold) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Enter Your Business Idea
                </h1>
                <p
                  className="text-[color:var(--color-chessboard-smoke)] text-[0.95rem] sm:text-base leading-relaxed max-w-[600px] mx-auto"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Describe the venture you want to take through the simulation. What problem
                  does it solve? Who is it for? Mentors and investors will challenge you on it.
                </p>
              </header>

              <StoneCard padding="none" accent="var(--color-chessboard-gold)" className="flex flex-1 flex-col p-4 sm:p-6 bg-card/90 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                <label
                  htmlFor="business-idea"
                  className="block mb-3 text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-chessboard-gold)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  What&apos;s your business idea?
                </label>
                <Textarea
                  id="business-idea"
                  autoFocus
                  placeholder="Describe your business idea in a few sentences. What problem does it solve? Who is it for?"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="flex-1 min-h-[220px] sm:min-h-[300px] resize-none rounded-[3px] bg-background px-4 py-3.5 text-base md:text-[1.05rem] leading-relaxed [field-sizing:fixed]"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--color-chessboard-smoke)]">
                  <span>You can leave this blank and describe your idea during the simulation.</span>
                  <span className="tabular-nums">{idea.trim().length} characters</span>
                </div>
              </StoneCard>

              <div className="mt-8 flex justify-center sm:justify-end">
                <ChessboardCTA
                  size="md"
                  variant="primary"
                  iconRight={ChevronRight}
                  onClick={() => setStep('level')}
                  className="w-full sm:w-auto"
                >
                  Next
                </ChessboardCTA>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="level"
              className="flex flex-1 flex-col"
              initial={enter}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: easeDramatic }}
            >
              <header className="text-center mb-8 sm:mb-10">
                <h1
                  className="text-3xl sm:text-[2.4rem] font-semibold mb-4 tracking-[0.04em] leading-tight text-[color:var(--color-chessboard-gold)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Choose Your Experience Level
                </h1>
                <p
                  className="text-[color:var(--color-chessboard-smoke)] text-[0.95rem] leading-relaxed max-w-[560px] mx-auto"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  The scenarios and pressure you face are tuned to the level you pick.
                </p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LEVELS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLevel(item.id)}
                    aria-pressed={level === item.id}
                    className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-chessboard-gold)]/60 rounded-[3px]"
                  >
                    <StoneCard
                      interactive
                      accent={level === item.id ? 'var(--color-chessboard-gold)' : 'var(--color-chessboard-ash)'}
                      sigilWatermark={
                        <span className="text-[8rem] leading-none select-none">{item.emblem}</span>
                      }
                      className={cn(
                        'h-full p-6 bg-card/90',
                        level === item.id &&
                          'ring-1 ring-[color:var(--color-chessboard-gold)]/40 shadow-[0_0_32px_-8px_rgba(201,162,39,0.55)]',
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={cn(
                            'text-lg font-bold tracking-[0.04em]',
                            level === item.id && 'text-[color:var(--color-chessboard-gold)]',
                          )}
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {item.title}
                        </div>
                        {level === item.id && (
                          <Check className="w-5 h-5 text-[color:var(--color-chessboard-gold)]" strokeWidth={2.5} />
                        )}
                      </div>
                      <span
                        className="inline-flex mb-3 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] rounded-[2px] border border-[color:var(--color-chessboard-ash)]/50 text-[color:var(--color-chessboard-smoke)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {item.badge}
                      </span>
                      <p
                        className="text-sm text-[color:var(--color-chessboard-smoke)] leading-relaxed"
                        style={{ fontFamily: 'var(--font-body, serif)' }}
                      >
                        {item.desc}
                      </p>
                    </StoneCard>
                  </button>
                ))}
              </div>

              <GoldDivider variant="line" className="my-8" />

              {needsPayment && (
                <div className="mb-4 rounded-[3px] border border-[color:var(--color-chessboard-gold)]/40 bg-card/90 p-4 text-sm text-[color:var(--color-chessboard-smoke)]">
                  Each war room attempt is $49 for individual founders. Pay securely through
                  Stripe, then start your simulation.
                </div>
              )}

              <div className="flex items-start gap-3 rounded-[3px] border border-[color:var(--color-chessboard-ash)]/40 bg-card/90 p-4">
                <Checkbox
                  id="start-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="start-terms" className="text-sm leading-6 text-[color:var(--color-chessboard-smoke)]">
                  I agree to the{' '}
                  <Link href="/terms" className="font-medium text-[color:var(--color-chessboard-gold)] hover:underline">
                    Terms &amp; Conditions
                  </Link>
                  {' '}and want to attend the simulation.
                </label>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-[3px] text-sm"
                >
                  {error}
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <ChessboardCTA
                  size="md"
                  variant="ghost"
                  icon={ChevronLeft}
                  onClick={() => setStep('idea')}
                  disabled={creating || paying}
                  className="w-full sm:w-auto"
                >
                  Back
                </ChessboardCTA>
                {needsPayment ? (
                  <ChessboardCTA
                    size="md"
                    variant="primary"
                    icon={paying ? Loader2 : CreditCard}
                    onClick={handleCheckout}
                    disabled={paying}
                    className={cn(
                      'w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed',
                      paying && '[&>svg]:animate-spin',
                    )}
                  >
                    {paying ? 'Opening checkout...' : 'Pay $49 to start'}
                  </ChessboardCTA>
                ) : (
                  <ChessboardCTA
                    size="md"
                    variant="primary"
                    sfxKey="nav.door-open"
                    icon={creating ? Loader2 : undefined}
                    iconRight={creating ? undefined : ChevronRight}
                    onClick={handleCreateSimulation}
                    disabled={creating || !acceptedTerms}
                    className={cn(
                      'w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed',
                      creating && '[&>svg]:animate-spin',
                    )}
                  >
                    {creating ? 'Creating...' : 'Start Simulation'}
                  </ChessboardCTA>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default StartSimulationView
