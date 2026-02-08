'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Users,
  Coins,
  Megaphone,
  Flag,
  ClipboardList,
  ArrowLeft,
  Shield,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useReportStats } from '@/hooks/use-admin'

const navItems = [
  { title: 'Übersicht', href: '/admin', icon: LayoutDashboard },
  { title: 'Nutzer', href: '/admin/users', icon: Users },
  { title: 'Credits', href: '/admin/credits', icon: Coins },
  { title: 'Ankündigungen', href: '/admin/announcements', icon: Megaphone },
  { title: 'Meldungen', href: '/admin/reports', icon: Flag, showBadge: true },
  { title: 'Audit-Logs', href: '/admin/audit-logs', icon: ClipboardList },
]

type AdminShellProps = {
  children: React.ReactNode
  user: {
    email: string
    fullName: string | null
    avatarUrl: string | null
  }
}

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname()
  const { stats: reportStats } = useReportStats()

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-500" />
              <span className="text-xl font-bold gradient-text">Admin</span>
            </Link>
            <Badge variant="destructive" className="text-xs">ADMIN</Badge>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname?.startsWith(item.href + '/')}
                    >
                      <Link href={item.href} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                        {item.showBadge && reportStats && reportStats.pending > 0 && (
                          <Badge variant="destructive" className="ml-auto text-xs">
                            {reportStats.pending}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Zurück zur App</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard">
                      <ArrowLeft className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-foreground truncate max-w-[120px]">
                  {user.fullName || user.email}
                </span>
                <span className="text-xs">Administrator</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between gap-2 border-b px-4 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-500" />
              <h1 className="text-sm font-medium">
                {navItems.find((item) => pathname === item.href || pathname?.startsWith(item.href + '/'))?.title ?? 'Admin-Bereich'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {user.email}
            </Badge>
          </div>
        </header>
        <main className="flex-1 p-6 space-y-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
