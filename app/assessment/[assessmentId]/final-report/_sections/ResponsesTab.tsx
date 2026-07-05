'use client'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { stageLabel } from '@/src/lib/helpers'
import type { EvaluationReport, UserResponseEntry } from '@/src/types'

function getResponseText(entry: UserResponseEntry): string {
  if (typeof entry.selectedOptionText === 'string' && entry.selectedOptionText.trim()) return entry.selectedOptionText
  const response = (entry.response || {}) as Record<string, unknown>
  if (typeof response.selectedOptionText === 'string' && (response.selectedOptionText as string).trim()) return response.selectedOptionText as string
  if (typeof response.text === 'string' && (response.text as string).trim()) return response.text as string
  if (typeof response.selectedOptionId === 'string' && (response.selectedOptionId as string).trim()) return `Selected: ${response.selectedOptionId as string}`
  if (response.allocations && typeof response.allocations === 'object') {
    return Object.entries(response.allocations as Record<string, unknown>).map(([k, v]) => `${k}: ${String(v)}%`).join(', ')
  }
  return JSON.stringify(response)
}

function ProficiencyBadge({ p }: { p: number | null }) {
  if (p === null || p === undefined) return null
  const colors: Record<number, { bg: string; text: string; label: string }> = {
    1: { bg: 'rgba(239,68,68,0.12)', text: '#fca5a5', label: 'P1 — Developing' },
    2: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', label: 'P2 — Strong' },
    3: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', label: 'P3 — Advanced' },
  }
  const c = colors[p] || colors[1]
  return (
    <span style={{ background: c.bg, color: c.text, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
      {c.label}
    </span>
  )
}

export function ResponsesTab({ report }: { report: EvaluationReport }) {
  const responses = report.userResponses || []

  const grouped: Record<string, UserResponseEntry[]> = {}
  for (const r of responses) {
    const stage = r.stageName || 'Unknown'
    if (!grouped[stage]) grouped[stage] = []
    grouped[stage].push(r)
  }
  const sortedStages = Object.keys(grouped)

  return (
    <div className="responses-page">
      <div className="responses-header">
        <h2>Your Responses</h2>
        <p className="responses-subtitle">Expand any question to compare your choice with the ideal path</p>
      </div>

      {sortedStages.length === 0 && <div className="no-data">No responses recorded.</div>}

      {sortedStages.map((stageName) => (
        <div key={stageName} className="stage-group">
          <div className="stage-header">
            <span className="stage-badge">{stageLabel(stageName)}</span>
            <span className="response-count">{grouped[stageName].length} responses</span>
          </div>

          <Accordion type="multiple" className="response-accordion">
            {grouped[stageName].map((entry, i) => {
              const userAnswer = getResponseText(entry)
              const idealText = (entry.idealOptionText || '').trim()
              const hasIdeal = idealText.length > 0
              const userMatchesIdeal = hasIdeal && userAnswer.trim() === idealText
              const feedback = entry.aiFeedback as Record<string, unknown> | undefined
              const tip = feedback && typeof feedback.feedback === 'string' ? feedback.feedback : ''

              return (
                <AccordionItem key={i} value={`${stageName}-${i}`} className="response-item">
                  <AccordionTrigger className="response-trigger">
                    <div className="trigger-content">
                      <span className="q-type">{(entry.questionType || 'unknown').replace(/_/g, ' ')}</span>
                      <p className="trigger-question">{entry.questionText || entry.questionId || 'Question'}</p>
                      <div className="trigger-meta">
                        <ProficiencyBadge p={entry.proficiency} />
                        {userMatchesIdeal && <span className="match-badge">&#10003; Matches ideal</span>}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="response-content">
                    {hasIdeal ? (
                      <div className="answer-grid">
                        <div className={`answer-card user-card${userMatchesIdeal ? ' is-match' : ''}`}>
                          <span className="answer-label">Your Answer</span>
                          <p>{userAnswer}</p>
                          {tip && <p className="ai-tip">Tip: {tip}</p>}
                        </div>
                        <div className="answer-card ideal-card">
                          <span className="answer-label ideal-label">Ideal Path</span>
                          <p>{idealText}</p>
                          {entry.idealRationale && <p className="ai-tip">{entry.idealRationale}</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="answer-card single-card">
                        <span className="answer-label">Your Answer</span>
                        <p>{userAnswer}</p>
                        {tip && <p className="ai-tip">Tip: {tip}</p>}
                        <p className="no-ideal-note">No ideal reference for free-form responses — your answer is evaluated by AI.</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      ))}

      <style jsx>{`
        .responses-page { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .responses-header { text-align: center; margin-bottom: 2rem; }
        .responses-header h2 { font-size: 1.5rem; font-weight: 800; color: var(--color-warroom-ivory); margin-bottom: 0.5rem; font-family: var(--font-display); }
        .responses-subtitle { color: var(--color-warroom-smoke); font-size: 0.9rem; font-family: var(--font-body, serif); }
        .stage-group { margin-bottom: 2rem; }
        .stage-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.8rem; }
        .stage-badge { background: rgba(179,144,62,0.12); color: var(--color-warroom-gold); padding: 0.25rem 0.8rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; font-family: var(--font-display); }
        .response-count { font-size: 0.8rem; color: var(--color-warroom-smoke); }

        .response-accordion :global(.response-item) {
          background: color-mix(in srgb, var(--foreground) 3%, transparent);
          border: 1px solid color-mix(in srgb, var(--foreground) 6%, transparent);
          border-radius: 12px;
          margin-bottom: 0.6rem;
          padding: 0 1.1rem;
        }
        .response-accordion :global(.response-trigger) {
          padding: 0.9rem 0;
        }
        .response-accordion :global(.response-content) {
          padding-top: 0.4rem;
          padding-bottom: 1rem;
        }

        .trigger-content { display: flex; flex-direction: column; gap: 0.4rem; flex: 1; }
        .q-type { font-size: 0.7rem; font-weight: 600; color: var(--color-warroom-gold); text-transform: uppercase; letter-spacing: 0.5px; font-family: var(--font-display); }
        .trigger-question { font-size: 0.9rem; color: var(--color-warroom-ivory); margin: 0; line-height: 1.4; font-family: var(--font-body, serif); }
        .trigger-meta { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
        .match-badge { font-size: 0.7rem; font-weight: 600; color: var(--color-warroom-verdant); background: rgba(16,185,129,0.1); padding: 0.15rem 0.5rem; border-radius: 6px; font-family: var(--font-display); }

        .answer-grid { display: grid; grid-template-columns: 1fr; gap: 0.8rem; }
        @media (min-width: 640px) { .answer-grid { grid-template-columns: 1fr 1fr; } }

        .answer-card { background: color-mix(in srgb, var(--foreground) 2%, transparent); border: 1px solid color-mix(in srgb, var(--foreground) 6%, transparent); border-radius: 10px; padding: 0.8rem 1rem; }
        .answer-card.single-card { background: color-mix(in srgb, var(--foreground) 2%, transparent); }
        .answer-card.is-match { border-color: rgba(16,185,129,0.35); background: rgba(16,185,129,0.04); }
        .answer-card.ideal-card { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.05); }

        .answer-label { font-size: 0.7rem; font-weight: 600; color: var(--color-warroom-smoke); text-transform: uppercase; letter-spacing: 0.5px; font-family: var(--font-display); }
        .ideal-label { color: var(--color-warroom-verdant); }
        .answer-card p { color: var(--muted-foreground); font-size: 0.88rem; margin: 0.3rem 0 0 0; line-height: 1.5; font-family: var(--font-body, serif); }
        .ai-tip { font-size: 0.78rem; color: var(--color-warroom-smoke); font-style: italic; margin-top: 0.5rem !important; }
        .no-ideal-note { font-size: 0.74rem; color: var(--color-warroom-smoke); font-style: italic; margin-top: 0.6rem !important; }
        .no-data { color: var(--color-warroom-smoke); text-align: center; padding: 3rem; font-family: var(--font-body, serif); }
      `}</style>
    </div>
  )
}
