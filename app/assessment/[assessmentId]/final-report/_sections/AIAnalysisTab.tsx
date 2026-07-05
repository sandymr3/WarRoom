'use client'

import type React from 'react'
import type { EvaluationReport } from '@/src/types'

function inlineMd(raw: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = raw
  let i = 0
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    if (!boldMatch || boldMatch.index === undefined) {
      parts.push(remaining)
      break
    }
    if (boldMatch.index > 0) parts.push(remaining.slice(0, boldMatch.index))
    parts.push(<strong key={`b${i++}`}>{boldMatch[1]}</strong>)
    remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
  }
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

function renderAnalysis(text: string): React.ReactNode {
  if (!text) return <p className="no-data">No detailed analysis available.</p>

  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      elements.push(<br key={key++} />)
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h3 key={key++} className="analysis-heading">{inlineMd(trimmed.slice(3))}</h3>)
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={key++} className="analysis-heading">{inlineMd(trimmed.slice(4))}</h3>)
    } else if (/^[-*] /.test(trimmed)) {
      elements.push(
        <div key={key++} className="analysis-bullet">
          <span className="bullet">&bull;</span>
          <span>{inlineMd(trimmed.slice(2))}</span>
        </div>
      )
    } else {
      elements.push(<p key={key++} className="analysis-text">{inlineMd(trimmed)}</p>)
    }
  }
  return <>{elements}</>
}

export function AIAnalysisTab({ report }: { report: EvaluationReport }) {
  return (
    <div className="analysis-page">
      <div className="analysis-header">
        <h2>Detailed AI Evaluation</h2>
        <p className="analysis-subtitle">
          Comprehensive analysis of your simulation journey — strengths, weaknesses, and actionable insights
        </p>
      </div>

      <div className="analysis-content">
        {renderAnalysis(report.detailedAnalysis || '')}
      </div>

      <style jsx>{`
        .analysis-page { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .analysis-header { text-align: center; margin-bottom: 2rem; }
        .analysis-header h2 { font-size: 1.5rem; font-weight: 800; color: var(--color-warroom-ivory); margin-bottom: 0.5rem; font-family: var(--font-display); }
        .analysis-subtitle { color: var(--color-warroom-smoke); font-size: 0.9rem; font-family: var(--font-body, serif); }
        .analysis-content { background: color-mix(in srgb, var(--foreground) 3%, transparent); border: 1px solid color-mix(in srgb, var(--foreground) 6%, transparent); border-radius: 16px; padding: 2rem; }
        .analysis-heading { font-size: 1.15rem; font-weight: 700; color: var(--color-warroom-gold); margin: 1.5rem 0 0.6rem 0; padding-bottom: 0.4rem; border-bottom: 1px solid rgba(179, 144, 62, 0.2); font-family: var(--font-display); }
        .analysis-heading:first-child { margin-top: 0; }
        .analysis-bullet { display: flex; gap: 0.6rem; padding: 0.3rem 0; font-size: 0.95rem; color: var(--muted-foreground); line-height: 1.6; font-family: var(--font-body, serif); }
        .bullet { color: var(--color-warroom-gold); font-weight: 700; flex-shrink: 0; }
        .analysis-text { font-size: 0.95rem; color: var(--muted-foreground); line-height: 1.6; margin: 0.3rem 0; font-family: var(--font-body, serif); }
        .no-data { color: var(--color-warroom-smoke); text-align: center; padding: 3rem; font-family: var(--font-body, serif); }
      `}</style>
    </div>
  )
}
