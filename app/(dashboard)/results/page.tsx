'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, CheckCircle2, Clock, Play, BarChart3, AlertTriangle } from 'lucide-react'

interface AssessmentResult {
  id: string
  attemptNumber: number
  status: string
  currentStage: number
  startedAt: string | null
  completedAt: string | null
  stages: {
    stageNumber: number
    stageName: string
    completedAt: string | null
    questionsAnswered: number
  }[]
  responses: {
    questionId: string
    rawScore: number | null
    stage: { stageNumber: number; stageName: string } | null
  }[]
  competencyScores: {
    competencyCode: string
    competencyName: string
    normalizedScore: number
    levelAchieved: string
  }[]
  mistakesTriggered: {
    mistakeCode: string
    mistakeName: string
    triggeredAtStage: number
    hasCompounded: boolean
  }[]
}

export default function ResultsPage() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null)

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch('/api/assessment')
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (!res.ok) throw new Error('Failed to fetch assessments')

        const data = await res.json()

        // For each assessment, fetch detailed data
        const detailed = await Promise.all(
          (data.assessments || []).map(async (a: any) => {
            try {
              const detailRes = await fetch(`/api/assessment/${a.id}`)
              if (detailRes.ok) {
                const detailData = await detailRes.json()
                return detailData.assessment
              }
            } catch {
              // ignore
            }
            return a
          })
        )

        setAssessments(detailed)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-64 w-full mb-6" />
          ))}
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stageNames: Record<number, string> = {
    [-2]: 'Ideating',
    [-1]: 'Concepting',
    0: 'Committing',
    1: 'Validating',
    2: 'Scaling',
    3: 'Establishing',
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold">Assessment Results</h1>
              <p className="text-muted-foreground mt-1">Detailed breakdown of all your assessment attempts</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {assessments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">No assessments found. Start your first assessment to see results here.</p>
              <Link href="/assessment/start">
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Start Assessment
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {assessments.map((assessment) => {
              const isCompleted = assessment.status === 'COMPLETED'
              const isExpanded = expandedAttempt === assessment.id
              const totalResponses = assessment.responses?.length || 0
              const completedStages = assessment.stages?.filter((s: any) => s.completedAt)?.length || 0
              const avgScore = assessment.competencyScores?.length > 0
                ? Math.round(assessment.competencyScores.reduce((sum, c) => sum + (c.normalizedScore || 0), 0) / assessment.competencyScores.length)
                : null

              return (
                <Card key={assessment.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">Attempt {assessment.attemptNumber}</CardTitle>
                        <CardDescription>
                          {isCompleted && assessment.completedAt
                            ? `Completed on ${new Date(assessment.completedAt).toLocaleDateString()}`
                            : assessment.startedAt
                              ? `Started on ${new Date(assessment.startedAt).toLocaleDateString()}`
                              : 'Not started'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        {avgScore !== null && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{avgScore}</div>
                            <div className="text-xs text-muted-foreground">Avg Score</div>
                          </div>
                        )}
                        <Badge variant={isCompleted ? 'default' : 'outline'}>
                          {isCompleted ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> {assessment.status?.replace('_', ' ')}</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold">{totalResponses}</div>
                        <div className="text-xs text-muted-foreground">Responses</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold">{completedStages}/6</div>
                        <div className="text-xs text-muted-foreground">Stages</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold">{assessment.competencyScores?.length || 0}</div>
                        <div className="text-xs text-muted-foreground">Competencies</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold">{assessment.mistakesTriggered?.length || 0}</div>
                        <div className="text-xs text-muted-foreground">Mistakes</div>
                      </div>
                    </div>

                    {/* Stage Progress */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Stage Progress</h4>
                      <div className="grid grid-cols-6 gap-2">
                        {[-2, -1, 0, 1, 2, 3].map((stageNum) => {
                          const stage = assessment.stages?.find((s: any) => s.stageNumber === stageNum)
                          const isStageCompleted = stage?.completedAt
                          const isCurrent = !isStageCompleted && assessment.currentStage === stageNum
                          const stageResponses = assessment.responses?.filter((r: any) => r.stage?.stageNumber === stageNum) || []

                          return (
                            <div
                              key={stageNum}
                              className={`text-center p-2 rounded-lg text-xs ${
                                isStageCompleted ? 'bg-green-100 dark:bg-green-950/30 border border-green-200 dark:border-green-800' :
                                isCurrent ? 'bg-blue-100 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800' :
                                'bg-muted/30 border border-border'
                              }`}
                            >
                              <div className="font-semibold truncate">{stageNames[stageNum] || `S${stageNum}`}</div>
                              <div className="text-muted-foreground">
                                {stageResponses.length > 0 ? `${stageResponses.length} Q` : '--'}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Expand/Collapse Details */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedAttempt(isExpanded ? null : assessment.id)}
                      className="w-full"
                    >
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                    </Button>

                    {isExpanded && (
                      <div className="space-y-6 pt-4 border-t border-border">
                        {/* Competency Scores */}
                        {assessment.competencyScores?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Competency Scores
                            </h4>
                            <div className="space-y-2">
                              {assessment.competencyScores.map((c) => (
                                <div key={c.competencyCode} className="flex items-center gap-3">
                                  <span className="text-xs w-8 text-muted-foreground">{c.competencyCode}</span>
                                  <span className="text-sm w-48 truncate">{c.competencyName}</span>
                                  <Progress value={c.normalizedScore || 0} className="flex-1 h-2" />
                                  <Badge variant="outline" className="text-xs w-10 justify-center">
                                    {c.levelAchieved}
                                  </Badge>
                                  <span className="text-sm font-mono w-8 text-right">{c.normalizedScore || 0}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mistakes Triggered */}
                        {assessment.mistakesTriggered?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Mistakes Triggered
                            </h4>
                            <div className="space-y-2">
                              {assessment.mistakesTriggered.map((m, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                  <div>
                                    <span className="text-sm font-medium">{m.mistakeName || m.mistakeCode}</span>
                                    <span className="text-xs text-muted-foreground ml-2">Stage {m.triggeredAtStage}</span>
                                  </div>
                                  {m.hasCompounded && (
                                    <Badge variant="destructive" className="text-xs">Compounded</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      {isCompleted && (
                        <Link href={`/assessment/${assessment.id}/final-report`}>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Full Report
                          </Button>
                        </Link>
                      )}
                      {!isCompleted && assessment.status !== 'NOT_STARTED' && (
                        <Link href={`/assessment/${assessment.id}`}>
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Continue Assessment
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
