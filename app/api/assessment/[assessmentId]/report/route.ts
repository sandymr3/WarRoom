/**
 * Report Generation API Route
 * Generate final assessment reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/src/lib/prisma'
import { authOptions } from '@/src/lib/auth'
import { calculateAllCompetencyScores, calculateOverallScore, getCompetencyRankings } from '@/src/lib/services/scoring-engine'
import { generateMistakeAnalysis, calculateMistakeTotalCost } from '@/src/lib/services/mistake-detector'
import { generateReportInsights } from '@/src/lib/gemini'
import type { StageNumber, QuestionResponse, MistakeTriggered, AssessmentReport } from '@/src/types'

interface RouteParams {
  params: Promise<{ assessmentId: string }>
}

// POST /api/assessment/[assessmentId]/report - Generate final report
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { assessmentId } = await params
    
    // Get assessment with all data
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        stages: { orderBy: { stageNumber: 'asc' } },
        responses: { orderBy: { answeredAt: 'asc' }, include: { stage: { select: { stageNumber: true } } } },
        mistakesTriggered: true,
        competencyScores: true,
        reports: true,
      },
    })
    
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }
    
    if (assessment.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Check if report already exists
    const existingReport = assessment.reports.find((r: any) => r.attemptNumber === assessment.attemptNumber)
    if (existingReport) {
      return NextResponse.json({ report: existingReport })
    }
    
    // Calculate all competency scores
    const allResponses = assessment.responses.map((r: any) => ({
      ...r,
      stageNumber: r.stage?.stageNumber as StageNumber,
      pointsAwarded: r.rawScore || 0,
      responseData: r.responseData as any,
      competenciesAssessed: (r.competenciesAssessed as string[]) || [],
    })) as QuestionResponse[]
    
    const competencyScores = calculateAllCompetencyScores(assessmentId, allResponses)
    const overallScore = calculateOverallScore(competencyScores)
    const rankings = getCompetencyRankings(competencyScores)
    
    // Analyze mistakes
    const triggeredMistakes = assessment.mistakesTriggered.map((m: any) => ({
      ...m,
      mistakeCode: m.mistakeCode as any,
      triggeredAtStage: m.triggeredAtStage as StageNumber,
      immediateImpactApplied: m.immediateImpactApplied as any,
      compoundingImpactsApplied: (m.compoundingImpactsApplied as any[]) || [],
    })) as MistakeTriggered[]
    
    const completedStages = assessment.stages
      .filter((s: any) => s.completedAt)
      .map((s: any) => s.stageNumber as StageNumber)
    
    const mistakeAnalysis = generateMistakeAnalysis(triggeredMistakes, completedStages)
    
    // Generate AI insights
    let aiInsights = null
    try {
      aiInsights = await generateReportInsights(
        competencyScores.map(c => ({
          code: c.competencyCode,
          name: c.competencyName,
          level: c.levelAchieved,
          score: c.percentageScore,
        })),
        triggeredMistakes.map(m => ({
          code: m.mistakeCode,
          name: m.mistakeName,
          cost: calculateMistakeTotalCost(m),
        })),
        overallScore.totalScore,
        overallScore.maxScore
      )
    } catch (error) {
      console.error('Failed to generate AI insights:', error)
    }
    
    // Determine overall readiness
    const overallReadiness = 
      overallScore.percentage >= 80 ? 'highly_ready' :
      overallScore.percentage >= 60 ? 'ready' :
      overallScore.percentage >= 40 ? 'developing' : 'not_ready'
    
    // Build stage breakdown
    const stageBreakdown = assessment.stages.map((stage: any) => {
      const stageResponses = allResponses.filter(r => r.stageNumber === stage.stageNumber)
      const stageScore = stageResponses.reduce((sum, r) => sum + r.pointsAwarded, 0)
      const maxScore = stageResponses.length * 10
      
      return {
        stageNumber: stage.stageNumber as StageNumber,
        stageName: stage.stageName,
        score: stageScore,
        maxScore,
        timeSpentMinutes: stage.durationMinutes,
        questionsAnswered: stageResponses.length,
        competenciesAssessed: Array.from(new Set(
          stageResponses.flatMap(r => r.competenciesAssessed)
        )) as any[],
        highlights: [],
        concerns: [],
      }
    })
    
    // Build recommendations
    const recommendations = [
      ...rankings.weakest.map(code => ({
        priority: 'high' as const,
        area: 'competency' as const,
        title: `Develop ${code}`,
        description: `Focus on building this competency through practice and learning`,
        actionItems: [
          'Study resources related to this competency',
          'Seek mentorship from experienced entrepreneurs',
          'Practice in low-stakes situations',
        ],
        relatedCompetencies: [code],
      })),
      ...triggeredMistakes.slice(0, 2).map(m => ({
        priority: 'critical' as const,
        area: 'mistake' as const,
        title: `Address: ${m.mistakeName}`,
        description: `This mistake cost you significantly - learn to avoid it`,
        actionItems: [
          'Review the decision point that triggered this',
          'Understand the compounding effects',
          'Create personal guidelines to prevent recurrence',
        ],
        relatedMistakes: [m.mistakeCode],
      })),
    ]
    
    // Build report data
    const reportData: Partial<AssessmentReport> = {
      assessmentId,
      attemptNumber: assessment.attemptNumber as 1 | 2,
      generatedAt: new Date(),
      executiveSummary: {
        overallReadiness,
        overallScore: overallScore.totalScore,
        maxScore: overallScore.maxScore,
        keyStrengths: rankings.strongest.map(c => c),
        criticalGaps: rankings.weakest.map(c => c),
        primaryRecommendation: aiInsights?.finalAdvice || 
          'Continue developing your entrepreneurial competencies through practice and learning.',
      },
      competencyProfile: {
        scores: competencyScores,
        strongestCompetencies: rankings.strongest,
        weakestCompetencies: rankings.weakest,
        averageLevel: overallScore.averageLevel,
        radarChartData: competencyScores.map(c => ({
          competency: c.competencyName,
          score: c.percentageScore,
        })),
      },
      mistakeAnalysis: {
        mistakesTriggered: triggeredMistakes,
        mistakesAvoided: mistakeAnalysis.mistakesAvoided,
        totalCompoundedCost: mistakeAnalysis.totalCost,
        worstMistake: mistakeAnalysis.worstMistake ?? undefined,
        mistakePattern: mistakeAnalysis.pattern ?? undefined,
      },
      stageBreakdown,
      recommendations,
    }
    
    // Check for previous attempt comparison
    if (assessment.attemptNumber === 2) {
      const previousAssessment = await prisma.assessment.findFirst({
        where: {
          userId: assessment.userId,
          attemptNumber: 1,
        },
        include: {
          reports: true,
          competencyScores: true,
          mistakesTriggered: true,
        },
      })
      
      if (previousAssessment && previousAssessment.reports[0]) {
        const prevReport = previousAssessment.reports[0].content as any
        const prevCompetencies = previousAssessment.competencyScores
        const prevMistakes = previousAssessment.mistakesTriggered.map((m: any) => m.mistakeCode)
        const currentMistakes = triggeredMistakes.map(m => m.mistakeCode)
        
        reportData.previousAttemptComparison = {
          attempt1Score: prevReport?.executiveSummary?.overallScore || 0,
          attempt2Score: overallScore.totalScore,
          improvement: overallScore.totalScore - (prevReport?.executiveSummary?.overallScore || 0),
          improvementPercentage: 0,
          competencyChanges: competencyScores.map(current => {
            const prev = prevCompetencies.find((p: any) => p.competencyCode === current.competencyCode)
            return {
              competency: current.competencyCode,
              attempt1Level: (prev?.levelAchieved || 'L0') as any,
              attempt2Level: current.levelAchieved,
              improved: prev ? current.levelAchieved > prev.levelAchieved : false,
            }
          }),
          mistakesFixedInAttempt2: prevMistakes.filter((m: any) => !currentMistakes.includes(m)) as any[],
          newMistakesInAttempt2: currentMistakes.filter((m: any) => !prevMistakes.includes(m)) as any[],
          overallAssessment: overallScore.totalScore > (prevReport?.executiveSummary?.overallScore || 0)
            ? 'Significant improvement from first attempt!'
            : 'Similar performance to first attempt - focus on specific areas.',
        }
      }
    }
    
    // Save report
    const report = await prisma.report.create({
      data: {
        assessmentId,
        reportType: 'FINAL',
        content: reportData as any,
      },
    })
    
    return NextResponse.json({ 
      report: {
        ...report,
        ...reportData,
      },
      aiInsights,
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

// GET /api/assessment/[assessmentId]/report - Get existing report
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { assessmentId } = await params
    
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        reports: { orderBy: { generatedAt: 'desc' }, take: 1 },
      },
    })
    
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }
    
    if (assessment.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const report = assessment.reports[0]
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      report: {
        ...report,
        ...(report.content as object),
      },
    })
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}
