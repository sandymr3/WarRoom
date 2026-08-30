'use client'

import { cn } from '@/lib/utils'

const sparks = Array.from({ length: 26 }, (_, index) => ({
  left: `${5 + ((index * 47) % 90)}%`,
  bottom: `${2 + ((index * 19) % 24)}%`,
  delay: `${(index % 7) * 0.35}s`,
  duration: `${2.4 + (index % 5) * 0.45}s`,
  size: `${3 + (index % 3)}px`,
}))

export function WarRoomAtmosphere({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,10,5,0.16),rgba(20,10,5,0.5))]" />
      <div className="warroom-fire-glow absolute inset-x-1/2 bottom-[-10%] h-2/3 w-[42rem] -translate-x-1/2 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-1/2 w-1/3 origin-bottom -skew-x-6 bg-gradient-to-t from-orange-500/20 to-transparent blur-2xl motion-safe:animate-[warroom-flicker_2.6s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 right-0 h-1/2 w-1/3 origin-bottom skew-x-6 bg-gradient-to-t from-orange-500/20 to-transparent blur-2xl motion-safe:animate-[warroom-flicker_3.1s_ease-in-out_infinite_0.4s]" />
      {sparks.map((spark, index) => (
        <span
          key={index}
          className="warroom-spark absolute rounded-full bg-orange-500 shadow-[0_0_12px_4px_rgba(234,88,12,0.9)]"
          style={{ left: spark.left, bottom: spark.bottom, width: spark.size, height: spark.size, animationDelay: spark.delay, animationDuration: spark.duration }}
        />
      ))}
      <img
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-aTbWSr33r3mT0KFMXrYJa9PfHEalfR.png"
        alt=""
        className="warroom-cloth-flag absolute left-0 top-[4%] z-[1] h-[58%] w-[30%] origin-top-left object-cover object-left-top opacity-70 mix-blend-multiply motion-safe:animate-[warroom-flag_5s_ease-in-out_infinite]"
      />
      <div className="absolute bottom-0 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-orange-600/20 blur-3xl motion-safe:animate-[warroom-flicker_2.2s_ease-in-out_infinite]" />
    </div>
  )
}
