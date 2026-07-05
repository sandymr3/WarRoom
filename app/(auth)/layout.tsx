import React from 'react'

/**
 * Auth layout — shared dark GOT background for /login and /register.
 *
 * Provides the void-dark canvas with a subtle gold atmospheric glow.
 * Child pages render inside a vertically centred flex container.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[color:var(--color-warroom-void)] text-[color:var(--color-warroom-ivory)] relative overflow-hidden">
      {/* Atmospheric radial glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 50% 25%, rgba(179,144,62,0.05) 0%, transparent 70%)',
        }}
      />

      {/* Centred content slot */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  )
}
