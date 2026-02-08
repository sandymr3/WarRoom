/**
 * Stage Completion API Route
 * Handle stage transitions and generate stage reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/src/lib/prisma'
import { authOptions } from '@/src/lib/auth'
import { getStageConfig, getNextStage, getFirstQuestionOfStage } from '@/src/lib/services/question-engine'
import { calculateAllCompetencyScores } from '@/src/lib/services/scoring-engine'
import { applyCompoundingConsequences } from '@/src/lib/services/consequence-engine'
import { generateStageFeedback } from '@/src/lib/gemini'
import type { StageNumber, QuestionResponse, MistakeTriggered, MistakeCode } from '@/src/types'

interface RouteParams {
  params: Promise<{ assessmentId: string }>
}

// POST /api/assessment/[assessmentId]/complete-stage - Complete current stage
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { assessmentId } = await params
    
    // Get assessment with all related data
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        stages: { orderBy: { stageNumber: 'desc' } },
        responses: {
          include: { stage: { select: { stageNumber: true } } },
        },
        mistakesTriggered: true,
        competencyScores: true,
      },
    })
    
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }
    
    if (assessment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const currentStage = assessment.currentStage as StageNumber
    const stageConfig = getStageConfig(currentStage)
    
    // Get current state from Assessment-level fields (updated on each response),
    // with fallback to latest stage snapshot
    const stageSnapshot = (assessment.stages[0]?.stateSnapshot as any) || {}
    const currentState: any = {
      financial: assessment.financialState || stageSnapshot.financial || {},
      team: assessment.teamState || stageSnapshot.team || {},
      customers: assessment.customerState || stageSnapshot.customers || {},
      product: assessment.productState || stageSnapshot.product || {},
      market: assessment.marketState || stageSnapshot.market || {},
      operations: (assessment as any).operationsState || stageSnapshot.operations || {
        processCount: 0,
        automationLevel: 'manual',
        systemsBuilt: [],
        founderDependency: 100
      },
      mistakesTriggered: assessment.mistakesTriggered.map((m: any) => m.mistakeCode as MistakeCode),
      compoundedLosses: (assessment as any).compoundedLosses || 0,
      decisionsLog: []
    }
    
    // Calculate competency scores for this stage
    const stageResponses = assessment.responses
      .filter((r: any) => r.stage?.stageNumber === currentStage)
      .map((r: any) => ({
        ...r,
        stageNumber: r.stage?.stageNumber as StageNumber,
        responseData: r.responseData as any,
        competenciesAssessed: (r.competenciesAssessed as string[]) || [],
      })) as QuestionResponse[]
    
    const competencyScores = calculateAllCompetencyScores(assessmentId, stageResponses)
    
    // Save/update competency scores
    for (const score of competencyScores) {
      await prisma.competencyScore.upsert({
        where: {
          assessmentId_competencyCode: {
            assessmentId,
            competencyCode: score.competencyCode,
          },
        },
        create: {
          assessmentId,
          competencyCode: score.competencyCode,
          competencyName: score.competencyName,
          rawScore: score.currentScore,
          normalizedScore: Math.round((score.currentScore / score.maxPossibleScore) * 100),
          levelAchieved: score.levelAchieved,
          evidence: score.evidence as any,
        },
        update: {
          rawScore: score.currentScore,
          normalizedScore: Math.round((score.currentScore / score.maxPossibleScore) * 100),
          levelAchieved: score.levelAchieved,
          evidence: score.evidence as any,
        },
      })
    }
    
    // Get next stage
    const nextStage = getNextStage(currentStage)
    const isAssessmentComplete = nextStage === null
    
    // Apply compounding consequences for mistakes
    const triggeredMistakes = assessment.mistakesTriggered.map((m: any) => ({
      ...m,
      mistakeCode: m.mistakeCode as any,
      triggeredAtStage: m.triggeredAtStage as StageNumber,
      immediateImpactApplied: m.immediateImpact as any,
      compoundingImpactsApplied: [] as any[],
    })) as MistakeTriggered[]
    
    let newState = currentState
    let compoundingCost = 0
    
    if (nextStage !== null && triggeredMistakes.length > 0) {
      const consequences = applyCompoundingConsequences(
        currentState,
        triggeredMistakes,
        nextStage
      )
      newState = consequences.newState
      compoundingCost = consequences.totalCompoundedCost
      
      // Update mistake records with compounding impacts
      for (const updatedMistake of consequences.updatedMistakes) {
        await prisma.mistakeTriggered.update({
          where: { id: updatedMistake.id },
          data: {
            hasCompounded: true,
            compoundedAtStage: nextStage,
            compoundedEffect: updatedMistake.compoundingImpactsApplied as any,
          },
        })
      }
    }
    
    // Generate AI feedback for stage
    let stageFeedback = null
    try {
      stageFeedback = await generateStageFeedback(
        stageConfig.stage.name,
        competencyScores.map(c => ({
          code: c.competencyCode,
          name: c.competencyName,
          score: c.currentScore,
          maxScore: c.maxPossibleScore,
        })),
        triggeredMistakes.filter(m => m.triggeredAtStage === currentStage).map(m => ({
          code: m.mistakeCode,
          name: m.mistakeName,
        })),
        assessment.businessContext as any || {}
      )
    } catch (error) {
      console.error('Failed to generate stage feedback:', error)
    }
    
    // Mark current stage as complete
    await prisma.stage.update({
      where: {
        assessmentId_stageNumber: {
          assessmentId,
          stageNumber: currentStage,
        },
      },
      data: {
        completedAt: new Date(),
        stateSnapshot: newState,
      },
    })
    
    // Prepare next stage or complete assessment
    if (!isAssessmentComplete && nextStage !== null) {
      const nextStageConfig = getStageConfig(nextStage)
      const firstQuestion = getFirstQuestionOfStage(nextStage)
      
      // Create next stage record
      await prisma.stage.create({
        data: {
          assessmentId,
          stageNumber: nextStage,
          stageName: nextStageConfig.stage.name,
          stateSnapshot: newState,
        },
      })
      
      // Update assessment
      await prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          currentStage: nextStage,
          currentQuestionId: firstQuestion?.id,
          lastActiveAt: new Date(),
        },
      })
      
      return NextResponse.json({
        stageCompleted: currentStage,
        stageName: stageConfig.stage.name,
        competencyScores,
        mistakesTriggered: triggeredMistakes.filter(m => m.triggeredAtStage === currentStage),
        compoundingCost,
        feedback: stageFeedback,
        nextStage,
        nextStageName: nextStageConfig.stage.name,
        nextStageGoal: nextStageConfig.stage.goal,
        firstQuestion: firstQuestion,
        isComplete: false,
      })
    } else {
      // Assessment complete
      await prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          lastActiveAt: new Date(),
        },
      })
      
      return NextResponse.json({
        stageCompleted: currentStage,
        stageName: stageConfig.stage.name,
        competencyScores,
        mistakesTriggered: triggeredMistakes.filter(m => m.triggeredAtStage === currentStage),
        compoundingCost,
        feedback: stageFeedback,
        isComplete: true,
        message: 'Assessment complete! Generating final report...',
      })
    }
  } catch (error) {
    console.error('Error completing stage:', error)
    return NextResponse.json(
      { error: 'Failed to complete stage' },
      { status: 500 }
    )
  }
}
