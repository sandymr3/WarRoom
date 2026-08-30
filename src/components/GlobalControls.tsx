'use client'

import { MuteToggle } from '@/src/components/chessboard/MuteToggle'

/**
 * Persistent audio-mute control, rendered once in the root layout
 * so they're reachable from every route (landing, auth, dashboard, admin,
 * and the War Room simulation itself) instead of being wired page-by-page.
 *
 * Docked to the top-right corner — small enough to sit clear of running
 * body copy (verified against the terms page at mobile widths, where a
 * mid-edge dock overlapped paragraph text). The two routes with their own
 * right-aligned header content (chessboard header, landing nav) reserve
 * extra padding for it — see `.chessboard-header` in globals.css and the
 * landing header's `pr-16` wrapper.
 */
export function GlobalControls() {
  return (
    <div
      className="fixed right-3 top-3 z-[70] flex items-center gap-1 rounded-sm border border-[color:var(--color-chessboard-ember)]/25 bg-transparent p-1 backdrop-blur-md shadow-[0_2px_16px_rgba(0,0,0,0.25)]"
    >
      <MuteToggle className="h-8 w-8 border-0 bg-transparent shadow-none hover:shadow-none" />
    </div>
  )
}
