'use client'

import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { PhaseTransitionScenario } from '@/src/components/PhaseTransitionScenario'
import type { PhaseScenarioOut, LeaderboardEntry } from '@/src/types'

interface PhaseTransitionViewProps {
  phaseScenario: PhaseScenarioOut
  showRestartCheckpoint: boolean
  submitting: boolean
  revenue: number
  prevRevenue?: number
  entries: LeaderboardEntry[]
  userId?: string
  onScenarioSubmit: (response: string) => Promise<void>
  onRestart: () => void
  onContinue: () => void
}

export function PhaseTransitionView({
  phaseScenario, showRestartCheckpoint, submitting, revenue, prevRevenue,
  entries, userId, onScenarioSubmit, onRestart, onContinue,
}: PhaseTransitionViewProps) {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0806 0%, #110e0a 100%)' }}>
      {/* Ambient top glow */}
      <div className="fixed inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(179,144,62,0.3), transparent)' }} />

      {submitting && (
        <div className="fixed inset-0 z-50 backdrop-blur-xl flex flex-col items-center justify-center gap-5"
          style={{ background: 'rgba(10,8,6,0.92)' }}>
          <div className="text-3xl animate-torch-glow">⚔</div>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#b3903e' }} />
          <p className="text-sm font-bold" style={{ fontFamily: "var(--font-got), Georgia, serif", letterSpacing: '0.12em', color: '#b3903e' }}>
            The Council deliberates...
          </p>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-12">
        {showRestartCheckpoint ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-4 pt-4">
              <div className="text-4xl mb-2">⚔</div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-got), Georgia, serif", color: '#e8e0d0', letterSpacing: '0.06em' }}>
                The Crossroads
              </h2>
              <div className="h-px max-w-xs mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(179,144,62,0.4), transparent)' }} />
              <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: '#8c8075', letterSpacing: '0.02em' }}>
                You have forged the foundation. Before you commit your forces and enter the 60-minute battle phase — make your choice, Lord Commander.
              </p>
            </div>

            {/* Choice cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Retreat */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRestart}
                disabled={submitting}
                className="p-6 text-left space-y-3 relative overflow-hidden disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, rgba(60,10,10,0.4), rgba(17,14,10,0.8))',
                  border: '1px solid rgba(92,26,36,0.35)',
                  borderRadius: '4px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(92,26,36,0.5), transparent)' }} />
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center" style={{ background: 'rgba(92,26,36,0.15)', border: '1px solid rgba(92,26,36,0.3)', borderRadius: '2px' }}>
                    <AlertTriangle className="h-4 w-4" style={{ color: '#8e3644' }} />
                  </div>
                  <h3 className="font-bold text-sm" style={{ fontFamily: "var(--font-got), Georgia, serif", color: '#e8e0d0', letterSpacing: '0.04em' }}>
                    Sound the Retreat
                  </h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#8c8075' }}>
                  The battle plan has flaws. Pull back and reforge your idea from the beginning.
                </p>
                <div className="pt-1 text-xs font-bold" style={{ color: '#8e3644', letterSpacing: '0.08em', fontFamily: "var(--font-got), Georgia, serif" }}>
                  ↩ Restart Simulation
                </div>
              </motion.button>

              {/* Advance */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onContinue}
                disabled={submitting}
                className="p-6 text-left space-y-3 relative overflow-hidden disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, rgba(100,70,0,0.2), rgba(17,14,10,0.9))',
                  border: '1px solid rgba(179,144,62,0.3)',
                  borderRadius: '4px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 20px rgba(179,144,62,0.06)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(179,144,62,0.5), transparent)' }} />
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center" style={{ background: 'rgba(179,144,62,0.1)', border: '1px solid rgba(179,144,62,0.3)', borderRadius: '2px' }}>
                    <CheckCircle2 className="h-4 w-4" style={{ color: '#b3903e' }} />
                  </div>
                  <h3 className="font-bold text-sm" style={{ fontFamily: "var(--font-got), Georgia, serif", color: '#e8e0d0', letterSpacing: '0.04em' }}>
                    March to Battle
                  </h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#8c8075' }}>
                  The plan is solid. Commit forces. Enter the execution phase and build the kingdom.
                </p>
                <div className="pt-1 text-xs font-bold" style={{ color: '#b3903e', letterSpacing: '0.08em', fontFamily: "var(--font-got), Georgia, serif" }}>
                  ⚔ Continue to Execution
                </div>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <PhaseTransitionScenario
            scenario={phaseScenario}
            onSubmit={onScenarioSubmit}
            revenue={revenue}
            previousRevenue={prevRevenue}
            leaderboardEntries={entries}
            currentUserId={userId}
          />
        )}
      </div>
    </div>
  )
}
