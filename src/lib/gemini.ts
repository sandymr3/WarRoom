import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai'

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Default generation config for evaluations
const defaultGenerationConfig: GenerationConfig = {
  temperature: 0.3, // Lower temperature for more consistent evaluations
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 1024,
}

// Get the Gemini model
export function getGeminiModel(modelName: string = 'gemini-1.5-flash'): GenerativeModel {
  return genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: defaultGenerationConfig,
  })
}

// Evaluation response interface
export interface GeminiEvaluationResponse {
  score: number
  maxScore: number
  feedback: string
  criteriaMatched: string[]
  strengths: string[]
  areasForImprovement: string[]
  confidence: number
}

/**
 * Evaluate an open-text response using Gemini AI
 */
export async function evaluateOpenTextResponse(
  questionText: string,
  userResponse: string,
  rubric: { criteria: string; points: number; description: string }[],
  aiConfig: {
    systemPrompt: string
    lookFor: string[]
    maxPoints?: number
  }
): Promise<GeminiEvaluationResponse> {
  const model = getGeminiModel()
  
  const maxPoints = aiConfig.maxPoints || Math.max(...rubric.map(r => r.points))
  
  const prompt = `You are an expert evaluator assessing entrepreneurial competency.

SYSTEM CONTEXT:
${aiConfig.systemPrompt}

QUESTION ASKED:
${questionText}

USER'S RESPONSE:
${userResponse}

SCORING RUBRIC:
${rubric.map(r => `- ${r.criteria} (${r.points} points): ${r.description}`).join('\n')}

EVALUATION CRITERIA - Look for:
${aiConfig.lookFor.map(item => `- ${item}`).join('\n')}

INSTRUCTIONS:
1. Carefully read the user's response
2. Evaluate against each rubric level
3. Identify specific strengths and areas for improvement
4. Assign a score from 0 to ${maxPoints}

Respond in this exact JSON format:
{
  "score": <number 0-${maxPoints}>,
  "maxScore": ${maxPoints},
  "feedback": "<2-3 sentence constructive feedback>",
  "criteriaMatched": ["<list of rubric criteria met>"],
  "strengths": ["<specific strengths observed>"],
  "areasForImprovement": ["<specific areas to improve>"],
  "confidence": <0.0-1.0 confidence in evaluation>
}`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from Gemini response')
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as GeminiEvaluationResponse
    
    // Validate and clamp score
    parsed.score = Math.max(0, Math.min(maxPoints, parsed.score))
    parsed.maxScore = maxPoints
    
    return parsed
  } catch (error) {
    console.error('Gemini evaluation error:', error)
    
    // Return a fallback evaluation
    return {
      score: Math.floor(maxPoints / 2),
      maxScore: maxPoints,
      feedback: 'Response received. Manual review recommended for detailed feedback.',
      criteriaMatched: [],
      strengths: ['Response provided'],
      areasForImprovement: ['Unable to perform AI evaluation'],
      confidence: 0,
    }
  }
}

/**
 * Evaluate a scenario response choice
 */
