'use client'

import { motion } from 'framer-motion'
import type { EvaluationReport } from '@/src/types'

function formatCurrency(n: number | undefined): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

export function DealSummaryTab({ report }: { report: EvaluationReport }) {
  const deal = report.dealSummary as Record<string, unknown> | undefined
  const exitedVia = deal?.exitedVia as string | undefined
  const exitStage = deal?.exitStage as string | undefined
  const capitalSource = deal?.capitalSource as string | undefined

  const dealsOffered = (deal?.dealsOffered as number) || 0
  const bestDeal = deal?.bestDeal as { capitalOffer?: number; equityAsk?: number } | undefined
  const capitalOffer = bestDeal?.capitalOffer
  const equityAsk = bestDeal?.equityAsk

  const gotDeal = dealsOffered > 0 && !!bestDeal

  const exitBanner = (() => {
    if (!exitedVia) return null
    if (exitedVia === 'BUYOUT') {
      return { title: 'Exited via Buyout', subtitle: capitalSource || `You accepted a buyout offer${exitStage ? ` at ${exitStage}` : ''}.`, tone: 'positive' as const }
    }
    if (exitedVia === 'WALKOUT') {
      return { title: 'Walked Out of the Grand Board', subtitle: 'You declined every investor offer and exited without a deal.', tone: 'negative' as const }
    }
    if (exitedVia === 'EARLY_EXIT') {
      return { title: 'Early Exit', subtitle: `Simulation ended at ${exitStage || 'your current phase'} before reaching the Grand Board.`, tone: 'neutral' as const }
    }
    return null
  })()

  return (
    <div className="deal-page">
      {exitBanner && (
        <div className={`exit-banner exit-${exitBanner.tone}`}>
          <div className="exit-title">{exitBanner.title}</div>
          <div className="exit-subtitle">{exitBanner.subtitle}</div>
        </div>
      )}

      <motion.div
        className={`deal-hero ${gotDeal ? 'deal-hero--success' : 'deal-hero--empty'}`}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
      >
        <div className="deal-hero__label">{gotDeal ? 'Deal Received' : 'No Deal'}</div>
        <div className="deal-hero__count">
          <span className="deal-hero__num">{dealsOffered}</span>
          <span className="deal-hero__unit">{dealsOffered === 1 ? 'offer' : 'offers'}</span>
        </div>

        {gotDeal && (
          <div className="deal-terms">
            <motion.div className="deal-term" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, type: 'spring', stiffness: 200 }}>
              <div className="deal-term__value">{formatCurrency(capitalOffer)}</div>
              <div className="deal-term__label">Investment Received</div>
            </motion.div>
            <div className="deal-term__divider" aria-hidden />
            <motion.div className="deal-term" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}>
              <div className="deal-term__value">{equityAsk != null ? `${equityAsk}%` : '—'}</div>
              <div className="deal-term__label">Equity Given</div>
            </motion.div>
          </div>
        )}

        {!gotDeal && <p className="deal-hero__empty-msg">You did not receive any deal offers this session.</p>}
      </motion.div>

      <style jsx>{`
        .deal-page { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .exit-banner { border-radius: 12px; padding: 1rem 1.4rem; margin-bottom: 1.5rem; border: 1px solid color-mix(in srgb, var(--foreground) 8%, transparent); }
        .exit-banner .exit-title { font-weight: 700; color: var(--foreground); margin-bottom: 0.2rem; font-size: 1.05rem; font-family: var(--font-display); }
        .exit-banner .exit-subtitle { color: var(--color-warroom-smoke); font-size: 0.85rem; }
        .exit-positive { background: rgba(16,185,129,0.07); border-color: rgba(16,185,129,0.25); }
        .exit-negative { background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.25); }
        .exit-neutral  { background: rgba(179,144,62,0.07); border-color: rgba(179,144,62,0.25); }
        .deal-hero { border-radius: 20px; padding: 2.5rem 2rem 2.2rem; text-align: center; border: 1px solid color-mix(in srgb, var(--foreground) 8%, transparent); background: var(--wr-panel-bg-heavy); position: relative; overflow: hidden; }
        .deal-hero::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(135deg, transparent 0px, transparent 2px, rgba(179,144,62,0.03) 2px, rgba(179,144,62,0.03) 4px); pointer-events: none; }
        .deal-hero--success { border-color: rgba(179,144,62,0.3); }
        .deal-hero--empty   { border-color: rgba(239,68,68,0.25); }
        .deal-hero__label { font-family: var(--font-display); font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.22em; color: var(--color-warroom-gold); margin-bottom: 0.6rem; }
        .deal-hero__count { display: flex; align-items: baseline; justify-content: center; gap: 0.4rem; margin-bottom: 1.8rem; }
        .deal-hero__num { font-family: var(--font-display); font-size: 4.5rem; font-weight: 800; line-height: 1; color: var(--foreground); }
        .deal-hero__unit { font-family: var(--font-display); font-size: 1rem; color: var(--color-warroom-smoke); text-transform: uppercase; letter-spacing: 0.1em; }
        .deal-terms { display: flex; align-items: center; justify-content: center; gap: 0; margin-top: 0.2rem; }
        .deal-term { flex: 1; max-width: 200px; padding: 1.2rem 1rem; background: color-mix(in srgb, var(--foreground) 4%, transparent); border-radius: 14px; border: 1px solid color-mix(in srgb, var(--foreground) 7%, transparent); }
        .deal-term__divider { width: 1.5rem; flex-shrink: 0; }
        .deal-term__value { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--color-warroom-gold-bright, var(--color-warroom-gold)); line-height: 1; margin-bottom: 0.35rem; }
        .deal-term__label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--color-warroom-smoke); font-family: var(--font-display); }
        .deal-hero__empty-msg { color: var(--color-warroom-smoke); font-size: 0.9rem; margin-top: 0.5rem; }
      `}</style>
    </div>
  )
}