'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Bell,
  Shield,
  Palette,
  Zap,
  Settings,
  AlertTriangle,
  Volume2,
  VolumeX,
  Music,
  Swords,
  Crown,
  Mic2,
} from 'lucide-react'
import { useAmbientAudio } from '@/src/hooks/useAmbientAudio'
import { useAudioStore } from '@/src/state/audioStore'
import { audioManager } from '@/lib/audio/audioManager'
import type { SfxKey } from '@/lib/audio/audioManager'
import { CURSOR_DISABLED_STORAGE_KEY } from '@/src/components/effects/CustomCursor'
import { cn } from '@/lib/utils'
import {
  StoneCard,
  WarRoomCTA,
  GoldDivider,
} from '@/src/components/primitives'
import { useNarratorOnboarding } from '@/src/hooks/useNarratorOnboarding'
import { easeDramatic } from '@/lib/animations/variants'

// ─── Constants ──────────────────────────────────────────────────────────────

const INPUT_CLASSES =
  'bg-[color:var(--color-warroom-rampart)]/60 border-[color:var(--color-warroom-ash)]/30 text-[color:var(--color-warroom-ivory)] placeholder:text-[color:var(--color-warroom-smoke)] focus-visible:border-[color:var(--color-warroom-gold)]/60 focus-visible:ring-[color:var(--color-warroom-gold)]/20'

type TabKey = 'profile' | 'notifications' | 'appearance' | 'audio' | 'privacy'

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'audio', label: 'Audio', icon: Volume2 },
  { key: 'privacy', label: 'Privacy', icon: Shield },
]

// Curated SFX preview buttons — one per major audio category so the
// player can audition the sound design before committing volume changes.
const SFX_PREVIEWS: { key: SfxKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'wr.verdict', label: 'Dragon Roar', icon: Crown },
  { key: 'sim.stage-begin', label: 'War Horn', icon: Swords },
  { key: 'sim.stage-clear', label: 'Triumph', icon: Crown },
  { key: 'ui.click', label: 'Sword Clash', icon: Swords },
  { key: 'wr.vote-lock', label: 'Coin Drop', icon: Music },
  { key: 'narrator.appear', label: 'Raven Wings', icon: Music },
]

type AmbientPreview = {
  key: 'ambient.hall' | 'ambient.warroom' | 'ambient.deliberate' | 'ambient.victory' | null
  label: string
}

