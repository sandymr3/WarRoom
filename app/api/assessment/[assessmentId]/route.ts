/**
 * Assessment Detail API Routes
 * Handle single assessment operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/src/lib/prisma'
import { authOptions } from '@/src/lib/auth'
import { deserializeState, serializeState } from '@/src/lib/services/state-manager'
import { getQuestionById, getStageProgress } from '@/src/lib/services/question-engine'

interface RouteParams {
  params: Promise<{ assessmentId: string }>
}

// GET /api/assessment/[assessmentId] - Get assessment details
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
        stages: {
          orderBy: { stageNumber: 'asc' },
        },
        responses: {
          orderBy: { answeredAt: 'asc' },
          include: {
            stage: { select: { stageNumber: true, stageName: true } },
          },
        },
        competencyScores: true,
        mistakesTriggered: true,
      },
    })
    
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }
    
    if (assessment.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Get current question
    const currentQuestion = assessment.currentQuestionId
      ? getQuestionById(assessment.currentQuestionId)
      : null
    
    // Build state from Assessment-level JSON fields (populated on each response),
    // with fallback to latest stage snapshot
    const latestStage = assessment.stages[assessment.stages.length - 1]
    const stageSnapshot = (latestStage?.stateSnapshot as any) || {}
    const state = {
      financial: assessment.financialState || stageSnapshot.financial || {},
      team: assessment.teamState || stageSnapshot.team || {},
      customers: assessment.customerState || stageSnapshot.customers || {},
      product: assessment.productState || stageSnapshot.product || {},
      market: assessment.marketState || stageSnapshot.market || {},
    }
    
    // Calculate progress - use stage relation to get stageNumber
    const progress = getStageProgress(
      assessment.currentStage as any,
      assessment.responses.map((r: any) => ({
        ...r,
        stageNumber: r.stage?.stageNumber ?? assessment.currentStage,
        responseData: r.responseData as any,
        competenciesAssessed: (r.competenciesAssessed as string[]) || [],
      }))
    )
    
    return NextResponse.json({
      assessment,
      currentQuestion,
      state,
      progress: {
        currentStage: assessment.currentStage,
        questionsAnsweredInStage: progress.answered,
        totalQuestionsInStage: progress.total,
        overallProgress: progress.percentage,
      },
    })
  } catch (error) {
    console.error('Error fetching assessment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    )
  }
}

// PATCH /api/assessment/[assessmentId] - Update assessment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { assessmentId } = await params
    const body = await request.json()
    const { currentStage, currentQuestionId, status, businessContext,
            financialState, teamState, customerState, productState, marketState } = body
    
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    })
    
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }
    
    if (assessment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Build update data
    const updateData: any = {
      lastActivityAt: new Date(),
    }
    
    if (currentStage !== undefined) updateData.currentStage = currentStage
    if (currentQuestionId !== undefined) updateData.currentQuestionId = currentQuestionId
    if (status !== undefined) updateData.status = status
    if (businessContext !== undefined) updateData.businessContext = businessContext
    if (financialState !== undefined) updateData.financialState = financialState
    if (teamState !== undefined) updateData.teamState = teamState
    if (customerState !== undefined) updateData.customerState = customerState
    if (productState !== undefined) updateData.productState = productState
    if (marketState !== undefined) updateData.marketState = marketState
    
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }
    
    const updated = await prisma.assessment.update({
      where: { id: assessmentId },
      data: updateData,
    })
    
    return NextResponse.json({ assessment: updated })
  } catch (error) {
    console.error('Error updating assessment:', error)
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    )
  }
}

// DELETE /api/assessment/[assessmentId] - Delete assessment (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { assessmentId } = await params
    
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    })
    
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }
    
    // Only admin or owner can delete
    if (assessment.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    await prisma.assessment.delete({
      where: { id: assessmentId },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assessment:', error)
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    )
  }
}
