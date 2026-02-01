'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
import { Play, RotateCcw, CheckCircle2, Clock, LogOut } from 'lucide-react'

interface Attempt {
  id: string | null
  number: number
  status: string
  score: number | null
  date: string | null
  duration: number | null
  currentStage: number | null
  stagesCompleted: number
  responsesCount: number
}

interface DashboardData {
  user: {
    name: string
    email: string
  }
  attempts: Attempt[]
  stats: {
    competenciesAssessed: number
    bestScore: number | null
    attemptsCompleted: number
    totalAttempts: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('/api/dashboard')
        
        if (response.status === 401) {
          router.push('/login')
          return
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        
        const dashboardData = await response.json()
        setData(dashboardData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [router])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  if (loading) {
    return <DashboardSkeleton />
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

  if (!data) return null

  const { user, attempts, stats } = data

  // Determine if user can start assessment
  const attempt1 = attempts.find(a => a.number === 1)
  const canStartAttempt1 = attempt1?.status === 'not-started'
  const canContinueAttempt1 = attempt1?.status === 'in-progress'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user.name?.split(' ')[0] || 'User'}!</h1>
              <p className="text-muted-foreground mt-1">Ready to assess your entrepreneurial skills?</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.competenciesAssessed}</div>
                <p className="text-sm text-muted-foreground mt-1">Competencies Assessed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {stats.bestScore !== null ? stats.bestScore : '—'}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Your Best Score</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {stats.attemptsCompleted}/{stats.totalAttempts}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Attempts Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Attempts */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Your Assessment Attempts</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {attempts.map((attempt) => {
              const isCompleted = attempt.status === 'completed'
              const isInProgress = attempt.status === 'in-progress'
              const isNotStarted = attempt.status === 'not-started'
              const isLocked = attempt.number === 2 && attempt1?.status !== 'completed'

              return (
                <Card key={attempt.number} className={isLocked ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>Attempt {attempt.number}</CardTitle>
                        <CardDescription>
                          {isCompleted && `Completed on ${attempt.date}`}
                          {isNotStarted && attempt.number === 1 && 'Ready to start'}
                          {isNotStarted && attempt.number === 2 && 'Complete Attempt 1 first'}
                          {isInProgress && 'In progress...'}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          isCompleted
                            ? 'default'
                            : isNotStarted
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {isCompleted && (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </>
                        )}
                        {isNotStarted && (isLocked ? 'Locked' : 'Not Started')}
                        {isInProgress && (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            In Progress
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isCompleted && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Score</span>
                          <span className="text-2xl font-bold text-primary">{attempt.score ?? '—'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Duration</span>
                          <span>{attempt.duration ? `${attempt.duration} minutes` : '—'}</span>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Link href={`/assessment/${attempt.id}/report`} className="flex-1">
                            <Button variant="outline" className="w-full bg-transparent">
                              View Report
                            </Button>
                          </Link>
                          {attempt.number === 1 && attempts[1]?.status === 'not-started' && (
                            <Link href="/assessment/start" className="flex-1">
                              <Button className="w-full">
                                Start Attempt 2
                                <Play className="h-4 w-4 ml-2" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                    {isNotStarted && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {isLocked
                            ? 'You can start your second attempt after completing the first one.'
                            : 'Take our comprehensive assessment to evaluate your entrepreneurial competencies.'}
                        </p>
                        {isLocked ? (
                          <Button disabled className="w-full">
                            Locked
                          </Button>
                        ) : (
                          <Link href="/assessment/start" className="block">
                            <Button className="w-full">
                              Start Assessment
                              <Play className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                    {isInProgress && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Continue your assessment where you left off.
                        </p>
                        <Link href={`/assessment/${attempt.id}`} className="block">
                          <Button className="w-full">
                            Continue Assessment
                            <RotateCcw className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Call to Action */}
        {canStartAttempt1 && (
          <Card className="bg-primary text-primary-foreground border-0">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Ready to Begin?</h3>
                <p className="mb-6 opacity-90">
                  Take our comprehensive assessment to evaluate your entrepreneurial competencies. It typically takes about 90 minutes.
                </p>
                <Link href="/assessment/start">
                  <Button size="lg" variant="secondary">
                    Start Assessment Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Assessment CTA */}
        {canContinueAttempt1 && (
          <Card className="bg-primary text-primary-foreground border-0">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Continue Your Journey</h3>
                <p className="mb-6 opacity-90">
                  You have an assessment in progress. Pick up where you left off!
                </p>
                <Link href={`/assessment/${attempt1?.id}`}>
                  <Button size="lg" variant="secondary">
                    Continue Assessment
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-80" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-12">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Skeleton className="h-9 w-12 mx-auto mb-1" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