export async function evaluateScenarioChoice(
  scenarioContext: string,
  selectedOption: {
    id: string
    text: string
    points: number
    signal?: string
    note?: string
  },
  allOptions: { id: string; text: string; points: number }[],
  competencies: string[]
): Promise<{
  feedback: string
  competencySignals: { competency: string; signal: string; strength: number }[]
  strategicInsight: string
}> {
  const model = getGeminiModel()
  
  const prompt = `You are an expert entrepreneurship coach providing feedback on a decision.

SCENARIO:
${scenarioContext}

USER CHOSE:
"${selectedOption.text}"
${selectedOption.note ? `Note: ${selectedOption.note}` : ''}

OTHER OPTIONS WERE:
${allOptions.filter(o => o.id !== selectedOption.id).map(o => `- "${o.text}"`).join('\n')}

COMPETENCIES BEING ASSESSED: ${competencies.join(', ')}

Provide brief, constructive feedback on this choice. Be encouraging but honest.
Focus on what this choice reveals about their entrepreneurial thinking.

Respond in JSON:
{
  "feedback": "<2-3 sentence feedback on their choice>",
  "competencySignals": [
    {"competency": "<C1-C16>", "signal": "<what this reveals>", "strength": <0.0-1.0>}
  ],
  "strategicInsight": "<one key insight about their decision-making>"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON')
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Gemini scenario evaluation error:', error)
    return {
      feedback: selectedOption.note || 'Choice recorded.',
      competencySignals: competencies.map(c => ({ 
        competency: c, 
        signal: 'Response noted', 
        strength: 0.5 
      })),
      strategicInsight: 'Continue to the next question.',
    }
  }
}

/**
 * Generate personalized feedback for a stage completion
 */
export async function generateStageFeedback(
  stageName: string,
  competencyScores: { code: string; name: string; score: number; maxScore: number }[],
  mistakesTriggered: { code: string; name: string }[],
  businessContext: { industry?: string; problem?: string }
): Promise<{
  summary: string
  keyInsights: string[]
  encouragement: string
  nextStagePrep: string
}> {
  const model = getGeminiModel()
  
  const prompt = `Generate personalized stage completion feedback for an entrepreneur.

STAGE COMPLETED: ${stageName}

COMPETENCY SCORES:
${competencyScores.map(c => `- ${c.name}: ${c.score}/${c.maxScore}`).join('\n')}

MISTAKES MADE:
${mistakesTriggered.length > 0 
  ? mistakesTriggered.map(m => `- ${m.name}`).join('\n')
  : 'None - great job avoiding common pitfalls!'
}

BUSINESS CONTEXT:
Industry: ${businessContext.industry || 'Not specified'}
Problem they're solving: ${businessContext.problem || 'Not specified'}

Generate encouraging but honest feedback in JSON:
{
  "summary": "<2-3 sentence summary of their performance>",
  "keyInsights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "encouragement": "<encouraging statement about their progress>",
  "nextStagePrep": "<what to focus on in the next stage>"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON')
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Gemini stage feedback error:', error)
    return {
      summary: `You've completed the ${stageName} stage.`,
      keyInsights: ['Review your responses to identify areas for growth.'],
      encouragement: 'Keep going! Each stage builds on the last.',
      nextStagePrep: 'Focus on applying lessons learned.',
    }
  }
}

/**
 * Generate final assessment report insights
 */
