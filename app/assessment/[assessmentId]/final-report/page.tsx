'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  ScrollText,
  Swords,
  Brain,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import api from '@/src/lib/api'
import type { EvaluationReport } from '@/src/types'
import { DealSummaryTab } from './_sections/DealSummaryTab'
import { CompetencyTab } from './_sections/CompetencyTab'
import { AIAnalysisTab } from './_sections/AIAnalysisTab'
import { ResponsesTab } from './_sections/ResponsesTab'
import { GoldDivider } from '@/src/components/primitives'
import { easeDramatic } from '@/lib/animations/variants'
import { NoiseOverlay } from '@/src/components/effects/NoiseOverlay'

// ============================================
// Final Report — thin orchestrator shell
// Each tab is independently located in _sections/
// This page can be navigated to at any point (buyout, walkout, full completion)
// ============================================

const TABS = [
  { id: 1, label: 'Deal Summary', icon: Swords },
  { id: 2, label: 'Competency Profile', icon: Brain },
  { id: 3, label: 'AI Analysis', icon: Sparkles },
  { id: 4, label: 'Your Responses', icon: MessageSquare },
] as const

type TabId = (typeof TABS)[number]['id']

export default function FinalReportPage() {
  const params = useParams()
  const assessmentId = params?.assessmentId as string
  const prefersReducedMotion = useReducedMotion()

  const [report, setReport] = useState<EvaluationReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>(1)

  useEffect(() => {
    api.assessments
      .getReport(assessmentId)
      .then(setReport)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load report'),
      )
      .finally(() => setLoading(false))
  }, [assessmentId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--color-warroom-void)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[color:var(--color-warroom-gold)]/30 border-t-[color:var(--color-warroom-gold)] rounded-full animate-spin" />
          <p
            className="text-sm text-[color:var(--color-warroom-smoke)] tracking-[0.04em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
Opening the Annotated Games&hellip;
          </p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--color-warroom-void)]">
        <div className="text-center space-y-3">
          <p className="text-[color:var(--color-warroom-crimson)]">
            {error || 'Report not found'}
          </p>
          <Link
            href="/"
            className="text-sm text-[color:var(--color-warroom-gold)] hover:text-[color:var(--color-warroom-gold-bright)] transition-colors"
          >
            &larr; Return to the Study
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-warroom-void)] relative">
      {/* Stone texture backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: 'url("/assets/images/textures/stone.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.08,
          mixBlendMode: 'overlay',
        }}
      />
      <NoiseOverlay opacity={0.04} />
      {/* Atmospheric glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, var(--color-warroom-gold)/0.03 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-[940px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.header
          className="mb-8"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeDramatic }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)] hover:text-[color:var(--color-warroom-gold)] transition-colors mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <ScrollText className="h-6 w-6 text-[color:var(--color-warroom-gold)]" />
            <h1
              className="text-xl sm:text-2xl font-bold tracking-[0.04em]"
              style={{
                fontFamily: 'var(--font-display)',
                background:
                  'linear-gradient(135deg, var(--color-warroom-gold), var(--color-warroom-gold-bright))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Evaluation Report
            </h1>
          </div>
          <p
            className="text-sm text-[color:var(--color-warroom-smoke)]"
            style={{ fontFamily: 'var(--font-body, serif)' }}
          >
            {report.entrepreneurType} &bull; {report.organizationalRole}
          </p>
          <div className="mt-5">
            <GoldDivider variant="line" />
          </div>
        </motion.header>

        {/* Tab Navigation */}
        <nav className="flex justify-center gap-2 mb-8 flex-wrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border
                  ${
                    isActive
                      ? 'bg-[color:var(--color-warroom-gold)]/10 border-[color:var(--color-warroom-gold)]/40 text-[color:var(--color-warroom-gold)]'
                      : 'bg-transparent border-[color:var(--color-warroom-ash)]/20 text-[color:var(--color-warroom-smoke)] hover:bg-[color:var(--color-warroom-gold)]/[0.04] hover:text-[color:var(--color-warroom-ivory)]'
                  }
                `}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Tab Content */}
        <main>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={
                prefersReducedMotion ? false : { opacity: 0, y: 10 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: easeDramatic }}
            >
              {activeTab === 1 && <DealSummaryTab report={report} />}
              {activeTab === 2 && <CompetencyTab report={report} />}
              {activeTab === 3 && <AIAnalysisTab report={report} />}
              {activeTab === 4 && <ResponsesTab report={report} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
