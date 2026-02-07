/**
 * Assessment API Routes
 * Handle assessment CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/src/lib/prisma'
import { authOptions } from '@/src/lib/auth'
import { createInitialState, serializeState } from '@/src/lib/services/state-manager'
import { getStageConfig, getFirstQuestionOfStage } from '@/src/lib/services/question-engine'

// GET /api/assessment - List user's assessments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const assessments = await prisma.assessment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        stages: {
          select: {
            stageNumber: true,
            stageName: true,
            completedAt: true,
          },
        },
        _count: {
          select: { responses: true },
        },
      },
    })
    
    return NextResponse.json({ assessments })
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    )
  }
}

// POST /api/assessment - Create new assessment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { cohortId, selectedPanelists } = body
    
    // Validate panelists selection (6 required: 2 from each category)
    if (!selectedPanelists || !Array.isArray(selectedPanelists) || selectedPanelists.length !== 6) {
      return NextResponse.json(
        { error: 'Must select exactly 6 panelists (2 from each category)' },
        { status: 400 }
      )
    }
    
    // Check how many assessments user already has
    const existingCount = await prisma.assessment.count({
      where: { userId: session.user.id },
    })
    
    if (existingCount >= 2) {
      return NextResponse.json(
        { error: 'Maximum of 2 assessment attempts allowed' },
        { status: 400 }
      )
    }
    
    const attemptNumber = (existingCount + 1) as 1 | 2
    
    // Create initial state
    const initialState = createInitialState()
    
    // Get first stage config
    const stageConfig = getStageConfig(-2)
    const firstQuestion = getFirstQuestionOfStage(-2)
    
    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        userId: session.user.id,
        attemptNumber,
        status: 'IN_PROGRESS',
        currentStage: -2,
        currentQuestionId: firstQuestion?.id || null,
        selectedPanelists: selectedPanelists, // Store selected War Room panelists
        startedAt: new Date(),
        lastActiveAt: new Date(),
        // Create first stage record
        stages: {
          create: {
            stageNumber: -2,
            stageName: stageConfig.stage.name,
            stateSnapshot: initialState as any,
            startedAt: new Date(),
          },
        },
      },
      include: {
        stages: true,
      },
    })
    
    return NextResponse.json({
      assessment,
      currentQuestion: firstQuestion,
      state: initialState,
    })
  } catch (error) {
    console.error('Error creating assessment:', error)
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    )
  }
}