export async function generateReportInsights(
  competencyProfile: { code: string; name: string; level: string; score: number }[],
  mistakesSummary: { code: string; name: string; cost: number }[],
  overallScore: number,
  maxScore: number
): Promise<{
  executiveSummary: string
  strengthsAnalysis: string
  gapsAnalysis: string
  actionPlan: string[]
  finalAdvice: string
}> {
  const model = getGeminiModel('gemini-1.5-pro') // Use pro for final report
  
  const prompt = `Generate a comprehensive entrepreneurial assessment report.

OVERALL SCORE: ${overallScore}/${maxScore} (${Math.round(overallScore/maxScore*100)}%)

COMPETENCY PROFILE:
${competencyProfile.map(c => `- ${c.name} (${c.code}): Level ${c.level}, Score ${c.score}`).join('\n')}

MISTAKES MADE:
${mistakesSummary.length > 0
  ? mistakesSummary.map(m => `- ${m.name}: $${m.cost.toLocaleString()} impact`).join('\n')
  : 'None - excellent judgment!'
}

Generate a professional assessment report in JSON:
{
  "executiveSummary": "<3-4 sentence executive summary>",
  "strengthsAnalysis": "<paragraph analyzing their top strengths>",
  "gapsAnalysis": "<paragraph analyzing areas needing development>",
  "actionPlan": [
    "<specific action item 1>",
    "<specific action item 2>",
    "<specific action item 3>",
    "<specific action item 4>",
    "<specific action item 5>"
  ],
  "finalAdvice": "<inspiring closing advice for their entrepreneurial journey>"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON')
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Gemini report insights error:', error)
    return {
      executiveSummary: `Assessment complete with a score of ${overallScore}/${maxScore}.`,
      strengthsAnalysis: 'Review your competency scores to identify your strongest areas.',
      gapsAnalysis: 'Focus on competencies with lower scores for improvement.',
      actionPlan: [
        'Review feedback from each stage',
        'Focus on your weakest competency',
        'Consider retaking the assessment to track improvement',
        'Apply lessons to your actual business decisions',
        'Seek mentorship in gap areas',
      ],
      finalAdvice: 'Every entrepreneur has areas to grow. Use this assessment as a roadmap for your development.',
    }
  }
}

/**
 * Dynamically adapt a question to be more relevant to the user's specific business/industry
 * Only called when question has generate: true
 */
export interface BusinessContext {
  industry?: string
  problemStatement?: string
  targetAudience?: string
  solution?: string
  stage?: string
}

export interface DynamicQuestionResult {
  questionText: string
  options?: Array<{
    id: string
    text: string
    points?: number
  }>
  scenario?: {
    context: string
    stakes: string
  }
}

export async function generateDynamicQuestion(
  originalQuestion: {
    questionText: string
    type: string
    options?: Array<{ id: string; text: string; points?: number }>
    scenario?: { context?: string; stakes?: string }
  },
  businessContext: BusinessContext
): Promise<DynamicQuestionResult> {
  // If no meaningful business context, return original
  if (!businessContext.industry && !businessContext.problemStatement) {
    return {
      questionText: originalQuestion.questionText,
      options: originalQuestion.options,
      scenario: originalQuestion.scenario ? {
        context: originalQuestion.scenario.context || '',
        stakes: originalQuestion.scenario.stakes || ''
      } : undefined
    }
  }

  const model = getGeminiModel()
  
  const prompt = `You are helping adapt an entrepreneurship assessment question to be more relevant to a specific business context.

BUSINESS CONTEXT:
- Industry: ${businessContext.industry || 'Not specified'}
- Problem they're solving: ${businessContext.problemStatement || 'Not specified'}
- Target audience: ${businessContext.targetAudience || 'Not specified'}
- Their solution: ${businessContext.solution || 'Not specified'}

ORIGINAL QUESTION:
Type: ${originalQuestion.type}
Text: ${originalQuestion.questionText}
${originalQuestion.options ? `Options:\n${originalQuestion.options.map(o => `  ${o.id}. ${o.text}`).join('\n')}` : ''}
${originalQuestion.scenario ? `Scenario Context: ${originalQuestion.scenario.context || 'None'}` : ''}

INSTRUCTIONS:
1. Adapt the question text to reference their specific industry or problem if relevant
2. Keep the core assessment purpose the same
3. For options, you may slightly modify wording to fit their context but keep the same strategic meaning
4. Do NOT change option IDs or drastically change the meaning of options
5. Keep it professional and assessment-appropriate

Respond in this exact JSON format:
{
  "questionText": "<adapted question text>",
  ${originalQuestion.options ? '"options": [{"id": "<same id>", "text": "<adapted text>", "points": <same points>}, ...],' : ''}
  ${originalQuestion.scenario ? '"scenario": {"context": "<adapted context>", "stakes": "<adapted stakes>"}' : '"scenario": null'}
}`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from dynamic question response')
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as DynamicQuestionResult
    
    // Ensure we have valid data
    return {
      questionText: parsed.questionText || originalQuestion.questionText,
      options: parsed.options || originalQuestion.options,
      scenario: parsed.scenario || (originalQuestion.scenario ? {
        context: originalQuestion.scenario.context || '',
        stakes: originalQuestion.scenario.stakes || ''
      } : undefined)
    }
  } catch (error) {
    console.error('Gemini dynamic question error:', error)
    // Fallback to original
    return {
      questionText: originalQuestion.questionText,
      options: originalQuestion.options,
      scenario: originalQuestion.scenario ? {
        context: originalQuestion.scenario.context || '',
        stakes: originalQuestion.scenario.stakes || ''
      } : undefined
    }
  }
}

/**
 * Panelist feedback interfaces
 */
export interface PanelistFeedbackRequest {
  panelistId: string
  panelistName: string
  panelistRole: string
  primaryLens: string
  characteristics: string[]
  challengeQuestions: string[]
  tone: string
  guidanceStyle: string
}

export interface PanelistReaction {
  panelistId: string
  panelistName: string
  sentiment: 'positive' | 'negative' | 'neutral' | 'challenging'
  reaction: string // Short reaction (1-2 sentences)
  challengeQuestion?: string // Follow-up challenge (optional)
  advice?: string // Quick advice based on their lens
}

export interface PanelistPanelFeedback {
  reactions: PanelistReaction[]
  overallTension: string // Any conflicting advice between panelists
  dominantConcern: string // Main issue raised
}

/**
 * Generate Shark Tank-style panelist reactions to a user's pitch response
 */
export async function generatePanelistReactions(
  question: string,
  userResponse: string,
  panelists: PanelistFeedbackRequest[],
  context: {
    stageName: string
    businessContext?: string
    currentState?: {
      capital?: number
      runway?: number
      customers?: number
    }
  }
): Promise<PanelistPanelFeedback> {
  const model = getGeminiModel()

  const prompt = `You are simulating a Shark Tank-style panel of investors, mentors, and leaders reacting to an entrepreneur's pitch response.

ENTREPRENEUR'S CONTEXT:
- Current Stage: ${context.stageName}
- Business Context: ${context.businessContext || 'Early-stage startup'}
${context.currentState ? `- Capital: $${context.currentState.capital?.toLocaleString() || 'N/A'}
- Runway: ${context.currentState.runway || 'N/A'} months
- Customers: ${context.currentState.customers || 0}` : ''}

QUESTION ASKED:
${question}

ENTREPRENEUR'S RESPONSE:
${userResponse}

PANEL MEMBERS:
${panelists.map((p, i) => `
${i + 1}. ${p.panelistName} (${p.panelistRole})
   - Primary Lens: ${p.primaryLens}
   - Tone: ${p.tone}
   - Characteristics: ${p.characteristics.join(', ')}
   - Typical Challenge Questions: ${p.challengeQuestions.join('; ')}
   - Guidance Style: ${p.guidanceStyle}
`).join('\n')}

INSTRUCTIONS:
Generate authentic reactions from each panelist based on their unique personality and lens. Each panelist should:
1. React according to their PRIMARY LENS (what they care about most)
2. Use their characteristic TONE (some are blunt, others warm, etc.)
3. Potentially challenge the entrepreneur with a follow-up question
4. Offer brief advice from their perspective

The reactions should sometimes CONFLICT with each other - this is intentional! Entrepreneurs must learn to navigate conflicting advice.

Respond in this exact JSON format:
{
  "reactions": [
    {
      "panelistId": "<panelist id>",
      "panelistName": "<name>",
      "sentiment": "<positive|negative|neutral|challenging>",
      "reaction": "<1-2 sentence reaction in their voice/tone>",
      "challengeQuestion": "<optional follow-up question they might ask>",
      "advice": "<optional brief advice from their lens>"
    }
  ],
  "overallTension": "<describe any conflicting advice between panelists>",
  "dominantConcern": "<the main issue or opportunity panelists are focused on>"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from panelist reactions')
    }

    const parsed = JSON.parse(jsonMatch[0]) as PanelistPanelFeedback
    return parsed
  } catch (error) {
    console.error('Gemini panelist reactions error:', error)
    // Return fallback reactions
    return {
      reactions: panelists.map(p => ({
        panelistId: p.panelistId,
        panelistName: p.panelistName,
        sentiment: 'neutral' as const,
        reaction: "Interesting approach. Let's see how this plays out.",
      })),
      overallTension: 'Panel is considering the response.',
      dominantConcern: 'Validating the approach.'
    }
  }
}

