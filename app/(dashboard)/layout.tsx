import React from "react"
// import { getServerSession } from 'next-auth' // Removed
// import { authOptions } from '@/src/lib/auth' // Removed
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/src/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { DynamicBreadcrumb } from '@/src/components/dynamic-breadcrumb'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  // const session = await getServerSession(authOptions) // Removed
  // const user = session?.user

  return (
    <SidebarProvider>
      {/* AppSidebar reads user from localStorage via useEffect when no prop is passed */}
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DynamicBreadcrumb />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-muted/20">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
