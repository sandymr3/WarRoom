'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { easeDramatic } from '@/lib/animations/variants'

// ─── Shared style tokens ────────────────────────────────────────────────────

const INPUT_CLASSES = cn(
  'bg-[color:var(--color-warroom-rampart)]/80 border-[color:var(--color-warroom-ash)]/50',
  'text-[color:var(--color-warroom-ivory)] placeholder:text-[color:var(--color-warroom-smoke)]',
  'focus-visible:border-[color:var(--color-warroom-gold)]/60 focus-visible:ring-[color:var(--color-warroom-gold)]/20',
)

// ─── Login content (wrapped in Suspense for useSearchParams) ────────────────

function LoginContent() {
  const router = useRouter()
  const { login } = useAuth()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const prefersReducedMotion = useReducedMotion()

  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [batchCode, setBatchCode] = useState('')
  const [batchValid, setBatchValid] = useState<boolean | null>(null)
  const [batchName, setBatchName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    if (!isAdmin && !batchCode.trim()) {
      setError('Batch code is required')
      return
    }
    setLoading(true)
    setError('')

    try {
      // Authenticate against Firebase, then reconcile with the War Room backend.
      const profile = await login(
        email,
        password,
        isAdmin ? undefined : batchCode.trim().toUpperCase(),
      )

      audioManager.playSfx('wr.door-creak')

      if (profile.role === 'admin') {
        router.push('/admin/cohorts')
      } else {
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      setError(authErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

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
          Return to the Board
        </motion.h1>

        <motion.p
          initial={prefersReducedMotion ? false : { y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4, ease: easeDramatic }}
          className="text-sm text-[color:var(--color-warroom-smoke)] mt-2"
          style={{ fontFamily: 'var(--font-body, serif)' }}
        >
          {isAdmin
            ? 'Sign in to the admin panel'
            : 'Sign in to your Gambit simulation'}
        </motion.p>
      </div>

      {/* ── Admin / Participant Toggle ── */}
      <motion.div
        initial={prefersReducedMotion ? false : { y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4, ease: easeDramatic }}
        className="flex rounded-[3px] border border-[color:var(--color-warroom-ash)]/40 bg-[color:var(--color-warroom-rampart)]/60 p-1 mb-5"
      >
        {(['Participant', 'Admin'] as const).map((label) => {
          const active = label === 'Participant' ? !isAdmin : isAdmin
          return (
            <button
              key={label}
              type="button"
              className={cn(
                'flex-1 rounded-[2px] py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-all duration-300',
                active
                  ? 'bg-[color:var(--color-warroom-gold)]/[0.12] text-[color:var(--color-warroom-gold)] shadow-sm'
                  : 'text-[color:var(--color-warroom-smoke)] hover:text-[color:var(--color-warroom-ivory)]',
              )}
              style={{ fontFamily: 'var(--font-display)' }}
              onClick={() => {
                setIsAdmin(label === 'Admin')
                setError('')
              }}
            >
              {label}
            </button>
          )
        })}
      </motion.div>

      {/* ── Form Card ── */}
      <motion.div
        initial={prefersReducedMotion ? false : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.5, ease: easeDramatic }}
      >
        <StoneCard accent="var(--color-warroom-gold)" padding="lg">
          <div className="mb-5">
            <h2
              className="text-base font-semibold tracking-[0.06em] text-[color:var(--color-warroom-ivory)] mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {isAdmin ? 'Admin Sign In' : 'Sign In'}
            </h2>
            <p
              className="text-xs text-[color:var(--color-warroom-smoke)] leading-relaxed"
              style={{ fontFamily: 'var(--font-body, serif)' }}
            >
              {isAdmin
                ? 'Enter your admin credentials.'
                : 'Enter your batch code and credentials to access your simulations.'}
            </p>
          </div>

          {/* Success banner (from register redirect) */}
          <AnimatePresence>
            {registered && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-3 rounded-[3px] border border-[color:var(--color-warroom-verdant)]/40 bg-[color:var(--color-warroom-verdant)]/[0.08] text-sm text-[color:var(--color-warroom-verdant)]">
                  Account created successfully! Please sign in.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
            {/* Batch Code (participant only) */}
            {!isAdmin && (
              <div>
                <label
                  htmlFor="login-batch"
                  className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-warroom-smoke)] mb-1.5 block"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Batch Code
                </label>
                <Input
                  id="login-batch"
                  type="text"
                  placeholder="e.g. BATCH2024A"
                  value={batchCode}
                  onChange={(e) => {
                    setBatchCode(e.target.value.toUpperCase())
                    setBatchValid(null)
                    setBatchName('')
                  }}
                  onBlur={handleBatchCodeBlur}
                  required={!isAdmin}
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
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-warroom-smoke)] mb-1.5 block"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Email
              </label>
              <Input
                id="login-email"
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
                htmlFor="login-password"
                className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-warroom-smoke)] mb-1.5 block"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Password
              </label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={INPUT_CLASSES}
              />
            </div>

            {/* Submit */}
            <WarRoomCTA
              type="submit"
              size="md"
              variant="primary"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading
                ? 'Opening the board…'
                : isAdmin
                  ? 'Sign In as Admin'
                  : 'Enter the Gambit'}
            </WarRoomCTA>
          </form>
        </StoneCard>
      </motion.div>

      {/* ── Register link ── */}
      {!isAdmin && (
        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="text-center text-sm mt-7"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span className="text-[color:var(--color-warroom-smoke)]">
            Don&apos;t have an account?{' '}
          </span>
          <Link
            href="/register"
            className="font-semibold text-[color:var(--color-warroom-gold)] hover:text-[color:var(--color-warroom-gold-bright)] underline underline-offset-2 transition-colors"
          >
            Claim your seat
          </Link>
        </motion.p>
      )}
    </motion.div>
  )
}

// ─── Page (Suspense boundary for useSearchParams) ───────────────────────────

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[color:var(--color-warroom-gold)]/30 border-t-[color:var(--color-warroom-gold)] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
