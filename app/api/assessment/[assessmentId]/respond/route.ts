/**
 * Response Submission API Route
 * Handle submitting answers and triggering evaluations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/src/lib/prisma'
import { authOptions } from '@/src/lib/auth'
import { getQuestionById, getNextQuestion, getStageConfig } from '@/src/lib/services/question-engine'
import { scoreMultipleChoiceResponse, scoreBudgetAllocation } from '@/src/lib/services/scoring-engine'
import { checkForMistakeTrigger, createMistakeTriggered, getMistakeImmediateImpact } from '@/src/lib/services/mistake-detector'
import { applyMistakeImmediateConsequence } from '@/src/lib/services/consequence-engine'
import { createInitialState, applyConsequence } from '@/src/lib/services/state-manager'
import { evaluateOpenTextResponse } from '@/src/lib/gemini'
import type { ResponseData, MistakeCode, StageNumber } from '@/src/types'

interface RouteParams {
  params: Promise<{ assessmentId: string }>
}

// POST /api/assessment/[assessmentId]/respond - Submit a response
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { assessmentId } = await params
    const body = await request.json()
    const { questionId, responseData, responseTimeSeconds } = body
    
    // Validate assessment ownership
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        stages: { orderBy: { stageNumber: 'desc' }, take: 1 },
        responses: true,
        mistakesTriggered: true,
      },
    })
    
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }
    
    if (assessment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    if (assessment.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Assessment is not in progress' },
        { status: 400 }
      )
    }
    
    // Get question details
    const question = getQuestionById(questionId)
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }
    
    // Calculate points based on response type
    let pointsAwarded = 0
    let aiEvaluation = null
    
    const typedResponseData = responseData as ResponseData
    
    switch (typedResponseData.type) {
      case 'choice':
        if (question.options) {
          pointsAwarded = scoreMultipleChoiceResponse(
            typedResponseData.selectedOptionId,
            question.options
          )
        }
        break
      
      case 'text':
        // Use AI evaluation for open text
        if (question.scoring?.rubric && question.aiEvaluation) {
          try {
            const evaluation = await evaluateOpenTextResponse(
              question.questionText,
              typedResponseData.value,
              question.scoring.rubric,
              question.aiEvaluation
            )
            pointsAwarded = evaluation.score
            aiEvaluation = {
              score: evaluation.score,
              maxScore: evaluation.maxScore,
              feedback: evaluation.feedback,
              criteriaMatched: evaluation.criteriaMatched,
              strengths: evaluation.strengths,
              areasForImprovement: evaluation.areasForImprovement,
              evaluatedAt: new Date(),
              modelUsed: 'gemini-1.5-flash',
            }
          } catch (error) {
            console.error('AI evaluation failed:', error)
            // Fallback to middle score
            pointsAwarded = 5
          }
        }
        break
      
      case 'budget':
        if (question.categories) {
          const idealRanges = question.categories.map(c => ({
            categoryId: c.id,
            min: c.recommendedRange?.min || 0,
            max: c.recommendedRange?.max || 100,
            weight: c.scoringWeight || 1,
          }))
          pointsAwarded = scoreBudgetAllocation(typedResponseData.allocations, idealRanges)
        }
        break
      
      case 'numeric':
        // Basic scoring for numeric inputs
        pointsAwarded = 5 // Default middle score
        break
      
      default:
        pointsAwarded = 5
    }
    
    // Check for mistake triggers
    const currentMistakes = assessment.mistakesTriggered.map((m: any) => m.mistakeCode as MistakeCode)
    const triggeredMistake = checkForMistakeTrigger(
      questionId,
      {
        questionId,
        assessmentId,
        stageNumber: assessment.currentStage as StageNumber,
        responseType: question.type as any,
        responseData: typedResponseData,
        pointsAwarded,
        competenciesAssessed: question.assess || [],
        answeredAt: new Date(),
        responseTimeSeconds,
      },
      currentMistakes
    )
    
    // Also check if option triggers a mistake
    let optionTriggeredMistake: MistakeCode | null = null
    if (typedResponseData.type === 'choice' && question.options) {
      const selectedOption = question.options.find(
        o => o.id === typedResponseData.selectedOptionId
      )
      if (selectedOption?.triggersMistake) {
        optionTriggeredMistake = selectedOption.triggersMistake
      }
    }
    
    const mistakeToTrigger = triggeredMistake || optionTriggeredMistake
    
    // Create response record
    const currentStageRecord = assessment.stages[0]
    const response = await prisma.response.create({
      data: {
        assessmentId,
        stageId: currentStageRecord?.id || '',
        questionId,
        questionType: question.type,
        responseData: typedResponseData as any,
        aiEvaluation: aiEvaluation as any,
        rawScore: pointsAwarded,
        competenciesAssessed: question.assess || [],
        answeredAt: new Date(),
        durationSeconds: responseTimeSeconds,
      },
    })
    
    // Handle mistake if triggered
    let mistakeRecord = null
    let consequenceApplied = null
    
    if (mistakeToTrigger && !currentMistakes.includes(mistakeToTrigger)) {
      // Get immediate impact
      const impact = getMistakeImmediateImpact(mistakeToTrigger)
      
      // Create mistake record
      mistakeRecord = await prisma.mistakeTriggered.create({
        data: {
          assessmentId,
          mistakeCode: mistakeToTrigger,
          mistakeName: mistakeToTrigger, // Will be resolved
          triggeredAtStage: assessment.currentStage,
          triggeredAtQuestion: questionId,
          triggeredAtMonth: assessment.simulatedMonth || 1,
          immediateImpact: impact || {},
          compoundingImpact: 'Potential compounding effects in later stages',
        },
      })
      
      if (impact) {
        consequenceApplied = impact
      }
    }
    
    // Reconstruct full simulation state from Assessment-level fields
    const stageSnapshot = (assessment.stages[0]?.stateSnapshot as any) || {}
    const initialState = createInitialState()
    let fullState = {
      ...initialState,
      financial: { ...initialState.financial, ...(assessment.financialState as any || stageSnapshot.financial || {}) },
      team: { ...initialState.team, ...(assessment.teamState as any || stageSnapshot.team || {}) },
      customers: { ...initialState.customers, ...(assessment.customerState as any || stageSnapshot.customers || {}) },
      product: { ...initialState.product, ...(assessment.productState as any || stageSnapshot.product || {}) },
      market: { ...initialState.market, ...(assessment.marketState as any || stageSnapshot.market || {}) },
    }

    // Apply option state impact to simulation state
    if (typedResponseData.type === 'choice' && question.options) {
      const selectedOption = question.options.find(
        o => o.id === typedResponseData.selectedOptionId
      )
      if (selectedOption) {
        const stateImpact = (selectedOption as any).stateImpact || (selectedOption as any).consequence
        if (stateImpact) {
          fullState = applyConsequence(fullState, stateImpact)
        }
      }
    }

    // Apply mistake immediate consequences to state if triggered
    if (mistakeToTrigger && !currentMistakes.includes(mistakeToTrigger)) {
      const mistakeResult = applyMistakeImmediateConsequence(fullState, mistakeToTrigger)
      fullState = mistakeResult.newState
    }

    // Get next question
    const nextQuestion = getNextQuestion(
      questionId,
      assessment.currentStage as StageNumber,
      [...assessment.responses, response].map((r: any) => ({
        ...r,
        stageNumber: currentStageRecord?.stageNumber as StageNumber,
        responseData: r.responseData as ResponseData,
        competenciesAssessed: (r.competenciesAssessed as string[]) || [],
      })) as any,
      fullState
    )

    // Update assessment with next question AND current simulation state
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        currentQuestionId: nextQuestion?.id || null,
        lastActiveAt: new Date(),
        financialState: fullState.financial as any,
        teamState: fullState.team as any,
        customerState: fullState.customers as any,
        productState: fullState.product as any,
        marketState: fullState.market as any,
      },
    })
    
    // Check if stage is complete
    const stageComplete = !nextQuestion
    
    return NextResponse.json({
      response,
      pointsAwarded,
      aiEvaluation,
      mistakeTriggered: mistakeRecord,
      consequenceApplied,
      nextQuestion,
      stageComplete,
      updatedState: {
        financial: fullState.financial,
        team: fullState.team,
        customers: fullState.customers,
        product: fullState.product,
        market: fullState.market,
      },
    })
  } catch (error) {
    console.error('Error submitting response:', error)
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    )
  }
}
