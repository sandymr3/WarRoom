'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Castle,
  Swords,
  ScrollText,
  Trophy,
  Crown,
  LogOut,
  User,
  HelpCircle,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signOutUser } from '@/src/lib/firebase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WarRoomCrest } from '@/src/components/primitives'

interface AppSidebarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function AppSidebar({ user: userProp }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Read user from localStorage if not passed as prop
  const [user, setUser] = React.useState(userProp || null)
  React.useEffect(() => {
    if (!userProp) {
      try {
        const stored = localStorage.getItem('user')
        if (stored) setUser(JSON.parse(stored))
      } catch {}
    }
  }, [userProp])

  // Chess-themed navigation labels (Grandmaster's Study).
  const navMain = [
    {
      title: 'The Study',
      url: '/dashboard',
      icon: Castle,
      isActive: pathname === '/dashboard',
    },
    {
      title: 'The Match',
      url: '/assessment/start',
      icon: Swords,
      isActive: pathname.startsWith('/assessment'),
    },
    {
      title: 'Annotated Games',
      url: '/results',
      icon: ScrollText,
      isActive: pathname.startsWith('/results'),
    },
    {
      title: 'The Elo Ladder',
      url: '/leaderboard',
      icon: Trophy,
      isActive: pathname.startsWith('/leaderboard'),
    },
  ]

  const navSecondary = [
    {
      title: 'The Analysis Room',
      url: '/support',
      icon: HelpCircle,
    },
    {
      title: 'The Preparation Room',
      url: '/settings',
      icon: Crown,
    },
  ]

  const handleSignOut = async () => {
    await signOutUser()
    router.push('/login')
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-9 items-center justify-center rounded-sm">
                  <WarRoomCrest size={32} staticRender />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span
                    className="truncate font-semibold tracking-[0.08em] text-[color:var(--color-warroom-gold)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    The Gambit
                  </span>
                  <span
                    className="truncate text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-warroom-smoke)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Play the Long Game
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
            className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-warroom-smoke)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            The Board
          </SidebarGroupLabel>
          <SidebarMenu>
            {navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={item.isActive}
                  tooltip={item.title}
                  className={
                    item.isActive
                      ? 'border-l-2 border-[color:var(--color-warroom-gold)] text-[color:var(--color-warroom-gold-bright)] data-[active=true]:bg-[color:var(--color-warroom-gold)]/[0.08] data-[active=true]:text-[color:var(--color-warroom-gold-bright)]'
                      : 'hover:text-[color:var(--color-warroom-gold)]'
                  }
                >
                  <Link href={item.url} style={{ fontFamily: 'var(--font-display)' }}>
                    <item.icon className={item.isActive ? 'text-[color:var(--color-warroom-gold-bright)]' : ''} />
                    <span className="tracking-[0.06em]">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    className="hover:text-[color:var(--color-warroom-gold)]"
                  >
                    <Link href={item.url} style={{ fontFamily: 'var(--font-display)' }}>
                      <item.icon />
                      <span className="tracking-[0.06em]">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
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
                    <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                    <AvatarFallback className="rounded-lg">
                      {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || 'User'}</span>
                    <span className="truncate text-xs">{user?.email || 'user@example.com'}</span>
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
                      <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                      <AvatarFallback className="rounded-lg">
                        {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.name || 'User'}</span>
                      <span className="truncate text-xs">{user?.email || 'user@example.com'}</span>
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
