'use client'

import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StageTimerResult } from '@/src/hooks/useStageTimer'

interface SimulationHeaderProps {
  stageName: string
  progressLabel?: string
  progressPct: number
  timer?: StageTimerResult
  showTimer?: boolean
  isCrisis?: boolean
  accent?: string
  rightSlot?: React.ReactNode
}

export function SimulationHeader({
  stageName,
  progressLabel,
  progressPct,
  timer,
  showTimer = true,
  isCrisis,
  accent = '#b3903e',
  rightSlot,
}: SimulationHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md h-14 flex items-center px-4 gap-4"
      style={{
        background: isCrisis
          ? 'linear-gradient(90deg, rgba(10,8,6,0.97), rgba(60,10,10,0.97))'
          : 'rgba(10,8,6,0.95)',
        borderBottom: isCrisis
          ? '1px solid rgba(92,26,36,0.5)'
          : `1px solid rgba(179,144,62,0.12)`,
        boxShadow: isCrisis
          ? '0 0 30px rgba(92,26,36,0.25), 0 1px 0 rgba(92,26,36,0.3)'
          : '0 1px 0 rgba(179,144,62,0.08), 0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {/* Brand mark */}
      <div
        className="h-7 w-7 rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          background: isCrisis
            ? 'linear-gradient(135deg, #5c1010, #5c1a24)'
            : 'linear-gradient(135deg, #8b6914, #b3903e)',
          color: '#0a0806',
          fontFamily: "var(--font-got), Georgia, serif",
          boxShadow: isCrisis
            ? '0 0 12px rgba(92,26,36,0.6)'
            : '0 0 12px rgba(179,144,62,0.4)',
        }}
      >
        {isCrisis ? '⚔' : 'KK'}
      </div>

      {/* Stage info + progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs mb-1">
          <span
            style={{
              fontFamily: "var(--font-got), Georgia, serif",
              fontWeight: 700,
              letterSpacing: '0.08em',
              fontSize: '0.65rem',
              color: isCrisis ? '#8e3644' : accent,
              textShadow: isCrisis ? '0 0 12px rgba(194,59,59,0.5)' : `0 0 10px ${accent}60`,
            }}
          >
            {stageName}
          </span>
          {progressLabel && (
            <>
              <span style={{ color: 'rgba(140,128,117,0.4)' }}>|</span>
              <span style={{ color: 'rgba(140,128,117,0.6)', letterSpacing: '0.04em' }}>{progressLabel}</span>
            </>
          )}
        </div>
        {/* GOT-styled progress bar */}
        <div className="h-1 rounded-none overflow-hidden" style={{ background: 'rgba(179,144,62,0.08)' }}>
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${progressPct}%`,
              background: isCrisis
                ? 'linear-gradient(90deg, #5c1010, #5c1a24, #8e3644)'
                : `linear-gradient(90deg, #8b6914, ${accent}, #d9b45f)`,
              boxShadow: isCrisis
                ? '0 0 8px rgba(194,59,59,0.6)'
                : `0 0 8px ${accent}60`,
            }}
          />
        </div>
      </div>

      {/* Crisis indicator */}
      {isCrisis && (
        <div
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold"
          style={{
            background: 'rgba(92,26,36,0.15)',
            border: '1px solid rgba(92,26,36,0.4)',
            borderRadius: '2px',
            color: '#8e3644',
            fontFamily: "var(--font-got), Georgia, serif",
            letterSpacing: '0.08em',
            animation: 'crisisBorder 2.2s ease-in-out infinite',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8e3644', display: 'inline-block', animation: 'danger-pulse-dot 1.5s ease-in-out infinite' }} />
          CRISIS
        </div>
      )}

      {rightSlot}

      {/* Timer */}
      {showTimer && timer && (
        <div
          className={cn(
            'flex items-center gap-1.5 text-sm font-mono flex-shrink-0 px-3 py-1',
          )}
          style={{
            background: timer.isWarning ? 'rgba(92,26,36,0.15)' : 'rgba(179,144,62,0.06)',
            border: timer.isWarning ? '1px solid rgba(92,26,36,0.4)' : '1px solid rgba(179,144,62,0.15)',
            borderRadius: '2px',
            color: timer.isWarning ? '#8e3644' : '#b3903e',
            animation: timer.isWarning ? 'danger-pulse-dot 1s ease-in-out infinite' : undefined,
          }}
        >
          <Clock className="h-3.5 w-3.5" />
          <span style={{ letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>{timer.display}</span>
        </div>
      )}
    </header>
  )
}
