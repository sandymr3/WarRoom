'use client'

import { useRef, useState } from 'react'
import api from '@/src/lib/api'
import { investorDisplayName } from '@/src/lib/helpers'
import { useAudioRecorder } from '@/src/hooks/useAudioRecorder'
import type { Investor, InvestorScorecard } from '@/src/types'
import { isVoiceLineMuted, getVoiceLineVolume } from '@/src/state/audioStore'


// ============================================
// useInvestorQA — sequential Q&A loop across all selected investors,
// with one AI-generated follow-up per investor.
//
// Flow per investor:
//   1. Investor asks initial question (audio cue from page)
//   2. User records → handleRespondToInvestorAudio
//   3. Follow-up audio is generated and plays
//   4. User records reply → handleSubmitFollowupResponse
//   5. Investor reaction shows; advanceToNextInvestor → next investor
// ============================================

export function useInvestorQA(assessmentId: string) {
  const responseRecorder = useAudioRecorder(15)

  const [currentInvestorIndex, setCurrentInvestorIndex] = useState(0)
  const [scorecards, setScorecards] = useState<InvestorScorecard[]>([])
  const [currentInvestorReaction, setCurrentInvestorReaction] = useState('')
  const [responseTranscription, setResponseTranscription] = useState('')
  const [responseSubmitted, setResponseSubmitted] = useState(false)
  const [followupActive, setFollowupActive] = useState(false)
  const [followupQuestion, setFollowupQuestion] = useState('')
  const [initialTranscription, setInitialTranscription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [error, setError] = useState('')

  const audioRef = useRef<HTMLAudioElement | null>(null)

  function playAudioBase64(base64: string) {
    if (isVoiceLineMuted()) return
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(`data:audio/mp3;base64,${base64}`)
    audio.volume = getVoiceLineVolume()
    audioRef.current = audio
    audio.onplay = () => setIsPlayingAudio(true)
    audio.onended = () => setIsPlayingAudio(false)
    audio.onerror = () => setIsPlayingAudio(false)
    audio.play().catch(() => setIsPlayingAudio(false))
  }

  async function handleRespondToInvestorAudio(investor: Investor) {
    if (!responseRecorder.audioBlob) { setError('Please record your response'); return }
    if (!investor) return
    setIsAnalyzing(true); setIsSubmitting(true); setError('')
    const responseBlob = responseRecorder.audioBlob
    try {
      const result = await api.assessments.respondToInvestorAudio(assessmentId, investor.id, responseBlob)
      setScorecards((prev) => [...prev, result.scorecard])
      setResponseTranscription(result.transcription)
      setInitialTranscription(result.transcription)
      setResponseSubmitted(true)
      responseRecorder.resetRecording()

      try {
        const followup = await api.assessments.generateInvestorFollowupAudio(assessmentId, investor.id, responseBlob)
        const question = followup.followup_question || followup.followupQuestion
        if (question) {
          setFollowupQuestion(question)
          setFollowupActive(true)
          if (followup.audioBase64) playAudioBase64(followup.audioBase64)
        } else {
          setCurrentInvestorReaction(result.scorecard.investorReaction || `${investorDisplayName(investor.name)} has considered your response.`)
          if (result.audioBase64) playAudioBase64(result.audioBase64)
        }
      } catch (followupErr) {
        console.warn('[useInvestorQA] follow-up generation failed, skipping', followupErr)
        setCurrentInvestorReaction(result.scorecard.investorReaction || `${investorDisplayName(investor.name)} has considered your response.`)
        if (result.audioBase64) playAudioBase64(result.audioBase64)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze response')
    } finally {
      setIsAnalyzing(false); setIsSubmitting(false)
    }
  }

  async function handleSubmitFollowupResponse(investor: Investor) {
    if (!responseRecorder.audioBlob) { setError('Please record your response'); return }
    if (!investor || !initialTranscription || !followupQuestion) { setError('Follow-up context not ready'); return }
    setIsAnalyzing(true); setIsSubmitting(true); setError('')
    try {
      const result = await api.assessments.respondToInvestorFinalAudio(
        assessmentId, investor.id, initialTranscription, followupQuestion, responseRecorder.audioBlob
      )
      setResponseTranscription(result.transcription)
      setCurrentInvestorReaction(result.scorecard.investorReaction || `${investorDisplayName(investor.name)} has considered your follow-up.`)
      setFollowupActive(false)
      responseRecorder.resetRecording()
      if (result.audioBase64) playAudioBase64(result.audioBase64)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit follow-up response')
    } finally {
      setIsAnalyzing(false); setIsSubmitting(false)
    }
  }

  /**
   * Move to the next investor, or resolve offers when all investors are done.
   * @returns `true` if more investors remain, `false` if all done.
   */
  function advanceToNextInvestor(investors: Investor[]): boolean {
    if (audioRef.current) { audioRef.current.pause(); setIsPlayingAudio(false) }
    setCurrentInvestorReaction('')
    setFollowupActive(false)
    setFollowupQuestion('')
    setInitialTranscription('')
    if (currentInvestorIndex < investors.length - 1) {
      setCurrentInvestorIndex((p) => p + 1)
      setResponseSubmitted(false)
      setResponseTranscription('')
      return true
    }
    return false
  }

  return {
    responseRecorder,
    currentInvestorIndex, setCurrentInvestorIndex,
    scorecards,
    currentInvestorReaction, setCurrentInvestorReaction,
    responseTranscription,
    responseSubmitted, setResponseSubmitted,
    followupActive,
    followupQuestion,
    isSubmitting, isAnalyzing, isPlayingAudio,
    error, setError,
    audioRef,
    handleRespondToInvestorAudio,
    handleSubmitFollowupResponse,
    advanceToNextInvestor,
  }
}
