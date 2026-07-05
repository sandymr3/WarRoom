'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Mail,
  MessageSquare,
  Book,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  StoneCard,
  WarRoomCTA,
  GoldDivider,
  SigilBadge,
} from '@/src/components/primitives'
import { useNarratorOnboarding } from '@/src/hooks/useNarratorOnboarding'
import { easeDramatic, staggerContainer, staggerItem } from '@/lib/animations/variants'

// ─── Constants ──────────────────────────────────────────────────────────────

const INPUT_CLASSES =
  'bg-[color:var(--color-warroom-rampart)]/60 border-[color:var(--color-warroom-ash)]/30 text-[color:var(--color-warroom-ivory)] placeholder:text-[color:var(--color-warroom-smoke)] focus-visible:border-[color:var(--color-warroom-gold)]/60 focus-visible:ring-[color:var(--color-warroom-gold)]/20'

const SELECT_CLASSES =
  'flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-[color:var(--color-warroom-rampart)]/60 border-[color:var(--color-warroom-ash)]/30 text-[color:var(--color-warroom-ivory)] focus-visible:border-[color:var(--color-warroom-gold)]/60 focus-visible:ring-[color:var(--color-warroom-gold)]/20'

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'How long does the simulation take?',
    answer:
      'The Gambit simulation typically takes 60-90 minutes to complete. You can pause and resume at any time, and your progress will be saved automatically.',
  },
  {
    id: 'faq-2',
    question: 'Can I change my answers?',
    answer:
      'Yes, you can use the "Previous Question" button to review and change answers within the current stage. Once you complete a stage and move to the next, previous answers are locked.',
  },
  {
    id: 'faq-3',
    question: 'How is my score calculated?',
    answer:
      'Your score is based on multiple factors including decision quality, consistency with panelist expectations, startup state management, and competency demonstration across six key areas.',
  },
  {
    id: 'faq-4',
    question: 'What if I encounter a technical issue during simulation?',
    answer:
      'Your progress is saved automatically. If you experience issues, try refreshing the page. If the problem persists, use the Pause button to save your progress and contact support immediately.',
  },
  {
    id: 'faq-5',
    question: 'Can I retake the simulation?',
    answer:
      'Yes, you can start a new simulation at any time from the dashboard. Your previous results will be saved for comparison, allowing you to track your improvement over time.',
  },
]

