'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface NarrativeLine {
  character?: string
  lines: string[]
}

interface NarrativeIntroProps {
  narrative: NarrativeLine
  onComplete: () => void
  stageName?: string
  stageTitle?: string
  autoAdvance?: boolean
  autoAdvanceDelay?: number
}

export function NarrativeIntro({
  narrative,
  onComplete,
  stageName,
  stageTitle,
  autoAdvance = false,
  autoAdvanceDelay = 3000
}: NarrativeIntroProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [showContinue, setShowContinue] = useState(false)

  const currentLine = narrative.lines[currentLineIndex]

  // Typewriter effect
  useEffect(() => {
    if (!currentLine) return

    setIsTyping(true)
    setDisplayedText('')
    let charIndex = 0

    const typeInterval = setInterval(() => {
      if (charIndex < currentLine.length) {
        setDisplayedText(currentLine.slice(0, charIndex + 1))
        charIndex++
      } else {
        clearInterval(typeInterval)
        setIsTyping(false)
        setShowContinue(true)
        
        if (autoAdvance) {
          setTimeout(() => {
            handleAdvance()
          }, autoAdvanceDelay)
        }
      }
    }, 30) // Typing speed

    return () => clearInterval(typeInterval)
  }, [currentLineIndex, currentLine])

  const handleAdvance = () => {
    if (isTyping) {
      // Skip to end of current line
      setDisplayedText(currentLine)
      setIsTyping(false)
      setShowContinue(true)
      return
    }

    if (currentLineIndex < narrative.lines.length - 1) {
      setCurrentLineIndex(prev => prev + 1)
      setShowContinue(false)
    } else {
      onComplete()
    }
  }

  const handleSkipAll = () => {
    onComplete()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-b from-black via-gray-900 to-black z-50 flex items-center justify-center"
      onClick={handleAdvance}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      
      {/* Content */}
      <div className="relative max-w-3xl mx-auto px-8 text-center">
        {/* Stage indicator */}
        {stageName && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="text-primary/60 text-sm font-medium tracking-widest uppercase mb-2">
              {stageName}
            </div>
            {stageTitle && (
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {stageTitle}
              </h1>
            )}
          </motion.div>
        )}

        {/* Character indicator */}
        {narrative.character && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 mb-4">
              <span className="text-2xl font-bold text-primary">
                {narrative.character.charAt(0)}
              </span>
            </div>
            <div className="text-primary/80 text-sm font-medium tracking-wide">
              {narrative.character}
            </div>
          </motion.div>
        )}

        {/* Dialogue text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-[120px] flex items-center justify-center"
        >
          <p className="text-xl md:text-2xl text-white/90 leading-relaxed font-light">
            "{displayedText}"
            {isTyping && (
              <span className="inline-block w-0.5 h-6 bg-primary ml-1 animate-pulse" />
            )}
          </p>
        </motion.div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {narrative.lines.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentLineIndex
                  ? 'bg-primary w-6'
                  : index < currentLineIndex
                  ? 'bg-primary/60'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Continue prompt */}
        <AnimatePresence>
          {showContinue && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white group"
                onClick={handleAdvance}
              >
                {currentLineIndex < narrative.lines.length - 1 ? (
                  <>
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                ) : (
                  <>
                    Begin
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 right-8"
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-white/30 hover:text-white/60"
            onClick={handleSkipAll}
          >
            Skip Intro
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default NarrativeIntro
