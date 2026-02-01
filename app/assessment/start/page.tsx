'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
import { AlertCircle, CheckCircle2, Clock, Zap, ArrowLeft, PlayCircle, RotateCcw } from 'lucide-react'

interface ExistingAssessment {
  id: string
  attemptNumber: number
  status: string
  currentStage: number
  responsesCount: number
}

export default function AssessmentStartPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [existingAssessment, setExistingAssessment] = useState<ExistingAssessment | null>(null)
  const [canStartNew, setCanStartNew] = useState(false)

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
        }
        
        // Can start new if less than 2 assessments
        setCanStartNew(assessments.length < 2)
      } catch (error) {
        console.error('Error checking assessments:', error)
      } finally {
        setLoading(false)
      }
    }

    checkExistingAssessments()
  }, [router])

  const handleStartNew = async () => {
    setCreating(true)
    try {
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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

  if (loading) {
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

  // Show continue screen if there's an in-progress assessment
  if (existingAssessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
            <p className="text-lg text-muted-foreground">
              You have an assessment in progress. Would you like to continue where you left off?
            </p>
          </div>

          <Card className="mb-8 border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-primary" />
                Assessment In Progress
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
                  Continue Assessment
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Ready to Begin?</h1>
          <p className="text-lg text-muted-foreground">
            You're about to take the War Room Assessment. This comprehensive evaluation will take approximately 90 minutes.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Before You Start</CardTitle>
            <CardDescription>Make sure you have time and are in a focused environment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { icon: Clock, label: 'Time Required', desc: '~90 minutes (no time limit)' },
                { icon: AlertCircle, label: 'Focus Needed', desc: 'Thoughtful responses will give better results' },
                { icon: CheckCircle2, label: 'Honest Feedback', desc: 'There are no "right" answers - be authentic' },
                { icon: Zap, label: 'Real Consequences', desc: 'Your choices affect your business state in the simulation' }
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div key={idx} className="flex gap-3">
                    <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
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

        <Card className="mb-8 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Pro Tip</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You have 2 attempts. Use the first to understand the competencies, and the second to apply what you learned. We'll compare both to show your improvement.
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
            onClick={handleStartNew} 
            className="w-full"
            disabled={creating || !canStartNew}
          >
            {creating ? 'Creating...' : 'Start Assessment →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
