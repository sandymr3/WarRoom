'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CompetencyCard from '@/src/components/reports/competency-card'
import { CompetencyScore } from '@/src/types/state'
import { BarChart3, Download, Mail, Share2, Zap } from 'lucide-react'

export default function FinalReportPage() {
  const params = useParams()
  const assessmentId = params.assessmentId as string
  const [activeTab, setActiveTab] = useState('summary')

  // Mock competencies
  const competencies: CompetencyScore[] = Array.from({ length: 16 }, (_, i) => ({
    id: `c${i + 1}`,
    assessmentId,
    competencyCode: `C${i + 1}`,
    competencyName: [
      'Problem Sensing',
      'Market Understanding',
      'Value Articulation',
      'Customer Empathy',
      'Resource Planning',
      'Financial Acumen',
      'Team Building',
      'Adaptability',
      'Risk Assessment',
      'Learning Agility',
      'Customer Retention',
      'Execution Excellence',
      'Product Development',
      'Market Expansion',
      'Stakeholder Alignment',
      'Strategic Vision'
    ][i],
    score: 60 + Math.random() * 35,
    levelAchieved: Math.random() > 0.5 ? 'L2' : 'L1',
    evidence: ['Evidence item 1', 'Evidence item 2'],
    lastUpdated: new Date()
  }))

  const overallScore = (competencies.reduce((sum, c) => sum + c.score, 0) / competencies.length).toFixed(0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Your Final Report</h1>
              <p className="text-muted-foreground mt-2">Assessment completed on January 15, 2024</p>
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
              <div className="text-6xl font-bold text-primary mb-4">{overallScore}</div>
              <p className="text-muted-foreground mb-6">
                Based on your performance across 16 core entrepreneurial competencies
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Badge>16 Competencies Assessed</Badge>
                <Badge variant="outline">2 Attempts Completed</Badge>
                <Badge className="bg-green-100 text-green-800">Ready for Attempt 2</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="competencies">Competencies</TabsTrigger>
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
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
                <p>
                  Your assessment reveals a strong foundation in problem sensing and customer empathy, with particular strength in understanding market needs. You demonstrate solid execution capabilities but would benefit from deepening your financial acumen and team-building skills.
                </p>
                <p>
                  Your risk-taking tendency is a double-edged sword: it enables quick action but can lead to premature scaling decisions. Focus on balancing speed with deliberation in key decisions.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <p className="font-medium text-blue-900 flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4" />
                    Key Insight
                  </p>
                  <p className="text-sm text-blue-800">
                    You excel at identifying problems but need to strengthen your ability to articulate unique value propositions. This gap could impact your ability to differentiate in competitive markets.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competencies Grid */}
          <TabsContent value="competencies" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {competencies.map((comp) => (
                <CompetencyCard key={comp.id} competency={comp} />
              ))}
            </div>
          </TabsContent>

          {/* Decision Analysis */}
          <TabsContent value="decisions" className="space-y-6">
            <Card className="card-base">
              <CardHeader>
                <CardTitle>Decision-Making Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { title: 'Speed vs. Deliberation', analysis: 'You tend to make quick decisions, which is good for agility but sometimes lacks sufficient analysis.' },
                    { title: 'Risk Tolerance', analysis: 'High risk tolerance (8/10). You are willing to take bold bets, which is necessary for entrepreneurship but requires good risk management.' },
                    { title: 'Data vs. Intuition', analysis: 'You balance both, with slight preference for intuition. Validate gut feelings with data when possible.' }
                  ].map((item, idx) => (
                    <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{item.analysis}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leadership Profile */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="card-base">
              <CardHeader>
                <CardTitle>Your Leadership Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Archetype: Visionary Builder</span> - You combine big-picture thinking with a drive to execute. You're energized by creating new markets and solving complex problems.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {[
                    { label: 'Strengths', items: ['Vision', 'Resilience', 'Customer Focus', 'Adaptability'] },
                    { label: 'Growth Areas', items: ['Financial Planning', 'Team Delegation', 'Market Research', 'Risk Management'] }
                  ].map((section, idx) => (
                    <div key={idx}>
                      <p className="font-semibold text-foreground mb-3">{section.label}</p>
                      <ul className="space-y-2">
                        {section.items.map((item, i) => (
                          <li key={i} className="text-sm flex items-center gap-2">
                            <span className="text-primary">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Development Roadmap */}
          <TabsContent value="roadmap" className="space-y-6">
            <Card className="card-base">
              <CardHeader>
                <CardTitle>Development Roadmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { phase: 'Next 30 Days', actions: ['Audit your current financial projections', 'Conduct 10 more customer interviews', 'Document your decision-making framework'] },
                    { phase: 'Next 90 Days', actions: ['Take a financial management course', 'Build a formal risk assessment process', 'Hire your first advisor/mentor'] },
                    { phase: 'Next 6 Months', actions: ['Establish weekly 1:1s with team leads', 'Create quarterly business reviews', 'Build contingency plans for top 5 risks'] }
                  ].map((item, idx) => (
                    <div key={idx} className="border-l-4 border-primary pl-4 py-3">
                      <p className="font-semibold text-foreground mb-2">{item.phase}</p>
                      <ul className="space-y-1">
                        {item.actions.map((action, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">→</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
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
                <p className="text-muted-foreground mb-6">You've only completed one attempt. After completing your second attempt, we'll show you the improvement across all competencies.</p>
                <Link href="/dashboard">
                  <Button>Start Attempt 2</Button>
                </Link>
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
          <Button size="lg" className="justify-center">
            <Mail className="h-4 w-4 mr-2" />
            Email Report
          </Button>
          <Button size="lg" variant="outline" className="justify-center bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </main>
    </div>
  )
}
