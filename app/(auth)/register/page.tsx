'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import api from '@/src/lib/api'
import { useAuth } from '@/src/context/AuthContext'
import { authErrorMessage } from '@/src/lib/firebase'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  StoneCard,
  ChessboardCTA,
  ChessboardCrest,
} from '@/src/components/primitives'
import { audioManager } from '@/lib/audio/audioManager'
import { acceptTerms, hasAcceptedTerms } from '@/src/lib/terms-consent'
import { easeDramatic } from '@/lib/animations/variants'

// ─── Shared style tokens ────────────────────────────────────────────────────

const INPUT_CLASSES = cn(
  'bg-transparent border-white/35',
  'text-white placeholder:text-white/65 caret-white',
  'focus-visible:border-[color:var(--color-chessboard-gold)]/60 focus-visible:ring-[color:var(--color-chessboard-gold)]/20',
)

// ─── Page ───────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const prefersReducedMotion = useReducedMotion()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // How this account enrols. 'cohort' redeems a batch code issued by an instructor;
  // 'individual' signs up with no cohort at all. Cohort-only surfaces (leaderboard,
  // rankings) render an empty state for individuals, who can join one later.
  const [enrolment, setEnrolment] = useState<'cohort' | 'individual'>('cohort')
  const [batchCode, setBatchCode] = useState('')
  // true = confirmed valid, false = confirmed invalid, 'unreachable' = the
  // check itself failed (server down / network) — not the user's fault.
  const [batchValid, setBatchValid] = useState<boolean | 'unreachable' | null>(null)
  const [batchName, setBatchName] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setAcceptedTerms(hasAcceptedTerms())
  }, [])

  const handleBatchCodeBlur = async () => {
    if (!batchCode.trim()) return
    try {
      const res = await api.batches.validate(batchCode.trim().toUpperCase())
      if (res.valid && res.batch) {
        setBatchValid(true)
        setBatchName(res.batch.name)
      } else {
        setBatchValid(false)
        setBatchName('')
      }
    } catch {
      setBatchValid('unreachable')
      setBatchName('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const joiningCohort = enrolment === 'cohort'
    if (joiningCohort && !batchCode.trim()) {
      setError('Enter your batch code, or continue as an individual founder')
      return
    }
    if (joiningCohort && batchValid === false) {
      setError('Please enter a valid batch code')
      return
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions before creating an account')
      return
    }
    setLoading(true)
    setError('')

    try {
      // Create the Firebase account, then provision the backend profile. The batch
      // code is sent only for a cohort signup; without one the backend provisions an
      // individual participant.
      const profile = await register(
        email,
        password,
        joiningCohort ? batchCode.trim().toUpperCase() : undefined,
        name,
      )
      acceptTerms()
      audioManager.playSfx('ui.click')
      // Individuals pay per attempt: send them straight to Stripe Checkout. If that
      // fails they land on the dashboard and can pay when they start a war room.
      if (!joiningCohort && profile.requiresPayment !== false) {
        try {
          const { url } = await api.payments.checkout()
          window.location.href = url
          return
        } catch {
          /* fall through to the dashboard */
        }
      }
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(authErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const toggleTerms = useCallback(() => {
    setAcceptedTerms((prev) => !prev)
    audioManager.playSfx('ui.click')
  }, [])

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: easeDramatic }}
      className="w-full max-w-md"
    >
      {/* ── Hero ── */}
      <div className="text-center mb-8">
        <motion.div
          initial={prefersReducedMotion ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
          className="flex justify-center mb-5"
        >
          <ChessboardCrest size={56} />
        </motion.div>

        <motion.h1
          initial={prefersReducedMotion ? false : { y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.45, ease: easeDramatic }}
          className="text-2xl font-black uppercase tracking-[0.14em] text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Claim Your Seat
        </motion.h1>

        <motion.p
          initial={prefersReducedMotion ? false : { y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4, ease: easeDramatic }}
          className="text-sm text-[color:var(--color-chessboard-smoke)] mt-2"
          style={{ fontFamily: 'var(--font-body, serif)' }}
        >
          Create your account and prepare for your pitch.
        </motion.p>
      </div>

      {/* ── Form Card ── */}
      <motion.div
        initial={prefersReducedMotion ? false : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5, ease: easeDramatic }}
      >
        <StoneCard accent="var(--color-chessboard-gold)" padding="lg">
          <div className="mb-5">
            <h2
              className="text-base font-semibold tracking-[0.06em] text-[color:var(--color-chessboard-ivory)] mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Create Account
            </h2>
            <p
              className="text-xs text-[color:var(--color-chessboard-smoke)] leading-relaxed"
              style={{ fontFamily: 'var(--font-body, serif)' }}
            >
              Choose how you are joining, then enter your details to begin your
              simulation. Review the{' '}
              <Link
                href="/terms"
                className="text-[color:var(--color-chessboard-gold)] underline underline-offset-2 hover:text-[color:var(--color-chessboard-gold-bright)] transition-colors"
              >
                Terms &amp; Conditions
              </Link>{' '}
              before continuing.
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ x: -8, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-4 p-3 rounded-[3px] border border-[color:var(--color-chessboard-crimson)]/40 bg-[color:var(--color-chessboard-crimson)]/[0.08] text-sm text-[color:var(--color-chessboard-crimson-bright)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* How you're joining */}
            <div>
              <span
                className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-chessboard-smoke)] mb-1.5 block"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                How are you joining?
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      key: 'cohort' as const,
                      title: 'With a batch code',
                      hint: 'Issued by your instructor',
                    },
                    {
                      key: 'individual' as const,
                      title: 'Individual founder',
                      hint: '$49 per war room attempt',
                    },
                  ]
                ).map((option) => {
                  const active = enrolment === option.key
                  return (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setEnrolment(option.key)
                        setError('')
                        audioManager.playSfx('ui.click')
                      }}
                      className={cn(
                        'rounded-[3px] border p-3 text-left transition-all duration-300',
                        active
                          ? 'border-[color:var(--color-chessboard-gold)]/50 bg-[color:var(--color-chessboard-gold)]/[0.08]'
                          : 'border-border bg-card hover:border-white/25',
                      )}
                    >
                      <span
                        className={cn(
                          'block text-[11px] font-semibold uppercase tracking-[0.1em]',
                          active
                            ? 'text-[color:var(--color-chessboard-gold)]'
                            : 'text-[color:var(--color-chessboard-ivory)]',
                        )}
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {option.title}
                      </span>
                      <span className="mt-1 block text-[10px] leading-snug text-[color:var(--color-chessboard-smoke)]">
                        {option.hint}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* What choosing 'individual' actually costs you */}
            {enrolment === 'individual' && (
              <p className="text-[11px] leading-relaxed text-[color:var(--color-chessboard-smoke)]">
                You&apos;ll run the full simulation on your own for $49 per war room
                attempt, paid securely through Stripe. Cohort rankings stay
                empty until you join one — you can do that any time from the Rankings
                page.
              </p>
            )}

            {/* Batch Code — cohort signups only */}
            {enrolment === 'cohort' && (
            <div>
              <label
                htmlFor="reg-batch"
                className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-chessboard-smoke)] mb-1.5 block"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Batch Code
              </label>
              <Input
                id="reg-batch"
                type="text"
                placeholder="e.g. BATCH2024A"
                value={batchCode}
                onChange={(e) => {
                  setBatchCode(e.target.value.toUpperCase())
                  setBatchValid(null)
                  setBatchName('')
                }}
                onBlur={handleBatchCodeBlur}
                required={enrolment === 'cohort'}
                className={cn(
                  INPUT_CLASSES,
                  batchValid === true &&
                    'border-[color:var(--color-chessboard-verdant)] focus-visible:border-[color:var(--color-chessboard-verdant)]',
                  batchValid === false &&
                    'border-[color:var(--color-chessboard-crimson)] focus-visible:border-[color:var(--color-chessboard-crimson)]',
                  batchValid === 'unreachable' &&
                    'border-[color:var(--color-chessboard-ember)] focus-visible:border-[color:var(--color-chessboard-ember)]',
                )}
              />
              <AnimatePresence>
                {batchValid === true && batchName && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-[10px] tracking-[0.1em] text-[color:var(--color-chessboard-verdant)] mt-1.5"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <Check className="w-3 h-3" /> {batchName}
                  </motion.p>
                )}
                {batchValid === false && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-[10px] tracking-[0.1em] text-[color:var(--color-chessboard-crimson-bright)] mt-1.5"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <X className="w-3 h-3" /> Invalid or inactive batch code
                  </motion.p>
                )}
                {batchValid === 'unreachable' && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-[10px] tracking-[0.1em] text-[color:var(--color-chessboard-ember)] mt-1.5"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <X className="w-3 h-3" /> Could not verify — server temporarily unavailable. Try again shortly.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            )}

            {/* Full Name */}
            <div>
              <label
                htmlFor="reg-name"
                className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-chessboard-smoke)] mb-1.5 block"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Full Name
              </label>
              <Input
                id="reg-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={INPUT_CLASSES}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="reg-email"
                className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-chessboard-smoke)] mb-1.5 block"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Email
              </label>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={INPUT_CLASSES}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-chessboard-smoke)] mb-1.5 block"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Password
              </label>
              <Input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={INPUT_CLASSES}
              />
            </div>

            {/* Wax-seal terms toggle */}
            <motion.div
              className={cn(
                'flex items-start gap-3.5 p-4 rounded-[3px] border transition-all duration-300 cursor-pointer select-none',
                acceptedTerms
                  ? 'border-[color:var(--color-chessboard-gold)]/35 bg-[color:var(--color-chessboard-gold)]/[0.04]'
                  : 'border-border bg-card',
              )}
              onClick={toggleTerms}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.997 }}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={acceptedTerms}
                aria-label="Accept Terms & Conditions"
                className="flex-shrink-0 mt-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-chessboard-gold)]/60 rounded-full"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTerms()
                }}
              >
                <motion.div
                  className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center relative overflow-hidden transition-colors duration-300',
                    acceptedTerms
                      ? 'border-[color:var(--color-chessboard-gold)] bg-[color:var(--color-chessboard-gold)]'
                      : 'border-[color:var(--color-chessboard-ash)] bg-[color:var(--color-chessboard-rampart)]',
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
                          className="w-3 h-3 text-primary-foreground"
                          strokeWidth={3}
                        />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="seal-glyph"
                        aria-hidden
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[6px] font-bold text-[color:var(--color-chessboard-smoke)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        WR
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </button>

              <p
                className="text-xs leading-relaxed"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span className="text-[color:var(--color-chessboard-ivory)]">
                  I have read and agree to the{' '}
                </span>
                <Link
                  href="/terms"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[color:var(--color-chessboard-gold)] underline underline-offset-2 hover:text-[color:var(--color-chessboard-gold-bright)] transition-colors"
                >
                  Terms &amp; Conditions
                </Link>
              </p>
            </motion.div>

            {/* Submit */}
            <ChessboardCTA
              type="submit"
              size="md"
              variant="primary"
              disabled={loading || !acceptedTerms}
              className="w-full justify-center"
            >
              {loading ? 'Preparing your profile…' : 'Create Account'}
            </ChessboardCTA>
          </form>
        </StoneCard>
      </motion.div>

      {/* ── Login link ── */}
      <motion.p
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.4 }}
        className="text-center text-sm mt-7"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <span className="text-[color:var(--color-chessboard-smoke)]">
          Already have an account?{' '}
        </span>
        <Link
          href="/login"
          className="font-semibold text-[color:var(--color-chessboard-gold)] hover:text-[color:var(--color-chessboard-gold-bright)] underline underline-offset-2 transition-colors"
        >
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  )
}
