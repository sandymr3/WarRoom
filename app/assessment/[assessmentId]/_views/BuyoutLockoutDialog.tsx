'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Crown, ChevronRight } from 'lucide-react'
import { formatRevenue } from '@/src/lib/helpers'

interface BuyoutLockoutDialogProps {
  open: boolean
  company: string
  amount: number
  onContinue: () => void
}

export function BuyoutLockoutDialog({ open, company, amount, onContinue }: BuyoutLockoutDialogProps) {
  const safeCompany = (company || '').trim() || 'a strategic buyer'
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: 'rgba(10,8,6,0.9)', backdropFilter: 'blur(10px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="relative w-full max-w-lg p-8 space-y-6"
            style={{
              background: 'linear-gradient(160deg, rgba(20,60,40,0.45), rgba(14,17,12,0.96))',
              border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: '4px',
              boxShadow: '0 12px 50px rgba(0,0,0,0.7), 0 0 60px rgba(16,185,129,0.12)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.7), transparent)' }}
            />

            <div className="flex flex-col items-center text-center space-y-4">
              <motion.div
                animate={{ rotate: [0, -4, 4, -2, 0] }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="w-14 h-14 flex items-center justify-center"
                style={{
                  background: 'rgba(16,185,129,0.18)',
                  border: '1px solid rgba(16,185,129,0.5)',
                  borderRadius: '50%',
                }}
              >
                <Crown className="h-6 w-6" style={{ color: '#34d399' }} />
              </motion.div>

              <h2
                className="text-2xl font-bold"
                style={{
                  fontFamily: "var(--font-got), Georgia, serif",
                  color: '#e8e0d0',
                  letterSpacing: '0.06em',
                }}
              >
                Your Run Has Ended
              </h2>

              <div
                className="h-px w-32"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.55), transparent)' }}
              />

              <p className="text-sm leading-relaxed" style={{ color: '#a89e90', letterSpacing: '0.01em' }}>
                You accepted the buyout from <span style={{ color: '#34d399', fontWeight: 600 }}>{safeCompany}</span> for{' '}
                <span style={{ color: '#34d399', fontWeight: 600 }}>{formatRevenue(amount)}</span>. The War Room is now
                closed to you — there is no path back.
              </p>
            </div>

            <button
              onClick={onContinue}
              className="w-full py-3 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              style={{
                background: 'rgba(16,185,129,0.18)',
                border: '1px solid rgba(16,185,129,0.55)',
                borderRadius: '3px',
                color: '#a7f3d0',
                fontFamily: "var(--font-got), Georgia, serif",
                letterSpacing: '0.12em',
                cursor: 'pointer',
              }}
            >
              View Final Report <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
