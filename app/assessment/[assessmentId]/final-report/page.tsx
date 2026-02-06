'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import CompetencyCard from '@/src/components/reports/competency-card'
import { CompetencyScore } from '@/src/types/state'
import { Download, Share2, Zap } from 'lucide-react'

export default function FinalReportPage() {
  const params = useParams()
  const assessmentId = params.assessmentId as string
  const [activeTab, setActiveTab] = useState('summary')
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReport() {
      try {
        // Try GET first (existing report)
        let res = await fetch(`/api/assessment/${assessmentId}/report`)
        if (res.ok) {
          const data = await res.json()
          setReport(data.report)
          setLoading(false)
          return
        }

        // If no existing report, generate one via POST
        if (res.status === 404) {
          res = await fetch(`/api/assessment/${assessmentId}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          if (res.ok) {
            const data = await res.json()
            setReport(data.report)
            setLoading(false)
            return
          }
        }

        setError('Failed to load report')
      } catch (err) {
        console.error('Error loading report:', err)
        setError('Failed to load report')
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [assessmentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-48 w-full mb-8" />
          <Skeleton className="h-12 w-full mb-8" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || 'Report not available'}</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Extract report data
  const executiveSummary = report.executiveSummary || {}
  const competencyProfile = report.competencyProfile || {}
  const mistakeAnalysis = report.mistakeAnalysis || {}
  const stageBreakdown = report.stageBreakdown || []
  const recommendations = report.recommendations || []
  const comparison = report.previousAttemptComparison

  // Build competency cards data
  const competencies: CompetencyScore[] = (competencyProfile.scores || []).map((c: any) => ({
    id: c.competencyCode || c.code,
    assessmentId,
    competencyCode: c.competencyCode || c.code,
    competencyName: c.competencyName || c.name,
    score: c.percentageScore ?? c.normalizedScore ?? Math.round((c.currentScore / (c.maxPossibleScore || 1)) * 100),
    levelAchieved: c.levelAchieved || 'L0',
    evidence: c.evidence || [],
    lastUpdated: new Date()
  }))

  const overallScore = executiveSummary.overallScore ?? 0
  const maxScore = executiveSummary.maxScore ?? 100
  const overallPercentage = maxScore > 0 ? Math.round((overallScore / maxScore) * 100) : 0
  const readinessLabel =
    executiveSummary.overallReadiness === 'highly_ready' ? 'Highly Ready' :
    executiveSummary.overallReadiness === 'ready' ? 'Ready' :
    executiveSummary.overallReadiness === 'developing' ? 'Developing' : 'Needs Work'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Your Final Report</h1>
              <p className="text-muted-foreground mt-2">
                {report.generatedAt
                  ? `Generated on ${new Date(report.generatedAt).toLocaleDateString()}`
                  : 'Assessment Report'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" className="justify-start bg-transparent">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overall Score Card */}
        <Card className="card-base mb-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">Overall Score</p>
              <div className="text-6xl font-bold text-primary mb-2">{overallPercentage}</div>
              <Badge className="mb-4">{readinessLabel}</Badge>
              <p className="text-muted-foreground mb-6">
                Based on your performance across {competencies.length} core entrepreneurial competencies
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Badge>{competencies.length} Competencies Assessed</Badge>
                {mistakeAnalysis.mistakesTriggered?.length > 0 && (
                  <Badge variant="outline">{mistakeAnalysis.mistakesTriggered.length} Mistakes Triggered</Badge>
                )}
                {stageBreakdown.length > 0 && (
                  <Badge variant="outline">{stageBreakdown.length} Stages Completed</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="competencies">Competencies</TabsTrigger>
            <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
            <TabsTrigger value="stages">Stages</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          {/* Executive Summary */}
          <TabsContent value="summary" className="space-y-6">
            <Card className="card-base">
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                {executiveSummary.primaryRecommendation && (
                  <p>{executiveSummary.primaryRecommendation}</p>
                )}

                {executiveSummary.keyStrengths?.length > 0 && (
                  <div>
                    <p className="font-semibold text-foreground mb-2">Key Strengths</p>
                    <div className="flex flex-wrap gap-2">
                      {executiveSummary.keyStrengths.map((s: string, i: number) => (
                        <Badge key={i} className="bg-green-100 text-green-800">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {executiveSummary.criticalGaps?.length > 0 && (
                  <div>
                    <p className="font-semibold text-foreground mb-2">Areas for Improvement</p>
                    <div className="flex flex-wrap gap-2">
                      {executiveSummary.criticalGaps.map((g: string, i: number) => (
                        <Badge key={i} variant="outline" className="border-orange-300 text-orange-700">{g}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {recommendations.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
                    <p className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4" />
                      Top Recommendations
                    </p>
                    <ul className="space-y-2">
                      {recommendations.slice(0, 3).map((rec: any, i: number) => (
                        <li key={i} className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">
                            {rec.priority === 'critical' ? '!!' : '>'}
                          </span>
                          <span><strong>{rec.title}:</strong> {rec.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competencies Grid */}
          <TabsContent value="competencies" className="space-y-6">
            {competencies.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {competencies.map((comp) => (
                  <CompetencyCard key={comp.id} competency={comp} />
                ))}
              </div>
            ) : (
              <Card className="card-base">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <p>No competency data available yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Mistake Analysis */}
          <TabsContent value="mistakes" className="space-y-6">
            <Card className="card-base">
              <CardHeader>
                <CardTitle>Mistake Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mistakeAnalysis.mistakesTriggered?.length > 0 ? (
                  <div className="space-y-4">
                    {mistakeAnalysis.totalCompoundedCost > 0 && (
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                        <p className="font-medium text-red-900 dark:text-red-100">
                          Total Compounded Cost: ${mistakeAnalysis.totalCompoundedCost?.toLocaleString()}
                        </p>
                        {mistakeAnalysis.mistakePattern && (
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">{mistakeAnalysis.mistakePattern}</p>
                        )}
                      </div>
                    )}
                    {mistakeAnalysis.mistakesTriggered.map((m: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-red-400 pl-4 py-2">
                        <p className="font-semibold text-foreground">{m.mistakeName || m.mistakeCode}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Triggered at Stage {m.triggeredAtStage}
                          {m.hasCompounded && ' (compounded in later stages)'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No mistakes triggered. Well done!</p>
                )}

                {mistakeAnalysis.mistakesAvoided?.length > 0 && (
                  <div className="mt-6">
                    <p className="font-semibold text-foreground mb-2">Mistakes Avoided</p>
                    <div className="flex flex-wrap gap-2">
                      {mistakeAnalysis.mistakesAvoided.map((m: string, i: number) => (
                        <Badge key={i} className="bg-green-100 text-green-800">{m}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stage Breakdown */}
          <TabsContent value="stages" className="space-y-6">
            {stageBreakdown.length > 0 ? (
              <div className="space-y-4">
                {stageBreakdown.map((stage: any, idx: number) => (
                  <Card key={idx} className="card-base">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Stage {stage.stageNumber}: {stage.stageName}
                        </CardTitle>
                        <Badge variant="outline">
                          {stage.score}/{stage.maxScore} pts
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Questions</p>
                          <p className="font-semibold">{stage.questionsAnswered}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Time</p>
                          <p className="font-semibold">{stage.timeSpentMinutes || '--'} min</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Competencies</p>
                          <p className="font-semibold">{stage.competenciesAssessed?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-base">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <p>No stage data available.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Development Roadmap */}
          <TabsContent value="roadmap" className="space-y-6">
            <Card className="card-base">
              <CardHeader>
                <CardTitle>Development Roadmap</CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="border-l-4 border-primary pl-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-foreground">{rec.title}</p>
                          <Badge variant={rec.priority === 'critical' ? 'destructive' : 'outline'} className="text-xs">
                            {rec.priority}
                          </Badge>
                        </div>
                        {rec.description && (
                          <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        )}
                        {rec.actionItems?.length > 0 && (
                          <ul className="space-y-1">
                            {rec.actionItems.map((action: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">-</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Personalized recommendations will appear here after assessment completion.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attempt Comparison */}
          <TabsContent value="comparison" className="space-y-6">
            <Card className="card-base">
              <CardHeader>
                <CardTitle>Attempt Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {comparison ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Attempt 1</p>
                        <p className="text-3xl font-bold">{comparison.attempt1Score}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Improvement</p>
                        <p className={`text-3xl font-bold ${comparison.improvement > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {comparison.improvement > 0 ? '+' : ''}{comparison.improvement}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Attempt 2</p>
                        <p className="text-3xl font-bold text-primary">{comparison.attempt2Score}</p>
                      </div>
                    </div>

                    {comparison.overallAssessment && (
                      <p className="text-muted-foreground text-center">{comparison.overallAssessment}</p>
                    )}

                    {comparison.competencyChanges?.length > 0 && (
                      <div>
                        <p className="font-semibold text-foreground mb-3">Competency Changes</p>
                        <div className="space-y-2">
                          {comparison.competencyChanges.filter((c: any) => c.improved).map((c: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span>{c.competency}</span>
                              <span className="text-green-600">{c.attempt1Level} - {c.attempt2Level}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {comparison.mistakesFixedInAttempt2?.length > 0 && (
                      <div>
                        <p className="font-semibold text-foreground mb-2">Mistakes Fixed</p>
                        <div className="flex flex-wrap gap-2">
                          {comparison.mistakesFixedInAttempt2.map((m: string, i: number) => (
                            <Badge key={i} className="bg-green-100 text-green-800">{m}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-muted-foreground mb-6">
                      You've only completed one attempt. After completing your second attempt,
                      we'll show you the improvement across all competencies.
                    </p>
                    <Link href="/dashboard">
                      <Button>Start Attempt 2</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <div className="mt-12 flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/results">
            <Button size="lg">
              View All Results
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
