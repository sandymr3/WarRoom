import React from "react"
import { MotionConfig } from 'framer-motion'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/src/context/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import { NarratorOrb } from '@/src/components/narrator/NarratorOrb'
import { GlobalControls } from '@/src/components/GlobalControls'
import dynamic from 'next/dynamic'
const CustomCursor = dynamic(() => import('@/src/components/effects/CustomCursor').then(mod => mod.CustomCursor))
const EmberParticles = dynamic(() => import('@/src/components/effects/EmberParticles').then(mod => mod.EmberParticles))
const AudioSettingsLoader = dynamic(() => import('@/src/components/AudioSettingsLoader').then(mod => mod.AudioSettingsLoader))
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800', '900'],
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
  title: "KK's WarRoom — Prove Your Edge",
  description: 'An AI-Powered Entrepreneurship Experience Platform. Face expert evaluators, defend your strategy, and forge your entrepreneurial path in the ultimate pressure simulation.',
  keywords: ['entrepreneurship', 'simulation', 'pitch', 'experience platform', 'war room', 'gamified'],
  generator: 'v0.app'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f8f7f3'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${jetBrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <MotionConfig reducedMotion="user">
              <AudioSettingsLoader />
              <GlobalControls />
              {children}
              <NarratorOrb />
              <CustomCursor />
              <EmberParticles density={20} />
              <Toaster />
            </MotionConfig>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
