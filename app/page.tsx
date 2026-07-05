'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ArrowRight, Sword, Shield, Crown, Flame, Star, Users, Target, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { FadeInUp, StaggerGrid, AnimatedGradientText, Floating, ScaleOnHover } from '@/src/components/AnimatedComponents'
import { NoiseOverlay } from '@/src/components/effects/NoiseOverlay'
import { RouteBackground } from '@/src/components/effects/RouteBackground'
import {
  WarRoomCTA,
  WarRoomCrest,
  GoldDivider,
  SigilBadge,
  StoneCard,
} from '@/src/components/primitives'
import { audioManager } from '@/lib/audio/audioManager'
import { useNarratorOnboarding } from '@/src/hooks/useNarratorOnboarding'


export default function HomePage() {
  const heroTitleRef = useRef<HTMLHeadingElement>(null)

  // Narrator runs first-visit script on mount; returning script otherwise.
  useNarratorOnboarding('landing')

  useEffect(() => {
    // Subtle horn cue on load (quiet); routes via audioManager → falls
    // through to GOTSoundManager synth when the file is missing.
    const t = setTimeout(() => {
      audioManager.playSfx('nav.page-enter', 0.18)
    }, 1200)

    // Queue the ambient hall track. AmbientAudioStore will resume the
    // audio context on the user's first interaction.
    audioManager.setAmbientTrack('ambient.hall')

    return () => clearTimeout(t)
  }, [])

  const houses = [
    { icon: Crown, name: 'Mentors', desc: 'Your seconds — seasoned strategists who sharpen your preparation between rounds', color: '#7c5a9e', sigil: '♗' },
    { icon: Flame, name: 'Investors', desc: 'Exacting players who demand precise calculation — every move must justify itself', color: '#b3903e', sigil: <Flame className="h-40 w-40" /> },
    { icon: Shield, name: 'Leaders', desc: 'Principled players who weigh purpose and the long-term position above all else', color: '#3d6b8e', sigil: <Shield className="h-40 w-40" /> },
  ]

  const panelists = [
    { name: 'The Queen of Coin', avatar: 'MC', house: 'Catalan', color: '#b3903e' },
    { name: 'The Mindset Architect', avatar: 'MA', house: 'Najdorf', color: '#8e3644' },
    { name: 'The Rook of Execution', avatar: 'HE', house: 'Berlin', color: '#42617a' },
    { name: 'The Purpose Translator', avatar: 'PT', house: 'London', color: '#1a1a1a' },
    { name: 'The Blindfold Master', avatar: 'MI', house: 'Réti', color: '#16a34a' },
    { name: 'The Institution Builder', avatar: 'IB', house: 'Sicilian', color: '#c17a3a' },
  ]

  const stages = [
    {
      num: 1, icon: Users, sigil: '♘',
      title: 'Assemble the Board',
      desc: 'Choose 6 advisors: 2 mentors, 2 investors, 2 leaders. Each brings a different agenda.',
      accent: '#77678f', border: 'rgba(119,103,143,0.2)',
    },
    {
      num: 2, icon: MessageSquare, sigil: <Flame className="h-40 w-40" />,
      title: 'Defend Your Position',
      desc: 'Navigate 6 exacting rounds. Answer with the clock running. Every decision shapes your position.',
      accent: '#b3903e', border: 'rgba(179,144,62,0.2)',
    },
    {
      num: 3, icon: Target, sigil: <Crown className="h-40 w-40" />,
      title: 'Earn the Title',
      desc: 'Receive a verdict from each grandmaster. Discover your Founder archetype. Play the long game.',
      accent: '#8e3644', border: 'rgba(142,54,68,0.2)',
    },
  ]

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0806 0%, #110e0a 40%, #0d0b09 100%)' }}>
      <RouteBackground bg="landing" />

      {/* NAV */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed w-full z-50 backdrop-blur-md"
        style={{ borderBottom: '1px solid rgba(179,144,62,0.12)', background: 'rgba(10,8,6,0.85)' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="h-9 w-9 rounded-sm flex items-center justify-center font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg, #8b6914, #b3903e, #8b6914)',
                  color: '#0a0806',
                  boxShadow: '0 0 20px rgba(179,144,62,0.3)',
                  fontFamily: 'var(--font-got), Georgia, serif',
                }}
              >
                KK
              </motion.div>
              <div>
                <span className="font-bold text-base" style={{ fontFamily: 'var(--font-got), Georgia, serif', color: '#b3903e', letterSpacing: '0.08em' }}>
                  The Gambit
                </span>
                <div className="text-[9px] tracking-[0.2em] text-amber-700/60 uppercase -mt-0.5">Play the Long Game</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/terms" className="text-xs text-amber-800/60 hover:text-amber-600 transition-colors" style={{ letterSpacing: '0.06em' }}>
                Terms &amp; Rules
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm" className="text-xs border-amber-900/40 text-amber-700 hover:border-amber-600/50 hover:text-amber-500">
                  Enter
                </Button>
              </Link>
              <Link href="/register">
                <WarRoomCTA size="sm" sfxKey="ui.click">
                  Claim Seat
                </WarRoomCTA>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* HERO */}
      <section className="relative overflow-hidden px-4 pt-40 pb-28 sm:px-6 lg:px-8 min-h-screen flex items-center">
        {/* Fire ambiance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Vignette */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
          {/* Side torches glow */}
          <div className="absolute top-1/3 left-0 w-64 h-64 opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #d98e2b, transparent)' }} />
          <div className="absolute top-1/3 right-0 w-64 h-64 opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #d98e2b, transparent)' }} />
          {/* Gold horizon */}
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(179,144,62,0.4), transparent)' }} />
        </div>

        <div className="mx-auto max-w-4xl text-center relative z-10">
          <FadeInUp delay={0.05}>
            <div className="flex justify-center mb-6">
              <WarRoomCrest size={132} />
            </div>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <SigilBadge icon={Flame} tone="gold" className="mb-8">
              The Ultimate Founder's Match
              <Star className="h-3 w-3 fill-amber-500 text-amber-500 ml-1" />
            </SigilBadge>
          </FadeInUp>

          <FadeInUp delay={0.25}>
            <h1 ref={heroTitleRef} className="mb-6" style={{ fontFamily: 'var(--font-got), Georgia, serif', fontSize: 'clamp(2.4rem, 7vw, 5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '0.03em' }}>
              <span style={{ color: '#e8e0d0', textShadow: '0 0 40px rgba(179,144,62,0.15)' }}>Pitch to the</span>
              <br />
              <span className="gradient-text-animate" style={{ display: 'inline-block', paddingBottom: '0.1em' }}>
                Board of Grandmasters
              </span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.4}>
            <p className="mt-2 text-base max-w-xl mx-auto leading-relaxed" style={{ color: '#8c8075', letterSpacing: '0.02em' }}>
              Face a board of legendary investors, mentors, and visionary leaders.
              Your startup idea is the position. Defend it with everything you have.
            </p>
          </FadeInUp>

          {/* Decorative divider */}
          <FadeInUp delay={0.5}>
            <div className="my-8">
              <GoldDivider variant="sword" width="max-w-xs" />
            </div>
          </FadeInUp>

          <FadeInUp delay={0.55}>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/dashboard">
                <WarRoomCTA
                  size="md"
                  variant="primary"
                  icon={Sword}
                  iconRight={ArrowRight}
                  sfxKey="nav.page-enter"
                >
                  Enter the Gambit
                </WarRoomCTA>
              </Link>
              <WarRoomCTA size="md" variant="ghost" sfxKey="ui.hover">
                Watch a Match
              </WarRoomCTA>
            </div>
            <p className="mt-5 text-xs" style={{ color: 'rgba(140,128,117,0.6)', letterSpacing: '0.06em' }}>
              By entering, you agree to the{' '}
              <Link href="/terms" className="text-amber-700 hover:text-amber-500">Terms &amp; Rules</Link>
            </p>
          </FadeInUp>

          {/* Panelists orbital */}
          <FadeInUp delay={0.75}>
            <div className="mt-14 flex justify-center items-center gap-1 flex-wrap">
              <span className="text-xs mr-3" style={{ color: 'rgba(140,128,117,0.6)', letterSpacing: '0.06em' }}>Face the Board:</span>
              {panelists.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.9 + i * 0.08, type: 'spring', stiffness: 300 }}
                  whileHover={{ scale: 1.3, y: -6, zIndex: 10 }}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs -ml-2 first:ml-0 cursor-pointer border-2"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${p.color}80, ${p.color}30)`,
                    borderColor: `${p.color}60`,
                    color: '#f5e6c8',
                    boxShadow: `0 0 12px ${p.color}40`,
                    fontFamily: 'var(--font-got), Georgia, serif',
                    fontSize: '0.6rem',
                  }}
                  title={`${p.name} — ${p.house} Opening`}
                >
                  {p.avatar}
                </motion.div>
              ))}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7 }}
                className="text-xs ml-3"
                style={{ color: 'rgba(140,128,117,0.5)', letterSpacing: '0.04em' }}
              >
                + 15 Grandmasters
              </motion.span>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 relative" style={{ background: 'linear-gradient(180deg, #0d0b09, #110e0a, #0d0b09)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center top, rgba(179,144,62,0.04), transparent 60%)' }} />
        <div className="mx-auto max-w-6xl relative">
          <FadeInUp>
            <div className="text-center mb-16">
              <SigilBadge tone="gold" className="mb-4">The Match</SigilBadge>
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-got), Georgia, serif', color: '#e8e0d0', letterSpacing: '0.04em' }}>
                Three Moves to the Title
              </h2>
              <p style={{ color: '#8c8075', fontSize: '0.9rem', letterSpacing: '0.03em' }}>
                Not a simulation. A reckoning. Built to break you—and make you stronger.
              </p>
            </div>
          </FadeInUp>

          <StaggerGrid className="grid grid-cols-1 gap-6 md:grid-cols-3" stagger={0.15}>
            {stages.map((stage) => {
              const Icon = stage.icon
              return (
                <ScaleOnHover key={stage.num}>
                  <StoneCard
                    interactive
                    accent={stage.accent}
                    sigilWatermark={stage.sigil}
                    className="group"
                    style={{
                      background:
                        'linear-gradient(160deg, rgba(20,16,12,0.92) 0%, rgba(14,11,9,0.96) 100%)',
                    }}
                  >
                    {/* Stage-number seal — a single bold marker, no
                        competing emoji row below it. */}
                    <div
                      className="mb-5 flex items-center gap-3"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-sm font-bold text-base shrink-0"
                        style={{
                          background: stage.accent,
                          color: '#0a0806',
                          fontFamily: 'var(--font-got), Georgia, serif',
                          boxShadow: `0 0 18px ${stage.accent}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                        }}
                      >
                        {stage.num}
                      </div>
                      <Icon
                        className="h-5 w-5"
                        style={{ color: stage.accent, opacity: 0.85 }}
                        aria-hidden
                      />
                    </div>
                    <h3
                      className="font-semibold text-lg mb-2"
                      style={{
                        fontFamily: 'var(--font-got), Georgia, serif',
                        color: '#f3ead7',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {stage.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: '#c2b6a5' }}
                    >
                      {stage.desc}
                    </p>
                  </StoneCard>
                </ScaleOnHover>
              )
            })}
          </StaggerGrid>
        </div>
      </section>

      {/* HOUSES */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: '#0a0806' }}>
        <NoiseOverlay opacity={0.045} />
        <div className="mx-auto max-w-6xl relative z-10">
          <FadeInUp>
            <div className="text-center mb-16">
              <SigilBadge tone="crimson" className="mb-4">The Board</SigilBadge>
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-got), Georgia, serif', color: '#e8e0d0', letterSpacing: '0.04em' }}>
                The Three Ranks of the Board
              </h2>
              <p style={{ color: '#8c8075', fontSize: '0.9rem' }}>
                Their counsel will conflict. Your judgment decides the game.
              </p>
            </div>
          </FadeInUp>

          <StaggerGrid className="grid grid-cols-1 gap-5 sm:grid-cols-3" stagger={0.1}>
            {houses.map((h) => {
              const Icon = h.icon
              return (
                <StoneCard
                  key={h.name}
                  interactive
                  accent={h.color}
                  sigilWatermark={h.sigil}
                  padding="lg"
                >
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="w-14 h-14 rounded-sm flex items-center justify-center mb-4 text-2xl"
                    style={{ background: `${h.color}15`, border: `1px solid ${h.color}30` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: h.color }} aria-hidden />
                  </motion.div>
                  <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'var(--font-got), Georgia, serif', color: '#e8e0d0', letterSpacing: '0.04em' }}>{h.name}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#8c8075' }}>{h.desc}</p>
                </StoneCard>
              )
            })}
          </StaggerGrid>
        </div>
      </section>

      {/* THE TWIST */}
      <section className="relative px-4 py-24 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(92,26,36,0.08), rgba(179,144,62,0.06), rgba(92,26,36,0.08))' }} />
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <FadeInUp>
            <Floating duration={4} y={6}>
              <div className="mb-4 flex justify-center animate-torch-glow"><Flame className="h-14 w-14" style={{ color: '#d98e2b' }} /></div>
            </Floating>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-got), Georgia, serif' }}>
              <AnimatedGradientText from="#b3903e" via="#d98e2b" to="#5c1a24">
                Conflicting Counsel. One Board.
              </AnimatedGradientText>
            </h2>
          </FadeInUp>
          <FadeInUp delay={0.2}>
            <p className="text-base mb-6" style={{ color: '#8c8075', maxWidth: '36rem', margin: '0 auto 2rem', lineHeight: 1.8 }}>
              The Queen of Coin demands profit above all. The Brand Pioneer preaches culture first.
              The Knight of Hustle drives for ten-times growth. The Acquisition Operator warns of crushing debt.
            </p>
          </FadeInUp>
          <FadeInUp delay={0.3}>
            <p className="text-base font-semibold" style={{ fontFamily: 'var(--font-got), Georgia, serif', letterSpacing: '0.06em' }}>
              <AnimatedGradientText from="#b3903e" via="#d9b45f" to="#b3903e">
                Real founders navigate conflicting counsel every day. Prove you can.
              </AnimatedGradientText>
            </p>
          </FadeInUp>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #110e0a, #1a1208, #110e0a)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(179,144,62,0.06), transparent 60%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(179,144,62,0.3), transparent)' }} />
        </div>
        <div className="mx-auto max-w-3xl text-center relative z-10">
          <FadeInUp>
            <div className="mb-4 flex justify-center"><Crown className="h-11 w-11" style={{ color: '#d9b45f' }} /></div>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-got), Georgia, serif', color: '#e8e0d0', letterSpacing: '0.04em' }}>
              Ready to Face the Board?
            </h2>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <p className="mb-10 text-sm" style={{ color: '#8c8075', letterSpacing: '0.04em' }}>
              Two attempts. Nine rounds. One verdict. The title awaits the worthy.
            </p>
          </FadeInUp>
          <FadeInUp delay={0.2}>
            <Link href="/dashboard">
              <WarRoomCTA
                size="lg"
                variant="primary"
                icon={Sword}
                iconRight={ArrowRight}
                sfxKey="wr.door-creak"
              >
                Enter the Gambit
              </WarRoomCTA>
            </Link>
          </FadeInUp>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-4 py-10 sm:px-6 lg:px-8 text-center" style={{ borderTop: '1px solid rgba(179,144,62,0.1)', background: '#080604' }}>
        <div className="text-3xl mb-3 opacity-30">♚</div>
        <p className="text-xs" style={{ color: 'rgba(140,128,117,0.4)', letterSpacing: '0.08em', fontFamily: 'var(--font-got), Georgia, serif' }}>
          © 2026 The Gambit — All Rights Reserved
        </p>
        <p className="mt-1 text-xs" style={{ color: 'rgba(140,128,117,0.25)', letterSpacing: '0.04em' }}>
          The Clock Is Ticking for Unprepared Founders. Powered by AI.
        </p>
      </footer>
    </div>
  )
}
