'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, TrendingDown, TrendingUp, Clock, Users, DollarSign, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ConsequenceItem {
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  label: string
  value: string | number
  icon?: 'money' | 'time' | 'team' | 'customers' | 'warning' | 'success'
  description?: string
}

interface ConsequenceDisplayProps {
  consequences: ConsequenceItem[]
  title?: string
  subtitle?: string
  showAnimation?: boolean
  onComplete?: () => void
  autoAdvanceDelay?: number
}

const iconMap = {
  money: DollarSign,
  time: Clock,
  team: Users,
  customers: Users,
  warning: AlertTriangle,
  success: CheckCircle2
}

export function ConsequenceDisplay({
  consequences,
  title = "Consequence",
  subtitle,
  showAnimation = true,
  onComplete,
  autoAdvanceDelay = 2000
}: ConsequenceDisplayProps) {
  
  const positiveConsequences = consequences.filter(c => c.type === 'positive')
  const negativeConsequences = consequences.filter(c => c.type === 'negative' || c.type === 'warning')
  const neutralConsequences = consequences.filter(c => c.type === 'neutral')

  return (
    <motion.div
      initial={showAnimation ? { opacity: 0, scale: 0.95 } : false}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>

      {/* Consequences Grid */}
      <div className="p-6 space-y-4">
        {/* Positive outcomes */}
        {positiveConsequences.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-500">
              <TrendingUp className="h-4 w-4" />
              Positive Impact
            </div>
            <div className="grid gap-2">
              {positiveConsequences.map((consequence, index) => (
                <ConsequenceCard
                  key={index}
                  consequence={consequence}
                  index={index}
                  showAnimation={showAnimation}
                />
              ))}
            </div>
          </div>
        )}

        {/* Negative outcomes */}
        {negativeConsequences.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-red-500">
              <TrendingDown className="h-4 w-4" />
              {negativeConsequences.some(c => c.type === 'warning') ? 'Risks & Warnings' : 'Negative Impact'}
            </div>
            <div className="grid gap-2">
              {negativeConsequences.map((consequence, index) => (
                <ConsequenceCard
                  key={index}
                  consequence={consequence}
                  index={index + positiveConsequences.length}
                  showAnimation={showAnimation}
                />
              ))}
            </div>
          </div>
        )}

        {/* Neutral outcomes */}
        {neutralConsequences.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Other Effects
            </div>
            <div className="grid gap-2">
              {neutralConsequences.map((consequence, index) => (
                <ConsequenceCard
                  key={index}
                  consequence={consequence}
                  index={index + positiveConsequences.length + negativeConsequences.length}
                  showAnimation={showAnimation}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

interface ConsequenceCardProps {
  consequence: ConsequenceItem
  index: number
  showAnimation: boolean
}

function ConsequenceCard({ consequence, index, showAnimation }: ConsequenceCardProps) {
  const Icon = consequence.icon ? iconMap[consequence.icon] : null
  
  const bgColor = {
    positive: 'bg-green-500/10 border-green-500/20',
    negative: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    neutral: 'bg-muted/50 border-border'
  }

  const textColor = {
    positive: 'text-green-500',
    negative: 'text-red-500',
    warning: 'text-yellow-500',
    neutral: 'text-foreground'
  }

  return (
    <motion.div
      initial={showAnimation ? { opacity: 0, x: -20 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        bgColor[consequence.type]
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn('p-1.5 rounded-md bg-background/50', textColor[consequence.type])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <div className="text-sm font-medium text-foreground">
            {consequence.label}
          </div>
          {consequence.description && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {consequence.description}
            </div>
          )}
        </div>
      </div>
      <div className={cn('text-sm font-semibold', textColor[consequence.type])}>
        {typeof consequence.value === 'number' && consequence.value > 0 ? '+' : ''}
        {consequence.value}
      </div>
    </motion.div>
  )
}

export default ConsequenceDisplay
