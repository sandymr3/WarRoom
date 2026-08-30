import React from 'react'

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
    <div className="relative min-h-screen overflow-hidden text-[color:var(--color-chessboard-ivory)]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18, 8, 5, 0.52), rgba(18, 8, 5, 0.52)), url("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Stone_rook_pieces_clashing_2K_202608302003-jDYCH3REiJWx8JS7zCeNjd9CY9alne.jpeg")',
        }}
      />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  )
}
