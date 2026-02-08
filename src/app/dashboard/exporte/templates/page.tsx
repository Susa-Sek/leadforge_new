/**
 * Export Templates Page
 *
 * Dedicated page for managing export templates.
 *
 * @route /dashboard/exporte/templates
 */

import type { Metadata } from 'next';
import { FileText, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TemplateManager } from '@/components/export/template-manager';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Export-Templates | Manyleads.io',
  description: 'Verwalte deine Export-Templates',
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

export default async function TemplatesPage() {
  const plan = await getUserPlan();
  const canExport = plan !== 'free';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/exporte">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Export-Templates</h1>
            <p className="text-muted-foreground">
              Verwalte deine gespeicherten Export-Einstellungen
            </p>
          </div>
        </div>
        {canExport && (
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Neues Template
          </Button>
        )}
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Deine Templates
          </CardTitle>
          <CardDescription>
            Templates ermöglichen es dir, häufig verwendete
            Export-Einstellungen zu speichern und wiederzuverwenden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canExport ? (
            <TemplateManager planTier={plan} />
          ) : (
            <div className="rounded-md bg-muted p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
    </div>
  );
}
