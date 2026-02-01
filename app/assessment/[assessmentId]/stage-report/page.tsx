'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import CompetencyCard from '@/src/components/reports/competency-card'
import { CompetencyScore } from '@/src/types/state'
import { ArrowRight, BarChart3, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'

export default function StageReportPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const assessmentId = params.assessmentId as string
  const stage = searchParams.get('stage') || '-2'

  // Mock data
  const competencies: CompetencyScore[] = [
    {
      id: '1',
      assessmentId,
      competencyCode: 'C1',
      competencyName: 'Problem Sensing',
      score: 78,
      levelAchieved: 'L2',
      evidence: ['Clearly articulated market opportunity', 'Validated with 5+ potential customers'],
      lastUpdated: new Date()
    },
    {
      id: '2',
      assessmentId,
      competencyCode: 'C2',
      competencyName: 'Market Understanding',
      score: 65,
      levelAchieved: 'L1',
      evidence: ['Limited competitive analysis', 'Some TAM estimation'],
      lastUpdated: new Date()
    },
    {
      id: '3',
      assessmentId,
      competencyCode: 'C3',
      competencyName: 'Value Articulation',
      score: 72,
      levelAchieved: 'L1',
      evidence: ['Clear value prop stated', 'Could be more specific'],
      lastUpdated: new Date()
    }
  ]

  const mistakes = [
    {
      name: 'Premature Scaling',
      triggered: 'Question 8',
      impact: 'Burnout risk detected',
      severity: 'high'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard" className="inline-block mb-4">
            <Button variant="outline" size="sm">
              ← Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Stage {stage} Report</h1>
          <p className="text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 inline mr-2" />
            Completed in 18 minutes
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Financial Snapshot */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Financial Snapshot</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {[
              { label: 'Capital', value: '$50K', icon: '💰' },
              { label: 'Revenue', value: '$8K/mo', icon: '📈', positive: true },
              { label: 'Burn Rate', value: '$4K/mo', icon: '🔥', negative: true },
              { label: 'Runway', value: '12.5mo', icon: '⏰' }
            ].map((metric, idx) => (
              <Card key={idx} className="card-base">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl mb-2">{metric.icon}</div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className={`text-2xl font-bold mt-2 ${metric.positive ? 'text-green-600' : metric.negative ? 'text-red-600' : 'text-primary'}`}>
                      {metric.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Competency Scores */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Competency Scores</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {competencies.map((comp) => (
              <CompetencyCard key={comp.id} competency={comp} />
            ))}
          </div>
        </section>

        {/* Mistakes Triggered */}
        {mistakes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Mistakes Triggered</h2>
            <div className="space-y-3">
              {mistakes.map((mistake, idx) => (
                <Card key={idx} className="card-base border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900">{mistake.name}</h3>
                        <p className="text-sm text-red-800 mt-1">Triggered: {mistake.triggered}</p>
                        <p className="text-sm text-red-700 mt-1">Impact: {mistake.impact}</p>
                      </div>
                      <Badge variant="destructive" className="flex-shrink-0">
                        High Risk
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* AI Justification */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">AI Analysis</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                title: 'Positive Evidence',
                items: ['Clear problem identification', 'Validated market need', 'Strong founder motivation'],
                icon: TrendingUp,
                color: 'bg-green-50 border-green-200'
              },
              {
                title: 'Improvement Areas',
                items: ['Limited competitive analysis', 'Financial projections need refinement', 'Need more team details'],
                icon: AlertTriangle,
                color: 'bg-yellow-50 border-yellow-200'
              },
              {
                title: 'Patterns Noticed',
                items: ['Risk-taking tendency', 'Quick decision maker', 'Customer-focused approach'],
                icon: BarChart3,
                color: 'bg-blue-50 border-blue-200'
              }
            ].map((section, idx) => {
              const Icon = section.icon
              return (
                <Card key={idx} className={`card-base ${section.color}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <div className="flex gap-4 justify-center">
          <Link href={`/assessment/${assessmentId}`}>
            <Button variant="outline" size="lg">
              Continue Assessment
            </Button>
          </Link>
          <Link href={`/assessment/${assessmentId}/final-report`}>
            <Button size="lg">
              View Final Report
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
