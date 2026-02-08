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
import { Play, RotateCcw, CheckCircle2, Clock, LogOut, BarChart3, Target, Crown, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="py-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name?.split(' ')[0] || 'User'}!</h1>
        <p className="text-muted-foreground mt-1">Ready to assess your entrepreneurial skills and face the panel?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Competencies</p>
                <div className="text-2xl font-bold text-primary">{stats.competenciesAssessed}</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Target className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Score</p>
                <div className="text-2xl font-bold text-primary">
                  {stats.bestScore !== null ? stats.bestScore : '—'}
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600">
                <Crown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion</p>
                <div className="text-2xl font-bold text-primary">
                  {stats.attemptsCompleted}/{stats.totalAttempts}
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Assessment Attempts */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Your Assessment Attempts
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {attempts.map((attempt) => {
              const isCompleted = attempt.status === 'completed'
              const isInProgress = attempt.status === 'in-progress'
              const isNotStarted = attempt.status === 'not-started'
              const isLocked = attempt.number === 2 && attempt1?.status !== 'completed'

              return (
                <Card key={attempt.number} className={cn(
                  "relative overflow-hidden transition-all hover:shadow-md",
                  isLocked ? 'opacity-60 grayscale bg-muted/30' : 'bg-card'
                )}>
                  {isCompleted && (
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="absolute top-2 right-[-24px] bg-green-500 text-white text-[10px] font-bold py-1 px-8 rotate-45">
                        DONE
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Attempt {attempt.number}</CardTitle>
                      <Badge
                        variant={
                          isCompleted
                            ? 'default'
                            : isNotStarted
                              ? 'secondary'
                              : 'outline'
                        }
                        className="font-normal"
                      >
                        {isCompleted && 'Completed'}
                        {isNotStarted && (isLocked ? 'Locked' : 'Available')}
                        {isInProgress && 'In Progress'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {isCompleted && `Finished on ${attempt.date}`}
                      {isNotStarted && attempt.number === 1 && 'Ready to begin your journey'}
                      {isNotStarted && attempt.number === 2 && 'Unlock after Attempt 1'}
                      {isInProgress && 'Resume where you left off'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {isCompleted && (
                      <div className="space-y-4">
                        <div className="flex items-end justify-between">
                          <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Score</span>
                            <div className="text-3xl font-bold text-primary">{attempt.score ?? '—'}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Time</span>
                            <div className="text-sm font-medium">{attempt.duration ? `${attempt.duration}m` : '—'}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Link href={`/assessment/${attempt.id}/report`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              View Report
                            </Button>
                          </Link>
                          {attempt.number === 1 && attempts[1]?.status === 'not-started' && (
                            <Link href="/assessment/start" className="flex-1">
                              <Button size="sm" className="w-full">
                                Start Next
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                    {isNotStarted && (
                      <div className="space-y-4">
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/20 w-0" />
                        </div>
                        {isLocked ? (
                          <Button disabled variant="outline" size="sm" className="w-full">
                            Locked
                          </Button>
                        ) : (
                          <Link href="/assessment/start" className="block">
                            <Button size="sm" className="w-full group">
                              Start Assessment
                              <Play className="h-3 w-3 ml-2 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                    {isInProgress && (
                      <div className="space-y-4">
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-1/2" />
                        </div>
                        <Link href={`/assessment/${attempt.id}`} className="block">
                          <Button size="sm" className="w-full group">
                            Continue
                            <RotateCcw className="h-3 w-3 ml-2 group-hover:rotate-180 transition-transform duration-500" />
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

        {/* Info / CTA Column */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Tips for Founders
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>• Your panel consists of conflicting archetypes. Mentors want growth, Investors want profit.</p>
              <p>• Every decision impacts your startup state (Cash, Team, Product).</p>
              <p>• Don't rush — deep thinking often leads to better scores.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Support</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground mb-4">Need help with the assessment or have questions about your results?</p>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
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