/**
 * Generate a single panelist's question introduction
 */
export async function generatePanelistQuestionIntro(
  panelist: PanelistFeedbackRequest,
  question: string,
  context: {
    stageName: string
    previousResponses?: string[]
  }
): Promise<{ intro: string; modifiedQuestion?: string }> {
  const model = getGeminiModel()

  const prompt = `You are ${panelist.panelistName}, ${panelist.panelistRole}.

Your characteristics:
- Primary Lens: ${panelist.primaryLens}
- Tone: ${panelist.tone}
- Style: ${panelist.characteristics.join(', ')}

You are about to ask the entrepreneur a question during their pitch in the "${context.stageName}" stage.

ORIGINAL QUESTION:
${question}

${context.previousResponses?.length ? `CONTEXT FROM PREVIOUS RESPONSES:
${context.previousResponses.slice(-2).join('\n')}` : ''}

TASK:
1. Write a brief intro (1-2 sentences) in your character's voice setting up why you're asking this
2. Optionally rephrase the question in your voice while keeping the core intent

Respond in JSON:
{
  "intro": "<your intro in character>",
  "modifiedQuestion": "<optional: question rephrased in your voice, or null to use original>"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse panelist intro')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Gemini panelist intro error:', error)
    return {
      intro: `${panelist.panelistName} leans forward with interest...`,
    }
  }
}

export default {
  getGeminiModel,
  evaluateOpenTextResponse,
  evaluateScenarioChoice,
  generateStageFeedback,
  generateReportInsights,
  generateDynamicQuestion,
  generatePanelistReactions,
  generatePanelistQuestionIntro,
}