const RESOURCES = [
  { label: 'User Guide', href: '#' },
  { label: 'Simulation Tips', href: '#' },
  { label: 'Video Tutorials', href: '#' },
]

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const prefersReducedMotion = useReducedMotion()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const { toast } = useToast()

  useNarratorOnboarding('support', { enabled: false }) // narrator disabled: was mid-nav spam

  const handleSubmitTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    toast({
      title: 'Support ticket submitted',
      description: "We'll get back to you within 24 hours.",
    })
    setIsSubmitting(false)
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <div className="py-6 max-w-5xl mx-auto px-2 sm:px-0 w-full">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeDramatic }}
      >
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle
            className="h-6 w-6 text-[color:var(--color-warroom-gold)]"
            aria-hidden
          />
          <h1
            className="text-xl font-semibold tracking-[0.04em]"
            style={{
              fontFamily: 'var(--font-display)',
              background:
                'linear-gradient(135deg, var(--color-warroom-gold), var(--color-warroom-gold-bright))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            The Analysis Room
          </h1>
        </div>
        <p
          className="text-sm text-[color:var(--color-warroom-smoke)] mb-4"
          style={{ fontFamily: 'var(--font-body, serif)' }}
        >
          Get help with the Gambit simulation and troubleshooting.
        </p>
        <GoldDivider variant="line" />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main Content ── */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          variants={staggerContainer}
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="show"
        >
          {/* Contact form */}
          <motion.div variants={staggerItem}>
            <StoneCard padding="none">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <MessageSquare className="h-4 w-4 text-[color:var(--color-warroom-gold)]" />
                <h2
                  className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Submit a Support Ticket
                </h2>
              </div>
              <form onSubmit={handleSubmitTicket} className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="subject"
                    className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Brief description of your issue"
                    required
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="category"
                    className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Category
                  </Label>
                  <select
                    id="category"
                    name="category"
                    className={SELECT_CLASSES}
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="technical">Technical Issue</option>
                    <option value="simulation">Simulation Question</option>
                    <option value="results">Results & Scoring</option>
                    <option value="account">Account & Access</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Provide detailed information about your issue..."
                    rows={6}
                    required
                    className={cn(INPUT_CLASSES, 'resize-none')}
                  />
                </div>

                <WarRoomCTA
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  icon={Send}
                >
                  {isSubmitting ? 'Dispatching Raven…' : 'Submit Ticket'}
                </WarRoomCTA>
              </form>
            </StoneCard>
          </motion.div>

          {/* FAQ */}
          <motion.div variants={staggerItem}>
            <StoneCard padding="none">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <Book className="h-4 w-4 text-[color:var(--color-warroom-gold)]" />
                <h2
                  className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="divide-y divide-[color:var(--color-warroom-ash)]/15">
                {FAQ_ITEMS.map((faq) => {
                  const isOpen = expandedFaq === faq.id
                  return (
                    <div key={faq.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedFaq(isOpen ? null : faq.id)
                        }
                        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[color:var(--color-warroom-gold)]/[0.02] transition-colors"
                      >
                        <span
                          className="text-sm text-[color:var(--color-warroom-ivory)] pr-4"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-[color:var(--color-warroom-smoke)] transition-transform shrink-0',
                            isOpen && 'rotate-180',
                          )}
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              duration: 0.25,
                              ease: easeDramatic,
                            }}
                            className="overflow-hidden"
                          >
                            <p
                              className="px-6 pb-4 text-sm text-[color:var(--color-warroom-smoke)] leading-relaxed"
                              style={{
                                fontFamily: 'var(--font-body, serif)',
                              }}
                            >
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </StoneCard>
          </motion.div>
        </motion.div>

        {/* ── Sidebar ── */}
        <motion.div
          className="space-y-5"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: easeDramatic }}
        >
          {/* Quick contact */}
          <StoneCard padding="none">
            <div className="px-5 py-3 border-b border-[color:var(--color-warroom-ash)]/20">
              <h3
                className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Quick Contact
              </h3>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-[color:var(--color-warroom-gold)] mt-0.5 shrink-0" />
                <div>
                  <p
                    className="text-sm text-[color:var(--color-warroom-ivory)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Email Support
                  </p>
                  <a
                    href="mailto:support@warroom.app"
                    className="text-xs text-[color:var(--color-warroom-gold)] hover:text-[color:var(--color-warroom-gold-bright)] transition-colors"
                    style={{ fontFamily: 'var(--font-body, serif)' }}
                  >
                    support@warroom.app
                  </a>
                </div>
              </div>
            </div>
          </StoneCard>

          {/* Resources */}
          <StoneCard padding="none">
            <div className="px-5 py-3 border-b border-[color:var(--color-warroom-ash)]/20">
              <h3
                className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Resources
              </h3>
            </div>
            <div className="px-5 py-3 space-y-1">
              {RESOURCES.map((res) => (
                <a
                  key={res.label}
                  href={res.href}
                  className="flex items-center justify-between py-2 text-sm text-[color:var(--color-warroom-ivory)] hover:text-[color:var(--color-warroom-gold)] transition-colors"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <span>{res.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                </a>
              ))}
            </div>
          </StoneCard>

          {/* System status */}
          <StoneCard padding="none">
            <div className="px-5 py-3 border-b border-[color:var(--color-warroom-ash)]/20">
              <h3
                className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                System Status
              </h3>
            </div>
            <div className="px-5 py-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[color:var(--color-warroom-verdant)] animate-pulse" />
              <SigilBadge tone="verdant">All Systems Operational</SigilBadge>
            </div>
          </StoneCard>
        </motion.div>
      </div>
    </div>
  )
}