const AMBIENT_PREVIEWS: AmbientPreview[] = [
  { key: null, label: 'Silence' },
  { key: 'ambient.hall', label: 'The Study' },
  { key: 'ambient.warroom', label: 'The Grand Board' },
  { key: 'ambient.deliberate', label: 'Deliberation' },
  { key: 'ambient.victory', label: 'Verdict' },
]

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const prefersReducedMotion = useReducedMotion()

  // Placeholder session
  const session = { user: { name: 'User', email: 'user@example.com' } }

  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  // Audio settings — live, bidirectional with the ambient store.
  const {
    isMuted,
    setMuted,
    ambientVolume,
    sfxVolume,
    setAmbientVolume,
    setSfxVolume,
    scene,
    unlocked,
    unlock,
  } = useAmbientAudio()

  // Voice-line channel (investor TTS) — separate from the ambient/SFX buses,
  // so it is NOT governed by Master Audio. Persists via the audioStore.
  const voiceVolume = useAudioStore((s) => s.voiceVolume)
  const isVoiceMuted = useAudioStore((s) => s.isVoiceMuted)
  const setVolume = useAudioStore((s) => s.setVolume)
  const toggleVoiceMute = useAudioStore((s) => s.toggleVoiceMute)

  const handleTestSfx = (key: SfxKey) => {
    // Ensure the AudioContext is unlocked even when the user has not
    // yet clicked elsewhere on the page.
    if (!unlocked) unlock()
    audioManager.playSfx(key)
  }

  const handleTestAmbient = (key: AmbientPreview['key']) => {
    if (!unlocked) unlock()
    audioManager.setAmbientTrack(key)
  }

  // Custom cursor toggle — persists in localStorage; CustomCursor.tsx
  // reads the same key on mount and listens for storage events.
  const [cursorDisabled, setCursorDisabled] = useState(false)

  useEffect(() => {
    try {
      setCursorDisabled(window.localStorage.getItem(CURSOR_DISABLED_STORAGE_KEY) === 'true')
    } catch {
      /* ignore */
    }
  }, [])

  const handleToggleCursor = (disabled: boolean) => {
    setCursorDisabled(disabled)
    try {
      window.localStorage.setItem(CURSOR_DISABLED_STORAGE_KEY, String(disabled))
    } catch {
      /* ignore */
    }
    if (disabled) {
      // Immediate effect — remove the active class and stop hiding the OS cursor.
      document.body.classList.remove('wr-cursor-active')
      document.querySelectorAll('.wr-cursor').forEach((el) => el.remove())
    } else {
      // Re-enable requires re-mounting CustomCursor — easiest is a reload.
      window.location.reload()
    }
  }

  useNarratorOnboarding('settings', { enabled: false }) // narrator disabled: was mid-nav spam

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast({
      title: 'Settings saved',
      description: 'Your profile has been updated successfully.',
    })
    setIsSaving(false)
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast({
      title: 'Preferences saved',
      description: 'Your notification settings have been updated.',
    })
    setIsSaving(false)
  }

  return (
    <div className="py-6 max-w-4xl mx-auto px-2 sm:px-0 w-full">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeDramatic }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Settings
            className="h-6 w-6 text-[color:var(--color-warroom-gold)]"
            aria-hidden
          />
          <h1
            className="text-xl font-semibold tracking-[0.04em]"
            style={{
              fontFamily: 'var(--font-display)',
              background:
                'linear-gradient(135deg, var(--color-warroom-gold), var(--color-warroom-gold-bright))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            The Preparation Room
          </h1>
        </div>
        <p
          className="text-sm text-[color:var(--color-warroom-smoke)] mb-4"
          style={{ fontFamily: 'var(--font-body, serif)' }}
        >
          Manage your account settings and preferences.
        </p>
        <GoldDivider variant="line" />
      </motion.div>

      {/* ── Tab navigation ── */}
      <motion.div
        className="mb-6"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: easeDramatic }}
      >
        <div className="flex flex-wrap gap-1 p-1 rounded-[4px] bg-[color:var(--color-warroom-rampart)]/60 border border-[color:var(--color-warroom-ash)]/25 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-[0.14em] rounded-[3px] transition-all',
                  activeTab === tab.key
                    ? 'bg-[color:var(--color-warroom-gold)]/[0.12] text-[color:var(--color-warroom-gold)] border border-[color:var(--color-warroom-gold)]/30'
                    : 'text-[color:var(--color-warroom-smoke)] hover:text-[color:var(--color-warroom-ivory)] border border-transparent',
                )}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Icon className="h-3 w-3" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        {/* ═══ Profile ═══ */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeDramatic }}
            className="space-y-6"
          >
            <StoneCard padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <h2
                  className="text-sm font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Profile Information
                </h2>
                <p
                  className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Update your personal information and contact details.
                </p>
              </div>
              <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={session?.user?.name || ''}
                      placeholder="Your name"
                      className={INPUT_CLASSES}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={session?.user?.email || ''}
                      placeholder="your@email.com"
                      className={INPUT_CLASSES}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="organization"
                    className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Organization
                  </Label>
                  <Input
                    id="organization"
                    name="organization"
                    placeholder="Your company or institution"
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="role"
                    className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Role
                  </Label>
                  <Input
                    id="role"
                    name="role"
                    placeholder="e.g., Entrepreneur, Student, Educator"
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="pt-2 border-t border-[color:var(--color-warroom-ash)]/20">
                  <WarRoomCTA type="submit" size="sm" disabled={isSaving}>
                    {isSaving ? 'Forging Changes…' : 'Save Changes'}
                  </WarRoomCTA>
                </div>
              </form>
            </StoneCard>

            {/* Danger zone */}
            <StoneCard accent="var(--color-warroom-crimson)" padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-crimson)]/20">
                <h2
                  className="text-sm font-semibold text-[color:var(--color-warroom-crimson-bright)] tracking-[0.04em] flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone
                </h2>
                <p
                  className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Irreversible actions that affect your account.
                </p>
              </div>
              <div className="px-6 py-5 flex items-center justify-between gap-4">
                <div>
                  <p
                    className="text-sm font-semibold text-[color:var(--color-warroom-ivory)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Delete all simulation data
                  </p>
                  <p
                    className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                    style={{ fontFamily: 'var(--font-body, serif)' }}
                  >
                    This will permanently delete all your simulations and
                    results.
                  </p>
                </div>
                <WarRoomCTA size="sm" variant="ghost">
                  Delete Data
                </WarRoomCTA>
              </div>
            </StoneCard>
          </motion.div>
        )}

        {/* ═══ Notifications ═══ */}
        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeDramatic }}
          >
            <StoneCard padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <h2
                  className="text-sm font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Email Notifications
                </h2>
                <p
                  className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Choose what messages the ravens deliver.
                </p>
              </div>
              <div className="p-6 space-y-0 divide-y divide-[color:var(--color-warroom-ash)]/15">
                {[
                  {
                    id: 'email-simulation',
                    label: 'Simulation Updates',
                    desc: 'Notifications about your ongoing simulations',
                    defaultOn: true,
                  },
                  {
                    id: 'email-results',
                    label: 'Results Available',
                    desc: 'When your simulation results are ready',
                    defaultOn: true,
                  },
                  {
                    id: 'email-tips',
                    label: 'Tips & Insights',
                    desc: 'Weekly tips to improve your entrepreneurial skills',
                    defaultOn: false,
                  },
                  {
                    id: 'email-updates',
                    label: 'Product Updates',
                    desc: 'News about new features and improvements',
                    defaultOn: false,
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-0.5">
                      <Label
                        htmlFor={item.id}
                        className="text-sm text-[color:var(--color-warroom-ivory)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {item.label}
                      </Label>
                      <p
                        className="text-xs text-[color:var(--color-warroom-smoke)]"
                        style={{ fontFamily: 'var(--font-body, serif)' }}
                      >
                        {item.desc}
                      </p>
                    </div>
                    <Switch id={item.id} defaultChecked={item.defaultOn} />
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-[color:var(--color-warroom-ash)]/20">
                <WarRoomCTA
                  size="sm"
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                >
                  {isSaving ? 'Sending Ravens…' : 'Save Preferences'}
                </WarRoomCTA>
              </div>
            </StoneCard>
          </motion.div>
        )}

        {/* ═══ Appearance ═══ */}
        {activeTab === 'appearance' && (
          <motion.div
            key="appearance"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeDramatic }}
          >
            <StoneCard padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <h2
                  className="text-sm font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Theme & Effects
                </h2>
                <p
                  className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Customize the appearance of the War Room.
                </p>
              </div>
              <div className="p-6 space-y-0 divide-y divide-[color:var(--color-warroom-ash)]/15">
                <div className="pb-4">
                  <Label
                    className="text-sm text-[color:var(--color-warroom-ivory)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Color Mode
                  </Label>
                  <p
                    className="text-xs text-[color:var(--color-warroom-smoke)] mt-1 mb-3"
                    style={{ fontFamily: 'var(--font-body, serif)' }}
                  >
                    The War Room is forged in darkness. Theme control is
                    available in the sidebar.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[color:var(--color-warroom-smoke)]">
                    <Palette className="h-3.5 w-3.5 text-[color:var(--color-warroom-gold)]" />
                    <span style={{ fontFamily: 'var(--font-display)' }}>
                      Theme toggle available in sidebar
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="animations"
                      className="text-sm text-[color:var(--color-warroom-ivory)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Animations
                    </Label>
                    <p
                      className="text-xs text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-body, serif)' }}
                    >
                      Enable or disable interface animations
                    </p>
                  </div>
                  <Switch id="animations" defaultChecked />
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="typewriter"
                      className="text-sm text-[color:var(--color-warroom-ivory)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Typewriter Effects
                    </Label>
                    <p
                      className="text-xs text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-body, serif)' }}
                    >
                      Show typewriter animation in Oracle narratives
                    </p>
                  </div>
                  <Switch id="typewriter" defaultChecked />
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="custom-cursor"
                      className="text-sm text-[color:var(--color-warroom-ivory)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Custom Cursor
                    </Label>
                    <p
                      className="text-xs text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-body, serif)' }}
                    >
                      The gold ring + dot cursor. Turn off to use your
                      system cursor instead.
                    </p>
                  </div>
                  <Switch
                    id="custom-cursor"
                    checked={!cursorDisabled}
                    onCheckedChange={(on) => handleToggleCursor(!on)}
                  />
                </div>
              </div>
            </StoneCard>
          </motion.div>
        )}

        {/* ═══ Audio ═══ */}
        {activeTab === 'audio' && (
          <motion.div
            key="audio"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeDramatic }}
            className="space-y-6"
          >
            {/* Master mute */}
            <StoneCard padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <h2
                  className="text-sm font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Hall of Sound
                </h2>
                <p
                  className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Silence the war horns, or let them ring. Settings persist
                  across sessions.
                </p>
              </div>

              <div className="p-6 space-y-0 divide-y divide-[color:var(--color-warroom-ash)]/15">
                {/* Master mute toggle */}
                <div className="flex items-center justify-between pb-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'mt-0.5 flex h-9 w-9 items-center justify-center rounded-sm border',
                        isMuted
                          ? 'border-[color:var(--color-warroom-crimson)]/40 text-[color:var(--color-warroom-crimson-bright)] bg-[color:var(--color-warroom-crimson)]/[0.06]'
                          : 'border-[color:var(--color-warroom-gold)]/40 text-[color:var(--color-warroom-gold)] bg-[color:var(--color-warroom-gold)]/[0.06]',
                      )}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="master-mute"
                        className="text-sm text-[color:var(--color-warroom-ivory)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        Master Audio
                      </Label>
                      <p
                        className="text-xs text-[color:var(--color-warroom-smoke)]"
                        style={{ fontFamily: 'var(--font-body, serif)' }}
                      >
                        {isMuted
                          ? 'Silenced — no ambient or sound effects will play.'
                          : 'Active — ambient bed and effects will play during simulations.'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="master-mute"
                    checked={!isMuted}
                    onCheckedChange={(on) => setMuted(!on)}
                  />
                </div>

                {/* Ambient volume */}
                <div className="py-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        className="text-sm text-[color:var(--color-warroom-ivory)] flex items-center gap-2"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        <Music className="h-3.5 w-3.5 text-[color:var(--color-warroom-gold)]" />
                        Ambient Score
                      </Label>
                      <p
                        className="text-xs text-[color:var(--color-warroom-smoke)]"
                        style={{ fontFamily: 'var(--font-body, serif)' }}
                      >
                        Cello drone, organ pad, and piano motifs that score
                        the war room.
                      </p>
                    </div>
                    <span
                      className="text-xs text-[color:var(--color-warroom-gold)] tabular-nums min-w-[2.5rem] text-right"
                      style={{ fontFamily: 'var(--font-mono, monospace)' }}
                    >
                      {Math.round(ambientVolume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[Math.round(ambientVolume * 100)]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => {
                      if (!unlocked) unlock()
                      setAmbientVolume((v[0] ?? 0) / 100)
                    }}
                    disabled={isMuted}
                    className={cn(isMuted && 'opacity-40')}
                  />
                </div>

                {/* SFX volume */}
                <div className="py-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        className="text-sm text-[color:var(--color-warroom-ivory)] flex items-center gap-2"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        <Swords className="h-3.5 w-3.5 text-[color:var(--color-warroom-gold)]" />
                        Sound Effects
                      </Label>
                      <p
                        className="text-xs text-[color:var(--color-warroom-smoke)]"
                        style={{ fontFamily: 'var(--font-body, serif)' }}
                      >
                        War horns, sword clashes, raven wings, and the gavel
                        of judgement.
                      </p>
                    </div>
                    <span
                      className="text-xs text-[color:var(--color-warroom-gold)] tabular-nums min-w-[2.5rem] text-right"
                      style={{ fontFamily: 'var(--font-mono, monospace)' }}
                    >
                      {Math.round(sfxVolume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[Math.round(sfxVolume * 100)]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => {
                      if (!unlocked) unlock()
                      setSfxVolume((v[0] ?? 0) / 100)
                    }}
                    disabled={isMuted}
                    className={cn(isMuted && 'opacity-40')}
                  />
                </div>

                {/* Voice Lines (investor TTS) — own channel, not bound to Master Audio */}
                <div className="py-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        className="text-sm text-[color:var(--color-warroom-ivory)] flex items-center gap-2"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        <Mic2 className="h-3.5 w-3.5 text-[color:var(--color-warroom-gold)]" />
                        Investor Voice Lines
                      </Label>
                      <p
                        className="text-xs text-[color:var(--color-warroom-smoke)]"
                        style={{ fontFamily: 'var(--font-body, serif)' }}
                      >
                        Spoken questions and verdicts from the council of investors.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="voice-mute"
                        aria-label={isVoiceMuted ? 'Unmute investor voice lines' : 'Mute investor voice lines'}
                        checked={!isVoiceMuted}
                        onCheckedChange={() => toggleVoiceMute()}
                      />
                      <span
                        className="text-xs text-[color:var(--color-warroom-gold)] tabular-nums min-w-[2.5rem] text-right"
                        style={{ fontFamily: 'var(--font-mono, monospace)' }}
                      >
                        {Math.round(voiceVolume * 100)}%
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[Math.round(voiceVolume * 100)]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => setVolume('voice', (v[0] ?? 0) / 100)}
                    disabled={isVoiceMuted}
                    className={cn(isVoiceMuted && 'opacity-40')}
                  />
                </div>

                {/* Current scene */}
                <div className="pt-5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      className="text-sm text-[color:var(--color-warroom-ivory)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Now Playing
                    </Label>
                    <p
                      className="text-xs text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-body, serif)' }}
                    >
                      The ambient track currently scoring the active page.
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-[3px] border',
                      scene
                        ? 'border-[color:var(--color-warroom-gold)]/40 text-[color:var(--color-warroom-gold)] bg-[color:var(--color-warroom-gold)]/[0.06]'
                        : 'border-[color:var(--color-warroom-ash)]/30 text-[color:var(--color-warroom-smoke)]',
                    )}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {scene ? scene.replace(/-/g, ' ') : 'silent'}
                  </span>
                </div>
              </div>
            </StoneCard>

            {/* Ambient scene preview */}
            <StoneCard padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <h2
                  className="text-sm font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Audition the Score
                </h2>
                <p
                  className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Swap between procedural ambient beds. Each layer is a
                  Web Audio composition — cello drone, organ pad, sparse
                  piano motifs in C minor.
                </p>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {AMBIENT_PREVIEWS.map(({ key, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleTestAmbient(key)}
                    disabled={isMuted}
                    className={cn(
                      'flex items-center justify-center px-3 py-2.5',
                      'text-[11px] uppercase tracking-[0.12em] rounded-[3px]',
                      'border transition-all duration-200',
                      'border-[color:var(--color-warroom-gold)]/25',
                      'bg-[color:var(--color-warroom-rampart)]/40',
                      'text-[color:var(--color-warroom-ivory)]',
                      'hover:border-[color:var(--color-warroom-gold)]/55',
                      'hover:bg-[color:var(--color-warroom-gold)]/[0.06]',
                      'hover:text-[color:var(--color-warroom-gold)]',
                      'hover:shadow-[0_0_18px_rgba(179,144,62,0.18)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]/60',
                      'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[color:var(--color-warroom-gold)]/25 disabled:hover:bg-[color:var(--color-warroom-rampart)]/40 disabled:hover:text-[color:var(--color-warroom-ivory)] disabled:hover:shadow-none',
                    )}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </StoneCard>

            {/* SFX previews */}
            <StoneCard padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <h2
                  className="text-sm font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Audition the Forge
                </h2>
                <p
                  className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Test each sound at your chosen volume. Heard nothing? Make
                  sure Master Audio is on.
                </p>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SFX_PREVIEWS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTestSfx(key)}
                    disabled={isMuted}
                    className={cn(
                      'flex items-center justify-center gap-2 px-3 py-2.5',
                      'text-[11px] uppercase tracking-[0.12em] rounded-[3px]',
                      'border transition-all duration-200',
                      'border-[color:var(--color-warroom-gold)]/25',
                      'bg-[color:var(--color-warroom-rampart)]/40',
                      'text-[color:var(--color-warroom-ivory)]',
                      'hover:border-[color:var(--color-warroom-gold)]/55',
                      'hover:bg-[color:var(--color-warroom-gold)]/[0.06]',
                      'hover:text-[color:var(--color-warroom-gold)]',
                      'hover:shadow-[0_0_18px_rgba(179,144,62,0.18)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]/60',
                      'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[color:var(--color-warroom-gold)]/25 disabled:hover:bg-[color:var(--color-warroom-rampart)]/40 disabled:hover:text-[color:var(--color-warroom-ivory)] disabled:hover:shadow-none',
                    )}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </StoneCard>
          </motion.div>
        )}

        {/* ═══ Privacy ═══ */}
        {activeTab === 'privacy' && (
          <motion.div
            key="privacy"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeDramatic }}
          >
            <StoneCard padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <h2
                  className="text-sm font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Data & Privacy
                </h2>
                <p
                  className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Control how your data is used and shared.
                </p>
              </div>
              <div className="p-6 space-y-0 divide-y divide-[color:var(--color-warroom-ash)]/15">
                <div className="flex items-center justify-between pb-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="analytics"
                      className="text-sm text-[color:var(--color-warroom-ivory)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Usage Analytics
                    </Label>
                    <p
                      className="text-xs text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-body, serif)' }}
                    >
                      Help improve War Room by sharing anonymous usage data
                    </p>
                  </div>
                  <Switch id="analytics" defaultChecked />
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="profile-public"
                      className="text-sm text-[color:var(--color-warroom-ivory)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Public Profile
                    </Label>
                    <p
                      className="text-xs text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-body, serif)' }}
                    >
                      Make your profile visible on the Elo Ladder
                    </p>
                  </div>
                  <Switch id="profile-public" />
                </div>

                <div className="pt-4">
                  <Label
                    className="text-sm text-[color:var(--color-warroom-ivory)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Data Export
                  </Label>
                  <p
                    className="text-xs text-[color:var(--color-warroom-smoke)] mt-1 mb-3"
                    style={{ fontFamily: 'var(--font-body, serif)' }}
                  >
                    Download a copy of your simulation data and results.
                  </p>
                  <WarRoomCTA size="sm" variant="ghost" icon={Zap}>
                    Export My Data
                  </WarRoomCTA>
                </div>
              </div>
            </StoneCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
