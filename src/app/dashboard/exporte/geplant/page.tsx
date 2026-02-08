/**
 * Scheduled Exports Page
 *
 * Enterprise feature for managing automated exports.
 *
 * @route /dashboard/exporte/geplant
 */

import type { Metadata } from 'next';
import { Calendar, ArrowLeft, Plus, Crown } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScheduledExportList } from '@/components/export/scheduled-export-list';
import { UpgradePrompt } from '@/components/search/plan-gate';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Geplante Exporte | Manyleads.io',
  description: 'Automatisierte Exporte planen und verwalten',
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

export default async function ScheduledExportsPage() {
  const plan = await getUserPlan();
  const isEnterprise = plan === 'enterprise';

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
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              Geplante Exporte
              <Badge variant="secondary" className="ml-2">
                <Crown className="h-3 w-3 mr-1" />
                Enterprise
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              Richte automatische Exporte zu festgelegten Zeiten ein
            </p>
          </div>
        </div>
        {isEnterprise && (
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Neuer geplanter Export
          </Button>
        )}
      </div>

      {/* Content */}
      {isEnterprise ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Deine geplanten Exporte
            </CardTitle>
            <CardDescription>
              Geplante Exporte werden automatisch zu den festgelegten Zeiten
              ausgeführt und per E-Mail versendet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduledExportList />
          </CardContent>
        </Card>
      ) : (
        <UpgradePrompt
          requiredPlan="enterprise"
          featureName="Geplante Exporte"
          description="Richte automatische Exporte ein, die täglich, wöchentlich oder monatlich ausgeführt werden und dir per E-Mail zugesendet werden."
        />
      )}
    </div>
  );
}
