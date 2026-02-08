import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DealForm } from '@/components/crm/deal-form';
import { createClient } from '@/lib/supabase/server';

interface EditDealPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getDeal(id: string) {
  const supabase = await createClient();

  const { data: deal, error } = await supabase
    .from('deals')
    .select(`
      *,
      stage:deal_stages(*),
      contact:contacts(*)
    `)
    .eq('id', id)
    .single();

  if (error || !deal) return null;

  return deal;
}

export async function generateMetadata({ params }: EditDealPageProps): Promise<Metadata> {
  const { id } = await params;
  const deal = await getDeal(id);

  return {
    title: deal ? `${deal.title} bearbeiten | Manyleads.io` : 'Deal nicht gefunden',
  };
}

export default async function EditDealPage({ params }: EditDealPageProps) {
  const { id } = await params;
  const deal = await getDeal(id);

  if (!deal) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/deals/${id}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deal bearbeiten</h1>
          <p className="text-muted-foreground">
            Bearbeite die Informationen von &quot;{deal.title}&quot;
          </p>
        </div>
      </div>

      <DealForm deal={deal} mode="edit" />
    </div>
  );
}
