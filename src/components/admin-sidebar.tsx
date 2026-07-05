'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart3,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { signOutUser } from '@/src/lib/firebase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AdminSidebarProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    {
      title: 'Batches',
      url: '/admin/cohorts',
      icon: LayoutDashboard,
      isActive: pathname.startsWith('/admin/cohorts'),
    },
    {
      title: 'Reports',
      url: '/admin/reports',
      icon: BarChart3,
      isActive: pathname.startsWith('/admin/reports'),
    },
  ]

  const handleSignOut = async () => {
    await signOutUser()
    router.push('/login')
  }

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r-[color:var(--color-warroom-ash)]/20">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin/cohorts">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[color:var(--color-warroom-gold)] text-primary-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span
                    className="truncate font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    The Gambit
                  </span>
                  <span
                    className="truncate text-xs text-[color:var(--color-warroom-smoke)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Admin Panel
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel
            className="text-[color:var(--color-warroom-smoke)] tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Management
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-[color:var(--color-warroom-gold)]/15 text-[color:var(--color-warroom-gold)] text-xs font-bold">
                      {user.name?.substring(0, 2).toUpperCase() || 'AD'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <User className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-[color:var(--color-warroom-gold)]/15 text-[color:var(--color-warroom-gold)] text-xs font-bold">
                        {user.name?.substring(0, 2).toUpperCase() || 'AD'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user.name}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
