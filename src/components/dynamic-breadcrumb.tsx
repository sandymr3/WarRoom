'use client'

import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/results': 'Results',
  '/settings': 'Settings',
  '/support': 'Support',
  '/assessment/start': 'Start Simulation',
}

function labelFor(pathname: string): string {
  if (LABELS[pathname]) return LABELS[pathname]
  if (pathname.startsWith('/results')) return 'Results'
  if (pathname.startsWith('/settings')) return 'Settings'
  if (pathname.startsWith('/assessment')) return 'Simulation'
  const segment = pathname.split('/').filter(Boolean).pop() || ''
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const current = labelFor(pathname)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/dashboard">War Room</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
