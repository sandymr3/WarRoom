'use client'

import { CompetencyScore } from '@/src/types/state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface CompetencyCardProps {
  competency: CompetencyScore
  showEvidence?: boolean
}

export default function CompetencyCard({ competency, showEvidence = true }: CompetencyCardProps) {
  const [expanded, setExpanded] = useState(false)

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'L2':
        return 'bg-green-500/10 text-green-700'
      case 'L1':
        return 'bg-blue-500/10 text-blue-700'
      default:
        return 'bg-gray-500/10 text-gray-700'
    }
  }

  return (
    <Card className="card-base hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{competency.competencyName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{competency.competencyCode}</p>
          </div>
          <Badge className={getLevelColor(competency.levelAchieved)}>
            {competency.levelAchieved}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Score</span>
            <span className="text-lg font-bold text-primary">{competency.score.toFixed(0)}/100</span>
          </div>
          <Progress value={competency.score} className="h-2" />
        </div>

        {showEvidence && competency.evidence.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Evidence ({competency.evidence.length})
            </button>
            {expanded && (
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {competency.evidence.map((item, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
