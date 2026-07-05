'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface RestartConfirmDialogProps {
  open: boolean
  submitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function RestartConfirmDialog({ open, submitting, onCancel, onConfirm }: RestartConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: 'rgba(10,8,6,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={submitting ? undefined : onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md p-7 space-y-6"
            style={{
              background: 'linear-gradient(160deg, rgba(60,10,10,0.35), rgba(17,14,10,0.95))',
              border: '1px solid rgba(92,26,36,0.45)',
              borderRadius: '4px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 40px rgba(92,26,36,0.15)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(92,26,36,0.7), transparent)' }}
            />

            <div className="flex flex-col items-center text-center space-y-3">
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{
                  background: 'rgba(92,26,36,0.18)',
                  border: '1px solid rgba(92,26,36,0.45)',
                  borderRadius: '2px',
                }}
              >
                <AlertTriangle className="h-5 w-5" style={{ color: '#8e3644' }} />
              </div>
              <h2
                className="text-xl font-bold"
                style={{
                  fontFamily: "var(--font-got), Georgia, serif",
                  color: '#e8e0d0',
                  letterSpacing: '0.06em',
                }}
              >
                Sound the Retreat?
              </h2>
              <div
                className="h-px w-24"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(92,26,36,0.5), transparent)' }}
              />
              <p className="text-sm leading-relaxed" style={{ color: '#a89e90', letterSpacing: '0.01em' }}>
                This will erase every answer from this attempt and return you to Month 0. There is no path back.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={onCancel}
                disabled={submitting}
                className="py-2.5 text-xs font-bold transition-colors disabled:opacity-40"
                style={{
                  background: 'rgba(179,144,62,0.06)',
                  border: '1px solid rgba(179,144,62,0.25)',
                  borderRadius: '3px',
                  color: '#b3903e',
                  fontFamily: "var(--font-got), Georgia, serif",
                  letterSpacing: '0.1em',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                Hold the Line
              </button>
              <button
                onClick={onConfirm}
                disabled={submitting}
                className="py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                style={{
                  background: 'rgba(92,26,36,0.25)',
                  border: '1px solid rgba(92,26,36,0.55)',
                  borderRadius: '3px',
                  color: '#e8a8a8',
                  fontFamily: "var(--font-got), Georgia, serif",
                  letterSpacing: '0.1em',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Retreating
                  </>
                ) : (
                  <>↩ Restart</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
