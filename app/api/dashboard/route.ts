/**
 * Dashboard API Route
 * Fetches user's dashboard data including assessments and stats
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/src/lib/prisma'
import { authOptions } from '@/src/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    // Fetch user's assessments with related data
    const assessments = await prisma.assessment.findMany({
      where: { userId: session.user.id },
      orderBy: { attemptNumber: 'asc' },
      include: {
        stages: {
          select: {
            stageNumber: true,
            stageName: true,
            completedAt: true,
          },
        },
        competencyScores: {
          select: {
            competencyCode: true,
            normalizedScore: true,
          },
        },
        _count: {
          select: { responses: true },
        },
      },
    })

    // Transform assessments into attempt format
    const attempts = assessments.map((assessment) => {
      // Calculate overall score from competency scores
      const scores = assessment.competencyScores
        .map((cs) => cs.normalizedScore)
        .filter((score): score is number => score !== null && score !== undefined)
      
      const averageScore = scores.length > 0 
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : null

      // Calculate duration in minutes
      let durationMinutes = assessment.totalDurationMinutes
      if (!durationMinutes && assessment.startedAt && assessment.completedAt) {
        durationMinutes = Math.round(
          (new Date(assessment.completedAt).getTime() - new Date(assessment.startedAt).getTime()) / 60000
        )
      }

      // Normalize status for frontend
      const normalizedStatus = assessment.status.toLowerCase().replace(/_/g, '-')

      return {
        id: assessment.id,
        number: assessment.attemptNumber,
        status: normalizedStatus,
        score: averageScore,
        date: assessment.completedAt 
          ? new Date(assessment.completedAt).toISOString().split('T')[0]
          : null,
        duration: durationMinutes,
        currentStage: assessment.currentStage,
        stagesCompleted: assessment.stages.filter((s) => s.completedAt).length,
        responsesCount: assessment._count.responses,
      }
    })

    // Define attempt type for placeholders
    type AttemptType = {
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

    // If user has no assessments or only 1, add placeholder for attempt 2
    const normalizedAttempts: AttemptType[] = []
    
    // Add attempt 1
    const attempt1 = attempts.find((a) => a.number === 1)
    if (attempt1) {
      normalizedAttempts.push(attempt1)
    } else {
      normalizedAttempts.push({
        id: null,
        number: 1,
        status: 'not-started',
        score: null,
        date: null,
        duration: null,
        currentStage: null,
        stagesCompleted: 0,
        responsesCount: 0,
      })
    }

    // Add attempt 2
    const attempt2 = attempts.find((a) => a.number === 2)
    if (attempt2) {
      normalizedAttempts.push(attempt2)
    } else {
      normalizedAttempts.push({
        id: null,
        number: 2,
        status: 'not-started',
        score: null,
        date: null,
        duration: null,
        currentStage: null,
        stagesCompleted: 0,
        responsesCount: 0,
      })
    }

    // Calculate stats
    const completedAttempts = normalizedAttempts.filter((a) => a.status === 'completed')
    const bestScore = completedAttempts.length > 0
      ? Math.max(...completedAttempts.map((a) => a.score ?? 0))
      : null

    // Count unique competencies assessed
    const allCompetencyCodes = new Set(
      assessments.flatMap((a) => a.competencyScores.map((cs) => cs.competencyCode))
    )

    const stats = {
      competenciesAssessed: allCompetencyCodes.size || 16,
      bestScore,
      attemptsCompleted: completedAttempts.length,
      totalAttempts: 2,
    }

    return NextResponse.json({
      user: {
        name: user?.name || 'User',
        email: user?.email,
      },
      attempts: normalizedAttempts,
      stats,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
