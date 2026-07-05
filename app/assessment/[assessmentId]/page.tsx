'use client'

import { useParams, useRouter } from 'next/navigation'
import { Users, Flame, Crown, Coins } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RevenueSidePanel } from '@/src/components/RevenueSidePanel'
import { LeaderboardPanel } from '@/src/components/LeaderboardPanel'
import { CharacterPicker } from '@/src/components/CharacterPicker'
import { CinemaOverlay, StageNarrationOverlay, SnapshotDashboard } from '@/src/components/AnimatedComponents'
import { MentorBlock, MentorOverlay } from '@/src/components/MentorComponents'
import { SimulationHeader } from '@/src/components/SimulationHeader'
import { IdeationView } from './_views/IdeationView'
import { StageView } from './_views/StageView'
import { PhaseTransitionView } from './_views/PhaseTransitionView'
import { RestartConfirmDialog } from './_views/RestartConfirmDialog'
import { InvolvementWarningDialog } from './_views/InvolvementWarningDialog'
import { BuyoutLockoutDialog } from './_views/BuyoutLockoutDialog'
import { useSimulation } from '@/src/hooks/useSimulation'
import { STAGE_THEMES, STAGE_NARRATIVES, STAGE_ORDER, STAGE_MENTOR_TIPS, NARRATION_STAGE_LABELS } from '@/src/lib/constants'
import { stageLabel } from '@/src/lib/helpers'
import { useNarratorOnboarding } from '@/src/hooks/useNarratorOnboarding'
import { narratorPhaseForStage } from '@/lib/narrator/scripts'
import { RouteBackground } from '@/src/components/effects/RouteBackground'
import type { StageName } from '@/src/types'

