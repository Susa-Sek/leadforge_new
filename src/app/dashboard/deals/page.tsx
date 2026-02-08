import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Kanban, List } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { DealPipeline } from '@/components/crm/deal-pipeline';
import { DealList } from '@/components/crm/deal-list';
import { DealExportWrapper } from '@/components/export/deal-export-wrapper';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Deals & Pipeline | Manyleads.io',
  description: 'Verwalte deine Verkaufschancen und Pipeline',
};

async function getUserPlan() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'free';

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  return subscription?.plan_id || 'free';
}

async function getDealCount() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return count || 0;
}

export default async function DealsPage() {
  const plan = await getUserPlan();
  const dealCount = await getDealCount();
  const isPro = plan === 'pro' || plan === 'enterprise';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals & Pipeline</h1>
          <p className="text-muted-foreground">
            Verwalte deine Verkaufschancen durch den Vertriebsprozess
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DealExportWrapper planTier={plan} totalCount={dealCount} />
          <Link href="/dashboard/deals/neu">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Deal
            </Button>
          </Link>
        </div>
      </div>

      {isPro ? (
        <Tabs defaultValue="kanban" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <Kanban className="h-4 w-4" />
                Pipeline (Kanban)
                <Badge variant="secondary" className="ml-1">Pro</Badge>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Listenansicht
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="kanban" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Pipeline</CardTitle>
                <CardDescription>
                  Verschiebe Deals per Drag-and-Drop zwischen den Stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DealPipeline dragEnabled={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Alle Deals</CardTitle>
                <CardDescription>
                  Übersicht aller Deals in Listenansicht
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DealList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Meine Deals</CardTitle>
                <CardDescription>
                  Verwalte deine Verkaufschancen
                </CardDescription>
              </div>
              <Link href="/dashboard/einstellungen/abonnement">
                <Button variant="outline" size="sm">
                  <Kanban className="mr-2 h-4 w-4" />
                  Kanban mit Pro freischalten
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <DealList />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
