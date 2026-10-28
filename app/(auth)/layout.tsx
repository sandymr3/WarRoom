import React from 'react'
import { WarRoomAtmosphere } from '@/src/components/effects/WarRoomAtmosphere'

/**
 * Auth layout — focused spotlight entry for /login and /register.
 * Clean charcoal canvas with a subtle gold atmospheric glow.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="wr-on-dark relative min-h-screen overflow-hidden text-[color:var(--color-chessboard-ivory)]">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[color:var(--color-chessboard-charcoal)]">
        <video
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Stone_chess_battlefield_flags_fl%E2%80%A6_202608302334%20%281%29-SRNFBsWTA12ERjKdVbMCx9852yO3fh.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-[rgba(18,8,5,0.64)]" />
      </div>
      <WarRoomAtmosphere className="fixed z-[1]" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  )
}
