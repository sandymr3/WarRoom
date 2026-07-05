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
  WarRoomCTA,
  WarRoomCrest,
} from '@/src/components/primitives'
import { audioManager } from '@/lib/audio/audioManager'
import { acceptTerms, hasAcceptedTerms } from '@/src/lib/terms-consent'
import { easeDramatic } from '@/lib/animations/variants'

// ─── Shared style tokens ────────────────────────────────────────────────────

const INPUT_CLASSES = cn(
  'bg-[color:var(--color-warroom-rampart)]/80 border-[color:var(--color-warroom-ash)]/50',
  'text-[color:var(--color-warroom-ivory)] placeholder:text-[color:var(--color-warroom-smoke)]',
  'focus-visible:border-[color:var(--color-warroom-gold)]/60 focus-visible:ring-[color:var(--color-warroom-gold)]/20',
)

// ─── Page ───────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const prefersReducedMotion = useReducedMotion()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [batchCode, setBatchCode] = useState('')
  const [batchValid, setBatchValid] = useState<boolean | null>(null)
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
      setBatchValid(false)
      setBatchName('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchCode.trim()) {
      setError('Batch code is required')
      return
    }
    if (batchValid === false) {
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
      // Create the Firebase account, then provision the backend profile (with batch code + name).
      await register(email, password, batchCode.trim().toUpperCase(), name)
      acceptTerms()
      audioManager.playSfx('ui.click')
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
          <WarRoomCrest size={56} />
        </motion.div>

        <motion.h1
          initial={prefersReducedMotion ? false : { y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.45, ease: easeDramatic }}
          className="text-2xl font-semibold tracking-[0.04em]"
          style={{
            fontFamily: 'var(--font-display)',
            background:
              'linear-gradient(135deg, var(--color-warroom-gold), var(--color-warroom-gold-bright))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Claim Your Seat
        </motion.h1>

        <motion.p
          initial={prefersReducedMotion ? false : { y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4, ease: easeDramatic }}
          className="text-sm text-[color:var(--color-warroom-smoke)] mt-2"
          style={{ fontFamily: 'var(--font-body, serif)' }}
        >
          Create your Gambit account and join the Board.
        </motion.p>
      </div>

      {/* ── Form Card ── */}
      <motion.div
        initial={prefersReducedMotion ? false : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5, ease: easeDramatic }}
      >
        <StoneCard accent="var(--color-warroom-gold)" padding="lg">
          <div className="mb-5">
            <h2
              className="text-base font-semibold tracking-[0.06em] text-[color:var(--color-warroom-ivory)] mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Create Account
            </h2>
            <p
              className="text-xs text-[color:var(--color-warroom-smoke)] leading-relaxed"
              style={{ fontFamily: 'var(--font-body, serif)' }}
            >
              Enter your batch code and details to begin your simulation. Review the{' '}
              <Link
                href="/terms"
                className="text-[color:var(--color-warroom-gold)] underline underline-offset-2 hover:text-[color:var(--color-warroom-gold-bright)] transition-colors"
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
                className="mb-4 p-3 rounded-[3px] border border-[color:var(--color-warroom-crimson)]/40 bg-[color:var(--color-warroom-crimson)]/[0.08] text-sm text-[color:var(--color-warroom-crimson-bright)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Batch Code */}
            <div>
              <label
                htmlFor="reg-batch"
                className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-warroom-smoke)] mb-1.5 block"
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
                required
                className={cn(
                  INPUT_CLASSES,
                  batchValid === true &&
                    'border-[color:var(--color-warroom-verdant)] focus-visible:border-[color:var(--color-warroom-verdant)]',
                  batchValid === false &&
                    'border-[color:var(--color-warroom-crimson)] focus-visible:border-[color:var(--color-warroom-crimson)]',
                )}
              />
              <AnimatePresence>
                {batchValid === true && batchName && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-[10px] tracking-[0.1em] text-[color:var(--color-warroom-verdant)] mt-1.5"
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
                    className="flex items-center gap-1 text-[10px] tracking-[0.1em] text-[color:var(--color-warroom-crimson-bright)] mt-1.5"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <X className="w-3 h-3" /> Invalid or inactive batch code
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor="reg-name"
                className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-warroom-smoke)] mb-1.5 block"
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
                className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-warroom-smoke)] mb-1.5 block"
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
                className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-warroom-smoke)] mb-1.5 block"
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
                  ? 'border-[color:var(--color-warroom-gold)]/35 bg-[color:var(--color-warroom-gold)]/[0.04]'
                  : 'border-[color:var(--color-warroom-ash)]/30 bg-[color:var(--color-warroom-rampart)]/50',
              )}
              onClick={toggleTerms}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.997 }}
            >
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
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center relative overflow-hidden transition-colors duration-300',
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
                          className="w-3 h-3 text-primary-foreground"
                          strokeWidth={3}
                        />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="seal-glyph"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[6px] font-bold text-[color:var(--color-warroom-smoke)]"
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
              </p>
            </motion.div>

            {/* Submit */}
            <WarRoomCTA
              type="submit"
              size="md"
              variant="primary"
              disabled={loading || !acceptedTerms}
              className="w-full justify-center"
            >
              {loading ? 'Setting up the board…' : 'Create Account'}
            </WarRoomCTA>
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
        <span className="text-[color:var(--color-warroom-smoke)]">
          Already have an account?{' '}
        </span>
        <Link
          href="/login"
          className="font-semibold text-[color:var(--color-warroom-gold)] hover:text-[color:var(--color-warroom-gold-bright)] underline underline-offset-2 transition-colors"
        >
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  )
}
