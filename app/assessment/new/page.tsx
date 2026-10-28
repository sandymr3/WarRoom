'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StartSimulationView } from '@/src/components/StartSimulationView'

/**
 * /assessment/new — full-screen "Enter Your Business Idea" flow.
 *
 * Opened from the dashboard's start buttons. Creating a simulation moves on
 * to /assessment/[id]; backing out returns to the dashboard.
 */
export default function NewSimulationPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('user')) {
      router.push('/login')
      return
    }
    setReady(true)
  }, [router])

  const handleClose = useCallback(() => router.push('/dashboard'), [router])
  const handleCreated = useCallback(
    (assessmentId: string) => router.push(`/assessment/${assessmentId}`),
    [router],
  )

  if (!ready) return null

  return <StartSimulationView onClose={handleClose} onCreated={handleCreated} />
}