'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

import api from '@/src/lib/api'
import { useAudioRecorder } from '@/src/hooks/useAudioRecorder'
import { useMicPermission } from '@/src/hooks/useMicPermission'
import { MicPermissionDialog } from '@/components/MicPermissionDialog'
import { normalizeVoiceSlug as sharedNormalizeVoiceSlug } from '@/src/lib/helpers'
import type {
    AssessmentState,
    Investor,
    InvestorScorecard,
} from '@/src/types'
import { Volume2, VolumeX } from 'lucide-react'
import { ChessboardEntrance } from '@/src/components/chessboard/ChessboardEntrance'
import { AmbientAudioManager } from '@/src/components/chessboard/AmbientAudioManager'
import { AudioControls } from '@/src/components/chessboard/AudioControls'
import { isVoiceLineMuted, getVoiceLineVolume } from '@/src/state/audioStore'
import { claimVoiceTurn, waitForTurn } from '@/lib/audio/voiceTurn'
import { displayTranscript, isNoSpeechTranscript } from '@/src/lib/transcription'

import type { AmbientScene } from '@/src/hooks/useAmbientAudio'
// Chamber components — Phase B integration. The pitch route's data flow stays
// the same; the chamber is a presentational shell that wraps the existing
// recording / question UI with the cinematic 3-panel layout.
import { CouncilChamberLayout } from '@/src/components/chessboard/CouncilChamberLayout'
import { ActiveInvestor } from '@/src/components/chessboard/ActiveInvestor'
import { ConversationZone } from '@/src/components/chessboard/ConversationZone'
import { CouncilRoster } from '@/src/components/chessboard/CouncilRoster'
import { CouncilDeliberatesLoader } from '@/src/components/chessboard/CouncilDeliberatesLoader'
import { useCouncilMoods } from '@/src/hooks/useCouncilMoods'
import { useFeedbackSentiment } from '@/src/hooks/useFeedbackSentiment'
import { useNarratorOnboarding } from '@/src/hooks/useNarratorOnboarding'
import { narratorPhaseForChessboard } from '@/lib/narrator/scripts'
import { investorPortraitSrc } from '@/src/lib/investorAssets'
import { useFeatureIntro } from '@/src/hooks/useFeatureIntro'

// ============================================
// WAR ROOM – Investor Pitch Simulation
// SOP: 15 minutes, all C1-C8 integrated
// ============================================

function QuestionAudioPlayer({ audioKeys, className = '' }: { audioKeys: string[], className?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [isCheckingAudio, setIsCheckingAudio] = useState(true);

  const audioKeysKey = audioKeys.join('|')
  useEffect(() => {
    let cancelled = false;
    setIsCheckingAudio(true);
    setResolvedSrc(null);

    const probe = async () => {
      for (const key of audioKeys) {
        if (!key) continue;
        const audioSrc = `/audio/questions/${key}.mp3`;
        try {
          const res = await fetch(audioSrc, { method: 'HEAD' });
          if (res.ok) {
            if (!cancelled) {
              setResolvedSrc(audioSrc);
            }
            return;
          }
        } catch {
          // keep trying other candidates
        }
      }
      if (!cancelled) {
        setResolvedSrc(null);
      }
      if (!cancelled) {
        setIsCheckingAudio(false);
      }
    };

        void probe().finally(() => {
            if (!cancelled) {
                setIsCheckingAudio(false);
            }
        });

    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioKeysKey]);

  useEffect(() => {
    if (!resolvedSrc) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(resolvedSrc);
    audioRef.current.onended = () => setIsPlaying(false);
    audioRef.current.onerror = () => setIsPlaying(false);
    setIsPlaying(false);
  }, [resolvedSrc]);

  if (!isCheckingAudio && !resolvedSrc) return null;

  const toggleAudio = () => {
    if (!resolvedSrc) return;
    if (!audioRef.current || audioRef.current.src !== new URL(resolvedSrc, window.location.origin).href) {
      audioRef.current = new Audio(resolvedSrc);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const toPlay = audioRef.current;
      // Never talk over the Grandmaster — let his current line finish first.
      void waitForTurn('investor').then(() => {
        claimVoiceTurn('investor', toPlay)
        return toPlay.play();
      }).then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAudio(); }}
            className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isPlaying ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'} ${className}`}
            title={isCheckingAudio ? 'Loading voice' : 'Listen'}
            disabled={isCheckingAudio}
    >
            {isCheckingAudio ? <span className="h-2 w-2 rounded-full bg-current animate-pulse" /> : isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}

type ChessboardPhase = 'LOADING' | 'PITCH' | 'INVESTOR_QA' | 'DEAL_RESULTS' | 'COMPLETE'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PreviousResponseEntry = Record<string, any>

function normalizePreviousResponses(raw: unknown): PreviousResponseEntry[] {
    if (!raw) return []

    if (Array.isArray(raw)) {
        return raw.filter((item): item is PreviousResponseEntry => typeof item === 'object' && item !== null)
    }

    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed)
                ? parsed.filter((item): item is PreviousResponseEntry => typeof item === 'object' && item !== null)
                : []
        } catch {
            return []
        }
    }

    return []
}

// Re-exported via shared helper so investor title \u2192 id \u2192 voice-slug resolution
// stays in one place (see src/lib/helpers.tsx).
const normalizeVoiceSlug = sharedNormalizeVoiceSlug

function getPreparedPitchFromState(state: AssessmentState | null): string {
    const directPitch = state?.assessment?.chessboardPitch?.trim()
    if (directPitch) return directPitch

    const previousResponses = normalizePreviousResponses(state?.assessment?.previousResponses)
    for (let i = previousResponses.length - 1; i >= 0; i--) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = previousResponses[i] as Record<string, any>
        const questionId = String(entry.questionId || entry.qId || entry.question_id || entry.q_id || '').toUpperCase()
        const question = String(entry.q || entry.question || entry.questionText || entry.text || '').toLowerCase()
        const answer = String(entry.a || entry.answer || entry.response || entry.selectedOptionText || entry.text || '').trim()
        if (!answer) continue

        if (questionId === 'Q_WP_1' || question.includes('pitch template') || question.includes('war room pitch') || question.includes('prepared pitch')) {
            return answer
        }
    }

    return ''
}

