'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Mic, Type } from 'lucide-react'

interface MicPermissionDialogProps {
  open: boolean
  onAllow: () => void
  onUseText: () => void
  hideTextOption?: boolean
}

export function MicPermissionDialog({ open, onAllow, onUseText, hideTextOption }: MicPermissionDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{ background: 'rgba(10,8,6,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md p-7 space-y-6"
            style={{
              background: 'linear-gradient(160deg, rgba(20,30,60,0.4), rgba(17,14,10,0.95))',
              border: '1px solid rgba(99,102,241,0.45)',
              borderRadius: '4px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.15)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.7), transparent)' }}
            />

            <div className="flex flex-col items-center text-center space-y-3">
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{
                  background: 'rgba(99,102,241,0.18)',
                  border: '1px solid rgba(99,102,241,0.45)',
                  borderRadius: '2px',
                }}
              >
                <Mic className="h-5 w-5" style={{ color: '#a5b4fc' }} />
              </div>
              <h2
                className="text-xl font-bold"
                style={{
                  fontFamily: "var(--font-got), Georgia, serif",
                  color: '#e8e0d0',
                  letterSpacing: '0.06em',
                }}
              >
                Microphone Needed
              </h2>
              <div
                className="h-px w-24"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }}
              />
              <p className="text-sm leading-relaxed" style={{ color: '#a89e90', letterSpacing: '0.01em' }}>
                {hideTextOption
                  ? 'The War Room requires your microphone so the investors can hear you pitch, answer, and negotiate. Recordings stay private to this assessment.'
                  : 'The next section needs your microphone so the investors can hear you pitch, answer, and negotiate. Recordings stay private to this assessment. If you\'d rather type, you can continue with text instead.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1">
              <button
                onClick={onAllow}
                className="py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-2"
                style={{
                  background: 'rgba(99,102,241,0.25)',
                  border: '1px solid rgba(99,102,241,0.55)',
                  borderRadius: '3px',
                  color: '#c7d2fe',
                  fontFamily: "var(--font-got), Georgia, serif",
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                }}
              >
                <Mic className="h-3.5 w-3.5" /> Allow Microphone
              </button>
              {!hideTextOption && (
                <button
                  onClick={onUseText}
                  className="py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(179,144,62,0.06)',
                    border: '1px solid rgba(179,144,62,0.25)',
                    borderRadius: '3px',
                    color: '#b3903e',
                    fontFamily: "var(--font-got), Georgia, serif",
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                  }}
                >
                  <Type className="h-3.5 w-3.5" /> Continue With Text
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
