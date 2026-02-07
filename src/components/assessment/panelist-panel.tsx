'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Panelist, getPanelistsByIds, CATEGORY_LABELS } from '@/src/lib/panelists'
import { cn } from '@/lib/utils'
import { MessageSquare, Sparkles, TrendingUp, Crown } from 'lucide-react'

interface PanelistPanelProps {
  panelistIds: string[]
  activePanelistId?: string | null
  onPanelistClick?: (panelistId: string) => void
  className?: string
}

const CATEGORY_COLORS = {
  mentor: 'bg-purple-500',
  investor: 'bg-green-500',
  leader: 'bg-blue-500'
}

const CATEGORY_ICONS = {
  mentor: Sparkles,
  investor: TrendingUp,
  leader: Crown
}

export default function PanelistPanel({ 
  panelistIds, 
  activePanelistId, 
  onPanelistClick,
  className 
}: PanelistPanelProps) {
  const panelists = getPanelistsByIds(panelistIds)
  
  // Group by category for display
  const grouped = panelists.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {} as Record<string, Panelist[]>)

  return (
    <div className={cn("flex flex-wrap gap-2 items-center justify-center", className)}>
      {Object.entries(grouped).map(([category, categoryPanelists]) => (
        <div key={category} className="flex items-center gap-1">
          {categoryPanelists.map((panelist) => {
            const isActive = activePanelistId === panelist.id
            return (
              <motion.div
                key={panelist.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <button
                  onClick={() => onPanelistClick?.(panelist.id)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all",
                    CATEGORY_COLORS[panelist.category as keyof typeof CATEGORY_COLORS],
                    isActive && "ring-2 ring-offset-2 ring-yellow-400 scale-110",
                    "hover:opacity-90"
                  )}
                  title={`${panelist.name} - ${panelist.role}`}
                >
                  {panelist.avatar}
                </button>
                
                {/* Active indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
                    >
                      <MessageSquare className="w-2.5 h-2.5 text-yellow-900" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// Larger version showing panelist info during their question
interface ActivePanelistDisplayProps {
  panelist: Panelist
  message?: string
  isThinking?: boolean
}

export function ActivePanelistDisplay({ panelist, message, isThinking }: ActivePanelistDisplayProps) {
  const Icon = CATEGORY_ICONS[panelist.category as keyof typeof CATEGORY_ICONS]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-xl p-4 mb-4 shadow-lg"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div 
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0",
            CATEGORY_COLORS[panelist.category as keyof typeof CATEGORY_COLORS]
          )}
        >
          {panelist.avatar}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{panelist.name}</h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs text-white",
              CATEGORY_COLORS[panelist.category as keyof typeof CATEGORY_COLORS]
            )}>
              {CATEGORY_LABELS[panelist.category as keyof typeof CATEGORY_LABELS]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{panelist.role}</p>
          
          {/* Message or thinking indicator */}
          {(message || isThinking) && (
            <div className="mt-3 bg-muted/50 rounded-lg p-3">
              {isThinking ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-current rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-current rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-current rounded-full"
                    />
                  </div>
                  <span className="text-sm italic">Considering your response...</span>
                </div>
              ) : (
                <p className="text-sm italic">"{message}"</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Lens indicator */}
      <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="w-3 h-3" />
        <span>Lens: {panelist.primaryLens}</span>
      </div>
    </motion.div>
  )
}

// Panel feedback component showing multiple panelists reacting
interface PanelistFeedbackProps {
  panelists: Panelist[]
  reactions: Record<string, { type: 'positive' | 'negative' | 'neutral'; comment?: string }>
}

export function PanelistFeedback({ panelists, reactions }: PanelistFeedbackProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {panelists.map((panelist) => {
        const reaction = reactions[panelist.id]
        if (!reaction) return null
        
        return (
          <motion.div
            key={panelist.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "p-3 rounded-lg border",
              reaction.type === 'positive' && "bg-green-500/10 border-green-500/30",
              reaction.type === 'negative' && "bg-red-500/10 border-red-500/30",
              reaction.type === 'neutral' && "bg-muted border-muted-foreground/20"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs",
                  CATEGORY_COLORS[panelist.category as keyof typeof CATEGORY_COLORS]
                )}
              >
                {panelist.avatar}
              </div>
              <span className="font-medium text-sm">{panelist.name}</span>
            </div>
            {reaction.comment && (
              <p className="text-sm text-muted-foreground italic">"{reaction.comment}"</p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
