/**
 * Export History Page
 *
 * Displays export history with download and management options.
 *
 * @route /dashboard/exporte
 */

import type { Metadata } from 'next';
import { Download, History, Settings, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { ExportHistoryTable } from '@/components/export/export-history-table';
import { TemplateManager } from '@/components/export/template-manager';
import { ScheduledExportList } from '@/components/export/scheduled-export-list';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Export-Verlauf | Manyleads.io',
  description: 'Verwalte deine Exporte und Templates',
};

async function getUserPlan() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 'free';

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  return subscription?.plan_id || 'free';
}

export default async function ExportsPage() {
  const plan = await getUserPlan();
  const canExport = plan !== 'free';
  const isEnterprise = plan === 'enterprise';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Export-Verlauf</h1>
          <p className="text-muted-foreground">
            Verwalte deine Exporte, Templates und geplanten Exporte
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={canExport ? 'default' : 'secondary'}>
            {plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Enterprise'}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="history" className="space-y-6">
        <TabsList>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Export-Verlauf
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          {isEnterprise && (
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Geplant
            </TabsTrigger>
          )}
        </TabsList>

        {/* Export History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Deine Exporte
              </CardTitle>
              <CardDescription>
                Hier siehst du alle deine vergangenen Exporte. Du kannst
                abgeschlossene Exporte herunterladen oder alte Exporte löschen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canExport ? (
                <ExportHistoryTable />
              ) : (
                <div className="rounded-md bg-muted p-8 text-center">
                  <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium">Export-Funktion nicht verfügbar</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Upgrade auf Pro oder Enterprise, um Daten zu exportieren.
                  </p>
                  <Link href="/dashboard/einstellungen/abonnement">
                    <Button>Jetzt upgraden</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Export-Templates
              </CardTitle>
              <CardDescription>
                Speichere häufig verwendete Export-Einstellungen als Template,
                um Zeit zu sparen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canExport ? (
                <TemplateManager planTier={plan} />
              ) : (
                <div className="rounded-md bg-muted p-8 text-center">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium">Templates nicht verfügbar</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Upgrade auf Pro oder Enterprise, um Templates zu nutzen.
                  </p>
                  <Link href="/dashboard/einstellungen/abonnement">
                    <Button>Jetzt upgraden</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Exports Tab (Enterprise only) */}
        {isEnterprise && (
          <TabsContent value="scheduled" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Geplante Exporte
                    </CardTitle>
                    <CardDescription>
                      Richte automatische Exporte ein, die zu festgelegten
                      Zeiten ausgeführt werden.
                    </CardDescription>
                  </div>
                  <Link href="/dashboard/exporte/geplant/neu">
                    <Button>Neuer geplanter Export</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <ScheduledExportList />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

