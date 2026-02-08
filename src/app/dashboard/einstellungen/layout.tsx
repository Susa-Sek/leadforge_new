// Settings Layout - Epic E13
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  User,
  Bell,
  Shield,
  Globe,
  CreditCard,
  FileText,
} from 'lucide-react';

const settingsNavItems = [
  {
    title: 'Profil',
    href: '/dashboard/einstellungen/profil',
    icon: User,
  },
  {
    title: 'Benachrichtigungen',
    href: '/dashboard/einstellungen/benachrichtigungen',
    icon: Bell,
  },
  {
    title: 'Sicherheit',
    href: '/dashboard/einstellungen/sicherheit',
    icon: Shield,
  },
  {
    title: 'Konto',
    href: '/dashboard/einstellungen/konto',
    icon: Globe,
  },
  {
    title: 'Abonnement',
    href: '/dashboard/einstellungen/abonnement',
    icon: CreditCard,
  },
  {
    title: 'Abrechnung',
    href: '/dashboard/einstellungen/abrechnung',
    icon: FileText,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-[calc(100vh-4rem)] w-full">
        {/* Settings Sidebar */}
        <Sidebar className="w-64 border-r">
          <SidebarHeader className="p-4">
            <h2 className="text-lg font-semibold">Einstellungen</h2>
            <p className="text-sm text-muted-foreground">
              Verwalten Sie Ihre Kontoeinstellungen
            </p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
