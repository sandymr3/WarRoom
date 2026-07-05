'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, X, Loader2, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useFeatureIntro } from '@/src/hooks/useFeatureIntro'
import type { Mentor, MentorLifelineResult } from '@/src/types'

// ============================================
// MentorBlock — single unified "Mentor's Counsel" panel.
//
// Combines what used to be three separate affordances (the lifelines
// card, the floating "Counsel" button, and the transient tip popup)
// into one always-present block: the mentor delivers the stage tip as
// a scroll, shows remaining lifelines, and offers the "Ask a Mentor"
// action. First hover triggers the Oracle's feature intro.
// ============================================

interface MentorBlockProps {
  lifelinesLeft: number
  /** Stage-specific mentor tip (STAGE_MENTOR_TIPS). Hidden when absent. */
  tip?: string
  onOpen: () => void
}

export function MentorBlock({ lifelinesLeft, tip, onOpen }: MentorBlockProps) {
  const intro = useFeatureIntro('mentor-block')

  return (
    <div
      {...intro}
      className="rounded-xl border bg-card p-4 space-y-3"
      style={{
        borderColor: 'rgba(179,144,62,0.28)',
        background:
          'linear-gradient(135deg, rgba(179,144,62,0.05), transparent 60%), hsl(var(--card))',
      }}
    >
      <div className="flex items-center gap-2">
        <motion.span
          animate={{ y: [0, -2.5, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: 'rgba(179,144,62,0.12)', border: '1px solid rgba(179,144,62,0.3)' }}
        >
          <ScrollText className="h-3.5 w-3.5" style={{ color: '#b3903e' }} />
        </motion.span>
        <span
          className="text-sm font-semibold"
          style={{ fontFamily: "var(--font-got), Georgia, serif", letterSpacing: '0.06em', color: '#b3903e' }}
        >
          Mentor&rsquo;s Counsel
        </span>
      </div>

      {tip && (
        <p
          className="text-xs leading-relaxed text-foreground/80"
          style={{
            padding: '0.6rem 0.75rem',
            background: 'rgba(0,0,0,0.18)',
            borderLeft: '2px solid rgba(179,144,62,0.5)',
            borderRadius: '0 4px 4px 0',
            fontStyle: 'italic',
          }}
        >
          {tip}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn('h-2.5 w-2.5 rounded-full', i < lifelinesLeft ? 'bg-primary' : 'bg-muted')}
            />
          ))}
        </div>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {lifelinesLeft} lifeline{lifelinesLeft !== 1 ? 's' : ''} left
        </span>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs"
        disabled={lifelinesLeft <= 0}
        onClick={onOpen}
      >
        {lifelinesLeft > 0 ? <><MessageSquare className="h-3.5 w-3.5 mr-1.5" />Ask a Mentor</> : 'No lifelines left'}
      </Button>
    </div>
  )
}

// ============================================
// MentorOverlay — full-screen modal
// ============================================

interface MentorOverlayProps {
  show: boolean
  lifelinesLeft: number
  mentors: Mentor[]
  loadingConfig: boolean
  selectedMentorId: string
  mentorQuestion: string
  mentorLoading: boolean
  mentorResult: MentorLifelineResult | null
  onSelectMentor: (id: string) => void
  onQuestionChange: (q: string) => void
  onSubmit: () => void
  onClose: () => void
}

export function MentorOverlay({
  show,
  lifelinesLeft,
  mentors,
  loadingConfig,
  selectedMentorId,
  mentorQuestion,
  mentorLoading,
  mentorResult,
  onSelectMentor,
  onQuestionChange,
  onSubmit,
  onClose,
}: MentorOverlayProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Consult a Mentor</h3>
            <p className="text-xs text-muted-foreground">{lifelinesLeft} lifeline{lifelinesLeft !== 1 ? 's' : ''} remaining</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close mentor panel"><X className="h-4 w-4" aria-hidden /></Button>
        </div>

        {mentorResult ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
              <div className="h-10 w-10 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-lg font-bold flex-shrink-0">
                {mentorResult.mentorName.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-sm">{mentorResult.mentorName}</div>
                <div className="text-xs text-muted-foreground">Mentor Guidance</div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm leading-relaxed">
              {mentorResult.guidance}
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {mentorResult.lifelinesLeft} lifeline{mentorResult.lifelinesLeft !== 1 ? 's' : ''} remaining
            </div>
            <Button className="w-full" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {loadingConfig && mentors.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Loading mentors...</div>
            ) : null}
            <div>
              <Label className="text-sm font-medium mb-2 block">Choose your mentor</Label>
              <div className="space-y-2">
                {mentors.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelectMentor(m.id)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all text-sm',
                      selectedMentorId === m.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.specialization}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Your question (optional)</Label>
              <Textarea
                placeholder="What specific advice do you need? (Leave blank for general guidance)"
                value={mentorQuestion}
                onChange={(e) => onQuestionChange(e.target.value)}
                rows={3}
                className="resize-none text-sm"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={onSubmit}
                disabled={!selectedMentorId || mentorLoading || mentors.length === 0}
              >
                {mentorLoading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Getting advice...</>
                  : <><MessageSquare className="h-4 w-4 mr-2" />Get Advice</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
