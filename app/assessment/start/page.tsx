'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
import { AlertCircle, CheckCircle2, Clock, Zap, ArrowLeft, PlayCircle, RotateCcw, Users } from 'lucide-react'
import PanelSelection from '@/src/components/assessment/panel-selection'

interface ExistingAssessment {
  id: string
  attemptNumber: number
  status: string
  currentStage: number
  responsesCount: number
}

type PageView = 'loading' | 'continue' | 'intro' | 'panel-selection'

export default function AssessmentStartPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [existingAssessment, setExistingAssessment] = useState<ExistingAssessment | null>(null)
  const [canStartNew, setCanStartNew] = useState(false)
  const [pageView, setPageView] = useState<PageView>('loading')

  useEffect(() => {
    async function checkExistingAssessments() {
      try {
        const response = await fetch('/api/assessment')
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch assessments')
        }
        
        const data = await response.json()
        const assessments = data.assessments || []
        
        // Find any in-progress or paused assessment
        const inProgress = assessments.find(
          (a: any) => a.status === 'IN_PROGRESS' || a.status === 'PAUSED'
        )
        
        if (inProgress) {
          setExistingAssessment({
            id: inProgress.id,
            attemptNumber: inProgress.attemptNumber,
            status: inProgress.status,
            currentStage: inProgress.currentStage,
            responsesCount: inProgress._count?.responses || 0,
          })
          setPageView('continue')
        } else {
          setPageView('intro')
        }
        
        // Can start new if less than 2 assessments
        setCanStartNew(assessments.length < 2)
      } catch (error) {
        console.error('Error checking assessments:', error)
        setPageView('intro')
      } finally {
        setLoading(false)
      }
    }

    checkExistingAssessments()
  }, [router])

  const handleProceedToSelection = () => {
    setPageView('panel-selection')
  }

  const handlePanelSelectionComplete = async (selectedPanelists: string[]) => {
    setCreating(true)
    try {
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedPanelists }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create assessment')
      }
      
      const data = await response.json()
      router.push(`/assessment/${data.assessment.id}`)
    } catch (error) {
      console.error('Error creating assessment:', error)
      setCreating(false)
    }
  }

  const handleContinue = () => {
    if (existingAssessment) {
      router.push(`/assessment/${existingAssessment.id}`)
    }
  }

  const getStageName = (stageNumber: number) => {
    const stages: Record<number, string> = {
      [-2]: 'Ideating',
      [-1]: 'Concepting',
      [0]: 'Committing',
      [1]: 'Validating',
      [2]: 'Scaling',
      [3]: 'Establishing',
    }
    return stages[stageNumber] || 'Unknown'
  }

  if (loading || pageView === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto mb-12" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-24 w-full mb-8" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // Show panel selection
  if (pageView === 'panel-selection') {
    return <PanelSelection onComplete={handlePanelSelectionComplete} isLoading={creating} />
  }

  // Show continue screen if there's an in-progress assessment
  if (pageView === 'continue' && existingAssessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Welcome Back, Founder!</h1>
            <p className="text-lg text-muted-foreground">
              Your panel is waiting. Continue your pitch session where you left off.
            </p>
          </div>

          <Card className="mb-8 border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-primary" />
                Pitch Session In Progress
              </CardTitle>
              <CardDescription>Attempt {existingAssessment.attemptNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Stage</p>
                  <p className="font-semibold">{getStageName(existingAssessment.currentStage)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Questions Answered</p>
                  <p className="font-semibold">{existingAssessment.responsesCount}</p>
                </div>
              </div>
              <div className="pt-4">
                <Button onClick={handleContinue} className="w-full" size="lg">
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Return to the War Room
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Intro screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Welcome to the War Room
          </h1>
          <p className="text-lg text-muted-foreground">
            You're about to pitch your startup to a panel of world-class investors, mentors, and leaders. 
            They'll challenge your thinking, question your assumptions, and push you to become a better founder.
          </p>
        </div>

        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              How It Works
            </CardTitle>
            <CardDescription>Your startup simulation experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { icon: Users, label: 'Choose Your Panel', desc: 'Select 6 panelists: 2 mentors, 2 investors, 2 leaders' },
                { icon: Clock, label: 'Pitch Your Startup', desc: 'Answer questions across 6 business stages (~90 minutes)' },
                { icon: AlertCircle, label: 'Face Real Challenges', desc: 'Your decisions have consequences on your startup state' },
                { icon: CheckCircle2, label: 'Get AI Feedback', desc: 'Receive personalized insights from your panel' }
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">🦈 Think Shark Tank, But Better</h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Each panelist has a unique perspective. Some focus on numbers, others on people, 
              and some will challenge your very beliefs. Their advice may conflict — you'll have to choose wisely.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/dashboard">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Button 
            onClick={handleProceedToSelection} 
            className="w-full bg-gradient-to-r from-primary to-yellow-600 hover:from-primary/90 hover:to-yellow-600/90"
            disabled={!canStartNew}
          >
            Assemble Your Panel →
          </Button>
        </div>
        
        {!canStartNew && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            You've used both attempts. View your results on the dashboard.
          </p>
        )}
      </div>
    </div>
  )
}
