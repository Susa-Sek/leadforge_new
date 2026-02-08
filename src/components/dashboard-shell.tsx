'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { usePlan } from '@/hooks/use-plan'
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
import {
  Search,
  Users,
  History,
  FolderOpen,
  LayoutDashboard,
  Contact,
  Kanban,
} from 'lucide-react'
import { UserNav } from '@/components/user-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { CreditProgress } from '@/components/credit-progress'
import { LowCreditWarning, LowCreditBadge } from '@/components/low-credit-warning'
import { ActiveSearchBanner } from '@/components/search/active-search-banner'
import { DashboardSubscriptionBanner } from '@/components/billing/trial-banner'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { NotificationToast } from '@/components/notifications/notification-toast'
import { Settings, Crown, Receipt, Download, Bell } from 'lucide-react'

const navItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Suche', href: '/dashboard/suche', icon: Search },
  { title: 'Kontakte', href: '/dashboard/kontakte', icon: Contact },
  { title: 'Deals', href: '/dashboard/deals', icon: Kanban },
  { title: 'Verlauf', href: '/dashboard/verlauf', icon: History },
  { title: 'Sammlungen', href: '/dashboard/sammlungen', icon: FolderOpen },
  { title: 'Exporte', href: '/dashboard/exporte', icon: Download },
  { title: 'Benachrichtigungen', href: '/dashboard/benachrichtigungen', icon: Users },
]

const settingsItems = [
  { title: 'Abonnement', href: '/dashboard/einstellungen/abonnement', icon: Crown },
  { title: 'Abrechnung', href: '/dashboard/einstellungen/abrechnung', icon: Receipt },
  { title: 'Benachrichtigungen', href: '/dashboard/einstellungen/benachrichtigungen', icon: Bell },
]

type DashboardShellProps = {
  children: React.ReactNode
  user: {
    email: string
    fullName: string | null
    avatarUrl: string | null
  }
  credits: {
    remaining: number
    total: number
    used: number
  }
}

export function DashboardShell({ children, user, credits }: DashboardShellProps) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text">Manyleads</span>
          </Link>
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
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Einstellungen</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 space-y-3">
          {/* Low Credit Warning Badge (nur wenn < 10%) */}
          <LowCreditBadge
            remaining={credits.remaining}
            total={credits.total}
          />
          {/* Credit Progress Komponent */}
          <CreditProgress
            remaining={credits.remaining}
            total={credits.total}
            showIcon={true}
          />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-sm font-medium">
              {navItems.find((item) => item.href === pathname)?.title ?? 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <UserNav user={user} />
          </div>
        </header>
        <main className="flex-1 p-6 space-y-4">
          {/* Subscription Status Banner (Trial, Ending, Canceled) */}
          <DashboardSubscriptionBannerWrapper />
          {/* Low Credit Warning Banner (prominent im Hauptbereich) */}
          <LowCreditWarning
            remaining={credits.remaining}
            total={credits.total}
          />
          {children}
        </main>
        <ActiveSearchBanner />
        <NotificationToast />
      </SidebarInset>
    </SidebarProvider>
  )
}

// Wrapper component for subscription banner that uses the hook
function DashboardSubscriptionBannerWrapper() {
  const router = useRouter()
  const { subscription, isLoading } = usePlan()

  if (isLoading || !subscription) return null

  return (
    <DashboardSubscriptionBanner
      subscription={{
        status: subscription.status,
        plan: subscription.plan,
        trialEnd: subscription.trialEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      }}
      onUpgrade={() => router.push('/upgrade')}
      onReactivate={() => router.push('/dashboard/einstellungen/abonnement')}
    />
  )
}
