import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Users, Tag, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ContactList } from '@/components/crm/contact-list';
import { TagManager } from '@/components/crm/tag-manager';
import { ContactExportWrapper } from '@/components/export/contact-export-wrapper';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Kontakte | Manyleads.io',
  description: 'Verwalte deine Kontakte und Leads',
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

async function getContactCount() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return count || 0;
}

export default async function ContactsPage() {
  const plan = await getUserPlan();
  const contactCount = await getContactCount();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kontakte</h1>
          <p className="text-muted-foreground">
            Verwalte deine Kontakte, Tags und Interaktionen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ContactExportWrapper planTier={plan} totalCount={contactCount} />
          <Link href="/dashboard/kontakte/neu">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Kontakt
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="contacts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Kontakt-Liste
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags verwalten
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alle Kontakte</CardTitle>
              <CardDescription>
                Hier siehst du alle deine Kontakte. Klicke auf einen Kontakt, um Details zu sehen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Tags verwalten</CardTitle>
              <CardDescription>
                Erstelle und verwalte Tags, um deine Kontakte zu kategorisieren.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-w-md">
              <TagManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
