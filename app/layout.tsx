import React from "react"
import { MotionConfig } from 'framer-motion'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Cormorant_SC, Cormorant_Garamond, EB_Garamond, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/src/context/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import { NarratorOrb } from '@/src/components/narrator/NarratorOrb'
import { CustomCursor } from '@/src/components/effects/CustomCursor'
import { EmberParticles } from '@/src/components/effects/EmberParticles'
import { AudioSettingsLoader } from '@/src/components/AudioSettingsLoader'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })
const cormorantSC = Cormorant_SC({
  subsets: ['latin'],
  variable: '--font-got',
  weight: ['400', '600', '700'],
  display: 'swap',
})

// Premium font stack — Grandmaster's Study overhaul
const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cinzel-decorative',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-body-serif',
  weight: ['400', '500'],
  display: 'swap',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-data-mono',
  weight: ['400', '500'],
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: 'The Gambit — Play the Long Game',
  description: 'Enter the Grand Board. Face a board of grandmaster investors, defend your vision, and play the long game in the ultimate pressure simulation.',
  keywords: ['entrepreneurship', 'simulation', 'pitch', 'investors', 'chess', 'gambit', 'gamified'],
  generator: 'v0.app'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0d0b09'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${cormorantSC.variable} ${cormorantGaramond.variable} ${ebGaramond.variable} ${jetBrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            {/* reducedMotion="user" â†’ every Framer Motion animation respects the
                OS "reduce motion" setting (transforms/layout become instant,
                opacity/colour preserved). Complements the CSS rules in globals.css. */}
            <MotionConfig reducedMotion="user">
              {/* Headless: syncs audio channel mutes with the backend Settings
                  API (load on login, debounced push on change). Inside
                  AuthProvider so useAuth() resolves. */}
              <AudioSettingsLoader />
              {children}
              <NarratorOrb />
              <CustomCursor />
              <EmberParticles density={30} />
              <Toaster />
            </MotionConfig>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
