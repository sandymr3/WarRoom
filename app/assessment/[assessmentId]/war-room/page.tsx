'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import api from '@/src/lib/api'
import { useAudioRecorder } from '@/src/hooks/useAudioRecorder'
import type {
    AssessmentState,
    Investor,
    InvestorScorecard,
} from '@/src/types'

// ============================================
// WAR ROOM – Investor Pitch Simulation
// SOP: 15 minutes, all C1-C8 integrated
// ============================================

type WarRoomPhase = 'LOADING' | 'PITCH' | 'INVESTOR_QA' | 'DEAL_RESULTS' | 'COMPLETE'

export default function WarRoomSimulation() {
    const params = useParams()
    const router = useRouter()
    const assessmentId = params?.assessmentId as string

    // State
    const [phase, setPhase] = useState<WarRoomPhase>('LOADING')
    const [assessmentState, setAssessmentState] = useState<AssessmentState | null>(null)
    const [investors, setInvestors] = useState<Investor[]>([])
    const [pitchText, setPitchText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // Audio Recording
    const pitchRecorder = useAudioRecorder(60)  // 60s for pitch
    const responseRecorder = useAudioRecorder(30) // 30s for responses
    const negotiationRecorder = useAudioRecorder(15) // 15s for negotiation

    // Analysis results
    const [pitchAnalysis, setPitchAnalysis] = useState<{
        transcription: string; feedback: string; strengths: string[]; weaknesses: string[];
        overallScore: number; clarity: number; confidence: number; persuasion: number;
    } | null>(null)
    const [responseTranscription, setResponseTranscription] = useState('')

    // Investor Q&A
    const [currentInvestorIndex, setCurrentInvestorIndex] = useState(0)
    const [investorResponse, setInvestorResponse] = useState('')
    const [scorecards, setScorecards] = useState<InvestorScorecard[]>([])
    const [currentInvestorReaction, setCurrentInvestorReaction] = useState('')
    const [isPlayingAudio, setIsPlayingAudio] = useState(false)

    // Negotiation state
    const MAX_NEG_ROUNDS = 4 // 3 negotiation rounds + 1 final accept/reject
    const [offers, setOffers] = useState<any[]>([])
    const [selectedOffer, setSelectedOffer] = useState<any | null>(null)
    const [negRound, setNegRound] = useState(0)
    const [negHistory, setNegHistory] = useState<{sender: string, msg: string, type: 'investor'|'user'}[]>([])
    const [negInputCap, setNegInputCap] = useState<string>('')
    const [negInputEq, setNegInputEq] = useState<string>('')
    const [dealFinalized, setDealFinalized] = useState(false)
    const [isNegVoiceSubmitting, setIsNegVoiceSubmitting] = useState(false)
    const [acceptedDealTerms, setAcceptedDealTerms] = useState<{capital: number, equity: number, investorName: string} | null>(null)
    const [walkedAwayInvestor, setWalkedAwayInvestor] = useState<string | null>(null)

    // Auto-reset negotiation recorder when offer changes
    useEffect(() => {
        if (selectedOffer) {
            negotiationRecorder.resetRecording()
        }
    }, [selectedOffer])

    // Timer (15 min war room)
    const [timeRemaining, setTimeRemaining] = useState(15 * 60); /* Disabled countdown logic */ // 15 minutes in seconds

    // -- Negotiation Logic --
    const handleSelectOffer = (offer: any) => {
        setSelectedOffer(offer)
        setNegRound(0) // Round increments on each voice submission
        setNegHistory([
            { sender: offer.investorName, msg: offer.message, type: 'investor' }
        ])
        setNegInputCap(offer.capital.toString())
        setNegInputEq(offer.equity.toString())
    }

    const handleNegotiateAudio = async () => {
        if (!negotiationRecorder.audioBlob || !selectedOffer) return

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
                negotiationRecorder.audioBlob
            )

            // Detect walk-away intent from transcription
            const walkAwayPhrases = ['walk away', "i'm out", 'no deal', 'reject', 'i walk', 'walking away', 'walk out']
            const isWalkAway = walkAwayPhrases.some(p => result.transcription?.toLowerCase().includes(p))

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
                negotiationRecorder.resetRecording()
                // Clear walk-away message after 3 seconds
                setTimeout(() => setWalkedAwayInvestor(null), 3000)
                return
            }

            const newHistory = [...negHistory, {
                sender: 'You',
                msg: result.transcription,
                type: 'user' as const
            }]

            newHistory.push({
                sender: selectedOffer.investorName,
                msg: result.message,
                type: 'investor'
            })

            setNegHistory(newHistory)
            setNegRound(nextRound)

            // Play investor audio response
            if (result.audioBase64) {
                if (audioRef.current) audioRef.current.pause()
                const audio = new Audio(`data:audio/mp3;base64,${result.audioBase64}`)
                audioRef.current = audio
                audio.play().catch(e => console.error("Auto-play failed:", e))
            }

            if (result.accepted) {
                // Use the current selectedOffer amounts (or AI-returned if they're reasonable)
                // Prefer the AI response amounts since they represent the negotiated terms
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
            } else {
                // Update offer with counter-proposed terms
                const updatedOffer = { 
                    ...selectedOffer, 
                    capital: result.capital, 
                    equity: result.equity 
                }
                setSelectedOffer(updatedOffer)
                setNegInputCap(result.capital.toString())
                setNegInputEq(result.equity.toString())

                if (nextRound >= MAX_NEG_ROUNDS) {
                    // Max rounds exhausted without acceptance — auto-reject this offer
                    try {
                        await api.assessments.rejectOffer(assessmentId, selectedOffer.offerId || selectedOffer.type)
                        setOffers(offers.filter(o => o.offerId !== selectedOffer.offerId && o.offerId !== selectedOffer.type))
                        setSelectedOffer(null)
                        setNegRound(0)
                    } catch (e) {
                        console.error('Auto-reject failed:', e)
                    }
                }
            }

            negotiationRecorder.resetRecording()
        } catch (err: any) {
            setError(err.message || 'Failed to negotiate via voice')
        } finally {
            setIsNegVoiceSubmitting(false)
        }
    }

    const handleAcceptDeal = async (offer: any) => {
        try {
            setAcceptedDealTerms({
                capital: offer.capital,
                equity: offer.equity,
                investorName: offer.investorName
            })
            await api.assessments.acceptDeal(assessmentId, offer.investorId, offer.capital, offer.equity)
            setDealFinalized(true)
        } catch (e) {
            console.error(e)
        }
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

    // Load assessment state and investors
    useEffect(() => {
        const load = async () => {
            try {
                const [state, investorList] = await Promise.all([
                    api.assessments.get(assessmentId),
                    api.config.getInvestors(),
                ])
                setAssessmentState(state)
                setInvestors(investorList)
                setPhase('PITCH')
            } catch (err: any) {
                setError(err.message || 'Failed to load War Room data')
                setPhase('PITCH') // Still show pitch even if load fails
            }
        }
        load()
    }, [assessmentId])

    // 15-minute countdown timer
    useEffect(() => {
        if (phase === 'LOADING' || phase === 'COMPLETE') return

        // timer disabled per user request

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [phase, assessmentId, router])

    // Fire confetti when deal is finalized
    useEffect(() => {
        if (dealFinalized) {
            const duration = 3 * 1000
            const animationEnd = Date.now() + duration
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

            const interval: any = setInterval(function() {
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

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

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
            setPitchAnalysis(result.analysis)
            setPitchText(result.analysis.transcription)
        } catch (err: any) {
            setError(err.message || 'Failed to analyze pitch')
        } finally {
            setIsAnalyzing(false)
            setIsSubmitting(false)
        }
    }

    const handleContinueFromPitch = () => {
        setPhase('INVESTOR_QA')
        setCurrentInvestorIndex(0)
        setCurrentInvestorReaction('')
        setPitchAnalysis(null)
    }

    // ============================================
    // INVESTOR RESPONSE (AUDIO)
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

        try {
            const result = await api.assessments.respondToInvestorAudio(
                assessmentId,
                investor.id,
                responseRecorder.audioBlob
            )
            setScorecards(prev => [...prev, result.scorecard])
            setResponseTranscription(result.transcription)
            setCurrentInvestorReaction(
                result.scorecard.investorReaction || `${investor.name} has considered your response.`
            )
            responseRecorder.resetRecording()

            if (result.ttsError) {
                console.warn("TTS Generation Warning:", result.ttsError)
                setError(`Note: Audio generation failed (${result.ttsError}). Please read the text response instead.`)
            }

            if (result.audioBase64) {
                if (audioRef.current) {
                    audioRef.current.pause()
                }
                const audio = new Audio(`data:audio/mp3;base64,${result.audioBase64}`)
                audioRef.current = audio
                audio.onplay = () => setIsPlayingAudio(true)
                audio.onended = () => setIsPlayingAudio(false)
                audio.onerror = () => setIsPlayingAudio(false)
                audio.play().catch(e => {
                    console.error("Auto-play failed:", e)
                    setIsPlayingAudio(false)
                })
            }
        } catch (err: any) {
            setError(err.message || 'Failed to analyze response')
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
        if (currentInvestorIndex < investors.length - 1) {
            setCurrentInvestorIndex(prev => prev + 1)
        } else {
            try {
                const fetchedOffers = await api.assessments.getWarRoomOffers(assessmentId)
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

    const currentInvestor = investors[currentInvestorIndex]
    const isTimeLow = timeRemaining < 120 // < 2 minutes

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="warroom-page">
            {/* Top Bar */}
            <header className="warroom-header">
                <div className="header-left">
                    <h1 className="warroom-title">⚔️ War Room</h1>
                    <span className="warroom-subtitle">Live Investor Pitch Simulation</span>
                </div>
                <div className="header-center">
                    {/* timer removed */}
                </div>
                <div className="header-right">
                    <button className="end-btn" onClick={handleEndSimulation}>
                        End Simulation
                    </button>
                </div>
            </header>

            <main className="warroom-main">
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
                        >⚔️</motion.div>
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
                            Record Your 1-Minute War Room Pitch
                        </motion.h2>
                        <motion.p className="phase-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                            You are standing before the investor panel. Tap the microphone and deliver your pitch out loud.
                            You have <strong>60 seconds</strong> to make your case.
                        </motion.p>

                        {/* Pitch Template - Collapsible */}
                        <motion.details className="pitch-template" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            <summary className="cursor-pointer font-bold text-sm text-foreground/80 select-none">📝 Pitch Template Guide (tap to expand)</summary>
                            <div className="template-text">
                                <p>Hello Sharks, my name is <strong>[NAME]</strong> and I am the founder of <strong>[BUSINESS]</strong>.</p>
                                <p><em>(The Problem)</em> Today, [TARGET CUSTOMER] struggles with [PROBLEM].</p>
                                <p><em>(The Solution)</em> I created [PRODUCT], which [VALUE PROP].</p>
                                <p><em>(Why Different)</em> Unlike [COMPETITORS], we [DIFFERENTIATION].</p>
                                <p><em>(Proof)</em> We validated this by [VALIDATION]. So far, [TRACTION].</p>
                                <p><em>(The Ask)</em> We are raising $[AMOUNT] for [EQUITY]% equity.</p>
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
                                        type="button"
                                        aria-label={pitchRecorder.isRecording ? 'Stop recording pitch' : pitchRecorder.audioBlob ? 'Record pitch again' : 'Start recording pitch'}
                                        className={`mic-button ${pitchRecorder.isRecording ? 'active' : ''} ${pitchRecorder.audioBlob ? 'done' : ''}`}
                                        onClick={pitchRecorder.isRecording ? pitchRecorder.stopRecording : pitchRecorder.startRecording}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {pitchRecorder.isRecording ? 'Stop Recording' : pitchRecorder.audioBlob ? 'Record Again' : 'Start Recording'}
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
                                <h3 className="analysis-title">📊 Pitch Analysis</h3>
                                <div className="analysis-scores">
                                    <div className="score-item"><span className="score-label">Overall</span><span className="score-value">{pitchAnalysis.overallScore}/10</span></div>
                                    <div className="score-item"><span className="score-label">Clarity</span><span className="score-value">{pitchAnalysis.clarity}/5</span></div>
                                    <div className="score-item"><span className="score-label">Confidence</span><span className="score-value">{pitchAnalysis.confidence}/5</span></div>
                                    <div className="score-item"><span className="score-label">Persuasion</span><span className="score-value">{pitchAnalysis.persuasion}/5</span></div>
                                </div>
                                <div className="analysis-transcript">
                                    <span className="analysis-label">📝 What you said:</span>
                                    <p>{pitchAnalysis.transcription}</p>
                                </div>
                                
                                {pitchAnalysis.strengths?.length > 0 && (
                                    <div className="analysis-list strengths">
                                        <span className="analysis-label">✅ Strengths:</span>
                                        <ul>{pitchAnalysis.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                )}
                                {pitchAnalysis.weaknesses?.length > 0 && (
                                    <div className="analysis-list weaknesses">
                                        <span className="analysis-label">⚠️ Areas to Improve:</span>
                                        <ul>{pitchAnalysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                                    </div>
                                )}
                                <motion.button type="button" className="submit-pitch-btn" onClick={handleContinueFromPitch} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                    Continue to Investor Questions
                                </motion.button>
                            </motion.div>
                        )}

                        {error && <div className="error-message">{error}</div>}

                        {!pitchAnalysis && !isAnalyzing && pitchRecorder.audioBlob && (
                            <motion.button
                                type="button"
                                className="submit-pitch-btn"
                                onClick={handleSubmitPitchAudio}
                                disabled={isSubmitting}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                {isSubmitting ? 'Analyzing Pitch...' : 'Submit Pitch for Analysis'}
                            </motion.button>
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

                        {/* Investor Card */}
                        <AnimatePresence mode="wait">
                            <motion.div key={currentInvestor.id || currentInvestorIndex} className="investor-card" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} transition={{ duration: 0.4 }}>
                                <motion.div className="investor-avatar" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}>
                                    {currentInvestor.name.charAt(0)}
                                </motion.div>
                                <div className="investor-info">
                                    <h2 className="investor-name">{currentInvestor.name}</h2>
                                    <span className="investor-lens">{currentInvestor.primary_lens}</span>
                                    <p className="investor-bio">{currentInvestor.bio}</p>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Question */}
                        <motion.div className="investor-question" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                            <span className="question-label">🎯 {currentInvestor.name} asks:</span>
                            <p className="question-text">{currentInvestor.signature_question}</p>
                        </motion.div>

                        {/* Investor Reaction (after response) */}
                        <AnimatePresence>
                        {currentInvestorReaction && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                {responseTranscription && (
                                    <div className="analysis-transcript" style={{ marginBottom: '1rem' }}>
                                        <span className="analysis-label">📝 What you said:</span>
                                        <p>{responseTranscription}</p>
                                    </div>
                                )}
                                <div className="investor-reaction">
                                    <span className="reaction-label">
                                        💬 {currentInvestor.name} responds:
                                        {isPlayingAudio && <span className="ml-2.5 text-sm text-emerald-600 dark:text-emerald-400 font-normal">🔊 Playing…</span>}
                                    </span>
                                    <p>{currentInvestorReaction}</p>
                                </div>
                                <motion.button type="button" className="respond-btn" onClick={handleContinueToNextInvestor} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                    {currentInvestorIndex < investors.length - 1 ? `Continue to Next Investor` : `View Panel Decisions`}
                                </motion.button>
                            </motion.div>
                        )}
                        </AnimatePresence>

                        {/* Walk-out warning */}
                        <motion.div className="walkout-warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                            <span>🚨 Walk-out trigger:</span> {currentInvestor.walk_out_trigger}
                        </motion.div>

                        {/* Audio Recording for Response */}
                        {!currentInvestorReaction && !isAnalyzing && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
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
                                            type="button"
                                            aria-label={responseRecorder.isRecording ? 'Stop recording response' : responseRecorder.audioBlob ? 'Record response again' : 'Start recording response'}
                                            className={`mic-button ${responseRecorder.isRecording ? 'active' : ''} ${responseRecorder.audioBlob ? 'done' : ''}`}
                                            onClick={responseRecorder.isRecording ? responseRecorder.stopRecording : responseRecorder.startRecording}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {responseRecorder.isRecording ? 'Stop Recording' : responseRecorder.audioBlob ? 'Record Again' : 'Start Recording'}
                                        </motion.button>
                                    </div>
                                    <div className="recording-status">
                                        {responseRecorder.isRecording ? (
                                            <><span className="rec-dot" /><span className="rec-text">Recording... {Math.max(0, 30 - responseRecorder.recordingTime)}s left</span></>
                                        ) : responseRecorder.audioBlob ? (
                                            <span className="rec-done">Response recorded ({responseRecorder.recordingTime}s)</span>
                                        ) : (
                                            <span className="rec-hint">Select Start Recording to record your response (30s max)</span>
                                        )}
                                    </div>
                                    {responseRecorder.isRecording && (
                                        <div className="countdown-bar"><div className="countdown-fill" style={{ width: `${Math.max(0, ((30 - responseRecorder.recordingTime) / 30) * 100)}%` }} /></div>
                                    )}
                                </div>

                                {error && <div className="error-message">{error}</div>}

                                {responseRecorder.audioBlob && (
                                    <motion.button type="button" className="respond-btn" onClick={handleRespondToInvestorAudio} disabled={isSubmitting} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                        {isSubmitting ? 'Analyzing Response...' : 'Submit Response'}
                                    </motion.button>
                                )}
                            </motion.div>
                        )}

                        {/* Analyzing state */}
                        {isAnalyzing && (
                            <motion.div className="analyzing-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="analyzing-spinner" />
                                <h3>Analyzing Your Response...</h3>
                                <p>{currentInvestor.name} is evaluating your answer.</p>
                            </motion.div>
                        )}
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
                                        className="scorecard border-emerald-500/25"
                                        initial={{ opacity: 0, y: 30, rotateX: -10 }}
                                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                        transition={{ delay: 0.3 + i * 0.15, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                                        onClick={() => handleSelectOffer(offer)}
                                    >
                                        <div className="sc-header">
                                            <motion.div
                                                className="sc-avatar border-emerald-500/60"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.5 + i * 0.15, type: 'spring', stiffness: 300 }}
                                            >
                                                {offer.investorName.charAt(0)}
                                            </motion.div>
                                            <div>
                                                <h3 className="sc-name">{offer.investorName}</h3>
                                                <span className="sc-decision text-emerald-600 dark:text-emerald-400">
                                                    🔥 OFFER RECEIVED
                                                </span>
                                            </div>
                                        </div>
                                        <div className="sc-deal">
                                            <span>💰 Offer: ${(offer.capital || 0).toLocaleString()}</span>
                                            <span>📊 For {offer.equity}% equity</span>
                                        </div>
                                        <div className="sc-investor-reaction">
                                            <p>&ldquo;{offer.message}&rdquo;</p>
                                        </div>
                                        <p className="mt-4 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            Click to Negotiate →
                                        </p>
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
                                <div className="neg-header">
                                    <div className="flex justify-between items-center">
                                        <h3>Negotiating with {selectedOffer.investorName}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest ${negRound >= MAX_NEG_ROUNDS - 1 ? 'bg-destructive/15 text-destructive border border-destructive/30' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'}`}>
                                            ROUND {Math.min(negRound + 1, MAX_NEG_ROUNDS)} / {MAX_NEG_ROUNDS}
                                        </span>
                                    </div>
                                    <p>Current Offer: ${selectedOffer.capital.toLocaleString()} for {selectedOffer.equity}%</p>
                                </div>

                                <div className="neg-history">
                                    {negHistory.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`message-bubble ${item.type}`}
                                        >
                                            <strong className={`message-sender ${item.type === 'user' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                {item.sender}
                                            </strong>
                                            {item.msg}
                                        </div>
                                    ))}
                                </div>

                                {/* Voice instruction banner */}
                                {negRound < MAX_NEG_ROUNDS && (
                                    <div className={`p-3 rounded-xl mb-4 text-sm ${negRound >= MAX_NEG_ROUNDS - 1 ? 'bg-destructive/8 border border-destructive/20' : 'bg-blue-500/8 border border-blue-500/20'}`}>
                                        {negRound >= MAX_NEG_ROUNDS - 1 ? (
                                            <p className="text-destructive font-semibold m-0">
                                                🔴 <strong>Final Round!</strong> Say <em>&ldquo;I accept this deal&rdquo;</em> to secure it, or <em>&ldquo;I walk away&rdquo;</em> to reject.
                                            </p>
                                        ) : (
                                            <p className="text-blue-600 dark:text-blue-400 m-0">
                                                🎙️ Speak your counter-offer, or say <em>&ldquo;I accept&rdquo;</em> / <em>&ldquo;I walk away&rdquo;</em> to finalize.
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="neg-controls flex flex-col gap-3 mt-4 w-full">
                                    <div className="recording-zone">
                                        <p className="rec-hint mb-4">
                                            {negRound >= MAX_NEG_ROUNDS - 1
                                                ? 'This is your final round — say "I accept this deal" or "I walk away"'
                                                : 'Speak your counter offer (e.g., "I\'d like $1.2M for 25% equity because…")'
                                            }
                                        </p>

                                        <div className="mic-button-wrapper">
                                            <button
                                                type="button"
                                                aria-label={negotiationRecorder.isRecording ? 'Stop recording negotiation' : 'Start recording negotiation'}
                                                className={`mic-button ${negotiationRecorder.isRecording ? 'active' : ''}`}
                                                onClick={negotiationRecorder.isRecording ? negotiationRecorder.stopRecording : negotiationRecorder.startRecording}
                                                disabled={isNegVoiceSubmitting || negRound >= MAX_NEG_ROUNDS}
                                            >
                                                {negotiationRecorder.isRecording ? 'Stop Recording' : 'Start Recording'}
                                            </button>
                                        </div>

                                        {negotiationRecorder.isRecording ? (
                                            <div className="recording-status">
                                                <div className="rec-dot" />
                                                <span className="rec-text">RECORDING… {Math.max(0, 15 - negotiationRecorder.recordingTime)}s</span>
                                            </div>
                                        ) : negotiationRecorder.audioBlob ? (
                                            <div className="recording-status">
                                                <span className="rec-done">Response recorded ({negotiationRecorder.recordingTime}s)</span>
                                            </div>
                                        ) : negRound >= MAX_NEG_ROUNDS ? (
                                            <div className="recording-status">
                                                <span className="text-sm text-destructive">⏱️ All rounds exhausted — offer expired</span>
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

                                        {negotiationRecorder.audioBlob && !negotiationRecorder.isRecording && negRound < MAX_NEG_ROUNDS && (
                                            <motion.button
                                                type="button"
                                                className={`respond-btn mt-4 ${negRound >= MAX_NEG_ROUNDS - 1 ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                                                onClick={handleNegotiateAudio}
                                                disabled={isNegVoiceSubmitting}
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                            >
                                                {isNegVoiceSubmitting ? 'Analyzing…' : negRound >= MAX_NEG_ROUNDS - 1 ? 'Submit Final Decision' : 'Submit Voice Counter'}
                                            </motion.button>
                                        )}
                                    </div>

                                    {/* Walk Away Button */}
                                    <motion.button
                                        type="button"
                                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold text-destructive border border-destructive/40 bg-transparent hover:bg-destructive/10 active:bg-destructive/20 transition-all disabled:opacity-50"
                                        onClick={handleRejectDeal}
                                        disabled={isNegVoiceSubmitting}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Walk Away from This Offer
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {walkedAwayInvestor && !dealFinalized && !selectedOffer && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="text-center p-8 bg-destructive/10 rounded-2xl border border-destructive/30 mb-6"
                            >
                                <h3 className="text-2xl text-destructive font-bold mb-2">🚶 Walked Away</h3>
                                <p className="text-destructive/80 text-base">You walked away from <strong>{walkedAwayInvestor}</strong>&apos;s offer.</p>
                                <p className="text-muted-foreground text-sm mt-2">Select another offer to continue negotiating, or walk away from all offers.</p>
                            </motion.div>
                        )}

                        {dealFinalized && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="deal-accepted text-center"
                            >
                                <h2 className="deal-accepted-title">Deal Secured! 🎉</h2>
                                <p className="deal-accepted-subtitle">
                                    Congratulations! You finalized a deal with{' '}
                                    <strong className="text-foreground">{acceptedDealTerms?.investorName || selectedOffer?.investorName}</strong>.
                                </p>
                                <div className="deal-terms">
                                    <div className="deal-term">
                                        <span className="deal-term-label">Investment</span>
                                        <span className="deal-term-value text-4xl font-extrabold">
                                            ${(acceptedDealTerms?.capital || selectedOffer?.capital || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="deal-term">
                                        <span className="deal-term-label">Equity Given</span>
                                        <span className="deal-term-value text-4xl font-extrabold">
                                            {acceptedDealTerms?.equity || selectedOffer?.equity}%
                                        </span>
                                    </div>
                                </div>
                                <button type="button" className="final-report-btn mt-6" onClick={handleEndSimulation}>
                                    Complete Simulation and View Report
                                </button>
                            </motion.div>
                        )}

                        {!selectedOffer && !dealFinalized && (
                            <motion.button
                                type="button"
                                className="final-report-btn"
                                onClick={handleEndSimulation}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + offers.length * 0.15 }}
                            >
                                Walk Away from All Offers
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </main>


        </div>
    )
}