export default function SimulationPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const router = useRouter()

  const sim = useSimulation(assessmentId)
  const {
    state, loading, error, simulation, questions, currentQ, qIndex, answers, mcqFeedback,
    dynamicScenario, loadingScenario, dynamicScenarioError,
    loadingFollowup, followupScenarios, followupError,
    buyoutCompany, buyoutAmount, submitting, submitError,
    phaseScenario, showingScenario, showRestartCheckpoint,
    revenue, prevRevenue, userId, batchCode, budgetAllocations,
    mentors, loadingConfig, showMentorPanel, selectedMentorId, mentorQuestion, mentorLoading, mentorResult,
    showPanelSelection, settingCharacters, showCapitalAnimation,
    showStageNarration, showSnapshot,
    stageTimer, shouldRunTimer, isCrisisQuestion,
    entries, connected, updatedAt, snapshotContinueRef,
    showRestartConfirm, setShowRestartConfirm, confirmRestart,
    showInvolvementWarning, dismissInvolvementWarning, spamPercent,
    showBuyoutLockout, buyoutContext, dismissBuyoutLockout,
    isIdeationStage, isLastQuestion, isFirstQuestion, currentAnswer, answeredCount, lifelinesLeft,
    // Setters
    setShowMentorPanel, setSelectedMentorId, setMentorQuestion, setMentorResult,
    setBuyoutCompany, setBuyoutAmount, setShowStageNarration, setQIndex, setMcqFeedback,
    // Handlers
    goBack, goNext, handleSelectOption, handleConfirmScenarioDecision, handleTextChange,
    handleBudgetAllocation, doPhaseSubmit, handleCharacterConfirm,
    handleRestart, handleContinue, handleUseMentor, closeMentorPanel,
    handleBuyoutSubmit, handleScenarioSubmit, retryScenario, acknowledgeInfo,
  } = sim

  // ── Narrator — per-stage onboarding lines removed: they fired at every one
  // of the 8 stages mid-assessment, which felt like spam. The assessment-start
  // intro covers the welcome. ──
  const narratorPhase = simulation ? narratorPhaseForStage(simulation.currentStage) : null
  useNarratorOnboarding(narratorPhase ?? '', { enabled: false })

  // ---- Loading / Error ----
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-warroom-void)' }}>
      <div className="text-center space-y-4">
        <div className="flex justify-center animate-torch-glow"><Flame className="h-9 w-9" style={{ color: 'var(--color-warroom-gold)' }} /></div>
        <div className="w-8 h-8 mx-auto" style={{ border: '2px solid color-mix(in srgb, var(--color-warroom-gold) 20%, transparent)', borderTopColor: 'var(--color-warroom-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p className="text-xs" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-warroom-gold)', letterSpacing: '0.15em' }}>SETTING UP THE BOARD...</p>
      </div>
    </div>
  )
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--color-warroom-void)' }}>
      <p style={{ color: 'var(--color-warroom-crimson-bright)', fontFamily: 'var(--font-display)' }}>{error}</p>
      <button onClick={() => router.push('/dashboard')} style={{ background: 'color-mix(in srgb, var(--color-warroom-gold) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-warroom-gold) 30%, transparent)', color: 'var(--color-warroom-gold)', padding: '8px 20px', borderRadius: '3px', fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.1em', cursor: 'pointer' }}>Return to the Study</button>
    </div>
  )
  if (!state || !simulation) return null

  const accent = STAGE_THEMES[simulation.currentStage] || '#b3903e'
  const narration = STAGE_NARRATIVES[simulation.currentStage]
  const mentorTip = STAGE_MENTOR_TIPS[simulation.currentStage]
  const stageIdx = STAGE_ORDER.indexOf(simulation.currentStage as StageName)
  // The snapshot's middle column previews the stage the founder is about to enter.
  const nextStageName = STAGE_ORDER[stageIdx + 1]
  const nextStageNarr = nextStageName ? STAGE_NARRATIVES[nextStageName] : undefined
  const nextStageData = nextStageNarr
    ? { ...nextStageNarr, voiceUrl: `/audio/narrator/snapshot-${nextStageName.toLowerCase()}-01-speaking.mp3` }
    : undefined

  // ---- Panel Selection ----
  if (showPanelSelection) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, var(--color-warroom-void), var(--color-warroom-black))' }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-warroom-gold) 30%, transparent), transparent)' }} />
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-3">
            <div className="flex justify-center"><Crown className="h-8 w-8" style={{ color: 'var(--color-warroom-gold)' }} /></div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-warroom-ivory)', letterSpacing: '0.06em' }}>Assemble the Board</h1>
            <div className="h-px max-w-sm mx-auto" style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-warroom-gold) 40%, transparent), transparent)' }} />
            <p style={{ color: 'var(--color-warroom-smoke)', fontSize: '0.85rem', letterSpacing: '0.04em' }}>Choose wisely, challenger. Their counsel will shape your game.</p>
          </div>
          <CharacterPicker mentors={mentors} leaders={[]} investors={[]} onConfirm={handleCharacterConfirm} loading={settingCharacters} />
        </div>
      </div>
    )
  }

  // ---- Phase Transition ----
  if (showingScenario && phaseScenario) {
    return (
      <>
        <PhaseTransitionView
          phaseScenario={phaseScenario}
          showRestartCheckpoint={showRestartCheckpoint}
          submitting={submitting}
          revenue={revenue}
          prevRevenue={prevRevenue}
          entries={entries}
          userId={userId}
          onScenarioSubmit={handleScenarioSubmit}
          onRestart={handleRestart}
          onContinue={handleContinue}
        />
        <MentorOverlay
          show={showMentorPanel}
          lifelinesLeft={lifelinesLeft}
          mentors={mentors}
          loadingConfig={loadingConfig}
          selectedMentorId={selectedMentorId}
          mentorQuestion={mentorQuestion}
          mentorLoading={mentorLoading}
          mentorResult={mentorResult}
          onSelectMentor={setSelectedMentorId}
          onQuestionChange={setMentorQuestion}
          onSubmit={handleUseMentor}
          onClose={closeMentorPanel}
        />
      </>
    )
  }

  // ---- Shared overlays ----
  const sharedOverlays = (
    <>
      <RestartConfirmDialog
        open={showRestartConfirm}
        submitting={submitting}
        onCancel={() => setShowRestartConfirm(false)}
        onConfirm={confirmRestart}
      />
      <InvolvementWarningDialog
        open={showInvolvementWarning}
        spamPercent={spamPercent}
        onAcknowledge={dismissInvolvementWarning}
      />
      <BuyoutLockoutDialog
        open={showBuyoutLockout}
        company={buyoutContext?.company || ''}
        amount={buyoutContext?.amount || 0}
        onContinue={dismissBuyoutLockout}
      />
      <MentorOverlay
        show={showMentorPanel}
        lifelinesLeft={lifelinesLeft}
        mentors={mentors}
        loadingConfig={loadingConfig}
        selectedMentorId={selectedMentorId}
        mentorQuestion={mentorQuestion}
        mentorLoading={mentorLoading}
        mentorResult={mentorResult}
        onSelectMentor={setSelectedMentorId}
        onQuestionChange={setMentorQuestion}
        onSubmit={handleUseMentor}
        onClose={closeMentorPanel}
      />
      {narration && (
        <StageNarrationOverlay
          show={showStageNarration}
          data={narration}
          stageIndex={stageIdx}
          totalStages={STAGE_ORDER.length}
          stageLabels={NARRATION_STAGE_LABELS}
          accentColor={accent}
          onDismiss={() => setShowStageNarration(false)}
        />
      )}
      <SnapshotDashboard
        show={showSnapshot && !showStageNarration}
        revenue={revenue}
        previousRevenue={prevRevenue}
        leaderboardEntries={entries.map(e => ({ name: e.name || e.userId, score: e.revenueProjection || 0, isUser: e.userId === userId }))}
        stageName={stageLabel(simulation.currentStage)}
        nextStage={nextStageData}
        budgetAllocations={simulation.budgetAllocations}
        capital={simulation.capital}
        onContinue={() => snapshotContinueRef.current?.()}
      />
      {/* Capital animation */}
      <AnimatePresence>
        {showCapitalAnimation && (
          <motion.div initial={{ opacity: 0, scale: 0.5, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.5, y: -50 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center" style={{ background: 'color-mix(in srgb, var(--color-warroom-void) 90%, transparent)', border: '2px solid color-mix(in srgb, var(--color-warroom-gold) 60%, transparent)', borderRadius: '4px', padding: '2rem 3rem', boxShadow: 'var(--shadow-gold)' }}>
              <div className="mb-2 flex justify-center"><Coins className="h-8 w-8" style={{ color: 'var(--color-warroom-gold)' }} /></div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-warroom-gold)', letterSpacing: '0.08em', textShadow: 'var(--glow-ember)' }}>+$50,000 PLEDGED!</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-warroom-smoke)', letterSpacing: '0.15em', marginTop: '4px' }}>THE COUNCIL INVESTS IN YOUR REALM</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile-only mentor entry point (the full Mentor's Counsel block
          lives in the desktop sidebar, which is hidden below lg). */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setMentorResult(null); setShowMentorPanel(true) }}
          className="flex items-center gap-2"
          style={{ background: 'color-mix(in srgb, var(--color-warroom-black) 90%, transparent)', border: `1px solid ${accent}40`, borderRadius: '24px', padding: '8px 16px 8px 8px', boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 20px ${accent}20`, backdropFilter: 'blur(8px)' }}
        >
          <div className="h-9 w-9 rounded-full flex items-center justify-center relative" style={{ background: 'color-mix(in srgb, var(--color-warroom-gold) 10%, transparent)', border: `1px solid ${accent}40` }}>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: accent }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: accent }} />
            </span>
            <Users className="h-4 w-4" style={{ color: accent }} />
          </div>
          <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-display)', color: accent, letterSpacing: '0.06em' }}>Counsel</span>
        </motion.button>
      </div>
    </>
  )

  // ---- Sidebar (shared) ----
  const sidebar = {
    left: (
      <div className="hidden lg:flex flex-col gap-4">
        <RevenueSidePanel revenue={revenue} previousRevenue={prevRevenue} currentStage={simulation.currentStage} capital={simulation.capital} budgetAllocations={simulation.budgetAllocations} />
      </div>
    ),
    right: (
      <div className="hidden lg:flex flex-col gap-4">
        <MentorBlock lifelinesLeft={lifelinesLeft} tip={mentorTip} onOpen={() => { setMentorResult(null); setShowMentorPanel(true) }} />
        {batchCode ? (
          <LeaderboardPanel entries={entries} currentUserId={userId} connected={connected} updatedAt={updatedAt} className="flex-1 max-h-[500px]" />
        ) : (
          <div className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">Join a batch to see live leaderboard</div>
        )}
      </div>
    ),
  }

  // ---- Ideation ----
  if (isIdeationStage) {
    return (
      <>
        {sharedOverlays}
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, var(--color-warroom-void) 0%, var(--color-warroom-black) 100%)' }}>
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-warroom-gold) 20%, transparent), transparent)', zIndex: 40 }} />
          <CinemaOverlay show={submitting} icon={<div className="text-4xl animate-torch-glow">⚔</div>} title="The Council weighs your idea..." subtitle="Forging your founder assessment" />
          <SimulationHeader
            stageName="Stage -2: IDEATION"
            progressLabel={`${answeredCount}/${questions.length} answered`}
            progressPct={questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0}
            timer={shouldRunTimer ? stageTimer : undefined}
            showTimer={shouldRunTimer}
            accent={accent}
          />
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-6 max-w-7xl mx-auto w-full px-4 py-6 overflow-y-auto overflow-x-hidden">
            {sidebar.left}
            <IdeationView
              questions={questions}
              answers={answers}
              answeredCount={answeredCount}
              submitting={submitting}
              submitError={submitError}
              accent={accent}
              onTextChange={(text, qId) => handleTextChange(text, qId)}
              onSelectOption={(opt, qId) => handleSelectOption(opt, qId)}
              onSubmitPhase={doPhaseSubmit}
            />
            {sidebar.right}
          </div>
        </div>
      </>
    )
  }

  // ---- Normal Stage ----
  const pct = questions.length > 0 ? Math.round(((qIndex + 1) / questions.length) * 100) : 0

  return (
    <>
      <RouteBackground bg="simulation" />
      {sharedOverlays}
      <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, var(--color-warroom-void) 0%, var(--color-warroom-black) 100%)' }}>
        <div className="fixed inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-warroom-gold) 15%, transparent), transparent)', zIndex: 31 }} />
        <CinemaOverlay show={submitting} icon={<div className="text-4xl animate-torch-glow">⚔</div>} title="The Council deliberates..." subtitle="Your answers are being judged" />
        {isCrisisQuestion && <div className="crisis-vignette" />}
        <SimulationHeader
          stageName={stageLabel(simulation.currentStage)}
          progressLabel={`Q${qIndex + 1} of ${questions.length}`}
          progressPct={pct}
          timer={shouldRunTimer ? stageTimer : undefined}
          showTimer={shouldRunTimer}
          isCrisis={isCrisisQuestion}
          accent={accent}
        />
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-6 max-w-7xl mx-auto w-full px-4 py-6 overflow-y-auto overflow-x-hidden">
          {sidebar.left}
          <StageView
            questions={questions}
            qIndex={qIndex}
            currentQ={currentQ}
            currentAnswer={currentAnswer}
            answers={answers}
            isCrisisQuestion={isCrisisQuestion}
            submitting={submitting}
            submitError={submitError}
            isLastQuestion={isLastQuestion}
            isFirstQuestion={isFirstQuestion}
            answeredCount={answeredCount}
            dynamicScenario={dynamicScenario}
            loadingScenario={loadingScenario}
            dynamicScenarioError={dynamicScenarioError}
            loadingFollowup={loadingFollowup}
            followupScenarios={followupScenarios}
            followupError={followupError}
            mcqFeedback={mcqFeedback}
            capital={simulation.capital || 100000}
            budgetAllocations={budgetAllocations}
            buyoutCompany={buyoutCompany}
            buyoutAmount={buyoutAmount}
            accent={accent}
            onGoBack={goBack}
            onGoNext={goNext}
            onSelectOption={handleSelectOption}
            onConfirmScenarioDecision={handleConfirmScenarioDecision}
            onTextChange={handleTextChange}
            onBudgetAllocation={handleBudgetAllocation}
            onSubmitPhase={doPhaseSubmit}
            onBuyoutCompanyChange={setBuyoutCompany}
            onBuyoutAmountChange={setBuyoutAmount}
            onBuyoutSubmit={handleBuyoutSubmit}
            onRetryScenario={retryScenario}
            onAcknowledge={acknowledgeInfo}
            setQIndex={setQIndex}
            setMcqFeedback={setMcqFeedback}
          />
          {sidebar.right}
        </div>
      </div>
    </>
  )
}
