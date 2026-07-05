'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Loader2, RefreshCw, CheckCircle2, ChevronRight, Volume2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { investorDisplayName } from '@/src/lib/helpers'
import type { Investor } from '@/src/types'

interface InvestorQAPhaseProps {
  investor: Investor | undefined
  investorIndex: number
  totalInvestors: number
  responseSubmitted: boolean
  currentInvestorReaction: string
  responseTranscription: string
  isPlayingAudio: boolean
  isAnalyzing: boolean
  isSubmitting: boolean
  error: string
  recorder: ReturnType<typeof import('@/src/hooks/useAudioRecorder').useAudioRecorder>
  followupActive: boolean
  followupQuestion: string
  onSubmitResponse: () => void
  onSubmitFollowupResponse: () => void
  onContinue: () => void
}

export function InvestorQAPhase({
  investor, investorIndex, totalInvestors, responseSubmitted, currentInvestorReaction,
  responseTranscription, isPlayingAudio, isAnalyzing, isSubmitting, error,
  recorder, followupActive, followupQuestion,
  onSubmitResponse, onSubmitFollowupResponse, onContinue,
}: InvestorQAPhaseProps) {
  if (!investor) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-gray-400">No investors available for Q&A.</p>
        <Button onClick={onContinue} className="bg-primary text-white">Skip to Deal Offers</Button>
      </div>
    </div>
  )

  // The backend may store the question differently depending on the investor config
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const investorQuestion = (investor as any).questions?.[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    || (investor as any).question
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    || (investor as any).pitch_question
    || `${investorDisplayName(investor.name)} will ask you a question about your business model and market strategy. Record your response.`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const investorFirm = (investor as any).firm || (investor as any).company || (investor as any).specialty || 'Independent Investor'

  const displayName = investorDisplayName(investor.name)

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
      {/* Investor header */}
      <div className="text-center space-y-2">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Investor {investorIndex + 1} of {totalInvestors}
        </div>
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="h-14 w-14 rounded-full bg-red-600/20 border-2 border-red-600/40 flex items-center justify-center text-2xl font-black text-white">
            {displayName.charAt(0)}
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black text-white">{displayName}</h1>
            <p className="text-gray-500 text-sm">{investorFirm}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: totalInvestors }).map((_, i) => (
            <div key={i} className={cn('h-1 rounded-full transition-all', i === investorIndex ? 'bg-red-500 w-8' : i < investorIndex ? 'bg-green-500/60 w-4' : 'bg-white/10 w-4')} />
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {/* Investor question */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          {isPlayingAudio && <Volume2 className="h-4 w-4 text-amber-400 animate-pulse" />}
          <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{displayName} asks:</span>
        </div>
        <p className="text-white text-sm leading-relaxed font-medium">{investorQuestion}</p>
      </div>

      {/* Recording UI */}
      {!responseSubmitted && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5 text-center">
          <div className="text-sm text-gray-400">Record your response (up to 15 seconds)</div>

          {recorder.isRecording ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
                <button
                  onClick={recorder.stopRecording}
                  className="relative h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-lg shadow-red-900/40"
                >
                  <MicOff className="h-7 w-7 text-white" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                {recorder.recordingTime}s / {recorder.maxDuration}s
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={recorder.startRecording}
                disabled={!!recorder.audioBlob}
                className={cn(
                  'h-16 w-16 rounded-full flex items-center justify-center mx-auto transition-all shadow-lg',
                  recorder.audioBlob
                    ? 'bg-green-600/20 border-2 border-green-500 shadow-green-900/30'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-900/40 hover:scale-105'
                )}
              >
                {recorder.audioBlob ? <CheckCircle2 className="h-7 w-7 text-green-400" /> : <Mic className="h-7 w-7 text-white" />}
              </button>
              {!recorder.audioBlob && <p className="text-xs text-gray-600">Tap to start recording</p>}
            </div>
          )}

          {recorder.audioBlob && !recorder.isRecording && (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-green-400">✓ Recording ready</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={recorder.resetRecording}
                className="text-xs text-gray-500 hover:text-gray-300 gap-1"
              >
                <RefreshCw className="h-3 w-3" />Re-record
              </Button>
              <Button
                onClick={onSubmitResponse}
                disabled={isAnalyzing || isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isAnalyzing
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing response...</>
                  : 'Submit Response'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Follow-up question + recording */}
      {responseSubmitted && followupActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2">
              {isPlayingAudio && <Volume2 className="h-4 w-4 text-amber-400 animate-pulse" />}
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{displayName} follows up:</span>
            </div>
            <p className="text-white font-medium">{followupQuestion}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 text-center">
            <div className="text-sm text-gray-400">Record your follow-up response (up to 15s)</div>
            {recorder.isRecording ? (
              <div className="flex flex-col items-center gap-3">
                <button onClick={recorder.stopRecording} className="relative h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center">
                  <MicOff className="h-7 w-7 text-white" />
                </button>
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  {recorder.recordingTime}s / {recorder.maxDuration}s
                </div>
              </div>
            ) : (
              <button
                onClick={recorder.startRecording}
                disabled={!!recorder.audioBlob}
                className={cn('h-16 w-16 rounded-full flex items-center justify-center mx-auto', recorder.audioBlob ? 'bg-green-600/20 border-2 border-green-500' : 'bg-red-600 hover:bg-red-700')}
              >
                {recorder.audioBlob ? <CheckCircle2 className="h-7 w-7 text-green-400" /> : <Mic className="h-7 w-7 text-white" />}
              </button>
            )}
            {recorder.audioBlob && !recorder.isRecording && (
              <div className="space-y-3">
                <Button variant="ghost" size="sm" onClick={recorder.resetRecording} className="text-xs text-gray-500 gap-1">
                  <RefreshCw className="h-3 w-3" />Re-record
                </Button>
                <Button
                  onClick={onSubmitFollowupResponse}
                  disabled={isAnalyzing || isSubmitting}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {isAnalyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</> : 'Submit Follow-up'}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Reaction + Next button */}
      {responseSubmitted && !followupActive && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {responseTranscription && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs font-bold text-gray-500 uppercase mb-2">Your Response</div>
                <p className="text-sm text-gray-300 leading-relaxed">{responseTranscription}</p>
              </div>
            )}
            {currentInvestorReaction && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  {isPlayingAudio && <Volume2 className="h-3.5 w-3.5 text-amber-400 animate-pulse" />}
                  <div className="text-xs font-bold text-amber-400 uppercase">{displayName} reacts</div>
                </div>
                <p className="text-sm text-amber-100 leading-relaxed">{currentInvestorReaction}</p>
              </div>
            )}
            <Button
              onClick={onContinue}
              className="w-full font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white"
              size="lg"
            >
              {investorIndex < totalInvestors - 1
                ? <><span>Next: {/* show next investor name if available */}Next Investor</span><ChevronRight className="h-4 w-4 ml-2" /></>
                : <>View Deal Offers <ChevronRight className="h-4 w-4 ml-2" /></>}
            </Button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