export default function ChessboardSimulation() {
    const params = useParams()
    const router = useRouter()
    const assessmentId = params?.assessmentId as string

    // Microphone permission gate
    const mic = useMicPermission()

    // State
    const [phase, setPhase] = useState<ChessboardPhase>('LOADING')

    // ── Narrator — keep only ONE chessboard intro (the pitch entry); the qa /
    // deal / complete lines fired mid-flow and felt like spam. ──
    const narratorPhase = narratorPhaseForChessboard(phase)
    useNarratorOnboarding(narratorPhase ?? '', { enabled: narratorPhase === 'chessboard.pitch' })

    // ── First-hover Grandmaster intros for the Chessboard's key controls ──
    const offerIntro = useFeatureIntro('negotiation-offer')
    const pitchRecordIntro = useFeatureIntro('chessboard-pitch-record')
    const investorMicIntro = useFeatureIntro('chessboard-investor-mic')

    // Cinematic entrance overlay — shown until the door video / fallback completes.
    const [showEntrance, setShowEntrance] = useState(true)
    // Cinematic exit overlay — shown briefly before pushing to the verdict ceremony,
    // so the chamber doesn't snap-cut. ~900ms total before navigation fires.
    const [showVerdictExit, setShowVerdictExit] = useState(false)
    const [assessmentState, setAssessmentState] = useState<AssessmentState | null>(null)
    const [investors, setInvestors] = useState<Investor[]>([])
    const [pitchText, setPitchText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // Audio Recording
    const pitchRecorder = useAudioRecorder(60)  // 60s for pitch
    const responseRecorder = useAudioRecorder(15) // 15s for responses
    const negotiationRecorder = useAudioRecorder(15) // 15s for negotiation

    // Analysis results
    const [pitchAnalysis, setPitchAnalysis] = useState<{
        transcription: string; feedback: string; strengths: string[]; weaknesses: string[];
        overallScore: number; clarity: number; confidence: number; persuasion: number;
    } | null>(null)
    const [responseTranscription, setResponseTranscription] = useState('')

    // Investor Q&A
    const [currentInvestorIndex, setCurrentInvestorIndex] = useState(0)
    const [scorecards, setScorecards] = useState<InvestorScorecard[]>([])
    const [currentInvestorReaction, setCurrentInvestorReaction] = useState('')
    const [responseSubmitted, setResponseSubmitted] = useState(false)

    const [followupPhase, setFollowupPhase] = useState<'initial' | 'followup_pending' | 'followup_answered'>('initial')
    const [followupQuestion, setFollowupQuestion] = useState('')
    const [initialTranscription, setInitialTranscription] = useState('')

    const [isPlayingAudio, setIsPlayingAudio] = useState(false)
    const [hasAutoPlayed, setHasAutoPlayed] = useState<Record<string, boolean>>({})

    // Negotiation state
    const MAX_NEG_ROUNDS = 4 // 3 negotiation rounds + 1 final accept/reject
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [offers, setOffers] = useState<any[]>([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedOffer, setSelectedOffer] = useState<any | null>(null)
    const [negRound, setNegRound] = useState(0)
    const [negHistory, setNegHistory] = useState<{sender: string, msg: string, type: 'investor'|'user', capital?: number, equity?: number}[]>([])
    const [dealFinalized, setDealFinalized] = useState(false)
    const [isNegVoiceSubmitting, setIsNegVoiceSubmitting] = useState(false)
    const [acceptedDealTerms, setAcceptedDealTerms] = useState<{capital: number, equity: number, investorName: string} | null>(null)
    const [walkedAwayInvestor, setWalkedAwayInvestor] = useState<string | null>(null)
    // When the AI makes a final Round-4 "take it or leave it" offer, we surface
    // Accept / Reject buttons instead of auto-rejecting the whole negotiation.
    const [isFinalOffer, setIsFinalOffer] = useState(false)

    // Auto-reset negotiation recorder when offer changes
    useEffect(() => {
        if (selectedOffer) {
            negotiationRecorder.resetRecording()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOffer])

    // Timer (15 min war room)

    // -- Negotiation Logic --
    const handleSelectOffer = (offer: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        setSelectedOffer(offer)
        setNegRound(0) // Round increments on each voice submission
        setIsFinalOffer(false)
        setNegHistory([
            { sender: offer.investorName, msg: offer.message, type: 'investor', capital: offer.capital, equity: offer.equity }
        ])
    }

    const handleNegotiateAudio = async () => {
        // Never fail silently — surface why nothing happened.
        if (!selectedOffer) {
            setError('No offer selected — pick an offer to negotiate first.')
            return
        }
        if (!negotiationRecorder.audioBlob) {
            setError('No recording captured — record your counter, then submit.')
            return
        }

        const nextRound = negRound + 1

        // Don't allow more than MAX_NEG_ROUNDS
        if (nextRound > MAX_NEG_ROUNDS) {
            setError('Maximum rounds reached. This offer has expired.')
            return
        }

        setIsNegVoiceSubmitting(true)
        setError('')

        try {
            const result = await api.assessments.counterNegotiateAudio(
                assessmentId,
                selectedOffer.investorId,
                negotiationRecorder.audioBlob,
                selectedOffer.capital,
                selectedOffer.equity
            )

            // No-speech / too-short guard: if transcription is < 5 words, skip processing.
            const negWordCount = (result.transcription ?? '').trim().split(/\s+/).filter(Boolean).length
            if (negWordCount < 5 && !result.accepted) {
                setError('Recording too short — please record a full counter-offer (at least a few seconds).')
                negotiationRecorder.resetRecording()
                return
            }

            // Walk-away detection disabled per user request to remove hardcoded walkout triggers
            const isWalkAway = false

            if (isWalkAway && !result.accepted) {
                // User wants to walk away — reject this offer
                setWalkedAwayInvestor(selectedOffer.investorName)
                try {
                    await api.assessments.rejectOffer(assessmentId, selectedOffer.offerId || selectedOffer.type)
                    setOffers(offers.filter(o => o.offerId !== selectedOffer.offerId && o.offerId !== selectedOffer.type))
                } catch (e) {
                    console.error('Walk-away reject failed:', e)
                }
                setSelectedOffer(null)
                setNegRound(0)
                setIsFinalOffer(false)
                negotiationRecorder.resetRecording()
                // Clear walk-away message after 3 seconds
                setTimeout(() => setWalkedAwayInvestor(null), 3000)
                return
            }

            const newHistory = [...negHistory, {
                sender: 'You',
                msg: result.transcription,
                type: 'user' as const,
                capital: result.currentCapital ?? selectedOffer.capital,
                equity: result.currentEquity ?? selectedOffer.equity,
            }]

            newHistory.push({
                sender: selectedOffer.investorName,
                msg: result.message,
                type: 'investor',
                capital: result.capital,
                equity: result.equity
            })

            setNegHistory(newHistory)
            setNegRound(nextRound)

            // Play investor audio response — respects the Voice Lines channel mute.
            if (result.audioBase64 && !isVoiceLineMuted()) {
                if (audioRef.current) audioRef.current.pause()
                const audio = new Audio(`data:audio/mp3;base64,${result.audioBase64}`)
                audio.volume = getVoiceLineVolume()
                audioRef.current = audio
                // Never talk over the Grandmaster — let his current line finish first.
                await waitForTurn('investor')
                claimVoiceTurn('investor', audio)
                audio.play().catch(e => console.error("Auto-play failed:", e))
            }

            if (result.accepted) {
                // Use the negotiated terms from the AI response
                const finalCapital = result.capital || selectedOffer.capital
                const finalEquity = result.equity || selectedOffer.equity
                
                setAcceptedDealTerms({
                    capital: finalCapital,
                    equity: finalEquity,
                    investorName: selectedOffer.investorName
                })
                
                // Call backend to persist accepted deal and update revenue/leaderboard
                try {
                    await api.assessments.acceptDeal(assessmentId, selectedOffer.investorId, finalCapital, finalEquity)
                } catch (e) {
                    console.error('Accept deal backend call failed:', e)
                }
                
                setDealFinalized(true)
                setIsFinalOffer(false)
            } else {
                // Update offer with counter-proposed terms
                const updatedOffer = { 
                    ...selectedOffer, 
                    capital: result.capital, 
                    equity: result.equity 
                }
                setSelectedOffer(updatedOffer)

                if (result.isFinal || nextRound >= MAX_NEG_ROUNDS) {
                    // AI made a final "take it or leave it" offer.
                    // Surface Accept / Reject buttons — do NOT auto-reject.
                    setIsFinalOffer(true)
                }
            }

            negotiationRecorder.resetRecording()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to negotiate via voice')
        } finally {
            setIsNegVoiceSubmitting(false)
        }
    }

    // User clicks Accept on the AI's final offer
    const handleAcceptFinalOffer = async () => {
        if (!selectedOffer) return
        const finalCapital = selectedOffer.capital
        const finalEquity = selectedOffer.equity
        setAcceptedDealTerms({ capital: finalCapital, equity: finalEquity, investorName: selectedOffer.investorName })
        try {
            await api.assessments.acceptDeal(assessmentId, selectedOffer.investorId, finalCapital, finalEquity)
        } catch (e) {
            console.error('Accept final deal failed:', e)
        }
        setDealFinalized(true)
        setIsFinalOffer(false)
    }

    // User clicks Reject on the AI's final offer
    const handleRejectFinalOffer = async () => {
        if (!selectedOffer) return
        const investorName = selectedOffer.investorName
        try {
            await api.assessments.rejectOffer(assessmentId, selectedOffer.offerId || selectedOffer.type)
            setOffers(offers.filter(o => o.offerId !== selectedOffer.offerId && o.offerId !== selectedOffer.type))
        } catch (e) {
            console.error('Reject final deal failed:', e)
        }
        setSelectedOffer(null)
        setIsFinalOffer(false)
        setNegRound(0)
        setWalkedAwayInvestor(investorName)
        setTimeout(() => setWalkedAwayInvestor(null), 3000)
    }

    const handleRejectDeal = async () => {
        if (!selectedOffer) return;
        const investorName = selectedOffer.investorName;
        try {
            await api.assessments.rejectOffer(assessmentId as string, selectedOffer.offerId || selectedOffer.type)
            setOffers(offers.filter(o => o.offerId !== selectedOffer.offerId && o.offerId !== selectedOffer.type))
            setSelectedOffer(null)
            setNegRound(0)
            setWalkedAwayInvestor(investorName)
            setTimeout(() => setWalkedAwayInvestor(null), 3000)
        } catch (e) {
            console.error(e)
        }
    }

    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Fix 1: Force dark theme for the entire Chessboard phase
    useEffect(() => {
        document.documentElement.classList.add('dark')
        return () => {
            document.documentElement.classList.remove('dark')
        }
    }, [])

    // Load assessment state and investors — filter to only selected investor IDs
    useEffect(() => {
        const load = async () => {
            try {
                const [state, investorList] = await Promise.all([
                    api.assessments.get(assessmentId),
                    api.config.getInvestors(),
                ])
                setAssessmentState(state)

                // Fix 3: Only show the investors selected for this assessment
                const selectedIds: string[] = (() => {
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const raw = (state as any)?.assessment?.selectedInvestors
                        if (Array.isArray(raw)) return raw
                        if (typeof raw === 'string') return JSON.parse(raw)
                        return []
                    } catch { return [] }
                })()

                // Fix 2: If buyout was chosen, skip Chessboard entirely
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const buyoutChosen = (state as any)?.assessment?.buyoutChosen
                if (buyoutChosen) {
                    router.push(`/assessment/${assessmentId}/final-report`)
                    return
                }

                // Chessboard always faces the full Council (all 7 investors).
                // Older assessments that captured only a 4-investor subset are
                // augmented up to the full list so the chamber renders correctly.
                const FULL_COUNCIL_SIZE = 7
                const filtered = selectedIds.length > 0
                    ? investorList.filter(inv => selectedIds.includes(inv.id))
                    : investorList

                const finalList = filtered.length >= FULL_COUNCIL_SIZE
                    ? filtered
                    : investorList // legacy assessments → show everyone
                setInvestors(finalList)
                setPhase('PITCH')
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to load Chessboard data')
                setPhase('PITCH') // Still show pitch even if load fails
            }
        }
        load()
    }, [assessmentId, router])

    // 15-minute countdown timer
    useEffect(() => {
        if (phase === 'LOADING' || phase === 'COMPLETE') return

        // timer disabled per user request

        const timer = timerRef.current
    return () => {
            if (timer) clearInterval(timer)
        }
    }, [phase, assessmentId, router])

    // Fire confetti when deal is finalized
    useEffect(() => {
        if (dealFinalized) {
            const duration = 3 * 1000
            const animationEnd = Date.now() + duration
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

            const interval: ReturnType<typeof setInterval> = setInterval(function() {
                const timeLeft = animationEnd - Date.now()

                if (timeLeft <= 0) {
                    return clearInterval(interval)
                }

                const particleCount = 50 * (timeLeft / duration)
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                })
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                })
            }, 250)

            return () => clearInterval(interval)
        }
    }, [dealFinalized])

    // ============================================
    // PITCH SUBMISSION (AUDIO)
    // ============================================
    const handleSubmitPitchAudio = async () => {
        if (!pitchRecorder.audioBlob) {
            setError('Please record your pitch before submitting')
            return
        }
        setIsAnalyzing(true)
        setIsSubmitting(true)
        setError('')

        try {
            const result = await api.assessments.submitPitchAudio(assessmentId, pitchRecorder.audioBlob)
            const transcription = displayTranscript(result.analysis.transcription)
            setPitchAnalysis({ ...result.analysis, transcription })
            setPitchText(transcription)
            resetPitchFollowupState()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to analyze pitch')
        } finally {
            setIsAnalyzing(false)
            setIsSubmitting(false)
        }
    }

    // Follow-up flow now lives inside the Investor Q&A phase (see handleSubmitInvestorFollowupAudio).

    // Text fallback handlers removed — war room is voice-only.

    const handleContinueFromPitch = () => {
        resetPitchFollowupState()
        setPhase('INVESTOR_QA')
        setCurrentInvestorIndex(0)
        setPitchAnalysis(null)
    }

    // ============================================
    // INVESTOR RESPONSE (AUDIO) — with one follow-up per investor
    // ============================================
    const handleRespondToInvestorAudio = async () => {
        if (!responseRecorder.audioBlob) {
            setError('Please record your response')
            return
        }

        const investor = investors[currentInvestorIndex]
        if (!investor) return

        setIsAnalyzing(true)
        setIsSubmitting(true)
        setError('')

        const responseBlob = responseRecorder.audioBlob

        try {
            const result = await api.assessments.respondToInvestorAudio(
                assessmentId,
                investor.id,
                responseBlob
            )
            setScorecards(prev => [...prev, result.scorecard])
            const transcription = displayTranscript(result.transcription)
            setResponseTranscription(transcription)
            setInitialTranscription(transcription)
            setResponseSubmitted(true)
            responseRecorder.resetRecording()

            if (result.ttsError) {
                console.warn("TTS Generation Warning:", result.ttsError)
            }

            // Only attempt a follow-up if the initial response actually
            // transcribed to a meaningful answer (≥5 words). A very short
            // transcription (e.g. just "good morning") means the audio was
            // too brief or the model returned a near-empty result — skip the
            // follow-up to avoid building a Q&A cycle on a fabricated base.
            const initialWordCount = transcription.trim().split(/\s+/).filter(Boolean).length
            if (!isNoSpeechTranscript(result.transcription) && initialWordCount >= 5) {
                try {
                    const followup = await api.assessments.generateInvestorFollowupAudio(
                        assessmentId,
                        investor.id,
                        responseBlob
                    )
                    const question = followup.followup_question || followup.followupQuestion
                    if (question) {
                        setFollowupQuestion(question)
                        setFollowupPhase('followup_pending')
                        if (followup.audioBase64 && !isVoiceLineMuted()) {
                            if (audioRef.current) audioRef.current.pause()
                            const audio = new Audio(`data:audio/mp3;base64,${followup.audioBase64}`)
                            audio.volume = getVoiceLineVolume()
                            audioRef.current = audio
                            audio.onplay = () => setIsPlayingAudio(true)
                            audio.onended = () => setIsPlayingAudio(false)
                            audio.onerror = () => setIsPlayingAudio(false)
                            // Never talk over the Grandmaster — let his current line finish first.
                            await waitForTurn('investor')
                            claimVoiceTurn('investor', audio)
                            audio.play().catch(() => setIsPlayingAudio(false))
                        }
                        return
                    }
                } catch (followupErr) {
                    console.warn('[chessboard] follow-up generation failed, skipping', followupErr)
                }
            } else {
                console.warn('[chessboard] empty initial transcription, skipping follow-up')
            }

            // No follow-up — show immediate reaction
            setCurrentInvestorReaction(
                result.scorecard.investorReaction || `${investor.name} has considered your response.`
            )
            if (result.audioBase64 && !isVoiceLineMuted()) {
                if (audioRef.current) audioRef.current.pause()
                const audio = new Audio(`data:audio/mp3;base64,${result.audioBase64}`)
                audio.volume = getVoiceLineVolume()
                audioRef.current = audio
                audio.onplay = () => setIsPlayingAudio(true)
                audio.onended = () => setIsPlayingAudio(false)
                audio.onerror = () => setIsPlayingAudio(false)
                // Never talk over the Grandmaster — let his current line finish first.
                await waitForTurn('investor')
                claimVoiceTurn('investor', audio)
                audio.play().catch(() => setIsPlayingAudio(false))
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to analyze response')
        } finally {
            setIsAnalyzing(false)
            setIsSubmitting(false)
        }
    }

    // Submit response to the investor's follow-up question
    const handleSubmitInvestorFollowupAudio = async () => {
        if (!responseRecorder.audioBlob) {
            setError('Please record your follow-up response')
            return
        }
        const investor = investors[currentInvestorIndex]
        if (!investor || !initialTranscription || !followupQuestion) {
            setError('Follow-up context not ready')
            return
        }

        setIsAnalyzing(true)
        setIsSubmitting(true)
        setError('')

        try {
            const result = await api.assessments.respondToInvestorFinalAudio(
                assessmentId,
                investor.id,
                initialTranscription,
                followupQuestion,
                responseRecorder.audioBlob
            )
            setCurrentInvestorReaction(
                result.scorecard.investorReaction || `${investor.name} has considered your follow-up.`
            )
            setResponseTranscription(displayTranscript(result.transcription))
            setFollowupPhase('followup_answered')
            responseRecorder.resetRecording()
            if (result.audioBase64 && !isVoiceLineMuted()) {
                if (audioRef.current) audioRef.current.pause()
                const audio = new Audio(`data:audio/mp3;base64,${result.audioBase64}`)
                audio.volume = getVoiceLineVolume()
                audioRef.current = audio
                audio.onplay = () => setIsPlayingAudio(true)
                audio.onended = () => setIsPlayingAudio(false)
                audio.onerror = () => setIsPlayingAudio(false)
                // Never talk over the Grandmaster — let his current line finish first.
                await waitForTurn('investor')
                claimVoiceTurn('investor', audio)
                audio.play().catch(() => setIsPlayingAudio(false))
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to submit follow-up response')
        } finally {
            setIsAnalyzing(false)
            setIsSubmitting(false)
        }
    }

    // Move to next investor after viewing reaction
    const handleContinueToNextInvestor = async () => {
        if (audioRef.current) {
            audioRef.current.pause()
            setIsPlayingAudio(false)
        }
        setCurrentInvestorReaction('')
        setFollowupPhase('initial')
        setFollowupQuestion('')
        setInitialTranscription('')
        if (currentInvestorIndex < investors.length - 1) {
            setCurrentInvestorIndex(prev => prev + 1)
            setResponseSubmitted(false)
            setResponseTranscription('')
        } else {
            try {
                const fetchedOffers = await api.assessments.getChessboardOffers(assessmentId)
                setOffers(fetchedOffers)
            } catch (err) {
                console.error("Failed to fetch offers", err)
            }
            setPhase('DEAL_RESULTS')
        }
    }

    // ============================================
    // END SIMULATION
    // ============================================
    const handleEndSimulation = async () => {
        if (timerRef.current) clearInterval(timerRef.current)
        try {
            await api.assessments.walkout(assessmentId as string)
        } catch (e) {
            console.error("Error completing simulation:", e)
        }
        router.push(`/assessment/${assessmentId}/final-report`)
    }

    // Normal-completion path — deal accepted or all offers declined. Plays a
    // brief cinematic fade, then goes straight to the evaluation report (the
    // verdict ceremony page has been removed).
    const handleCompleteToVerdict = useCallback(async () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setShowVerdictExit(true)
        // Fire walkout in the background — same backend contract as End Simulation,
        // but the page won't wait on it before navigating.
        try {
            await api.assessments.walkout(assessmentId as string)
        } catch (e) {
            console.error('Error finalising simulation:', e)
        }
        // Hold the fade briefly so the chamber settles before the report mounts.
        window.setTimeout(() => {
            router.push(`/assessment/${assessmentId}/final-report`)
        }, 900)
    }, [assessmentId, router])

    const currentInvestor = investors[currentInvestorIndex]
    const preparedPitch = getPreparedPitchFromState(assessmentState)

    // Use the investor's voice filename directly so each question resolves to the
    // correct speaker clip instead of a question-index placeholder.
    const currentInvestorVoiceKey = normalizeVoiceSlug(currentInvestor?.name || '')
    const currentInvestorAudioKeys = [
        currentInvestorVoiceKey,
        currentInvestor?.id,
    ].filter(Boolean)

    useEffect(() => {
        if (preparedPitch && !pitchText) {
            setPitchText(preparedPitch)
        }
    }, [preparedPitch, pitchText])

    const resetPitchFollowupState = useCallback(() => {
        setFollowupPhase('initial')
        setFollowupQuestion('')
        setInitialTranscription('')
        setCurrentInvestorReaction('')
        setResponseTranscription('')
        setResponseSubmitted(false)
        responseRecorder.resetRecording()
    }, [responseRecorder])

    // Auto-play investor question
    useEffect(() => {
        if (phase === 'INVESTOR_QA' && currentInvestor && !currentInvestorReaction && !isAnalyzing && !responseRecorder.isRecording) {
            const questionKey = currentInvestorVoiceKey || currentInvestor.id
            if (!hasAutoPlayed[questionKey]) {
                const timeout = setTimeout(() => {
                    const audioButton = document.querySelector('.investor-question button[title="Listen"]') as HTMLButtonElement
                    if (audioButton && !audioButton.disabled) {
                        audioButton.click()
                        setHasAutoPlayed(prev => ({ ...prev, [questionKey]: true }))
                    }
                }, 800)
                return () => clearTimeout(timeout)
            }
        }
    }, [phase, currentInvestor, currentInvestorVoiceKey, currentInvestorReaction, isAnalyzing, responseRecorder.isRecording, hasAutoPlayed])

    // ============================================
    // RENDER
    // ============================================
    // Chamber-derived signals — derived from existing booleans without
    // introducing a new state machine. Each cinematic component upstream
    // consumes these as plain props.
    const feedbackSentiment = useFeedbackSentiment(currentInvestorReaction || '')
    const councilMoods = useCouncilMoods({
        scorecards,
        activeInvestorId: currentInvestor?.id ?? null,
        activeInvestorSentiment: feedbackSentiment.label,
    })

    // Map Chessboard phase → ambient audio scene. Empty (null) while the entrance
    // is still playing so we don't fight the door-video atmospherics.
    const ambientScene = useMemo<AmbientScene>(() => {
        if (showEntrance) return null
        if (phase === 'LOADING') return 'chessboard-lobby'
        if (phase === 'INVESTOR_QA') return isAnalyzing ? 'chessboard-deliberation' : 'chessboard-active'
        if (phase === 'PITCH') return 'chessboard-active'
        if (phase === 'DEAL_RESULTS') return 'chessboard-deliberation'
        return null
    }, [showEntrance, phase, isAnalyzing])

    return (
        <div className="chessboard-page chessboard-shell">
            {/* Side wave accents */}
            <div className="chessboard-wave-left" aria-hidden />
            <div className="chessboard-wave-right" aria-hidden />

            <AnimatePresence>
                {showEntrance && (
                    <ChessboardEntrance
                        key="entrance"
                        onComplete={() => setShowEntrance(false)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showVerdictExit && (
                    <motion.div
                        key="verdict-exit"
                        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        aria-live="polite"
                    >
                        <div className="flex flex-col items-center gap-3 text-center">
                            <span
                                aria-hidden
                                className="font-display text-3xl text-[color:var(--color-chessboard-gold)] opacity-80"
                            >
                                ⚜
                            </span>
                            <p className="font-display text-xs uppercase tracking-[0.32em] text-[color:var(--color-chessboard-gold)]/85">
                                The council retires to deliberate
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AmbientAudioManager scene={ambientScene} />
            <MicPermissionDialog
                open={mic.needsPrompt && phase !== 'LOADING' && !showEntrance}
                onAllow={() => mic.grant()}
                onUseText={() => mic.grant()}
                hideTextOption
            />
            {/* Top Bar */}
            <header className="chessboard-header">
                <div className="header-left">
                    <h1 className="chessboard-title">Chessboard</h1>
                    <span className="chessboard-subtitle">Live Investor Pitch Simulation</span>
                </div>
                <div className="header-center">
                    {/* timer removed */}
                </div>
                <div className="header-right">
                    <AudioControls />
                    <button className="end-btn" onClick={handleEndSimulation}>
                        End Simulation
                    </button>
                </div>
            </header>

            <main className="chessboard-main">
                {/* ============================================ */}
                {/* LOADING */}
                {/* ============================================ */}
                {phase === 'LOADING' && (
                    <motion.div
                        className="loading-container"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            className="loading-icon"
                            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >WR</motion.div>
                        <motion.h2
                            className="loading-text"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >ENTERING WAR ROOM</motion.h2>
                        <motion.p
                            className="loading-sub"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >Assembling Investor Panel...</motion.p>
                        <div className="loading-bar">
                            <div className="loading-bar-fill" />
                        </div>
                    </motion.div>
                )}

                {/* ============================================ */}
                {/* PITCH PHASE — AUDIO RECORDING */}
                {/* ============================================ */}
                {phase === 'PITCH' && (
                    <motion.div
                        className="pitch-phase"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div className="phase-badge" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }}>PHASE 1 — YOUR PITCH</motion.div>
                        <motion.h2 className="phase-title" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                            Record Your 1-Minute Chessboard Pitch
                        </motion.h2>
                        <motion.p className="phase-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                            You are standing before the investor panel. Tap the microphone and deliver your pitch out loud.
                            You have <strong>60 seconds</strong> to make your case.
                        </motion.p>

                        {/* Pitch Template - Collapsible */}
                        <motion.details className="pitch-template" open={!!preparedPitch} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            <summary className="pitch-template-summary">{preparedPitch ? 'Your prepared Chessboard pitch' : 'Pitch Template Guide (tap to expand)'}</summary>
                            <div className="template-text" style={{ marginTop: '0.8rem' }}>
                                {preparedPitch ? (
                                    <>
                                        <p className="template-helper-label">Using your saved Chessboard prep pitch:</p>
                                        <pre className="template-user-pitch" style={{ whiteSpace: 'pre-wrap' }}>{preparedPitch}</pre>
                                    </>
                                ) : (
                                    <>
                                        <p>Hello Sharks, my name is <strong>[NAME]</strong> and I am the founder of <strong>[BUSINESS]</strong>.</p>
                                        <p><em>(The Problem)</em> Today, [TARGET CUSTOMER] struggles with [PROBLEM].</p>
                                        <p><em>(The Solution)</em> I created [PRODUCT], which [VALUE PROP].</p>
                                        <p><em>(Why Different)</em> Unlike [COMPETITORS], we [DIFFERENTIATION].</p>
                                        <p><em>(Proof)</em> We validated this by [VALIDATION]. So far, [TRACTION].</p>
                                        <p><em>(The Ask)</em> We are raising $[AMOUNT] for [EQUITY]% equity.</p>
                                    </>
                                )}
                            </div>
                        </motion.details>

                        {/* Recording UI */}
                        {!pitchAnalysis && !isAnalyzing && (
                            <motion.div className="recording-zone" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                <div className={`mic-button-wrapper ${pitchRecorder.isRecording ? 'recording' : ''}`}>
                                    {pitchRecorder.isRecording && (
                                        <>
                                            <div className="pulse-ring ring-1" />
                                            <div className="pulse-ring ring-2" />
                                            <div className="pulse-ring ring-3" />
                                        </>
                                    )}
                                    <motion.button
                                        {...pitchRecordIntro}
                                        className={`mic-button ${pitchRecorder.isRecording ? 'active' : ''} ${pitchRecorder.audioBlob ? 'done' : ''}`}
                                        onClick={pitchRecorder.isRecording ? pitchRecorder.stopRecording : pitchRecorder.startRecording}
                                        disabled={pitchRecorder.isStarting}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {pitchRecorder.isStarting ? 'Connecting Mic...' : pitchRecorder.isRecording ? 'Stop Recording' : pitchRecorder.audioBlob ? 'Record Again' : 'Start Recording'}
                                    </motion.button>
                                </div>

                                <div className="recording-status">
                                    {pitchRecorder.isRecording ? (
                                        <>
                                            <span className="rec-dot" />
                                            <span className="rec-text">Recording... {Math.max(0, 60 - pitchRecorder.recordingTime)}s left</span>
                                        </>
                                    ) : pitchRecorder.audioBlob ? (
                                        <span className="rec-done">Pitch recorded ({pitchRecorder.recordingTime}s) — Select Record Again to re-record</span>
                                    ) : pitchRecorder.error ? (
                                        <span className="rec-hint" style={{ color: '#f87171' }}>{pitchRecorder.error}</span>
                                    ) : (
                                        <span className="rec-hint">Select Start Recording to begin your pitch</span>
                                    )}
                                </div>

                                {/* Countdown bar */}
                                {pitchRecorder.isRecording && (
                                    <div className="countdown-bar">
                                        <div className="countdown-fill" style={{ width: `${Math.max(0, ((60 - pitchRecorder.recordingTime) / 60) * 100)}%` }} />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Analyzing state */}
                        {isAnalyzing && (
                            <motion.div className="analyzing-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="analyzing-spinner" />
                                <h3>Analyzing Your Pitch...</h3>
                                <p>Our AI panel is reviewing your delivery, content, and persuasiveness.</p>
                            </motion.div>
                        )}

                        {/* Pitch Analysis Results */}
                        {pitchAnalysis && (
                            <motion.div className="analysis-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <h3 className="analysis-title">Pitch Analysis</h3>
                                <div className="analysis-scores">
                                    <div className="score-item"><span className="score-label">Clarity</span><span className="score-value">{pitchAnalysis.clarity}/5</span></div>
                                    <div className="score-item"><span className="score-label">Confidence</span><span className="score-value">{pitchAnalysis.confidence}/5</span></div>
                                    <div className="score-item"><span className="score-label">Persuasion</span><span className="score-value">{pitchAnalysis.persuasion}/5</span></div>
                                </div>
                                {pitchAnalysis.transcription && (
                                    <div className="analysis-transcript">
                                        <span className="analysis-label">What you said:</span>
                                        <p>{pitchAnalysis.transcription}</p>
                                    </div>
                                )}
                                
                                {pitchAnalysis.strengths?.length > 0 && (
                                    <div className="analysis-list strengths">
                                        <span className="analysis-label">Strengths:</span>
                                        <ul>{pitchAnalysis.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                )}
                                {pitchAnalysis.weaknesses?.length > 0 && (
                                    <div className="analysis-list weaknesses">
                                        <span className="analysis-label">Areas to Improve:</span>
                                        <ul>{pitchAnalysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                                    </div>
                                )}

                                {/* INVESTOR REACTION TO PITCH */}
                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    <h4 style={{ color: '#60a5fa', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{investors[0]?.name || 'Lead Investor'} Reaction:</h4>
                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>"{pitchAnalysis.feedback}"</p>
                                </div>

                                {/* Pitch follow-up block removed — follow-ups now live in the Investor Q&A phase. */}

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <motion.button 
                                        className="submit-pitch-btn" 
                                        style={{ flex: 1, backgroundColor: 'color-mix(in srgb, var(--color-chessboard-parchment) 10%, transparent)', color: 'var(--color-chessboard-parchment)', border: '1px solid color-mix(in srgb, var(--color-chessboard-parchment) 22%, transparent)' }}
                                        onClick={() => {
                                            setPitchAnalysis(null);
                                            resetPitchFollowupState();
                                            pitchRecorder.resetRecording();
                                            setError('');
                                        }}
                                        whileHover={{ scale: 1.03 }} 
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        Retry Pitch
                                    </motion.button>
                                    <motion.button
                                        className="submit-pitch-btn"
                                        style={{ flex: 2 }}
                                        onClick={handleContinueFromPitch}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        {error ? 'Skip to Investor Q&A →' : 'Continue to Investor Questions'}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {error && <div className="error-msg">{error}</div>}

                        {!pitchAnalysis && !isAnalyzing && pitchRecorder.audioBlob && (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <motion.button
                                    className="submit-pitch-btn"
                                    style={{ flex: 1 }}
                                    onClick={handleSubmitPitchAudio}
                                    disabled={isSubmitting || isAnalyzing}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {isSubmitting || isAnalyzing ? 'Analyzing Pitch...' : 'Submit Pitch for Analysis'}
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ============================================ */}
                {/* INVESTOR Q&A PHASE — AUDIO RECORDING */}
                {/* ============================================ */}
                {phase === 'INVESTOR_QA' && currentInvestor && (
                    <motion.div className="investor-qa-phase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <motion.div className="phase-badge" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>PHASE 2 — INVESTOR QUESTIONS</motion.div>
                        <div className="investor-counter">Investor {currentInvestorIndex + 1} of {investors.length}</div>

                        {/* Chamber: active investor (left) · conversation (center) · roster (right) */}
                        <CouncilChamberLayout
                            className="mt-4 px-0"
                            activeInvestor={
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentInvestor.id || currentInvestorIndex}
                                        initial={{ x: 60, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -60, opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="h-full"
                                    >
                                        <ActiveInvestor
                                            investor={currentInvestor}
                                            isSpeaking={isPlayingAudio}
                                            isAnswering={responseRecorder.isRecording}
                                            isReacting={isAnalyzing}
                                            sentiment={feedbackSentiment.label}
                                            className="h-full"
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            }
                            roster={
                                <CouncilRoster
                                    investors={investors}
                                    activeInvestorId={currentInvestor?.id ?? null}
                                    moods={councilMoods}
                                />
                            }
                            conversation={
                                <ConversationZone
                                    overlay={
                                        isAnalyzing ? (
                                            <CouncilDeliberatesLoader
                                                message={`${currentInvestor.name} weighs your words…`}
                                            />
                                        ) : undefined
                                    }
                                    question={
                                        <motion.div className="investor-question" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                                            <div className="flex items-center justify-between">
                                                <span className="question-label">{currentInvestor.name} asks:</span>
                                                <QuestionAudioPlayer audioKeys={currentInvestorAudioKeys} />
                                            </div>
                                            <p className="question-text">{currentInvestor.signature_question}</p>
                                        </motion.div>
                                    }
                                />
                            }
                        />

                        {/*
                          The chamber above is purely the visual frame —
                          portrait (left), question + deliberation overlay (center),
                          roster (right). The recording UI and reaction
                          rendering below remain full-width to preserve
                          the existing affordances and accessibility.
                          Every handler, ref, and state below is unchanged
                          from the pre-chamber implementation.
                        */}
                        <div className="mx-auto max-w-3xl mt-6 px-2 sm:px-0">

                        {/* Follow-up Section */}
                        <AnimatePresence>
                        {followupPhase === 'followup_pending' && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="analysis-transcript" style={{ marginBottom: '1rem', marginTop: '1rem' }}>
                                    <span className="analysis-label">Your initial response:</span>
                                    <p>{initialTranscription}</p>
                                </div>
                                <div className="investor-question followup-question" style={{ borderColor: '#f59e0b', backgroundColor: '#fdfbeb11' }}>
                                    <span className="question-label" style={{ color: '#f59e0b' }}>
                                        Follow-up Question:
                                        {isPlayingAudio && <span style={{ marginLeft: '10px', fontSize: '0.85em', fontWeight: 'normal' }}>Playing...</span>}
                                    </span>
                                    <p className="question-text">{followupQuestion}</p>
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>

                        {/* Investor Reaction (after response) */}
                        <AnimatePresence>
                        {currentInvestorReaction && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                {responseTranscription && (
                                    <div className="analysis-transcript" style={{ marginBottom: '1rem' }}>
                                        <span className="analysis-label">What you said:</span>
                                        <p>{responseTranscription}</p>
                                    </div>
                                )}
                                <div className="investor-reaction">
                                    <span className="reaction-label">
                                        {currentInvestor.name} responds:
                                        {isPlayingAudio && <span style={{ marginLeft: '10px', fontSize: '0.85em', color: '#10b981', fontWeight: 'normal' }}>Playing...</span>}
                                    </span>
                                    <p>{currentInvestorReaction}</p>
                                </div>
                                {/*
                                  One scored response per investor — the backend writes a
                                  scorecard on every submit, so there is no "retry" once the
                                  Council has answered. The old Retry button cleared the
                                  reaction but left `responseSubmitted` true, which stranded
                                  the player: the mic was locked as "Response Submitted" and
                                  the only way forward (this button) had just been unmounted.
                                  Re-recording lives before submission — Record Again /
                                  Discard Recording.
                                */}
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <motion.button
                                        className="respond-btn"
                                        style={{ flex: 1 }}
                                        onClick={handleContinueToNextInvestor}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        {currentInvestorIndex < investors.length - 1 ? `Continue to Next Investor` : `View Panel Decisions`}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>

                        {/* Audio Recording for Response */}
                        {!currentInvestorReaction && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                                {isAnalyzing ? (
                                    <div className="recording-zone" style={{ marginBottom: '1rem', minHeight: '220px' }}>
                                        <CouncilDeliberatesLoader
                                            message={followupPhase === 'followup_pending' ? `${currentInvestor.name} weighs your follow-up…` : `${currentInvestor.name} weighs your words…`}
                                        />
                                    </div>
                                ) : (
                                <>
                                <div className="recording-zone" style={{ marginBottom: '1rem' }}>
                                    <div className={`mic-button-wrapper ${responseRecorder.isRecording ? 'recording' : ''}`}>
                                        {responseRecorder.isRecording && (
                                            <>
                                                <div className="pulse-ring ring-1" />
                                                <div className="pulse-ring ring-2" />
                                                <div className="pulse-ring ring-3" />
                                            </>
                                        )}
                                         <motion.button
                                             {...investorMicIntro}
                                             className={`mic-button ${responseRecorder.isRecording ? 'active' : ''} ${responseRecorder.audioBlob ? 'done' : ''}`}
                                             onClick={responseRecorder.isRecording ? responseRecorder.stopRecording : responseRecorder.startRecording}
                                             disabled={(responseSubmitted && followupPhase !== 'followup_pending') || isSubmitting || isAnalyzing || responseRecorder.isStarting}
                                             whileHover={{ scale: 1.05 }}
                                             whileTap={{ scale: 0.95 }}
                                         >
                                             {responseRecorder.isStarting
                                                 ? 'Connecting Mic...'
                                                 : responseSubmitted && followupPhase !== 'followup_pending'
                                                 ? 'Response Submitted'
                                                 : responseRecorder.isRecording
                                                     ? 'Stop Recording'
                                                     : responseRecorder.audioBlob
                                                         ? 'Record Again'
                                                         : followupPhase === 'followup_pending'
                                                             ? 'Record Follow-up'
                                                             : 'Start Recording'}
                                         </motion.button>
                                    </div>
                                    <div className="recording-status">
                                        {responseSubmitted && followupPhase !== 'followup_pending' ? (
                                            <span className="rec-done">Response submitted. You cannot submit another response for this investor.</span>
                                        ) : responseRecorder.isRecording ? (
                                            <><span className="rec-dot" /><span className="rec-text">Recording... {Math.max(0, 15 - responseRecorder.recordingTime)}s left</span></>
                                        ) : responseRecorder.audioBlob ? (
                                            <span className="rec-done">Response recorded ({responseRecorder.recordingTime}s)</span>
                                        ) : responseRecorder.error ? (
                                            <span className="rec-hint" style={{ color: '#f87171' }}>{responseRecorder.error}</span>
                                        ) : (
                                            <span className="rec-hint">Select Start Recording to record your response (15s max)</span>
                                        )}
                                    </div>
                                    {responseRecorder.isRecording && (
                                        <div className="countdown-bar"><div className="countdown-fill" style={{ width: `${Math.max(0, ((15 - responseRecorder.recordingTime) / 15) * 100)}%` }} /></div>
                                    )}
                                </div>

                                {/*
                                  Escape hatch. This branch means the response is already
                                  scored (mic locked) but no reaction is on screen — e.g. the
                                  reaction/TTS leg failed after the scorecard was written.
                                  The player must always have a way forward to the next
                                  investor rather than a dead-ended chamber.
                                */}
                                {responseSubmitted && followupPhase !== 'followup_pending' && (
                                    <div style={{ display: 'flex', marginTop: '1rem' }}>
                                        <motion.button
                                            className="respond-btn"
                                            style={{ flex: 1 }}
                                            onClick={handleContinueToNextInvestor}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            {currentInvestorIndex < investors.length - 1 ? 'Continue to Next Investor' : 'View Panel Decisions'}
                                        </motion.button>
                                    </div>
                                )}

                                {error && (
                                    <div className="error-msg" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <span>{error}</span>
                                        {/* If the user is stranded in follow-up state with broken context, give them an exit */}
                                        {error === 'Follow-up context not ready' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setError('')
                                                    setFollowupPhase('initial')
                                                    setFollowupQuestion('')
                                                    setInitialTranscription('')
                                                    setResponseSubmitted(false)
                                                    setResponseTranscription('')
                                                    setCurrentInvestorReaction('')
                                                    responseRecorder.resetRecording()
                                                }}
                                                style={{
                                                    alignSelf: 'flex-start',
                                                    padding: '0.4rem 0.85rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(201,162,39,0.5)',
                                                    background: 'rgba(201,162,39,0.12)',
                                                    color: '#c8a84a',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Reset and re-record initial response
                                            </button>
                                        )}
                                    </div>
                                )}

                                {responseRecorder.audioBlob && (followupPhase === 'followup_pending' || !responseSubmitted) && (
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <motion.button
                                            className="respond-btn"
                                            style={{ flex: 1, backgroundColor: 'color-mix(in srgb, var(--color-chessboard-parchment) 10%, transparent)', color: 'var(--color-chessboard-parchment)', border: '1px solid color-mix(in srgb, var(--color-chessboard-parchment) 22%, transparent)' }}
                                            onClick={() => responseRecorder.resetRecording()}
                                            disabled={isSubmitting || isAnalyzing}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            Discard Recording
                                        </motion.button>
                                        <motion.button
                                            className="respond-btn"
                                            style={{ flex: 2 }}
                                            onClick={followupPhase === 'followup_pending' ? handleSubmitInvestorFollowupAudio : handleRespondToInvestorAudio}
                                            disabled={isSubmitting || isAnalyzing}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            {isSubmitting || isAnalyzing
                                                ? 'Analyzing Response...'
                                                : followupPhase === 'followup_pending'
                                                    ? 'Submit Follow-up'
                                                    : 'Submit Response'}
                                        </motion.button>
                                    </div>
                                )}
                                </>
                                )}
                            </motion.div>
                        )}

                        {/*
                          Analyzing-state UI lives as the chamber's overlay
                          (<CouncilDeliberatesLoader />). Removed here to avoid
                          two competing "deliberating" indicators.
                        */}
                        </div>
                    </motion.div>
                )}

                {/* ============================================ */}
                {/* DEAL RESULTS / NEGOTIATION */}
                {/* ============================================ */}
                {phase === 'DEAL_RESULTS' && (
                    <motion.div
                        className="deal-results-phase"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            className="phase-badge"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring' }}
                        >PHASE 3 — INVESTOR OFFERS</motion.div>
                        <motion.h2
                            className="phase-title"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {dealFinalized ? "Deal Finalized!" : selectedOffer ? "Negotiation Room" : "Investor Panel Results"}
                        </motion.h2>

                        {!selectedOffer && !dealFinalized && (
                            <div className="scorecards-grid">
                                {offers.map((offer, i) => (
                                    <motion.div
                                        key={i}
                                        {...(i === 0 ? offerIntro : {})}
                                        className="offer-card"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.15, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                                        onClick={() => handleSelectOffer(offer)}
                                    >
                                        {/* Photo on top */}
                                        <div className="offer-portrait">
                                            <span className="offer-portrait-fallback" aria-hidden>{offer.investorName?.charAt(0) ?? '?'}</span>
                                            {offer.investorId && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={investorPortraitSrc({ id: offer.investorId })}
                                                    alt={offer.investorName}
                                                    loading="lazy"
                                                    decoding="async"
                                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                                                />
                                            )}
                                            <span className="offer-tag">Offer Received</span>
                                        </div>
                                        {/* Offer below */}
                                        <div className="offer-body">
                                            <h3 className="offer-name">{offer.investorName}</h3>
                                            <div className="offer-deal">
                                                <span>${(offer.capital || 0).toLocaleString()}</span>
                                                <span>{offer.equity}% equity</span>
                                            </div>
                                            <div className="offer-quote">
                                                <p>&ldquo;{offer.message}&rdquo;</p>
                                            </div>
                                            <div className="offer-cta">Click to Negotiate →</div>
                                        </div>
                                    </motion.div>
                                ))}
                                {offers.length === 0 && (
                                    <div className="no-scorecards">
                                        <p>No investor offers available.</p>
                                    </div>
                                )}
                            </div>
                        )}

                         {selectedOffer && !dealFinalized && (
                            <motion.div
                                className="negotiation-room"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="neg-header" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3>Negotiating with {selectedOffer.investorName}</h3>
                                        <div style={{
                                            padding: '0.3rem 0.8rem',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            letterSpacing: '1px',
                                            background: isFinalOffer ? 'rgba(239, 68, 68, 0.2)' : negRound >= MAX_NEG_ROUNDS - 1 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                            color: isFinalOffer ? '#fca5a5' : negRound >= MAX_NEG_ROUNDS - 1 ? '#ef4444' : '#60a5fa',
                                            border: `1px solid ${isFinalOffer ? 'rgba(239,68,68,0.5)' : negRound >= MAX_NEG_ROUNDS - 1 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                                        }}>
                                            {isFinalOffer ? 'FINAL OFFER' : `ROUND ${Math.min(negRound + 1, MAX_NEG_ROUNDS)} / ${MAX_NEG_ROUNDS}`}
                                        </div>
                                    </div>
                                    <p>Current Offer: ${selectedOffer.capital.toLocaleString()} for {selectedOffer.equity}%</p>
                                </div>

                                <div className="neg-history" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {negHistory.map((item, idx) => (
                                        <div key={idx} style={{ 
                                            padding: '1rem', 
                                            borderRadius: '12px', 
                                            background: item.type === 'user' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            alignSelf: item.type === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '80%'
                                        }}>
                                            <strong style={{ display: 'block', marginBottom: '0.3rem', color: item.type === 'user' ? 'color-mix(in srgb, #60a5fa 60%, var(--color-chessboard-parchment))' : 'color-mix(in srgb, #34d399 60%, var(--color-chessboard-parchment))' }}>{item.sender}</strong>
                                            <span style={{ color: 'var(--color-chessboard-parchment)' }}>{item.msg}</span>
                                            {item.capital != null && item.equity != null && (
                                                <div style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: 'color-mix(in srgb, var(--color-chessboard-parchment) 65%, transparent)' }}>
                                                    Terms: ${item.capital.toLocaleString()} for {item.equity}% equity
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* ── Final Offer Panel ── shown after AI makes take-it-or-leave-it */}
                                {isFinalOffer ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            padding: '1.5rem',
                                            borderRadius: '14px',
                                            background: 'rgba(239,68,68,0.08)',
                                            border: '1px solid rgba(239,68,68,0.35)',
                                            marginBottom: '1rem',
                                        }}
                                    >
                                        <p style={{ color: 'color-mix(in srgb, #f87171 65%, var(--color-chessboard-parchment))', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>⚠ Final Offer — Take It or Leave It</p>
                                        <p style={{ color: 'color-mix(in srgb, var(--color-chessboard-parchment) 75%, transparent)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                                            <strong style={{ color: 'var(--color-chessboard-parchment)' }}>${selectedOffer.capital.toLocaleString()}</strong> for{' '}
                                            <strong style={{ color: 'var(--color-chessboard-parchment)' }}>{selectedOffer.equity}%</strong> equity
                                        </p>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <motion.button
                                                className="respond-btn"
                                                style={{ flex: 1, background: 'rgba(255,255,255,0.07)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }}
                                                onClick={handleRejectFinalOffer}
                                                disabled={isNegVoiceSubmitting}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                Walk Away
                                            </motion.button>
                                            <motion.button
                                                className="respond-btn"
                                                style={{ flex: 2, background: '#16a34a', color: '#fff', border: 'none' }}
                                                onClick={handleAcceptFinalOffer}
                                                disabled={isNegVoiceSubmitting}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                ✓ Accept This Deal
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ) : (
                                <>
                                {/* Voice instruction banner */}
                                {negRound < MAX_NEG_ROUNDS && (
                                    <div style={{
                                        padding: '0.8rem 1.2rem',
                                        borderRadius: '12px',
                                        marginBottom: '1rem',
                                        background: negRound >= MAX_NEG_ROUNDS - 1
                                            ? 'rgba(239, 68, 68, 0.08)'
                                            : 'rgba(59, 130, 246, 0.08)',
                                        border: `1px solid ${negRound >= MAX_NEG_ROUNDS - 1 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
                                    }}>
                                        {negRound >= MAX_NEG_ROUNDS - 1 ? (
                                            <p style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 600, margin: 0 }}>
                                                <strong>Final Round!</strong> Say <em>&ldquo;I accept this deal&rdquo;</em> to secure it, or make your best counter-offer.
                                            </p>
                                        ) : (
                                            <p style={{ fontSize: '0.85rem', color: 'color-mix(in srgb, #60a5fa 55%, var(--color-chessboard-parchment))', margin: 0 }}>
                                                Speak your counter-offer, or say <em>&ldquo;I accept&rdquo;</em> / <em>&ldquo;deal&rdquo;</em> to finalize.
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="neg-controls" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem', width: '100%' }}>
                                    <div className="recording-zone" style={{ padding: '1rem', border: '1px dashed color-mix(in srgb, var(--color-chessboard-parchment) 15%, transparent)', borderRadius: '12px', background: 'color-mix(in srgb, var(--color-chessboard-parchment) 3%, transparent)' }}>
                                        <p className="rec-hint" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                                            {negRound >= MAX_NEG_ROUNDS - 1
                                                ? 'Final round — say "I accept this deal" or make your last counter-offer'
                                                : 'Speak your counter offer (e.g., "I\'d like $1.2M for 25% equity because...")'
                                            }
                                        </p>

                                        <div className={`mic-button-wrapper ${negotiationRecorder.isRecording ? 'recording' : ''}`}>
                                            {negotiationRecorder.isRecording && (
                                                <>
                                                    <div className="pulse-ring ring-1" />
                                                    <div className="pulse-ring ring-2" />
                                                    <div className="pulse-ring ring-3" />
                                                </>
                                            )}
                                            <motion.button
                                                className={`mic-button ${negotiationRecorder.isRecording ? 'active' : ''} ${negotiationRecorder.audioBlob ? 'done' : ''}`}
                                                onClick={negotiationRecorder.isRecording ? negotiationRecorder.stopRecording : negotiationRecorder.startRecording}
                                                disabled={isNegVoiceSubmitting || negRound >= MAX_NEG_ROUNDS || negotiationRecorder.isStarting}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {negotiationRecorder.isStarting ? 'Connecting Mic...' : negotiationRecorder.isRecording ? 'Stop Recording' : negotiationRecorder.audioBlob ? 'Record Again' : 'Start Recording'}
                                            </motion.button>
                                        </div>

                                        {negotiationRecorder.isRecording ? (
                                            <div className="recording-status">
                                                <div className="rec-dot" />
                                                <span className="rec-text">RECORDING... {Math.max(0, 15 - negotiationRecorder.recordingTime)}s</span>
                                            </div>
                                        ) : negotiationRecorder.audioBlob ? (
                                            <div className="recording-status">
                                                <span className="rec-done">Response recorded ({negotiationRecorder.recordingTime}s)</span>
                                            </div>
                                        ) : negRound >= MAX_NEG_ROUNDS ? (
                                            <div className="recording-status">
                                                <span style={{ color: '#f87171', fontSize: '0.85rem' }}>All rounds exhausted — offer expired</span>
                                            </div>
                                        ) : negotiationRecorder.error ? (
                                            <div className="recording-status">
                                                <span className="rec-hint" style={{ color: '#f87171' }}>{negotiationRecorder.error}</span>
                                            </div>
                                        ) : (
                                            <div className="recording-status">
                                                <span className="rec-hint">Select Start Recording to record your response (15s max)</span>
                                            </div>
                                        )}

                                        {negotiationRecorder.isRecording && (
                                            <div className="countdown-bar">
                                                <div className="countdown-fill" style={{ width: `${Math.max(0, ((15 - negotiationRecorder.recordingTime) / 15) * 100)}%` }} />
                                            </div>
                                        )}

                                        {error && (
                                            <div className="error-msg" style={{ marginTop: '1rem', color: '#f87171' }}>{error}</div>
                                        )}

                                        {negotiationRecorder.audioBlob && !negotiationRecorder.isRecording && negRound < MAX_NEG_ROUNDS && (
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                                <motion.button 
                                                    className="respond-btn" 
                                                    style={{ flex: 1, background: 'color-mix(in srgb, var(--color-chessboard-parchment) 10%, transparent)', color: 'var(--color-chessboard-parchment)', border: '1px solid color-mix(in srgb, var(--color-chessboard-parchment) 22%, transparent)' }}
                                                    onClick={() => negotiationRecorder.resetRecording()} 
                                                    disabled={isNegVoiceSubmitting}
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    whileHover={{ scale: 1.02 }} 
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    Discard Recording
                                                </motion.button>
                                                <motion.button 
                                                    className="respond-btn" 
                                                    style={{ flex: 2, background: negRound >= MAX_NEG_ROUNDS - 1 ? '#b03030' : '#c8a84a' }}
                                                    onClick={handleNegotiateAudio} 
                                                    disabled={isNegVoiceSubmitting}
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    whileHover={{ scale: 1.02 }} 
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    {isNegVoiceSubmitting ? 'Analyzing...' : negRound >= MAX_NEG_ROUNDS - 1 ? 'Submit Final Counter' : 'Submit Voice Counter'}
                                                </motion.button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Walk Away Button */}
                                    <motion.button
                                        className="respond-btn"
                                        style={{ 
                                            background: 'transparent', 
                                            border: '1px solid rgba(239,68,68,0.4)', 
                                            color: '#f87171',
                                            fontSize: '0.85rem',
                                            padding: '0.6rem 1.2rem',
                                        }}
                                        onClick={handleRejectDeal}
                                        disabled={isNegVoiceSubmitting}
                                        whileHover={{ scale: 1.02, borderColor: 'rgba(239,68,68,0.8)' }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Walk Away from This Offer
                                    </motion.button>
                                </div>
                                </>)}
                            </motion.div>
                        )}

                        {walkedAwayInvestor && !dealFinalized && !selectedOffer && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{ textAlign: 'center', padding: '2rem', background: 'rgba(239,68,68,0.1)', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '1.5rem' }}
                            >
                                <h3 style={{ fontSize: '1.5rem', color: '#f87171', marginBottom: '0.5rem' }}>Walked Away</h3>
                                <p style={{ color: 'color-mix(in srgb, #f87171 65%, var(--color-chessboard-parchment))', fontSize: '1rem' }}>You walked away from <strong>{walkedAwayInvestor}</strong>&apos;s offer.</p>
                                <p style={{ color: 'color-mix(in srgb, var(--color-chessboard-parchment) 60%, transparent)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Select another offer to continue negotiating, or walk away from all offers.</p>
                            </motion.div>
                        )}

                        {dealFinalized && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ textAlign: 'center', padding: '3rem', background: 'rgba(16,185,129,0.1)', borderRadius: '16px', border: '1px solid #10b981', position: 'relative', overflow: 'hidden' }}
                            >
                                <h2 style={{ fontSize: '2.5rem', color: '#10b981', marginBottom: '1.5rem', fontWeight: 'bold' }}>Deal Secured!</h2>
                                <div style={{ fontSize: '1.2rem', marginBottom: '2rem', background: 'color-mix(in srgb, var(--color-chessboard-parchment) 6%, transparent)', padding: '2rem', borderRadius: '12px', color: 'var(--color-chessboard-parchment)' }}>
                                    <p style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Congratulations! You finalized a deal with <strong style={{ color: 'var(--color-chessboard-parchment)' }}>{acceptedDealTerms?.investorName || selectedOffer?.investorName}</strong>.</p>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.9rem', color: 'color-mix(in srgb, var(--color-chessboard-parchment) 60%, transparent)', textTransform: 'uppercase', letterSpacing: '1px' }}>Investment</div>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'color-mix(in srgb, #34d399 60%, var(--color-chessboard-parchment))' }}>${(acceptedDealTerms?.capital || selectedOffer?.capital || 0).toLocaleString()}</div>
                                        </div>
                                        <div style={{ width: '1px', background: 'color-mix(in srgb, var(--color-chessboard-parchment) 20%, transparent)' }}></div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.9rem', color: 'color-mix(in srgb, var(--color-chessboard-parchment) 60%, transparent)', textTransform: 'uppercase', letterSpacing: '1px' }}>Equity</div>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'color-mix(in srgb, #60a5fa 60%, var(--color-chessboard-parchment))' }}>{acceptedDealTerms?.equity || selectedOffer?.equity}%</div>
                                        </div>
                                    </div>
                                </div>
                                <button className="final-report-btn" onClick={handleCompleteToVerdict} style={{ position: 'relative', zIndex: 10 }}>
                                    The Council Renders Its Verdict
                                </button>
                            </motion.div>
                        )}

                        {!selectedOffer && !dealFinalized && (
                            <motion.button
                                className="final-report-btn"
                                onClick={handleCompleteToVerdict}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + offers.length * 0.15 }}
                                style={{ marginTop: '2rem' }}
                            >
                                Walk Away from All Offers
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </main>

            <style jsx>{`
                .chessboard-shell {
                    position: relative;
                    min-height: 100vh;
                    background:
                        radial-gradient(circle at top, rgba(239,68,68,0.12), transparent 40%),
                        linear-gradient(180deg, #000 0%, #050505 55%, #101010 100%);
                    color: #f5f5f5;
                    overflow: hidden;
                }

                .chessboard-shell::before {
                    content: '';
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    pointer-events: none;
                    background: linear-gradient(90deg,
                        transparent 0%,
                        rgba(239,68,68,0.5) 15%,
                        rgba(201,162,39,0.4) 30%,
                        rgba(239,68,68,0.6) 50%,
                        rgba(201,162,39,0.4) 70%,
                        rgba(239,68,68,0.5) 85%,
                        transparent 100%
                    );
                    background-size: 200% 100%;
                    animation: chessboardWaveTop 3s ease-in-out infinite;
                    box-shadow:
                        0 0 20px rgba(239,68,68,0.35),
                        0 0 60px rgba(239,68,68,0.15);
                    z-index: 100;
                }

                .chessboard-shell::after {
                    content: '';
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    pointer-events: none;
                    background: linear-gradient(90deg,
                        transparent 0%,
                        rgba(239,68,68,0.5) 15%,
                        rgba(201,162,39,0.4) 30%,
                        rgba(239,68,68,0.6) 50%,
                        rgba(201,162,39,0.4) 70%,
                        rgba(239,68,68,0.5) 85%,
                        transparent 100%
                    );
                    background-size: 200% 100%;
                    animation: chessboardWaveBottom 3s ease-in-out infinite;
                    box-shadow:
                        0 0 20px rgba(239,68,68,0.35),
                        0 0 60px rgba(239,68,68,0.15);
                    z-index: 100;
                }

                .chessboard-shell > * {
                    position: relative;
                    z-index: 1;
                }

                @keyframes chessboardWaveTop {
                    0% { background-position: 0% 0%; }
                    50% { background-position: 100% 0%; }
                    100% { background-position: 0% 0%; }
                }

                @keyframes chessboardWaveBottom {
                    0% { background-position: 100% 0%; }
                    50% { background-position: 0% 0%; }
                    100% { background-position: 100% 0%; }
                }
            `}</style>


        </div>
    )
}
