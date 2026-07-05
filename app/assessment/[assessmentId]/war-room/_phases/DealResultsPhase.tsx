'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Loader2, RefreshCw, CheckCircle2, TrendingUp, X, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { investorDisplayName } from '@/src/lib/helpers'

interface DealOffer {
  investorName: string
  capital: number
  equity: number
  message?: string
  [key: string]: unknown
}

interface DealResultsPhaseProps {
  offers: DealOffer[]
  selectedOffer: DealOffer | null
  negRound: number
  negHistory: { sender: string; msg: string; type: 'investor' | 'user' }[]
  maxNegRounds: number
  dealFinalized: boolean
  acceptedDealTerms: { capital: number; equity: number; investorName: string } | null
  walkedAwayInvestor: string | null
  isNegVoiceSubmitting: boolean
  error: string
  negotiationRecorder: ReturnType<typeof import('@/src/hooks/useAudioRecorder').useAudioRecorder>
  onSelectOffer: (offer: DealOffer) => void
  onNegotiateAudio: () => void
  onAcceptDeal: (offer: DealOffer) => void
  onRejectDeal: () => void
  onEndSimulation: () => void
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

export function DealResultsPhase({
  offers, selectedOffer, negRound, negHistory, maxNegRounds, dealFinalized,
  acceptedDealTerms, walkedAwayInvestor, isNegVoiceSubmitting, error,
  negotiationRecorder, onSelectOffer, onNegotiateAudio, onAcceptDeal, onRejectDeal, onEndSimulation,
}: DealResultsPhaseProps) {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white">Deal Offers</h1>
        <p className="text-gray-400 text-sm">Review and negotiate your investment offers</p>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      {/* Walker away notification */}
      <AnimatePresence>
        {walkedAwayInvestor && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="p-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm text-center"
          >
            {investorDisplayName(walkedAwayInvestor)} walked away from the deal.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deal finalized */}
      {dealFinalized && acceptedDealTerms && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-center space-y-4"
        >
          <div className="flex justify-center"><Trophy className="h-10 w-10 text-emerald-400" /></div>
          <h2 className="text-2xl font-black text-emerald-400">Deal Closed!</h2>
          <div className="text-white">
            <span className="text-3xl font-black">{formatCurrency(acceptedDealTerms.capital)}</span>
            <span className="text-gray-400 ml-2">for {acceptedDealTerms.equity}% equity</span>
          </div>
          <p className="text-gray-400 text-sm">from {investorDisplayName(acceptedDealTerms.investorName)}</p>
          <Button onClick={onEndSimulation} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold mt-4">
            Go to Final Report →
          </Button>
        </motion.div>
      )}

      {/* Offer selection */}
      {!dealFinalized && !selectedOffer && (
        <div className="space-y-3">
          {offers.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-gray-400">No offers received.</p>
              <Button onClick={onEndSimulation} variant="outline" className="border-gray-700 text-gray-300">End Simulation</Button>
            </div>
          ) : (
            offers.map((offer, i) => (
              <motion.button key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                onClick={() => onSelectOffer(offer)}
                className="w-full text-left p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{investorDisplayName(offer.investorName)}</span>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">{formatCurrency(offer.capital)}</div>
                <div className="text-sm text-gray-400">for {offer.equity}% equity</div>
                {offer.message && <p className="text-xs text-gray-500 mt-2 italic">&ldquo;{offer.message}&rdquo;</p>}
              </motion.button>
            ))
          )}
        </div>
      )}

      {/* Negotiation */}
      {!dealFinalized && selectedOffer && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">{investorDisplayName(selectedOffer.investorName)}</span>
              <Button variant="ghost" size="sm" onClick={onRejectDeal} className="text-gray-500 hover:text-red-400 text-xs">
                <X className="h-3 w-3 mr-1" />Walk Away
              </Button>
            </div>
            <div className="text-xl font-black text-emerald-400">{formatCurrency(selectedOffer.capital)} · {selectedOffer.equity}% equity</div>
            <div className="text-xs text-gray-500">Round {negRound} of {maxNegRounds}</div>
          </div>

          {/* Chat history */}
          {negHistory.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {negHistory.map((msg, i) => (
                <div key={i} className={cn('p-3 rounded-xl text-sm', msg.type === 'investor' ? 'bg-white/5 border border-white/10 text-gray-300' : 'bg-primary/10 border border-primary/20 text-primary ml-8')}>
                  <div className="text-xs font-bold mb-1 opacity-60">{msg.type === 'investor' ? investorDisplayName(msg.sender) : msg.sender}</div>
                  {msg.msg}
                </div>
              ))}
            </div>
          )}

          {/* Voice negotiate */}
          {negRound < maxNegRounds && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 text-center">
              <div className="text-sm text-gray-400">Counter-offer via voice</div>
              {negotiationRecorder.isRecording ? (
                <div className="flex flex-col items-center gap-2">
                  <button onClick={negotiationRecorder.stopRecording} className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center mx-auto">
                    <MicOff className="h-5 w-5 text-white" />
                  </button>
                  <span className="text-red-400 text-xs">{negotiationRecorder.recordingTime}s recording...</span>
                </div>
              ) : (
                <button onClick={negotiationRecorder.startRecording} disabled={!!negotiationRecorder.audioBlob}
                  className={cn('h-12 w-12 rounded-full flex items-center justify-center mx-auto transition-all', negotiationRecorder.audioBlob ? 'bg-green-600/20 border-2 border-green-500' : 'bg-red-600 hover:bg-red-700')}
                >
                  {negotiationRecorder.audioBlob ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Mic className="h-5 w-5 text-white" />}
                </button>
              )}
              {negotiationRecorder.audioBlob && !negotiationRecorder.isRecording && (
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" onClick={negotiationRecorder.resetRecording} className="text-xs text-gray-500 gap-1">
                    <RefreshCw className="h-3 w-3" />Re-record
                  </Button>
                  <Button onClick={onNegotiateAudio} disabled={isNegVoiceSubmitting} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold">
                    {isNegVoiceSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Negotiating...</> : 'Submit Counter-offer'}
                  </Button>
                </div>
              )}
            </div>
          )}

          <Button onClick={() => onAcceptDeal(selectedOffer)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            Accept Current Terms
          </Button>
        </div>
      )}

      {!dealFinalized && (
        <div className="text-center pt-2">
          <Button variant="ghost" onClick={onEndSimulation} className="text-gray-600 hover:text-gray-400 text-xs">
            Skip to Final Report
          </Button>
        </div>
      )}
    </div>
  )
}
