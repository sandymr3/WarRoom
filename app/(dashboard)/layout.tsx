import React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/src/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { RouteBackground } from '@/src/components/effects/RouteBackground'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <RouteBackground bg="dashboard" />
      <AppSidebar user={undefined} />
      <SidebarInset>
        <header
          className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-[color:var(--color-warroom-gold)]/10 bg-[color:var(--color-warroom-rampart)]/40 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 text-[color:var(--color-warroom-smoke)] hover:text-[color:var(--color-warroom-gold)]" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-[color:var(--color-warroom-gold)]/15" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink
                    href="/dashboard"
                    className="text-[color:var(--color-warroom-smoke)] hover:text-[color:var(--color-warroom-gold)] transition-colors"
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: '0.8rem' }}
                  >
                    The Gambit
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block text-[color:var(--color-warroom-gold)]/30" />
                <BreadcrumbItem>
                  <BreadcrumbPage
                    className="text-[color:var(--color-warroom-ivory)]/80"
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: '0.8rem' }}
                  >
                    Dashboard
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-[color:var(--color-warroom-void)]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
