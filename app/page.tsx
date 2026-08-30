import Link from 'next/link'
import { ChessboardCTA } from '@/src/components/primitives'
import { WarRoomAtmosphere } from '@/src/components/effects/WarRoomAtmosphere'

const warRoomImage = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-UULwZgfkkIdC07jMg1axIfFzCUxBZG.png'

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#170b06] px-6">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${warRoomImage})` }}
      />
      <WarRoomAtmosphere />
      <div aria-hidden className="absolute inset-0 bg-[#120805]/55" />
      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.35em] text-orange-200/80">
          Enter the War Room
        </p>
        <Link href="/register" aria-label="Get started with KK's WarRoom">
          <ChessboardCTA size="lg" sfxKey="ui.click">
            Get Started
          </ChessboardCTA>
        </Link>
      </div>
    </main>
  )
}
