'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Panelist, 
  PanelistCategory,
  PANELISTS_BY_CATEGORY, 
  CATEGORY_LABELS, 
  CATEGORY_DESCRIPTIONS,
  SELECTION_RULES 
} from '@/src/lib/panelists'
import { Check, Users, TrendingUp, Crown, ChevronRight, Sparkles, AlertCircle } from 'lucide-react'

interface PanelSelectionProps {
  onComplete: (selectedPanelists: string[]) => void
  isLoading?: boolean
}

const CATEGORY_ICONS: Record<PanelistCategory, typeof Users> = {
  mentor: Sparkles,
  investor: TrendingUp,
  leader: Crown
}

const CATEGORY_COLORS: Record<PanelistCategory, string> = {
  mentor: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
  investor: 'from-green-500/20 to-green-600/5 border-green-500/30',
  leader: 'from-blue-500/20 to-blue-600/5 border-blue-500/30'
}

const CATEGORY_ACCENT: Record<PanelistCategory, string> = {
  mentor: 'bg-purple-500',
  investor: 'bg-green-500',
  leader: 'bg-blue-500'
}

export default function PanelSelection({ onComplete, isLoading }: PanelSelectionProps) {
  const [selectedByCategory, setSelectedByCategory] = useState<Record<PanelistCategory, string[]>>({
    mentor: [],
    investor: [],
    leader: []
  })
  const [expandedPanelist, setExpandedPanelist] = useState<string | null>(null)

  const totalSelected = Object.values(selectedByCategory).flat().length
  const canProceed = SELECTION_RULES.categories.every(
    cat => selectedByCategory[cat].length === SELECTION_RULES.minPerCategory
  )

  const togglePanelist = (category: PanelistCategory, panelistId: string) => {
    setSelectedByCategory(prev => {
      const current = prev[category]
      if (current.includes(panelistId)) {
        // Remove
        return { ...prev, [category]: current.filter(id => id !== panelistId) }
      } else if (current.length < SELECTION_RULES.minPerCategory) {
        // Add
        return { ...prev, [category]: [...current, panelistId] }
      }
      return prev
    })
  }

  const handleComplete = () => {
    const allSelected = Object.values(selectedByCategory).flat()
    onComplete(allSelected)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Assemble Your Panel
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select 2 experts from each category to form your War Room panel. 
            They will challenge your pitch, question your decisions, and push you to think bigger.
          </p>
          
          {/* Progress indicator */}
          <div className="mt-6 flex items-center justify-center gap-4">
            {SELECTION_RULES.categories.map((cat) => {
              const count = selectedByCategory[cat].length
              const Icon = CATEGORY_ICONS[cat]
              return (
                <div 
                  key={cat}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                    count === SELECTION_RULES.minPerCategory 
                      ? "bg-primary/20 text-primary" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium capitalize">{cat}s</span>
                  <Badge variant={count === SELECTION_RULES.minPerCategory ? "default" : "secondary"}>
                    {count}/{SELECTION_RULES.minPerCategory}
                  </Badge>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Category Sections */}
        <div className="space-y-10">
          {SELECTION_RULES.categories.map((category, categoryIndex) => {
            const Icon = CATEGORY_ICONS[category]
            const panelists = PANELISTS_BY_CATEGORY[category]
            const selected = selectedByCategory[category]
            const isComplete = selected.length === SELECTION_RULES.minPerCategory
            
            return (
              <motion.section
                key={category}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-2 rounded-lg", CATEGORY_ACCENT[category])}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      {CATEGORY_LABELS[category]}
                      {isComplete && <Check className="h-5 w-5 text-green-500" />}
                    </h2>
                    <p className="text-sm text-muted-foreground">{CATEGORY_DESCRIPTIONS[category]}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {panelists.map((panelist) => {
                    const isSelected = selected.includes(panelist.id)
                    const isDisabled = !isSelected && isComplete
                    const isExpanded = expandedPanelist === panelist.id
                    
                    return (
                      <motion.div
                        key={panelist.id}
                        layout
                        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                      >
                        <Card 
                          className={cn(
                            "relative cursor-pointer transition-all duration-200 overflow-hidden h-full",
                            isSelected && `bg-gradient-to-br ${CATEGORY_COLORS[category]} border-2`,
                            isDisabled && "opacity-50 cursor-not-allowed",
                            !isSelected && !isDisabled && "hover:border-primary/50"
                          )}
                          onClick={() => !isDisabled && togglePanelist(category, panelist.id)}
                        >
                          {/* Selection indicator */}
                          {isSelected && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1"
                            >
                              <Check className="h-4 w-4" />
                            </motion.div>
                          )}

                          <CardHeader className="pb-2">
                            <div className="flex items-start gap-3">
                              {/* Avatar */}
                              <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0",
                                CATEGORY_ACCENT[category]
                              )}>
                                {panelist.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base leading-tight">
                                  {panelist.name}
                                </CardTitle>
                                <CardDescription className="text-xs line-clamp-2 mt-1">
                                  {panelist.role}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {panelist.bio}
                            </p>
                            
                            {/* Primary lens badge */}
                            <Badge variant="outline" className="text-xs">
                              {panelist.primaryLens.length > 30 
                                ? panelist.primaryLens.substring(0, 30) + '...'
                                : panelist.primaryLens
                              }
                            </Badge>

                            {/* Expand button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedPanelist(isExpanded ? null : panelist.id)
                              }}
                              className="mt-3 text-xs text-primary flex items-center gap-1 hover:underline"
                            >
                              {isExpanded ? 'Show less' : 'Learn more'}
                              <ChevronRight className={cn(
                                "h-3 w-3 transition-transform",
                                isExpanded && "rotate-90"
                              )} />
                            </button>

                            {/* Expanded details */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-3 space-y-3 border-t mt-3">
                                    <div>
                                      <p className="text-xs font-medium mb-1">Challenges you with:</p>
                                      <ul className="text-xs text-muted-foreground space-y-1">
                                        {panelist.challengeQuestions.slice(0, 2).map((q, i) => (
                                          <li key={i} className="flex items-start gap-1">
                                            <span className="text-primary">•</span>
                                            <span className="italic">"{q}"</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {panelist.characteristics.slice(0, 2).map((char, i) => (
                                        <Badge key={i} variant="secondary" className="text-[10px]">
                                          {char}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>
            )
          })}
        </div>

        {/* Continue button */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          {!canProceed && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Select 2 panelists from each category to continue</span>
            </div>
          )}
          <Button 
            size="lg" 
            onClick={handleComplete}
            disabled={!canProceed || isLoading}
            className="px-8 py-6 text-lg"
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Preparing your pitch session...
              </>
            ) : (
              <>
                Enter the War Room
                <ChevronRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
